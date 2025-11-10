import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StoryForm } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { generateStoryPart, generateAudio } from './services/geminiService';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { Footer } from './components/Footer';

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
  const [voiceId, setVoiceId] = useState('Kore');
  const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

  // Auth & Subscription State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [_session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [storyCount, setStoryCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  
  const MAX_FREE_STORIES_UNAUTH = 1;
  const MAX_FREE_STORIES_AUTH = 3;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (_event === 'SIGNED_IN') {
          setShowAuthModal(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // A simple way to track story creations for this session.
    // In a real app, this would be stored in a database.
    const count = localStorage.getItem('storyCount');
    setStoryCount(count ? parseInt(count, 10) : 0);

    // This is a simulation of subscription status.
    const tier = localStorage.getItem('subscriptionTier');
    setSubscriptionTier(tier);
  }, [user]);


  const checkUsageLimit = () => {
    if (subscriptionTier) return true; // Subscribers have no limits
    
    const limit = user ? MAX_FREE_STORIES_AUTH : MAX_FREE_STORIES_UNAUTH;

    if (storyCount >= limit) {
      if (!user) {
        setShowAuthModal(true);
      } else {
        setShowSubscriptionModal(true);
      }
      return false;
    }
    return true;
  }

  const handleStoryStart = async (prompt: string, selectedVoiceId: string, isInteractive: boolean) => {
    if (!checkUsageLimit()) return;
    
    setIsLoading(true);
    setError(null);
    setStoryParts([]);
    setChoices([]);
    setVoiceId(selectedVoiceId);

    const basePrompt = `
      Напиши начало волшебной сказки на русском языке.
      ${prompt}
      История должна быть доброй, увлекательной и закончиться на интригующем моменте.
    `;

    const interactivePrompt = `
      ${basePrompt}
      Сгенерируй JSON с двумя ключами: "story" (первая часть сказки, 2-3 абзаца) и "choices" (массив из трех коротких вариантов продолжения).
    `;
    
    const nonInteractivePrompt = `
      ${basePrompt}
       Сгенерируй JSON с одним ключом: "story" (целая, законченная сказка из 5-6 абзацев).
    `;

    try {
      const { story, choices: newChoices } = await generateStoryPart(isInteractive ? interactivePrompt : nonInteractivePrompt, isInteractive);
      const audioData = await generateAudio(story, selectedVoiceId);
      
      setStoryParts([{ text: story, audioData }]);
      setChoices(newChoices || []);
      setAutoplayIndex(0); // Autoplay the first part

      const newCount = storyCount + 1;
      setStoryCount(newCount);
      localStorage.setItem('storyCount', newCount.toString());

    } catch (err) {
      setError('Произошла ошибка при создании сказки. Пожалуйста, попробуйте снова.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelected = async (choice: string) => {
    setIsLoadingNextPart(true);
    setError(null);
    setChoices([]);

    const storyHistory = storyParts.map(p => p.text).join('\n\n');
    const prompt = `
      Продолжи сказку на русском языке, основываясь на выборе пользователя.
      Предыдущие части:
      ---
      ${storyHistory}
      ---
      Выбор пользователя: "${choice}"

      Напиши следующую часть истории (2-3 абзаца). Она должна быть логичным продолжением и снова заканчиваться на интригующем моменте.
      Сгенерируй JSON с двумя ключами: "story" (следующая часть сказки) и "choices" (массив из трех новых коротких вариантов продолжения).
    `;

    try {
      const { story, choices: newChoices } = await generateStoryPart(prompt, true);
      const audioData = await generateAudio(story, voiceId);
      
      const newPart = { text: story, audioData };
      setStoryParts(prevParts => [...prevParts, newPart]);
      setChoices(newChoices || []);
      setAutoplayIndex(storyParts.length); // Autoplay the new part
    } catch (err) {
      setError('Не удалось загрузить продолжение. Пожалуйста, попробуйте выбрать еще раз.');
      console.error(err);
    } finally {
      setIsLoadingNextPart(false);
    }
  };

  const handleShare = () => {
    const storyText = storyParts.map(part => part.text).join('\n\n');
    const url = window.location.href;
    const shareText = `Я создал волшебную сказку!\n\n${storyText.substring(0, 200)}...\n\nЧитайте дальше здесь: ${url}`;
    navigator.clipboard.writeText(shareText);
  };

  const handleSubscribe = (tier: 'tier1' | 'tier2') => {
    // This is a simulation
    console.log(`Subscribed to ${tier}`);
    setSubscriptionTier(tier);
    localStorage.setItem('subscriptionTier', tier);
    setShowSubscriptionModal(false);
  }
  
  const handleLockClick = () => {
    if (!user) {
        setShowAuthModal(true);
    } else {
        setShowSubscriptionModal(true);
    }
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto space-y-8 pb-20">
        <Header onProfileClick={() => !user ? setShowAuthModal(true) : alert('Профиль в разработке!')} />
        <main>
          {error && <p className="text-center text-red-400 bg-red-500/10 p-3 rounded-md mb-4">{error}</p>}
          
          {storyParts.length === 0 ? (
            <StoryForm 
              onStoryStart={handleStoryStart} 
              isLoading={isLoading} 
              user={user}
              onLockClick={handleLockClick}
            />
          ) : (
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
        </main>
      </div>
      <Footer />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} onSubscribe={handleSubscribe} />}
    </div>
  );
};

export default App;