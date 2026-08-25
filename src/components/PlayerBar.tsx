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
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Stream URL
  const streamSrc = currentTrack ? `/api/stream?id=${currentTrack.id}` : '';

  // Audio Play / Pause sync
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio playback error / autoplay prevented:', error);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Volume & Mute Sync
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
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
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });
  }, [currentTrack, togglePlay, prevTrack, nextTrack, setCurrentTime]);

  // Auto-fetch related songs when queue is empty
  const handleTrackEnded = async () => {
    const state = usePlayerStore.getState();
    if (state.repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (state.queue.length > 0) {
      nextTrack();
    } else if (currentTrack) {
      // Fetch dynamic Up-Next / Autoplay recommendations
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
    if (audioRef.current) {
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

  // Percentage Calculations for exact filled tracks
  const currentVolPercent = isMuted ? 0 : Math.round(volume * 100);
  const totalDuration = duration || currentTrack.duration || 1;
  const seekProgress = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <div className="fixed bottom-0 left-0 right-0 h-22 bg-zinc-950/95 backdrop-blur-2xl border-t border-emerald-500/20 px-4 md:px-8 py-3 flex items-center justify-between z-50 select-none shadow-[0_-15px_35px_rgba(0,0,0,0.85)]">
      <audio
        ref={audioRef}
        src={streamSrc}
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
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
        onPlaying={() => setIsLoading(false)}
        onEnded={handleTrackEnded}
      />

      {/* Left: Track Info (Clickable for Full Screen Player) */}
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

        {/* Favorite Heart Button */}
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
            title="Previous (or restart track)"
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

        {/* Seekbar with Exact Filled Gradient Track */}
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

      {/* Right: Actions (Lyrics, Queue, Download, Volume Slider + %) */}
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
          className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-colors hidden sm:block"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Volume slider with exact track fill & Percentage Badge */}
        <div className="hidden md:flex items-center gap-2 group/range pl-1.5 py-1 px-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
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

          {/* Volume % Badge */}
          <span className="text-[11px] font-mono font-medium text-zinc-400 w-8 text-right select-none">
            {currentVolPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
