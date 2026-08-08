import 'dart:io';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class EncryptionService {
  static const String _keyStorageAlias = 'secure_cam_aes_master_key';
  static final _secureStorage = const FlutterSecureStorage();
  static enc.Key? _cachedKey;

  /// Retrieves or initializes a 256-bit AES key stored in FlutterSecureStorage.
  static Future<enc.Key> _getOrGenerateMasterKey() async {
    if (_cachedKey != null) return _cachedKey!;

    String? keyBase64 = await _secureStorage.read(key: _keyStorageAlias);
    if (keyBase64 == null) {
      final key = enc.Key.fromSecureRandom(32); // 256-bit AES Key
      await _secureStorage.write(key: _keyStorageAlias, value: key.base64);
      _cachedKey = key;
      return key;
    }

    _cachedKey = enc.Key.fromBase64(keyBase64);
    return _cachedKey!;
  }

  /// Encrypts raw capture file at [rawPath] using AES-256-CBC with random IV.
  /// Saves encrypted payload (.enc) to temp storage and deletes unencrypted original.
  static Future<String> encryptTempFile(String rawPath) async {
    final rawFile = File(rawPath);
    if (!await rawFile.exists()) {
      throw Exception('Original capture file for encryption not found: $rawPath');
    }

    final rawBytes = await rawFile.readAsBytes();
    final key = await _getOrGenerateMasterKey();
    final iv = enc.IV.fromSecureRandom(16);

    final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc));
    final encryptedData = encrypter.encryptBytes(rawBytes, iv: iv);

    final tempDir = await getTemporaryDirectory();
    final fileName = '${p.basenameWithoutExtension(rawPath)}_${DateTime.now().millisecondsSinceEpoch}.enc';
    final encFilePath = p.join(tempDir.path, fileName);
    final encFile = File(encFilePath);

    // Save IV (16 bytes) + Ciphertext
    final builder = BytesBuilder();
    builder.add(iv.bytes);
    builder.add(encryptedData.bytes);

    await encFile.writeAsBytes(builder.toBytes(), flush: true);

    // Shred/Delete unencrypted original temporary camera file immediately
    try {
      if (await rawFile.exists()) {
        await rawFile.delete();
      }
    } catch (_) {}

    return encFilePath;
  }

  /// Decrypts encrypted (.enc) file at [encFilePath] to temporary unencrypted file location.
  /// Returns path to decrypted temporary file.
  static Future<String> decryptToTempFile(String encFilePath) async {
    final encFile = File(encFilePath);
    if (!await encFile.exists()) {
      throw Exception('Encrypted temporary file not found at: $encFilePath');
    }

    final allBytes = await encFile.readAsBytes();
    if (allBytes.length < 17) {
      throw Exception('Corrupted encrypted file structure.');
    }

    // Extract 16-byte IV and Ciphertext
    final ivBytes = allBytes.sublist(0, 16);
    final cipherBytes = allBytes.sublist(16);

    final key = await _getOrGenerateMasterKey();
    final iv = enc.IV(ivBytes);

    final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc));
    final decryptedBytes = encrypter.decryptBytes(enc.Encrypted(cipherBytes), iv: iv);

    final tempDir = await getTemporaryDirectory();
    final ext = encFilePath.contains('VIDEO') ? '.mp4' : '.jpg';
    final decFileName = 'dec_${p.basenameWithoutExtension(encFilePath)}$ext';
    final decFilePath = p.join(tempDir.path, decFileName);

    final decFile = File(decFilePath);
    await decFile.writeAsBytes(decryptedBytes, flush: true);

    return decFilePath;
  }

  /// Safely wipes file if it exists.
  static Future<void> deleteFileSilently(String? filePath) async {
    if (filePath == null || filePath.isEmpty) return;
    try {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {}
  }
}
