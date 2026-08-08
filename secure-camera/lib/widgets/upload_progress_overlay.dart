import 'package:flutter/material.dart';
import '../services/upload_manager.dart';

class UploadProgressOverlay extends StatelessWidget {
  const UploadProgressOverlay({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final uploadManager = UploadManager();

    return AnimatedBuilder(
      animation: uploadManager,
      builder: (context, child) {
        final state = uploadManager.state;
        if (!state.isUploading) return const SizedBox.shrink();

        final pctStr = state.overallProgressPercentage.toStringAsFixed(0);

        return Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(12),
            color: const Color(0xFF0F172A),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2563EB)),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Color(0xFF38BDF8),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'BACKGROUND EVIDENCE UPLOAD',
                              style: TextStyle(
                                color: Color(0xFF38BDF8),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              '$pctStr%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          state.statusMessage,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: (state.overallProgressPercentage / 100).clamp(0.0, 1.0),
                            backgroundColor: Colors.white12,
                            color: const Color(0xFF2563EB),
                            minHeight: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
