'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { TrackCard } from '@/components/TrackCard';
import { SettingsView } from '@/components/SettingsView';
import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';
import { CacheService } from '@/lib/cache';
import { OfflineStore } from '@/lib/offlineStore';
import {
  Sparkles,
  LayoutGrid,
  List,
  Music2,
  ListMusic,
  Disc3,
  Mic2,
  Play,
  Loader2,
  Flame,
  Search,
  ChevronLeft,
  Clock,
  Heart,
  Plane,
  Download,
  Shuffle,
  Music,
} from 'lucide-react';

const INITIAL_FALLBACK_TRACKS: Track[] = [
  {
    id: 'foEUtbLVBgw',
    title: 'Ride It (Kya Yehi Pyaar Hai)',
    artist: 'Jay Sean, Sagar',
    album: 'All or Nothing',
    duration: 194,
    durationFormatted: '3:14',
    thumbnail: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg',
  },
  {
    id: '2g5Hz1AsCBo',
    title: 'Kesariya - Brahmāstra',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmāstra',
    duration: 268,
    durationFormatted: '4:28',
    thumbnail: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi, Daddy Yankee',
    album: 'VIDA',
    duration: 282,
    durationFormatted: '4:42',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
  },
  {
    id: '50VNCymT-Cs',
    title: 'Tu Hai Kahan - AUR',
    artist: 'AUR, Usama, Raffey',
    album: 'Tu Hai Kahan',
    duration: 263,
    durationFormatted: '4:23',
    thumbnail: 'https://i.ytimg.com/vi/50VNCymT-Cs/hqdefault.jpg',
  },
];

const FEATURED_ARTISTS = [
  { name: 'The Weeknd', query: 'The Weeknd songs', image: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  { name: 'Arijit Singh', query: 'Arijit Singh songs', image: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
  { name: 'Karan Aujla', query: 'Karan Aujla songs', image: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
  { name: 'Diljit Dosanjh', query: 'Diljit Dosanjh hits', image: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg' },
  { name: 'Jay Sean', query: 'Jay Sean songs', image: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
  { name: 'Shreya Ghoshal', query: 'Shreya Ghoshal hits', image: 'https://i.ytimg.com/vi/aLkd70P6QW4/hqdefault.jpg' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Active custom playlist view (e.g. History, Favorites, Offline)
  const [openedPlaylist, setOpenedPlaylist] = useState<{
    id: string;
    title: string;
    description?: string;
    icon?: any;
    tracks: Track[];
  } | null>(null);

  // Tab Data States
  const [tracks, setTracks] = useState<Track[]>(INITIAL_FALLBACK_TRACKS);
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  // BOLI State
  const [boliData, setBoliData] = useState<{
    basedOn: { id?: string; title?: string; artist?: string } | null;
    quickPicks: Track[];
    artistTopTracks: Track[];
    artistAlbums: any[];
    relatedPlaylists: any[];
  }>({
    basedOn: null,
    quickPicks: [],
    artistTopTracks: [],
    artistAlbums: [],
    relatedPlaylists: [],
  });

  const { currentTrack, history, favorites, playTrack, toggleFavorite, isFavorite } = usePlayerStore();
  const { backgroundColor, themeMode } = useThemeStore();

  // 1. Fetch BOLI Data for a song with smart caching
  const loadBoliContent = useCallback(async (song: Track) => {
    const cacheKey = `boli_${song.id}`;
    const cached = CacheService.get(cacheKey);

    if (cached) {
      setBoliData(cached);
      return;
    }

    try {
      const res = await fetch(
        `/api/boli?id=${song.id}&artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`
      );
      if (res.ok) {
        const data = await res.json();
        setBoliData(data);
        CacheService.set(cacheKey, data, 120);
      }
    } catch (err) {
      console.error('BOLI fetch error:', err);
    }
  }, []);

  // 2. React to Track changes and trigger BOLI updates
  useEffect(() => {
    const activeSong = currentTrack || (history.length > 0 ? history[0] : null);
    if (activeSong) {
      loadBoliContent(activeSong);
    }
  }, [currentTrack, history, loadBoliContent]);

  // 3. Load Offline Tracks
  const loadOfflineData = async () => {
    const offTracks = await OfflineStore.getAllTracks();
    setOfflineTracks(offTracks);
  };

  useEffect(() => {
    loadOfflineData();
  }, [currentTrack]);

  // 4. General Search & Category Fetcher
  const fetchCategoryTracks = async (query: string, type: 'song' | 'playlist' | 'album' = 'song') => {
    const cacheKey = `search_${type}_${query}`;
    const cached = CacheService.get(cacheKey);

    if (cached) {
      if (type === 'song') setTracks(cached);
      if (type === 'playlist') setPlaylists(cached);
      if (type === 'album') setAlbums(cached);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        if (type === 'song') setTracks(data.tracks);
        CacheService.set(cacheKey, data.tracks, 60);
      }
    } catch (err) {
      console.error('Category fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Tab Switching
  useEffect(() => {
    setOpenedPlaylist(null);
    if (activeTab === 'home') {
      if (boliData.quickPicks.length === 0) {
        fetchCategoryTracks('Top Indian & Global Hits 2026', 'song');
      }
    } else if (activeTab === 'songs') {
      fetchCategoryTracks(searchQuery || 'Top Trending Songs 2026', 'song');
    } else if (activeTab === 'playlists') {
      loadCategoryPlaylists();
    } else if (activeTab === 'albums') {
      loadCategoryAlbums();
    }
  }, [activeTab]);

  const loadCategoryPlaylists = async () => {
    const cached = CacheService.get('static_playlists');
    if (cached) {
      setPlaylists(cached);
      return;
    }
    const samplePlaylists = [
      { id: 'rain_therapy', title: 'Rain Therapy 🍀🌧️', author: 'CloudBeatz Vibe', itemCount: '50 Songs', thumbnail: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
      { id: 'romance_now', title: 'Romance Right Now', author: 'Bollywood Love', itemCount: '40 Songs', thumbnail: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
      { id: 'punjabi_hotlist', title: 'Punjabi Hotlist 2026', author: 'Hits Radio', itemCount: '35 Songs', thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
      { id: 'lofi_chill', title: 'Lo-Fi Chill & Focus', author: 'CloudBeatz', itemCount: '60 Songs', thumbnail: 'https://i.ytimg.com/vi/50VNCymT-Cs/hqdefault.jpg' },
    ];
    setPlaylists(samplePlaylists);
    CacheService.set('static_playlists', samplePlaylists, 180);
  };

  const loadCategoryAlbums = async () => {
    const cached = CacheService.get('static_albums');
    if (cached) {
      setAlbums(cached);
      return;
    }
    const sampleAlbums = [
      { id: 'MPREb_Starboy', title: 'Starboy', artist: 'The Weeknd', year: '2016', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
      { id: 'MPREb_MakingMemories', title: 'Making Memories', artist: 'Karan Aujla, Ikky', year: '2023', thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
      { id: 'MPREb_Brahmastra', title: 'Brahmāstra', artist: 'Pritam, Arijit Singh', year: '2022', thumbnail: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
      { id: 'MPREb_Ghost', title: 'Ghost', artist: 'Diljit Dosanjh', year: '2023', thumbnail: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg' },
      { id: 'MPREb_AllOrNothing', title: 'All or Nothing', artist: 'Jay Sean', year: '2009', thumbnail: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
    ];
    setAlbums(sampleAlbums);
    CacheService.set('static_albums', sampleAlbums, 180);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (activeTab === 'home' || activeTab === 'settings' || activeTab === 'playlists') {
      setActiveTab('songs');
    }
    fetchCategoryTracks(q, 'song');
  };

  const handleArtistClick = (artistQuery: string) => {
    setSearchQuery(artistQuery);
    setActiveTab('songs');
    fetchCategoryTracks(artistQuery, 'song');
  };

  const activeAppBg =
    themeMode === 'dark'
      ? '#09090b'
      : themeMode === 'light'
      ? '#261622'
      : themeMode === 'dynamic'
      ? backgroundColor || '#160913'
      : '#09090b';

  return (
    <div
      style={{ backgroundColor: activeAppBg }}
      className="flex h-screen w-screen overflow-hidden text-white transition-colors duration-500"
    >
      {/* Sidebar / Left Rotated Rail */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Scrollable Canvas */}
      <main
        className={`flex-1 flex flex-col ${
          currentTrack ? 'h-[calc(100vh-70px)] md:h-[calc(100vh-88px)]' : 'h-screen'
        } overflow-y-auto relative transition-all duration-300`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/20 backdrop-blur-xl border-b border-white/5 gap-3">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {activeTab !== 'settings' && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* 📚 PLAYLIST DETAIL / HUB VIEW (History, Favorites, Offline, etc.)          */}
        {/* ========================================================================= */}
        {openedPlaylist ? (
          <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-200 pb-20">
            {/* Back Button */}
            <button
              onClick={() => setOpenedPlaylist(null)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </button>

            {/* Gradient Banner (Screenshot 2 & 3 Exact Replica) */}
            <div className="w-full rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-700 via-rose-600 to-amber-600 shadow-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                <Music className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {openedPlaylist.title}
                </h1>
                <p className="text-xs text-white/80 font-medium mt-1">playlist &bull; {openedPlaylist.tracks.length} tracks</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => openedPlaylist.tracks[0] && playTrack(openedPlaylist.tracks[0], openedPlaylist.tracks)}
                  disabled={openedPlaylist.tracks.length === 0}
                  className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play All</span>
                </button>
              </div>
            </div>

            {/* Song List in Playlist */}
            {openedPlaylist.tracks.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 space-y-2">
                <p className="text-sm font-medium">Empty playlist!</p>
                <p className="text-xs text-zinc-600">Start playing songs to build this list automatically.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                {openedPlaylist.tracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, openedPlaylist.tracks)}
                    className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-500 w-5 text-center">{idx + 1}</span>
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-rose-400 transition-colors truncate">
                          {track.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-zinc-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono pr-2">{track.durationFormatted}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 🏠 TAB 1: HOME / DISCOVER (BOLI Dynamic Engine - Screenshot 2 & 4)         */}
            {/* ========================================================================= */}
            {activeTab === 'home' && (
              <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Discover</h2>
                </div>

                {/* Section 1: 2-Row Horizontal Scroll or Grid of Quick Picks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(boliData.quickPicks.length > 0 ? boliData.quickPicks.slice(0, 8) : tracks.slice(0, 8)).map(
                    (track) => (
                      <div
                        key={track.id}
                        onClick={() =>
                          playTrack(
                            track,
                            boliData.quickPicks.length > 0 ? boliData.quickPicks : tracks
                          )
                        }
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group select-none shadow-sm"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 relative shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Section 2: Artist Albums (Screenshot 2: "The Weeknd Albums") */}
                {(boliData.artistAlbums.length > 0 ? boliData.artistAlbums : albums).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {boliData.basedOn?.artist ? `${boliData.basedOn.artist} Albums` : 'Top & Trending Albums'}
                    </h3>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                      {(boliData.artistAlbums.length > 0 ? boliData.artistAlbums : albums).map((alb) => (
                        <div
                          key={alb.id}
                          onClick={() => handleArtistClick(`${alb.title} ${alb.artist}`)}
                          className="min-w-[150px] max-w-[150px] snap-start flex-shrink-0 group cursor-pointer"
                        >
                          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-black/40 relative shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={alb.thumbnail}
                              alt={alb.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">{alb.title}</h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            Album &bull; {alb.year || '2024'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Mood Playlists (Screenshot 4: "Rain Therapy 🍀🌧️") */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Rain Therapy 🍀🌧️
                  </h3>

                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {(boliData.relatedPlaylists.length > 0 ? boliData.relatedPlaylists : playlists).map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => handleArtistClick(pl.title)}
                        className="min-w-[150px] max-w-[150px] snap-start flex-shrink-0 group cursor-pointer"
                      >
                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-black/40 relative shadow-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pl.thumbnail}
                            alt={pl.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{pl.title}</h4>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{pl.author || 'Mix'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🎵 TAB 2: SONGS (Screenshot 4: "Library Songs")                            */}
            {/* ========================================================================= */}
            {activeTab === 'songs' && (
              <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Library Songs</h2>
                  <span className="text-xs text-zinc-400">{tracks.length} items</span>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                    <p className="text-sm font-medium">Fetching songs...</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {tracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    {tracks.map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, tracks)}
                        className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-xs font-bold text-zinc-500 w-5 text-center">{idx + 1}</span>
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-rose-400 transition-colors truncate">
                              {track.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono pr-2">{track.durationFormatted}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 📑 TAB 3: PLAYLISTS (Screenshot 1: "Library Playlists" - 4 Main Cards)      */}
            {/* ========================================================================= */}
            {activeTab === 'playlists' && (
              <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Library Playlists</h2>
                  <span className="text-xs text-zinc-400">4 items</span>
                </div>

                {/* Screenshot 1: 4 Big Aesthetic Cards */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {/* Card 1: Recently Played (History) */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'history',
                        title: 'Recently Played',
                        tracks: history,
                      })
                    }
                    className="aspect-square rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-6 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-3 transition-colors">
                      <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Recently Played</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">{history.length} songs</p>
                  </div>

                  {/* Card 2: Favorites */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'favorites',
                        title: 'Favorites',
                        tracks: favorites,
                      })
                    }
                    className="aspect-square rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-6 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-rose-400 mb-3 transition-colors">
                      <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Favorites</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">{favorites.length} songs</p>
                  </div>

                  {/* Card 3: Cached / Offline */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'offline',
                        title: 'Cached/Offline',
                        tracks: offlineTracks,
                      })
                    }
                    className="aspect-square rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-6 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-3 transition-colors">
                      <Plane className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Cached/Offline</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">{offlineTracks.length} songs</p>
                  </div>

                  {/* Card 4: Curated / Downloads */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'curated',
                        title: 'Curated Hits',
                        tracks: tracks,
                      })
                    }
                    className="aspect-square rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-6 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-3 transition-colors">
                      <Download className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Curated Hits</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">{tracks.length} songs</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 💿 TAB 4: ALBUMS                                                          */}
            {/* ========================================================================= */}
            {activeTab === 'albums' && (
              <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Library Albums</h2>
                  <span className="text-xs text-zinc-400">{albums.length} albums</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {albums.map((alb) => (
                    <div
                      key={alb.id}
                      onClick={() => handleArtistClick(`${alb.title} ${alb.artist}`)}
                      className="group p-3.5 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 transition-all cursor-pointer shadow-lg"
                    >
                      <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-black/40 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={alb.thumbnail}
                          alt={alb.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{alb.title}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {alb.artist} &bull; {alb.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🎤 TAB 5: ARTISTS                                                         */}
            {/* ========================================================================= */}
            {activeTab === 'artists' && (
              <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Artists</h2>
                  <span className="text-xs text-zinc-400">{FEATURED_ARTISTS.length} artists</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {FEATURED_ARTISTS.map((artist) => (
                    <div
                      key={artist.name}
                      onClick={() => handleArtistClick(artist.query)}
                      className="group p-4 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 transition-all cursor-pointer text-center flex flex-col items-center shadow-lg"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 bg-zinc-800 shadow-md relative group-hover:ring-2 group-hover:ring-rose-400/50 transition-all">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate w-full">
                        {artist.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-rose-400/80 uppercase tracking-widest mt-1">
                        Artist
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ⚙️ TAB 6: SETTINGS                                                        */}
            {/* ========================================================================= */}
            {activeTab === 'settings' && <SettingsView />}
          </>
        )}

        {/* Floating Search FAB Button on Mobile (Screenshots 2 & 4) */}
        <button
          onClick={() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="fixed bottom-20 right-4 md:hidden z-30 w-12 h-12 rounded-2xl bg-[#3b2a37] text-white flex items-center justify-center shadow-2xl border border-white/10 active:scale-95 transition-all"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </main>
    </div>
  );
}
