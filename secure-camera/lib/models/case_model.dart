class CaseModel {
  final String id;
  final String caseId;
  final String title;
  final String firNumber;
  final String crimeType;
  final String status;
  final int evidenceCount;

  CaseModel({
    required this.id,
    required this.caseId,
    required this.title,
    required this.firNumber,
    required this.crimeType,
    required this.status,
    required this.evidenceCount,
  });

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    return CaseModel(
      id: json['id'] ?? '',
      caseId: json['caseId'] ?? '',
      title: json['title'] ?? '',
      firNumber: json['firNumber'] ?? 'FIR-2026-0000',
      crimeType: json['crimeType'] ?? 'General Cyber Crime',
      status: json['status'] ?? 'active',
      evidenceCount: json['evidenceCount'] ?? 0,
    );
  }
}
