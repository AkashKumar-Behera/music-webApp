'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { LyricsResponse, SyncedLyricLine } from '@/lib/types';
import { X, Mic2, Loader2, Music } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex flex-col p-6 md:p-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentTrack?.thumbnail} alt={currentTrack?.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white truncate">{currentTrack?.title}</h2>
            <p className="text-sm text-zinc-400">{currentTrack?.artist}</p>
          </div>
        </div>

        <button
          onClick={toggleLyrics}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Lyrics Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full overflow-y-auto pr-4 py-8 text-center space-y-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
            <p className="text-sm">Fetching synchronized lyrics...</p>
          </div>
        ) : syncedLines.length > 0 ? (
          syncedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                className={`text-2xl md:text-3xl font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white scale-110 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => {
                  const audio = document.querySelector('audio');
                  if (audio) {
                    audio.currentTime = line.time;
                    usePlayerStore.getState().setCurrentTime(line.time);
                  }
                }}
              >
                {line.text}
              </p>
            );
          })
        ) : lyricsData?.plainLyrics ? (
          <div className="whitespace-pre-line text-lg md:text-xl text-zinc-300 leading-relaxed">
            {lyricsData.plainLyrics}
          </div>
        ) : (
          <div className="py-24 text-center text-zinc-500">
            <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No synchronized lyrics available for this song.</p>
            <p className="text-sm text-zinc-400 mt-1">Enjoy the music!</p>
          </div>
        )}
      </div>
    </div>
  );
};
