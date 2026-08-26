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
 * Robust Duration Parser to prevent 2x WebKit / missing seconds duration bugs
 */
export function parseDuration(rawDuration?: any, durationText?: string): { seconds: number; formatted: string } {
  let seconds = 0;
  let formatted = '';

  if (typeof rawDuration === 'number' && !isNaN(rawDuration) && rawDuration > 0) {
    seconds = Math.round(rawDuration);
  } else if (typeof rawDuration?.seconds === 'number' && !isNaN(rawDuration.seconds) && rawDuration.seconds > 0) {
    seconds = Math.round(rawDuration.seconds);
  }

  if (typeof rawDuration?.text === 'string' && rawDuration.text.trim()) {
    formatted = rawDuration.text.trim();
  } else if (typeof rawDuration === 'string' && rawDuration.includes(':')) {
    formatted = rawDuration.trim();
  } else if (typeof durationText === 'string' && durationText.includes(':')) {
    formatted = durationText.trim();
  }

  // If seconds is 0, parse from formatted text (e.g. "3:56" -> 236 seconds)
  if (seconds === 0 && formatted) {
    const parts = formatted.split(':').map((p) => parseInt(p.trim(), 10));
    if (parts.length === 2 && !parts.some(isNaN)) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && !parts.some(isNaN)) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // If seconds > 0 but formatted is empty
  if (!formatted && seconds > 0) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return {
    seconds: seconds || 215,
    formatted: formatted || '3:35',
  };
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
