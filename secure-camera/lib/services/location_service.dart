import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../models/location_point_model.dart';

class LocationService {
  StreamSubscription<Position>? _positionStreamSub;
  final List<LocationPointModel> _locationTrail = [];

  Future<bool> checkPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  Future<LocationPointModel?> getCurrentLocation() async {
    try {
      final hasPerm = await checkPermission();
      if (!hasPerm) return null;

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return LocationPointModel(
        timestamp: pos.timestamp,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      );
    } catch (e) {
      return null;
    }
  }

  void startTrailRecording() {
    _locationTrail.clear();
    final locationSettings = const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // Sample every 5 meters or interval
    );

    _positionStreamSub = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position pos) {
      _locationTrail.add(
        LocationPointModel(
          timestamp: pos.timestamp,
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
        ),
      );
    });
  }

  List<LocationPointModel> stopTrailRecording() {
    _positionStreamSub?.cancel();
    _positionStreamSub = null;
    return List.from(_locationTrail);
  }
}
