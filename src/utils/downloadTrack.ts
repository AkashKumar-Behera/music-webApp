/**
 * Fast Client-Side Parallel Chunk Downloader
 * Bypasses YouTube's real-time playback throttle (28 KB/s) by downloading
 * multiple Range chunks concurrently directly from Google CDN in ~1 second.
 */

export async function downloadTrack(
  track: { id: string; title: string; artist: string },
  onStatusChange?: (isDownloading: boolean) => void
) {
  if (onStatusChange) onStatusChange(true);

  try {
    const filename = `${track.artist ? `${track.artist} - ` : ''}${track.title}.m4a`.replace(/[/\\?%*:|"<>]/g, '_');

    // 1. Fetch from /api/stream (Browser automatically follows 302 redirect to Google/Akamai CDN)
    const streamRes = await fetch(`/api/stream?id=${track.id}`);
    if (!streamRes.ok && streamRes.status !== 206) {
      throw new Error('Stream resolution failed');
    }

    const cdnUrl = streamRes.url;

    // 2. Fetch header chunk to determine total file size
    const rangeProbe = await fetch(cdnUrl, {
      headers: { Range: 'bytes=0-0' },
    });

    const contentRange = rangeProbe.headers.get('content-range');
    let totalBytes = 0;
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1]) totalBytes = parseInt(parts[1], 10);
    }

    // 3. Fast Parallel Multi-Chunk Extraction (4 concurrent streams)
    if (totalBytes > 500 * 1024) {
      const numChunks = 4;
      const chunkSize = Math.ceil(totalBytes / numChunks);

      const chunkPromises = Array.from({ length: numChunks }, async (_, i) => {
        const start = i * chunkSize;
        const end = i === numChunks - 1 ? totalBytes - 1 : (i + 1) * chunkSize - 1;
        const chunkRes = await fetch(cdnUrl, {
          headers: { Range: `bytes=${start}-${end}` },
        });
        if (!chunkRes.ok && chunkRes.status !== 206) {
          throw new Error(`Chunk ${i} failed`);
        }
        return chunkRes.arrayBuffer();
      });

      const chunkBuffers = await Promise.all(chunkPromises);
      const combinedBlob = new Blob(chunkBuffers, { type: 'audio/mp4' });
      triggerBlobSave(combinedBlob, filename);
    } else {
      // Fallback single blob stream
      const blob = await streamRes.blob();
      triggerBlobSave(blob, filename);
    }
  } catch (error) {
    console.warn('Fast chunk download fallback, using direct link:', error);
    // Safe Fallback
    const a = document.createElement('a');
    a.href = `/api/stream?id=${track.id}&download=1&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
    a.download = `${track.artist} - ${track.title}.m4a`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    if (onStatusChange) onStatusChange(false);
  }
}

function triggerBlobSave(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
}
