import React, { useState, useEffect, useRef, useCallback } from 'react';
import { decode, decodeAudioData } from '../utils/audio';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { ShareIcon } from './icons/ShareIcon';

interface StoryPart {
  text: string;
  audioData: string | null;
}

interface StoryDisplayProps {
  storyParts: StoryPart[];
  choices: string[];
  onChoiceSelected: (choice: string) => void;
  isLoadingNextPart: boolean;
  onShare: () => void;
  autoplayIndex: number | null;
  onAutoplayComplete: () => void;
  onClose: () => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  storyParts, 
  choices, 
  onChoiceSelected, 
  isLoadingNextPart, 
  onShare, 
  autoplayIndex, 
  onAutoplayComplete,
  onClose 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffers, setAudioBuffers] = useState<AudioBuffer[]>([]);
  const [shareConfirmation, setShareConfirmation] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const autoplaySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
    }
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
  }

  useEffect(() => {
    const setupAudio = async () => {
      if (storyParts.length > 0) {
        initAudioContext();
        if (!audioContextRef.current) return;
        try {
          const buffers = await Promise.all(
            storyParts
              .filter(p => p.audioData)
              .map(p => decode(p.audioData!))
              .map(decodedBytes => decodeAudioData(decodedBytes, audioContextRef.current!, 24000, 1))
          );
          setAudioBuffers(buffers);
        } catch (error) {
          console.error("Error decoding audio data:", error);
        }
      }
    };
    setupAudio();
    return () => {
      stopPlayback(true);
    };
  }, [storyParts]);

  useEffect(() => {
      if (autoplayIndex !== null && audioBuffers[autoplayIndex]) {
          playSegment(autoplayIndex);
          onAutoplayComplete();
      }
  }, [autoplayIndex, audioBuffers]);

  const stopPlayback = (isUnmounting = false) => {
    audioSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    audioSourcesRef.current = [];
    if (autoplaySourceRef.current) {
        try { autoplaySourceRef.current.stop(); } catch (e) {}
        autoplaySourceRef.current = null;
    }
    if(!isUnmounting) setIsPlaying(false);
  };

  const playSegment = (index: number) => {
    initAudioContext();
    if (!audioContextRef.current || !audioBuffers[index]) return;
    stopPlayback();
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffers[index];
    source.connect(audioContextRef.current.destination);
    source.start();
    setIsPlaying(true);
    source.onended = () => {
        if (autoplaySourceRef.current === source) {
            setIsPlaying(false);
            autoplaySourceRef.current = null;
        }
    };
    autoplaySourceRef.current = source;
  }

  const handlePlayPause = useCallback(() => {
    initAudioContext();
    if (!audioContextRef.current) return;
    
    if (isPlaying) {
      stopPlayback();
    } else {
      if (audioBuffers.length > 0) {
        setIsPlaying(true);
        nextStartTimeRef.current = audioContextRef.current.currentTime;
        
        audioBuffers.forEach((buffer, index) => {
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current!.destination);
            source.start(nextStartTimeRef.current);
            
            if (index === audioBuffers.length - 1) {
                source.onended = () => setIsPlaying(false);
            }

            nextStartTimeRef.current += buffer.duration;
            audioSourcesRef.current.push(source);
        });
      }
    }
  }, [isPlaying, audioBuffers]);

  const handleShare = () => {
      onShare();
      setShareConfirmation(true);
      setTimeout(() => setShareConfirmation(false), 2000);
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-500/30 animate-fade-in flex flex-col h-[85vh] w-full max-w-4xl relative overflow-hidden ring-1 ring-white/10">
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
      
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-900/50 z-10">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm">
            ✨ Ваша сказка
        </h2>
        <button 
            onClick={onClose}
            className="group p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-full transition-all duration-300 border border-transparent hover:border-red-500/30"
            aria-label="Закрыть сказку"
            title="Закрыть и вернуться"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="flex items-center justify-between mb-2 bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
            <div className="text-slate-300 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Аудио-версия
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-all"
                    aria-label="Поделиться сказкой"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    {shareConfirmation && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-md animate-fade-in-fast whitespace-nowrap z-20 shadow-lg">
                            Ссылка скопирована!
                        </div>
                    )}
                </div>
                <button
                onClick={handlePlayPause}
                disabled={audioBuffers.length === 0}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30"
                aria-label={isPlaying ? "Pause story" : "Play story"}
                >
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                </button>
            </div>
        </div>

        <div className="space-y-6 text-slate-200 leading-loose text-lg font-light px-2">
            {storyParts.map((part, index) => (
            <div key={index} className="animate-fade-in p-4 rounded-lg hover:bg-white/5 transition-colors">
                {part.text.split('\n').map((line, i) => (
                    <p key={i} className="mb-4 last:mb-0">{line}</p>
                ))}
            </div>
            ))}
        </div>

        {(choices.length > 0 || isLoadingNextPart) && (
            <div className="mt-12 pt-6 border-t border-slate-700/50 pb-8">
                <h3 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-6">
                    Что произойдет дальше?
                </h3>
                {isLoadingNextPart ? (
                    <div className="flex flex-col justify-center items-center p-4 space-y-4">
                        <div className="w-10 h-10 border-t-2 border-indigo-400 border-r-2 rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500 animate-pulse">Придумываем продолжение...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => onChoiceSelected(choice)}
                                className="text-center p-5 bg-slate-800/60 hover:bg-indigo-600/80 border border-slate-600 hover:border-indigo-500 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 shadow-sm hover:shadow-indigo-500/20 group"
                            >
                                <span className="group-hover:text-white transition-colors">{choice}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        .animate-fade-in-fast { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338ca; }
      `}</style>
    </div>
  );
};