import 'dart:convert';
import 'dart:io';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main() async {
  print('Running YouTubeExplode diagnostics without watch page...');
  final yt = YoutubeExplode();
  try {
    print('Fetching Stream Manifest with requireWatchPage: false & ytClients: [ios]...');
    final manifest = await yt.videos.streamsClient.getManifest(
      'kJQP7kiw5Fk',
      ytClients: [YoutubeApiClient.ios],
      requireWatchPage: false,
    );
    print('Audio Streams count: ${manifest.audioOnly.length}');
    for (final s in manifest.audioOnly) {
      print('Stream: ${s.tag} | ${s.container.name} | ${s.bitrate.bitsPerSecond} bps | url: ${s.url.toString().substring(0, 60)}...');
    }
  } catch (e, st) {
    print('Error: $e');
    print('Stack: $st');
  } finally {
    yt.close();
  }
}
