'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import { OfflineStore } from '@/lib/offlineStore';
import { getHighResThumbnail } from '@/lib/types';
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
  Maximize2,
  ListMusic,
  Mic2,
  Loader2,
  Heart,
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    queue,
    history,
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
    setIsPlaying,
    setIsLoading,
    setCurrentTime,
    setDuration,
    nextTrack,
    prevTrack,
    toggleRepeat,
    toggleShuffle,
    setVolume,
    toggleMute,
    toggleFullScreenPlayer,
    setIsFullScreenPlayerOpen,
    toggleQueue,
    toggleLyrics,
    addToQueue,
    toggleFavorite,
    isFavorite,
  } = usePlayerStore();

  const { dominantColor, backgroundColor, themeMode } = useThemeStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [activeAudioSrc, setActiveAudioSrc] = useState<string>('');

  // Swipe Up Gestures on Mini Player
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 40) {
      // Swiped Up -> Open Full Screen Player
      setIsFullScreenPlayerOpen(true);
    }
    touchStartY.current = null;
  };

  // Resolve stream: Check Offline IndexedDB first, else stream from backend
  useEffect(() => {
    let isCancelled = false;
    if (!currentTrack) {
      setActiveAudioSrc('');
      return;
    }

    const resolveStream = async () => {
      // 1. Check if cached in IndexedDB
      const cachedBlob = await OfflineStore.getTrackBlob(currentTrack.id);
      if (cachedBlob && !isCancelled) {
        const localBlobUrl = URL.createObjectURL(cachedBlob);
        setActiveAudioSrc(localBlobUrl);
        return;
      }

      // 2. Stream from backend API
      const networkSrc = `/api/stream?id=${currentTrack.id}`;
      if (!isCancelled) {
        setActiveAudioSrc(networkSrc);
      }

      // 3. Cache audio blob in background for 0-internet offline playback
      try {
        const streamResp = await fetch(networkSrc);
        if (streamResp.ok) {
          const blob = await streamResp.blob();
          if (blob && blob.size > 100000) {
            await OfflineStore.saveTrack(currentTrack, blob);
          }
        }
      } catch {
        // Offline or background network interrupted, ignore
      }
    };

    resolveStream();
    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  // Handle Track Play / Pause transitions
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio play interrupted or waiting for user interaction:', error);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, activeAudioSrc]);

  // Handle Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // MediaSession API for Native Lock Screen Controls
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'CloudBeatz',
      artwork: [
        {
          src: currentTrack.thumbnail || '/icon.png',
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }, [currentTrack, isPlaying, nextTrack, prevTrack, setIsPlaying]);

  // Keyboard Shortcuts (Space, Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        if (audioRef.current) {
          const newTime = Math.min(audioRef.current.currentTime + 5, duration || 1);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.code === 'ArrowLeft') {
        if (audioRef.current) {
          const newTime = Math.max(audioRef.current.currentTime - 5, 0);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, duration, setCurrentTime]);

  const handleTrackEnded = async () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    const state = usePlayerStore.getState();
    if (state.queue.length > 0) {
      nextTrack();
    } else if (currentTrack) {
      try {
        const res = await fetch(`/api/related?id=${currentTrack.id}`);
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          data.tracks.forEach((t: any) => addToQueue(t));
          nextTrack();
        } else {
          nextTrack();
        }
      } catch {
        nextTrack();
      }
    }
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
    if (audioRef.current) {
      audioRef.current.currentTime = dragTime;
    }
  };

  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = currentTrack ? (duration || currentTrack.duration || 1) : 1;
  const displayTime = isDragging ? dragTime : currentTime;
  const seekProgress = Math.min(100, Math.max(0, (displayTime / totalDuration) * 100));

  const isLiked = currentTrack ? isFavorite(currentTrack.id) : false;

  return (
    <>
      {/* Native HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        playsInline
        preload="auto"
        onTimeUpdate={() => {
          if (!isDragging && audioRef.current) {
            const rawCurrent = audioRef.current.currentTime;
            const knownDuration = (duration > 0 ? duration : currentTrack?.duration) || 0;
            if (knownDuration > 0 && rawCurrent >= knownDuration - 0.5) {
              handleTrackEnded();
              return;
            }
            setCurrentTime(rawCurrent);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const rawDur = audioRef.current.duration;
            const trackDur = currentTrack?.duration || 0;
            if (trackDur > 0 && (!rawDur || !isFinite(rawDur) || rawDur > trackDur * 1.3)) {
              setDuration(trackDur);
            } else if (rawDur && isFinite(rawDur) && rawDur > 0) {
              setDuration(rawDur);
            } else if (trackDur > 0) {
              setDuration(trackDur);
            }
            setIsLoading(false);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleTrackEnded}
        onError={() => {
          console.warn('Native audio stream error or expired stream URL');
          setIsLoading(false);
        }}
      />

      {currentTrack && (
        <>
          {/* ========================================================================= */}
          {/* 📱 MOBILE MINI-PLAYER (Swipe Up to expand, with top progress line)         */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsFullScreenPlayerOpen(true)}
            className="fixed bottom-2 left-2 right-2 md:hidden z-40 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 flex flex-col shadow-2xl cursor-pointer select-none"
          >
            {/* Top 2px Progress Line */}
            <div className="absolute top-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-150"
                style={{ width: `${seekProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <motion.div
                  layoutId={`album-art-${currentTrack.id}`}
                  className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHighResThumbnail(currentTrack.thumbnail, currentTrack.id)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Right: Quick Mobile Controls */}
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={nextTrack}
                  className="p-2 text-zinc-300 hover:text-white transition-all"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* 💻 DESKTOP PLAYER BAR                                                    */}
          {/* ========================================================================= */}
          <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 z-40 items-center justify-between px-6 select-none shadow-2xl">
            {/* Left: Song Info & Heart */}
            <div className="flex items-center gap-3.5 w-72 min-w-0">
              <div
                onClick={() => setIsFullScreenPlayerOpen(true)}
                className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 cursor-pointer group shadow-md border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.thumbnail || '/placeholder.png'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  onClick={() => setIsFullScreenPlayerOpen(true)}
                  className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
                >
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>

              <button
                onClick={() => toggleFavorite(currentTrack)}
                title={isLiked ? 'Unlike' : 'Like'}
                className={`p-2 rounded-xl transition-all flex-shrink-0 hover:scale-110 active:scale-95 ${
                  isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center: Playback Controls & Seekbar */}
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleShuffle}
                  title={isShuffled ? 'Shuffle enabled' : 'Shuffle disabled'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isShuffled ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={prevTrack}
                  title="Previous"
                  className="text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all p-1"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  title="Next"
                  className="text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all p-1"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={toggleRepeat}
                  title={`Repeat: ${repeatMode}`}
                  className={`p-1.5 rounded-lg transition-colors ${
                    repeatMode !== 'off' ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Progress Slider */}
              <div className="w-full flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                  {formatTime(displayTime)}
                </span>
                <div className="relative group/timeline w-full flex items-center py-1 cursor-pointer">
                  <input
                    type="range"
                    min={0}
                    max={totalDuration}
                    step={0.1}
                    value={displayTime}
                    onChange={handleSeekChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={handleSeekCommit}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                  />
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${seekProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-400 w-10">
                  {formatTime(totalDuration)}
                </span>
              </div>
            </div>

            {/* Right: Volume & Drawer Toggles */}
            <div className="flex items-center gap-4 w-72 justify-end">
              <button
                onClick={toggleLyrics}
                className={`p-2 rounded-xl transition-all ${
                  isLyricsOpen ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Lyrics"
              >
                <Mic2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleQueue}
                className={`p-2 rounded-xl transition-all ${
                  isQueueOpen ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Queue"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
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
                  className="w-20 h-1 accent-white bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
