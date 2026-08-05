import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import '../services/api_service.dart';
import 'success_screen.dart';

class ProcessingScreen extends StatefulWidget {
  final CaseModel? selectedCase;
  final EvidenceCaptureModel capture;

  const ProcessingScreen({
    Key? key,
    this.selectedCase,
    required this.capture,
  }) : super(key: key);

  @override
  State<ProcessingScreen> createState() => _ProcessingScreenState();
}

class _ProcessingScreenState extends State<ProcessingScreen> {
  final ApiService _apiService = ApiService();

  int _currentStep = 0;
  String? _errorMessage;
  Map<String, dynamic>? _resultData;

  final List<String> _stages = [
    'Uploading Original Capture Payload',
    'Verifying Dual SHA-256 Checksum Integrity',
    'Registering Evidence Record in Forensic Ledger',
    'Securing Decentralized IPFS Storage',
    'Running Sightengine AI Forensic Analysis',
    'Signing Polygon Amoy Blockchain Contract',
    'Finalizing Evidence Passport & Chain of Custody',
  ];

  @override
  void initState() {
    super.initState();
    _startRegistration();
  }

  Future<void> _startRegistration() async {
    try {
      setState(() => _currentStep = 0);

      final result = await _apiService.submitSecureCapture(
        caseId: widget.selectedCase?.caseId,
        capture: widget.capture,
      );

      for (int i = 1; i < _stages.length; i++) {
        await Future.delayed(const Duration(milliseconds: 400));
        if (mounted) {
          setState(() => _currentStep = i);
        }
      }

      _resultData = result;

      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => SuccessScreen(
            selectedCase: widget.selectedCase,
            resultData: _resultData!,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: _errorMessage != null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          color: Color(0xFFFEF2F2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.error_outline,
                            size: 48, color: Color(0xFFDC2626)),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Secure Registration Failed',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF991B1B)),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _errorMessage = null;
                          });
                          _startRegistration();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('RETRY SECURE UPLOAD'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 56,
                        height: 56,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 24),

                      const Text(
                        'SECURING EVIDENCE RECORD',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 6),

                      Text(
                        widget.selectedCase != null
                            ? 'Case ${widget.selectedCase!.caseId}'
                            : 'Unassigned Rapid Field Evidence',
                        style: const TextStyle(
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: Color(0xFF2563EB)),
                      ),
                      const SizedBox(height: 32),

                      // Stages List Progress
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: List.generate(_stages.length, (index) {
                            final isDone = index < _currentStep;
                            final isCurrent = index == _currentStep;

                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0),
                              child: Row(
                                children: [
                                  if (isDone)
                                    const Icon(Icons.check_circle,
                                        size: 18, color: Color(0xFF059669))
                                  else if (isCurrent)
                                    const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Color(0xFF0F172A)),
                                    )
                                  else
                                    const Icon(Icons.radio_button_unchecked,
                                        size: 18, color: Color(0xFFCBD5E1)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _stages[index],
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: isCurrent || isDone
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                        color: isDone
                                            ? const Color(0xFF059669)
                                            : isCurrent
                                                ? const Color(0xFF0F172A)
                                                : const Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
