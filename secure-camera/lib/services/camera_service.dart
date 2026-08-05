import 'dart:io';
import 'package:camera/camera.dart';
import '../models/evidence_capture_model.dart';
import 'hash_service.dart';
import 'location_service.dart';

class CameraService {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIdx = 0;

  bool _isRecordingVideo = false;
  DateTime? _videoStartTime;
  final LocationService _locationService = LocationService();

  bool get isInitialized => _controller != null && _controller!.value.isInitialized;
  bool get isRecordingVideo => _isRecordingVideo;
  CameraController? get controller => _controller;

  Future<void> initialize() async {
    _cameras = await availableCameras();
    if (_cameras.isEmpty) {
      throw Exception('No camera hardware available on device.');
    }
    await _initController(_cameras[_selectedCameraIdx]);
  }

  Future<void> _initController(CameraDescription camera) async {
    await _controller?.dispose();
    _controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );
    await _controller!.initialize();
  }

  Future<void> switchCamera() async {
    if (_cameras.length < 2) return;
    _selectedCameraIdx = (_selectedCameraIdx + 1) % _cameras.length;
    await _initController(_cameras[_selectedCameraIdx]);
  }

  Future<EvidenceCaptureModel> capturePhoto() async {
    if (!isInitialized) throw Exception('Camera not initialized.');

    final XFile xFile = await _controller!.takePicture();
    final capturedAt = DateTime.now();

    final locationPoint = await _locationService.getCurrentLocation();
    final locationStatus = locationPoint != null ? 'RECORDED' : 'UNAVAILABLE';

    final clientHash = await HashService.calculateSha256(xFile.path);
    final file = File(xFile.path);
    final fileSize = await file.length();

    return EvidenceCaptureModel(
      filePath: xFile.path,
      fileName: 'PHOTO_SEC_${capturedAt.millisecondsSinceEpoch}.jpg',
      fileSize: fileSize,
      captureMode: 'PHOTO',
      capturedAt: capturedAt,
      clientSha256: clientHash,
      locationStatus: locationStatus,
      photoGps: locationPoint,
    );
  }

  Future<void> startVideoRecording() async {
    if (!isInitialized || _isRecordingVideo) return;

    await _controller!.startVideoRecording();
    _isRecordingVideo = true;
    _videoStartTime = DateTime.now();
    _locationService.startTrailRecording();
  }

  Future<EvidenceCaptureModel> stopVideoRecording() async {
    if (!isInitialized || !_isRecordingVideo) {
      throw Exception('Video recording is not currently active.');
    }

    final XFile xFile = await _controller!.stopVideoRecording();
    final videoEndTime = DateTime.now();
    _isRecordingVideo = false;

    final trail = _locationService.stopTrailRecording();
    final duration = _videoStartTime != null
        ? videoEndTime.difference(_videoStartTime!).inSeconds
        : 0;

    final clientHash = await HashService.calculateSha256(xFile.path);
    final file = File(xFile.path);
    final fileSize = await file.length();

    return EvidenceCaptureModel(
      filePath: xFile.path,
      fileName: 'VIDEO_SEC_${videoEndTime.millisecondsSinceEpoch}.mp4',
      fileSize: fileSize,
      captureMode: 'VIDEO',
      capturedAt: videoEndTime,
      captureStartedAt: _videoStartTime,
      captureEndedAt: videoEndTime,
      captureDuration: duration,
      clientSha256: clientHash,
      locationStatus: trail.isNotEmpty ? 'RECORDED' : 'UNAVAILABLE',
      videoGpsTrail: trail,
    );
  }

  void dispose() {
    _controller?.dispose();
  }
}
