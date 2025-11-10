import React, { useState } from 'react';

interface SubscriptionModalProps {
  onClose: () => void;
  onSubscribe: (tier: 'tier1' | 'tier2') => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSubscribe }) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    if (code === 'FREE_MONTH') {
      onSubscribe('tier1');
    } else if (code === 'FREE_YEAR') {
      onSubscribe('tier2');
    } else {
      setPromoError('Неверный или истекший промокод.');
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">&times;</button>
        <h2 className="text-3xl font-bold text-center text-purple-400 mb-2">Разблокируйте безграничное волшебство!</h2>
        <p className="text-slate-400 text-center mb-6">Ваш лимит бесплатных сказок исчерпан. Выберите план, чтобы творить без ограничений и получить доступ к интерактивным историям!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Tier 1 Plan */}
            <div className="border-2 border-slate-600 rounded-lg p-6 flex flex-col hover:border-indigo-500 transition-all">
                <h3 className="text-xl font-semibold text-slate-200">Волшебник</h3>
                 <p className="text-slate-400 text-sm mb-4">Для ежедневных историй</p>
                <p className="text-4xl font-bold">299₽<span className="text-base font-medium text-slate-400">/мес</span></p>
                <ul className="text-slate-300 space-y-2 my-6 text-left">
                    <li className="flex items-center gap-3"><span className="text-indigo-400">✔</span> 2 новые сказки каждый день</li>
                    <li className="flex items-center gap-3"><span className="text-indigo-400">✔</span> Хранение сказок 7 дней</li>
                    <li className="flex items-center gap-3"><span className="text-indigo-400">✔</span> Выбор голоса диктора</li>
                    <li className="flex items-center gap-3 text-slate-500"><span className="text-slate-600">✘</span> Интерактивные сказки</li>
                </ul>
                <button onClick={() => onSubscribe('tier1')} className="w-full mt-auto px-4 py-2 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500">Выбрать</button>
            </div>
            {/* Tier 2 Plan */}
             <div className="border-2 border-purple-500 rounded-lg p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">ВЫГОДНО</div>
                <h3 className="text-xl font-semibold text-slate-200">Сказочник</h3>
                <p className="text-slate-400 text-sm mb-4">Для самых любознательных</p>
                <p className="text-4xl font-bold">699₽<span className="text-base font-medium text-slate-400">/мес</span></p>
                <ul className="text-slate-300 space-y-2 my-6 text-left">
                    <li className="flex items-center gap-3"><span className="text-purple-400">✔</span> <span className="font-bold">5 новых сказок каждый день</span></li>
                    <li className="flex items-center gap-3"><span className="text-purple-400">✔</span> Хранение сказок 30 дней</li>
                    <li className="flex items-center gap-3"><span className="text-purple-400">✔</span> Выбор голоса диктора</li>
                    <li className="flex items-center gap-3"><span className="text-purple-400">✔</span> Интерактивные сказки</li>
                </ul>
                <button onClick={() => onSubscribe('tier2')} className="w-full mt-auto px-4 py-2 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500">Выбрать</button>
            </div>
        </div>
        
        <div className="mt-8 border-t border-slate-700 pt-6">
            <label htmlFor="promo" className="block text-sm font-medium text-center text-slate-300">Есть промокод?</label>
            <div className="mt-2 flex max-w-sm mx-auto rounded-md shadow-sm">
                <input 
                    type="text" 
                    id="promo" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="FREE_MONTH" 
                    className="flex-1 block w-full rounded-none rounded-l-md bg-slate-700 border-slate-600 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button 
                    type="button" 
                    onClick={handleApplyPromo}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
                >
                    Применить
                </button>
            </div>
            {promoError && <p className="mt-2 text-sm text-red-400 text-center">{promoError}</p>}
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">Это симуляция. Оплата не будет произведена.</p>
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