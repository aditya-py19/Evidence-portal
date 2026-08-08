import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../models/capture_metadata_model.dart';

class MetadataService {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  static Future<CaptureMetadataModel> collectMetadata({
    required String cameraResolution,
    required String flashStatus,
    required String captureMode,
  }) async {
    String deviceModel = 'Unknown Device';
    String androidVersion = 'Unknown OS';
    String osVersion = Platform.operatingSystem;
    String appVersion = '1.0.0+1';

    try {
      final packageInfo = await PackageInfo.fromPlatform();
      appVersion = '${packageInfo.version}+${packageInfo.buildNumber}';
    } catch (_) {}

    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        deviceModel = '${androidInfo.manufacturer} ${androidInfo.model}';
        androidVersion = 'Android ${androidInfo.version.release} (SDK ${androidInfo.version.sdkInt})';
        osVersion = androidVersion;
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        deviceModel = iosInfo.name;
        androidVersion = 'iOS ${iosInfo.systemVersion}';
        osVersion = androidVersion;
      } else {
        deviceModel = Platform.operatingSystem;
      }
    } catch (_) {}

    final now = DateTime.now();
    final tzOffset = now.timeZoneOffset;
    final hours = tzOffset.inHours.abs().toString().padLeft(2, '0');
    final minutes = (tzOffset.inMinutes.abs() % 60).toString().padLeft(2, '0');
    final sign = tzOffset.isNegative ? '-' : '+';
    final timezoneStr = '${now.timeZoneName} (UTC$sign$hours:$minutes)';

    return CaptureMetadataModel(
      deviceModel: deviceModel,
      androidVersion: androidVersion,
      osVersion: osVersion,
      appVersion: appVersion,
      cameraResolution: cameraResolution,
      flashStatus: flashStatus,
      captureMode: captureMode,
      timezone: timezoneStr,
    );
  }
}
