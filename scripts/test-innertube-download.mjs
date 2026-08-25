import { Innertube, UniversalCache } from 'youtubei.js';

async function testDownload() {
  console.log('Testing Innertube download stream for kJQP7kiw5Fk...');
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: 'ANDROID',
    });
    
    console.log('Fetching info with ANDROID client...');
    const info = await yt.getInfo('kJQP7kiw5Fk');
    const stream = await info.download({ type: 'audio', quality: 'best' });
    console.log('Got download stream! Reading first chunk...');
    const reader = stream.getReader();
    const { value, done } = await reader.read();
    if (value && value.length > 0) {
      console.log(`🎉 SUCCESS! Read first chunk of ${value.length} audio bytes from stream!`);
    } else {
      console.log('Stream finished without chunks');
    }
  } catch (e) {
    console.error('Download error:', e.message || e);
  }
}

testDownload();
