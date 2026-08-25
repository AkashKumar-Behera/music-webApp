import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  console.log('Testing Innertube extraction...');
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    const info = await yt.getInfo('kJQP7kiw5Fk');
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (format) {
      const url = format.decipher(yt.session.player);
      console.log('SUCCESS! Extracted audio stream url:', url.slice(0, 100) + '...');
      console.log('MimeType:', format.mime_type, 'Bitrate:', format.bitrate);
    } else {
      console.log('No audio format found');
    }
  } catch (e) {
    console.error('Error in Innertube:', e.message || e);
  }
}

test();
