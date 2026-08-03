import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class DeviceLocationDataSource {
  final Geocoding _geocoder;

  DeviceLocationDataSource({Geocoding? geocoder})
    : _geocoder = geocoder ?? Geocoding();

  Future<LatLng?> currentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      return LatLng(position.latitude, position.longitude);
    } catch (_) {
      final last = await Geolocator.getLastKnownPosition();
      return last == null ? null : LatLng(last.latitude, last.longitude);
    }
  }

  Future<String?> reverseGeocode(LatLng point) async {
    final placemarks = await _geocoder.placemarkFromCoordinates(
      point.latitude,
      point.longitude,
    );
    if (placemarks.isEmpty) return null;

    final placemark = placemarks.first;
    final parts = <String>{};
    for (final part in [
      placemark.street,
      placemark.subLocality,
      placemark.locality,
    ]) {
      if (part != null && part.trim().isNotEmpty) parts.add(part.trim());
    }
    return parts.isEmpty ? null : parts.join(', ');
  }
}
