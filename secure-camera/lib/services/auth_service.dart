import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'secure_storage_service.dart';

class AuthService {
  final SecureStorageService _storage = SecureStorageService();

  Future<UserModel> login(String username, String password) async {
    final cleanUsername = username.trim().toLowerCase();

    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.loginUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'identifier': cleanUsername,
              'username': cleanUsername,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 15));

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {
        // Response was non-JSON (HTML 502/503 error page from server)
      }

      if (response.statusCode == 200) {
        if (data == null || !data.containsKey('token') || !data.containsKey('user')) {
          throw Exception('Malformed login response from server.');
        }

        final token = data['token'] as String;
        final userMap = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userMap);

        if (!user.isOfficer) {
          throw Exception(
            'Your account is not authorized to use Secure Cam. Secure Cam is available to authorized investigating officers.',
          );
        }

        await _storage.saveJwt(token);
        await _storage.saveUserJson(jsonEncode(userMap));

        return user;
      } else if (response.statusCode == 400 || response.statusCode == 401) {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Invalid username or password.');
      } else if (response.statusCode == 403) {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Your account is not authorized to use Secure Cam.');
      } else if (response.statusCode >= 500) {
        throw Exception('Server is temporarily unavailable. Please try again.');
      } else {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Authentication failed (HTTP ${response.statusCode}).');
      }
    } on TimeoutException {
      throw Exception('Connection timeout. Unable to connect to Evidence Portal.');
    } on http.ClientException {
      throw Exception('Unable to connect to Evidence Portal. Please check network.');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('An unexpected authentication error occurred.');
    }
  }

  Future<UserModel?> getSavedUser() async {
    try {
      final jsonStr = await _storage.getUserJson();
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final userMap = jsonDecode(jsonStr) as Map<String, dynamic>;
        return UserModel.fromJson(userMap);
      }
    } catch (_) {
      await logout();
    }
    return null;
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}
