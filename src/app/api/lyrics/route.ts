import { NextRequest, NextResponse } from 'next/server';
import { LyricsResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');
    const duration = searchParams.get('duration');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Clean up title (remove 'Official Video', '(Audio)', etc.)
    const cleanTitle = title
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/ft\..*|feat\..*/i, '')
      .trim();

    const cleanArtist = (artist || '')
      .replace(/VEVO|Topic|- Topic/gi, '')
      .trim();

    // Query LRCLIB
    const lrclibUrl = new URL('https://lrclib.net/api/get');
    lrclibUrl.searchParams.set('track_name', cleanTitle);
    if (cleanArtist) lrclibUrl.searchParams.set('artist_name', cleanArtist);
    if (duration && Number(duration) > 0) lrclibUrl.searchParams.set('duration', duration);

    let res = await fetch(lrclibUrl.toString(), {
      headers: {
        'User-Agent': 'CloudBeatzWeb/1.0',
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      // Fallback: general search query
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'CloudBeatzWeb/1.0' },
        next: { revalidate: 86400 },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          return NextResponse.json(searchData[0] as LyricsResponse);
        }
      }

      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    const data: LyricsResponse = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch lyrics' }, { status: 500 });
  }
}
