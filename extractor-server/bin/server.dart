import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_cors_headers/shelf_cors_headers.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

final yt = YoutubeExplode();
final httpClient = HttpClient();

class StreamCacheEntry {
  final Uri streamUri;
  final String container;
  final int bitrateKbps;
  final int sizeBytes;
  final DateTime expiresAt;

  StreamCacheEntry({
    required this.streamUri,
    required this.container,
    required this.bitrateKbps,
    required this.sizeBytes,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

final Map<String, StreamCacheEntry> _streamCache = {};

// YouTubeExplode Resolver with multiple mobile/TV Innertube clients (iOS, Android Music, Android VR, VisionOS)
Future<StreamCacheEntry?> _resolveViaYoutubeExplode(String videoId) async {
  final clientSets = [
    [YoutubeApiClient.ios],
    [YoutubeApiClient.androidMusic],
    [YoutubeApiClient.androidVr],
    [YoutubeApiClient.visionos],
    [YoutubeApiClient.tv],
    [YoutubeApiClient.safari],
  ];

  for (final clientSet in clientSets) {
    try {
      final manifest = await yt.videos.streamsClient.getManifest(
        videoId,
        ytClients: clientSet,
      );
      final audioStreams = manifest.audioOnly;
      if (audioStreams.isNotEmpty) {
        AudioStreamInfo bestAudio;
        final mp4Audio = audioStreams.where(
          (s) => s.container.name.toLowerCase() == 'mp4' || s.container.name.toLowerCase() == 'm4a',
        );

        if (mp4Audio.isNotEmpty) {
          bestAudio = mp4Audio.withHighestBitrate();
        } else {
          bestAudio = audioStreams.withHighestBitrate();
        }

        print('[Extractor Success] Resolved stream for $videoId using client: ${clientSet.first}');
        return StreamCacheEntry(
          streamUri: bestAudio.url,
          container: bestAudio.container.name,
          bitrateKbps: (bestAudio.bitrate.bitsPerSecond / 1000).round(),
          sizeBytes: bestAudio.size.totalBytes,
          expiresAt: DateTime.now().add(const Duration(hours: 3)),
        );
      }
    } catch (e) {
      // Continue to next client
      continue;
    }
  }

  // Fallback: Default without client specification
  try {
    final manifest = await yt.videos.streamsClient.getManifest(videoId);
    final audioStreams = manifest.audioOnly;
    if (audioStreams.isNotEmpty) {
      final bestAudio = audioStreams.withHighestBitrate();
      return StreamCacheEntry(
        streamUri: bestAudio.url,
        container: bestAudio.container.name,
        bitrateKbps: (bestAudio.bitrate.bitsPerSecond / 1000).round(),
        sizeBytes: bestAudio.size.totalBytes,
        expiresAt: DateTime.now().add(const Duration(hours: 3)),
      );
    }
  } catch (e) {
    print('[Extractor Info] All YoutubeExplode clients exhausted for $videoId: $e');
  }

  return null;
}

// Master Audio Resolver
Future<StreamCacheEntry?> _resolveAudioStream(
  String videoId, {
  bool bypassCache = false,
}) async {
  if (!bypassCache && _streamCache.containsKey(videoId)) {
    final cached = _streamCache[videoId]!;
    if (!cached.isExpired) {
      return cached;
    }
    _streamCache.remove(videoId);
  }

  final entry = await _resolveViaYoutubeExplode(videoId);
  if (entry != null) {
    _streamCache[videoId] = entry;
  }
  return entry;
}

void main(List<String> args) async {
  final app = Router();

  // 1. Health check
  app.get('/health', (Request request) {
    return Response.ok(
      jsonEncode({
        'status': 'ok',
        'service': 'CloudBeatz Dart Stream Extractor',
        'timestamp': DateTime.now().toIso8601String(),
        'cachedStreams': _streamCache.length,
      }),
      headers: {'content-type': 'application/json'},
    );
  });

  // 2. Video info & stream metadata
  app.get('/info', (Request request) async {
    final videoId = request.url.queryParameters['id'];
    if (videoId == null || videoId.isEmpty) {
      return Response.badRequest(
        body: jsonEncode({'error': 'Missing id parameter'}),
        headers: {'content-type': 'application/json'},
      );
    }

    try {
      final video = await yt.videos.get(videoId);
      final entry = await _resolveAudioStream(videoId);

      return Response.ok(
        jsonEncode({
          'id': video.id.value,
          'title': video.title,
          'author': video.author,
          'durationSeconds': video.duration?.inSeconds ?? 0,
          'thumbnail': video.thumbnails.highResUrl,
          'audio': entry != null
              ? {
                  'bitrate': entry.bitrateKbps,
                  'container': entry.container,
                  'size': entry.sizeBytes,
                }
              : null,
        }),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(
        body: jsonEncode({'error': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  });

  // 3. Audio Streaming Engine with Range / HTTP 206 Support
  app.get('/stream', (Request request) async {
    final videoId = request.url.queryParameters['id'];

    if (videoId == null || videoId.length != 11) {
      return Response.badRequest(
        body: jsonEncode({'error': 'Valid 11-character video ID is required'}),
        headers: {'content-type': 'application/json'},
      );
    }

    var entry = await _resolveAudioStream(videoId);
    if (entry == null) {
      return Response.internalServerError(
        body: jsonEncode({'error': 'Failed to extract audio stream for $videoId'}),
        headers: {'content-type': 'application/json'},
      );
    }

    final clientRangeHeader = request.headers['range'];

    Future<HttpClientResponse?> fetchFromCdn(Uri uri) async {
      try {
        final req = await httpClient.getUrl(uri);
        req.headers.set(
          'User-Agent',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        );
        if (clientRangeHeader != null) {
          req.headers.set('Range', clientRangeHeader);
        }
        return await req.close();
      } catch (e) {
        print('[CDN Fetch Error] $e');
        return null;
      }
    }

    var cdnResponse = await fetchFromCdn(entry.streamUri);

    // If stream URL is expired (403/410), refresh stream cache
    if (cdnResponse == null || cdnResponse.statusCode == 403 || cdnResponse.statusCode == 410) {
      print('[Stream Refresh] Stream failed (${cdnResponse?.statusCode}) for $videoId, re-resolving...');
      _streamCache.remove(videoId);
      entry = await _resolveAudioStream(videoId, bypassCache: true);
      if (entry != null) {
        cdnResponse = await fetchFromCdn(entry.streamUri);
      }
    }

    if (cdnResponse == null || entry == null) {
      return Response.internalServerError(
        body: jsonEncode({'error': 'Could not connect to media stream'}),
        headers: {'content-type': 'application/json'},
      );
    }

    final responseHeaders = <String, String>{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=7200',
    };

    final contentType = cdnResponse.headers.value('content-type') ??
        (entry.container.toLowerCase() == 'webm' ? 'audio/webm' : 'audio/mp4');
    responseHeaders['Content-Type'] = contentType;

    final contentRange = cdnResponse.headers.value('content-range');
    if (contentRange != null) {
      responseHeaders['Content-Range'] = contentRange;
    }

    final contentLength = cdnResponse.headers.value('content-length');
    if (contentLength != null) {
      responseHeaders['Content-Length'] = contentLength;
    }

    return Response(
      cdnResponse.statusCode,
      body: cdnResponse,
      headers: responseHeaders,
    );
  });

  final handler = const Pipeline()
      .addMiddleware(corsHeaders())
      .addMiddleware(logRequests())
      .addHandler(app);

  final port = int.tryParse(Platform.environment['PORT'] ?? '8080') ?? 8080;
  final server = await io.serve(handler, InternetAddress.anyIPv4, port);
  print('🚀 CloudBeatz Dart Stream Extractor running on port ${server.port}');
}
