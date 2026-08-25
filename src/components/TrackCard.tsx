'use client';

import React from 'react';
import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Play, Pause, Plus, Music2 } from 'lucide-react';

interface TrackCardProps {
  track: Track;
  allTracks?: Track[];
  viewMode?: 'grid' | 'list';
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, allTracks, viewMode = 'grid' }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayerStore();

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handlePlayClick}
        className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
          isCurrent ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
            {track.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
                <Music2 className="w-5 h-5" />
              </div>
            )}
            <div
              className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isCurrent && isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-emerald-400 animate-bounce h-3" />
                  <span className="w-1 bg-emerald-400 animate-bounce h-4 delay-75" />
                  <span className="w-1 bg-emerald-400 animate-bounce h-2 delay-150" />
                </div>
              ) : (
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold truncate ${
                isCurrent ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
              }`}
            >
              {track.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">{track.durationFormatted || '3:30'}</span>
          <button
            onClick={handleAddToQueue}
            title="Add to queue"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode (Card)
  return (
    <div
      onClick={handlePlayClick}
      className={`group relative p-3.5 rounded-2xl glass-card cursor-pointer flex flex-col justify-between ${
        isCurrent ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 mb-3 shadow-md">
        {track.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
            <Music2 className="w-8 h-8" />
          </div>
        )}

        {/* Play / Pause button overlay */}
        <div
          className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl transition-all duration-300 transform ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </div>
      </div>

      <div>
        <h4
          className={`text-sm font-semibold truncate ${
            isCurrent ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
          }`}
        >
          {track.title}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-zinc-400 truncate flex-1">{track.artist}</p>
          <button
            onClick={handleAddToQueue}
            title="Add to queue"
            className="text-zinc-400 hover:text-emerald-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
