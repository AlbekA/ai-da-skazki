import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { StoryForm, StoryFormData } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { Loader } from './components/Loader';
import { generateAudio } from './services/geminiService';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SparklesIcon } from './components/icons/SparklesIcon';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY environment variable is not set");

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- TYPES ---
interface StoryPart {
  text: string;
  audioData: string | null;
}
interface SavedStory {
    id: string;
    title: string;
    parts: StoryPart[];
    formData: StoryFormData;
    isInteractive: boolean;
}
type UserStatus = 'guest' | 'registered' | 'subscribed' | 'owner';
type SubscriptionTier = 'tier1' | 'tier2';
interface User { 
    status: UserStatus;
    tier?: SubscriptionTier;
}
interface Usage {
    guestSimpleCreations: number;
    registeredSimpleCreations: number;
    dailyCreations: { date: string; count: number };
}
type View = 'creator' | 'profile' | 'viewer';

// --- CONSTANTS ---
const GUEST_SIMPLE_LIMIT = 3;
const REGISTERED_SIMPLE_LIMIT = 3;
const DAILY_LIMITS: Record<SubscriptionTier, number> = {
    tier1: 3,
    tier2: 7,
};
const LOCAL_STORAGE_KEY = 'aiFairyTalesUserData';

const App: React.FC = () => {
    // --- STATE ---
    const [user, setUser] = useState<User>({ status: 'guest' });
    const [usage, setUsage] = useState<Usage>({ guestSimpleCreations: 0, registeredSimpleCreations: 0, dailyCreations: { date: '', count: 0 }});
    const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
    
    const [currentStory, setCurrentStory] = useState<SavedStory | null>(null);
    const [currentChoices, setCurrentChoices] = useState<string[]>([]);
    
    const [view, setView] = useState<View>('creator');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingNextPart, setIsLoadingNextPart] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const voiceIdRef = useRef<string>('Kore');
    
    // --- LOCAL STORAGE & ROUTING ---
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                const { user, usage, savedStories } = JSON.parse(savedData);
                if (user) setUser(user);
                if (usage) setUsage(usage);
                if (savedStories) setSavedStories(savedStories);
            }
        } catch (e) {
            console.error("Failed to parse data from localStorage", e);
        }

        const path = window.location.pathname;
        if (path.startsWith('/story/')) {
            const storyId = path.split('/')[2];
            const stories = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}').savedStories || [];
            const story = stories.find((s: SavedStory) => s.id === storyId);
            if (story) {
                setCurrentStory(story);
                setView('viewer');
            } else {
                 window.history.replaceState({}, '', '/');
            }
        }
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('owner') === 'true') {
            setUser({ status: 'owner' });
        }

    }, []);

    useEffect(() => {
        // Create a version of savedStories without the large audio data for storage.
        const storiesToStore = savedStories.map(story => ({
            ...story,
            parts: story.parts.map(part => ({
                text: part.text,
                audioData: null, // Omit audio data to prevent storage quota errors
            })),
        }));

        try {
            const dataToSave = JSON.stringify({ user, usage, savedStories: storiesToStore });
            localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
        } catch (error) {
            console.error("Failed to save data to localStorage:", error);
        }
    }, [user, usage, savedStories]);
    
    // --- PROMPT & RESPONSE LOGIC ---
    const getPrompt = (formData: StoryFormData, type: 'initial' | 'simple' | { choice: string }): string => {
        const { name, character, location } = formData;
    
        if (type === 'simple') {
            return `Напиши короткую, добрую и увлекательную сказку для ребенка по имени ${name}. Главный герой сказки, помимо ${name}, должен быть ${character}. Действие сказки происходит в ${location}. Сказка должна быть позитивной, иметь счастливый конец и подходить для маленьких детей (возраст 3-6 лет). Объем сказки - примерно 200-300 слов.`;
        }

        if (type === 'initial') {
            return `Ты — рассказчик интерактивных сказок для детей 3-6 лет. Твоя задача — создать увлекательную историю, которая ветвится в зависимости от выбора ребенка.
            Начни сказку для ребенка по имени ${name}, где главный герой — ${character}, а место действия — ${location}.
            Напиши первую часть истории (3-5 предложений) и закончи ее вопросом, предлагая ребенку 2-3 варианта выбора для дальнейшего действия.
            Твой ответ ДОЛЖЕН БЫТЬ в формате JSON со следующей структурой: {"story": "текст первой части истории...", "choices": ["вариант 1", "вариант 2"], "isFinal": false}.
            Не добавляй никакого текста до или после JSON.`;
        }

        if (typeof type === 'object' && 'choice' in type) {
            return `Ребенок выбрал: "${type.choice}".
            Продолжи историю, основываясь на этом выборе. Напиши следующую часть (3-5 предложений).
            В конце снова предложи 2-3 выбора ИЛИ, если история логически завершена, напиши финал (2-3 предложения) и не предлагай выборов.
            Твой ответ ДОЛЖЕН БЫТЬ в формате JSON.
            Если история продолжается: {"story": "текст...", "choices": ["выбор 1", "выбор 2"], "isFinal": false}.
            Если история закончилась: {"story": "финальный текст...", "choices": [], "isFinal": true}.
            Не добавляй никакого текста до или после JSON.`;
        }
        return '';
    };

    const processResponse = async (response: GenerateContentResponse): Promise<{ story: string; choices: string[]; isFinal: boolean } | string> => {
        const text = response.text.trim();
        try {
            const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedJson);
            if (parsed.story && Array.isArray(parsed.choices)) {
                return parsed;
            }
        } catch (e) {
            // It's not a JSON response, return plain text
        }
        return text;
    };

    // --- CORE HANDLERS ---
    const handleCreateStory = useCallback(async (formData: StoryFormData) => {
        const today = new Date().toISOString().split('T')[0];
        
        // --- Limit Checks for non-owners ---
        if (user.status !== 'owner') {
            if (formData.isInteractive && user.status !== 'subscribed') {
                setShowSubscriptionModal(true);
                return;
            }
            if (!formData.isInteractive) {
                if (user.status === 'guest' && usage.guestSimpleCreations >= GUEST_SIMPLE_LIMIT) {
                    setShowAuthModal(true);
                    return;
                }
                if (user.status === 'registered' && usage.registeredSimpleCreations >= REGISTERED_SIMPLE_LIMIT) {
                    setShowSubscriptionModal(true);
                    return;
                }
            }
            if (user.status === 'subscribed' && user.tier) {
                const dailyLimit = DAILY_LIMITS[user.tier];
                const dailyCount = (usage.dailyCreations.date === today) ? usage.dailyCreations.count : 0;
                if (dailyCount >= dailyLimit) {
                    setError(`Вы достигли дневного лимита в ${dailyLimit} сказки.`);
                    return;
                }
            }
        }
        
        setIsLoading(true);
        setError(null);
        setCurrentStory(null);
        setCurrentChoices([]);
        chatRef.current = null;
        voiceIdRef.current = formData.voiceId;

        try {
            let newStory: SavedStory;
            if (formData.isInteractive) {
                chatRef.current = ai.chats.create({ model: 'gemini-2.5-pro' });
                const response = await chatRef.current.sendMessage({ message: getPrompt(formData, 'initial') });
                const result = await processResponse(response);
                if (typeof result !== 'object' || !('story' in result)) throw new Error("Failed to start story.");
                
                const audioData = await generateAudio(result.story, voiceIdRef.current);
                newStory = { id: crypto.randomUUID(), title: `Сказка для ${formData.name}`, parts: [{ text: result.story, audioData }], formData, isInteractive: true };
                setCurrentChoices(result.choices);
            } else {
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: getPrompt(formData, 'simple') });
                const storyText = response.text;
                const audioData = await generateAudio(storyText, voiceIdRef.current);
                newStory = { id: crypto.randomUUID(), title: `Сказка для ${formData.name}`, parts: [{ text: storyText, audioData }], formData, isInteractive: false };
            }
            setCurrentStory(newStory);
            setSavedStories(prev => [newStory, ...prev]);

            // --- Update usage stats ---
            if (user.status === 'guest' && !formData.isInteractive) {
                setUsage(prev => ({...prev, guestSimpleCreations: prev.guestSimpleCreations + 1}));
            } else if (user.status === 'registered' && !formData.isInteractive) {
                setUsage(prev => ({...prev, registeredSimpleCreations: prev.registeredSimpleCreations + 1}));
            } else if (user.status === 'subscribed') {
                const newCount = (usage.dailyCreations.date === today) ? usage.dailyCreations.count + 1 : 1;
                setUsage(prev => ({...prev, dailyCreations: { date: today, count: newCount }}));
            }

        } catch (err) {
            console.error(err);
            setError('Не удалось создать сказку. Пожалуйста, попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    }, [user, usage]);
  
    const handleChoice = useCallback(async (choice: string) => {
        if (!chatRef.current || !currentStory) return;
        
        setIsLoadingNextPart(true);
        setCurrentChoices([]);
        setError(null);

        try {
            const response = await chatRef.current.sendMessage({ message: getPrompt(currentStory.formData, { choice }) });
            const result = await processResponse(response);
            if (typeof result !== 'object' || !('story' in result)) throw new Error("Invalid continuation.");

            const audioData = await generateAudio(result.story, voiceIdRef.current);
            const newPart = { text: result.story, audioData };
            const updatedStory = { ...currentStory, parts: [...currentStory.parts, newPart]};

            setCurrentStory(updatedStory);
            setAutoplayIndex(updatedStory.parts.length - 1); // Trigger autoplay
            setSavedStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
            if (!result.isFinal) {
                setCurrentChoices(result.choices);
            }
        } catch(err) {
            console.error(err);
            setError('Произошла ошибка при продолжении истории.');
        } finally {
            setIsLoadingNextPart(false);
        }
    }, [currentStory]);
    
    // --- AUTH & VIEW HANDLERS ---
    const handleRegister = () => { setUser({ status: 'registered' }); setShowAuthModal(false); };
    const handleSubscribe = (tier: SubscriptionTier) => { setUser({ status: 'subscribed', tier }); setShowSubscriptionModal(false); };
    const handleProfileClick = () => { if (user.status === 'guest') { setShowAuthModal(true); } else { setView(v => v === 'profile' ? 'creator' : 'profile'); } };
    const handleSelectStoryFromHistory = (story: SavedStory) => { setCurrentStory(story); setView('creator'); };
    const handleShare = () => {
        if (!currentStory) return;
        const url = `${window.location.origin}/story/${currentStory.id}`;
        navigator.clipboard.writeText(url);
    };
    const handleAutoplayComplete = () => setAutoplayIndex(null);

    // --- RENDER LOGIC ---
    const renderContent = () => {
        if (view === 'viewer' && currentStory) {
            return (
                <div className="mt-8">
                     <StoryDisplay 
                        storyParts={currentStory.parts}
                        choices={[]}
                        onChoiceSelected={() => {}}
                        isLoadingNextPart={false}
                        onShare={() => {
                            const url = `${window.location.origin}/story/${currentStory.id}`;
                            navigator.clipboard.writeText(url);
                        }}
                        autoplayIndex={null}
                        onAutoplayComplete={() => {}}
                    />
                    <button onClick={() => window.location.href = '/'} className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <SparklesIcon className="w-5 h-5"/>
                        Создать свою сказку
                    </button>
                </div>
            );
        }

        if (view === 'profile') {
            return (
                <div className="mt-8 bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">История ваших сказок</h2>
                    {savedStories.length === 0 ? (
                        <p className="text-slate-400">Вы еще не создали ни одной сказки.</p>
                    ) : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                           {savedStories.map(story => (
                               <li key={story.id} onClick={() => handleSelectStoryFromHistory(story)} className="bg-slate-700/50 p-4 rounded-lg cursor-pointer hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 transition-all">
                                   <p className="font-semibold text-slate-200">{story.title}</p>
                                   <p className="text-sm text-slate-400">Герой: {story.formData.character}, Место: {story.formData.location}</p>
                               </li>
                           ))}
                        </ul>
                    )}
                </div>
            );
        }
        
        return (
            <>
                <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <StoryForm onSubmit={handleCreateStory} isLoading={isLoading} userStatus={user.status} />
                </div>
                {isLoading && <Loader />}
                {error && <div className="mt-6 bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">{error}</div>}
                {currentStory && !isLoading && (
                    <div className="mt-8">
                        <StoryDisplay 
                            storyParts={currentStory.parts}
                            choices={currentChoices}
                            onChoiceSelected={handleChoice}
                            isLoadingNextPart={isLoadingNextPart}
                            onShare={handleShare}
                            autoplayIndex={autoplayIndex}
                            onAutoplayComplete={handleAutoplayComplete}
                        />
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="bg-slate-900 min-h-screen text-slate-200 flex flex-col items-center p-4 selection:bg-indigo-500 selection:text-white">
            <div className="w-full max-w-3xl mx-auto">
                <Header onProfileClick={handleProfileClick} />
                <main className="mt-8">
                    {renderContent()}
                </main>
            </div>
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onRegister={handleRegister} />}
            {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} onSubscribe={handleSubscribe} />}
             <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }`}</style>
        </div>
    );
};

export default App;
