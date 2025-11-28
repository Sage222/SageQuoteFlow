import React from 'react';
import { Quote, PlaybackState } from '../types';
import { Pause, Play, RefreshCw, Clock, AlertCircle } from 'lucide-react';

interface PlayerProps {
  quotes: Quote[];
  playbackState: PlaybackState;
  onPauseResume: () => void;
  onReset: () => void;
  isBuffering: boolean;
}

export const Player: React.FC<PlayerProps> = ({
  quotes,
  playbackState,
  onPauseResume,
  onReset,
  isBuffering
}) => {
  const currentQuote = quotes[playbackState.currentQuoteIndex];
  
  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-950 to-slate-950 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 pt-8">
        <button 
          onClick={onReset} 
          className="p-2 rounded-full bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 transition-colors backdrop-blur-md border border-white/5 active:scale-95"
        >
          <RefreshCw size={20} />
        </button>
        <div className="text-xs font-bold tracking-wider text-indigo-300 bg-indigo-950/50 px-3 py-1.5 rounded-full uppercase border border-indigo-500/20">
          Quote {playbackState.currentQuoteIndex + 1} of {quotes.length}
        </div>
        <div className="w-9"></div> 
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col justify-center px-8 pb-12 overflow-y-auto no-scrollbar">
        
        {/* Quote Card */}
        <div className="relative group min-h-[50vh] flex flex-col justify-center">
          <div className="absolute -top-12 -left-6 text-9xl text-indigo-500/5 font-serif leading-none select-none">“</div>
          
          <div className={`transition-all duration-500 transform ${isBuffering ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
             <h2 className="text-2xl md:text-4xl font-light leading-relaxed text-slate-100 mb-6 font-serif text-center md:text-left break-words">
              {currentQuote?.text || "No quote text available"}
            </h2>
          </div>

          {/* Loading State */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex items-center gap-3 bg-slate-900/90 px-6 py-3 rounded-2xl text-indigo-300 border border-indigo-500/30 shadow-2xl backdrop-blur-sm">
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                 </div>
                 <span className="text-xs font-bold tracking-widest">GENERATING AUDIO</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {playbackState.lastError && !isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-red-950/90 text-red-200 px-6 py-4 rounded-xl border border-red-500/30 backdrop-blur-md max-w-xs text-center shadow-2xl">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                <p className="text-sm font-medium">{playbackState.lastError}</p>
                <button onClick={onPauseResume} className="mt-3 text-xs bg-red-900/50 hover:bg-red-800 px-3 py-1 rounded text-white border border-red-700">
                  Tap Play to Retry
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Controls */}
      <div className="relative z-10 p-8 pb-12 bg-slate-900/60 backdrop-blur-xl border-t border-white/5">
        
        {/* Status Text / Timer */}
        <div className="text-center mb-8 h-12 flex flex-col items-center justify-center">
          {playbackState.timeRemainingInInterval > 0 && !playbackState.isAudioPlaying && !playbackState.lastError && (
             <div className="flex flex-col items-center gap-1">
               <span className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Next Quote In</span>
               <div className="font-mono text-3xl font-light text-white tracking-widest tabular-nums">
                 {formatTime(playbackState.timeRemainingInInterval)}
               </div>
             </div>
          )}
          {playbackState.isAudioPlaying && (
             <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
               <span className="text-sm font-medium tracking-wide">Reading aloud...</span>
             </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={onPauseResume}
            className="w-20 h-20 rounded-full bg-white text-indigo-950 flex items-center justify-center shadow-xl shadow-indigo-500/10 hover:scale-105 active:scale-95 transition-all ring-4 ring-indigo-500/20"
          >
            {playbackState.isAudioPlaying || (playbackState.timeRemainingInInterval > 0 && !playbackState.lastError) ? (
              <Pause size={32} className="fill-current" />
            ) : (
              <Play size={32} className="fill-current ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};