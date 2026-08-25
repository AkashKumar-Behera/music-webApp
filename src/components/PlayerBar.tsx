'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Volume1,
  VolumeX,
  ListMusic,
  Maximize2,
  Heart,
  Download,
  Loader2,
  Mic2,
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    queue,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isQueueOpen,
    isLyricsOpen,
    toggleFullScreenPlayer,
    togglePlay,
    setIsPlaying,
    setIsLoading,
    setCurrentTime,
    setDuration,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleQueue,
    toggleLyrics,
    addToQueue,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Direct backend audio stream endpoint
  const streamSrc = currentTrack ? `/api/stream?id=${currentTrack.id}` : '';

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
  }, [isPlaying, currentTrack]);

  // Handle Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // MediaSession API for Native iOS / Android Lock Screen Controls
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

    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset || 10;
      if (audioRef.current) {
        const newTime = Math.max(audioRef.current.currentTime - skip, 0);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset || 10;
      if (audioRef.current) {
        const total = duration || currentTrack.duration || 1;
        const newTime = Math.min(audioRef.current.currentTime + skip, total);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    });

    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    } catch (e) {}
  }, [currentTrack, isPlaying, duration, prevTrack, nextTrack, setCurrentTime, setIsPlaying]);

  // Update MediaSession Position State for Lock Screen Timeline
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      } catch (e) {}
    }
  }, [currentTime, duration]);

  // Keyboard Shortcuts (Space, Arrow Keys, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) {
          const newTime = Math.min(audioRef.current.currentTime + 5, duration);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
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

  // Handle Track Ended (Repeat Modes & Auto-Next / Up-Next)
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
      } catch (err) {
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

  const handleDownload = () => {
    if (!currentTrack) return;
    const a = document.createElement('a');
    a.href = `/api/stream?id=${currentTrack.id}&download=1&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;
    a.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = currentTrack ? (duration || currentTrack.duration || 1) : 1;
  const displayTime = isDragging ? dragTime : currentTime;
  const seekProgress = Math.min(100, Math.max(0, (displayTime / totalDuration) * 100));

  return (
    <>
      {/* Native HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={streamSrc}
        playsInline
        preload="auto"
        onTimeUpdate={() => {
          if (!isDragging && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
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
          {/* 📱 MOBILE MINI-PLAYER (Visible on screens < 768px)                       */}
          {/* ========================================================================= */}
          <div
            onClick={toggleFullScreenPlayer}
            className="fixed bottom-2 left-2 right-2 md:hidden z-50 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 flex flex-col shadow-2xl cursor-pointer select-none"
          >
            {/* Top 2px Progress Line */}
            <div className="absolute top-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-150"
                style={{ width: `${seekProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md border border-white/10">
                  {currentTrack.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                      CB
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Right: Quick Mobile Controls */}
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-xl transition-all ${
                    isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-all"
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
                  className="p-2 text-zinc-300 hover:text-white active:scale-95 transition-all"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 💻 DESKTOP PLAYER BAR (Visible on screens >= 768px)                      */}
          {/* ========================================================================= */}
          <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 z-50 items-center justify-between px-6 select-none shadow-2xl">
            {/* Left: Song Info & Heart */}
            <div className="flex items-center gap-3.5 w-72 min-w-0">
              <div
                onClick={toggleFullScreenPlayer}
                className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 cursor-pointer group shadow-md border border-white/10"
              >
                {currentTrack.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                    CB
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  onClick={toggleFullScreenPlayer}
                  className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
                >
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>

              <button
                onClick={() => setIsLiked(!isLiked)}
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
                    isShuffled ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
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
                  className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-white/10"
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
                  title="Next Track"
                  className="text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all p-1"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={toggleRepeat}
                  title={`Repeat: ${repeatMode}`}
                  className={`p-1.5 rounded-lg transition-colors ${
                    repeatMode !== 'off' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Seekbar */}
              <div className="w-full flex items-center gap-2.5 group/range">
                <span className="text-[11px] font-mono text-zinc-400 w-9 text-right">{formatTime(displayTime)}</span>
                <div className="relative w-full flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={totalDuration}
                    value={displayTime}
                    onMouseDown={() => {
                      setIsDragging(true);
                      setDragTime(currentTime);
                    }}
                    onTouchStart={() => {
                      setIsDragging(true);
                      setDragTime(currentTime);
                    }}
                    onMouseUp={handleSeekCommit}
                    onTouchEnd={handleSeekCommit}
                    onChange={handleSeekChange}
                    style={{
                      background: `linear-gradient(to right, #10b981 ${seekProgress}%, rgba(255,255,255,0.15) ${seekProgress}%)`,
                    }}
                    className="w-full h-1.5 hover:h-2 rounded-lg cursor-pointer transition-all"
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 w-9">{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Right: Extra Buttons (Lyrics, Queue, Download, Volume) */}
            <div className="flex items-center gap-2.5 w-72 justify-end">
              <button
                onClick={toggleLyrics}
                title="Lyrics"
                className={`p-2 rounded-xl transition-colors ${
                  isLyricsOpen ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mic2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleQueue}
                title="Queue"
                className={`p-2 rounded-xl transition-colors ${
                  isQueueOpen ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListMusic className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                title="Download MP3"
                className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Volume slider */}
              <div className="flex items-center gap-2 group/range pl-1.5 py-1 px-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} className="text-zinc-400 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-zinc-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-zinc-300" />
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
                  style={{
                    background: `linear-gradient(to right, #10b981 ${currentVolPercent}%, rgba(255,255,255,0.15) ${currentVolPercent}%)`,
                  }}
                  className="w-16 h-1.5 hover:h-2 rounded-lg cursor-pointer transition-all"
                />

                <span className="text-[11px] font-mono font-medium text-zinc-400 w-8 text-right select-none">
                  {currentVolPercent}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
