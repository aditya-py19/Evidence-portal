import 'dart:io';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import '../widgets/status_badge.dart';
import 'processing_screen.dart';

class CaptureReviewScreen extends StatefulWidget {
  final CaseModel? selectedCase;
  final EvidenceCaptureModel capture;

  const CaptureReviewScreen({
    Key? key,
    this.selectedCase,
    required this.capture,
  }) : super(key: key);

  @override
  State<CaptureReviewScreen> createState() => _CaptureReviewScreenState();
}

class _CaptureReviewScreenState extends State<CaptureReviewScreen> {
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _retake() {
    Navigator.pop(context);
  }

  void _submit() {
    widget.capture.evidenceNote = _noteController.text.trim();

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ProcessingScreen(
          selectedCase: widget.selectedCase,
          capture: widget.capture,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isVideo = widget.capture.captureMode == 'VIDEO';
    final fileSizeMb = (widget.capture.fileSize / (1024 * 1024)).toStringAsFixed(2);
    final caseIdText = widget.selectedCase != null ? widget.selectedCase!.caseId : 'Unassigned / Rapid Capture';
    final firText = widget.selectedCase != null ? widget.selectedCase!.firNumber : 'Pending Case Assignment';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'REVIEW ORIGINAL CAPTURE',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                  child: isVideo
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.play_circle_fill,
                                  size: 56, color: Colors.white),
                              const SizedBox(height: 8),
                              Text(
                                'Recorded Video (${widget.capture.captureDuration ?? 0} sec)',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 12),
                              ),
                            ],
                          ),
                        )
                      : Image.file(
                          File(widget.capture.filePath),
                          fit: BoxFit.cover,
                        ),
                ),
              ),
              const SizedBox(height: 20),

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
                        StatusBadge.verified('ORIGINAL CAPTURE SEALED'),
                        Text(
                          '${widget.capture.captureMode} • $fileSizeMb MB',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Case ID & FIR
                    _buildMetaRow('Case ID', caseIdText),
                    _buildMetaRow('FIR / Case Status', firText),
                    _buildMetaRow('Captured At',
                        widget.capture.capturedAt.toIso8601String().substring(0, 19).replaceAll('T', ' ')),

                    const Divider(height: 20),

                    // SHA-256 Seal Hash
                    const Text(
                      'Client SHA-256 Checksum (Pre-Upload Seal):',
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
                        widget.capture.clientSha256,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Geolocation Metadata
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 16, color: Color(0xFF0284C7)),
                        const SizedBox(width: 6),
                        Text(
                          'Location Metadata: ${widget.capture.locationStatus}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0369A1),
                          ),
                        ),
                        if (widget.capture.videoGpsTrail.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            '(${widget.capture.videoGpsTrail.length} Points Trail)',
                            style: const TextStyle(
                                fontSize: 10, color: Color(0xFF64748B)),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Optional Evidence Note Input
              const Text(
                'Evidence Note (Optional)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _noteController,
                maxLength: 2000,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText:
                      'Add collection details, observations, source information, or context about this evidence...',
                  border: OutlineInputBorder(),
                  fillColor: Colors.white,
                  filled: true,
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons: RETAKE or SUBMIT
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: _retake,
                        icon: const Icon(Icons.refresh, color: Color(0xFF475569)),
                        label: const Text('RETAKE',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF475569))),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _submit,
                        icon: const Icon(Icons.shield_outlined, size: 18),
                        label: const Text('SUBMIT ORIGINAL',
                            style: TextStyle(
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
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          Text(value,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}
