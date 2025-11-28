import React, { useEffect, useRef } from 'react';
import { AppSettings, AppStatus } from '../types';
import { Settings2, Play, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface SettingsFormProps {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onStart: () => void;
  status: AppStatus;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  onSettingsChange,
  onStart,
  status
}) => {
  const quotesEndRef = useRef<HTMLDivElement>(null);

  // Sync manualQuotes array length with quoteCount
  useEffect(() => {
    if (settings.manualQuotes.length !== settings.quoteCount) {
      const newQuotes = [...settings.manualQuotes];
      if (newQuotes.length < settings.quoteCount) {
        // Add empty strings for new slots
        for (let i = newQuotes.length; i < settings.quoteCount; i++) {
          newQuotes.push('');
        }
      } else {
        // Truncate if count decreased
        newQuotes.length = settings.quoteCount;
      }
      onSettingsChange({ ...settings, manualQuotes: newQuotes });
    }
  }, [settings.quoteCount]);

  const handleQuoteChange = (index: number, value: string) => {
    const newQuotes = [...settings.manualQuotes];
    newQuotes[index] = value;
    onSettingsChange({ ...settings, manualQuotes: newQuotes });
  };

  const updateCount = (newCount: number) => {
    onSettingsChange({ ...settings, quoteCount: newCount });
  };

  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Valid if at least one quote is filled in
  const isValid = settings.manualQuotes.some(q => q.trim().length > 0);

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto animate-fade-in relative">
      {/* Header */}
      <div className="flex-none px-6 py-6 text-center pt-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 mb-3 ring-1 ring-indigo-500/50">
          <Settings2 size={24} />
        </div>
        <h1 className="text-xl font-bold text-white">Setup Your Session</h1>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32 no-scrollbar overscroll-contain">
        
        {/* Quote Count Control */}
        <div className="space-y-3 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" />
              Number of Quotes
            </label>
            <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1">
              <button 
                onClick={() => updateCount(Math.max(1, settings.quoteCount - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                -
              </button>
              <span className="w-4 text-center text-sm font-bold text-white">{settings.quoteCount}</span>
              <button 
                onClick={() => updateCount(Math.min(20, settings.quoteCount + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Manual Quote Inputs */}
        <div className="space-y-4">
           {settings.manualQuotes.map((quote, index) => (
             <div key={index} className="space-y-1 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
               <div className="flex justify-between items-end px-1">
                 <label className="text-xs text-indigo-300/80 font-medium">Quote #{index + 1}</label>
                 {quote.length > 0 && <span className="text-[10px] text-emerald-400">Ready</span>}
               </div>
               <textarea
                 value={quote}
                 onChange={(e) => handleQuoteChange(index, e.target.value)}
                 placeholder={`Type the text for quote #${index + 1} here...`}
                 className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24 shadow-sm"
               />
             </div>
           ))}
           <div ref={quotesEndRef} />
        </div>

        {/* Frequency Control */}
        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" />
              Repeat Frequency
            </label>
            <span className="text-sm font-bold text-indigo-400">{settings.frequencyHours} Hour{settings.frequencyHours > 1 ? 's' : ''}</span>
          </div>
          <div className="relative pt-1">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.frequencyHours}
              onChange={(e) => handleChange('frequencyHours', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 relative z-10"
            />
            <div className="flex justify-between text-[10px] text-slate-500 px-1 mt-2 font-mono">
              <span>1h</span>
              <span>2h</span>
              <span>3h</span>
              <span>4h</span>
              <span>5h</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The app will read the next quote in the list every <strong className="text-slate-200">{settings.frequencyHours} hour{settings.frequencyHours > 1 ? 's' : ''}</strong>. 
            The list will loop indefinitely.
          </p>
        </div>

      </div>

      {/* Footer Action */}
      <div className="flex-none p-6 pt-2 pb-8 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <button
          onClick={onStart}
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-indigo-900/50
            ${!isValid
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
        >
          <Play className="fill-current w-5 h-5" />
          Start Playback
        </button>
      </div>
    </div>
  );
};