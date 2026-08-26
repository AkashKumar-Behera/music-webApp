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
 * Transforms low-res YouTube/Google CDN thumbnail URLs into ultra-high-definition (1000x1000) artwork
 */
export function getHighResThumbnail(
  thumbnails?: any[] | string,
  videoId?: string
): string {
  let url = '';
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    // Pick the largest thumbnail available
    url = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '';
  } else if (typeof thumbnails === 'string') {
    url = thumbnails;
  }

  if (!url && videoId) {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  }

  // Upgrade Google/YouTube Music CDN sizes:
  // e.g. =w120-h120 -> =w1000-h1000-l90-rj or =s1200
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    if (url.includes('=w') || url.includes('=s')) {
      url = url.replace(/=w\d+-h\d+[^=]*$/, '=w1000-h1000-l90-rj');
      url = url.replace(/=s\d+[^=]*$/, '=s1200');
    } else {
      url += '=w1000-h1000-l90-rj';
    }
  }

  return url;
}
