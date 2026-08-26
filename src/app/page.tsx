'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { TrackCard } from '@/components/TrackCard';
import { SettingsView } from '@/components/SettingsView';
import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { CacheService } from '@/lib/cache';
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
  Radio,
  Clock,
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
  {
    id: 'hhuHLz5p-hI',
    title: 'Softly - Karan Aujla',
    artist: 'Karan Aujla, Ikky',
    album: 'Making Memories',
    duration: 156,
    durationFormatted: '2:36',
    thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg',
  },
];

const FEATURED_ARTISTS = [
  { name: 'Arijit Singh', query: 'Arijit Singh songs', image: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
  { name: 'Karan Aujla', query: 'Karan Aujla songs', image: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
  { name: 'Diljit Dosanjh', query: 'Diljit Dosanjh hits', image: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg' },
  { name: 'The Weeknd', query: 'The Weeknd songs', image: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  { name: 'Shreya Ghoshal', query: 'Shreya Ghoshal hits', image: 'https://i.ytimg.com/vi/aLkd70P6QW4/hqdefault.jpg' },
  { name: 'Jay Sean', query: 'Jay Sean songs', image: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
  { name: 'Taylor Swift', query: 'Taylor Swift hits', image: 'https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg' },
  { name: 'Sidhu Moose Wala', query: 'Sidhu Moose Wala best', image: 'https://i.ytimg.com/vi/pXPHSAUPiug/hqdefault.jpg' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Tab Data States
  const [tracks, setTracks] = useState<Track[]>(INITIAL_FALLBACK_TRACKS);
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

  const { currentTrack, history, playTrack } = usePlayerStore();

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
        CacheService.set(cacheKey, data, 120); // 2 hours TTL
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

  // 3. General Track / Search Fetcher with Caching
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

  // 4. Tab switching logic
  useEffect(() => {
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
      { id: 'RDCLAK5uy_kmPRjHDECIcuVwnKsx2NgGkvKgxRrjQ4U', title: 'Today’s Biggest Hits', author: 'YouTube Music', itemCount: '50 Songs', thumbnail: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
      { id: 'RDCLAK5uy_n9Fbdw7e6ap-9OrrwAOTUs3_7Pp5x-tc8', title: 'Bollywood Romantic Melodies', author: 'CloudBeatz Curated', itemCount: '40 Songs', thumbnail: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
      { id: 'RDCLAK5uy_lBN6M6y05lD4W4-Dcx0f1s_BfPZ-4bN1g', title: 'Punjabi Hotlist 2026', author: 'Hits Radio', itemCount: '35 Songs', thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
      { id: 'RDCLAK5uy_kfdijf38dklf_LDFJkfdjs345', title: 'Lo-Fi Chill & Focus', author: 'CloudBeatz Vibes', itemCount: '60 Songs', thumbnail: 'https://i.ytimg.com/vi/50VNCymT-Cs/hqdefault.jpg' },
      { id: 'RDCLAK5uy_global_pop_superstars', title: 'Global Pop Superstars', author: 'Top Hits', itemCount: '45 Songs', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
      { id: 'RDCLAK5uy_gym_workout_beast_mode', title: 'Workout & Gym Energy', author: 'Power Mix', itemCount: '30 Songs', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
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
      { id: 'MPREb_Brahmastra', title: 'Brahmāstra (Original Motion Picture)', artist: 'Pritam, Arijit Singh', year: '2022', thumbnail: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
      { id: 'MPREb_MakingMemories', title: 'Making Memories', artist: 'Karan Aujla, Ikky', year: '2023', thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
      { id: 'MPREb_Starboy', title: 'Starboy', artist: 'The Weeknd', year: '2016', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
      { id: 'MPREb_Ghost', title: 'Ghost (Deluxe Edition)', artist: 'Diljit Dosanjh', year: '2023', thumbnail: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg' },
      { id: 'MPREb_AllOrNothing', title: 'All or Nothing', artist: 'Jay Sean', year: '2009', thumbnail: 'https://i.ytimg.com/vi/foEUtbLVBgw/hqdefault.jpg' },
      { id: 'MPREb_Vida', title: 'VIDA', artist: 'Luis Fonsi', year: '2019', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
    ];
    setAlbums(sampleAlbums);
    CacheService.set('static_albums', sampleAlbums, 180);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (activeTab === 'home' || activeTab === 'settings') {
      setActiveTab('songs');
    }
    fetchCategoryTracks(q, 'song');
  };

  const handleArtistClick = (artistQuery: string) => {
    setSearchQuery(artistQuery);
    setActiveTab('songs');
    fetchCategoryTracks(artistQuery, 'song');
  };

  const genres = [
    { label: '🔥 Trending Hindi', query: 'Top Bollywood Hindi Hits 2026' },
    { label: '✨ Punjabi Pop', query: 'Latest Punjabi Pop Hits 2026' },
    { label: '🎧 Lo-Fi Beats', query: 'Lo-Fi Chill Hindi Beats' },
    { label: '🌍 Global Top 50', query: 'Global Billboard Top 50 Songs' },
    { label: '💪 Gym Energy', query: 'High Energy Workout Hits' },
    { label: '🌙 Night Drive', query: 'Midnight Drive Lo-Fi Songs' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 glass border-b border-white/5 gap-2 sm:gap-4">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {activeTab !== 'settings' && (
            <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900/80 p-1 rounded-xl border border-white/10 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* ================= TAB 1: HOME (BOLI SMART ENGINE) ================= */}
        {activeTab === 'home' && (
          <div className="p-4 sm:p-8 space-y-10 animate-in fade-in duration-300">
            {/* BOLI Dynamic Greeting Card */}
            {boliData.basedOn && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-zinc-900/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      BOLI Smart Discovery
                    </span>
                    <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                      Tailored to &ldquo;{boliData.basedOn.title}&rdquo; &bull; {boliData.basedOn.artist}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleArtistClick(`${boliData.basedOn?.artist} mix`)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Play Artist Radio
                </button>
              </div>
            )}

            {/* Section 1: Quick Picks (Similar Vibe) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {boliData.basedOn ? `Quick Picks for You` : `Trending & Quick Picks`}
                  </h2>
                </div>
                <span className="text-xs text-zinc-500">
                  {boliData.quickPicks.length > 0 ? `${boliData.quickPicks.length} tracks` : `${tracks.length} tracks`}
                </span>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none">
                {(boliData.quickPicks.length > 0 ? boliData.quickPicks : tracks).map((track) => (
                  <div key={track.id} className="min-w-[170px] max-w-[170px] snap-start flex-shrink-0">
                    <TrackCard track={track} />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: More from Artist (If Available via BOLI) */}
            {boliData.artistTopTracks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-teal-400" />
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      More by {boliData.basedOn?.artist}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleArtistClick(`${boliData.basedOn?.artist} songs`)}
                    className="text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {boliData.artistTopTracks.slice(0, 6).map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Artist Albums / EPs */}
            {boliData.artistAlbums.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Albums & Releases
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {boliData.artistAlbums.map((alb) => (
                    <div
                      key={alb.id}
                      onClick={() => handleArtistClick(`${alb.title} ${alb.artist}`)}
                      className="group p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer shadow-md"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={alb.thumbnail}
                          alt={alb.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{alb.title}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{alb.artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Related Playlists & Mood Vibes */}
            {boliData.relatedPlaylists.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-teal-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Related Playlists & Vibes
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {boliData.relatedPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => handleArtistClick(`${pl.title}`)}
                      className="group p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer shadow-md"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 relative">
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
            )}
          </div>
        )}

        {/* ================= TAB 2: SONGS (FULL BROWSER & GENRE FILTER) ================= */}
        {activeTab === 'songs' && (
          <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-300">
            {/* Quick Mood Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {genres.map((g) => (
                <button
                  key={g.label}
                  onClick={() => handleSearch(g.query)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-zinc-900/80 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-400 transition-all active:scale-95"
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Tracks Render Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {searchQuery ? `Results for "${searchQuery}"` : 'All Trending Songs'}
                  </h2>
                </div>
                <span className="text-xs text-zinc-500">{tracks.length} tracks available</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-sm font-medium">Discovering high quality music...</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden">
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
                          <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
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
          </div>
        )}

        {/* ================= TAB 3: PLAYLISTS ================= */}
        {activeTab === 'playlists' && (
          <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Curated Mood Playlists</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => handleArtistClick(`${pl.title} songs`)}
                  className="group p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg hover:shadow-emerald-950/20"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pl.thumbnail}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl">
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{pl.title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{pl.author} &bull; {pl.itemCount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ALBUMS ================= */}
        {activeTab === 'albums' && (
          <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Top & Featured Albums</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {albums.map((alb) => (
                <div
                  key={alb.id}
                  onClick={() => handleArtistClick(`${alb.title} ${alb.artist}`)}
                  className="group p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer shadow-lg hover:shadow-teal-950/20"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={alb.thumbnail}
                      alt={alb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{alb.title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{alb.artist} ({alb.year})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ARTISTS ================= */}
        {activeTab === 'artists' && (
          <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Top & Trending Artists</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {FEATURED_ARTISTS.map((artist) => (
                <div
                  key={artist.name}
                  onClick={() => handleArtistClick(artist.query)}
                  className="group p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer text-center flex flex-col items-center shadow-lg"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 bg-zinc-800 shadow-md relative group-hover:ring-2 group-hover:ring-emerald-400/50 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate w-full">
                    {artist.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-widest mt-1">
                    Artist
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: SETTINGS ================= */}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
