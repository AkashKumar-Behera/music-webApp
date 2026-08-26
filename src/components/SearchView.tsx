'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import {
  ChevronLeft,
  Search as SearchIcon,
  X,
  Clock,
  ArrowUpRight,
  Play,
  Loader2,
  Music2,
  Disc3,
  Mic2,
  Video,
  ArrowDownAZ,
  ArrowUpDown,
} from 'lucide-react';

interface SearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtistOrAlbum?: (query: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  isOpen,
  onClose,
  onSelectArtistOrAlbum,
}) => {
  const { playTrack } = usePlayerStore();
  const { backgroundColor, dominantColor, themeMode } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search categories
  const [activeSubTab, setActiveSubTab] = useState<string>('Results');
  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);

  // Multi-section search results
  const [searchResults, setSearchResults] = useState<{
    songs: Track[];
    albums: any[];
    artists: any[];
    videos: Track[];
    playlists: any[];
  }>({
    songs: [],
    albums: [],
    artists: [],
    videos: [],
    playlists: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic Theme Background Color matching the current playing song
  const activeBg =
    themeMode === 'dark'
      ? '#09090b'
      : themeMode === 'light'
      ? '#261622'
      : themeMode === 'dynamic'
      ? backgroundColor || '#160913'
      : '#09090b';

  // Load Search History from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloudbeatz_search_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        setHistory([
          'i feel it coming',
          'Chaandni',
          'shinobu e wa',
          'despacito english version',
          'despacito',
          'haal e dil',
          'the weeknd',
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save Search History
  const saveHistory = (items: string[]) => {
    setHistory(items);
    try {
      localStorage.setItem('cloudbeatz_search_history', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const removeHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = history.filter((h) => h !== item);
    saveHistory(updated);
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !submittedQuery) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, submittedQuery]);

  const executeSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setSubmittedQuery(q);
    setSearchQuery(q);
    setIsLoading(true);
    setViewAllCategory(null);
    setActiveSubTab('Results');

    // Add to history (push to top, remove duplicates)
    const newHistory = [q, ...history.filter((h) => h.toLowerCase() !== q.toLowerCase())].slice(0, 20);
    saveHistory(newHistory);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`);
      const data = await res.json();

      setSearchResults({
        songs: data.songs || data.tracks || [],
        albums: data.albums || [],
        artists: data.artists || [],
        videos: data.videos || [],
        playlists: data.playlists || [],
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleBack = () => {
    if (viewAllCategory) {
      setViewAllCategory(null);
    } else if (submittedQuery) {
      setSubmittedQuery('');
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const subTabs = [
    'Results',
    'Community Playlists',
    'Featured Playlists',
    'Songs',
    'Albums',
    'Artists',
    'Videos',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      style={{ backgroundColor: activeBg }}
      className="fixed inset-0 z-40 text-white flex flex-col overflow-hidden select-none transition-colors duration-500"
    >
      {/* ========================================================================= */}
      {/* 🔍 SCREEN 1: SEARCH INPUT & RECENT HISTORY (Screenshot 5)                  */}
      {/* ========================================================================= */}
      {!submittedQuery && (
        <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight">Search</h1>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleFormSubmit} className="relative mb-6">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Songs, Playlist, Album or Artist"
              className="w-full bg-transparent border-b border-white/20 pb-3 pt-1 pr-10 text-base sm:text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>

          {/* Recent Search History List (Screenshot 5) */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {history.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                onClick={() => executeSearch(item)}
                className="flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Clock className="w-5 h-5 text-zinc-400 group-hover:text-white flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-zinc-200 group-hover:text-white truncate">
                    {item}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => removeHistoryItem(e, item)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery(item);
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                    title="Fill in search"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 SCREEN 2: SEARCH RESULTS WITH LEFT SUB-RAIL (Screenshots 6, 7, 8, 9)   */}
      {/* ========================================================================= */}
      {submittedQuery && !viewAllCategory && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Vertical Sub-Rail with Top Back Button */}
          <div className="w-12 sm:w-14 bg-black/20 flex flex-col justify-start items-center py-3 select-none flex-shrink-0 overflow-y-auto no-scrollbar">
            {/* Top Back Button inside Left Rail */}
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors mb-5 flex-shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Rotated Sub Tabs */}
            <div className="flex flex-col gap-6 sm:gap-7 items-center py-1 flex-1">
              {subTabs.map((tab) => {
                const isActive = activeSubTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`[writing-mode:vertical-rl] rotate-180 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all py-0.5 ${
                      isActive
                        ? 'text-white border-r-2 border-white font-black pr-0.5'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Results Body */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 space-y-8">
            {/* Clean Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Search results</h1>
              <p className="text-xs sm:text-sm text-zinc-400">for &quot;{submittedQuery}&quot;</p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-sm font-medium">Searching YouTube Music...</p>
              </div>
            ) : (
              <>
                {/* 1. Songs Section (Screenshot 6: Top 3 Songs with View all) */}
                {(activeSubTab === 'Results' || activeSubTab === 'Songs') &&
                  searchResults.songs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight">Songs</h2>
                        <button
                          onClick={() => setViewAllCategory('Songs')}
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          View all
                        </button>
                      </div>

                      <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                        {(activeSubTab === 'Songs'
                          ? searchResults.songs
                          : searchResults.songs.slice(0, 3)
                        ).map((track) => (
                          <div
                            key={track.id}
                            onClick={() => playTrack(track, searchResults.songs)}
                            className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 relative shadow-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={track.thumbnail}
                                  alt={track.title}
                                  onError={(e) => {
                                    e.currentTarget.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                                  {track.title}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                  Song, {track.artist}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-500 font-mono pr-2">
                              {track.durationFormatted}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. Albums Section (Screenshot 6: Horizontal Albums with View all) */}
                {(activeSubTab === 'Results' || activeSubTab === 'Albums') &&
                  searchResults.albums.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight">Albums</h2>
                        <button
                          onClick={() => setViewAllCategory('Albums')}
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          View all
                        </button>
                      </div>

                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {searchResults.albums.map((alb) => (
                          <div
                            key={alb.id}
                            onClick={() => {
                              if (onSelectArtistOrAlbum) {
                                onSelectArtistOrAlbum(`${alb.title} ${alb.artist}`);
                                onClose();
                              }
                            }}
                            className="min-w-[140px] max-w-[140px] snap-start flex-shrink-0 group cursor-pointer"
                          >
                            <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-zinc-900 relative shadow-lg">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={alb.thumbnail}
                                alt={alb.title}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">{alb.title}</h4>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {alb.type || 'Album'} &bull; {alb.year || '2024'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 3. Artists Section (Screenshot 7: Circle Avatars with View all) */}
                {(activeSubTab === 'Results' || activeSubTab === 'Artists') &&
                  searchResults.artists.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight">Artists</h2>
                        <button
                          onClick={() => setViewAllCategory('Artists')}
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          View all
                        </button>
                      </div>

                      <div className="space-y-3">
                        {searchResults.artists.slice(0, 3).map((art) => (
                          <div
                            key={art.id}
                            onClick={() => {
                              if (onSelectArtistOrAlbum) {
                                onSelectArtistOrAlbum(art.name);
                                onClose();
                              }
                            }}
                            className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-2xl cursor-pointer group transition-colors"
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={art.thumbnail}
                                alt={art.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                                {art.name}
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {art.subscribers || 'Artist'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. Videos Section (Screenshot 7 & 9) */}
                {(activeSubTab === 'Results' || activeSubTab === 'Videos') &&
                  searchResults.videos.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-tight">Videos</h2>
                        <button
                          onClick={() => setViewAllCategory('Videos')}
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          View all
                        </button>
                      </div>

                      <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                        {searchResults.videos.slice(0, 3).map((vid) => (
                          <div
                            key={vid.id}
                            onClick={() => playTrack(vid, searchResults.videos)}
                            className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 relative shadow-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={vid.thumbnail}
                                  alt={vid.title}
                                  onError={(e) => {
                                    e.currentTarget.src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                                  {vid.title}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                  Video, {vid.artist}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-500 font-mono pr-2">
                              {vid.durationFormatted}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 SCREEN 3: DEDICATED VIEW ALL SCREEN (Screenshot 10)                     */}
      {/* ========================================================================= */}
      {submittedQuery && viewAllCategory && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Vertical Sub-Rail with Top Back Button */}
          <div className="w-12 sm:w-14 bg-black/20 flex flex-col justify-start items-center py-3 select-none flex-shrink-0 overflow-y-auto no-scrollbar">
            {/* Top Back Button inside Left Rail */}
            <button
              onClick={() => setViewAllCategory(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors mb-5 flex-shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Rotated Sub Tabs */}
            <div className="flex flex-col gap-6 sm:gap-7 items-center py-1 flex-1">
              {subTabs.map((tab) => {
                const isActive = viewAllCategory === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'Results') {
                        setViewAllCategory(null);
                        setActiveSubTab('Results');
                      } else {
                        setViewAllCategory(tab);
                      }
                    }}
                    className={`[writing-mode:vertical-rl] rotate-180 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all py-0.5 ${
                      isActive
                        ? 'text-white border-r-2 border-white font-black pr-0.5'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full List Content */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {viewAllCategory}
                </h1>
                <p className="text-xs text-zinc-400">
                  {viewAllCategory === 'Songs'
                    ? `${searchResults.songs.length} items`
                    : viewAllCategory === 'Albums'
                    ? `${searchResults.albums.length} items`
                    : viewAllCategory === 'Artists'
                    ? `${searchResults.artists.length} items`
                    : `${searchResults.videos.length} items`}
                </p>
              </div>

              {/* Sort Icons */}
              <div className="flex items-center gap-3 text-zinc-400">
                <button className="hover:text-white p-1" title="Sort A-Z">
                  <ArrowDownAZ className="w-5 h-5" />
                </button>
                <button className="hover:text-white p-1" title="Sort by time">
                  <Clock className="w-5 h-5" />
                </button>
                <button className="hover:text-white p-1" title="Order">
                  <ArrowUpDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              {(viewAllCategory === 'Songs' ? searchResults.songs : searchResults.videos).map(
                (track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() =>
                      playTrack(
                        track,
                        viewAllCategory === 'Songs' ? searchResults.songs : searchResults.videos
                      )
                    }
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 relative shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          onError={(e) => {
                            e.currentTarget.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                          {track.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono pr-2">
                      {track.durationFormatted}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
