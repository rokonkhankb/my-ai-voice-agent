/**
 * Audio helpers for Text-to-Speech playback, WAV conversion, and Web Speech API
 */

export class BrowserSpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public isSupported(): boolean {
    return Boolean(this.synth);
  }

  public speak(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onBoundary?: (charIndex: number) => void;
    }
  ) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.getVoices();

    if (options.voiceName) {
      const selected = voices.find((v) => v.name === options.voiceName || v.voiceURI === options.voiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.rate = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0));
    utterance.pitch = Math.max(0.5, Math.min(2.0, options.pitch ?? 1.0));
    utterance.volume = Math.max(0, Math.min(1.0, options.volume ?? 1.0));

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      options.onError?.(e);
    };

    if (options.onBoundary) {
      utterance.onboundary = (event) => {
        if (event.name === "word" || event.name === "sentence") {
          options.onBoundary?.(event.charIndex);
        }
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  public isPaused(): boolean {
    return Boolean(this.synth?.paused);
  }
}

export const browserSpeech = new BrowserSpeechManager();

/**
 * Converts a base64 string to a Blob URL
 */
export function base64ToBlobUrl(base64: string, mimeType: string = "audio/wav"): string {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Triggers browser download for an audio blob / URL
 */
export function downloadAudio(audioUrlOrBase64: string, filename: string = "speech-audio.wav") {
  let url = audioUrlOrBase64;
  let shouldRevoke = false;

  if (audioUrlOrBase64.startsWith("data:") || !audioUrlOrBase64.startsWith("blob:") && !audioUrlOrBase64.startsWith("http")) {
    // Treat as raw base64
    const cleanBase64 = audioUrlOrBase64.replace(/^data:audio\/\w+;base64,/, "");
    url = base64ToBlobUrl(cleanBase64, "audio/wav");
    shouldRevoke = true;
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Formats seconds into mm:ss or m:ss.s
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
