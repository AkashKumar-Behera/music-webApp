import 'dart:convert';
import 'package:dart_des/dart_des.dart';
import 'package:http/http.dart' as http;

String? decryptSaavnUrl(String encB64) {
  try {
    final key = utf8.encode('38343638');
    final des = DES(key: key, mode: DESMode.ECB, paddingType: DESPaddingType.PKCS7);
    final encryptedBytes = base64Decode(encB64);
    final decryptedBytes = des.decrypt(encryptedBytes);
    final text = utf8.decode(decryptedBytes, allowMalformed: true).trim();
    final match = RegExp(r'https?://[^\s\x00-\x1F\x7F]+').firstMatch(text);
    if (match != null) {
      var url = match.group(0)!;
      var url320 = url.replaceAll('_96.mp4', '_320.mp4').replaceAll('_160.mp4', '_320.mp4');
      if (!url320.contains('_320.mp4') && !url320.contains('_160.mp4') && url320.endsWith('.mp4')) {
        url320 = url320.replaceAll('.mp4', '_320.mp4');
      }
      return url320;
    }
    return null;
  } catch (e) {
    print('Decrypt error: $e');
    return null;
  }
}

void main() async {
  print('Testing official JioSaavn DES stream extraction in Dart...');
  final query = 'Despacito';
  final searchUri = Uri.parse('https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${Uri.encodeComponent(query)}&_format=json&_marker=0&ctx=android');
  final res = await http.get(searchUri, headers: {'User-Agent': 'Mozilla/5.0'});
  final data = jsonDecode(res.body);
  final songs = (data['songs']?['data'] as List? ?? []);
  if (songs.isEmpty) {
    print('No songs found');
    return;
  }

  final first = songs.first;
  final songId = first['id'];
  print('Found song: ${first['title']} (ID: $songId)');

  final detailsUri = Uri.parse('https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=$songId&_format=json&_marker=0&ctx=android');
  final dres = await http.get(detailsUri, headers: {'User-Agent': 'Mozilla/5.0'});
  final details = jsonDecode(dres.body);
  final songObj = details[songId] as Map?;
  print('SongObj Keys: ${songObj?.keys.toList()}');
  final encUrl = songObj?['encrypted_media_url'] ?? songObj?['more_info']?['encrypted_media_url'];
  print('Encrypted URL: $encUrl');

  if (encUrl != null) {
    final streamUrl = decryptSaavnUrl(encUrl.toString());
    print('\n=======================================');
    print('🔥 DIRECT HIGH QUALITY STREAM URL:');
    print(streamUrl);
    print('=======================================\n');

    if (streamUrl != null) {
      final headRes = await http.head(Uri.parse(streamUrl));
      print('Stream Status Code: ${headRes.statusCode}');
      print('Content-Type: ${headRes.headers['content-type']}');
      print('Content-Length: ${headRes.headers['content-length']} bytes (${(int.parse(headRes.headers['content-length'] ?? '0') / (1024 * 1024)).toStringAsFixed(2)} MB)');
    }
  }
}
