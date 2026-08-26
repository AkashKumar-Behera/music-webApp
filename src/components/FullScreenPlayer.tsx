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
    isLyricsOpen,
    isQueueOpen,
    isFullScreenPlayerOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleRepeat,
    toggleShuffle,
    setVolume,
    toggleMute,
    setCurrentTime,
    toggleFullScreenPlayer,
    toggleLyrics,
    toggleQueue,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  if (!isFullScreenPlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDragTime(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    setIsDragging(false);
    setCurrentTime(dragTime);
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = dragTime;
    }
  };

  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = duration || currentTrack.duration || 1;
  const displayTime = isDragging ? dragTime : currentTime;
  const seekProgress = Math.min(100, Math.max(0, (displayTime / totalDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-in slide-in-from-bottom duration-300 select-none">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Bar (Collapse Button & Title) */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <button
          onClick={toggleFullScreenPlayer}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Now Playing</p>
          <p className="text-xs text-zinc-300 font-medium truncate max-w-[200px] sm:max-w-md">
            {currentTrack.album || currentTrack.title}
          </p>
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${
            isLiked ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Center Section: Big Album Artwork & Track Info */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 my-auto w-full max-w-4xl mx-auto py-6">
        {/* Artwork */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/40 border border-white/10 flex-shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.thumbnail || '/placeholder.png'}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
        </div>

        {/* Metadata & Lyrics Link */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-md w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight line-clamp-2 leading-tight mb-2">
            {currentTrack.title}
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 font-medium mb-3 truncate w-full">
            {currentTrack.artist}
          </p>

          {currentTrack.album && (
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-6">
              {currentTrack.album}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Lossless Stream
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold tracking-wide">
              Lyrics Available
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Progress Bar, Controls & Drawer Buttons */}
      <div className="w-full max-w-3xl mx-auto space-y-5">
        {/* Progress Bar & Timestamps */}
        <div className="space-y-1.5">
          <div className="relative group/timeline w-full flex items-center py-2 cursor-pointer">
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={displayTime}
              onChange={handleSeekChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={handleSeekCommit}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={handleSeekCommit}
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
            />
            {/* Track Background */}
            <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden group-hover/timeline:h-2 transition-all">
              {/* Active Fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-400 rounded-full"
                style={{ width: `${seekProgress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 px-0.5">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
            className={`p-2.5 rounded-full transition-colors ${
              isShuffled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Main 3 Controls (Prev, Play/Pause, Next) */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={prevTrack}
              title="Previous"
              className="p-3 text-zinc-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-8 h-8 fill-black" />
              ) : (
                <Play className="w-8 h-8 fill-black translate-x-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next"
              className="p-3 text-zinc-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`p-2.5 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Actions & Volume Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
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
          </div>

          {/* Volume slider (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 group/range pl-2 py-1 px-2.5 rounded-xl bg-white/[0.04] border border-white/5">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-emerald-400 bg-white/20 rounded-lg cursor-pointer opacity-70 group-hover/range:opacity-100 transition-opacity"
            />
            <span className="text-[10px] font-semibold text-zinc-400 w-6 text-right tabular-nums">
              {currentVolPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
