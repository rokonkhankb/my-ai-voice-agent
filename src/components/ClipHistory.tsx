import React from "react";
import { GeneratedClip } from "../types";
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Bookmark,
  Sparkles,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { formatTime, downloadAudio } from "../utils/audioUtils";

interface ClipHistoryProps {
  clips: GeneratedClip[];
  activeClipId: string | null;
  isPlaying: boolean;
  onPlayClip: (clip: GeneratedClip) => void;
  onPauseClip: () => void;
  onDeleteClip: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onReuseText: (text: string, voiceId: string, styleId: string) => void;
  onClearHistory: () => void;
}

export const ClipHistory: React.FC<ClipHistoryProps> = ({
  clips,
  activeClipId,
  isPlaying,
  onPlayClip,
  onPauseClip,
  onDeleteClip,
  onToggleFavorite,
  onReuseText,
  onClearHistory,
}) => {
  if (clips.length === 0) {
    return (
      <div
        id="clip-history-empty"
        className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 text-center text-slate-500 space-y-2"
      >
        <History className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
        <h4 className="text-sm font-semibold text-slate-300">No Speech Clips Yet</h4>
        <p className="text-xs max-w-xs mx-auto text-slate-500 font-light">
          Type text above, pick a voice and style, and hit "Speak Text" to generate your first audio track.
        </p>
      </div>
    );
  }

  return (
    <div
      id="clip-history-section"
      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-3 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-300">
            Speech History ({clips.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {clips.map((clip) => {
          const isActive = activeClipId === clip.id;
          const isThisPlaying = isActive && isPlaying;

          return (
            <div
              key={clip.id}
              id={`clip-item-${clip.id}`}
              className={`group p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-slate-950 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isThisPlaying) {
                        onPauseClip();
                      } else {
                        onPlayClip(clip);
                      }
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                      isThisPlaying
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800 text-slate-200 hover:bg-indigo-600 hover:text-white"
                    }`}
                    title={isThisPlaying ? "Pause" : "Play"}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                      "{clip.text}"
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="font-semibold text-indigo-300">
                        {clip.voiceName}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{clip.styleName}</span>
                      <span>•</span>
                      <span className="text-slate-500">
                        {formatTime(clip.duration)}
                      </span>
                      <span>•</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(clip.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clip Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onReuseText(clip.text, clip.voiceId, clip.styleId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                    title="Load text & voice into editor"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {clip.audioUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadAudio(
                          clip.audioUrl!,
                          `speech-${clip.voiceName.toLowerCase()}-${clip.id}.wav`
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Download audio"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteClip(clip.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
