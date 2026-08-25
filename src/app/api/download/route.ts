import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const title = searchParams.get('title') || 'Song';
    const artist = searchParams.get('artist') || '';

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Direct MP3 Attachment stream redirect
    const downloadUrl = `/api/stream?id=${videoId}&download=1&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    return NextResponse.redirect(new URL(downloadUrl, req.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Download failed' }, { status: 500 });
  }
}
