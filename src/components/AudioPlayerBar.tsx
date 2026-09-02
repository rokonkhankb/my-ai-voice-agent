import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  FastForward,
  Sparkles,
} from "lucide-react";
import { formatTime, downloadAudio } from "../utils/audioUtils";

interface AudioPlayerBarProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  voiceName?: string;
  styleName?: string;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  loop: boolean;
  onToggleLoop: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioUrl,
  isPlaying,
  onPlay,
  onPause,
  onEnded,
  voiceName = "Kore",
  styleName = "Natural",
  playbackSpeed,
  onChangeSpeed,
  volume,
  onChangeVolume,
  loop,
  onToggleLoop,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch((err) => console.log("Auto-play prevented:", err));
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = loop;
    }
  }, [loop]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      onPlay();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVolumeRef.current || 0.8);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      onChangeVolume(0);
    }
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  if (!audioUrl) return null;

  return (
    <div
      id="audio-player-bar"
      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3 transition-all"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Top info and download */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            Current Audio: <span className="text-indigo-400">{voiceName}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{styleName}</span>
        </div>

        <button
          type="button"
          onClick={() => downloadAudio(audioUrl, `speech-${voiceName.toLowerCase()}-${Date.now()}.wav`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          title="Download WAV audio"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Audio</span>
        </button>
      </div>

      {/* Scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span className="text-indigo-400">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Primary Play / Pause */}
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Loop */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2 rounded-xl transition-colors border ${
              loop
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Loop speech"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                playbackSpeed === s
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              onChangeVolume(parseFloat(e.target.value));
            }}
            className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
