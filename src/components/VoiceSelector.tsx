import React from "react";
import { VoiceOption } from "../types";
import { User, Volume2, Sparkles, Check, Mic } from "lucide-react";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice?: (voice: VoiceOption) => void;
  isPreviewing?: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onPreviewVoice,
  isPreviewing,
}) => {
  return (
    <div id="voice-selector-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-300">
            Voice Selection
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          6 Neural Personas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isThisPreviewing = isPreviewing === voice.id;

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id.toLowerCase()}`}
              onClick={() => onSelectVoice(voice.id)}
              className={`relative cursor-pointer group rounded-xl p-3.5 transition-all duration-200 text-left border ${
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/40"
                  : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                    }`}
                  >
                    {voice.name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-sm ${isSelected ? "text-indigo-200" : "text-slate-100"}`}>
                        {voice.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {voice.gender}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                      {voice.trait}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate pr-2">{voice.recommendedFor}</span>
                {onPreviewVoice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(voice);
                    }}
                    className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isThisPreviewing
                        ? "bg-indigo-500 text-white animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                    title={`Test listen to ${voice.name}`}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isThisPreviewing ? "Playing" : "Preview"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
