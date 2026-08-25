import crypto from 'crypto';

export function decryptSaavnMediaUrl(encB64) {
  try {
    const key = Buffer.from('38343638', 'utf8');
    const decipher = crypto.createDecipheriv('des-ecb', key, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Ensure 320kbps quality
    let url320 = decrypted.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
    if (!url320.includes('_320.mp4') && !url320.includes('_160.mp4') && url320.endsWith('.mp4')) {
      url320 = url320.replace('.mp4', '_320.mp4');
    }
    return url320;
  } catch (e) {
    console.error('DES decrypt error:', e.message);
    return null;
  }
}

export async function searchAndResolveSaavnSong(query) {
  try {
    const encQuery = encodeURIComponent(query);
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encQuery}&_format=json&_marker=0&ctx=android`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const songs = data?.songs?.data || [];
    if (!songs.length) return null;
    const first = songs[0];
    const songId = first.id;

    // Fetch song details
    const detailsUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0&ctx=android`;
    const dres = await fetch(detailsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!dres.ok) return null;
    const details = await dres.json();
    const songObj = details[songId];
    if (!songObj) return null;

    const encUrl = songObj.encrypted_media_url;
    if (encUrl) {
      const streamUrl = decryptSaavnMediaUrl(encUrl);
      if (streamUrl) {
        return {
          title: songObj.song || first.title,
          artist: songObj.primary_artists || first.description,
          streamUrl: streamUrl,
          thumbnail: songObj.image?.replace('150x150', '500x500') || first.image,
          duration: parseInt(songObj.duration || '0', 10),
        };
      }
    }
  } catch (e) {
    console.error('Saavn resolution error:', e.message);
  }
  return null;
}

// Quick self-test
if (process.argv[1]?.includes('saavn-resolver.mjs')) {
  const q = process.argv[2] || 'Despacito';
  console.log(`Resolving song for query: "${q}"...`);
  searchAndResolveSaavnSong(q).then(res => {
    console.log('RESULT:', res);
  });
}
