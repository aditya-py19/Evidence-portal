import 'capture_metadata_model.dart';
import 'location_point_model.dart';

class EvidenceCaptureModel {
  final String id;
  String filePath; // Raw or temporary working file path
  final String? encryptedFilePath; // AES-256 encrypted .enc file path for secure temp storage
  final String fileName;
  final int fileSize;
  final String captureMode; // PHOTO or VIDEO
  final DateTime capturedAt;
  final DateTime? captureStartedAt;
  final DateTime? captureEndedAt;
  final int? captureDuration; // seconds
  final String clientSha256; // Calculated original SHA-256
  final String locationStatus; // RECORDED, UNAVAILABLE, PERMISSION_DENIED
  final LocationPointModel? photoGps;
  final List<LocationPointModel> videoGpsTrail;
  final CaptureMetadataModel metadata;
  final String sessionId;
  final int batchIndex;
  String? evidenceNote;
  String? assignedCaseId;
  String? assignedCaseTitle;

  EvidenceCaptureModel({
    String? id,
    required this.filePath,
    this.encryptedFilePath,
    required this.fileName,
    required this.fileSize,
    required this.captureMode,
    required this.capturedAt,
    this.captureStartedAt,
    this.captureEndedAt,
    this.captureDuration,
    required this.clientSha256,
    required this.locationStatus,
    this.photoGps,
    this.videoGpsTrail = const [],
    required this.metadata,
    required this.sessionId,
    required this.batchIndex,
    this.evidenceNote,
    this.assignedCaseId,
    this.assignedCaseTitle,
  }) : id = id ?? 'LKR_${capturedAt.millisecondsSinceEpoch}_$batchIndex';

  Map<String, dynamic> toJson() => {
        'id': id,
        'filePath': filePath,
        'encryptedFilePath': encryptedFilePath,
        'fileName': fileName,
        'fileSize': fileSize,
        'captureMode': captureMode,
        'capturedAt': capturedAt.toIso8601String(),
        'captureStartedAt': captureStartedAt?.toIso8601String(),
        'captureEndedAt': captureEndedAt?.toIso8601String(),
        'captureDuration': captureDuration,
        'clientSha256': clientSha256,
        'locationStatus': locationStatus,
        'photoGps': photoGps?.toJson(),
        'videoGpsTrail': videoGpsTrail.map((p) => p.toJson()).toList(),
        'metadata': metadata.toJson(),
        'sessionId': sessionId,
        'batchIndex': batchIndex,
        'evidenceNote': evidenceNote,
        'assignedCaseId': assignedCaseId,
        'assignedCaseTitle': assignedCaseTitle,
      };

  factory EvidenceCaptureModel.fromJson(Map<String, dynamic> json) {
    return EvidenceCaptureModel(
      id: json['id'],
      filePath: json['filePath'] ?? '',
      encryptedFilePath: json['encryptedFilePath'],
      fileName: json['fileName'] ?? 'EVIDENCE_FILE',
      fileSize: json['fileSize'] ?? 0,
      captureMode: json['captureMode'] ?? 'PHOTO',
      capturedAt: json['capturedAt'] != null
          ? DateTime.parse(json['capturedAt'])
          : DateTime.now(),
      captureStartedAt: json['captureStartedAt'] != null
          ? DateTime.parse(json['captureStartedAt'])
          : null,
      captureEndedAt: json['captureEndedAt'] != null
          ? DateTime.parse(json['captureEndedAt'])
          : null,
      captureDuration: json['captureDuration'],
      clientSha256: json['clientSha256'] ?? '',
      locationStatus: json['locationStatus'] ?? 'RECORDED',
      photoGps: json['photoGps'] != null
          ? LocationPointModel.fromJson(json['photoGps'])
          : null,
      videoGpsTrail: (json['videoGpsTrail'] as List<dynamic>?)
              ?.map((p) => LocationPointModel.fromJson(p))
              .toList() ??
          [],
      metadata: json['metadata'] != null
          ? CaptureMetadataModel.fromJson(json['metadata'])
          : CaptureMetadataModel(
              deviceModel: 'Device',
              androidVersion: 'Android',
              osVersion: 'Android',
              appVersion: '1.0.0',
              cameraResolution: 'High',
              flashStatus: 'off',
              captureMode: 'PHOTO',
              timezone: 'UTC',
            ),
      sessionId: json['sessionId'] ?? 'SESSION_001',
      batchIndex: json['batchIndex'] ?? 0,
      evidenceNote: json['evidenceNote'],
      assignedCaseId: json['assignedCaseId'],
      assignedCaseTitle: json['assignedCaseTitle'],
    );
  }
}

