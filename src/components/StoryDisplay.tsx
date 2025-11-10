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
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ storyParts, choices, onChoiceSelected, isLoadingNextPart, onShare, autoplayIndex, onAutoplayComplete }) => {
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
    <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-indigo-400">Ваша волшебная сказка</h2>
        <div className="flex items-center gap-4">
            <div className="relative">
                <button
                onClick={handleShare}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-all"
                aria-label="Поделиться сказкой"
                >
                    <ShareIcon className="w-6 h-6" />
                </button>
                 {shareConfirmation && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-md animate-fade-in-fast">
                        Ссылка скопирована!
                    </div>
                )}
            </div>
            <button
            onClick={handlePlayPause}
            disabled={audioBuffers.length === 0}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
            aria-label={isPlaying ? "Pause story" : "Play story"}
            >
            {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
            </button>
        </div>
      </div>

      <div className="max-h-[40vh] overflow-y-auto p-4 bg-slate-900/50 rounded-lg space-y-4 text-slate-300 leading-relaxed custom-scrollbar">
        {storyParts.map((part, index) => (
          <p key={index}>{part.text}</p>
        ))}
      </div>

      {(choices.length > 0 || isLoadingNextPart) && (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-center text-purple-400 mb-4">Что делать дальше?</h3>
            {isLoadingNextPart ? (
                <div className="flex justify-center items-center p-4">
                    <div className="w-8 h-8 border-t-2 border-purple-400 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => onChoiceSelected(choice)}
                            className="text-center p-4 bg-slate-700 hover:bg-indigo-600 border border-slate-600 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                        >
                            {choice}
                        </button>
                    ))}
                </div>
            )}
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        .animate-fade-in-fast { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338ca; }
      `}</style>
    </div>
  );
};