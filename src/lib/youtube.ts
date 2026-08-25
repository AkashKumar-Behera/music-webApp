import { Innertube, UniversalCache } from 'youtubei.js';

let innertubeInstance: Innertube | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
  }
  return innertubeInstance;
}
