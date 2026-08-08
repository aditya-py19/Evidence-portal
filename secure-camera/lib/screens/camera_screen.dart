import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import '../services/camera_service.dart';
import '../widgets/upload_progress_overlay.dart';
import 'capture_review_screen.dart';

class CameraScreen extends StatefulWidget {
  final CaseModel? selectedCase;

  const CameraScreen({Key? key, this.selectedCase}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final CameraService _cameraService = CameraService();
  final List<EvidenceCaptureModel> _sessionCaptures = [];
  late String _sessionId;

  bool _isInitializing = true;
  String? _initError;
  String _mode = 'PHOTO';

  int _recordingSeconds = 0;
  Timer? _timer;

  // Camera Usability Controls
  bool _showExposureSlider = false;
  Offset? _focusTapPosition;
  Timer? _focusRingTimer;

  @override
  void initState() {
    super.initState();
    _sessionId = 'SESSION_${DateTime.now().millisecondsSinceEpoch}';
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      await _cameraService.initialize();
      if (mounted) {
        setState(() {
          _isInitializing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isInitializing = false;
          _initError = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _focusRingTimer?.cancel();
    _cameraService.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    try {
      final capture = await _cameraService.capturePhoto(
        sessionId: _sessionId,
        batchIndex: _sessionCaptures.length,
      );

      setState(() {
        _sessionCaptures.add(capture);
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 2),
          backgroundColor: const Color(0xFF0F172A),
          content: Text(
            '✓ Photo #${_sessionCaptures.length} captured & encrypted locally.',
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          content: Text('Photo Capture Failed: $e'),
        ),
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
          if (mounted) {
            setState(() {
              _recordingSeconds++;
            });
          }
        });
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Video Recording Start Failed: $e'),
          ),
        );
      }
    } else {
      _timer?.cancel();
      try {
        final capture = await _cameraService.stopVideoRecording(
          sessionId: _sessionId,
          batchIndex: _sessionCaptures.length,
        );

        setState(() {
          _sessionCaptures.add(capture);
        });

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            duration: const Duration(seconds: 2),
            backgroundColor: const Color(0xFF0F172A),
            content: Text(
              '✓ Video #${_sessionCaptures.length} recorded & encrypted locally.',
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Video Recording Stop Failed: $e'),
          ),
        );
      }
    }
  }

  void _navigateToSessionReview() {
    if (_sessionCaptures.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No evidence captured yet. Shoot photos/videos to review.'),
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CaptureReviewScreen(
          selectedCase: widget.selectedCase,
          captures: List.from(_sessionCaptures),
          onCapturesUpdated: (updatedList) {
            setState(() {
              _sessionCaptures.clear();
              _sessionCaptures.addAll(updatedList);
            });
          },
        ),
      ),
    );
  }

  void _handleTapToFocus(TapDownDetails details, BoxConstraints constraints) {
    if (!_cameraService.isInitialized) return;

    final dx = details.localPosition.dx / constraints.maxWidth;
    final dy = details.localPosition.dy / constraints.maxHeight;

    _cameraService.setTapToFocus(Offset(dx, dy));

    setState(() {
      _focusTapPosition = details.localPosition;
    });

    _focusRingTimer?.cancel();
    _focusRingTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _focusTapPosition = null;
        });
      }
    });
  }

  IconData _getFlashIcon(FlashMode mode) {
    switch (mode) {
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      case FlashMode.torch:
        return Icons.highlight;
      case FlashMode.off:
        return Icons.flash_off;
    }
  }

  String _formatTimer(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final hasCaptures = _sessionCaptures.isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Camera Preview View
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
              LayoutBuilder(
                builder: (context, constraints) {
                  return GestureDetector(
                    onTapDown: (details) => _handleTapToFocus(details, constraints),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: AspectRatio(
                            aspectRatio: _cameraService.controller!.value.aspectRatio,
                            child: CameraPreview(_cameraService.controller!),
                          ),
                        ),

                        // Focus Ring Indicator
                        if (_focusTapPosition != null)
                          Positioned(
                            left: _focusTapPosition!.dx - 28,
                            top: _focusTapPosition!.dy - 28,
                            child: Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF38BDF8),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),

            // Task 7: Background Upload Progress Bar Overlay
            const UploadProgressOverlay(),

            // Top Header Bar
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                    const SizedBox(width: 4),
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
                                : 'Rapid Field Evidence',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Task 10 Controls: Flash & Exposure & Switch Camera
                    IconButton(
                      icon: Icon(_getFlashIcon(_cameraService.currentFlashMode),
                          color: _cameraService.currentFlashMode != FlashMode.off
                              ? const Color(0xFFF59E0B)
                              : Colors.white),
                      onPressed: () async {
                        await _cameraService.toggleFlashMode();
                        setState(() {});
                      },
                      tooltip: 'Flash Mode',
                    ),
                    IconButton(
                      icon: Icon(Icons.tune,
                          color: _showExposureSlider
                              ? const Color(0xFF38BDF8)
                              : Colors.white),
                      onPressed: () {
                        setState(() {
                          _showExposureSlider = !_showExposureSlider;
                        });
                      },
                      tooltip: 'Exposure Control',
                    ),
                    IconButton(
                      icon: const Icon(Icons.cameraswitch_outlined,
                          color: Colors.white),
                      onPressed: () async {
                        await _cameraService.switchCamera();
                        setState(() {});
                      },
                      tooltip: 'Switch Camera',
                    ),
                  ],
                ),
              ),
            ),

            // Video Recording Timer Indicator
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

            // Task 10: Exposure Slider Overlay
            if (_showExposureSlider && _cameraService.isInitialized)
              Positioned(
                right: 16,
                top: 140,
                bottom: 180,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: RotatedBox(
                    quarterTurns: 3,
                    child: Slider(
                      value: _cameraService.currentExposureOffset,
                      min: _cameraService.minExposureOffset,
                      max: _cameraService.maxExposureOffset,
                      activeColor: const Color(0xFF38BDF8),
                      inactiveColor: Colors.white24,
                      onChanged: (val) async {
                        await _cameraService.setExposureOffset(val);
                        setState(() {});
                      },
                    ),
                  ),
                ),
              ),

            // Bottom Controls Bar (Zoom, Photo/Video Mode, Capture Button, Session Review)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  // Task 10: Zoom Level Controls (1x, 2x, 5x)
                  if (!_cameraService.isRecordingVideo && _cameraService.isInitialized)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [1.0, 2.0, 5.0].map((zoomVal) {
                          final isSel = (_cameraService.currentZoomLevel - zoomVal).abs() < 0.2;
                          return GestureDetector(
                            onTap: () async {
                              await _cameraService.setZoomLevel(zoomVal);
                              setState(() {});
                            },
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isSel ? const Color(0xFF38BDF8) : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${zoomVal.toInt()}x',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isSel ? Colors.black : Colors.white,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  // Mode Selector: PHOTO / VIDEO
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
                  const SizedBox(height: 16),

                  // Capture Action Row with Session Review Button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Left spacer or counter
                        const SizedBox(width: 56),

                        // Center Shutter Button
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

                        // Task 6: Session Review Badge Button
                        GestureDetector(
                          onTap: _navigateToSessionReview,
                          child: Stack(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: hasCaptures
                                      ? const Color(0xFF2563EB)
                                      : Colors.white12,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: hasCaptures
                                        ? const Color(0xFF38BDF8)
                                        : Colors.white30,
                                    width: 2,
                                  ),
                                ),
                                child: Icon(
                                  Icons.collections_outlined,
                                  color: hasCaptures ? Colors.white : Colors.white38,
                                  size: 24,
                                ),
                              ),
                              if (hasCaptures)
                                Positioned(
                                  right: 0,
                                  top: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFDC2626),
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 20,
                                      minHeight: 20,
                                    ),
                                    child: Text(
                                      '${_sessionCaptures.length}',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
