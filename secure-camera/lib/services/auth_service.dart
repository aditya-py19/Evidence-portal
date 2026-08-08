import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'secure_storage_service.dart';

class AuthService {
  final SecureStorageService _storage = SecureStorageService();

  /// Log in with Force ID, Registered Mobile Number, or Username and Password
  Future<UserModel> login(
    String identifier,
    String password, {
    bool rememberMe = true,
  }) async {
    final cleanIdentifier = identifier.trim().toLowerCase();

    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.loginUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'identifier': cleanIdentifier,
              'username': cleanIdentifier,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 15));

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {}

      if (response.statusCode == 200) {
        if (data == null || !data.containsKey('token') || !data.containsKey('user')) {
          throw Exception('Malformed login response from server.');
        }

        final token = data['token'] as String;
        final userMap = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userMap);

        if (!user.isOfficer) {
          throw Exception(
            'Your account is not authorized to use Secure Cam. Access is restricted to authorized investigating officers.',
          );
        }

        await _saveSession(token: token, userMap: userMap, rememberMe: rememberMe);
        return user;
      } else if (response.statusCode == 400 || response.statusCode == 401) {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Invalid Force ID / mobile number or password.');
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

  /// Feature 5: Request OTP for mobile authentication
  Future<bool> requestOtp(String mobileNumber) async {
    final cleanMobile = mobileNumber.trim();
    if (cleanMobile.isEmpty) {
      throw Exception('Please enter a valid registered mobile number.');
    }

    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.requestOtpUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'mobileNumber': cleanMobile,
              'identifier': cleanMobile,
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return true;
      } else if (response.statusCode == 404 || response.statusCode == 501) {
        throw Exception(
          'Backend OTP service endpoint requires deployment. Please use Force ID & Password login.',
        );
      } else {
        Map<String, dynamic>? data;
        try {
          data = jsonDecode(response.body);
        } catch (_) {}
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Failed to request OTP from server.');
      }
    } on TimeoutException {
      throw Exception('OTP request timed out. Please check connection.');
    } on http.ClientException {
      throw Exception('Unable to connect to server for OTP request.');
    }
  }

  /// Feature 5: Verify OTP and establish secure session
  Future<UserModel> verifyOtp(
    String mobileNumber,
    String otp, {
    bool rememberMe = true,
  }) async {
    final cleanMobile = mobileNumber.trim();
    final cleanOtp = otp.trim();

    if (cleanMobile.isEmpty || cleanOtp.isEmpty) {
      throw Exception('Mobile number and OTP code are required.');
    }

    try {
      final response = await http
          .post(
            Uri.parse(ApiConfig.verifyOtpUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'mobileNumber': cleanMobile,
              'otp': cleanOtp,
            }),
          )
          .timeout(const Duration(seconds: 15));

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {}

      if (response.statusCode == 200) {
        if (data == null || !data.containsKey('token') || !data.containsKey('user')) {
          throw Exception('Malformed OTP verification response from server.');
        }

        final token = data['token'] as String;
        final userMap = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userMap);

        if (!user.isOfficer) {
          throw Exception('Account not authorized for Secure Cam evidence capture.');
        }

        await _saveSession(token: token, userMap: userMap, rememberMe: rememberMe);
        return user;
      } else if (response.statusCode == 404 || response.statusCode == 501) {
        throw Exception('Backend OTP verification endpoint not implemented on server.');
      } else {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Invalid or expired OTP code.');
      }
    } on TimeoutException {
      throw Exception('OTP verification timed out.');
    } on http.ClientException {
      throw Exception('Network error verifying OTP.');
    }
  }

  /// Helper to persist token, profile, timestamp, and token expiration
  Future<void> _saveSession({
    required String token,
    required Map<String, dynamic> userMap,
    required bool rememberMe,
  }) async {
    final now = DateTime.now();
    // Default session validity max age: 7 days
    final expiry = now.add(const Duration(days: 7));

    await _storage.saveJwt(token);
    await _storage.saveUserJson(jsonEncode(userMap));
    await _storage.saveRememberMe(rememberMe);
    await _storage.saveLoginTimestamp(now);
    await _storage.saveTokenExpiry(expiry);
  }

  /// Feature 6 & Feature 7: Session validation
  Future<bool> isSessionValid() async {
    try {
      final jwt = await _storage.getJwt();
      if (jwt == null || jwt.isEmpty) return false;

      final rememberMe = await _storage.getRememberMe();
      if (!rememberMe) return false;

      final expiry = await _storage.getTokenExpiry();
      if (expiry != null && DateTime.now().isAfter(expiry)) {
        await logout();
        return false;
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  /// Feature 1: Retrieve saved officer session profile
  Future<UserModel?> getSavedUser() async {
    try {
      final valid = await isSessionValid();
      if (!valid) {
        return null;
      }

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

  /// Feature 8: Full secure logout
  Future<void> logout() async {
    await _storage.clearAll();
  }
}

