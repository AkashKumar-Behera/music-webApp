import 'dart:convert';
import 'package:dart_des/dart_des.dart';
import 'package:http/http.dart' as http;

void main() async {
  final key = utf8.encode('38343638');
  final encB64 = 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyZYSrL0BEigYelaWUYAWpj8YH2SR1uHt05TpItSbPKs+XqumRo6iOBBw7tS9a8Gtq';
  
  for (final pad in [DESPaddingType.PKCS7, DESPaddingType.PKCS5, DESPaddingType.None]) {
    try {
      final des = DES(key: key, mode: DESMode.ECB, paddingType: pad);
      final decryptedBytes = des.decrypt(base64Decode(encB64));
      print('Pad $pad -> Raw String: "${String.fromCharCodes(decryptedBytes)}"');
    } catch (e) {
      print('Pad $pad -> Error: $e');
    }
  }
}
