import React from 'react';
import { TelegramIcon } from './icons/TelegramIcon';
import { VkIcon } from './icons/VkIcon';


export const Footer: React.FC = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 z-10">
            <div className="max-w-3xl mx-auto flex items-center justify-center p-4">
                <p className="text-slate-400 text-sm mr-4">Мы в соцсетях:</p>
                <div className="flex items-center gap-4">
                    <a 
                        href="https://t.me/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Telegram" 
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        <TelegramIcon className="w-6 h-6" />
                    </a>
                    <a 
                        href="https://vk.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="VK"
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        <VkIcon className="w-6 h-6" />
                    </a>
                </div>
            </div>
        </footer>
    );
};
