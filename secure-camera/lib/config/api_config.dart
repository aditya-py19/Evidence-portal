class ApiConfig {
  // Set to true only during local Android emulator testing
  static const bool _useLocalDev = false;

  static const String prodBaseUrl = 'https://evidence-portal-0imv.onrender.com';
  static const String devBaseUrl = 'http://10.0.2.2:3000';

  static String get baseUrl => _useLocalDev ? devBaseUrl : prodBaseUrl;

  static String get loginUrl => '$baseUrl/api/auth/login';
  static String get requestOtpUrl => '$baseUrl/api/auth/request-otp';
  static String get verifyOtpUrl => '$baseUrl/api/auth/verify-otp';
  static String get refreshTokenUrl => '$baseUrl/api/auth/refresh-token';
  static String get casesUrl => '$baseUrl/api/cases';
  static String get secureCaptureUrl => '$baseUrl/api/evidence/secure-capture';
}

