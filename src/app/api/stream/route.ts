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

    const range = req.headers.get('range');
    const fetchHeaders: HeadersInit = {
      'User-Agent':
        req.headers.get('user-agent') ||
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    };

    if (range && !isDownload) {
      fetchHeaders['Range'] = range;
    }

    const extractorUrl = `${EXTRACTOR_SERVER_URL}/stream?id=${videoId}`;
    const extractorResponse = await fetch(extractorUrl, {
      headers: fetchHeaders,
    });

    if (!extractorResponse.ok && extractorResponse.status !== 206) {
      const errorText = await extractorResponse.text().catch(() => 'Extractor failed');
      return NextResponse.json(
        { error: `Extractor service error (${extractorResponse.status}): ${errorText}` },
        { status: extractorResponse.status }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', extractorResponse.headers.get('content-type') || 'audio/mp4');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    if (isDownload) {
      const cleanFilename = `${rawArtist ? `${rawArtist} - ` : ''}${rawTitle}.mp3`.replace(/[/\\?%*:|"<>]/g, '_');
      const safeFilename = encodeURIComponent(cleanFilename);
      responseHeaders.set(
        'Content-Disposition',
        `attachment; filename="${cleanFilename.replace(/"/g, '')}"; filename*=UTF-8''${safeFilename}`
      );
    }

    if (extractorResponse.headers.get('content-range')) {
      responseHeaders.set('Content-Range', extractorResponse.headers.get('content-range')!);
    }
    if (extractorResponse.headers.get('content-length')) {
      responseHeaders.set('Content-Length', extractorResponse.headers.get('content-length')!);
    }

    return new Response(extractorResponse.body, {
      status: isDownload ? 200 : extractorResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Stream Proxy Error:', error);
    return NextResponse.json({ error: error.message || 'Stream extraction failed' }, { status: 500 });
  }
}
