import React, { useState } from 'react';
import { Loader } from './Loader';

export interface StoryFormValues {
  character: string;
  setting: string;
  age: string;
  moral: string;
  voice: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
}

interface StoryFormProps {
  onStoryCreate: (values: StoryFormValues) => void;
  isLoading: boolean;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onStoryCreate, isLoading }) => {
  const [values, setValues] = useState<StoryFormValues>({
    character: '',
    setting: '',
    age: '5',
    moral: '',
    voice: 'Kore',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStoryCreate(values);
  };

  const voiceOptions = [
    { id: 'Kore', name: 'Женский 1 (Kore)' },
    { id: 'Puck', name: 'Мужской 1 (Puck)' },
    { id: 'Zephyr', name: 'Женский 2 (Zephyr)' },
    { id: 'Charon', name: 'Мужской 2 (Charon)' },
    { id: 'Fenrir', name: 'Мужской 3 (Fenrir)' },
  ];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-slate-800/50 p-8 rounded-2xl shadow-lg border border-slate-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="character" className="block text-sm font-medium text-slate-300">
              Главный герой
            </label>
            <input
              type="text"
              name="character"
              id="character"
              value={values.character}
              onChange={handleChange}
              placeholder="Например, храбрый мышонок"
              required
              className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
            />
          </div>
          <div>
            <label htmlFor="setting" className="block text-sm font-medium text-slate-300">
              Место действия
            </label>
            <input
              type="text"
              name="setting"
              id="setting"
              value={values.setting}
              onChange={handleChange}
              placeholder="Например, заколдованный лес"
              required
              className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
            />
          </div>
        </div>
        <div>
          <label htmlFor="moral" className="block text-sm font-medium text-slate-300">
            Основная мысль или мораль сказки (необязательно)
          </label>
          <textarea
            name="moral"
            id="moral"
            value={values.moral}
            onChange={handleChange}
            rows={2}
            placeholder="Например, о важности дружбы"
            className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-300">
              Возраст ребенка
            </label>
            <input
              type="number"
              name="age"
              id="age"
              value={values.age}
              onChange={handleChange}
              min="2"
              max="12"
              required
              className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
            />
          </div>
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-slate-300">
              Голос диктора
            </label>
            <select
              name="voice"
              id="voice"
              value={values.voice}
              onChange={handleChange}
              required
              className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
            >
              {voiceOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Создаем волшебство...' : 'Создать сказку'}
          </button>
        </div>
      </form>
       <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
