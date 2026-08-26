import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

// Non-music keywords to filter out from general suggestions if any slip in
const NON_MUSIC_REGEX = /\b(movie|trailer|teaser|full movie|episode|drama|kahani|news|gameplay|review|reaction|vlog|unboxing|roast|clip|scene)\b/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const trimmedQuery = query.trim();
    const results: string[] = [];

    // 1. Primary: YouTube Music Native Search Suggestions
    try {
      const yt = await getInnertube();
      const ytMusicSections = await yt.music.getSearchSuggestions(trimmedQuery);

      if (Array.isArray(ytMusicSections)) {
        for (const section of ytMusicSections) {
          const contents = (section as any).contents;
          if (Array.isArray(contents)) {
            for (const item of contents) {
              const text = item.title?.toString() || item.text?.toString();
              if (text && typeof text === 'string' && text.trim().length > 0) {
                const clean = text.trim();
                if (!results.some((r) => r.toLowerCase() === clean.toLowerCase())) {
                  results.push(clean);
                }
              }
            }
          }
        }
      }
    } catch (musicErr) {
      console.warn('InnerTube music suggestions fallback:', musicErr);
    }

    // 2. Fallback / Augment: Music query autocomplete if primary returned few results
    if (results.length < 5) {
      try {
        const musicSuggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
          trimmedQuery + ' song'
        )}`;

        const res = await fetch(musicSuggestUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[1])) {
            for (const raw of data[1]) {
              if (typeof raw === 'string') {
                if (NON_MUSIC_REGEX.test(raw)) continue;
                // Clean up trailing 'song' / 'songs' keyword for clean display
                const clean = raw.replace(/\b(song|songs|audio|official audio)\b/gi, '').trim();
                if (clean.length >= 2 && !results.some((r) => r.toLowerCase() === clean.toLowerCase())) {
                  results.push(clean);
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ suggestions: results.slice(0, 8) });
  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
