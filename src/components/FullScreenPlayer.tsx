'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import { getHighResThumbnail } from '@/lib/types';
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

  if (!currentTrack) return null;

  const isLiked = isFavorite(currentTrack.id);

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
      : themeMode === 'light'
      ? '#261622'
      : themeMode === 'dynamic'
      ? backgroundColor || '#160913'
      : '#09090b';

  const accentBtnBg =
    themeMode === 'dynamic' && dominantColor ? dominantColor : '#e11d48';

  return (
    <AnimatePresence>
      {isFullScreenPlayerOpen && (
        <motion.div
          key="fullscreen-player"
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              setIsFullScreenPlayerOpen(false);
            }
          }}
          style={{ backgroundColor: activeBg }}
          className="fixed inset-0 z-50 flex flex-col justify-between p-5 sm:p-8 md:p-10 overflow-y-auto select-none touch-none"
        >
          {/* Top Drag Indicator & Header Bar */}
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            {/* Native Pull Down Pill Handle */}
            <div className="w-12 h-1.5 bg-white/30 rounded-full mb-3 cursor-grab active:cursor-grabbing hover:bg-white/50 transition-colors" />

            <div className="flex items-center justify-between w-full">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullScreenPlayerOpen(false)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                title="Minimize"
              >
                <ChevronDown className="w-7 h-7" />
              </motion.button>

              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Now Playing</p>
                <p className="text-xs text-zinc-300 font-medium truncate max-w-[200px]">
                  {currentTrack.album || currentTrack.title}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleQueue}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                title="Queue"
              >
                <MoreVertical className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* Center Section: Big Square Album Artwork */}
          <div className="my-auto flex flex-col items-center justify-center w-full max-w-md mx-auto py-4">
            <motion.div
              layoutId={`album-art-${currentTrack.id}`}
              className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 flex-shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getHighResThumbnail(currentTrack.thumbnail, currentTrack.id)}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Title & Artist */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 text-center w-full px-2"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight line-clamp-1">
                {currentTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 font-medium mt-1 truncate">
                {currentTrack.artist}
              </p>
            </motion.div>
          </div>

          {/* Bottom Section: Native Controls */}
          <div className="w-full max-w-md mx-auto space-y-6 pb-4">
            {/* Main Controls: Prev, Large Play Pill, Next */}
            <div className="flex items-center justify-between gap-4">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={prevTrack}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                title="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </motion.button>

              {/* Large Pill Play/Pause Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                style={{ backgroundColor: accentBtnBg }}
                className="flex-1 py-4 px-8 rounded-2xl text-white font-bold flex items-center justify-center shadow-lg shadow-black/40 hover:brightness-110 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-white" />
                ) : (
                  <Play className="w-7 h-7 fill-white translate-x-0.5" />
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={nextTrack}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                title="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>
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

            {/* Bottom Pill Tray */}
            <div className="p-2 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-around backdrop-blur-md">
              <motion.button
                whileTap={{ scale: 0.85 }}
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
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleShuffle}
                title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
                className={`p-2.5 rounded-xl transition-colors ${
                  isShuffled ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleFavorite(currentTrack)}
                title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                className={`p-2.5 rounded-xl transition-all ${
                  isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleLyrics}
                title="Lyrics"
                className={`p-2.5 rounded-xl transition-colors ${
                  isLyricsOpen ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mic2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
