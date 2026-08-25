import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COBALT_INSTANCES = [
  'https://cobalt-api.kwiatek.xyz',
  'https://api.cobalt.tools',
  'https://cobalt.canine.tools',
  'https://api.wuk.sh',
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.private.coffee',
  'https://yewtu.be',
];

async function getDownloadUrlFromCobalt(videoId: string): Promise<string | null> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/json`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
          audioBitrate: '320',
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          return data.url;
        }
      }
    } catch (e) {
      // Continue to next instance
    }
  }
  return null;
}

async function getDownloadUrlFromInvidious(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.adaptiveFormats)) {
          const audioFormats = data.adaptiveFormats
            .filter((f: any) => f.type && f.type.startsWith('audio/'))
            .sort((a: any, b: any) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));

          if (audioFormats.length > 0 && audioFormats[0].url) {
            return audioFormats[0].url;
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const title = searchParams.get('title') || 'Song';
    const artist = searchParams.get('artist') || 'CloudBeatz';

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const safeFilename = `${artist} - ${title}.mp3`.replace(/[/\\?%*:|"<>]/g, '_');

    // 1. Try Cobalt instances
    const cobaltUrl = await getDownloadUrlFromCobalt(videoId);
    if (cobaltUrl) {
      return NextResponse.redirect(cobaltUrl);
    }

    // 2. Try Invidious direct audio stream
    const invidiousUrl = await getDownloadUrlFromInvidious(videoId);
    if (invidiousUrl) {
      return NextResponse.redirect(invidiousUrl);
    }

    // 3. Fallback redirect to direct audio stream endpoint
    return NextResponse.redirect(new URL(`/api/stream?id=${videoId}`, req.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Download failed' }, { status: 500 });
  }
}
