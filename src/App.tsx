import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StoryForm } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { Loader } from './components/Loader';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { generateStoryPart, generateAudio } from './services/geminiService';
import type { StoryFormData, UserStatus } from './components/types';

interface StoryPart {
  text: string;
  audioData: string | null;
}

const GUEST_LIMIT = 3;
const REGISTERED_LIMIT = 6;

const App: React.FC = () => {
  const [userStatus, setUserStatus] = useState<UserStatus>('guest');
  const [generationCount, setGenerationCount] = useState(0);

  const [storyFormData, setStoryFormData] = useState<StoryFormData | null>(null);
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [storyHistory, setStoryHistory] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNextPart, setIsLoadingNextPart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

  // Load user status and count from localStorage
  useEffect(() => {
    const savedStatus = localStorage.getItem('userStatus') as UserStatus | null;
    const savedCount = localStorage.getItem('generationCount');
    if (savedStatus) setUserStatus(savedStatus);
    if (savedCount) setGenerationCount(parseInt(savedCount, 10));
  }, []);

  // Save user status and count to localStorage
  useEffect(() => {
    localStorage.setItem('userStatus', userStatus);
    localStorage.setItem('generationCount', generationCount.toString());
  }, [userStatus, generationCount]);

  const checkGenerationLimit = useCallback(() => {
    if (userStatus === 'guest' && generationCount >= GUEST_LIMIT) {
      setShowAuthModal(true);
      return false;
    }
    if (userStatus === 'registered' && generationCount >= REGISTERED_LIMIT) {
      setShowSubModal(true);
      return false;
    }
    return true;
  }, [userStatus, generationCount]);

  const handleFormSubmit = async (formData: StoryFormData) => {
    if (!checkGenerationLimit()) return;

    setIsLoading(true);
    setError(null);
    setStoryParts([]);
    setStoryHistory('');
    setChoices([]);
    setStoryFormData(formData);

    try {
      const { storyPart, choices: newChoices } = await generateStoryPart(formData, '', true);
      const audioData = await generateAudio(storyPart, formData.voiceId);

      const newPart = { text: storyPart, audioData };
      setStoryParts([newPart]);
      setStoryHistory(storyPart);
      if (formData.isInteractive) setChoices(newChoices);

      setGenerationCount(count => count + 1);
      setAutoplayIndex(0);
    } catch (err) {
      setError('Произошла ошибка при создании сказки. Пожалуйста, попробуйте еще раз.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelected = async (choice: string) => {
    if (!storyFormData) return;
    
    setIsLoadingNextPart(true);
    setChoices([]);
    
    const newHistory = `${storyHistory}\n\nВыбор ребенка: ${choice}`;

    try {
      const { storyPart, choices: newChoices } = await generateStoryPart(storyFormData, newHistory, false);
      const audioData = await generateAudio(storyPart, storyFormData.voiceId);
      
      const newPart = { text: storyPart, audioData };
      const updatedParts = [...storyParts, newPart];
      setStoryParts(updatedParts);
      setStoryHistory(prev => `${prev}\n\n${storyPart}`);
      if (storyFormData.isInteractive) setChoices(newChoices);
      setAutoplayIndex(updatedParts.length - 1);
    } catch (err) {
      setError('Произошла ошибка при продолжении сказки.');
      console.error(err);
    } finally {
      setIsLoadingNextPart(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Послушай сказку, которую я создал: ${storyParts.map(p => p.text).join(' ')}`;
    navigator.clipboard.writeText(`${text}\n\nСоздай свою на: ${url}`);
  };

  const handleProfileClick = () => {
    if (userStatus === 'guest') setShowAuthModal(true);
    else if (userStatus === 'registered') setShowSubModal(true);
    else if (userStatus === 'subscribed' || userStatus === 'owner') {
      if (window.confirm(`Ваш статус: ${userStatus}. Сбросить до гостя?`)) {
        setUserStatus('guest');
        setGenerationCount(0);
      }
    }
  };

  const handleRegister = () => {
    setUserStatus('registered');
    setShowAuthModal(false);
  };

  const handleSubscribe = (tier: 'tier1' | 'tier2') => {
    setUserStatus('subscribed');
    setShowSubModal(false);
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header onProfileClick={handleProfileClick} />
        <main className="mt-12">
          <div className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-700">
            <StoryForm onSubmit={handleFormSubmit} isLoading={isLoading} userStatus={userStatus} />
          </div>
          
          {isLoading && <Loader />}

          {error && <p className="text-center text-red-400 mt-6">{error}</p>}

          {storyParts.length > 0 && !isLoading && (
            <div className="mt-10">
              <StoryDisplay
                storyParts={storyParts}
                choices={choices}
                onChoiceSelected={handleChoiceSelected}
                isLoadingNextPart={isLoadingNextPart}
                onShare={handleShare}
                autoplayIndex={autoplayIndex}
                onAutoplayComplete={() => setAutoplayIndex(null)}
              />
            </div>
          )}
        </main>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onRegister={handleRegister} />}
        {showSubModal && <SubscriptionModal onClose={() => setShowSubModal(false)} onSubscribe={handleSubscribe} />}
      </div>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Создано с любовью и магией ИИ. © 2024 AI да сказки.</p>
      </footer>
    </div>
  );
};

export default App;
