import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const dynamic = 'force-dynamic';

// In-memory cache for direct audio stream URLs (valid for 2 hours)
const urlCache = new Map<string, { url: string; expiresAt: number }>();

async function getDirectAudioUrl(videoId: string): Promise<string | null> {
  const cached = urlCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const { stdout } = await execPromise(
      `yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${videoId}"`
    );
    const directUrl = stdout.trim().split('\n')[0].trim();
    if (directUrl && directUrl.startsWith('http')) {
      urlCache.set(videoId, {
        url: directUrl,
        expiresAt: Date.now() + 2 * 3600 * 1000,
      });
      return directUrl;
    }
  } catch (err) {
    console.error('Failed to get direct audio URL with yt-dlp:', err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const streamUrl = await getDirectAudioUrl(videoId);
    if (!streamUrl) {
      return NextResponse.json({ error: 'Failed to extract audio stream' }, { status: 500 });
    }

    // Forward Range header from browser to YouTube CDN
    const range = req.headers.get('range');
    const fetchHeaders: HeadersInit = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (range) {
      fetchHeaders['Range'] = range;
    }

    const ytResponse = await fetch(streamUrl, {
      headers: fetchHeaders,
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', ytResponse.headers.get('content-type') || 'audio/webm');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    if (ytResponse.headers.get('content-range')) {
      responseHeaders.set('Content-Range', ytResponse.headers.get('content-range')!);
    }
    if (ytResponse.headers.get('content-length')) {
      responseHeaders.set('Content-Length', ytResponse.headers.get('content-length')!);
    }

    return new Response(ytResponse.body, {
      status: ytResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Stream API Error:', error);
    return NextResponse.json({ error: error.message || 'Stream extraction failed' }, { status: 500 });
  }
}
