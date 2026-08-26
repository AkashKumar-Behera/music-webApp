'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import { getHighResThumbnail } from '@/lib/types';
import {
  X,
  Shuffle,
  Menu,
  Music2,
  Trash2,
  ListRestart,
  GripVertical,
} from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    toggleQueue,
    queue,
    currentTrack,
    isPlaying,
    isShuffled,
    toggleShuffle,
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlayerStore();

  const { backgroundColor } = useThemeStore();

  // Esc key listener to close queue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQueueOpen) {
        toggleQueue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQueueOpen, toggleQueue]);

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <motion.div
          key="up-next-drawer"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{ backgroundColor: backgroundColor || '#180a15' }}
          className="fixed top-0 right-0 h-full w-full max-w-sm md:max-w-md z-[70] p-4 sm:p-5 flex flex-col shadow-2xl border-l border-white/10 select-none backdrop-blur-2xl"
        >
          {/* Header Bar (Screenshot Exact: "50 Songs", "Up Next", "Queue loop", Shuffle, Options) */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0 gap-2">
            <span className="text-xs font-semibold text-zinc-400">
              {queue.length + (currentTrack ? 1 : 0)} Songs
            </span>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Up Next</h2>

            <div className="flex items-center gap-2">
              <button
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-zinc-200 transition-colors"
                title="Queue loop"
              >
                Queue loop
              </button>

              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isShuffled ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={clearQueue}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleQueue}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Queue Songs */}
          <div className="flex-1 overflow-y-auto py-3 space-y-1.5 custom-scrollbar pr-1">
            {/* 1. Currently Playing Song */}
            {currentTrack && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/10">
                <button
                  onClick={toggleQueue}
                  className="p-1 text-zinc-400 hover:text-white mr-1.5 flex-shrink-0"
                  title="Playing"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 relative mr-3 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHighResThumbnail(currentTrack.thumbnail, currentTrack.id)}
                    alt={currentTrack.title}
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-[11px] text-zinc-300 truncate mt-0.5">{currentTrack.artist}</p>
                </div>

                {/* Equalizer Live Wave Icon */}
                <div className="flex items-end gap-0.5 h-4 ml-2 flex-shrink-0">
                  <span
                    className={`w-0.5 bg-white rounded-full ${
                      isPlaying ? 'animate-bounce h-3' : 'h-2'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-white rounded-full ${
                      isPlaying ? 'animate-bounce h-4 delay-75' : 'h-3'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-white rounded-full ${
                      isPlaying ? 'animate-bounce h-2 delay-150' : 'h-1.5'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* 2. Upcoming Queue Items */}
            {queue.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track)}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(idx);
                  }}
                  className="p-1 text-zinc-500 hover:text-white mr-1.5 flex-shrink-0 rounded"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 relative mr-3 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHighResThumbnail(track.thumbnail, track.id)}
                    alt={track.title}
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                  <span className="text-xs text-zinc-500 font-mono">
                    {track.durationFormatted || '3:20'}
                  </span>
                  <div className="text-zinc-500 group-hover:text-zinc-300 cursor-grab active:cursor-grabbing">
                    <Menu className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
