import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../models/evidence_capture_model.dart';
import 'encryption_service.dart';
import 'hash_service.dart';
import 'location_service.dart';
import 'metadata_service.dart';

class CameraService {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIdx = 0;

  bool _isRecordingVideo = false;
  DateTime? _videoStartTime;
  final LocationService _locationService = LocationService();

  FlashMode _currentFlashMode = FlashMode.off;
  double _minZoomLevel = 1.0;
  double _maxZoomLevel = 1.0;
  double _currentZoomLevel = 1.0;

  double _minExposureOffset = 0.0;
  double _maxExposureOffset = 0.0;
  double _currentExposureOffset = 0.0;

  bool get isInitialized => _controller != null && _controller!.value.isInitialized;
  bool get isRecordingVideo => _isRecordingVideo;
  CameraController? get controller => _controller;

  FlashMode get currentFlashMode => _currentFlashMode;
  double get minZoomLevel => _minZoomLevel;
  double get maxZoomLevel => _maxZoomLevel;
  double get currentZoomLevel => _currentZoomLevel;

  double get minExposureOffset => _minExposureOffset;
  double get maxExposureOffset => _maxExposureOffset;
  double get currentExposureOffset => _currentExposureOffset;

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

    try {
      _minZoomLevel = await _controller!.getMinZoomLevel();
      _maxZoomLevel = await _controller!.getMaxZoomLevel();
      _currentZoomLevel = _minZoomLevel;
    } catch (_) {}

    try {
      _minExposureOffset = await _controller!.getMinExposureOffset();
      _maxExposureOffset = await _controller!.getMaxExposureOffset();
      _currentExposureOffset = 0.0;
    } catch (_) {}

    _currentFlashMode = FlashMode.off;
    try {
      await _controller!.setFlashMode(_currentFlashMode);
    } catch (_) {}
  }

  Future<void> switchCamera() async {
    if (_cameras.length < 2) return;
    _selectedCameraIdx = (_selectedCameraIdx + 1) % _cameras.length;
    await _initController(_cameras[_selectedCameraIdx]);
  }

  Future<void> toggleFlashMode() async {
    if (!isInitialized) return;
    switch (_currentFlashMode) {
      case FlashMode.off:
        _currentFlashMode = FlashMode.auto;
        break;
      case FlashMode.auto:
        _currentFlashMode = FlashMode.always;
        break;
      case FlashMode.always:
        _currentFlashMode = FlashMode.torch;
        break;
      case FlashMode.torch:
        _currentFlashMode = FlashMode.off;
        break;
    }
    try {
      await _controller!.setFlashMode(_currentFlashMode);
    } catch (_) {}
  }

  Future<void> setZoomLevel(double zoom) async {
    if (!isInitialized) return;
    final clampedZoom = zoom.clamp(_minZoomLevel, _maxZoomLevel);
    _currentZoomLevel = clampedZoom;
    try {
      await _controller!.setZoomLevel(clampedZoom);
    } catch (_) {}
  }

  Future<void> setExposureOffset(double offset) async {
    if (!isInitialized) return;
    final clampedOffset = offset.clamp(_minExposureOffset, _maxExposureOffset);
    _currentExposureOffset = clampedOffset;
    try {
      await _controller!.setExposureOffset(clampedOffset);
    } catch (_) {}
  }

  Future<void> setTapToFocus(Offset point) async {
    if (!isInitialized) return;
    try {
      await _controller!.setFocusPoint(point);
      await _controller!.setExposurePoint(point);
    } catch (_) {}
  }

  /// Task 2: Immediate Local File AES Encryption after capture.
  Future<EvidenceCaptureModel> capturePhoto({
    required String sessionId,
    required int batchIndex,
  }) async {
    if (!isInitialized) throw Exception('Camera not initialized.');

    final XFile xFile = await _controller!.takePicture();
    final capturedAt = DateTime.now();

    final locationPoint = await _locationService.getCurrentLocation();
    final locationStatus = locationPoint != null ? 'RECORDED' : 'UNAVAILABLE';

    // Calculate original SHA-256 BEFORE encryption
    final clientHash = await HashService.calculateSha256(xFile.path);
    final file = File(xFile.path);
    final fileSize = await file.length();

    // Task 9: Collect rich metadata
    final metadata = await MetadataService.collectMetadata(
      cameraResolution: 'High (1080p)',
      flashStatus: _currentFlashMode.name,
      captureMode: 'PHOTO',
    );

    // Task 2: AES-256 Encrypt temporary file immediately & delete raw
    final encryptedPath = await EncryptionService.encryptTempFile(xFile.path);

    return EvidenceCaptureModel(
      filePath: xFile.path, // Original path (shredded)
      encryptedFilePath: encryptedPath, // Local AES encrypted file path (.enc)
      fileName: 'PHOTO_SEC_${capturedAt.millisecondsSinceEpoch}.jpg',
      fileSize: fileSize,
      captureMode: 'PHOTO',
      capturedAt: capturedAt,
      clientSha256: clientHash,
      locationStatus: locationStatus,
      photoGps: locationPoint,
      metadata: metadata,
      sessionId: sessionId,
      batchIndex: batchIndex,
    );
  }

  Future<void> startVideoRecording() async {
    if (!isInitialized || _isRecordingVideo) return;

    await _controller!.startVideoRecording();
    _isRecordingVideo = true;
    _videoStartTime = DateTime.now();
    _locationService.startTrailRecording();
  }

  Future<EvidenceCaptureModel> stopVideoRecording({
    required String sessionId,
    required int batchIndex,
  }) async {
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

    // Calculate original SHA-256 BEFORE encryption
    final clientHash = await HashService.calculateSha256(xFile.path);
    final file = File(xFile.path);
    final fileSize = await file.length();

    // Task 9: Collect rich metadata
    final metadata = await MetadataService.collectMetadata(
      cameraResolution: 'High (1080p)',
      flashStatus: _currentFlashMode.name,
      captureMode: 'VIDEO',
    );

    // Task 2: AES-256 Encrypt temporary file immediately & delete raw
    final encryptedPath = await EncryptionService.encryptTempFile(xFile.path);

    return EvidenceCaptureModel(
      filePath: xFile.path,
      encryptedFilePath: encryptedPath,
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
      metadata: metadata,
      sessionId: sessionId,
      batchIndex: batchIndex,
    );
  }

  void dispose() {
    _controller?.dispose();
  }
}
