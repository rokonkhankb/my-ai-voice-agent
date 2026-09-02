import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Play,
  Pause,
  Sparkles,
  Volume2,
  Settings2,
  AlertCircle,
  CheckCircle2,
  History,
  RotateCcw,
  Square,
  Wand2,
  Download,
  Info,
  Radio,
} from "lucide-react";
import {
  EngineType,
  GeneratedClip,
  PresetTemplate,
  VoiceOption,
} from "./types";
import { GEMINI_VOICES, DELIVERY_STYLES, PRESET_TEMPLATES } from "./data/presets";
import {
  browserSpeech,
  base64ToBlobUrl,
  downloadAudio,
} from "./utils/audioUtils";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { VoiceSelector } from "./components/VoiceSelector";
import { StyleSelector } from "./components/StyleSelector";
import { TextScriptEditor } from "./components/TextScriptEditor";
import { AudioPlayerBar } from "./components/AudioPlayerBar";
import { ClipHistory } from "./components/ClipHistory";
import { EngineToggle } from "./components/EngineToggle";

const LOCAL_STORAGE_KEY = "tts_studio_history_v1";

export default function App() {
  // Input State
  const [text, setText] = useState<string>(
    "Welcome to the Text to Speech Studio. Type any text here, choose your favorite voice persona and delivery style, and listen to natural, lifelike speech spoken aloud."
  );
  const [engine, setEngine] = useState<EngineType>("gemini");
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [selectedStyle, setSelectedStyle] = useState<string>("natural");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Speech Adjustments
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.9);
  const [loop, setLoop] = useState<number | boolean>(false);

  // Audio Playback & Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // Active audio URL & metadata
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // Clip History
  const [clips, setClips] = useState<GeneratedClip[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Browser system voices
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>("");

  // Error / Toast state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clips));
    } catch (e) {
      console.warn("Unable to save history to localStorage", e);
    }
  }, [clips]);

  // Load browser voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = browserSpeech.getVoices();
      setBrowserVoices(voices);
      if (voices.length > 0 && !selectedBrowserVoice) {
        const defaultVoice = voices.find((v) => v.default || v.lang.startsWith("en")) || voices[0];
        setSelectedBrowserVoice(defaultVoice.name);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Enter to trigger speech
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSpeak();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, selectedVoice, selectedStyle, customPrompt, engine, speed, pitch, volume]);

  const activeVoiceObj = GEMINI_VOICES.find((v) => v.id === selectedVoice) || GEMINI_VOICES[0];
  const activeStyleObj = DELIVERY_STYLES.find((s) => s.id === selectedStyle) || DELIVERY_STYLES[0];

  // Stop all active audio
  const handleStopAll = () => {
    browserSpeech.stop();
    setIsPlaying(false);
    setPreviewingVoice(null);
  };

  // Voice Preview test button
  const handlePreviewVoice = async (voice: VoiceOption) => {
    handleStopAll();
    setPreviewingVoice(voice.id);

    const previewPhrase = `Hello! I'm ${voice.name}. Let's bring your words to life.`;

    if (engine === "gemini") {
      try {
        const res = await fetch("/api/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: previewPhrase,
            voice: voice.id,
            style: "natural",
          }),
        });

        const data = await res.json();
        if (data.audioBase64) {
          const blobUrl = base64ToBlobUrl(data.audioBase64, "audio/wav");
          setCurrentAudioUrl(blobUrl);
          setIsPlaying(true);
        } else {
          // Fallback to browser speech
          browserSpeech.speak(previewPhrase, {
            rate: 1.0,
            onStart: () => setIsPlaying(true),
            onEnd: () => {
              setIsPlaying(false);
              setPreviewingVoice(null);
            },
          });
        }
      } catch {
        browserSpeech.speak(previewPhrase, {
          rate: 1.0,
          onStart: () => setIsPlaying(true),
          onEnd: () => {
            setIsPlaying(false);
            setPreviewingVoice(null);
          },
        });
      }
    } else {
      browserSpeech.speak(previewPhrase, {
        voiceName: selectedBrowserVoice,
        rate: speed,
        pitch: pitch,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          setPreviewingVoice(null);
        },
      });
    }
  };

  // Main Speech Synthesis
  const handleSpeak = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter some text to speak aloud.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setErrorMessage(null);
    handleStopAll();

    // Mode 1: Browser Web Speech API
    if (engine === "browser") {
      setIsPlaying(true);
      browserSpeech.speak(text, {
        voiceName: selectedBrowserVoice,
        rate: speed,
        pitch: pitch,
        volume: volume,
        onStart: () => {
          setIsPlaying(true);
        },
        onEnd: () => {
          setIsPlaying(false);
        },
        onError: (err) => {
          setIsPlaying(false);
          setErrorMessage("Browser speech error. Try another voice or switch to Studio AI.");
        },
      });

      // Add to history
      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        text: text.trim(),
        voiceId: selectedBrowserVoice || "System Voice",
        voiceName: selectedBrowserVoice || "Device TTS",
        styleId: "browser",
        styleName: "Browser Speech",
        engine: "browser",
        duration: Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5)),
        createdAt: Date.now(),
      };
      setClips((prev) => [newClip, ...prev.slice(0, 24)]);
      setActiveClipId(newClip.id);
      return;
    }

    // Mode 2: Gemini Studio Neural TTS
    setIsGenerating(true);
    try {
      const response = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          style: selectedStyle,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || "Failed to synthesize speech audio.");
      }

      const audioBlobUrl = base64ToBlobUrl(data.audioBase64, "audio/wav");
      setCurrentAudioUrl(audioBlobUrl);
      setIsPlaying(true);

      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        text: text.trim(),
        voiceId: activeVoiceObj.id,
        voiceName: activeVoiceObj.name,
        styleId: customPrompt ? "custom" : activeStyleObj.id,
        styleName: customPrompt ? `Custom: ${customPrompt}` : activeStyleObj.name,
        engine: "gemini",
        audioUrl: audioBlobUrl,
        audioBase64: data.audioBase64,
        duration: data.duration || 3,
        createdAt: Date.now(),
      };

      setClips((prev) => [newClip, ...prev.slice(0, 24)]);
      setActiveClipId(newClip.id);
      setStatusMessage("Speech generated successfully!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error("Speech generation failed:", err);
      setErrorMessage(
        err?.message || "Synthesis failed. Falling back to Instant Browser Speech..."
      );

      // Graceful fallback to browser speech so the user still hears it spoken!
      browserSpeech.speak(text, {
        rate: speed,
        pitch: pitch,
        volume: volume,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Script Enhancer
  const handleOptimizeText = async (goal: string) => {
    if (!text.trim()) return;
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/tts/optimize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, goal }),
      });
      const data = await res.json();
      if (data.optimizedText) {
        setText(data.optimizedText);
        setStatusMessage("Script enhanced for speech!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not optimize text.");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply Preset Template
  const handleApplyPreset = (preset: PresetTemplate) => {
    setText(preset.text);
    setSelectedVoice(preset.recommendedVoice);
    setSelectedStyle(preset.recommendedStyle);
    setCustomPrompt("");
    setStatusMessage(`Loaded "${preset.title}" preset`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // History Actions
  const handlePlayClip = (clip: GeneratedClip) => {
    handleStopAll();
    setActiveClipId(clip.id);

    if (clip.audioUrl || clip.audioBase64) {
      const url = clip.audioUrl || base64ToBlobUrl(clip.audioBase64!, "audio/wav");
      setCurrentAudioUrl(url);
      setIsPlaying(true);
    } else {
      browserSpeech.speak(clip.text, {
        rate: speed,
        pitch: pitch,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (activeClipId === id) {
      setActiveClipId(null);
      setCurrentAudioUrl(null);
      setIsPlaying(false);
    }
  };

  const handleClearHistory = () => {
    setClips([]);
    setActiveClipId(null);
    setCurrentAudioUrl(null);
    setIsPlaying(false);
  };

  const handleReuseText = (clipText: string, voiceId: string, styleId: string) => {
    setText(clipText);
    if (GEMINI_VOICES.some((v) => v.id === voiceId)) {
      setSelectedVoice(voiceId);
    }
    if (DELIVERY_STYLES.some((s) => s.id === styleId)) {
      setSelectedStyle(styleId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
      {/* Top Header Bar */}
      <header
        id="app-header"
        className="sticky top-0 z-40 bg-slate-900/75 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Vocalise</span>
                <span className="text-indigo-400">Studio</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[11px] uppercase tracking-widest font-mono font-semibold text-slate-400">
                Engine: {engine === "gemini" ? "Neural 2.0" : "Browser TTS"}
              </span>
            </div>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <button
              type="button"
              onClick={() => handleApplyPreset(PRESET_TEMPLATES[0])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
            >
              Demo Script
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error / Status Toasts */}
        {errorMessage && (
          <div
            id="error-toast"
            className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {statusMessage && (
          <div
            id="status-toast"
            className="p-3 rounded-xl bg-slate-900 border border-indigo-500/50 text-indigo-300 text-xs flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Live Audio Visualizer Banner */}
        <AudioVisualizer
          isPlaying={isPlaying}
          isGenerating={isGenerating}
          voiceName={engine === "gemini" ? activeVoiceObj.name : selectedBrowserVoice || "Device Voice"}
          styleName={customPrompt ? "Custom Directive" : activeStyleObj.name}
        />

        {/* Studio Grid: 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Script Editor & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TextScriptEditor
              text={text}
              onChangeText={setText}
              onApplyPreset={handleApplyPreset}
              isGenerating={isGenerating}
              onOptimizeText={handleOptimizeText}
              isOptimizing={isOptimizing}
            />

            {/* Voice Style Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <StyleSelector
                styles={DELIVERY_STYLES}
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
                customPrompt={customPrompt}
                onChangeCustomPrompt={setCustomPrompt}
              />
            </div>

            {/* Action Bar (Big CTA Button) */}
            <div
              id="action-bar-container"
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="text-xs text-slate-400 text-center sm:text-left">
                <p className="font-medium text-slate-200">
                  Target Voice: <span className="text-indigo-400 font-semibold">{activeVoiceObj.name}</span> ({customPrompt ? "Custom Directive" : activeStyleObj.name})
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Ctrl + Enter</kbd>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isPlaying && (
                  <button
                    type="button"
                    onClick={handleStopAll}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current text-rose-400" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  type="button"
                  id="speak-text-btn"
                  disabled={isGenerating || !text.trim()}
                  onClick={handleSpeak}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Voice...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Speak Again</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Generate & Speak</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Audio Player Bar (when audio is ready) */}
            <AudioPlayerBar
              audioUrl={currentAudioUrl}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              voiceName={activeVoiceObj.name}
              styleName={customPrompt ? "Custom Directive" : activeStyleObj.name}
              playbackSpeed={speed}
              onChangeSpeed={setSpeed}
              volume={volume}
              onChangeVolume={setVolume}
              loop={Boolean(loop)}
              onToggleLoop={() => setLoop(!loop)}
            />
          </div>

          {/* Right Column: Voice Personas & History (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice Cards */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <VoiceSelector
                voices={GEMINI_VOICES}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                onPreviewVoice={handlePreviewVoice}
                isPreviewing={previewingVoice}
              />
            </div>

            {/* Engine & Modulation Settings */}
            <EngineToggle
              engine={engine}
              onChangeEngine={setEngine}
              speed={speed}
              onChangeSpeed={setSpeed}
              pitch={pitch}
              onChangePitch={setPitch}
              browserVoices={browserVoices}
              selectedBrowserVoice={selectedBrowserVoice}
              onSelectBrowserVoice={setSelectedBrowserVoice}
            />

            {/* Speech Clips History */}
            <ClipHistory
              clips={clips}
              activeClipId={activeClipId}
              isPlaying={isPlaying}
              onPlayClip={handlePlayClip}
              onPauseClip={handleStopAll}
              onDeleteClip={handleDeleteClip}
              onToggleFavorite={() => {}}
              onReuseText={handleReuseText}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 bg-slate-950 border-t border-slate-900 flex items-center justify-between px-6 sm:px-8 text-[11px] font-mono text-slate-500">
        <div className="uppercase tracking-widest font-medium text-slate-400">
          Ready to synthesize speech
        </div>
        <div className="flex gap-4 text-slate-500">
          <span>Engine: Neural 2.0</span>
          <span>Latency: ~240ms</span>
        </div>
      </footer>
    </div>
  );
}
