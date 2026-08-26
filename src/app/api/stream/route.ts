import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EXTRACTOR_SERVER_URL = process.env.EXTRACTOR_SERVER_URL || 'http://127.0.0.1:8080';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const rawTitle = searchParams.get('title') || 'Track';
    const rawArtist = searchParams.get('artist') || '';

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Valid 11-character Video ID is required' }, { status: 400 });
    }

    const hintParams = new URLSearchParams();
    hintParams.set('id', videoId);
    if (rawTitle) hintParams.set('title', rawTitle);
    if (rawArtist) hintParams.set('artist', rawArtist);

    // Direct 302 Redirect for instant audio playback
    const baseUrl = EXTRACTOR_SERVER_URL.endsWith('/stream')
      ? EXTRACTOR_SERVER_URL
      : `${EXTRACTOR_SERVER_URL.replace(/\/+$/, '')}/stream`;
    const extractorUrl = `${baseUrl}?${hintParams.toString()}`;
    const extractorResponse = await fetch(extractorUrl, {
      redirect: 'manual',
      cache: 'no-store',
    });

    const streamLocation = extractorResponse.headers.get('location');
    if (streamLocation) {
      return NextResponse.redirect(streamLocation, 302);
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
