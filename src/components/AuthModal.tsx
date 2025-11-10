import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  onClose: () => void;
}

type AuthView = 'sign_in' | 'sign_up';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [view, setView] = useState<AuthView>('sign_up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
        if (view === 'sign_up') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMessage('Регистрация почти завершена! Пожалуйста, проверьте почту и перейдите по ссылке для подтверждения.');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            onClose(); // Close modal on successful login
        }
    } catch (err: any) {
        if (err.message.includes('Email not confirmed')) {
            setError('Пожалуйста, подтвердите ваш email перед входом.');
        } else {
            setError(err.error_description || err.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const headerText = view === 'sign_up' 
    ? "Продолжите ваше волшебное путешествие!"
    : "С возвращением!";
  
  const subHeaderText = view === 'sign_up'
    ? "Зарегистрируйтесь, чтобы создать ещё 2 бесплатные сказки."
    : "Войдите в свой аккаунт, чтобы продолжить.";

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">&times;</button>
        
        <h2 className="text-2xl font-bold text-center text-indigo-400 mb-2">{headerText}</h2>
        <p className="text-slate-400 text-center mb-6">{subHeaderText}</p>
        
        {error && <p className="bg-red-500/20 text-red-300 text-center p-3 rounded-md mb-4 text-sm">{error}</p>}
        {message && <p className="bg-green-500/20 text-green-300 text-center p-3 rounded-md mb-4 text-sm">{message}</p>}
        
        {/* Hide form if a success message is shown */}
        {!message && (
            <form onSubmit={handleAuthAction}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" 
                    />
                </div>
                <div>
                    <label htmlFor="password-auth" className="text-sm font-medium text-slate-300">Пароль</label>
                    <input 
                        type="password" 
                        id="password-auth" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="mt-1 w-full bg-slate-700 border-slate-600 text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" 
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all disabled:bg-indigo-500/50"
            >
                {loading ? 'Загрузка...' : (view === 'sign_up' ? 'Зарегистрироваться' : 'Войти')}
            </button>
            </form>
        )}


        <p className="text-xs text-slate-500 text-center mt-4">
          {view === 'sign_up' ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}
          <button onClick={() => { setView(view === 'sign_up' ? 'sign_in' : 'sign_up'); setError(null); setMessage(null); }} className="font-semibold text-indigo-400 hover:underline ml-1">
            {view === 'sign_up' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>

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