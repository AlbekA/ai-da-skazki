import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserIcon } from './icons/UserIcon';

interface HeaderProps {
    onProfileClick: () => void;
    storiesRemaining: number;
    storyLimit: number;
    hasSubscription: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick, storiesRemaining, storyLimit, hasSubscription }) => {
  return (
    <header className="text-center relative">
      <div className="flex items-center justify-center gap-4">
        <SparklesIcon className="w-10 h-10 text-indigo-400" />
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          AI да сказки
        </h1>
        <SparklesIcon className="w-10 h-10 text-purple-400" />
      </div>
      <p className="mt-2 text-lg text-slate-400">
        Создайте волшебную сказку для вашего ребенка
      </p>
      {!hasSubscription && (
        <p className="mt-1 text-sm text-slate-500">
          {`У вас осталось ${storiesRemaining} из ${storyLimit} бесплатных сказок.`}
        </p>
      )}
      <button 
        onClick={onProfileClick}
        className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all"
        aria-label="Профиль пользователя"
      >
        <UserIcon className="w-6 h-6" />
      </button>
    </header>
  );
};