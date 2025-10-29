import React from 'react';

interface AuthModalProps {
  onClose: () => void;
  onRegister: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onRegister }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">&times;</button>
        <h2 className="text-2xl font-bold text-center text-indigo-400 mb-2">Продолжите ваше волшебное путешествие!</h2>
        <p className="text-slate-400 text-center mb-6">Вы использовали все 3 бесплатные генерации сказок. Зарегистрируйтесь, чтобы создать <span className="font-bold text-indigo-300">ещё 3 бесплатные сказки</span>.</p>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="email" className="text-sm font-medium text-slate-300">Email (симуляция)</label>
                <input type="email" id="email" defaultValue="user@example.com" className="mt-1 w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>
            <div>
                <label htmlFor="password-auth" className="text-sm font-medium text-slate-300">Пароль (симуляция)</label>
                <input type="password" id="password-auth" defaultValue="password123" className="mt-1 w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>
        </div>

        <button
          onClick={onRegister}
          className="w-full mt-6 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all"
        >
          Зарегистрироваться и продолжить
        </button>
        <p className="text-xs text-slate-500 text-center mt-4">Это симуляция. Никакие данные не будут отправлены.</p>
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