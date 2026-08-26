import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EXTRACTOR_SERVER_URL = process.env.EXTRACTOR_SERVER_URL || 'http://127.0.0.1:8080';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const isDownload = searchParams.get('download') === '1';
    const rawTitle = searchParams.get('title') || 'Track';
    const rawArtist = searchParams.get('artist') || '';

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Valid 11-character Video ID is required' }, { status: 400 });
    }

    const hintParams = new URLSearchParams();
    hintParams.set('id', videoId);
    if (rawTitle) hintParams.set('title', rawTitle);
    if (rawArtist) hintParams.set('artist', rawArtist);

    const extractorUrl = `${EXTRACTOR_SERVER_URL}/stream?${hintParams.toString()}`;
    const extractorResponse = await fetch(extractorUrl, {
      redirect: 'manual',
      cache: 'no-store',
    });

    // 1. Direct 302 Redirect to Google/Akamai CDN for instant client playback
    const streamLocation = extractorResponse.headers.get('location');
    if (streamLocation && !isDownload) {
      return NextResponse.redirect(streamLocation, 302);
    }

    // 2. High-speed Direct Download with zero caching
    if (isDownload && streamLocation) {
      const cleanFilename = `${rawArtist ? `${rawArtist} - ` : ''}${rawTitle}.m4a`.replace(/[/\\?%*:|"<>]/g, '_');
      const safeFilename = encodeURIComponent(cleanFilename);
      
      const cdnRes = await fetch(streamLocation, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const resHeaders = new Headers();
      resHeaders.set('Content-Type', cdnRes.headers.get('content-type') || 'audio/mp4');
      resHeaders.set(
        'Content-Disposition',
        `attachment; filename="${cleanFilename.replace(/"/g, '')}"; filename*=UTF-8''${safeFilename}`
      );
      resHeaders.set('Access-Control-Allow-Origin', '*');
      resHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      if (cdnRes.headers.get('content-length')) {
        resHeaders.set('Content-Length', cdnRes.headers.get('content-length')!);
      }

      return new Response(cdnRes.body, {
        status: 200,
        headers: resHeaders,
      });
    }

    if (!extractorResponse.ok && extractorResponse.status !== 302) {
      const errorText = await extractorResponse.text().catch(() => 'Extractor failed');
      return NextResponse.json(
        { error: `Extractor error (${extractorResponse.status}): ${errorText}` },
        { status: extractorResponse.status }
      );
    }

    return NextResponse.json({ error: 'Stream URL not available' }, { status: 500 });
  } catch (error: any) {
    console.error('Stream Route Error:', error);
    return NextResponse.json({ error: error.message || 'Stream extraction failed' }, { status: 500 });
  }
}
