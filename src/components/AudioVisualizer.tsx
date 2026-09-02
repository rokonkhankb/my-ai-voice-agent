import React, { useEffect, useRef } from "react";
import { Volume2, Sparkles, Activity } from "lucide-react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  isGenerating: boolean;
  voiceName?: string;
  styleName?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isGenerating,
  voiceName = "Kore",
  styleName = "Natural",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const barCount = 48;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount - 2;
      phase += isPlaying ? 0.12 : isGenerating ? 0.08 : 0.02;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic lively sine-wave simulation with harmonic richness
          const wave1 = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const wave2 = Math.cos(phase * 1.5 + i * 0.15) * 0.3 + 0.3;
          const wave3 = Math.sin(phase * 0.8 + i * 0.5) * 0.2 + 0.2;
          const combined = (wave1 + wave2 + wave3) / 1.0;
          barHeight = Math.max(6, combined * (height * 0.85));
        } else if (isGenerating) {
          // Pulsing scanning wave
          const wave = Math.sin(phase + i * 0.2) * 0.5 + 0.5;
          barHeight = Math.max(6, wave * (height * 0.55));
        } else {
          // Gentle breathing idle state
          const wave = Math.sin(phase + i * 0.1) * 0.5 + 0.5;
          barHeight = 4 + wave * 6;
        }

        const x = i * (barWidth + 2) + 1;
        const y = (height - barHeight) / 2;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, "#6366f1"); // indigo-500
          gradient.addColorStop(0.5, "#818cf8"); // indigo-400
          gradient.addColorStop(1, "#38bdf8"); // sky-400
        } else if (isGenerating) {
          gradient.addColorStop(0, "#38bdf8"); // sky-400
          gradient.addColorStop(1, "#6366f1"); // indigo-500
        } else {
          gradient.addColorStop(0, "#334155"); // slate-700
          gradient.addColorStop(1, "#1e293b"); // slate-800
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2]);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isGenerating]);

  return (
    <div
      id="audio-visualizer-container"
      className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between shadow-xl"
    >
      <div className="flex items-center justify-between gap-3 mb-2 z-10">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying
                ? "bg-indigo-400 animate-ping"
                : isGenerating
                ? "bg-indigo-400 animate-pulse"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-indigo-400">
            {isPlaying
              ? "Live Playback Active"
              : isGenerating
              ? "Synthesizing Audio..."
              : "Studio Audio Waveform"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
            {voiceName}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            {styleName}
          </span>
        </div>
      </div>

      <div className="relative h-16 sm:h-20 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={80}
          className="w-full h-full block rounded-lg"
        />

        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-lg gap-2 text-indigo-300 text-sm font-medium">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Rendering neural voice with intention...</span>
          </div>
        )}
      </div>
    </div>
  );
};
