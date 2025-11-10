import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StoryForm, StoryFormValues } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { Loader } from './components/Loader';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { generateStoryPart, generateAudio } from './services/geminiService';
import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';


interface StoryPart {
  text: string;
  audioData: string | null;
}

const App: React.FC = () => {
    const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
    const [choices, setChoices] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingNextPart, setIsLoadingNextPart] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState<StoryFormValues | null>(null);
    const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

    // Auth & Subscription State
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);


    const handleStoryCreate = async (values: StoryFormValues) => {
        setIsLoading(true);
        setError(null);
        setStoryParts([]);
        setChoices([]);
        setFormValues(values);

        const prompt = `Напиши первую часть доброй и волшебной сказки для ребенка ${values.age} лет. 
        Главный герой: ${values.character}. 
        Место действия: ${values.setting}. 
        ${values.moral ? `Основная мысль сказки: ${values.moral}.` : ''} 
        Сказка должна быть написана на русском языке. 
        Не делай сказку слишком длинной, 2-3 абзаца. 
        В конце предложи три варианта продолжения.`;
        
        await processNewStoryPart(prompt, true);
        setIsLoading(false);
    };

    const handleChoiceSelected = async (choice: string) => {
        setIsLoadingNextPart(true);
        setError(null);
        setChoices([]);

        const storyHistory = storyParts.map(p => p.text).join('\n\n');
        const prompt = `Продолжи сказку, основываясь на выборе пользователя.
        Предыдущая часть сказки: "${storyHistory}"
        Выбор пользователя: "${choice}"
        
        Напиши следующую часть сказки (2-3 абзаца). Она должна быть логичным продолжением.
        Сказка должна быть написана на русском языке для ребенка ${formValues?.age} лет.
        В конце снова предложи три новых варианта продолжения.`;

        await processNewStoryPart(prompt, false);
        setIsLoadingNextPart(false);
    };
    
    const processNewStoryPart = async (prompt: string, isFirstPart: boolean) => {
        try {
            const { story, choices: newChoices } = await generateStoryPart(prompt);
            const audioData = await generateAudio(story, formValues?.voice || 'Kore');

            const newPart: StoryPart = { text: story, audioData };

            setStoryParts(prev => {
                if (!isFirstPart) {
                    setAutoplayIndex(prev.length); // Autoplay the new part
                }
                return [...prev, newPart];
            });
            setChoices(newChoices);

        } catch (err: any) {
            setError('Произошла ошибка при создании сказки. Пожалуйста, попробуйте еще раз.');
            console.error(err);
        }
    }

    const handleShare = () => {
        const storyText = storyParts.map(p => p.text).join('\n\n');
        const url = window.location.href;
        const shareText = `Послушай сказку, которую я создал с помощью "AI да сказки"!\n\n${storyText}\n\nСоздай свою сказку здесь: ${url}`;
        navigator.clipboard.writeText(shareText);
    };

    const handleProfileClick = () => {
      if(user) {
        supabase.auth.signOut();
      } else {
        setIsAuthModalOpen(true);
      }
    }
    
    const handleSubscribe = (tier: 'tier1' | 'tier2') => {
        console.log(`Subscribing to ${tier}`);
        setIsSubModalOpen(false);
    }


    return (
        <div className="bg-slate-900 text-white min-h-screen font-sans pb-24">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Header onProfileClick={handleProfileClick} />
                <main className="mt-10">
                    {isLoading && <Loader />}
                    {!isLoading && storyParts.length === 0 && (
                        <StoryForm onStoryCreate={handleStoryCreate} isLoading={isLoading} />
                    )}
                    {storyParts.length > 0 && (
                       <StoryDisplay 
                         storyParts={storyParts}
                         choices={choices}
                         onChoiceSelected={handleChoiceSelected}
                         isLoadingNextPart={isLoadingNextPart}
                         onShare={handleShare}
                         autoplayIndex={autoplayIndex}
                         onAutoplayComplete={() => setAutoplayIndex(null)}
                       />
                    )}
                     {error && (
                        <div className="mt-6 text-center bg-red-500/20 text-red-300 p-4 rounded-lg">
                            {error}
                        </div>
                    )}
                </main>
            </div>
            <Footer />
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
            {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSubscribe={handleSubscribe} />}
        </div>
    );
}

export default App;
