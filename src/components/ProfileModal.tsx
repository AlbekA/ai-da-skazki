import React from 'react';
import type { User } from '@supabase/supabase-js';

interface ProfileModalProps {
  user: User;
  subscriptionTier: string | null;
  storyCount: number;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, subscriptionTier, storyCount, onClose, onLogout }) => {
  const getSubscriptionName = () => {
    if (subscriptionTier === 'tier1') return 'Волшебник';
    if (subscriptionTier === 'tier2') return 'Сказочник';
    return 'Нет подписки';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">&times;</button>
        
        <h2 className="text-2xl font-bold text-center text-indigo-400 mb-6">Профиль</h2>
        
        <div className="space-y-4 text-slate-300">
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Email:</span>
            <span className="font-semibold truncate">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">План подписки:</span>
            <span className={`font-semibold px-2 py-1 rounded-md text-sm ${subscriptionTier ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-400'}`}>
                {getSubscriptionName()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Создано сказок:</span>
            <span className="font-semibold">{storyCount}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-8 px-6 py-3 border border-slate-700 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all"
        >
          Выйти
        </button>
      </div>
      <style>{`
        .animate-fade-in-fast {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
