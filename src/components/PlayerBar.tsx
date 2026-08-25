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
  VolumeX,
  Volume1,
  ListMusic,
  Mic2,
  Download,
  Loader2,
  Music,
  Maximize2,
  Heart,
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const PlayerBar: React.FC = () => {
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
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const [isYtReady, setIsYtReady] = useState(false);
  const [useYtEngine, setUseYtEngine] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Stream URL
  const streamSrc = currentTrack ? `/api/stream?id=${currentTrack.id}` : '';

  // Initialize YouTube IFrame API once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('hidden-yt-player', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              setIsYtReady(true);
              if (ytPlayerRef.current) {
                ytPlayerRef.current.setVolume(Math.round((isMuted ? 0 : volume) * 100));
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsLoading(false);
                if (ytPlayerRef.current) {
                  const d = ytPlayerRef.current.getDuration();
                  if (d && d > 0) setDuration(d);
                }
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                setIsLoading(true);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                handleTrackEnded();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube fallback engine error:', err);
              setIsLoading(false);
            },
          },
        });
      } catch (e) {
        console.warn('Failed to init YT player:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = initYT;
      document.body.appendChild(tag);
    }
  }, []);

  // Track progress ticker for YT Engine
  useEffect(() => {
    if (!useYtEngine || !isPlaying) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const time = ytPlayerRef.current.getCurrentTime();
        if (!isSeeking && time !== undefined) {
          setCurrentTime(time);
        }
        const d = ytPlayerRef.current.getDuration();
        if (d && d > 0) {
          setDuration(d);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [useYtEngine, isPlaying, isSeeking, setCurrentTime, setDuration]);

  // Handle Track change
  useEffect(() => {
    if (!currentTrack) return;

    // Reset states
    setCurrentTime(0);
    setIsLoading(true);
    setUseYtEngine(false);

    // Fallback timer: If HTML5 audio doesn't start playing within 3.5s, switch to YT Engine
    const fallbackTimer = setTimeout(() => {
      if (audioRef.current && (audioRef.current.paused || audioRef.current.readyState < 2)) {
        console.info('Switching to YouTube audio fallback engine for instant playback');
        setUseYtEngine(true);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(currentTrack.id);
          ytPlayerRef.current.playVideo();
        }
      }
    }, 3500);

    return () => clearTimeout(fallbackTimer);
  }, [currentTrack]);

  // Audio Play / Pause sync
  useEffect(() => {
    if (!currentTrack) return;

    if (isPlaying) {
      if (useYtEngine) {
        if (audioRef.current) audioRef.current.pause();
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        }
      } else if (audioRef.current) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn('Audio playback error / switching to YT engine:', error);
            setUseYtEngine(true);
            if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
              ytPlayerRef.current.loadVideoById(currentTrack.id);
              ytPlayerRef.current.playVideo();
            }
          });
        }
      }
    } else {
      // Unconditionally pause BOTH engines when isPlaying is false
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, currentTrack, useYtEngine]);

  // Volume & Mute Sync
  useEffect(() => {
    const vol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(Math.round(vol * 100));
    }
  }, [volume, isMuted]);

  // MediaSession API for OS controls & Lockscreen
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'CloudBeatz',
      artwork: [
        {
          src: currentTrack.thumbnail,
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        if (useYtEngine && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(details.seekTime, true);
        } else if (audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
        }
        setCurrentTime(details.seekTime);
      }
    });
  }, [currentTrack, useYtEngine, togglePlay, prevTrack, nextTrack, setCurrentTime]);

  // Auto-fetch related songs when queue is empty
  const handleTrackEnded = async () => {
    const state = usePlayerStore.getState();
    if (state.repeatMode === 'one') {
      if (useYtEngine && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (useYtEngine && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
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

  if (!currentTrack) return null;

  // Percentage Calculations
  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = duration || currentTrack.duration || 1;
  const seekProgress = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <>
      {/* Hidden YouTube IFrame API Fallback Bridge */}
      <div className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
        <div id="hidden-yt-player" />
      </div>

      <audio
        ref={audioRef}
        src={useYtEngine ? undefined : streamSrc}
        onError={() => {
          console.info('Direct audio stream error -> Activating YouTube fallback engine');
          setUseYtEngine(true);
          if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function' && currentTrack) {
            ytPlayerRef.current.loadVideoById(currentTrack.id);
            ytPlayerRef.current.playVideo();
          }
        }}
        onTimeUpdate={() => {
          if (!useYtEngine && !isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (!useYtEngine && audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsLoading(false);
          }
        }}
        onWaiting={() => !useYtEngine && setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onEnded={handleTrackEnded}
      />

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
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <Music className="w-5 h-5" />
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
      {/* 💻 DESKTOP PLAYER BAR (Visible on screens >= 768px)                       */}
      {/* ========================================================================= */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-22 bg-zinc-950/95 backdrop-blur-2xl border-t border-emerald-500/20 px-4 md:px-8 py-3 items-center justify-between z-50 select-none shadow-[0_-15px_35px_rgba(0,0,0,0.85)]">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-[320px]">
          <div
            onClick={toggleFullScreenPlayer}
            className="group/track flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer p-1.5 -ml-1.5 rounded-2xl hover:bg-white/5 transition-all"
            title="Open Full Screen Player"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md border border-white/10">
              {currentTrack.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover/track:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <Music className="w-5 h-5" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/track:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white group-hover/track:text-emerald-400 transition-colors truncate">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>

          <button
            onClick={() => setIsLiked(!isLiked)}
            title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
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
            <span className="text-[11px] font-mono text-zinc-400 w-9 text-right">{formatTime(currentTime)}</span>
            <div className="relative w-full flex items-center">
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
                className="w-full h-1.5 hover:h-2 rounded-lg cursor-pointer transition-all"
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400 w-9">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px] max-w-[320px]">
          <button
            onClick={toggleLyrics}
            title="Synced Lyrics"
            className={`p-2 rounded-xl transition-colors ${
              isLyricsOpen ? 'text-emerald-400 bg-emerald-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button
            onClick={toggleQueue}
            title="Play Queue"
            className={`p-2 rounded-xl transition-colors ${
              isQueueOpen ? 'text-emerald-400 bg-emerald-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
  );
};
