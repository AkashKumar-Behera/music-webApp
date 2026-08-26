'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import { OfflineStore } from '@/lib/offlineStore';
import { getHighResThumbnail, parseDuration } from '@/lib/types';
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

  const activePlayerBg =
    themeMode === 'dark'
      ? '#09090b'
      : themeMode === 'light'
      ? '#261622'
      : themeMode === 'dynamic'
      ? backgroundColor || '#160913'
      : '#160913';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [activeAudioSrc, setActiveAudioSrc] = useState<string>('');

  // Mobile Mini Player Gesture Handlers (Swipe Up -> Fullscreen, Swipe Left/Right -> Next/Prev)
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;

    if (diffY > 25 && Math.abs(diffY) > Math.abs(diffX)) {
      // Swiped UP -> Open Full Screen Player
      setIsFullScreenPlayerOpen(true);
    } else if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiped LEFT -> Next Song
        nextTrack();
      } else {
        // Swiped RIGHT -> Previous Song
        prevTrack();
      }
    }
    touchStartY.current = null;
    touchStartX.current = null;
  };

  const prefetchTriggeredRef = useRef<string | null>(null);

  // 1. Resolve Audio Source & Auto-Cache in Background
  useEffect(() => {
    if (!currentTrack) {
      setActiveAudioSrc('');
      return;
    }

    prefetchTriggeredRef.current = null;
    let isCancelled = false;

    const resolveStream = async () => {
      setIsLoading(true);

      // A. Check if already cached in IndexedDB for 0ms offline instant playback
      const cachedBlobUrl = await OfflineStore.getCachedAudioUrl(currentTrack.id);
      if (cachedBlobUrl && !isCancelled) {
        setActiveAudioSrc(cachedBlobUrl);
        setIsLoading(false);
        return;
      }

      // B. Network stream URL
      const networkSrc = `/api/stream?id=${currentTrack.id}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;
      if (!isCancelled) {
        setActiveAudioSrc(networkSrc);
      }

      // C. Background resilient caching to IndexedDB (so song is saved automatically for offline use)
      OfflineStore.cacheTrack(currentTrack).catch(() => {});
    };

    resolveStream();
    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id]);

  // 2. Handle Track Play / Pause transitions
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
  }, [isPlaying, currentTrack?.id, activeAudioSrc]);

  // 3. Handle Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      const targetVol = isMuted ? 0 : Math.max(0, Math.min(1, volume));
      audioRef.current.volume = targetVol;
      audioRef.current.muted = isMuted || targetVol === 0;
    }
  }, [volume, isMuted]);

  // 4. MediaSession Metadata (Title, Artist, Artwork) - ONLY runs when song ID changes (ZERO flicker)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
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
    } catch {
      // ignore
    }
  }, [currentTrack?.id]);

  // 5. MediaSession Action Handlers & Position State (Native Lock Screen / Dynamic Island)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const trackDur = parseDuration(currentTrack.duration, currentTrack.durationFormatted).seconds;
    if ('setPositionState' in navigator.mediaSession && trackDur > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: trackDur,
          playbackRate: 1,
          position: Math.min(currentTime, trackDur),
        });
      } catch {
        // ignore
      }
    }

    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          const tDur = parseDuration(currentTrack.duration, currentTrack.durationFormatted).seconds;
          let targetTime = details.seekTime;
          const rawDur = audioRef.current.duration || 0;
          if (tDur > 0 && rawDur > tDur * 1.6 && rawDur < tDur * 2.4 && audioRef.current.currentTime > tDur / 2) {
            targetTime = targetTime * 2;
          }
          audioRef.current.currentTime = targetTime;
          setCurrentTime(details.seekTime);
          if ('setPositionState' in navigator.mediaSession && tDur > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: tDur,
                playbackRate: 1,
                position: details.seekTime,
              });
            } catch {
              // ignore
            }
          }
        }
      });
    } catch {
      // seekto not supported in some browsers
    }
  }, [currentTrack?.id, isPlaying, nextTrack, prevTrack, setIsPlaying, setCurrentTime]);

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
    if (currentTrack) {
      // Auto-cache completed song into IndexedDB for 0-internet offline playback
      OfflineStore.getTrackBlob(currentTrack.id).then(async (blob) => {
        if (!blob) {
          try {
            const streamResp = await fetch(`/api/stream?id=${currentTrack.id}`);
            if (streamResp.ok) {
              const audioBlob = await streamResp.blob();
              if (audioBlob && audioBlob.size > 100000) {
                await OfflineStore.saveTrack(currentTrack, audioBlob);
              }
            }
          } catch {
            // ignore
          }
        }
      });
    }

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
      const rawDur = audioRef.current.duration || 0;
      const trackDur = currentTrack?.duration || 0;
      let targetTime = dragTime;
      if (trackDur > 0 && rawDur > trackDur * 1.6 && rawDur < trackDur * 2.4 && audioRef.current.currentTime > trackDur / 2) {
        targetTime = dragTime * 2;
      }
      audioRef.current.currentTime = targetTime;
    }
  };

  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = currentTrack
    ? (parseDuration(currentTrack.duration, currentTrack.durationFormatted).seconds || duration || 1)
    : 1;
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
        muted={isMuted}
        onDurationChange={() => {
          if (audioRef.current) {
            const rawDur = audioRef.current.duration;
            const trackDur = parseDuration(currentTrack?.duration, currentTrack?.durationFormatted).seconds;
            if (trackDur > 0) {
              setDuration(trackDur);
            } else if (rawDur && isFinite(rawDur) && rawDur > 0) {
              setDuration(rawDur);
            }
          }
        }}
        onTimeUpdate={() => {
          if (!isDragging && audioRef.current) {
            let rawCurrent = audioRef.current.currentTime || 0;
            const rawDur = audioRef.current.duration || 0;
            const trackDur = parseDuration(currentTrack?.duration, currentTrack?.durationFormatted).seconds || (duration > 0 ? duration : 0);

            // Fix iOS WebKit & Chrome 2x duration & 2x currentTime bug:
            // When browser decodes 48kHz Opus streams with 24kHz header, it doubles duration & current time.
            if (trackDur > 0 && rawDur > trackDur * 1.6 && rawDur < trackDur * 2.4) {
              if (rawCurrent > trackDur) {
                rawCurrent = rawCurrent / 2;
              }
            }

            // Spotify-style Smart Pre-fetch: when within 15 seconds of track completion, pre-download next song
            if (trackDur > 0 && trackDur - rawCurrent <= 15 && queue.length > 0) {
              const nextSong = queue[0];
              if (nextSong && prefetchTriggeredRef.current !== nextSong.id) {
                prefetchTriggeredRef.current = nextSong.id;
                OfflineStore.cacheTrack(nextSong).catch(() => {});
              }
            }

            if (trackDur > 0 && rawCurrent >= trackDur - 0.5) {
              handleTrackEnded();
              return;
            }
            setCurrentTime(Math.min(rawCurrent, trackDur > 0 ? trackDur : rawCurrent));
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const rawDur = audioRef.current.duration;
            const trackDur = parseDuration(currentTrack?.duration, currentTrack?.durationFormatted).seconds;
            if (trackDur > 0) {
              setDuration(trackDur);
            } else if (rawDur && isFinite(rawDur) && rawDur > 0) {
              setDuration(rawDur);
            }
            audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
            audioRef.current.muted = isMuted;
            setIsLoading(false);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
            audioRef.current.muted = isMuted;
          }
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
            className="fixed bottom-2 left-2 right-2 md:hidden z-40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 flex flex-col shadow-2xl cursor-pointer select-none transition-colors duration-500"
            style={{ backgroundColor: activePlayerBg }}
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
          <div
            style={{ backgroundColor: activePlayerBg }}
            className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 backdrop-blur-2xl border-t border-white/10 z-40 items-center justify-between px-6 select-none shadow-2xl transition-colors duration-500"
          >
            {/* Left: Song Info & Heart */}
            <div className="flex items-center gap-3.5 w-72 min-w-0 z-10">
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

            {/* Center: Playback Controls & Seekbar (Dead-Center on Screen) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 w-full max-w-lg lg:max-w-xl px-4 pointer-events-auto">
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
            <div className="flex items-center gap-3.5 relative z-30 justify-end">
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

              {/* Volume Slider & Percentage (Interactive, Real-time 0-100%) */}
              <div className="flex items-center gap-2 group/vol select-none">
                <button
                  onClick={() => {
                    const nextMuted = !isMuted;
                    toggleMute();
                    if (audioRef.current) {
                      const v = nextMuted ? 0 : volume;
                      audioRef.current.volume = v;
                      audioRef.current.muted = nextMuted;
                    }
                  }}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-zinc-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-zinc-200" />
                  )}
                </button>

                <div className="flex items-center w-28 sm:w-32 h-6">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onInput={(e) => {
                      const val = Math.max(0, Math.min(1, parseFloat((e.target as HTMLInputElement).value)));
                      if (audioRef.current) {
                        audioRef.current.volume = val;
                        audioRef.current.muted = val === 0;
                      }
                      setVolume(val);
                    }}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(1, parseFloat(e.target.value)));
                      if (audioRef.current) {
                        audioRef.current.volume = val;
                        audioRef.current.muted = val === 0;
                      }
                      setVolume(val);
                      if (isMuted && val > 0) toggleMute();
                    }}
                    style={{
                      background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%)`,
                    }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-white transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125"
                  />
                </div>

                <span className="text-xs font-mono text-zinc-300 w-9 text-right select-none font-bold">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
