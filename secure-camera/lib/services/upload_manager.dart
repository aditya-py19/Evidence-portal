import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import 'api_service.dart';
import 'encryption_service.dart';
import 'hash_service.dart';

class UploadProgressState {
  final int totalItems;
  final int completedItems;
  final double currentItemProgress;
  final double overallProgressPercentage;
  final String statusMessage;
  final bool isUploading;
  final String? errorMessage;

  UploadProgressState({
    required this.totalItems,
    required this.completedItems,
    required this.currentItemProgress,
    required this.overallProgressPercentage,
    required this.statusMessage,
    required this.isUploading,
    this.errorMessage,
  });

  factory UploadProgressState.initial() => UploadProgressState(
        totalItems: 0,
        completedItems: 0,
        currentItemProgress: 0.0,
        overallProgressPercentage: 0.0,
        statusMessage: 'Ready',
        isUploading: false,
      );
}

class UploadManager extends ChangeNotifier {
  static final UploadManager _instance = UploadManager._internal();
  factory UploadManager() => _instance;
  UploadManager._internal();

  final ApiService _apiService = ApiService();
  UploadProgressState _state = UploadProgressState.initial();

  UploadProgressState get state => _state;

  /// Pre-upload tamper verification & automatic file recovery
  Future<String> _verifyIntegrity(EvidenceCaptureModel capture) async {
    String workingFilePath = capture.filePath;
    bool isNewlyDecrypted = false;

    // Check if the current filePath exists
    final fileExists = workingFilePath.isNotEmpty && File(workingFilePath).existsSync();

    if (!fileExists) {
      // Re-decrypt from encrypted .enc file if preview cache is missing or path was deleted
      if (capture.encryptedFilePath != null &&
          capture.encryptedFilePath!.isNotEmpty &&
          File(capture.encryptedFilePath!).existsSync()) {
        workingFilePath = await EncryptionService.decryptToTempFile(capture.encryptedFilePath!);
        isNewlyDecrypted = true;
      } else {
        throw Exception(
          'Original capture file not found and encrypted backup is missing: ${capture.fileName}',
        );
      }
    }

    try {
      final recalculatedSha = await HashService.calculateSha256(workingFilePath);
      if (recalculatedSha.toLowerCase() != capture.clientSha256.toLowerCase()) {
        if (isNewlyDecrypted) {
          await EncryptionService.deleteFileSilently(workingFilePath);
        }
        throw Exception(
          'Evidence integrity verification failed. Possible tampering detected.',
        );
      }
      return workingFilePath;
    } catch (e) {
      if (isNewlyDecrypted) {
        await EncryptionService.deleteFileSilently(workingFilePath);
      }
      rethrow;
    }
  }

  /// Process upload of a single evidence capture with Tamper Verification & Auto Delete.
  Future<Map<String, dynamic>> uploadSingleCapture({
    CaseModel? selectedCase,
    required EvidenceCaptureModel capture,
    void Function(double progress)? onProgressUpdate,
  }) async {
    _state = UploadProgressState(
      totalItems: 1,
      completedItems: 0,
      currentItemProgress: 0.0,
      overallProgressPercentage: 0.0,
      statusMessage: 'Verifying Evidence Hash Integrity...',
      isUploading: true,
    );
    notifyListeners();

    // Step 1: Pre-upload file verification & integrity check
    final workingPath = await _verifyIntegrity(capture);

    // Create an updated capture reference pointing to verified working path for upload payload
    final uploadCaptureRef = EvidenceCaptureModel(
      filePath: workingPath,
      encryptedFilePath: capture.encryptedFilePath,
      fileName: capture.fileName,
      fileSize: capture.fileSize,
      captureMode: capture.captureMode,
      capturedAt: capture.capturedAt,
      captureStartedAt: capture.captureStartedAt,
      captureEndedAt: capture.captureEndedAt,
      captureDuration: capture.captureDuration,
      clientSha256: capture.clientSha256,
      locationStatus: capture.locationStatus,
      photoGps: capture.photoGps,
      videoGpsTrail: capture.videoGpsTrail,
      metadata: capture.metadata,
      sessionId: capture.sessionId,
      batchIndex: capture.batchIndex,
      evidenceNote: capture.evidenceNote,
    );

    try {
      _state = UploadProgressState(
        totalItems: 1,
        completedItems: 0,
        currentItemProgress: 0.05,
        overallProgressPercentage: 5.0,
        statusMessage: 'Uploading Secure Encrypted Payload (0%)...',
        isUploading: true,
      );
      notifyListeners();

      final result = await _apiService.submitSecureCapture(
        caseId: selectedCase?.caseId,
        capture: uploadCaptureRef,
        onProgress: (bytesSent, totalBytes) {
          final p = totalBytes > 0 ? (bytesSent / totalBytes) : 0.0;
          final pct = (p * 100).clamp(0, 100).toStringAsFixed(0);
          onProgressUpdate?.call(p);
          _state = UploadProgressState(
            totalItems: 1,
            completedItems: 0,
            currentItemProgress: p,
            overallProgressPercentage: p * 100,
            statusMessage: 'Uploading... $pct%',
            isUploading: true,
          );
          notifyListeners();
        },
      );

      // Step 2: Auto Delete temporary files AND local encrypted .enc on success
      await EncryptionService.deleteFileSilently(workingPath);
      if (capture.filePath.isNotEmpty && capture.filePath != workingPath) {
        await EncryptionService.deleteFileSilently(capture.filePath);
      }
      await EncryptionService.deleteFileSilently(capture.encryptedFilePath);

      _state = UploadProgressState(
        totalItems: 1,
        completedItems: 1,
        currentItemProgress: 1.0,
        overallProgressPercentage: 100.0,
        statusMessage: 'Evidence Upload Verified & Ledger Registered',
        isUploading: false,
      );
      notifyListeners();

      return result;
    } catch (e) {
      // On upload failure: delete temporary decrypted working & preview files ONLY.
      // Keep encrypted .enc file securely on device for future retries!
      await EncryptionService.deleteFileSilently(workingPath);
      if (capture.filePath.isNotEmpty && capture.filePath != workingPath) {
        await EncryptionService.deleteFileSilently(capture.filePath);
      }

      _state = UploadProgressState(
        totalItems: 1,
        completedItems: 0,
        currentItemProgress: 0.0,
        overallProgressPercentage: 0.0,
        statusMessage: 'Upload Failed',
        isUploading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      notifyListeners();

      rethrow;
    }
  }

  /// Task 6 & Task 7: Batch Upload Session
  Future<List<Map<String, dynamic>>> uploadBatchSession({
    CaseModel? selectedCase,
    required List<EvidenceCaptureModel> captures,
  }) async {
    final results = <Map<String, dynamic>>[];
    final total = captures.length;

    _state = UploadProgressState(
      totalItems: total,
      completedItems: 0,
      currentItemProgress: 0.0,
      overallProgressPercentage: 0.0,
      statusMessage: 'Starting Batch Evidence Session Upload (0/$total)...',
      isUploading: true,
    );
    notifyListeners();

    for (int i = 0; i < total; i++) {
      final capture = captures[i];
      final itemNum = i + 1;

      _state = UploadProgressState(
        totalItems: total,
        completedItems: i,
        currentItemProgress: 0.0,
        overallProgressPercentage: ((i / total) * 100),
        statusMessage: 'Uploading item $itemNum of $total...',
        isUploading: true,
      );
      notifyListeners();

      final res = await uploadSingleCapture(
        selectedCase: selectedCase,
        capture: capture,
        onProgressUpdate: (itemP) {
          final overall = (((i + itemP) / total) * 100).clamp(0, 100).toDouble();
          final pct = overall.toStringAsFixed(0);
          _state = UploadProgressState(
            totalItems: total,
            completedItems: i,
            currentItemProgress: itemP,
            overallProgressPercentage: overall,
            statusMessage: 'Uploading... $pct% ($itemNum/$total)',
            isUploading: true,
          );
          notifyListeners();
        },
      );
      results.add(res);
    }

    _state = UploadProgressState(
      totalItems: total,
      completedItems: total,
      currentItemProgress: 1.0,
      overallProgressPercentage: 100.0,
      statusMessage: 'Batch Upload Completed Successfully',
      isUploading: false,
    );
    notifyListeners();

    return results;
  }
}
