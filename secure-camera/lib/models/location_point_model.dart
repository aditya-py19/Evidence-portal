class LocationPointModel {
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double accuracy;

  LocationPointModel({
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
  });

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
      };

  factory LocationPointModel.fromJson(Map<String, dynamic> json) {
    return LocationPointModel(
      timestamp: DateTime.parse(json['timestamp']),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num).toDouble(),
    );
  }
}
