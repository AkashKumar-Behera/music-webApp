import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const dynamic = 'force-dynamic';

// In-memory cache for direct audio stream URLs (valid for 2 hours)
const urlCache = new Map<string, { url: string; expiresAt: number }>();

async function getDirectAudioUrl(videoId: string, bypassCache = false): Promise<string | null> {
  if (!bypassCache) {
    const cached = urlCache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    const cookiePath = path.join(process.cwd(), 'cookies.txt');
    const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';

    // Extract best audio format (preferring iOS/Safari native m4a/aac)
    const { stdout } = await execPromise(
      `yt-dlp ${cookieArg} --no-warnings -g -f "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${videoId}"`
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

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Valid 11-character Video ID is required' }, { status: 400 });
    }

    let streamUrl = await getDirectAudioUrl(videoId);
    if (!streamUrl) {
      return NextResponse.json({ error: 'Failed to extract audio stream' }, { status: 500 });
    }

    // Forward Range header from browser to YouTube CDN (Essential for iOS Safari lock-screen streaming)
    const range = req.headers.get('range');
    const fetchHeaders: HeadersInit = {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    };

    if (range) {
      fetchHeaders['Range'] = range;
    }

    let ytResponse = await fetch(streamUrl, {
      headers: fetchHeaders,
    });

    // If stream URL is expired or blocked (403/410), invalidate cache and re-extract once
    if (ytResponse.status === 403 || ytResponse.status === 410) {
      urlCache.delete(videoId);
      streamUrl = await getDirectAudioUrl(videoId, true);
      if (!streamUrl) {
        return NextResponse.json({ error: 'Audio stream expired and re-extraction failed' }, { status: 500 });
      }
      ytResponse = await fetch(streamUrl, {
        headers: fetchHeaders,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', ytResponse.headers.get('content-type') || 'audio/mp4');
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
