import 'dart:io';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import '../services/encryption_service.dart';
import '../services/locker_storage_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/upload_progress_overlay.dart';
import 'processing_screen.dart';

class CaptureReviewScreen extends StatefulWidget {
  final CaseModel? selectedCase;
  final EvidenceCaptureModel? capture;
  final List<EvidenceCaptureModel>? captures;
  final void Function(List<EvidenceCaptureModel> updatedCaptures)? onCapturesUpdated;

  const CaptureReviewScreen({
    Key? key,
    this.selectedCase,
    this.capture,
    this.captures,
    this.onCapturesUpdated,
  }) : super(key: key);

  @override
  State<CaptureReviewScreen> createState() => _CaptureReviewScreenState();
}

class _CaptureReviewScreenState extends State<CaptureReviewScreen> {
  late List<EvidenceCaptureModel> _items;
  int _currentIndex = 0;
  final Map<int, TextEditingController> _noteControllers = {};
  final Map<int, String> _previewPaths = {};
  bool _isLoadingPreviews = true;

  @override
  void initState() {
    super.initState();
    if (widget.captures != null && widget.captures!.isNotEmpty) {
      _items = List.from(widget.captures!);
    } else if (widget.capture != null) {
      _items = [widget.capture!];
    } else {
      _items = [];
    }

    for (int i = 0; i < _items.length; i++) {
      _noteControllers[i] = TextEditingController(text: _items[i].evidenceNote ?? '');
    }

    _preparePreviews();
  }

  Future<void> _preparePreviews() async {
    for (int i = 0; i < _items.length; i++) {
      final item = _items[i];
      if (item.encryptedFilePath != null && item.encryptedFilePath!.isNotEmpty) {
        try {
          final tempDec = await EncryptionService.decryptToTempFile(item.encryptedFilePath!);
          item.filePath = tempDec;
          if (mounted) {
            setState(() {
              _previewPaths[i] = tempDec;
            });
          }
        } catch (e) {
          debugPrint('Error preparing preview for item $i: $e');
        }
      } else if (File(item.filePath).existsSync()) {
        _previewPaths[i] = item.filePath;
      }
    }

    if (mounted) {
      setState(() {
        _isLoadingPreviews = false;
      });
    }
  }

  @override
  void dispose() {
    for (final c in _noteControllers.values) {
      c.dispose();
    }
    // Preview cache is preserved until upload completes or evidence is discarded
    super.dispose();
  }

  void _removeItem(int index) {
    final path = _previewPaths.remove(index);
    if (path != null) {
      EncryptionService.deleteFileSilently(path);
    }
    if (index < _items.length) {
      final item = _items[index];
      if (item.encryptedFilePath != null) {
        EncryptionService.deleteFileSilently(item.encryptedFilePath);
      }
      if (item.filePath.isNotEmpty) {
        EncryptionService.deleteFileSilently(item.filePath);
      }
    }

    if (_items.length <= 1) {
      Navigator.pop(context);
      return;
    }

    setState(() {
      _items.removeAt(index);
      if (_currentIndex >= _items.length) {
        _currentIndex = _items.length - 1;
      }
    });

    widget.onCapturesUpdated?.call(_items);
  }

  void _submitAll() {
    // Save notes
    for (int i = 0; i < _items.length; i++) {
      final ctrl = _noteControllers[i];
      if (ctrl != null) {
        _items[i].evidenceNote = ctrl.text.trim();
      }
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ProcessingScreen(
          selectedCase: widget.selectedCase,
          captures: _items,
        ),
      ),
    );
  }

  Future<void> _saveToLocker() async {
    for (int i = 0; i < _items.length; i++) {
      final ctrl = _noteControllers[i];
      if (ctrl != null) {
        _items[i].evidenceNote = ctrl.text.trim();
      }
    }

    final lockerService = LockerStorageService();
    await lockerService.saveBatchToLocker(_items);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Saved ${_items.length} capture(s) to Local Evidence Locker!'),
        backgroundColor: const Color(0xFF0284C7),
      ),
    );
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Review Captures')),
        body: const Center(child: Text('No evidence captures in session.')),
      );
    }

    final currentCapture = _items[_currentIndex];
    final isVideo = currentCapture.captureMode == 'VIDEO';
    final fileSizeMb = (currentCapture.fileSize / (1024 * 1024)).toStringAsFixed(2);
    final caseIdText = widget.selectedCase != null ? widget.selectedCase!.caseId : 'Unassigned / Rapid Capture';
    final firText = widget.selectedCase != null ? widget.selectedCase!.firNumber : 'Pending Case Assignment';
    final previewPath = _previewPaths[_currentIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _items.length > 1
              ? 'REVIEW SESSION BATCH (${_currentIndex + 1}/${_items.length})'
              : 'REVIEW ORIGINAL CAPTURE',
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 13,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        actions: [
          if (_items.length > 1)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
              onPressed: () => _removeItem(_currentIndex),
              tooltip: 'Remove Capture from Session',
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Session Pagination Selector Tabs
                  if (_items.length > 1) ...[
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final isSel = idx == _currentIndex;
                          return ChoiceChip(
                            label: Text('Item #${idx + 1} (${_items[idx].captureMode})'),
                            selected: isSel,
                            selectedColor: const Color(0xFF0F172A),
                            labelStyle: TextStyle(
                              color: isSel ? Colors.white : const Color(0xFF475569),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                            onSelected: (_) {
                              setState(() {
                                _currentIndex = idx;
                              });
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Media Preview Card
                  Container(
                    width: double.infinity,
                    height: 240,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: previewPath != null && File(previewPath).existsSync()
                          ? (isVideo
                              ? Container(
                                  color: const Color(0xFF0F172A),
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.play_circle_fill,
                                            size: 64, color: Color(0xFF38BDF8)),
                                        const SizedBox(height: 10),
                                        Text(
                                          'Recorded Video Preview (${currentCapture.captureDuration ?? 0} sec)',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Decrypted preview file ready • $fileSizeMb MB',
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : Image.file(
                                  File(previewPath),
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => const Center(
                                    child: Icon(Icons.broken_image, size: 48, color: Colors.white70),
                                  ),
                                ))
                          : Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 28,
                                    height: 28,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Color(0xFF38BDF8),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _isLoadingPreviews
                                        ? 'Decrypting temporary preview cache...'
                                        : 'AES-256 Encrypted Local Evidence',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Capture Seals & Metadata Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            StatusBadge.verified('AES-256 SEALED & ENCRYPTED'),
                            Text(
                              '${currentCapture.captureMode} • $fileSizeMb MB',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        _buildMetaRow('Case ID', caseIdText),
                        _buildMetaRow('FIR / Case Status', firText),
                        _buildMetaRow(
                          'Captured At',
                          currentCapture.capturedAt
                              .toIso8601String()
                              .substring(0, 19)
                              .replaceAll('T', ' '),
                        ),

                        const Divider(height: 20),

                        // SHA-256 Seal Hash
                        const Text(
                          'Client SHA-256 Checksum (Original Seal):',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155)),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            currentCapture.clientSha256,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: Color(0xFF0F172A),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // GPS Metadata (Task 8)
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined,
                                size: 16, color: Color(0xFF0284C7)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                currentCapture.photoGps != null
                                    ? 'GPS: ${currentCapture.photoGps!.latitude.toStringAsFixed(5)}, ${currentCapture.photoGps!.longitude.toStringAsFixed(5)} (±${currentCapture.photoGps!.accuracy.toStringAsFixed(1)}m)'
                                    : 'Location Status: ${currentCapture.locationStatus}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0369A1),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (currentCapture.videoGpsTrail.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Recorded GPS Trail: ${currentCapture.videoGpsTrail.length} location points captured during recording.',
                            style: const TextStyle(
                                fontSize: 10, color: Color(0xFF64748B)),
                          ),
                        ],

                        const Divider(height: 20),

                        // Task 9: Rich System Metadata Overview
                        const Text(
                          'Passport Hardware & Environment Metadata:',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155)),
                        ),
                        const SizedBox(height: 6),
                        _buildMetaRow('Device Model', currentCapture.metadata.deviceModel),
                        _buildMetaRow('Android / OS Version', currentCapture.metadata.androidVersion),
                        _buildMetaRow('App Version', currentCapture.metadata.appVersion),
                        _buildMetaRow('Flash State', currentCapture.metadata.flashStatus),
                        _buildMetaRow('Timezone', currentCapture.metadata.timezone),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Evidence Note Input
                  Text(
                    'Evidence Note (Item #${_currentIndex + 1})',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _noteControllers[_currentIndex],
                    maxLength: 2000,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText:
                          'Add collection details, observations, or context for this evidence...',
                      border: OutlineInputBorder(),
                      fillColor: Colors.white,
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons: ADD MORE / SAVE LOCKER / SUBMIT
                  Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 44,
                              child: OutlinedButton.icon(
                                onPressed: () => Navigator.pop(context),
                                icon: const Icon(Icons.add_a_photo_outlined,
                                    color: Color(0xFF0F172A), size: 16),
                                label: const Text('ADD MORE',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0F172A),
                                        fontSize: 11)),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: SizedBox(
                              height: 44,
                              child: OutlinedButton.icon(
                                onPressed: _saveToLocker,
                                icon: const Icon(Icons.lock_clock_outlined,
                                    color: Color(0xFF0284C7), size: 16),
                                label: const Text('SAVE LOCKER',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0284C7),
                                        fontSize: 11)),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Color(0xFF0284C7)),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _submitAll,
                          icon: const Icon(Icons.shield_outlined, size: 18),
                          label: Text(
                              _items.length > 1
                                  ? 'UPLOAD ALL NOW (${_items.length})'
                                  : 'UPLOAD EVIDENCE NOW',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  letterSpacing: 0.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Background Upload Overlay
            const UploadProgressOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
