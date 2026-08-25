'use client';

import React, { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { X, Trash2, Music2 } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const { isQueueOpen, toggleQueue, queue, currentTrack, removeFromQueue, clearQueue, playTrack } = usePlayerStore();

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

  if (!isQueueOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full md:h-[calc(100vh-88px)] w-full max-w-sm bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-[70] p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
        <h3 className="font-bold text-base text-white">Play Queue ({queue.length})</h3>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              title="Clear queue"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleQueue}
            title="Close (Esc)"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
        {/* Now Playing */}
        {currentTrack && (
          <div className="flex-shrink-0">
            <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">Now Playing</p>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                {currentTrack.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Music2 className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Up Next</p>
          {queue.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4 text-center">
              Queue is empty. Similar songs will autoplay next!
            </p>
          ) : (
            <div className="space-y-1.5">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      {track.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Music2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {track.title}
                      </h5>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(idx);
                    }}
                    title="Remove from queue"
                    className="text-zinc-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
