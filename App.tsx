import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quote, AppSettings, AppStatus, PlaybackState } from './types';
import { SettingsForm } from './components/SettingsForm';
import { Player } from './components/Player';
import { generateSpeech } from './services/geminiService';
import { getAudioContext } from './services/audioUtils';

export default function App() {
  // --- State ---
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [settings, setSettings] = useState<AppSettings>({
    quoteCount: 1,
    manualQuotes: [''],
    frequencyHours: 1,
  });
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentQuoteIndex: 0,
    isAudioPlaying: false,
    timeRemainingInInterval: 0,
    totalQuotes: 0
  });
  const [isBuffering, setIsBuffering] = useState(false);

  // --- Refs for managing audio and timers ---
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  // --- Handlers ---

  const handleStart = () => {
    // Filter out empty quotes
    const validQuotes = settings.manualQuotes.filter(q => q.trim() !== '');
    if (validQuotes.length === 0) return;

    // Convert manual strings to Quote objects
    const newQuotes: Quote[] = validQuotes.map((text, i) => ({
      id: `q-${i}`,
      text: text,
    }));
    
    setQuotes(newQuotes);
    setPlaybackState({
      currentQuoteIndex: 0,
      isAudioPlaying: false,
      timeRemainingInInterval: 0, // Start immediately
      totalQuotes: newQuotes.length,
      lastError: undefined
    });
    setStatus(AppStatus.PLAYING);
    isPausedRef.current = false;
    
    // Initialize Audio Context on user gesture
    getAudioContext();
  };

  const handleReset = () => {
    stopAll();
    setStatus(AppStatus.IDLE);
    setQuotes([]);
  };

  const stopAll = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (intervalTimerRef.current) {
      window.clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    setIsBuffering(false);
  }, []);

  const handlePauseResume = () => {
    if (status === AppStatus.PLAYING || status === AppStatus.PAUSED) {
      if (!isPausedRef.current) {
        // Pause
        isPausedRef.current = true;
        setStatus(AppStatus.PAUSED);
        getAudioContext().suspend();
      } else {
        // Resume
        isPausedRef.current = false;
        setStatus(AppStatus.PLAYING);
        getAudioContext().resume();
        
        // If we were in an error state, retry immediately
        if (playbackState.lastError) {
          setPlaybackState(p => ({ ...p, lastError: undefined }));
        }
      }
    }
  };

  // --- Core Loop ---

  const playCurrentQuote = useCallback(async () => {
    if (isPausedRef.current) return;
    
    const quote = quotes[playbackState.currentQuoteIndex];
    if (!quote) return;

    setIsBuffering(true);
    setPlaybackState(p => ({ ...p, lastError: undefined }));

    try {
      // Generate Speech
      const audioBuffer = await generateSpeech(quote.text);
      
      if (isPausedRef.current) {
        setIsBuffering(false);
        return; // Stopped while buffering
      }

      // Play Audio
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      audioSourceRef.current = source;
      
      source.onended = () => {
        setIsBuffering(false);
        setPlaybackState(prev => ({ ...prev, isAudioPlaying: false }));
        scheduleNextPlayback();
      };

      source.start();
      setPlaybackState(prev => ({ ...prev, isAudioPlaying: true }));
      setIsBuffering(false);

    } catch (error: any) {
      console.error("Playback error:", error);
      setIsBuffering(false);
      setPlaybackState(prev => ({ 
        ...prev, 
        lastError: error.message || "Failed to generate audio" 
      }));
      // User must click Play/Resume to retry or Reset.
      isPausedRef.current = true;
      setStatus(AppStatus.PAUSED);
    }
  }, [quotes, playbackState.currentQuoteIndex]);

  const scheduleNextPlayback = useCallback(() => {
    // Convert hours to milliseconds
    const intervalMs = settings.frequencyHours * 3600 * 1000;
    
    // Set target time based on NOW + interval
    const now = Date.now();
    nextPlayTimeRef.current = now + intervalMs;
    
    // Update visual state initially
    setPlaybackState(prev => ({ ...prev, timeRemainingInInterval: intervalMs / 1000 }));

    if (intervalTimerRef.current) window.clearInterval(intervalTimerRef.current);

    // Using setInterval to update UI, but relying on Date.now() for accuracy
    intervalTimerRef.current = window.setInterval(() => {
      if (isPausedRef.current) {
        // If paused, we push the target time forward so we don't skip time while paused
        nextPlayTimeRef.current += 1000;
        return;
      }

      const currentNow = Date.now();
      const remainingMs = nextPlayTimeRef.current - currentNow;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      setPlaybackState(prev => ({ ...prev, timeRemainingInInterval: remainingSeconds }));

      if (remainingSeconds <= 0) {
        if (intervalTimerRef.current) window.clearInterval(intervalTimerRef.current);
        
        // Advance Index Loop
        setPlaybackState(prev => ({ 
          ...prev, 
          currentQuoteIndex: (prev.currentQuoteIndex + 1) % prev.totalQuotes,
          timeRemainingInInterval: 0
        }));
      }
    }, 1000);
  }, [settings.frequencyHours]);


  // Effect to trigger playback when conditions are met
  useEffect(() => {
    if (status === AppStatus.PLAYING && 
        !playbackState.isAudioPlaying && 
        playbackState.timeRemainingInInterval === 0 &&
        !isBuffering &&
        !playbackState.lastError) {
      playCurrentQuote();
    }
  }, [status, playbackState.currentQuoteIndex, playbackState.timeRemainingInInterval, playbackState.isAudioPlaying, isBuffering, playbackState.lastError, playCurrentQuote]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // --- Render ---

  return (
    // Use h-[100dvh] for correct mobile viewport height (Dynamic Viewport Height)
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-200 selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      {status === AppStatus.IDLE ? (
        <SettingsForm 
          settings={settings}
          onSettingsChange={setSettings}
          onStart={handleStart}
          status={status}
        />
      ) : (
        <Player 
          quotes={quotes}
          playbackState={playbackState}
          onPauseResume={handlePauseResume}
          onReset={handleReset}
          isBuffering={isBuffering}
        />
      )}
    </div>
  );
}