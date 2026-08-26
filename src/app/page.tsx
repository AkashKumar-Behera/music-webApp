'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { SearchView } from '@/components/SearchView';
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
  MoreVertical,
} from 'lucide-react';

const INITIAL_FALLBACK_TRACKS: Track[] = [
  {
    id: 'u6lihZAcy4s',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 215,
    durationFormatted: '3:35',
    thumbnail: 'https://i.ytimg.com/vi/u6lihZAcy4s/hqdefault.jpg',
  },
  {
    id: '34Na4j8AVgA',
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    durationFormatted: '3:50',
    thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
  },
  {
    id: 'mTLQhPFx2nM',
    title: 'Die For You',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 260,
    durationFormatted: '4:20',
    thumbnail: 'https://i.ytimg.com/vi/mTLQhPFx2nM/hqdefault.jpg',
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    durationFormatted: '3:20',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 233,
    durationFormatted: '3:53',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 263,
    durationFormatted: '4:23',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    durationFormatted: '2:47',
    thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
  },
  {
    id: 'TUVcZfQe-Kw',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    durationFormatted: '3:23',
    thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
  },
  {
    id: '5NV6Rdv1a3I',
    title: 'Get Lucky',
    artist: 'Daft Punk, Pharrell Williams',
    album: 'Random Access Memories',
    duration: 248,
    durationFormatted: '4:08',
    thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
  },
  {
    id: 'nYh-n7EOtMA',
    title: 'Cheap Thrills',
    artist: 'Sia',
    album: 'This Is Acting',
    duration: 211,
    durationFormatted: '3:31',
    thumbnail: 'https://i.ytimg.com/vi/nYh-n7EOtMA/hqdefault.jpg',
  },
  {
    id: 'nfs8NYg7yQM',
    title: 'Attention',
    artist: 'Charlie Puth',
    album: 'Voicenotes',
    duration: 208,
    durationFormatted: '3:28',
    thumbnail: 'https://i.ytimg.com/vi/nfs8NYg7yQM/hqdefault.jpg',
  },
  {
    id: 'qFLhGq0060w',
    title: 'I Feel It Coming (feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 269,
    durationFormatted: '4:29',
    thumbnail: 'https://i.ytimg.com/vi/qFLhGq0060w/hqdefault.jpg',
  },
  {
    id: 'KEI4qSrkPAs',
    title: "Can't Feel My Face",
    artist: 'The Weeknd',
    album: 'Beauty Behind the Madness',
    duration: 213,
    durationFormatted: '3:33',
    thumbnail: 'https://i.ytimg.com/vi/KEI4qSrkPAs/hqdefault.jpg',
  },
  {
    id: 'yzTuBuRdAyA',
    title: 'The Hills',
    artist: 'The Weeknd',
    album: 'Beauty Behind the Madness',
    duration: 242,
    durationFormatted: '4:02',
    thumbnail: 'https://i.ytimg.com/vi/yzTuBuRdAyA/hqdefault.jpg',
  },
  {
    id: 'dqRZDebPIGs',
    title: 'In Your Eyes',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 237,
    durationFormatted: '3:57',
    thumbnail: 'https://i.ytimg.com/vi/dqRZDebPIGs/hqdefault.jpg',
  },
  {
    id: 'WxYgXmZ9xh8',
    title: 'After Hours',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 361,
    durationFormatted: '6:01',
    thumbnail: 'https://i.ytimg.com/vi/WxYgXmZ9xh8/hqdefault.jpg',
  },
  {
    id: 'M4ZoCHID9GI',
    title: 'Call Out My Name',
    artist: 'The Weeknd',
    album: 'My Dear Melancholy,',
    duration: 228,
    durationFormatted: '3:48',
    thumbnail: 'https://i.ytimg.com/vi/M4ZoCHID9GI/hqdefault.jpg',
  },
  {
    id: 'waU75jdUnYw',
    title: 'Earned It',
    artist: 'The Weeknd',
    album: 'Beauty Behind the Madness',
    duration: 252,
    durationFormatted: '4:12',
    thumbnail: 'https://i.ytimg.com/vi/waU75jdUnYw/hqdefault.jpg',
  },
  {
    id: 'VPRjCeoBqrI',
    title: 'A Sky Full of Stars',
    artist: 'Coldplay',
    album: 'Ghost Stories',
    duration: 267,
    durationFormatted: '4:27',
    thumbnail: 'https://i.ytimg.com/vi/VPRjCeoBqrI/hqdefault.jpg',
  },
  {
    id: 'YykjpeuMNEk',
    title: 'Hymn for the Weekend',
    artist: 'Coldplay',
    album: 'A Head Full of Dreams',
    duration: 258,
    durationFormatted: '4:18',
    thumbnail: 'https://i.ytimg.com/vi/YykjpeuMNEk/hqdefault.jpg',
  },
  {
    id: '1G4isv_Fylg',
    title: 'Paradise',
    artist: 'Coldplay',
    album: 'Mylo Xyloto',
    duration: 277,
    durationFormatted: '4:37',
    thumbnail: 'https://i.ytimg.com/vi/1G4isv_Fylg/hqdefault.jpg',
  },
  {
    id: 'yKNxeF4KMsY',
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    duration: 269,
    durationFormatted: '4:29',
    thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
  },
  {
    id: 'GzU8KqOY8YA',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: 200,
    durationFormatted: '3:20',
    thumbnail: 'https://i.ytimg.com/vi/GzU8KqOY8YA/hqdefault.jpg',
  },
  {
    id: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson, Bruno Mars',
    album: 'Uptown Special',
    duration: 270,
    durationFormatted: '4:30',
    thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
  },
  {
    id: '09R8_2nJtjg',
    title: 'Sugar',
    artist: 'Maroon 5',
    album: 'V',
    duration: 235,
    durationFormatted: '3:55',
    thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
  },
  {
    id: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    album: 'Evolve',
    duration: 204,
    durationFormatted: '3:24',
    thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
  },
  {
    id: '3tmd-ClpJxA',
    title: 'Blank Space',
    artist: 'Taylor Swift',
    album: '1989',
    duration: 231,
    durationFormatted: '3:51',
    thumbnail: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 359,
    durationFormatted: '5:59',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
  },
];

const DEFAULT_ALBUMS = [
  {
    id: 'alb_1',
    title: 'Starboy',
    artist: 'The Weeknd',
    year: '2016',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'alb_2',
    title: 'After Hours',
    artist: 'The Weeknd',
    year: '2020',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'alb_3',
    title: 'Beauty Behind the Madness',
    artist: 'The Weeknd',
    year: '2015',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/30/05/1e/30051e57-a63a-3acc-4b30-42568293f5f7/15UMGIM36514.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'alb_4',
    title: 'The Highlights',
    artist: 'The Weeknd',
    year: '2021',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4b/ab/3c/4bab3c0d-ea9a-ad8e-4229-b1e73cad0283/21UMGIM06668.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'alb_5',
    title: 'My Dear Melancholy,',
    artist: 'The Weeknd',
    year: '2018',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/db/22/4e/db224ee0-b058-5d06-9a8c-fa10662bd58e/18UMGIM17205.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'alb_6',
    title: 'Dawn FM',
    artist: 'The Weeknd',
    year: '2022',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/43/78/42/4378428d-a820-4583-8ab9-e14df060810f/22UMGIM75274.rgb.jpg/600x600bb.jpg',
  },
];

const DEFAULT_PLAYLISTS = [
  {
    id: 'pl_1',
    title: 'The Weeknd Complete Collection',
    author: 'The Weeknd',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
  },
  {
    id: 'pl_2',
    title: 'Community Playlists',
    author: 'CloudBeatz Curated',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pl_3',
    title: 'Late Night Drive',
    author: 'Synthwave & Chill',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'pl_4',
    title: 'Global Pop Hits',
    author: 'Top Billboard 100',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  },
];

const FEATURED_ARTISTS = [
  { name: 'The Weeknd', query: 'The Weeknd songs', image: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  { name: 'Arijit Singh', query: 'Arijit Singh songs', image: 'https://i.ytimg.com/vi/2g5Hz1AsCBo/hqdefault.jpg' },
  { name: 'Ed Sheeran', query: 'Ed Sheeran songs', image: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
  { name: 'Daft Punk', query: 'Daft Punk songs', image: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg' },
  { name: 'Dua Lipa', query: 'Dua Lipa hits', image: 'https://i.ytimg.com/vi/bY1T2g6l4nE/hqdefault.jpg' },
  { name: 'Coldplay', query: 'Coldplay hits', image: 'https://i.ytimg.com/vi/VPRjCeoBqrI/hqdefault.jpg' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
  const [playlists, setPlaylists] = useState<any[]>(DEFAULT_PLAYLISTS);
  const [albums, setAlbums] = useState<any[]>(DEFAULT_ALBUMS);

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
      if (boliData.quickPicks.length === 0 && tracks.length === 0) {
        setTracks(INITIAL_FALLBACK_TRACKS);
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
      { id: 'top_global_hits', title: 'Top Global Hits', author: 'CloudBeatz Vibe', itemCount: '50 Songs', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
      { id: 'romance_now', title: 'Romance Right Now', author: 'Bollywood Love', itemCount: '40 Songs', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
      { id: 'punjabi_hotlist', title: 'Punjabi Hotlist 2026', author: 'Hits Radio', itemCount: '35 Songs', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80' },
      { id: 'lofi_chill', title: 'Lo-Fi Chill & Focus', author: 'CloudBeatz', itemCount: '60 Songs', thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
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
        {/* Top Header Bar (Desktop Only - Compact Discover + SearchBar) */}
        <header
          style={{ backgroundColor: activeAppBg }}
          className="sticky top-0 z-30 hidden md:flex items-center gap-8 px-8 pt-6 pb-2 transition-colors duration-500"
        >
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex-shrink-0">
            {activeTab === 'home'
              ? 'Discover'
              : activeTab === 'songs'
              ? 'Songs'
              : activeTab === 'playlists'
              ? 'Playlists'
              : activeTab === 'albums'
              ? 'Albums'
              : activeTab === 'artists'
              ? 'Artists'
              : 'Settings'}
          </h2>

          <div className="w-full max-w-xl">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {openedPlaylist ? (
            <motion.div
              key={`playlist-${openedPlaylist.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-8 space-y-6 pb-20"
            >
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
          </motion.div>
        ) : (
          <motion.div
            key={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ========================================================================= */}
            {/* 🏠 TAB 1: HOME / DISCOVER (BOLI Dynamic Engine - Screenshots 1, 2, 3, 4)   */}
            {/* ========================================================================= */}
            {activeTab === 'home' && (
              <div className="p-4 sm:p-6 md:px-8 md:pb-8 md:pt-3 pt-10 space-y-6 animate-in fade-in duration-300 pb-24">
                <div className="flex md:hidden items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Discover</h2>
                </div>

                {/* Section 1: 4-Row Horizontal Scrolling Grid (Screenshots 1-4 Exact Replica) */}
                <div className="grid grid-rows-4 grid-flow-col auto-cols-[260px] sm:auto-cols-[280px] md:auto-cols-[300px] gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
                  {(boliData.quickPicks.length > 0 ? boliData.quickPicks : tracks).map(
                    (track) => (
                      <div
                        key={track.id}
                        onClick={() =>
                          playTrack(
                            track,
                            boliData.quickPicks.length > 0 ? boliData.quickPicks : tracks
                          )
                        }
                        className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group select-none snap-start min-w-[260px]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 relative shadow-md">
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
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                              {track.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* Section 2: Artist Albums (Screenshot 2: "The Weeknd Albums" / "Ed Sheeran Albums") */}
                {(boliData.artistAlbums.length > 0 ? boliData.artistAlbums : albums).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {boliData.basedOn?.artist ? `${boliData.basedOn.artist} Albums` : 'The Weeknd Albums'}
                    </h3>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
                      {(boliData.artistAlbums.length > 0 ? boliData.artistAlbums : albums).map((alb) => (
                        <div
                          key={alb.id}
                          onClick={() => handleArtistClick(`${alb.title} ${alb.artist}`)}
                          className="min-w-[150px] max-w-[150px] snap-start flex-shrink-0 group cursor-pointer"
                        >
                          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-zinc-900 relative shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={alb.thumbnail}
                              alt={alb.title}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60';
                              }}
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

                {/* Section 3: Community Playlists (Screenshot 5 Left Exact Replica) */}
                {(boliData.relatedPlaylists.length > 0 ? boliData.relatedPlaylists : playlists).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {boliData.basedOn?.artist ? `${boliData.basedOn.artist} Mixes` : 'Community playlists'}
                    </h3>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
                      {(boliData.relatedPlaylists.length > 0 ? boliData.relatedPlaylists : playlists).map((pl) => (
                        <div
                          key={pl.id}
                          onClick={() => handleArtistClick(pl.title)}
                          className="min-w-[150px] max-w-[150px] snap-start flex-shrink-0 group cursor-pointer"
                        >
                          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2.5 bg-zinc-900 relative shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={pl.thumbnail}
                              alt={pl.title}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60';
                              }}
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
              <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Library Playlists</h2>
                  <span className="text-xs text-zinc-400">4 smart categories &bull; {playlists.length} mixes</span>
                </div>

                {/* 4 Smart Library Cards: 2-cols on mobile, 4-cols on tablet/desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {/* Card 1: Recently Played (History) */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'history',
                        title: 'Recently Played',
                        tracks: history,
                      })
                    }
                    className="aspect-square sm:aspect-[4/3] md:aspect-auto md:py-8 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-5 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-2.5 transition-colors">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Recently Played</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{history.length} songs</p>
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
                    className="aspect-square sm:aspect-[4/3] md:aspect-auto md:py-8 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-5 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-rose-400 mb-2.5 transition-colors">
                      <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Favorites</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{favorites.length} songs</p>
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
                    className="aspect-square sm:aspect-[4/3] md:aspect-auto md:py-8 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-5 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-2.5 transition-colors">
                      <Plane className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Cached/Offline</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{offlineTracks.length} songs</p>
                  </div>

                  {/* Card 4: Curated / Hits */}
                  <div
                    onClick={() =>
                      setOpenedPlaylist({
                        id: 'curated',
                        title: 'Curated Hits',
                        tracks: tracks,
                      })
                    }
                    className="aspect-square sm:aspect-[4/3] md:aspect-auto md:py-8 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 p-5 flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl transition-all active:scale-95 select-none"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white mb-2.5 transition-colors">
                      <Download className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Curated Hits</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{tracks.length} songs</p>
                  </div>
                </div>

                {/* Additional Curated Mood Playlists on Desktop */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-white tracking-tight">Curated Mood Mixes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => handleArtistClick(pl.title)}
                        className="group p-3.5 rounded-3xl bg-[#291b26] hover:bg-[#342231] border border-white/5 transition-all cursor-pointer shadow-lg"
                      >
                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-black/40 relative shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pl.thumbnail}
                            alt={pl.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{pl.title}</h4>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{pl.author} &bull; {pl.itemCount}</p>
                      </div>
                    ))}
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
          </motion.div>
        )}
        </AnimatePresence>

        {/* Floating Search FAB Button on Mobile (Screenshots 1-4 Exact Replica) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className={`fixed right-4 md:hidden z-30 w-12 h-12 rounded-2xl bg-[#3b2a37] text-white flex items-center justify-center shadow-2xl border border-white/10 active:scale-95 transition-all duration-300 ease-in-out hover:bg-[#4b3546] ${
            currentTrack ? 'bottom-[86px]' : 'bottom-6'
          }`}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Dedicated CloudBeatz Search View Overlay (Screenshots 5-10) */}
        <SearchView
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectArtistOrAlbum={handleArtistClick}
        />
      </main>
    </div>
  );
}
