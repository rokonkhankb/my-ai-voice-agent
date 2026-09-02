import React from "react";
import { DeliveryStyle } from "../types";
import {
  MessageSquare,
  Smile,
  Moon,
  Flame,
  Radio,
  BookOpen,
  Eye,
  Zap,
  Heart,
  Cpu,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

interface StyleSelectorProps {
  styles: DeliveryStyle[];
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  customPrompt: string;
  onChangeCustomPrompt: (prompt: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-3.5 h-3.5" />,
  Smile: <Smile className="w-3.5 h-3.5" />,
  Moon: <Moon className="w-3.5 h-3.5" />,
  Flame: <Flame className="w-3.5 h-3.5" />,
  Radio: <Radio className="w-3.5 h-3.5" />,
  BookOpen: <BookOpen className="w-3.5 h-3.5" />,
  Eye: <Eye className="w-3.5 h-3.5" />,
  Zap: <Zap className="w-3.5 h-3.5" />,
  Heart: <Heart className="w-3.5 h-3.5" />,
  Cpu: <Cpu className="w-3.5 h-3.5" />,
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  styles,
  selectedStyle,
  onSelectStyle,
  customPrompt,
  onChangeCustomPrompt,
}) => {
  const [showCustom, setShowCustom] = React.useState(Boolean(customPrompt));

  return (
    <div id="style-selector-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-300">
            Delivery Tone & Emotion
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCustom(!showCustom);
            if (!showCustom && !customPrompt) {
              onChangeCustomPrompt("with breathless excitement and wide-eyed wonder");
            }
          }}
          className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
            showCustom
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
              : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{showCustom ? "Custom Active" : "Custom Directive"}</span>
        </button>
      </div>

      {showCustom ? (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2">
          <label className="text-xs font-medium text-indigo-300 flex items-center justify-between">
            <span>Custom Acting & Cadence Directive</span>
            <span className="text-[11px] font-mono text-slate-500">e.g. "whisper with suspense"</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => onChangeCustomPrompt(e.target.value)}
              placeholder="e.g., cheerfully with an upbeat rhythm, or softly like a cozy bedtime story..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => {
                onChangeCustomPrompt("");
                setShowCustom(false);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id && !showCustom;
          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => {
                setShowCustom(false);
                onChangeCustomPrompt("");
                onSelectStyle(style.id);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150 ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-500 font-semibold shadow-md shadow-indigo-950/40"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80"
              }`}
              title={style.description}
            >
              <span className={isSelected ? "text-white" : "text-indigo-400"}>
                {ICON_MAP[style.icon] || <Sparkles className="w-3.5 h-3.5" />}
              </span>
              <span>{style.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
