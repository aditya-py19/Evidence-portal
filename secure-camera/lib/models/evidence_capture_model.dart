import 'location_point_model.dart';

class EvidenceCaptureModel {
  final String filePath;
  final String fileName;
  final int fileSize;
  final String captureMode; // PHOTO or VIDEO
  final DateTime capturedAt;
  final DateTime? captureStartedAt;
  final DateTime? captureEndedAt;
  final int? captureDuration; // seconds
  final String clientSha256;
  final String locationStatus; // RECORDED, UNAVAILABLE, PERMISSION_DENIED
  final LocationPointModel? photoGps;
  final List<LocationPointModel> videoGpsTrail;
  String? evidenceNote;

  EvidenceCaptureModel({
    required this.filePath,
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
    this.evidenceNote,
  });
}
