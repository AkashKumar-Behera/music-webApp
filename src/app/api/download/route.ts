import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Direct High-Speed 320kbps MP3 Downloader Bridge
    const downloadUrl = `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`;
    return NextResponse.redirect(downloadUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Download failed' }, { status: 500 });
  }
}
