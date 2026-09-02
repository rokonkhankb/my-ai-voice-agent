export type EngineType = "gemini" | "browser";

export interface VoiceOption {
  id: string;
  name: string;
  gender: "Female" | "Male" | "Neutral";
  trait: string;
  recommendedFor: string;
  color: string;
  avatarIcon?: string;
}

export interface DeliveryStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
  promptDirective?: string;
}

export interface GeneratedClip {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  styleId: string;
  styleName: string;
  engine: EngineType;
  audioUrl?: string; // Blob or base64 URL
  audioBase64?: string;
  duration: number; // in seconds
  createdAt: number;
  isFavorite?: boolean;
}

export interface AudioSettings {
  engine: EngineType;
  selectedVoice: string;
  selectedStyle: string;
  customStylePrompt: string;
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0 (mainly for browser Web Speech)
  volume: number; // 0 to 1
  autoPlay: boolean;
  loop: boolean;
}

export interface PresetTemplate {
  id: string;
  title: string;
  category: string;
  text: string;
  recommendedVoice: string;
  recommendedStyle: string;
}
