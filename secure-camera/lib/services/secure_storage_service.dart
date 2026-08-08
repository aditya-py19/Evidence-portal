import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final _storage = const FlutterSecureStorage();

  static const String _keyJwt = 'jwt_token';
  static const String _keyUser = 'user_data';
  static const String _keyRememberMe = 'remember_me';
  static const String _keyLoginTimestamp = 'login_timestamp';
  static const String _keyTokenExpiry = 'token_expiry';
  static const String _keyBiometricEnabled = 'biometric_enabled';

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

  Future<void> saveRememberMe(bool remember) async {
    await _storage.write(key: _keyRememberMe, value: remember.toString());
  }

  Future<bool> getRememberMe() async {
    final val = await _storage.read(key: _keyRememberMe);
    return val != 'false'; // Enabled by default
  }

  Future<void> saveLoginTimestamp(DateTime timestamp) async {
    await _storage.write(key: _keyLoginTimestamp, value: timestamp.toIso8601String());
  }

  Future<DateTime?> getLoginTimestamp() async {
    final val = await _storage.read(key: _keyLoginTimestamp);
    if (val == null) return null;
    return DateTime.tryParse(val);
  }

  Future<void> saveTokenExpiry(DateTime expiry) async {
    await _storage.write(key: _keyTokenExpiry, value: expiry.toIso8601String());
  }

  Future<DateTime?> getTokenExpiry() async {
    final val = await _storage.read(key: _keyTokenExpiry);
    if (val == null) return null;
    return DateTime.tryParse(val);
  }

  Future<void> saveBiometricEnabled(bool enabled) async {
    await _storage.write(key: _keyBiometricEnabled, value: enabled.toString());
  }

  Future<bool> getBiometricEnabled() async {
    final val = await _storage.read(key: _keyBiometricEnabled);
    return val == 'true';
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

