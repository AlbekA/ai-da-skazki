
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

export type UserStatus = 'guest' | 'registered' | 'subscribed' | 'owner';

interface StoryFormProps {
  onSubmit: (formData: StoryFormData) => void;
  isLoading: boolean;
  userStatus: UserStatus;
}

export interface StoryFormData {
  name: string;
  character: string;
  location: string;
  voiceId: string;
  templateId: string;
  isInteractive: boolean;
}

const voiceOptions = [
  { id: 'Kore', name: 'Женский (спокойный)' },
  { id: 'Zephyr', name: 'Женский (дружелюбный)' },
  { id: 'Puck', name: 'Мужской (веселый)' },
  { id: 'Charon', name: 'Мужской (глубокий)' },
  { id: 'Fenrir', name: 'Мужской (эпичный)' },
];

const storyTemplates = [
    { id: 'custom', title: 'Своя история', description: 'Полностью ваша история.', characterPlaceholder: 'Например, храбрый котенок', locationPlaceholder: 'Например, волшебный лес' },
    { id: 'forest-adventure', title: 'Приключение в лесу', description: 'Сказка о дружбе и смелости в волшебном лесу.', characterPlaceholder: 'любопытный лисенок', locationPlaceholder: 'Шепчущий лес' },
    { id: 'space-journey', title: 'Космическое путешествие', description: 'История о полете к далеким звездам и новых открытиях.', characterPlaceholder: 'отважный робот-астронавт', locationPlaceholder: 'туманность Ориона' },
    { id: 'underwater-world', title: 'Тайны подводного мира', description: 'Погружение в красочный мир коралловых рифов и его обитателей.', characterPlaceholder: 'веселый дельфин', locationPlaceholder: 'Коралловый город' },
    { id: 'magic-castle', title: 'Загадка волшебного замка', description: 'Сказка о тайнах старинного замка, где живет магия.', characterPlaceholder: 'маленький призрак', locationPlaceholder: 'замок Спящей Луны' },
    { id: 'dragon-friend', title: 'Дружба с драконом', description: 'История о том, как ребенок подружился с настоящим драконом.', characterPlaceholder: 'добрый огнедышащий дракончик', locationPlaceholder: 'Драконьи горы' },
    { id: 'detective-story', title: 'Маленький детектив', description: 'Запутанная история, где главный герой расследует пропажу сладостей.', characterPlaceholder: 'проницательный хомяк-сыщик', locationPlaceholder: 'город Сладкоежек' },
    { id: 'time-travel', title: 'Путешествие во времени', description: 'Приключение с машиной времени, динозаврами и рыцарями.', characterPlaceholder: 'мудрая сова-профессор', locationPlaceholder: 'эпоха динозавров' },
    { id: 'circus-dream', title: 'Цирковая мечта', description: 'История о том, как мечта выступить на арене цирка стала реальностью.', characterPlaceholder: 'талантливый слоненок-жонглер', locationPlaceholder: 'цирк-шапито "Фантазия"' },
    { id: 'candy-kingdom', title: 'Королевство сладостей', description: 'Сладкая сказка о приключениях в стране из шоколада и мармелада.', characterPlaceholder: 'зефирный человечек', locationPlaceholder: 'Шоколадная река' },
    { id: 'talking-animals', title: 'Говорящие животные', description: 'История о ферме, где все животные умеют разговаривать.', characterPlaceholder: 'хитрый говорящий кот', locationPlaceholder: 'ферма "Солнечный луг"' },
];


export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, isLoading, userStatus }) => {
  const [name, setName] = useState('');
  const [character, setCharacter] = useState('');
  const [location, setLocation] = useState('');
  const [voiceId, setVoiceId] = useState(voiceOptions[0].id);
  const [templateId, setTemplateId] = useState(storyTemplates[0].id);
  const [isInteractive, setIsInteractive] = useState(false);

  const canUsePremiumFeatures = userStatus === 'subscribed' || userStatus === 'owner';

  useEffect(() => {
    const selectedTemplate = storyTemplates.find(t => t.id === templateId);
    if (selectedTemplate && templateId !== 'custom') {
      setCharacter(selectedTemplate.characterPlaceholder);
      setLocation(selectedTemplate.locationPlaceholder);
    }
  }, [templateId]);
  
  // Reset interactive mode if user status changes and they can't use it
  useEffect(() => {
    if (!canUsePremiumFeatures) {
      setIsInteractive(false);
    }
  }, [canUsePremiumFeatures]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && character && location && !isLoading) {
      onSubmit({ name, character, location, voiceId, templateId, isInteractive });
    }
  };
  
  const selectedTemplate = storyTemplates.find(t => t.id === templateId)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step 1: Template */}
      <div>
          <h3 className="text-lg font-semibold text-indigo-400 mb-3">Шаг 1: Выберите основу для сказки</h3>
          <label htmlFor="template" className="block text-sm font-medium text-slate-300 mb-2">Шаблон истории</label>
          <select
            id="template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            {storyTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <p className="text-sm text-slate-400 mt-2">{selectedTemplate.description}</p>
      </div>

      {/* Step 2: Details */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-400 mb-3">Шаг 2: Добавьте детали</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Имя ребенка</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Аня" required className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
          </div>
          <div>
            <label htmlFor="character" className="block text-sm font-medium text-slate-300 mb-2">Главный герой</label>
            <input type="text" id="character" value={character} onChange={(e) => setCharacter(e.target.value)} placeholder={selectedTemplate.characterPlaceholder} required className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">Место действия</label>
            <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={selectedTemplate.locationPlaceholder} required className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
          </div>
        </div>
      </div>

      {/* Step 3: Customization */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-400 mb-3">Шаг 3: Настройте сказку</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative">
                <label htmlFor="voice" className="block text-sm font-medium text-slate-300 mb-2">Голос рассказчика</label>
                <select id="voice" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!canUsePremiumFeatures} className="w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-700/50 disabled:cursor-not-allowed">
                {voiceOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {!canUsePremiumFeatures && <div className="absolute inset-0 flex items-center justify-end pr-3 text-slate-400"><LockIcon className="w-5 h-5"/></div>}
            </div>
            <div className="flex items-center justify-center pt-6">
                <label htmlFor="interactive-toggle" className={`flex items-center ${canUsePremiumFeatures ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <div className="relative">
                    <input type="checkbox" id="interactive-toggle" className="sr-only" checked={isInteractive} onChange={() => setIsInteractive(!isInteractive)} disabled={!canUsePremiumFeatures} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${canUsePremiumFeatures ? 'bg-slate-600' : 'bg-slate-600/50'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isInteractive && canUsePremiumFeatures ? 'transform translate-x-full bg-indigo-400' : ''}`}></div>
                    </div>
                    <div className={`ml-3 font-medium ${canUsePremiumFeatures ? 'text-slate-300' : 'text-slate-500'}`}>
                    Интерактивная сказка
                    </div>
                </label>
            </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !name || !character || !location}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-all duration-300"
      >
        <SparklesIcon className="w-5 h-5" />
        {isLoading ? 'Создаем волшебство...' : 'Создать сказку'}
      </button>
    </form>
  );
};

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
