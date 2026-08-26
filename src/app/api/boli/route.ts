import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { Track, getHighResThumbnail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export interface BoliSection {
  title: string;
  type: 'tracks' | 'albums' | 'playlists';
  items: any[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get('id');
    const artist = searchParams.get('artist') || '';
    const title = searchParams.get('title') || '';

    if (!songId && !artist && !title) {
      return NextResponse.json({ error: 'Song ID or Artist is required' }, { status: 400 });
    }

    const yt = await getInnertube();
    const cleanArtist = artist.split(',')[0].trim();

    // 1. Fetch Related / Recommendations via YouTube Next / Related or search
    const relatedPromise = (async () => {
      if (songId) {
        try {
          const next = await yt.music.getRelated(songId);
          const dataAny = next as any;
          const sections = dataAny?.sections || (Array.isArray(dataAny?.contents) ? dataAny.contents : []);

          if (Array.isArray(sections)) {
            const rawTracks: Track[] = [];
            for (const section of sections) {
              const contents = section.contents || (Array.isArray(section) ? section : []);
              if (Array.isArray(contents)) {
                for (const item of contents) {
                  if (item && item.id && item.title) {
                    const durationSec = typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0;
                    rawTracks.push({
                      id: item.id,
                      title: item.title?.toString() || 'Track',
                      artist: item.artists?.[0]?.name?.toString() || item.author?.name?.toString() || cleanArtist || 'Artist',
                      album: item.album?.name?.toString(),
                      duration: durationSec,
                      durationFormatted: item.duration?.text || '3:30',
                      thumbnail: getHighResThumbnail(item.thumbnails, item.id),
                    });
                  }
                }
              }
            }
            if (rawTracks.length > 0) return rawTracks.slice(0, 20);
          }
        } catch (e) {
          console.warn('BOLI: getRelated fallback to search:', e);
        }
      }

      // Fallback search related tracks
      const searchRes = await yt.music.search(`${cleanArtist || title} song mix`, { type: 'song' });
      const fallbackTracks: Track[] = [];
      if (searchRes && searchRes.songs && searchRes.songs.contents) {
        for (const item of searchRes.songs.contents) {
          if (item && item.id && item.title) {
            const durationSec = typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0;
            fallbackTracks.push({
              id: item.id,
              title: item.title?.toString() || 'Track',
              artist: item.artists?.[0]?.name?.toString() || cleanArtist || 'Artist',
              album: item.album?.name?.toString(),
              duration: durationSec,
              durationFormatted: item.duration?.text || '3:30',
              thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            });
          }
        }
      }
      return fallbackTracks.slice(0, 20);
    })();

    // 2. Fetch Artist Top Songs & Albums
    const artistPromise = (async () => {
      if (!cleanArtist) return { albums: [], topTracks: [] };
      try {
        const [albumSearch, trackSearch] = await Promise.all([
          yt.music.search(`${cleanArtist} album`, { type: 'album' }).catch(() => null),
          yt.music.search(`${cleanArtist} best songs`, { type: 'song' }).catch(() => null),
        ]);

        const albums: any[] = [];
        if (albumSearch && albumSearch.albums && albumSearch.albums.contents) {
          for (const alb of albumSearch.albums.contents) {
            if (alb && alb.title && alb.id) {
              albums.push({
                id: alb.id,
                title: alb.title?.toString() || 'Album',
                artist: alb.artists?.[0]?.name?.toString() || cleanArtist,
                year: (alb as any).year?.toString() || '',
                thumbnail: alb.thumbnails?.[0]?.url || '/placeholder.png',
              });
            }
          }
        }

        const topTracks: Track[] = [];
        if (trackSearch && trackSearch.songs && trackSearch.songs.contents) {
          for (const item of trackSearch.songs.contents) {
            if (item && item.id && item.title) {
              topTracks.push({
                id: item.id,
                title: item.title?.toString() || 'Track',
                artist: item.artists?.[0]?.name?.toString() || cleanArtist,
                album: item.album?.name?.toString(),
                duration: typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0,
                durationFormatted: item.duration?.text || '3:30',
                thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              });
            }
          }
        }

        return { albums: albums.slice(0, 8), topTracks: topTracks.slice(0, 10) };
      } catch {
        return { albums: [], topTracks: [] };
      }
    })();

    // 3. Fetch Related Mood Playlists
    const playlistPromise = (async () => {
      try {
        const query = cleanArtist ? `${cleanArtist} Mix & Radio` : `${title} vibes`;
        const plSearch = await yt.music.search(query, { type: 'playlist' }).catch(() => null);
        const playlists: any[] = [];
        if (plSearch && plSearch.playlists && plSearch.playlists.contents) {
          for (const pl of plSearch.playlists.contents) {
            if (pl && pl.title && pl.id) {
              playlists.push({
                id: pl.id,
                title: pl.title?.toString() || 'Playlist',
                author: (pl as any).author?.name?.toString() || 'CloudBeatz',
                itemCount: (pl as any).item_count || '25+ Songs',
                thumbnail: pl.thumbnails?.[0]?.url || '/placeholder.png',
              });
            }
          }
        }
        return playlists.slice(0, 8);
      } catch {
        return [];
      }
    })();

    const [relatedTracks, artistData, playlists] = await Promise.all([
      relatedPromise,
      artistPromise,
      playlistPromise,
    ]);

    return NextResponse.json({
      basedOn: { id: songId, title, artist: cleanArtist },
      quickPicks: relatedTracks,
      artistTopTracks: artistData.topTracks,
      artistAlbums: artistData.albums,
      relatedPlaylists: playlists,
    });
  } catch (error: any) {
    console.error('BOLI API Error:', error);
    return NextResponse.json({ error: error.message || 'BOLI generation failed' }, { status: 500 });
  }
}
