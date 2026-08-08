import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import '../models/evidence_capture_model.dart';
import 'encryption_service.dart';

class LockerStorageService {
  static final LockerStorageService _instance = LockerStorageService._internal();
  factory LockerStorageService() => _instance;
  LockerStorageService._internal();

  Future<File> _getLockerFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/local_evidence_locker_index.json');
  }

  /// Save a single evidence capture to the Local Evidence Locker
  Future<void> saveToLocker(EvidenceCaptureModel capture) async {
    final file = await _getLockerFile();
    final items = await getLockerItems();

    // Check if item already exists in locker by ID or encryptedFilePath
    final existingIdx = items.indexWhere((i) =>
        i.id == capture.id ||
        (i.encryptedFilePath != null &&
            i.encryptedFilePath == capture.encryptedFilePath));

    if (existingIdx >= 0) {
      items[existingIdx] = capture;
    } else {
      items.insert(0, capture);
    }

    final jsonList = items.map((i) => i.toJson()).toList();
    await file.writeAsString(jsonEncode(jsonList));
  }

  /// Save a batch of evidence captures to the Local Evidence Locker
  Future<void> saveBatchToLocker(List<EvidenceCaptureModel> captures) async {
    for (final capture in captures) {
      await saveToLocker(capture);
    }
  }

  /// Fetch all pending evidence items in the Local Evidence Locker
  Future<List<EvidenceCaptureModel>> getLockerItems() async {
    try {
      final file = await _getLockerFile();
      if (!await file.exists()) return [];

      final content = await file.readAsString();
      if (content.trim().isEmpty) return [];

      final List<dynamic> rawList = jsonDecode(content);
      final items = <EvidenceCaptureModel>[];

      for (final map in rawList) {
        try {
          if (map is Map<String, dynamic>) {
            items.add(EvidenceCaptureModel.fromJson(map));
          }
        } catch (e) {
          debugPrint('Error parsing locker item JSON: $e');
        }
      }

      // Sort descending by capture timestamp
      items.sort((a, b) => b.capturedAt.compareTo(a.capturedAt));
      return items;
    } catch (e) {
      debugPrint('Error reading locker file: $e');
      return [];
    }
  }

  /// Delete a single evidence item from locker and shred local files
  Future<void> deleteLockerItem(String id) async {
    final items = await getLockerItems();
    final file = await _getLockerFile();

    final itemToDelete = items.firstWhere(
      (i) => i.id == id,
      orElse: () => EvidenceCaptureModel(
        id: '',
        filePath: '',
        fileName: '',
        fileSize: 0,
        captureMode: 'PHOTO',
        capturedAt: DateTime.now(),
        clientSha256: '',
        locationStatus: 'RECORDED',
        metadata: items.isNotEmpty ? items.first.metadata : null as dynamic,
        sessionId: '',
        batchIndex: 0,
      ),
    );

    if (itemToDelete.id.isNotEmpty) {
      // Shred local decrypted and encrypted files
      if (itemToDelete.encryptedFilePath != null) {
        await EncryptionService.deleteFileSilently(itemToDelete.encryptedFilePath);
      }
      if (itemToDelete.filePath.isNotEmpty) {
        await EncryptionService.deleteFileSilently(itemToDelete.filePath);
      }
    }

    items.removeWhere((i) => i.id == id);
    final jsonList = items.map((i) => i.toJson()).toList();
    await file.writeAsString(jsonEncode(jsonList));
  }

  /// Assign a case to selected locker items
  Future<void> assignCaseToItems(
      List<String> ids, String caseId, String caseTitle) async {
    final items = await getLockerItems();
    final file = await _getLockerFile();

    for (final item in items) {
      if (ids.contains(item.id)) {
        item.assignedCaseId = caseId;
        item.assignedCaseTitle = caseTitle;
      }
    }

    final jsonList = items.map((i) => i.toJson()).toList();
    await file.writeAsString(jsonEncode(jsonList));
  }

  /// Remove item from locker after successful HTTP 200 upload
  Future<void> markUploaded(String id) async {
    await deleteLockerItem(id);
  }

  /// Get total count of pending encrypted evidence items in locker
  Future<int> getPendingCount() async {
    final items = await getLockerItems();
    return items.length;
  }
}
