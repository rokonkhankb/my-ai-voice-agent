import React from "react";
import { EngineType } from "../types";
import { Sparkles, Globe, Cpu, Sliders, Volume2 } from "lucide-react";

interface EngineToggleProps {
  engine: EngineType;
  onChangeEngine: (engine: EngineType) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  pitch: number;
  onChangePitch: (pitch: number) => void;
  browserVoices: SpeechSynthesisVoice[];
  selectedBrowserVoice: string;
  onSelectBrowserVoice: (name: string) => void;
}

export const EngineToggle: React.FC<EngineToggleProps> = ({
  engine,
  onChangeEngine,
  speed,
  onChangeSpeed,
  pitch,
  onChangePitch,
  browserVoices,
  selectedBrowserVoice,
  onSelectBrowserVoice,
}) => {
  return (
    <div
      id="engine-settings-card"
      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-300">
            Engine & Modulation
          </h3>
        </div>

        {/* Engine switcher tabs */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onChangeEngine("gemini")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              engine === "gemini"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Neural 2.0 (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeEngine("browser")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              engine === "browser"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Browser TTS</span>
          </button>
        </div>
      </div>

      {engine === "browser" && browserVoices.length > 0 && (
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            System Device Voice ({browserVoices.length} available)
          </label>
          <select
            value={selectedBrowserVoice}
            onChange={(e) => onSelectBrowserVoice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
          >
            {browserVoices.map((v) => (
              <option key={v.voiceURI} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Modulation Sliders with Geometric Balance theme */}
      <div className="space-y-4 pt-1">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500 tracking-wider uppercase font-semibold">SPEED PACING</span>
            <span className="text-indigo-400 font-bold">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500 tracking-wider uppercase font-semibold">PITCH MODULATION</span>
            <span className="text-indigo-400 font-bold">{pitch > 1 ? `+${(pitch - 1).toFixed(2)}` : pitch < 1 ? `-${(1 - pitch).toFixed(2)}` : "0.00"}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={pitch}
            onChange={(e) => onChangePitch(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
