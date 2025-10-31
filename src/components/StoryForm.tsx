import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

export interface StoryFormData {
  name: string;
  character: string;
  location: string;
  isInteractive: boolean;
  voiceId: string;
}

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  isLoading: boolean;
  userStatus: 'guest' | 'registered' | 'subscribed' | 'owner';
}

const voices = [
    { id: 'Kore', name: 'Кора (женский)' },
    { id: 'Puck', name: 'Пак (мужской)' },
    { id: 'Charon', name: 'Харон (мужской)' },
    { id: 'Fenrir', name: 'Фенрир (мужской)' },
    { id: 'Zephyr', name: 'Зефир (женский)' },
];

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, isLoading, userStatus }) => {
  const [name, setName] = useState('');
  const [character, setCharacter] = useState('');
  const [location, setLocation] = useState('');
  const [isInteractive, setIsInteractive] = useState(false);
  const [voiceId, setVoiceId] = useState('Kore');
  
  const isSubscribed = userStatus === 'subscribed' || userStatus === 'owner';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !name.trim() || !character.trim() || !location.trim()) return;
    onSubmit({ name, character, location, isInteractive, voiceId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-400">Начнем наше приключение!</h2>
        <p className="text-slate-400 mt-1">Заполните поля, чтобы создать уникальную сказку.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
            Имя вашего ребенка
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-500"
            placeholder="Например, Аня"
            required
          />
        </div>

        <div>
            <label htmlFor="voice" className="block text-sm font-medium text-slate-300 mb-1">
                Голос рассказчика
            </label>
            <select
                id="voice"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full bg-slate-700/50 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
                {voices.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
            </select>
        </div>
      </div>

      <div>
        <label htmlFor="character" className="block text-sm font-medium text-slate-300 mb-1">
          Главный герой
        </label>
        <input
          type="text"
          id="character"
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          className="w-full bg-slate-700/50 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-500"
          placeholder="Например, храбрый котенок"
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-1">
          Место действия
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-slate-700/50 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-500"
          placeholder="Например, в волшебном лесу"
          required
        />
      </div>
      
       <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg border border-slate-600">
        <div className="flex flex-col">
            <span className="font-medium text-slate-200">Интерактивная сказка</span>
            <span className="text-sm text-slate-400">Ребенок сможет влиять на сюжет, делая выборы.</span>
            {!isSubscribed && <span className="text-xs text-purple-400 mt-1">Доступно по подписке</span>}
        </div>
        <button
          type="button"
          onClick={() => setIsInteractive(!isInteractive)}
          className={`${
            isInteractive ? 'bg-indigo-600' : 'bg-slate-600'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
          role="switch"
          aria-checked={isInteractive}
        >
          <span
            aria-hidden="true"
            className={`${
              isInteractive ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading || !name.trim() || !character.trim() || !location.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
            <span>Создание...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5"/>
            <span>Создать сказку</span>
          </>
        )}
      </button>
    </form>
  );
};
