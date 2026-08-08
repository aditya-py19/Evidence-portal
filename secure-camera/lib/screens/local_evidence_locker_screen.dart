import 'dart:io';
import 'package:flutter/material.dart';
import '../models/case_model.dart';
import '../models/evidence_capture_model.dart';
import '../services/api_service.dart';
import '../services/encryption_service.dart';
import '../services/locker_storage_service.dart';
import '../services/upload_manager.dart';
import '../widgets/status_badge.dart';

class LocalEvidenceLockerScreen extends StatefulWidget {
  const LocalEvidenceLockerScreen({Key? key}) : super(key: key);

  @override
  State<LocalEvidenceLockerScreen> createState() =>
      _LocalEvidenceLockerScreenState();
}

class _LocalEvidenceLockerScreenState
    extends State<LocalEvidenceLockerScreen> {
  final LockerStorageService _lockerService = LockerStorageService();
  final ApiService _apiService = ApiService();
  final UploadManager _uploadManager = UploadManager();

  List<EvidenceCaptureModel> _lockerItems = [];
  final Map<int, String> _previewCache = {};
  final Set<String> _selectedIds = {};
  bool _isLoading = true;
  bool _isUploading = false;
  String _uploadStatusMessage = '';
  List<CaseModel> _availableCases = [];

  @override
  void initState() {
    super.initState();
    _loadLockerData();
  }

  Future<void> _loadLockerData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final items = await _lockerService.getLockerItems();
      final cases = await _apiService.fetchAssignedCases().catchError((_) => <CaseModel>[]);

      _lockerItems = items;
      _availableCases = cases;

      // Prepare preview decrypt cache for thumbnails
      for (int i = 0; i < items.length; i++) {
        final item = items[i];
        if (item.encryptedFilePath != null &&
            File(item.encryptedFilePath!).existsSync()) {
          try {
            final tempDec = await EncryptionService.decryptToTempFile(
                item.encryptedFilePath!);
            _previewCache[i] = tempDec;
          } catch (e) {
            debugPrint('Locker thumbnail decrypt error item $i: $e');
          }
        } else if (File(item.filePath).existsSync()) {
          _previewCache[i] = item.filePath;
        }
      }
    } catch (e) {
      debugPrint('Error loading locker data: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    // Delete temporary preview thumbnail files on screen dispose
    for (final path in _previewCache.values) {
      EncryptionService.deleteFileSilently(path);
    }
    super.dispose();
  }

  void _toggleSelectAll() {
    setState(() {
      if (_selectedIds.length == _lockerItems.length) {
        _selectedIds.clear();
      } else {
        _selectedIds.addAll(_lockerItems.map((i) => i.id));
      }
    });
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  Future<void> _deleteSelectedItems() async {
    if (_selectedIds.isEmpty) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard Evidence Items?'),
        content: Text(
            'Are you sure you want to permanently delete ${_selectedIds.length} offline evidence capture(s)? Encrypted local files will be shredded.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('DELETE EVIDENCE'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      for (final id in _selectedIds) {
        await _lockerService.deleteLockerItem(id);
      }
      _selectedIds.clear();
      await _loadLockerData();
    }
  }

  Future<void> _openAssignCaseModal() async {
    if (_selectedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one evidence item first.')),
      );
      return;
    }

    if (_availableCases.isEmpty) {
      try {
        _availableCases = await _apiService.fetchAssignedCases();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load cases: $e')),
        );
        return;
      }
    }

    if (_availableCases.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No active investigation cases assigned to your account.')),
      );
      return;
    }

    CaseModel? selectedCase = _availableCases.first;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Assign Case to Selected Evidence',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Assigning ${_selectedIds.length} item(s) to an active case before ledger upload.',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CaseModel>(
                    initialValue: selectedCase,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: 'Select Investigation Case',
                    ),
                    items: _availableCases.map((c) {
                      return DropdownMenuItem<CaseModel>(
                        value: c,
                        child: Text('${c.caseId} • ${c.title}',
                            overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() {
                          selectedCase = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        if (selectedCase != null) {
                          await _lockerService.assignCaseToItems(
                            _selectedIds.toList(),
                            selectedCase!.caseId,
                            selectedCase!.title,
                          );
                          Navigator.pop(context);
                          await _loadLockerData();
                        }
                      },
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('CONFIRM CASE ASSIGNMENT'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _uploadSelectedItems() async {
    if (_selectedIds.isEmpty) return;

    final selectedItems =
        _lockerItems.where((i) => _selectedIds.contains(i.id)).toList();

    setState(() {
      _isUploading = true;
      _uploadStatusMessage = 'Starting evidence locker upload...';
    });

    int successCount = 0;
    int failCount = 0;

    for (int i = 0; i < selectedItems.length; i++) {
      final item = selectedItems[i];
      final itemNum = i + 1;

      setState(() {
        _uploadStatusMessage =
            'Uploading item $itemNum of ${selectedItems.length}... (${item.fileName})';
      });

      CaseModel? assignedCase;
      if (item.assignedCaseId != null && item.assignedCaseId!.isNotEmpty) {
        assignedCase = _availableCases.firstWhere(
          (c) => c.caseId == item.assignedCaseId,
          orElse: () => CaseModel(
            id: item.assignedCaseId!,
            caseId: item.assignedCaseId!,
            title: item.assignedCaseTitle ?? 'Assigned Case',
            firNumber: 'FIR-2026-OFFLINE',
            crimeType: 'General Cyber Crime',
            status: 'under_investigation',
            evidenceCount: 1,
          ),
        );
      }

      try {
        await _uploadManager.uploadSingleCapture(
          selectedCase: assignedCase,
          capture: item,
        );

        // HTTP 200 Success: remove from local locker
        await _lockerService.markUploaded(item.id);
        _selectedIds.remove(item.id);
        successCount++;
      } catch (e) {
        debugPrint('Failed to upload locker item ${item.id}: $e');
        failCount++;
      }
    }

    setState(() {
      _isUploading = false;
    });

    await _loadLockerData();

    if (mounted) {
      if (failCount == 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Successfully uploaded $successCount evidence item(s) to ledger!'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Uploaded $successCount item(s). $failCount item(s) failed and remain encrypted in locker for retry.'),
            backgroundColor: const Color(0xFFD97706),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'LOCAL EVIDENCE LOCKER',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            Text(
              '${_lockerItems.length} Offline Encrypted Evidence Item(s)',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
            onPressed: _loadLockerData,
            tooltip: 'Refresh Locker',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _lockerItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.lock_clock_outlined,
                              size: 56, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Evidence Locker Empty',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Rapid captures taken without immediate case assignment\nwill be stored here securely encrypted.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      // Selection Control Header
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                        color: Colors.white,
                        child: Row(
                          children: [
                            Checkbox(
                              value: _selectedIds.length == _lockerItems.length &&
                                  _lockerItems.isNotEmpty,
                              onChanged: (_) => _toggleSelectAll(),
                            ),
                            Text(
                              _selectedIds.isEmpty
                                  ? 'Select All (${_lockerItems.length})'
                                  : '${_selectedIds.length} Selected',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const Spacer(),
                            if (_selectedIds.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.delete_outline,
                                    color: Color(0xFFDC2626)),
                                onPressed: _deleteSelectedItems,
                                tooltip: 'Delete Selected',
                              ),
                          ],
                        ),
                      ),

                      if (_isUploading)
                        Container(
                          padding: const EdgeInsets.all(12),
                          color: const Color(0xFFEFF6FF),
                          child: Row(
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Color(0xFF2563EB)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _uploadStatusMessage,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E40AF),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Locker Item Cards List
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _lockerItems.length,
                          itemBuilder: (context, index) {
                            final item = _lockerItems[index];
                            final isSelected = _selectedIds.contains(item.id);
                            final previewPath = _previewCache[index];
                            final isVideo = item.captureMode == 'VIDEO';
                            final fileSizeMb = (item.fileSize / (1024 * 1024))
                                .toStringAsFixed(2);
                            final assignedText = item.assignedCaseId != null
                                ? 'Case: ${item.assignedCaseId}'
                                : 'Unassigned Rapid Capture';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF2563EB)
                                      : const Color(0xFFE2E8F0),
                                  width: isSelected ? 2 : 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: InkWell(
                                onTap: () => _toggleSelection(item.id),
                                borderRadius: BorderRadius.circular(14),
                                child: Padding(
                                  padding: const EdgeInsets.all(14.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Checkbox(
                                            value: isSelected,
                                            onChanged: (_) =>
                                                _toggleSelection(item.id),
                                          ),

                                          // Thumbnail Container
                                          Container(
                                            width: 72,
                                            height: 72,
                                            decoration: BoxDecoration(
                                              color: Colors.black,
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                              border: Border.all(
                                                  color: const Color(0xFFCBD5E1)),
                                            ),
                                            child: ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                              child: previewPath != null &&
                                                      File(previewPath).existsSync()
                                                  ? (isVideo
                                                      ? const Center(
                                                          child: Icon(
                                                            Icons.play_circle_fill,
                                                            size: 36,
                                                            color: Color(0xFF38BDF8),
                                                          ),
                                                        )
                                                      : Image.file(
                                                          File(previewPath),
                                                          fit: BoxFit.cover,
                                                        ))
                                                  : const Center(
                                                      child: Icon(
                                                        Icons.lock,
                                                        size: 28,
                                                        color: Color(0xFF38BDF8),
                                                      ),
                                                    ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),

                                          // Details Column
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    StatusBadge.verified(
                                                        'AES-256 LOCKER'),
                                                    const Spacer(),
                                                    Text(
                                                      '${item.captureMode} • $fileSizeMb MB',
                                                      style: const TextStyle(
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  item.fileName,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF0F172A),
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  assignedText,
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                    color: item.assignedCaseId !=
                                                            null
                                                        ? const Color(0xFF0284C7)
                                                        : const Color(0xFFD97706),
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  item.capturedAt
                                                      .toIso8601String()
                                                      .substring(0, 19)
                                                      .replaceAll('T', ' '),
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    color: Color(0xFF64748B),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Divider(height: 20),

                                      // SHA-256 & Location info
                                      Text(
                                        'Client SHA-256: ${item.clientSha256}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 10,
                                          color: Color(0xFF334155),
                                        ),
                                      ),
                                      if (item.photoGps != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          'GPS: ${item.photoGps!.latitude.toStringAsFixed(4)}, ${item.photoGps!.longitude.toStringAsFixed(4)} (±${item.photoGps!.accuracy.toStringAsFixed(1)}m)',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF0369A1),
                                          ),
                                        ),
                                      ],
                                      if (item.evidenceNote != null &&
                                          item.evidenceNote!.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          'Note: ${item.evidenceNote}',
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFF475569)),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      // Bottom Action Bar
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, -4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 48,
                                child: OutlinedButton.icon(
                                  onPressed: _openAssignCaseModal,
                                  icon: const Icon(Icons.folder_shared_outlined,
                                      size: 18),
                                  label: const Text(
                                    'ASSIGN CASE',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(
                                        color: Color(0xFFCBD5E1)),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: SizedBox(
                                height: 48,
                                child: ElevatedButton.icon(
                                  onPressed: _isUploading || _selectedIds.isEmpty
                                      ? null
                                      : _uploadSelectedItems,
                                  icon: const Icon(Icons.cloud_upload_outlined,
                                      size: 18),
                                  label: Text(
                                    _selectedIds.isNotEmpty
                                        ? 'UPLOAD (${_selectedIds.length})'
                                        : 'UPLOAD SELECTED',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F172A),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
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
