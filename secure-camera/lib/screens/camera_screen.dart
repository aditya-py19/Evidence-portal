import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../services/camera_service.dart';
import 'capture_review_screen.dart';

class CameraScreen extends StatefulWidget {
  final CaseModel? selectedCase;

  const CameraScreen({Key? key, this.selectedCase}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final CameraService _cameraService = CameraService();
  bool _isInitializing = true;
  String? _initError;
  String _mode = 'PHOTO';

  int _recordingSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      await _cameraService.initialize();
      setState(() {
        _isInitializing = false;
      });
    } catch (e) {
      setState(() {
        _isInitializing = false;
        _initError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _cameraService.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    try {
      final capture = await _cameraService.capturePhoto();
      if (!mounted) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CaptureReviewScreen(
            selectedCase: widget.selectedCase,
            capture: capture,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Photo Capture Failed: $e')),
      );
    }
  }

  Future<void> _toggleVideoRecording() async {
    if (!_cameraService.isRecordingVideo) {
      try {
        await _cameraService.startVideoRecording();
        setState(() {
          _recordingSeconds = 0;
        });

        _timer = Timer.periodic(const Duration(seconds: 1), (t) {
          setState(() {
            _recordingSeconds++;
          });
        });
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Video Recording Start Failed: $e')),
        );
      }
    } else {
      _timer?.cancel();
      try {
        final capture = await _cameraService.stopVideoRecording();
        if (!mounted) return;

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CaptureReviewScreen(
              selectedCase: widget.selectedCase,
              capture: capture,
            ),
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Video Recording Stop Failed: $e')),
        );
      }
    }
  }

  String _formatTimer(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            if (_isInitializing)
              const Center(
                child: CircularProgressIndicator(color: Colors.white),
              )
            else if (_initError != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.videocam_off_outlined,
                          size: 48, color: Colors.white70),
                      const SizedBox(height: 12),
                      Text(
                        _initError!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _initCamera,
                        child: const Text('Retry Camera'),
                      ),
                    ],
                  ),
                ),
              )
            else
              Positioned.fill(
                child: AspectRatio(
                  aspectRatio: _cameraService.controller!.value.aspectRatio,
                  child: CameraPreview(_cameraService.controller!),
                ),
              ),

            // Top Bar: Banner
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.selectedCase != null
                                ? widget.selectedCase!.caseId
                                : 'UNASSIGNED CAPTURE',
                            style: TextStyle(
                              color: widget.selectedCase != null
                                  ? const Color(0xFF38BDF8)
                                  : const Color(0xFFF59E0B),
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            widget.selectedCase != null
                                ? widget.selectedCase!.title
                                : 'Rapid Field Evidence (Pending Case Assignment)',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.cameraswitch_outlined,
                          color: Colors.white),
                      onPressed: () => _cameraService.switchCamera(),
                    ),
                  ],
                ),
              ),
            ),

            if (_cameraService.isRecordingVideo)
              Positioned(
                top: 80,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.fiber_manual_record,
                            color: Colors.white, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          'REC ${_formatTimer(_recordingSeconds)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  if (!_cameraService.isRecordingVideo)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () => setState(() => _mode = 'PHOTO'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 6),
                              decoration: BoxDecoration(
                                color: _mode == 'PHOTO'
                                    ? Colors.white
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                'PHOTO',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _mode == 'PHOTO'
                                      ? Colors.black
                                      : Colors.white70,
                                ),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(() => _mode = 'VIDEO'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 6),
                              decoration: BoxDecoration(
                                color: _mode == 'VIDEO'
                                    ? Colors.white
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                'VIDEO',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _mode == 'VIDEO'
                                      ? Colors.black
                                      : Colors.white70,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),

                  GestureDetector(
                    onTap: _mode == 'PHOTO'
                        ? _takePhoto
                        : _toggleVideoRecording,
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                      ),
                      child: Center(
                        child: Container(
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _mode == 'PHOTO'
                                ? Colors.white
                                : _cameraService.isRecordingVideo
                                    ? Colors.red
                                    : Colors.redAccent,
                          ),
                          child: _cameraService.isRecordingVideo
                              ? const Icon(Icons.stop,
                                  color: Colors.white, size: 32)
                              : null,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
