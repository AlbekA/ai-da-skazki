
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { StoryForm, StoryFormData, UserStatus } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { generateAudio } from './services/geminiService';

interface StoryPart {
  text: string;
  audioData: string | null;
}

const App: React.FC = () => {
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [story, setStory] = useState<StoryPart[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNextPart, setIsLoadingNextPart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = useState<StoryFormData | null>(null);
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>('guest');
  const [generationCount, setGenerationCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);
  
  useEffect(() => {
    try {
      // Fix: Use process.env.API_KEY as per coding guidelines.
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        // Fix: Update error message to reflect the new environment variable.
        throw new Error("API_KEY is not set. Please add it to your environment variables.");
      }
      setAi(new GoogleGenAI({ apiKey }));
    } catch (e: any) {
      setError(e.message);
      console.error(e);
    }
  }, []);
  
  const getDailyLimit = useCallback(() => {
    switch(userStatus) {
        case 'guest': return 3;
        case 'registered': return 6;
        case 'subscribed': return 10;
        case 'owner': return Infinity;
        default: return 3;
    }
  }, [userStatus]);

  const handleRegister = () => {
      setUserStatus('registered');
      setShowAuthModal(false);
  };
  
  const handleSubscribe = () => {
      setUserStatus('subscribed');
      setShowSubscriptionModal(false);
  };

  const handleProfileClick = () => {
      if(userStatus === 'guest' && generationCount >= getDailyLimit()) {
          setShowAuthModal(true);
      } else if (userStatus === 'registered' && generationCount >= getDailyLimit()){
          setShowSubscriptionModal(true);
      } else {
          alert(`Статус: ${userStatus}\nИспользовано генераций: ${generationCount}/${getDailyLimit()}`);
      }
  };
  
  const generateStoryPrompt = (formData: StoryFormData, history: any[] = []) => {
      const isCustom = formData.templateId === 'custom';
      let prompt = `Напиши начало доброй и увлекательной детской сказки объемом примерно в 4000 символов для ребенка по имени ${formData.name}. `;
      prompt += `${formData.name} — главный герой этой сказки, который действует, принимает решения и является центральным персонажем, а не просто наблюдателем. `;
      prompt += `Вместе со своим другом, которым является ${formData.character}, они отправляются в приключение в месте под названием "${formData.location}". `;
      
      if (!isCustom) {
        prompt += `История должна соответствовать теме шаблона "${formData.templateId}". `;
      }

      prompt += `Сказка должна быть написана простым и понятным для ребенка языком, с позитивным настроем. В конце оставь интригу и не заканчивай историю.`;
      
      if (formData.isInteractive) {
          prompt += ' В самом конце, после основного текста сказки, предложи два варианта развития сюжета для продолжения. Варианты должны быть четко разделены и представлены в формате JSON-массива строк. Например: ["пойти по тропинке налево", "исследовать пещеру справа"]. Не добавляй никакого текста после этого массива.';
      }

      return prompt;
  }
  
  const generateContinuationPrompt = (formData: StoryFormData, choice: string) => {
    let prompt = `Продолжи сказку, основываясь на выборе, который сделал ${formData.name}: "${choice}". `;
    prompt += `Сделай продолжение коротким, примерно 1-2 абзаца. ${formData.name} должен оставаться активным главным героем. `;
    
    if (formData.isInteractive) {
      prompt += 'В самом конце, после основного текста, снова предложи два новых варианта развития сюжета в формате JSON-массива строк, как и в прошлый раз. Не добавляй никакого текста после этого массива.';
    }
    return prompt;
  }

  const parseStoryAndChoices = (responseText: string): { storyText: string; choices: string[] } => {
    try {
        const choiceStartIndex = responseText.lastIndexOf('["');
        if (choiceStartIndex > -1 && responseText.endsWith(']')) {
            const storyText = responseText.substring(0, choiceStartIndex).trim();
            const choicesJson = responseText.substring(choiceStartIndex);
            const choices = JSON.parse(choicesJson);
            return { storyText, choices };
        }
    } catch (e) {
        console.error("Could not parse choices, returning full text as story.", e);
    }
    return { storyText: responseText.trim(), choices: [] };
  };

  const generateStory = async (formData: StoryFormData) => {
    if (!ai) {
      setError("AI client is not initialized.");
      return;
    }

    if (generationCount >= getDailyLimit()) {
        if(userStatus === 'guest') setShowAuthModal(true);
        if(userStatus === 'registered') setShowSubscriptionModal(true);
        return;
    }

    setIsLoading(true);
    setError(null);
    setStory([]);
    setChoices([]);
    setCurrentFormData(formData);
    setChat(null);

    try {
      const prompt = generateStoryPrompt(formData);
      
      const newChat = ai.chats.create({ model: 'gemini-2.5-flash' });
      const result = await newChat.sendMessage({ message: prompt });
      const responseText = result.text;
      
      setChat(newChat);

      const { storyText, choices: newChoices } = parseStoryAndChoices(responseText);
      
      const audioData = await generateAudio(storyText, formData.voiceId);

      setStory([{ text: storyText, audioData }]);
      setChoices(newChoices);
      setGenerationCount(prev => prev + 1);
      setAutoplayIndex(0);

    } catch (e: any) {
      console.error(e);
      setError("Не удалось создать сказку. Пожалуйста, попробуйте еще раз. " + e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChoice = useCallback(async (choice: string) => {
      if (!ai || !currentFormData || !chat) return;
      
      setIsLoadingNextPart(true);
      setChoices([]);
      
      try {
        const prompt = generateContinuationPrompt(currentFormData, choice);
        
        const result = await chat.sendMessage({ message: prompt });
        const responseText = result.text;
        
        const { storyText, choices: newChoices } = parseStoryAndChoices(responseText);
        const audioData = await generateAudio(storyText, currentFormData.voiceId);
        
        setStory(prev => [...prev, { text: storyText, audioData }]);
        setChoices(newChoices);
        setAutoplayIndex(story.length);

      } catch (e: any) {
          console.error(e);
          setError("Не удалось продолжить сказку. " + e.message);
      } finally {
          setIsLoadingNextPart(false);
      }
  }, [ai, currentFormData, story.length, chat]);
  
  const handleShare = () => {
      const storyText = story.map(p => p.text).join('\n\n');
      const url = window.location.href;
      const shareText = `Послушай сказку, которую я создал(а) в "AI да сказки"!\n\n${storyText}\n\nСоздай свою сказку здесь: ${url}`;
      
      if(navigator.share) {
          navigator.share({
              title: 'Моя волшебная сказка',
              text: shareText,
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(url).then(() => {
            // Confirmation is handled in StoryDisplay
          }).catch(console.error);
      }
  };
  
  const handleAutoplayComplete = useCallback(() => {
    setAutoplayIndex(null);
  }, []);

  if (!ai && !error) {
    return (
        <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
            <Loader />
        </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <Header onProfileClick={handleProfileClick} />
        
        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}

        <StoryForm onSubmit={generateStory} isLoading={isLoading} userStatus={userStatus} />

        {isLoading && <Loader />}
        
        {story.length > 0 && !isLoading && (
          <StoryDisplay 
            storyParts={story} 
            choices={choices} 
            onChoiceSelected={handleChoice}
            isLoadingNextPart={isLoadingNextPart}
            onShare={handleShare}
            autoplayIndex={autoplayIndex}
            onAutoplayComplete={handleAutoplayComplete}
          />
        )}
      </div>
       {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onRegister={handleRegister} />}
       {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} onSubscribe={handleSubscribe} />}

       <style>{`
          body {
            background-color: #0f172a;
          }
       `}</style>
    </div>
  );
};

export default App;
