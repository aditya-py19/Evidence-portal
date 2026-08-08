import 'package:flutter_test/flutter_test.dart';
import 'package:secure_camera/models/capture_metadata_model.dart';
import 'package:secure_camera/models/evidence_capture_model.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('CaptureMetadataModel Unit Tests', () {
    test('toJson and fromJson serialize metadata correctly', () {
      final model = CaptureMetadataModel(
        deviceModel: 'Pixel 8 Pro',
        androidVersion: 'Android 14',
        osVersion: 'Android 14',
        appVersion: '1.0.0+1',
        cameraResolution: 'High (1080p)',
        flashStatus: 'off',
        captureMode: 'PHOTO',
        timezone: 'IST (UTC+05:30)',
      );

      final json = model.toJson();
      expect(json['deviceModel'], equals('Pixel 8 Pro'));
      expect(json['androidVersion'], equals('Android 14'));
      expect(json['flashStatus'], equals('off'));
      expect(json['captureMode'], equals('PHOTO'));

      final restored = CaptureMetadataModel.fromJson(json);
      expect(restored.deviceModel, equals('Pixel 8 Pro'));
      expect(restored.timezone, equals('IST (UTC+05:30)'));
    });
  });

  group('EvidenceCaptureModel Serialization Tests', () {
    test('toJson and fromJson serialize capture models correctly', () {
      final meta = CaptureMetadataModel(
        deviceModel: 'Test Device',
        androidVersion: 'Android 14',
        osVersion: 'Android 14',
        appVersion: '1.0.0',
        cameraResolution: 'High',
        flashStatus: 'off',
        captureMode: 'PHOTO',
        timezone: 'UTC',
      );

      final capture = EvidenceCaptureModel(
        id: 'LKR_TEST_001',
        filePath: '/tmp/test.jpg',
        encryptedFilePath: '/tmp/test.enc',
        fileName: 'PHOTO_SEC_12345.jpg',
        fileSize: 2048576,
        captureMode: 'PHOTO',
        capturedAt: DateTime.parse('2026-08-08T12:00:00.000Z'),
        clientSha256: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
        locationStatus: 'RECORDED',
        metadata: meta,
        sessionId: 'SESS-001',
        batchIndex: 1,
        evidenceNote: 'Test note for evidence locker',
        assignedCaseId: 'TC-2026-0142',
        assignedCaseTitle: 'Cyber Fraud Investigation',
      );

      final jsonMap = capture.toJson();
      expect(jsonMap['id'], equals('LKR_TEST_001'));
      expect(jsonMap['encryptedFilePath'], equals('/tmp/test.enc'));
      expect(jsonMap['assignedCaseId'], equals('TC-2026-0142'));

      final restored = EvidenceCaptureModel.fromJson(jsonMap);
      expect(restored.id, equals('LKR_TEST_001'));
      expect(restored.encryptedFilePath, equals('/tmp/test.enc'));
      expect(restored.evidenceNote, equals('Test note for evidence locker'));
      expect(restored.assignedCaseId, equals('TC-2026-0142'));
    });
  });
}
