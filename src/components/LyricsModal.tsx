'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { LyricsResponse, SyncedLyricLine } from '@/lib/types';
import { X, Mic2, Loader2, Music2 } from 'lucide-react';

export const LyricsModal: React.FC = () => {
  const { isLyricsOpen, toggleLyrics, currentTrack, currentTime } = usePlayerStore();
  const [lyricsData, setLyricsData] = useState<LyricsResponse | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack || !isLyricsOpen) return;

    let isMounted = true;
    setLoading(true);

    const fetchLyrics = async () => {
      try {
        const url = `/api/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(
          currentTrack.artist
        )}&duration=${currentTrack.duration || 0}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Lyrics not found');
        const data: LyricsResponse = await res.json();

        if (isMounted) {
          setLyricsData(data);
          if (data.syncedLyrics) {
            parseLrc(data.syncedLyrics);
          } else {
            setSyncedLines([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setLyricsData(null);
          setSyncedLines([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentTrack, isLyricsOpen]);

  // Esc key listener to close lyrics modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLyricsOpen) {
        toggleLyrics();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsOpen, toggleLyrics]);

  // Parse LRC standard format [01:23.45] text
  const parseLrc = (lrc: string) => {
    const lines = lrc.split('\n');
    const parsed: SyncedLyricLine[] = [];

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const totalSec = min * 60 + sec + ms / (match[3].length === 3 ? 1000 : 100);
        const text = line.replace(timeRegex, '').trim();

        if (text) {
          parsed.push({ time: totalSec, text });
        }
      }
    }

    setSyncedLines(parsed);
  };

  // Find active line index
  let activeIndex = -1;
  for (let i = 0; i < syncedLines.length; i++) {
    if (currentTime >= syncedLines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Auto scroll active lyric into view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#09090b]/95 backdrop-blur-3xl z-[70] flex flex-col p-4 sm:p-6 md:p-10 animate-in fade-in duration-200 select-none">
      {/* Background Ambient Blur */}
      {currentTrack?.thumbnail && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-full h-full object-cover scale-150 blur-3xl opacity-15 filter brightness-50"
          />
        </div>
      )}

      {/* Header with guaranteed visible Close button */}
      <div className="relative z-10 flex items-center justify-between max-w-3xl mx-auto w-full mb-4 sm:mb-6 gap-3 pt-1">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg bg-zinc-800 flex-shrink-0 border border-white/10">
            {currentTrack?.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <Music2 className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">{currentTrack?.title}</h2>
            <p className="text-xs text-zinc-400 truncate">{currentTrack?.artist}</p>
          </div>
        </div>

        {/* Big Crisp Close Button */}
        <button
          onClick={toggleLyrics}
          title="Close Lyrics (Esc)"
          className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0 border border-white/10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Lyrics Content Container */}
      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full overflow-y-auto px-2 sm:px-4 py-6 text-center space-y-6 sm:space-y-8 scrollbar-none">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
            <p className="text-sm font-medium">Fetching synchronized lyrics...</p>
          </div>
        ) : syncedLines.length > 0 ? (
          syncedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white scale-105 sm:scale-110 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)] text-emerald-400 font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => {
                  usePlayerStore.getState().setCurrentTime(line.time);
                  const audio = document.querySelector('audio');
                  if (audio) {
                    audio.currentTime = line.time;
                  }
                  if (typeof window !== 'undefined') {
                    try {
                      const yt = (window as any).YT?.get?.('hidden-yt-player');
                      if (yt && typeof yt.seekTo === 'function') {
                        yt.seekTo(line.time, true);
                      }
                    } catch (e) {}
                  }
                }}
              >
                {line.text}
              </p>
            );
          })
        ) : lyricsData?.plainLyrics ? (
          <div className="whitespace-pre-line text-base sm:text-lg md:text-xl text-zinc-300 leading-relaxed font-medium">
            {lyricsData.plainLyrics}
          </div>
        ) : (
          <div className="py-24 text-center text-zinc-500">
            <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base sm:text-lg font-medium">No synchronized lyrics available for this track.</p>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">Enjoy the music!</p>
          </div>
        )}
      </div>
    </div>
  );
};
