import 'dart:io';
import 'package:crypto/crypto.dart';

class HashService {
  /// Calculates SHA-256 hash directly from raw bytes of original captured file.
  static Future<String> calculateSha256(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('Original capture file not found at path: $filePath');
    }

    final bytes = await file.readAsBytes();
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}
