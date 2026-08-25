import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_cors_headers/shelf_cors_headers.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

String _loadCookies() {
  final candidatePaths = [
    Platform.environment['COOKIES_FILE'],
    '/home/ubuntu/cookies.txt',
    'cookies.txt',
    '../cookies.txt',
  ];

  for (final path in candidatePaths) {
    if (path == null) continue;
    final file = File(path);
    if (file.existsSync()) {
      try {
        final lines = file.readAsLinesSync();
        final cookieMap = <String, String>{};
        for (final line in lines) {
          final trimmed = line.trim();
          if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
          final parts = trimmed.split(RegExp(r'\t+'));
          if (parts.length >= 7) {
            final domain = parts[0].toLowerCase();
            if (domain.contains('youtube.com') || domain.contains('google.com')) {
              final name = parts[5].trim();
              final val = parts[6].trim();
              if (name.isNotEmpty && val.isNotEmpty) {
                cookieMap[name] = val;
              }
            }
          }
        }
        if (cookieMap.isNotEmpty) {
          final cookieStr = cookieMap.entries.map((e) => '${e.key}=${e.value}').join('; ');
          print('🍪 Loaded ${cookieMap.length} YouTube cookies from $path');
          return cookieStr;
        }
      } catch (e) {
        print('⚠️ Error parsing cookies from $path: $e');
      }
    }
  }
  return 'CONSENT=YES+cb';
}

class CookieYoutubeHttpClient extends YoutubeHttpClient {
  final String _cookieStr;
  CookieYoutubeHttpClient(this._cookieStr);

  @override
  Map<String, String> get headers => {
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'cookie': _cookieStr,
        'accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-US,en;q=0.9',
      };
}

final String _cookies = _loadCookies();
final YoutubeExplode yt = YoutubeExplode(
  httpClient: CookieYoutubeHttpClient(_cookies),
);
final HttpClient rawHttpClient = HttpClient()
  ..findProxy = (uri) {
    return 'SOCKS5 127.0.0.1:40000; DIRECT';
  };

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

// Tier 1: Fast yt-dlp with Cloudflare WARP proxy
Future<StreamCacheEntry?> _resolveViaYtDlp(String videoId) async {
  try {
    final result = await Process.run('yt-dlp', [
      '--proxy',
      'socks5://127.0.0.1:40000',
      '-f',
      'ba[ext=m4a]/ba',
      '-g',
      'https://www.youtube.com/watch?v=$videoId',
    ]);
    if (result.exitCode == 0) {
      final lines = (result.stdout as String).trim().split('\n');
      final validUrls = lines.where((l) => l.trim().startsWith('http')).toList();
      if (validUrls.isNotEmpty) {
        final streamUrl = validUrls.first.trim();
        print('[Extractor Success] Resolved stream for $videoId via yt-dlp + WARP proxy');
        return StreamCacheEntry(
          streamUri: Uri.parse(streamUrl),
          container: 'm4a',
          bitrateKbps: 128,
          sizeBytes: 0,
          expiresAt: DateTime.now().add(const Duration(hours: 3)),
        );
      }
    }
  } catch (e) {
    print('[Extractor Info] yt-dlp error for $videoId: $e');
  }
  return null;
}

// Tier 2: YouTubeExplode Native Manifest
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
    } catch (_) {
      continue;
    }
  }

  // Fallback: Default without ytClients
  try {
    final manifest = await yt.videos.streamsClient.getManifest(videoId);
    final audioStreams = manifest.audioOnly;
    if (audioStreams.isNotEmpty) {
      final bestAudio = audioStreams.withHighestBitrate();
      print('[Extractor Success] Resolved stream for $videoId using default manifest');
      return StreamCacheEntry(
        streamUri: bestAudio.url,
        container: bestAudio.container.name,
        bitrateKbps: (bestAudio.bitrate.bitsPerSecond / 1000).round(),
        sizeBytes: bestAudio.size.totalBytes,
        expiresAt: DateTime.now().add(const Duration(hours: 3)),
      );
    }
  } catch (e) {
    print('[Extractor Info] YoutubeExplode error for $videoId: $e');
  }

  return null;
}

// Tier 3: JioSaavn Search Fallback
Future<StreamCacheEntry?> _resolveViaJioSaavn(String query) async {
  if (query.trim().isEmpty || query.trim() == 'Track') return null;

  final saavnMirrors = [
    'https://jiosaavn-api-private.vercel.app/api/search/songs',
    'https://saavn.me/api/search/songs',
    'https://saavn.dev/api/search/songs',
  ];

  for (final mirror in saavnMirrors) {
    try {
      final uri = Uri.parse(mirror).replace(queryParameters: {'query': query, 'limit': '5'});
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final results = (data['data']?['results'] as List? ??
            data['results'] as List? ??
            []);

        if (results.isNotEmpty) {
          final firstSong = results.first as Map;
          final downloadUrls = (firstSong['downloadUrl'] as List? ??
              firstSong['media_url'] as List? ??
              []);

          if (downloadUrls.isNotEmpty) {
            String? targetUrl;
            if (downloadUrls.first is Map) {
              final best = downloadUrls.lastWhere(
                (u) => u['quality'] == '320kbps' || u['quality'] == '160kbps',
                orElse: () => downloadUrls.last,
              );
              targetUrl = best['url']?.toString();
            } else {
              targetUrl = downloadUrls.last.toString();
            }

            if (targetUrl != null && targetUrl.isNotEmpty) {
              print('[Extractor Fallback] Resolved via JioSaavn ($mirror) for "$query"');
              return StreamCacheEntry(
                streamUri: Uri.parse(targetUrl),
                container: 'mp4',
                bitrateKbps: 320,
                sizeBytes: 0,
                expiresAt: DateTime.now().add(const Duration(hours: 6)),
              );
            }
          }
        }
      }
    } catch (_) {
      continue;
    }
  }
  return null;
}

// Master Audio Resolver across Engines
Future<StreamCacheEntry?> _resolveAudioStream(
  String videoId, {
  String searchHint = '',
  bool bypassCache = false,
}) async {
  if (!bypassCache && _streamCache.containsKey(videoId)) {
    final cached = _streamCache[videoId]!;
    if (!cached.isExpired) {
      return cached;
    }
    _streamCache.remove(videoId);
  }

  // 1. Tier 1: yt-dlp via WARP SOCKS5 (Bypasses Datacenter Bot detection)
  var entry = await _resolveViaYtDlp(videoId);

  // 2. Tier 2: YouTubeExplode Native Manifest
  entry ??= await _resolveViaYoutubeExplode(videoId);

  // 3. Tier 3: JioSaavn Search by Title / Artist
  if (entry == null && searchHint.isNotEmpty) {
    entry = await _resolveViaJioSaavn(searchHint);
  }

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
    final title = request.url.queryParameters['title'] ?? '';
    final artist = request.url.queryParameters['artist'] ?? '';
    final searchHint = '$title $artist'.trim();

    if (videoId == null || videoId.length != 11) {
      return Response.badRequest(
        body: jsonEncode({'error': 'Valid 11-character video ID is required'}),
        headers: {'content-type': 'application/json'},
      );
    }

    var entry = await _resolveAudioStream(videoId, searchHint: searchHint);
    if (entry == null) {
      return Response.internalServerError(
        body: jsonEncode({'error': 'Failed to extract audio stream for $videoId'}),
        headers: {'content-type': 'application/json'},
      );
    }

    // 302 Redirect to direct CDN stream
    return Response.found(
      entry.streamUri,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
        'Cache-Control': 'public, max-age=3600',
      },
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
