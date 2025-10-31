import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface InstallPWAProps {
  onClose: () => void;
  onInstall: () => void;
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ onClose, onInstall }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative animate-slide-up-fade">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-75"></div>
        <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <img src="/icons/icon-192x192.png" alt="App Icon" className="w-12 h-12" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Установить приложение?</h2>
            <p className="text-slate-400 mb-6">
                Добавьте <span className="font-bold text-indigo-300">AI да сказки</span> на главный экран для быстрого доступа, даже без интернета.
            </p>
            
            <div className="space-y-3">
                <button
                    onClick={onInstall}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Установить
                </button>
                <button
                    onClick={onClose}
                    className="w-full px-6 py-3 text-base font-medium rounded-md text-slate-300 bg-transparent hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-600 transition-all"
                >
                    Позже
                </button>
            </div>
        </div>
      </div>
       <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
