import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const trimmedQuery = query.trim();

    // Fast, reliable standard YouTube complete suggestions API
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
      trimmedQuery
    )}`;

    const res = await fetch(suggestUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        const suggestions = data[1].slice(0, 8);
        return NextResponse.json({ suggestions });
      }
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
