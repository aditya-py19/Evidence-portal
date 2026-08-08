class CaptureMetadataModel {
  final String deviceModel;
  final String androidVersion;
  final String osVersion;
  final String appVersion;
  final String cameraResolution;
  final String flashStatus;
  final String captureMode;
  final String timezone;

  CaptureMetadataModel({
    required this.deviceModel,
    required this.androidVersion,
    required this.osVersion,
    required this.appVersion,
    required this.cameraResolution,
    required this.flashStatus,
    required this.captureMode,
    required this.timezone,
  });

  Map<String, dynamic> toJson() => {
        'deviceModel': deviceModel,
        'androidVersion': androidVersion,
        'osVersion': osVersion,
        'appVersion': appVersion,
        'cameraResolution': cameraResolution,
        'flashStatus': flashStatus,
        'captureMode': captureMode,
        'timezone': timezone,
      };

  factory CaptureMetadataModel.fromJson(Map<String, dynamic> json) {
    return CaptureMetadataModel(
      deviceModel: json['deviceModel'] ?? 'Unknown Device',
      androidVersion: json['androidVersion'] ?? 'Unknown OS',
      osVersion: json['osVersion'] ?? 'Unknown OS',
      appVersion: json['appVersion'] ?? '1.0.0',
      cameraResolution: json['cameraResolution'] ?? 'High (1080p)',
      flashStatus: json['flashStatus'] ?? 'off',
      captureMode: json['captureMode'] ?? 'PHOTO',
      timezone: json['timezone'] ?? 'UTC',
    );
  }
}
