import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  print('Testing direct JioSaavn CDN media URL generation from media_preview_url...');
  final previewUrl = 'https://preview.saavncdn.com/816/GsCPO0qrHaL7Vg3s0DEv3DFWbQNFytLcDTwhK_96_p.mp4';
  
  final fullUrls = [
    previewUrl.replaceAll('preview.saavncdn.com', 'aac.saavncdn.com').replaceAll('_96_p.mp4', '_320.mp4'),
    previewUrl.replaceAll('preview.saavncdn.com', 'aac.saavncdn.com').replaceAll('_96_p.mp4', '_160.mp4'),
    previewUrl.replaceAll('preview.saavncdn.com', 'aac.saavncdn.com').replaceAll('_96_p.mp4', '_96.mp4'),
    previewUrl.replaceAll('preview.saavncdn.com', 'aac.saavncdn.com').replaceAll('_96_p.mp4', '.mp4'),
    previewUrl,
  ];

  for (final url in fullUrls) {
    print('Testing URL: $url');
    final res = await http.head(Uri.parse(url), headers: {'User-Agent': 'Mozilla/5.0'});
    print('  Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']} | Length: ${res.headers['content-length']}');
    if (res.statusCode == 200) {
      print('  🎉 WORKING FULL STREAM FOUND: $url\n');
      break;
    }
  }
}
