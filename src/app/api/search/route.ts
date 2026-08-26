import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { Track, getHighResThumbnail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const yt = await getInnertube();
    const searchResults = await yt.music.search(query, { type: 'song' });

    const tracks: Track[] = [];

    if (searchResults && searchResults.songs) {
      const contents = searchResults.songs.contents || [];
      for (const item of contents) {
        if ('id' in item && item.id && item.title) {
          const durationSec = typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0;
          const thumbnail = getHighResThumbnail(item.thumbnails, item.id);

          tracks.push({
            id: item.id,
            title: item.title?.toString() || 'Unknown Title',
            artist: item.artists?.[0]?.name?.toString() || item.author?.name?.toString() || 'Unknown Artist',
            album: item.album?.name?.toString(),
            duration: durationSec,
            durationFormatted: item.duration?.text || '3:30',
            thumbnail: thumbnail,
          });
        }
      }
    }

    // Fallback if music search returned few results
    if (tracks.length === 0) {
      const generalSearch = await yt.search(query, { type: 'video' });
      for (const video of (generalSearch.videos || []) as any[]) {
        if (video && video.id && video.title) {
          const artist = video.author?.name?.toString() || video.short_byline?.text?.toString() || 'Unknown Artist';
          tracks.push({
            id: video.id,
            title: video.title.toString(),
            artist: artist,
            duration: video.duration?.seconds || 0,
            durationFormatted: video.duration?.text || '3:30',
            thumbnail: video.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
          });
        }
      }
    }

    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search' }, { status: 500 });
  }
}
