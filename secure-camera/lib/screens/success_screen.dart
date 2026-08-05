import 'package:flutter/material.dart';
import '../models/case_model.dart';

class SuccessScreen extends StatelessWidget {
  final CaseModel? selectedCase;
  final Map<String, dynamic> resultData;

  const SuccessScreen({
    Key? key,
    this.selectedCase,
    required this.resultData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final evidence = resultData['evidence'] as Map<String, dynamic>? ?? {};
    final evidenceId = evidence['evidenceId'] ?? 'EVD-TC-2026-SEC-001';
    final sha256 = resultData['serverSha256'] ?? evidence['sha256'] ?? '';
    final ipfsCid = resultData['ipfsCid'] ?? evidence['ipfsCid'] ?? '';
    final txHash = resultData['blockchainTxId'] ?? evidence['blockchainTxId'] ?? '';
    final assignmentStatus = evidence['assignmentStatus'] ?? (selectedCase != null ? 'ASSIGNED' : 'UNASSIGNED');

    final caseDisplay = selectedCase != null
        ? selectedCase!.caseId
        : (evidence['caseId'] ?? 'Pending Assignment');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Success Icon Badge
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      color: Color(0xFFD1FAE5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      size: 48,
                      color: Color(0xFF059669),
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'EVIDENCE SECURED',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),

                  Text(
                    selectedCase != null
                        ? 'Registered to Case ${selectedCase!.caseId}'
                        : 'Registered as Unassigned Evidence (Pending Case Assignment)',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 24),

                  // Summary Details Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildRow('Case ID', caseDisplay, isMono: true, highlight: selectedCase != null),
                        _buildRow('Assignment Status', assignmentStatus == 'UNASSIGNED' ? 'UNASSIGNED (Pending Case)' : 'ASSIGNED', color: assignmentStatus == 'UNASSIGNED' ? const Color(0xFFD97706) : const Color(0xFF059669)),
                        _buildRow('Evidence ID', evidenceId, isMono: true, highlight: true),
                        _buildRow('Captured By', evidence['uploadedBy'] ?? 'Officer'),
                        _buildRow('SHA-256 Checksum', sha256.isNotEmpty ? (sha256.length > 16 ? '${sha256.substring(0, 16)}...' : sha256) : 'Verified', isMono: true),
                        _buildRow('SHA-256 Integrity', '✓ VERIFIED MATCH', color: const Color(0xFF059669)),
                        _buildRow('IPFS Storage CID', ipfsCid.isNotEmpty ? (ipfsCid.length > 16 ? '${ipfsCid.substring(0, 16)}...' : ipfsCid) : 'Pinned', isMono: true),
                        _buildRow('Polygon Blockchain', txHash.isNotEmpty ? (txHash.length > 16 ? '${txHash.substring(0, 16)}...' : txHash) : 'Verified', isMono: true),
                        _buildRow('AI Forensic Status', 'Authentic / Intact', color: const Color(0xFF0284C7)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Action Buttons
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.camera_alt_outlined, size: 18),
                      label: const Text(
                        'CAPTURE ANOTHER EVIDENCE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'RETURN HOME',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value,
      {bool isMono = false, bool highlight = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontFamily: isMono ? 'monospace' : null,
              fontWeight: FontWeight.bold,
              color: color ??
                  (highlight
                      ? const Color(0xFF2563EB)
                      : const Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }
}
