import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import 'secure_storage_service.dart';

class MultipartRequestWithProgress extends http.MultipartRequest {
  final void Function(int bytesSent, int totalBytes)? onProgress;

  MultipartRequestWithProgress(
    String method,
    Uri url, {
    this.onProgress,
  }) : super(method, url);

  @override
  http.ByteStream finalize() {
    final byteStream = super.finalize();
    if (onProgress == null) return byteStream;

    final total = contentLength;
    int bytesSent = 0;

    final transformer = StreamTransformer<List<int>, List<int>>.fromHandlers(
      handleData: (data, sink) {
        bytesSent += data.length;
        onProgress!(bytesSent, total);
        sink.add(data);
      },
    );

    return http.ByteStream(byteStream.transform(transformer));
  }
}

class ApiService {
  final SecureStorageService _storage = SecureStorageService();

  Future<List<CaseModel>> fetchAssignedCases() async {
    final jwt = await _storage.getJwt();
    if (jwt == null) throw Exception('Authentication session expired.');

    try {
      final response = await http
          .get(
            Uri.parse(ApiConfig.casesUrl),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $jwt',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401) {
        await _storage.clearAll();
        throw Exception('Session expired. Please log in again.');
      }

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {}

      if (response.statusCode == 200) {
        final rawList = data?['cases'] as List<dynamic>? ?? [];
        return rawList.map((c) => CaseModel.fromJson(c as Map<String, dynamic>)).toList();
      } else {
        final msg = data?['message'] as String?;
        throw Exception(msg ?? 'Failed to fetch authorized cases (HTTP ${response.statusCode}).');
      }
    } on TimeoutException {
      throw Exception('Connection timeout fetching cases. Please try again.');
    } on SocketException {
      throw Exception('Unable to connect to Evidence Portal backend.');
    }
  }

  Future<Map<String, dynamic>> submitSecureCapture({
    String? caseId,
    required EvidenceCaptureModel capture,
    void Function(int bytesSent, int totalBytes)? onProgress,
  }) async {
    final jwt = await _storage.getJwt();
    if (jwt == null) throw Exception('Authentication session expired.');

    final file = File(capture.filePath);
    if (!await file.exists()) {
      throw Exception('Original capture file does not exist locally.');
    }

    try {
      final request = MultipartRequestWithProgress(
        'POST',
        Uri.parse(ApiConfig.secureCaptureUrl),
        onProgress: onProgress,
      );

      request.headers['Authorization'] = 'Bearer $jwt';

      if (caseId != null && caseId.trim().isNotEmpty) {
        request.fields['caseId'] = caseId.trim();
      }
      request.fields['clientSha256'] = capture.clientSha256;
      request.fields['captureMode'] = capture.captureMode;
      request.fields['capturedAt'] = capture.capturedAt.toIso8601String();
      request.fields['locationStatus'] = capture.locationStatus;

      // Metadata fields for Evidence Passport
      request.fields['metadata'] = jsonEncode(capture.metadata.toJson());
      request.fields['deviceModel'] = capture.metadata.deviceModel;
      request.fields['androidVersion'] = capture.metadata.androidVersion;
      request.fields['appVersion'] = capture.metadata.appVersion;
      request.fields['cameraResolution'] = capture.metadata.cameraResolution;
      request.fields['flashStatus'] = capture.metadata.flashStatus;
      request.fields['timezone'] = capture.metadata.timezone;

      if (capture.evidenceNote != null && capture.evidenceNote!.trim().isNotEmpty) {
        request.fields['note'] = capture.evidenceNote!.trim();
      }

      if (capture.photoGps != null) {
        request.fields['photoGps'] = jsonEncode(capture.photoGps!.toJson());
      }

      if (capture.videoGpsTrail.isNotEmpty) {
        request.fields['videoGpsTrail'] = jsonEncode(
          capture.videoGpsTrail.map((p) => p.toJson()).toList(),
        );
      }

      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          capture.filePath,
          filename: capture.fileName,
        ),
      );

      final streamedResponse = await request.send().timeout(const Duration(seconds: 60));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 401) {
        await _storage.clearAll();
        throw Exception('Session expired during upload. Please log in again.');
      }

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {}

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data ?? {};
      } else {
        final msg = data?['error'] ?? data?['message'] ?? 'Evidence registration failed.';
        throw Exception('$msg (HTTP ${response.statusCode})');
      }
    } on TimeoutException {
      throw Exception('Upload timeout. Server processing taking longer than expected.');
    } on SocketException {
      throw Exception('Network connection lost during evidence upload.');
    }
  }

  Future<Map<String, dynamic>> assignEvidenceToCase({
    required String evidenceId,
    required String caseId,
  }) async {
    final jwt = await _storage.getJwt();
    if (jwt == null) throw Exception('Authentication session expired.');

    try {
      final response = await http
          .patch(
            Uri.parse('${ApiConfig.baseUrl}/api/evidence/$evidenceId/assign-case'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $jwt',
            },
            body: jsonEncode({'caseId': caseId.trim()}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401) {
        await _storage.clearAll();
        throw Exception('Session expired. Please log in again.');
      }

      Map<String, dynamic>? data;
      try {
        if (response.body.isNotEmpty) {
          data = jsonDecode(response.body) as Map<String, dynamic>?;
        }
      } catch (_) {}

      if (response.statusCode == 200) {
        return data ?? {};
      } else {
        final msg = data?['message'] ?? 'Failed to assign evidence to case.';
        throw Exception(msg);
      }
    } on TimeoutException {
      throw Exception('Connection timeout assigning case.');
    } on SocketException {
      throw Exception('Network error assigning case.');
    }
  }
}
