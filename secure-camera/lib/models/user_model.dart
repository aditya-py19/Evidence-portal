class UserModel {
  final String id;
  final String email;
  final String username;
  final String name;
  final String role;
  final String department;
  final String badgeNumber;

  UserModel({
    required this.id,
    required this.email,
    required this.username,
    required this.name,
    required this.role,
    required this.department,
    required this.badgeNumber,
  });

  bool get isOfficer =>
      role == 'police_officer' ||
      role == 'investigating_officer' ||
      role == 'forensic_expert';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      department: json['department'] ?? '',
      badgeNumber: json['badgeNumber'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'name': name,
        'role': role,
        'department': department,
        'badgeNumber': badgeNumber,
      };
}
