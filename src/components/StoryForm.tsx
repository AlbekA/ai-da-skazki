import React, { useState } from 'react';
import { Loader } from './Loader';
import { LockIcon } from './icons/LockIcon';
import type { User } from '@supabase/supabase-js';
import { SparklesIcon } from './icons/SparklesIcon';

interface StoryFormProps {
  onStoryStart: (prompt: string, voiceId: string, isInteractive: boolean) => void;
  isLoading: boolean;
  user: User | null;
  subscriptionTier: string | null;
  onLockClick: () => void;
}

const scenarios = [
  { id: 'friendship', title: 'О дружбе', character: 'котенок и щенок', setting: 'солнечная поляна', feature: 'помогают заблудившемуся светлячку' },
  { id: 'space', title: 'О космосе', character: 'маленькая ракета', setting: 'шоколадная планета', feature: 'ищет друзей среди звезд' },
  { id: 'magic', title: 'О загадке', character: 'любопытный ежик', setting: 'старый дуб с дуплом', feature: 'находит таинственную карту сокровищ' },
  { id: 'sea', title: 'О море', character: 'смелая рыбка', setting: 'коралловый риф', feature: 'находит затонувший пиратский корабль' },
  { id: 'dino', title: 'О динозаврах', character: 'добрый динозаврик', setting: 'доисторические джунгли', feature: 'учит других динозавров дружить' },
  { id: 'fairy', title: 'О феях', character: 'крошечная фея', setting: 'цветочный сад', feature: 'спасает цветы от ворчливого гнома' },
  { id: 'knight', title: 'О рыцаре', character: 'юный рыцарь', setting: 'заколдованный замок', feature: 'преодолевает свой страх темноты' },
  { id: 'robot', title: 'О роботе', character: 'неуклюжий робот', setting: 'город будущего', feature: 'мечтает научиться танцевать' },
  { id: 'jungle', title: 'О джунглях', character: 'озорная обезьянка', setting: 'тропический лес', feature: 'находит волшебный банан' },
  { id: 'arctic', title: 'Об Арктике', character: 'белый медвежонок', setting: 'снежная долина', feature: 'отправляется в путешествие на льдине' },
];

export const StoryForm: React.FC<StoryFormProps> = ({ onStoryStart, isLoading, user: _user, subscriptionTier, onLockClick }) => {
  const [character, setCharacter] = useState('');
  const [setting, setSetting] = useState('');
  const [feature, setFeature] = useState('');
  const [age, setAge] = useState('5');
  const [voice, setVoice] = useState('Kore');
  const [isInteractive, setIsInteractive] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);


  const handleScenarioClick = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setCharacter(scenario.character);
      setSetting(scenario.setting);
      setFeature(scenario.feature);
      setActiveScenario(scenarioId);
      setShowScenarios(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isInteractive && !subscriptionTier) {
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
    if (!subscriptionTier) {
        onLockClick();
    } else {
        setIsInteractive(!isInteractive);
    }
  }

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoice = e.target.value;
    const isPremiumVoice = selectedVoice !== 'Kore';
    if (isPremiumVoice && !subscriptionTier) {
      e.preventDefault();
      onLockClick();
    } else {
      setVoice(selectedVoice);
    }
  };

  const selectedScenarioTitle = scenarios.find(s => s.id === activeScenario)?.title || 'Своя сказка';

  if (isLoading) {
    return <Loader />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
        
      {/* Scenario Selector */}
       <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Выберите сценарий
        </label>
        <button
          type="button"
          onClick={() => setShowScenarios(!showScenarios)}
          className="w-full flex items-center justify-between text-left p-3 rounded-md transition-all bg-slate-700 hover:bg-slate-600 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
        >
          <span className="font-semibold text-white">{selectedScenarioTitle}</span>
          <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${showScenarios ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {showScenarios && (
          <div className="absolute z-10 top-full mt-2 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
            {scenarios.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleScenarioClick(s.id)}
                className={`w-full text-left p-3 transition-colors text-white ${activeScenario === s.id ? 'bg-indigo-600' : 'hover:bg-slate-600'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="character" className="block text-sm font-medium text-slate-300 mb-1">
            Имя вашего ребенка
          </label>
          <input
            type="text"
            id="character"
            value={character}
            onChange={(e) => { setCharacter(e.target.value); setActiveScenario(null); }}
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
            onChange={(e) => { setSetting(e.target.value); setActiveScenario(null); }}
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
          onChange={(e) => { setFeature(e.target.value); setActiveScenario(null); }}
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
              onChange={handleVoiceChange}
              className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="Kore">Женский (Спокойный)</option>
              <option value="Puck">Мужской (Дружелюбный) {!subscriptionTier && '🔒'}</option>
              <option value="Zephyr">Женский (Энергичный) {!subscriptionTier && '🔒'}</option>
              <option value="Charon">Мужской (Глубокий) {!subscriptionTier && '🔒'}</option>
            </select>
          </div>
      </div>

       {/* Interactive Toggle */}
      <div 
        className={`relative flex items-center justify-between bg-slate-700/50 p-4 rounded-lg group ${!subscriptionTier ? 'cursor-pointer' : 'cursor-pointer'}`}
        onClick={handleInteractiveToggle}
        title="Интерактивные сказки позволяют влиять на сюжет, делая выбор в ключевых моментах истории. Доступно по подписке."
      >
        <div className="flex items-center gap-3">
            <LockIcon className={`w-5 h-5 transition-colors ${subscriptionTier ? 'text-purple-400' : 'text-slate-500'}`} />
            <div>
                <span className={`font-semibold transition-colors ${subscriptionTier ? 'text-slate-200' : 'text-slate-500'}`}>
                    Интерактивная сказка
                </span>
                <p className={`text-xs transition-colors ${subscriptionTier ? 'text-slate-400' : 'text-slate-500'}`}>
                    Вы сможете влиять на сюжет
                </p>
            </div>
        </div>
        <div className={`relative w-12 h-6 rounded-full transition-colors ${isInteractive && subscriptionTier ? 'bg-indigo-600' : 'bg-slate-600'}`}>
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isInteractive && subscriptionTier ? 'transform translate-x-6' : ''}`}></div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all transform hover:scale-105 disabled:bg-indigo-500/50"
      >
        <SparklesIcon className="w-5 h-5"/>
        {isLoading ? 'Создаем магию...' : 'Начать сказку'}
      </button>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338ca; }
      `}</style>
    </form>
  );
};