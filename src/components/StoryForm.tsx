import React, { useState } from 'react';
import { Loader } from './Loader';

interface StoryFormProps {
  onStoryStart: (prompt: string, voiceId: string) => void;
  isLoading: boolean;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onStoryStart, isLoading }) => {
  const [character, setCharacter] = useState('');
  const [setting, setSetting] = useState('');
  const [feature, setFeature] = useState('');
  const [age, setAge] = useState('5');
  const [voice, setVoice] = useState('Kore'); // Default voice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const prompt = `
      Напиши начало волшебной сказки на русском языке для ребенка ${age} лет.
      - Главный герой: ${character || 'смелый котенок'}
      - Место действия: ${setting || 'загадочный лес'}
      - Ключевая особенность сюжета: ${feature || 'поиски волшебного цветка'}
      
      История должна быть доброй, увлекательной и закончиться на интригующем моменте, предлагая читателю сделать выбор.
      Сгенерируй JSON с двумя ключами: "story" (первая часть сказки, 2-3 абзаца) и "choices" (массив из трех коротких вариантов продолжения).
    `;

    onStoryStart(prompt.trim(), voice);
  };

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
