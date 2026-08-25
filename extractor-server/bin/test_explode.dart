import 'dart:convert';
import 'dart:io';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main() async {
  print('Running YouTubeExplode diagnostics...');
  final yt = YoutubeExplode();
  try {
    final video = await yt.videos.get('kJQP7kiw5Fk');
    print('Video Title: ${video.title}');
    print('Author: ${video.author}');
    
    print('Fetching Stream Manifest...');
    final manifest = await yt.videos.streamsClient.getManifest(
      'kJQP7kiw5Fk',
      ytClients: [YoutubeApiClient.ios],
    );
    print('Audio Streams count: ${manifest.audioOnly.length}');
    for (final s in manifest.audioOnly) {
      print('Stream: ${s.tag} | ${s.container.name} | ${s.bitrate.bitsPerSecond} bps | url: ${s.url.toString().substring(0, 50)}...');
    }
  } catch (e, st) {
    print('Error: $e');
    print('Stack: $st');
  } finally {
    yt.close();
  }
}
