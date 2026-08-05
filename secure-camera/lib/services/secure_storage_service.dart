import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final _storage = const FlutterSecureStorage();

  static const String _keyJwt = 'jwt_token';
  static const String _keyUser = 'user_data';

  Future<void> saveJwt(String token) async {
    await _storage.write(key: _keyJwt, value: token);
  }

  Future<String?> getJwt() async {
    return await _storage.read(key: _keyJwt);
  }

  Future<void> saveUserJson(String jsonStr) async {
    await _storage.write(key: _keyUser, value: jsonStr);
  }

  Future<String?> getUserJson() async {
    return await _storage.read(key: _keyUser);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
