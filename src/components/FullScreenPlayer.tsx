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
  ChevronUp,
  Heart,
  MoreVertical,
  Volume2,
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
          className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-y-auto select-none touch-none"
        >
          {/* ========================================================================= */}
          {/* TOP HEADER: Down Arrow (Minimize) & 3-Dot More Menu                       */}
          {/* ========================================================================= */}
          <div className="w-full flex items-center justify-between z-10">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullScreenPlayerOpen(false)}
              className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
              title="Minimize"
            >
              <ChevronDown className="w-6 h-6 md:w-7 md:h-7" />
            </motion.button>

            {/* Mobile Drag Pill */}
            <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full cursor-grab" />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleQueue}
              className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
              title="More options / Queue"
            >
              <MoreVertical className="w-6 h-6" />
            </motion.button>
          </div>

          {/* ========================================================================= */}
          {/* MAIN PLAYER BODY: Mobile Vertical vs Laptop / Desktop 2-Column Split      */}
          {/* ========================================================================= */}
          <div className="my-auto w-full max-w-5xl mx-auto py-6">
            {/* Desktop 2-Column Grid / Mobile Flex */}
            <div className="flex flex-col md:grid md:grid-cols-2 md:items-center md:gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Big Album Artwork (Laptop & Mobile) */}
              <div className="flex justify-center w-full">
                <motion.div
                  layoutId={`album-art-${currentTrack.id}`}
                  className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border border-white/10 flex-shrink-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHighResThumbnail(currentTrack.thumbnail, currentTrack.id)}
                    alt={currentTrack.title}
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </motion.div>
              </div>

              {/* Right Column: Title, Artist, Heart, Slider & Controls (Laptop Exact Replica) */}
              <div className="w-full max-w-md md:max-w-none flex flex-col justify-center space-y-6 md:space-y-8 mt-6 md:mt-0">
                
                {/* Song Info & Heart Icon */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 text-left">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight line-clamp-1">
                      {currentTrack.title}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 font-medium mt-1 truncate">
                      {currentTrack.artist}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleFavorite(currentTrack)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                    title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart
                      className={`w-6 h-6 md:w-7 md:h-7 ${
                        isLiked ? 'text-rose-500 fill-rose-500' : ''
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Progress Slider & Timestamps */}
                <div className="space-y-2">
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
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
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

                {/* Media Control Bar (Screenshot: Shuffle, Prev, Center Play Circle, Next, Repeat) */}
                <div className="flex items-center justify-between md:justify-center md:gap-8 gap-4 pt-2">
                  {/* Shuffle Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={toggleShuffle}
                    className={`p-3 rounded-full transition-colors ${
                      isShuffled ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.button>

                  {/* Previous Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={prevTrack}
                    className="p-3 text-zinc-300 hover:text-white transition-colors"
                    title="Previous"
                  >
                    <SkipBack className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                  </motion.button>

                  {/* Large Circular Play/Pause Button (Screenshot Exact Dark Circle) */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8 md:w-9 md:h-9 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 md:w-9 md:h-9 fill-white ml-1" />
                    )}
                  </motion.button>

                  {/* Next Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={nextTrack}
                    className="p-3 text-zinc-300 hover:text-white transition-colors"
                    title="Next"
                  >
                    <SkipForward className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                  </motion.button>

                  {/* Repeat / Loop Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={toggleRepeat}
                    className={`p-3 rounded-full transition-colors ${
                      repeatMode !== 'off' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="w-5 h-5 md:w-6 md:h-6" />
                    ) : repeatMode === 'all' ? (
                      <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                    ) : (
                      <InfinityIcon className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM DRAWER TRIGGER: Up Arrow (Lyrics / Queue)                          */}
          {/* ========================================================================= */}
          <div className="w-full flex justify-center pb-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleLyrics}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex flex-col items-center gap-1"
              title="Lyrics / Up Next"
            >
              <ChevronUp className="w-6 h-6 animate-bounce" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
