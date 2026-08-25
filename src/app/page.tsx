'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { TrackCard } from '@/components/TrackCard';
import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Sparkles, Flame, LayoutGrid, List, Music4, Loader2, Sparkle, Compass, Radio as RadioIcon } from 'lucide-react';

const INITIAL_POPULAR_TRACKS: Track[] = [
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
    id: 'k4yXQkG2s1E',
    title: 'Starboy (Official Music)',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    duration: 230,
    durationFormatted: '3:50',
    thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
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
    id: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi, Daddy Yankee',
    album: 'VIDA',
    duration: 282,
    durationFormatted: '4:42',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>(INITIAL_POPULAR_TRACKS);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [lastInteractedSong, setLastInteractedSong] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { currentTrack, history } = usePlayerStore();

  const genres = [
    { label: 'Trending Hindi', query: 'Top Bollywood Hindi Hits 2026' },
    { label: 'Punjabi Hits', query: 'Latest Punjabi Pop Songs 2026' },
    { label: 'Global Top 50', query: 'Billboard Hot 100 2026' },
    { label: 'Lo-Fi Chill', query: 'Lofi hip hop beats to relax' },
    { label: 'Arijit Singh', query: 'Arijit Singh Best Songs' },
    { label: 'English Pop', query: 'Top English Pop Hits' },
    { label: 'Romantic Vibes', query: 'Bollywood Romantic Melodies' },
  ];

  // Fetch explore / search tracks
  const fetchExploreTracks = async (query = 'Top Indian & Global Hits') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('Explore fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dynamic recommendations based on last interacted song
  const fetchRecommendations = async (track: Track) => {
    try {
      const res = await fetch(`/api/related?id=${track.id}`);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setRecommendedTracks(data.tracks);
        setLastInteractedSong(track);
      }
    } catch (err) {
      console.error('Recommendations fetch failed:', err);
    }
  };

  // Update recommendations when user plays a new song
  useEffect(() => {
    const activeSong = currentTrack || (history.length > 0 ? history[0] : null);
    if (activeSong && activeSong.id !== lastInteractedSong?.id) {
      fetchRecommendations(activeSong);
    }
  }, [currentTrack, history, lastInteractedSong]);

  // Tab switching
  useEffect(() => {
    if (activeTab === 'trending') {
      fetchExploreTracks('Top Global & India Trending Songs');
    } else if (activeTab === 'radio') {
      fetchExploreTracks('Superhit Hindi Punjabi Radio Mix');
    } else if (activeTab === 'home') {
      if (!searchQuery) fetchExploreTracks('Top Indian & Global Hits');
    }
  }, [activeTab]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchExploreTracks(q);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-y-auto">
        {/* Top Header Bar with Live Autocomplete SearchBar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 glass border-b border-white/5 gap-4">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-xl border border-white/10 flex-shrink-0">
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
        </header>

        {/* Hero & Content Container */}
        <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto w-full pb-36">
          {/* Hero Banner */}
          {!searchQuery && (
            <div className="relative rounded-3xl overflow-hidden p-8 md:p-10 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-500/20 shadow-2xl">
              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Web Player
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Listen without limits. <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                    Zero ads, pure music.
                  </span>
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Stream millions of songs with live suggestions, synchronized lyrics, infinite radio autoplay, and
                  smart recommendations tailored to your taste.
                </p>
              </div>

              {/* Ambient blur circle */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-500/10 blur-3xl pointer-events-none" />
            </div>
          )}

          {/* Quick Categories Filter */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {genres.map((g) => (
              <button
                key={g.label}
                onClick={() => handleSearch(g.query)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-emerald-500/30 whitespace-nowrap transition-all active:scale-95 shadow-sm"
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Smart Recommendation Shelf (Based on User's Last Interaction) */}
          {recommendedTracks.length > 0 && !searchQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      Because you listened to &quot;{lastInteractedSong?.title}&quot;
                    </h3>
                    <p className="text-xs text-zinc-400">Similar vibe & artist recommendations</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recommendedTracks.slice(0, 6).map((track) => (
                  <TrackCard key={`rec-${track.id}`} track={track} allTracks={recommendedTracks} viewMode="grid" />
                ))}
              </div>
            </div>
          )}

          {/* Main Tracks Section Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {searchQuery ? (
                    <Music4 className="w-4 h-4" />
                  ) : activeTab === 'trending' ? (
                    <Compass className="w-4 h-4" />
                  ) : activeTab === 'radio' ? (
                    <RadioIcon className="w-4 h-4" />
                  ) : (
                    <Flame className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : activeTab === 'trending'
                      ? 'Trending Charts'
                      : activeTab === 'radio'
                      ? 'Radio & Vibes'
                      : 'Quick Picks & Trending'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {tracks.length > 0 ? `${tracks.length} tracks available` : 'Curated for you'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracks Container */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
                <p className="text-sm font-medium">Fetching high quality tracks...</p>
              </div>
            ) : tracks.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} allTracks={tracks} viewMode="grid" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1 glass-card p-3 rounded-2xl">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} allTracks={tracks} viewMode="list" />
                  ))}
                </div>
              )
            ) : (
              <div className="py-20 text-center text-zinc-500">
                <Music4 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No songs found for this search.</p>
                <p className="text-xs text-zinc-400 mt-1">Try another artist, movie, or song title!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
