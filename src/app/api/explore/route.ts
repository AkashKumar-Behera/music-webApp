import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { Track } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const yt = await getInnertube();
    
    // Search trending / top hits
    const queries = ['Top Hindi Songs 2026', 'Global Top Hits', 'Lo-Fi Chill Beats'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    const searchResults = await yt.music.search(randomQuery, { type: 'song' });
    const tracks: Track[] = [];

    if (searchResults && searchResults.songs) {
      for (const item of searchResults.songs.contents || []) {
        if ('id' in item && item.id && item.title) {
          const durationSec = typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0;
          tracks.push({
            id: item.id,
            title: item.title?.toString() || 'Unknown Title',
            artist: item.artists?.[0]?.name?.toString() || item.author?.name?.toString() || 'Unknown Artist',
            album: item.album?.name?.toString(),
            duration: durationSec,
            durationFormatted: item.duration?.text || '3:30',
            thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          });
        }
      }
    }

    return NextResponse.json({ tracks: tracks.slice(0, 20) });
  } catch (error: any) {
    console.error('Explore API Error:', error);
    return NextResponse.json({ tracks: [] });
  }
}
