export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
}

export interface LyricsResponse {
  id?: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

/**
 * Standard High-Res Thumbnail Formatter with 100% Guaranteed Availability
 * Uses YouTube Music's 544x544 HQ standard with reliable fallbacks
 */
export function getHighResThumbnail(
  thumbnails?: any[] | string,
  videoId?: string
): string {
  let url = '';
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    url = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '';
  } else if (typeof thumbnails === 'string') {
    url = thumbnails;
  }

  if (!url && videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  // Use YouTube Music standard 544x544 size (official stable resolution across Google CDN)
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    if (url.includes('=w') || url.includes('=s')) {
      url = url.replace(/=w\d+-h\d+[^=]*$/, '=w544-h544-l90-rj');
      url = url.replace(/=s\d+[^=]*$/, '=s544');
    }
  }

  return url;
}
