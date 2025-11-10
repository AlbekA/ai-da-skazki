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
import { Footer } from './components/Footer';
import { TrashIcon } from './components/icons/TrashIcon';
import { supabase } from './supabaseClient'; // Import supabase
import type { Session } from '@supabase/supabase-js';

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
    formData: StoryFormData; // Corresponds to form_data in DB
    isInteractive: boolean; // Corresponds to is_interactive in DB
    created_at?: string; // from DB
}
type UserStatus = 'guest' | 'registered' | 'subscribed' | 'owner';
type SubscriptionTier = 'tier1' | 'tier2';
interface User { 
    id: string | null;
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
const GUEST_SIMPLE_LIMIT = 2;
const REGISTERED_SIMPLE_LIMIT = 2;
const DAILY_LIMITS: Record<SubscriptionTier, number> = {
    tier1: 2,
    tier2: 5,
};
const LOCAL_STORAGE_KEY = 'aiFairyTalesUserData';

const App: React.FC = () => {
    // --- STATE ---
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User>({ id: null, status: 'guest' });
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
    
    // --- SUPABASE AUTH & SESSION ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session) {
              setUser({ id: session.user.id, status: 'registered' });
          } else {
              setUser({ id: null, status: 'guest' });
          }
        });
    
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session) {
              setUser({ id: session.user.id, status: 'registered' });
          } else {
              setUser({ id: null, status: 'guest' });
          }
        });
    
        return () => subscription.unsubscribe();
      }, []);

    // --- DATA FETCHING & PERSISTENCE ---
    useEffect(() => {
        // Load usage data and guest stories from localStorage on initial load
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                const { usage, savedStories: guestStories } = JSON.parse(savedData);
                if (usage) setUsage(usage);
                if (guestStories && !session) {
                    setSavedStories(guestStories);
                }
            }
        } catch (e) {
            console.error("Failed to parse data from localStorage", e);
        }
    }, []); // Run only once on mount

    useEffect(() => {
        // Fetch stories from Supabase when session becomes available
        const fetchStories = async () => {
            if (!session) return;
            try {
                const { data, error } = await supabase
                    .from('stories')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                // Supabase returns form_data, map it to formData
                const formattedData = data.map(story => ({ ...story, formData: story.form_data })) as SavedStory[];
                setSavedStories(formattedData);
            } catch (err) {
                console.error("Error fetching stories:", err);
                setError("Не удалось загрузить ваши сказки.");
            }
        };

        if (session) {
            fetchStories();
        } else {
            // User logged out, clear stories from state (guest stories will be re-loaded from localStorage on next guest session)
            setSavedStories([]);
        }
    }, [session]);


    useEffect(() => {
        // Persist data to localStorage
        if (user.status === 'guest') {
            const dataToSave = JSON.stringify({ usage, savedStories });
            localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
        } else {
            // For logged-in users, only save usage data. Stories are in Supabase.
            const dataToSave = JSON.stringify({ usage });
            localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
        }
    }, [usage, savedStories, user.status]);

    // Handle viewing a story from a shared URL
    useEffect(() => {
        if (savedStories.length === 0) return;

        const path = window.location.pathname;
        if (path.startsWith('/story/')) {
            const storyId = path.split('/')[2];
            const story = savedStories.find(s => s.id === storyId);
            if (story) {
                setCurrentStory(story);
                setView('viewer');
            } else {
                 window.history.replaceState({}, '', '/');
            }
        }
    }, [savedStories]);

    
    // --- PROMPT & RESPONSE LOGIC ---
    const getPrompt = (formData: StoryFormData, type: 'initial' | 'simple' | { choice: string }): string => {
        const { name, character, location } = formData;
    
        if (type === 'simple') {
            return `Напиши короткую, добрую и увлекательную сказку для ребенка по имени ${name}. Главный герой сказки, помимо ${name}, должен быть ${character}. Действие сказки происходит в ${location}. Сказка должна быть позитивной, иметь счастливый конец и подходить для маленьких детей (возраст 3-6 лет). Объем сказки - примерно 4000 символов.`;
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
        // ... (usage checks remain the same)
        
        setIsLoading(true);
        setError(null);
        setCurrentStory(null);
        setCurrentChoices([]);
        chatRef.current = null;
        voiceIdRef.current = formData.voiceId;

        try {
            let storyText: string;
            let result: { story: string; choices: string[], isFinal: boolean } | null = null;
            
            if (formData.isInteractive) {
                chatRef.current = ai.chats.create({ model: 'gemini-2.5-pro' });
                const response = await chatRef.current.sendMessage({ message: getPrompt(formData, 'initial') });
                const processed = await processResponse(response);
                if (typeof processed !== 'object' || !('story' in processed)) throw new Error("Failed to start story.");
                result = processed;
                storyText = result.story;
            } else {
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: getPrompt(formData, 'simple') });
                storyText = response.text;
            }
            
            const audioData = await generateAudio(storyText, voiceIdRef.current);
            const storyData = { 
                title: `Сказка для ${formData.name}`, 
                parts: [{ text: storyText, audioData }], 
                formData, 
                isInteractive: formData.isInteractive
            };

            let newStory: SavedStory;

            if (session?.user) {
                 const { data, error: insertError } = await supabase
                    .from('stories')
                    .insert({
                        user_id: session.user.id,
                        title: storyData.title,
                        parts: storyData.parts,
                        form_data: storyData.formData,
                        is_interactive: storyData.isInteractive,
                    })
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                newStory = { ...data, formData: data.form_data } as SavedStory;
            } else {
                newStory = { ...storyData, id: crypto.randomUUID() };
            }

            setCurrentStory(newStory);
            if (result) setCurrentChoices(result.choices);
            setSavedStories(prev => [newStory, ...prev]);
            
            // ... (usage update logic remains the same)
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
    }, [user, usage, session]);
  
    const handleChoice = useCallback(async (choice: string) => {
        if (!chatRef.current || !currentStory) return;
        
        setIsLoadingNextPart(true);
        setCurrentChoices([]);
        setError(null);

        try {
            const response = await chatRef.current.sendMessage({ message: getPrompt({} as StoryFormData, { choice }) });
            const result = await processResponse(response);
            if (typeof result !== 'object' || !('story' in result)) throw new Error("Invalid continuation.");

            const audioData = await generateAudio(result.story, voiceIdRef.current);
            const newPart = { text: result.story, audioData };
            const updatedStory = { ...currentStory, parts: [...currentStory.parts, newPart]};

            if (session?.user) {
                const { error: updateError } = await supabase
                    .from('stories')
                    .update({ parts: updatedStory.parts })
                    .eq('id', updatedStory.id);
                if (updateError) throw updateError;
            }

            setCurrentStory(updatedStory);
            setAutoplayIndex(updatedStory.parts.length - 1);
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
    }, [currentStory, session]);
    
    // --- AUTH & VIEW HANDLERS ---
    const handleLogout = async () => { await supabase.auth.signOut(); setView('creator'); };
    const handleSubscribe = (tier: SubscriptionTier) => { setUser(prev => ({ ...prev, status: 'subscribed', tier })); setShowSubscriptionModal(false); };
    const handleProfileClick = () => { if (user.status === 'guest') { setShowAuthModal(true); } else { setView(v => v === 'profile' ? 'creator' : 'profile'); } };
    const handleSelectStoryFromHistory = (story: SavedStory) => { setCurrentStory(story); setView('creator'); };
    const handleShare = () => {
        if (!currentStory) return;
        const url = `${window.location.origin}/story/${currentStory.id}`;
        navigator.clipboard.writeText(url);
    };
    const handleAutoplayComplete = () => setAutoplayIndex(null);

    const handleDeleteStory = async (e: React.MouseEvent, storyId: string) => {
        e.stopPropagation();
        const originalStories = [...savedStories];
        setSavedStories(prev => prev.filter(s => s.id !== storyId));
        if (currentStory?.id === storyId) {
            setCurrentStory(null);
        }

        if (session?.user) {
            try {
                const { error: deleteError } = await supabase.from('stories').delete().eq('id', storyId);
                if (deleteError) {
                    setSavedStories(originalStories); // Revert on error
                    throw deleteError;
                }
            } catch(err) {
                console.error('Failed to delete story from Supabase', err);
                setError('Не удалось удалить сказку. Попробуйте снова.');
            }
        }
    };

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
            const planName = 
                user.status === 'subscribed' ? (user.tier === 'tier1' ? 'Волшебник' : 'Сказочник') :
                user.status === 'registered' ? 'Базовый' :
                user.status === 'guest' ? 'Гостевой' : 'Владелец';

            return (
                <div className="mt-8 bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
                    <div className="mb-8 bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">Текущий тариф</h3>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-bold text-purple-400">{planName}</p>
                            { (user.status !== 'owner') ? (
                                <button
                                    onClick={() => setShowSubscriptionModal(true)}
                                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                >
                                    {user.status === 'subscribed' ? 'Управлять' : 'Улучшить'}
                                </button>
                            ) : (
                                <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
                                    Выйти
                                </button>
                            )}
                        </div>
                         {session && <p className="text-xs text-slate-500 mt-2">Вы вошли как: {session.user.email}</p>}
                    </div>

                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">История ваших сказок</h2>
                    {savedStories.length === 0 ? (
                        <p className="text-slate-400">Вы еще не создали ни одной сказки.</p>
                    ) : (
                        <ul className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                           {savedStories.map(story => (
                               <li key={story.id} onClick={() => handleSelectStoryFromHistory(story)} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg cursor-pointer hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 transition-all group">
                                   <div>
                                     <p className="font-semibold text-slate-200">{story.title}</p>
                                     <p className="text-sm text-slate-400">Герой: {story.formData.character}, Место: {story.formData.location}</p>
                                   </div>
                                   <button 
                                     onClick={(e) => handleDeleteStory(e, story.id)}
                                     className="p-2 rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                     aria-label="Удалить сказку"
                                   >
                                       <TrashIcon className="w-5 h-5" />
                                   </button>
                               </li>
                           ))}
                        </ul>
                    )}
                    {user.status !== 'guest' && user.status !== 'owner' && (
                        <button onClick={handleLogout} className="w-full mt-6 text-slate-400 hover:text-white transition-colors text-sm py-2">
                            Выйти из аккаунта
                        </button>
                    )}
                </div>
            );
        }
        
        let remainingCreations: number | null = null;
        if (user.status === 'guest') {
            remainingCreations = GUEST_SIMPLE_LIMIT - usage.guestSimpleCreations;
        } else if (user.status === 'registered') {
            remainingCreations = REGISTERED_SIMPLE_LIMIT - usage.registeredSimpleCreations;
        }

        return (
            <>
                <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <StoryForm 
                      onSubmit={handleCreateStory} 
                      isLoading={isLoading} 
                      userStatus={user.status} 
                      onPremiumFeatureClick={() => setShowSubscriptionModal(true)}
                      remainingCreations={remainingCreations}
                    />
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
            <div className="w-full max-w-3xl mx-auto pb-24">
                <Header onProfileClick={handleProfileClick} />
                <main className="mt-8">
                    {renderContent()}
                </main>
            </div>
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} onSubscribe={handleSubscribe} />}
            <Footer />
             <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }`}</style>
        </div>
    );
};

export default App;