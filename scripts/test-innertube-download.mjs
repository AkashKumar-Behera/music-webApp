import { Innertube, UniversalCache } from 'youtubei.js';

async function testClients() {
  const clients = ['TV_EMBEDDED', 'WEB_EMBEDDED', 'MWEB', 'WEB'];
  for (const c of clients) {
    try {
      console.log(`\nTesting client: ${c}...`);
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        client_type: c,
      });
      const info = await yt.getInfo('kJQP7kiw5Fk');
      const audioStreams = info.streaming_data?.adaptive_formats?.filter(f => f.has_audio && !f.has_video);
      console.log(`[${c}] Audio streams count:`, audioStreams?.length);
      if (audioStreams && audioStreams.length > 0) {
        const streamUrl = audioStreams[0].decipher(yt.session.player) || audioStreams[0].url;
        console.log(`🎉 [${c}] STREAM URL:`, streamUrl?.substring(0, 100));
        break;
      }
    } catch (e) {
      console.log(`[${c}] Failed:`, e.message || e);
    }
  }
}

testClients();
