import React, { useState } from "react";
import { PresetTemplate } from "../types";
import { PRESET_TEMPLATES } from "../data/presets";
import {
  FileText,
  Trash2,
  BookOpen,
  Sparkles,
  Clock,
  Wand2,
  Copy,
  Check,
  ChevronDown,
  Bot,
  Flame,
} from "lucide-react";

interface TextScriptEditorProps {
  text: string;
  onChangeText: (text: string) => void;
  onApplyPreset: (preset: PresetTemplate) => void;
  isGenerating: boolean;
  onOptimizeText?: (goal: string, provider?: "claude" | "gemini") => Promise<void>;
  isOptimizing?: boolean;
}

export const TextScriptEditor: React.FC<TextScriptEditorProps> = ({
  text,
  onChangeText,
  onApplyPreset,
  isGenerating,
  onOptimizeText,
  isOptimizing = false,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showEnhancerMenu, setShowEnhancerMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleInsertPause = () => {
    const pauseTag = ` ... `;
    onChangeText(text + pauseTag);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="text-script-editor"
      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col gap-3 shadow-xl"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-indigo-400">
            Input Text & Script
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset templates picker */}
          <div className="relative">
            <button
              type="button"
              id="presets-menu-btn"
              onClick={() => {
                setShowPresets(!showPresets);
                setShowEnhancerMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sample Scripts</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPresets && (
              <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-2 max-h-80 overflow-y-auto space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Select a Sample Script
                </div>
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onApplyPreset(preset);
                      setShowPresets(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      <span>{preset.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Script Polish / Director */}
          {onOptimizeText && (
            <div className="relative">
              <button
                type="button"
                id="ai-polish-btn"
                disabled={isOptimizing || !text.trim()}
                onClick={() => {
                  setShowEnhancerMenu(!showEnhancerMenu);
                  setShowPresets(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 rounded-lg border border-amber-500/40 transition-colors disabled:opacity-40"
              >
                <Bot className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
                <span>{isOptimizing ? "Claude Polishing..." : "AI Director (Claude / AI)"}</span>
                <ChevronDown className="w-3 h-3 text-amber-400/80" />
              </button>

              {showEnhancerMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em] flex items-center justify-between">
                    <span>Claude Script Enhancement</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Claude 3.7</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOptimizeText("clarity", "claude");
                      setShowEnhancerMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col"
                  >
                    <span className="font-semibold text-amber-300">Claude Natural Speech Cadence</span>
                    <span className="text-[10px] text-slate-400">Optimizes rhythm, breathing & realistic pauses</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOptimizeText("story", "claude");
                      setShowEnhancerMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col"
                  >
                    <span className="font-semibold text-emerald-300">Claude Cinematic Storytelling</span>
                    <span className="text-[10px] text-slate-400">Vivid imagery and dramatic pacing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOptimizeText("podcast", "claude");
                      setShowEnhancerMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col"
                  >
                    <span className="font-semibold text-sky-300">Claude Podcast Host Delivery</span>
                    <span className="text-[10px] text-slate-400">Engaging hooks, upbeat flow and conversational tone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOptimizeText("concise", "claude");
                      setShowEnhancerMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col"
                  >
                    <span className="font-semibold text-indigo-300">Concise Voiceover Edit</span>
                    <span className="text-[10px] text-slate-400">Punchy, crisp and easy-to-read aloud</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copy text */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
            title="Copy script"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear text */}
          <button
            type="button"
            onClick={() => onChangeText("")}
            disabled={!text.trim() || isGenerating}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors disabled:opacity-40"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="speech-script-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Type or paste your script here..."
          rows={5}
          disabled={isGenerating}
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-4 text-slate-200 placeholder-slate-600 font-sans text-base sm:text-lg leading-relaxed resize-y min-h-[140px] focus:outline-hidden disabled:opacity-60 transition-all font-light"
        />
      </div>

      {/* Footer helpers & Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">QUICK PACING:</span>
          <button
            type="button"
            onClick={handleInsertPause}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors text-[11px] font-mono border border-slate-700/60"
            title="Insert a short natural pause"
          >
            + Pause (...)
          </button>
          <button
            type="button"
            onClick={() => onChangeText(text ? `${text} — ` : "")}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors text-[11px] font-mono border border-slate-700/60"
            title="Insert dramatic dash"
          >
            + Em-Dash (—)
          </button>
        </div>

        <div className="flex items-center gap-4 text-slate-500 font-mono text-xs">
          <span>
            <strong className="text-slate-300 font-semibold">{wordCount}</strong> words
          </span>
          <span>
            <strong className="text-indigo-400 font-semibold">{charCount}</strong> / 5000 chars
          </span>
        </div>
      </div>
    </div>
  );
};
