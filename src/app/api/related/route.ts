import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { Track } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const yt = await getInnertube();
    const relatedData = await yt.music.getRelated(videoId);

    const tracks: Track[] = [];

    // Extract related songs / sections safely
    const dataAny = relatedData as any;
    const sections = dataAny?.sections || (Array.isArray(dataAny?.contents) ? dataAny.contents : []);

    if (Array.isArray(sections)) {
      for (const section of sections) {
        const contents = section.contents || (Array.isArray(section) ? section : []);
        if (Array.isArray(contents)) {
          for (const item of contents) {
            if (item && item.id && item.title) {
              const durationSec = typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0;
              const thumbnail =
                item.thumbnails?.[0]?.url ||
                `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

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
      }
    }

    return NextResponse.json({ tracks: tracks.slice(0, 20) });
  } catch (error: any) {
    console.error('Related API error:', error);
    return NextResponse.json({ tracks: [] });
  }
}
