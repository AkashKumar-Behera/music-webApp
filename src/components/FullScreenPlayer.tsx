'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Mic2,
  Download,
  Loader2,
  Music,
  ChevronDown,
  Heart,
} from 'lucide-react';

export const FullScreenPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isFullScreenPlayerOpen,
    isLyricsOpen,
    isQueueOpen,
    toggleFullScreenPlayer,
    togglePlay,
    setCurrentTime,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleLyrics,
    toggleQueue,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  if (!isFullScreenPlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
    if (typeof window !== 'undefined') {
      try {
        const yt = (window as any).YT?.get?.('hidden-yt-player');
        if (yt && typeof yt.seekTo === 'function') {
          yt.seekTo(newTime, true);
        }
      } catch (e) {}
    }
  };

  const handleDownload = () => {
    if (!currentTrack) return;
    const a = document.createElement('a');
    a.href = `/api/stream?id=${currentTrack.id}`;
    a.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = duration || currentTrack.duration || 1;
  const seekProgress = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-in slide-in-from-bottom duration-300 select-none">
      {/* Dynamic Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-full h-full object-cover scale-150 blur-3xl opacity-25 filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pt-1">
        <button
          onClick={toggleFullScreenPlayer}
          title="Minimize (Esc)"
          className="p-2.5 sm:p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/10"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center px-4">
          <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Now Playing</p>
          <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {currentTrack.album || 'CloudBeatz High-Fidelity'}
          </p>
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-2.5 sm:p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 border border-white/10 ${
            isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Center Stage: Artwork & Song Info */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-14 max-w-4xl mx-auto w-full my-4 sm:my-6">
        {/* Album Artwork */}
        <div className="relative aspect-square w-52 sm:w-64 md:w-80 lg:w-96 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/15 group flex-shrink-0">
          {currentTrack.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <Music className="w-20 h-20" />
            </div>
          )}

          <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-3xl pointer-events-none" />
        </div>

        {/* Info & Metadata */}
        <div className="flex flex-col justify-center text-center md:text-left max-w-md space-y-2 sm:space-y-3 px-2">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-medium text-emerald-400 truncate">{currentTrack.artist}</p>
          </div>
          {currentTrack.album && (
            <p className="text-[11px] sm:text-xs text-zinc-400 tracking-wide uppercase font-semibold">{currentTrack.album}</p>
          )}

          <div className="pt-1 flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Lossless Stream
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-zinc-400 border border-white/10">
              Lyrics Available
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls & Seekbar */}
      <div className="relative z-10 max-w-3xl mx-auto w-full space-y-4 sm:space-y-6 pb-2">
        {/* Seekbar */}
        <div className="space-y-1.5 group/range">
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, #10b981 ${seekProgress}%, rgba(255,255,255,0.15) ${seekProgress}%)`,
            }}
            className="w-full h-1.5 sm:h-2 hover:h-2.5 rounded-lg cursor-pointer transition-all"
          />
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Playback Controls & Action Row */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              className={`p-2.5 sm:p-3 rounded-2xl transition-all ${
                isShuffled
                  ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={prevTrack}
              title="Previous"
              className="p-2 sm:p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next"
              className="p-2 sm:p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              title={`Repeat: ${repeatMode}`}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all ${
                repeatMode !== 'off'
                  ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Quick Actions Row (Lyrics, Queue, Download, Volume) */}
          <div className="flex items-center justify-center sm:justify-between gap-3 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLyrics}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isLyricsOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Mic2 className="w-4 h-4" />
                <span>Lyrics</span>
              </button>

              <button
                onClick={toggleQueue}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isQueueOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Queue</span>
              </button>

              <button
                onClick={handleDownload}
                className="p-2.5 rounded-xl text-xs font-semibold bg-white/5 text-zinc-300 hover:text-emerald-400 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>

            {/* Volume slider (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 group/range pl-2 py-1 px-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #10b981 ${currentVolPercent}%, rgba(255,255,255,0.15) ${currentVolPercent}%)`,
                }}
                className="w-16 h-1.5 hover:h-2 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono font-medium text-zinc-400 w-8 text-right select-none">
                {currentVolPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
