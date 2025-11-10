import React, { useState } from 'react';
import { Loader } from './Loader';
import { LockIcon } from './icons/LockIcon';
import type { User } from '@supabase/supabase-js';

interface StoryFormProps {
  onStoryStart: (prompt: string, voiceId: string, isInteractive: boolean) => void;
  isLoading: boolean;
  user: User | null;
  onLockClick: () => void;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onStoryStart, isLoading, user, onLockClick }) => {
  const [character, setCharacter] = useState('');
  const [setting, setSetting] = useState('');
  const [feature, setFeature] = useState('');
  const [age, setAge] = useState('5');
  const [voice, setVoice] = useState('Kore');
  const [isInteractive, setIsInteractive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isInteractive && !user) { // Assuming any logged-in user has access for now
        onLockClick();
        return;
    }

    const prompt = `
      - Для ребенка ${age} лет.
      - Главный герой: ${character || 'смелый котенок'}
      - Место действия: ${setting || 'загадочный лес'}
      - Ключевая особенность сюжета: ${feature || 'поиски волшебного цветка'}
    `;

    onStoryStart(prompt.trim(), voice, isInteractive);
  };
  
  const handleInteractiveToggle = () => {
    if (!user) { // Or check for subscription tier
        onLockClick();
    } else {
        setIsInteractive(!isInteractive);
    }
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="character" className="block text-sm font-medium text-slate-300 mb-1">
            Главный герой
          </label>
          <input
            type="text"
            id="character"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="Например, храбрый мышонок"
            className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>
        <div>
          <label htmlFor="setting" className="block text-sm font-medium text-slate-300 mb-1">
            Место действия
          </label>
          <input
            type="text"
            id="setting"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="Например, хрустальный замок"
            className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>
      </div>
      <div>
        <label htmlFor="feature" className="block text-sm font-medium text-slate-300 mb-1">
          О чем будет сказка?
        </label>
        <input
          type="text"
          id="feature"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          placeholder="Например, о спасении друга"
          className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">
              Возраст ребенка
            </label>
            <select
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="3">3-4 года</option>
              <option value="5">5-6 лет</option>
              <option value="7">7-8 лет</option>
              <option value="9">9+ лет</option>
            </select>
          </div>
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-slate-300 mb-1">
              Голос рассказчика
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="Kore">Женский (Спокойный)</option>
              <option value="Puck">Мужской (Дружелюбный)</option>
              <option value="Zephyr">Женский (Энергичный)</option>
              <option value="Charon">Мужской (Глубокий)</option>
            </select>
          </div>
      </div>

       {/* Interactive Toggle */}
      <div 
        className="relative flex items-center justify-between bg-slate-700/50 p-4 rounded-lg cursor-pointer group"
        onClick={handleInteractiveToggle}
        title="Интерактивные сказки позволяют влиять на сюжет, делая выбор в ключевых моментах истории. Доступно по подписке."
      >
        <div className="flex items-center gap-3">
            <LockIcon className={`w-5 h-5 transition-colors ${user ? 'text-purple-400' : 'text-slate-500'}`} />
            <div>
                <span className={`font-semibold transition-colors ${user ? 'text-slate-200' : 'text-slate-500'}`}>
                    Интерактивная сказка
                </span>
                <p className={`text-xs transition-colors ${user ? 'text-slate-400' : 'text-slate-500'}`}>
                    Вы сможете влиять на сюжет
                </p>
            </div>
        </div>
        <div className={`relative w-12 h-6 rounded-full transition-colors ${isInteractive && user ? 'bg-indigo-600' : 'bg-slate-600'}`}>
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isInteractive && user ? 'transform translate-x-6' : ''}`}></div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all transform hover:scale-105 disabled:bg-indigo-500/50"
      >
        {isLoading ? 'Создаем магию...' : 'Начать сказку'}
      </button>
    </form>
  );
};