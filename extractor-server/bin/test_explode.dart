import 'dart:convert';
import 'dart:io';
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

void main() async {
  print('Running YouTubeExplode diagnostics with COOKIES...');
  final cookieStr = _loadCookies();
  final yt = YoutubeExplode(
    httpClient: CookieYoutubeHttpClient(cookieStr),
  );
  try {
    print('Fetching Stream Manifest with requireWatchPage: false & ytClients: [ios]...');
    final manifest = await yt.videos.streamsClient.getManifest(
      'kJQP7kiw5Fk',
      ytClients: [YoutubeApiClient.ios],
      requireWatchPage: false,
    );
    print('Audio Streams count: ${manifest.audioOnly.length}');
    for (final s in manifest.audioOnly) {
      print('STREAM SUCCESS: ${s.tag} | ${s.container.name} | ${s.bitrate.bitsPerSecond} bps | url: ${s.url.toString().substring(0, 60)}...');
    }
  } catch (e, st) {
    print('Error: $e');
    print('Stack: $st');
  } finally {
    yt.close();
  }
}
