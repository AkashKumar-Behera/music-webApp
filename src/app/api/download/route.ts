import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const dynamic = 'force-dynamic';

// In-memory cache for direct audio stream URLs
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
    console.error('Failed to get direct audio URL for download with yt-dlp:', err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const rawTitle = searchParams.get('title') || 'Song';
    const rawArtist = searchParams.get('artist') || '';

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Valid 11-character Video ID is required' }, { status: 400 });
    }

    let streamUrl = await getDirectAudioUrl(videoId);
    if (!streamUrl) {
      return NextResponse.json({ error: 'Failed to extract audio stream for download' }, { status: 500 });
    }

    let ytResponse = await fetch(streamUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (ytResponse.status === 403 || ytResponse.status === 410) {
      urlCache.delete(videoId);
      streamUrl = await getDirectAudioUrl(videoId, true);
      if (!streamUrl) {
        return NextResponse.json({ error: 'Download stream expired and re-extraction failed' }, { status: 500 });
      }
      ytResponse = await fetch(streamUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
    }

    // Sanitize filename for direct browser save
    const rawFilename = `${rawArtist ? `${rawArtist} - ` : ''}${rawTitle}.mp3`.replace(/[/\\?%*:|"<>]/g, '_');
    const safeFilename = encodeURIComponent(rawFilename);

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'audio/mpeg');
    responseHeaders.set(
      'Content-Disposition',
      `attachment; filename="${rawFilename.replace(/"/g, '')}"; filename*=UTF-8''${safeFilename}`
    );
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    if (ytResponse.headers.get('content-length')) {
      responseHeaders.set('Content-Length', ytResponse.headers.get('content-length')!);
    }

    return new Response(ytResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Download API Error:', error);
    return NextResponse.json({ error: error.message || 'Download failed' }, { status: 500 });
  }
}
