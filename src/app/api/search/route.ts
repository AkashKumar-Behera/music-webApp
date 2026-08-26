import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { Track, getHighResThumbnail } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const yt = await getInnertube();

    if (type === 'all') {
      // Parallel multi-section search (Songs, Albums, Artists, Videos, Playlists)
      const [songRes, albumRes, artistRes, videoRes, playlistRes] = await Promise.all([
        yt.music.search(query, { type: 'song' }).catch(() => null),
        yt.music.search(query, { type: 'album' }).catch(() => null),
        yt.music.search(query, { type: 'artist' }).catch(() => null),
        yt.music.search(query, { type: 'video' }).catch(() => null),
        yt.music.search(query, { type: 'playlist' }).catch(() => null),
      ]);

      const songs: Track[] = [];
      if (songRes && songRes.songs && songRes.songs.contents) {
        for (const item of songRes.songs.contents) {
          if (item && item.id && item.title) {
            songs.push({
              id: item.id,
              title: item.title?.toString() || 'Title',
              artist: item.artists?.[0]?.name?.toString() || item.author?.name?.toString() || 'Artist',
              album: item.album?.name?.toString(),
              duration: typeof item.duration?.seconds === 'number' ? item.duration.seconds : 0,
              durationFormatted: item.duration?.text || '3:30',
              thumbnail: getHighResThumbnail(item.thumbnails, item.id),
            });
          }
        }
      }

      const albums: any[] = [];
      if (albumRes && albumRes.albums && albumRes.albums.contents) {
        for (const alb of albumRes.albums.contents) {
          if (alb && alb.id && alb.title) {
            albums.push({
              id: alb.id,
              title: alb.title?.toString() || 'Album',
              artist: alb.artists?.[0]?.name?.toString() || 'Artist',
              year: (alb as any).year?.toString() || '2024',
              type: (alb as any).type?.toString() || 'Album',
              thumbnail: getHighResThumbnail(alb.thumbnails, alb.id),
            });
          }
        }
      }

      const artists: any[] = [];
      if (artistRes && artistRes.artists && artistRes.artists.contents) {
        for (const art of artistRes.artists.contents) {
          if (art && art.id && art.name) {
            artists.push({
              id: art.id,
              name: art.name?.toString() || 'Artist',
              subscribers: (art as any).subscribers?.toString() || 'Artist',
              thumbnail: getHighResThumbnail(art.thumbnails, art.id),
            });
          }
        }
      }

      const videos: Track[] = [];
      if (videoRes && videoRes.videos && videoRes.videos.contents) {
        for (const vid of videoRes.videos.contents) {
          if (vid && vid.id && vid.title) {
            videos.push({
              id: vid.id,
              title: vid.title?.toString() || 'Video',
              artist: vid.artists?.[0]?.name?.toString() || vid.author?.name?.toString() || 'Video',
              duration: typeof vid.duration?.seconds === 'number' ? vid.duration.seconds : 0,
              durationFormatted: vid.duration?.text || '3:30',
              thumbnail: getHighResThumbnail(vid.thumbnails, vid.id),
            });
          }
        }
      }

      const playlists: any[] = [];
      if (playlistRes && playlistRes.playlists && playlistRes.playlists.contents) {
        for (const pl of playlistRes.playlists.contents) {
          if (pl && pl.id && pl.title) {
            playlists.push({
              id: pl.id,
              title: pl.title?.toString() || 'Playlist',
              author: (pl as any).author?.name?.toString() || 'Playlist',
              itemCount: (pl as any).item_count || '25+ songs',
              thumbnail: getHighResThumbnail(pl.thumbnails, pl.id),
            });
          }
        }
      }

      // Fallback songs if none returned
      if (songs.length === 0) {
        const generalSearch = await yt.search(query, { type: 'video' });
        for (const video of (generalSearch.videos || []) as any[]) {
          if (video && video.id && video.title) {
            songs.push({
              id: video.id,
              title: video.title.toString(),
              artist: video.author?.name?.toString() || 'Artist',
              duration: video.duration?.seconds || 0,
              durationFormatted: video.duration?.text || '3:30',
              thumbnail: getHighResThumbnail(video.thumbnails, video.id),
            });
          }
        }
      }

      return NextResponse.json({
        tracks: songs,
        songs,
        albums,
        artists,
        videos,
        playlists,
      });
    }

    // Specific category query (e.g. type=song, type=album, etc.)
    const searchRes = await yt.music.search(query, { type: type as any });
    const key = type === 'song' ? 'songs' : type === 'album' ? 'albums' : type === 'artist' ? 'artists' : type === 'video' ? 'videos' : 'playlists';
    const items = (searchRes as any)?.[key]?.contents || [];

    const formatted = items.map((item: any) => ({
      id: item.id,
      title: item.title?.toString() || item.name?.toString() || 'Item',
      name: item.name?.toString() || item.title?.toString() || 'Item',
      artist: item.artists?.[0]?.name?.toString() || item.author?.name?.toString() || '',
      durationFormatted: item.duration?.text || '3:30',
      year: item.year?.toString() || '2024',
      subscribers: item.subscribers?.toString() || '',
      thumbnail: getHighResThumbnail(item.thumbnails, item.id),
    }));

    return NextResponse.json({ items, tracks: formatted });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search' }, { status: 500 });
  }
}
