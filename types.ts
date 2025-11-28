export interface Quote {
  id: string;
  text: string;
  author?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

export interface AppSettings {
  quoteCount: number;
  manualQuotes: string[];
  frequencyHours: number;
}

export interface PlaybackState {
  currentQuoteIndex: number;
  isAudioPlaying: boolean;
  timeRemainingInInterval: number; // in seconds
  totalQuotes: number;
  lastError?: string;
}