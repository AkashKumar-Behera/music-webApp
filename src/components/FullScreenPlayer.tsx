'use client';

import React, { useState, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Infinity as InfinityIcon,
  Mic2,
  ChevronDown,
  Heart,
  MoreVertical,
  ListMusic,
} from 'lucide-react';

export const FullScreenPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
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
    setCurrentTime,
    setIsFullScreenPlayerOpen,
    toggleLyrics,
    toggleQueue,
    toggleFavorite,
    isFavorite,
  } = usePlayerStore();

  const { dominantColor, backgroundColor, themeMode } = useThemeStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  // Swipe Down Gestures
  const touchStartY = useRef<number | null>(null);

  if (!isFullScreenPlayerOpen || !currentTrack) return null;

  const isLiked = isFavorite(currentTrack.id);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 60) {
      // Swiped down -> Minimize
      setIsFullScreenPlayerOpen(false);
    }
    touchStartY.current = null;
  };

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

  const totalDuration = duration || currentTrack.duration || 1;
  const displayTime = isDragging ? dragTime : currentTime;
  const seekProgress = Math.min(100, Math.max(0, (displayTime / totalDuration) * 100));

  const activeBg =
    themeMode === 'dark'
      ? '#09090b'
      : themeMode === 'dynamic'
      ? backgroundColor || '#160913'
      : '#09090b';

  const accentBtnBg =
    themeMode === 'dynamic' && dominantColor ? dominantColor : '#e11d48';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ backgroundColor: activeBg }}
      className="fixed inset-0 z-50 flex flex-col justify-between p-5 sm:p-8 md:p-10 overflow-y-auto animate-in slide-in-from-bottom duration-300 select-none transition-colors duration-500"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2">
        <button
          onClick={() => setIsFullScreenPlayerOpen(false)}
          className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Minimize (Swipe Down)"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        <div className="w-8 h-1 bg-white/20 rounded-full sm:hidden" />

        <button
          onClick={toggleQueue}
          className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Options / Queue"
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Center Section: Big Square Album Artwork */}
      <div className="my-auto flex flex-col items-center justify-center w-full max-w-md mx-auto py-4">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 flex-shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.thumbnail || '/placeholder.png'}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Title & Artist */}
        <div className="mt-8 text-center w-full px-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight line-clamp-1">
            {currentTrack.title}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-medium mt-1 truncate">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Bottom Section: Screenshot 3 Controls */}
      <div className="w-full max-w-md mx-auto space-y-6 pb-4">
        {/* Main Controls: Prev, Large Play Pill, Next */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prevTrack}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 text-white flex items-center justify-center transition-all"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Large Pill Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            style={{ backgroundColor: accentBtnBg }}
            className="flex-1 py-4 px-8 rounded-2xl text-white font-bold flex items-center justify-center shadow-lg shadow-black/40 hover:brightness-110 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 text-white flex items-center justify-center transition-all"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Progress Slider with Timestamps */}
        <div className="space-y-1.5">
          <div className="relative group w-full flex items-center py-2 cursor-pointer">
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
            <div className="relative w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-75"
                style={{ width: `${seekProgress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 px-0.5 font-mono">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Bottom Pill Tray: Autoplay, Shuffle, Heart, Lyrics (Screenshot 3) */}
        <div className="p-2 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-around backdrop-blur-md">
          <button
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`p-2.5 rounded-xl transition-colors ${
              repeatMode !== 'off' ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : repeatMode === 'all' ? (
              <Repeat className="w-5 h-5" />
            ) : (
              <InfinityIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleShuffle}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
            className={`p-2.5 rounded-xl transition-colors ${
              isShuffled ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={() => toggleFavorite(currentTrack)}
            title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${
              isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={toggleLyrics}
            title="Lyrics"
            className={`p-2.5 rounded-xl transition-colors ${
              isLyricsOpen ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
