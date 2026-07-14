import 'dart:convert';

import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

/// Sétif city center — fallback whenever GPS is unavailable or denied.
const LatLng kSetifCenter = LatLng(36.1911, 5.4137);

class Landmark {
  final String name;
  final LatLng position;

  const Landmark(this.name, this.position);
}

/// Driving route between two points.
class TaxiRoute {
  final List<LatLng> points;
  final double distanceMeters;
  final double durationSeconds;

  const TaxiRoute({
    required this.points,
    required this.distanceMeters,
    required this.durationSeconds,
  });
}

class TaxiLocationService {
  final Geocoding _geocoder = Geocoding();

  /// Known Sétif landmarks, used as an offline fallback when the device
  /// geocoder is unavailable. Coordinates are approximate.
  static const List<Landmark> landmarks = [
    Landmark("Sétif, Algérie", kSetifCenter),
    Landmark("Avenue Mokhtar Laaribi, Sétif", LatLng(36.1960, 5.4010)),
    Landmark("Gare Routière de Sétif", LatLng(36.1770, 5.4030)),
    Landmark("Université Ferhat Abbas, El Bez, Sétif", LatLng(36.1830, 5.3610)),
    Landmark("Stade 8 Mai 1945, Sétif", LatLng(36.1786, 5.3905)),
    Landmark("Aïn Arnat, Sétif", LatLng(36.1866, 5.3126)),
    Landmark("Cité El Maabouda, Sétif", LatLng(36.2030, 5.4230)),
    Landmark("El Hidhab, Sétif", LatLng(36.2130, 5.3960)),
  ];

  /// Returns the device position, or null when location is off or denied.
  Future<LatLng?> getCurrentPosition() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      return LatLng(position.latitude, position.longitude);
    } catch (_) {
      try {
        final last = await Geolocator.getLastKnownPosition();
        if (last != null) return LatLng(last.latitude, last.longitude);
      } catch (_) {}
      return null;
    }
  }

  /// Turns coordinates into a readable address, falling back to the nearest
  /// known landmark when the device geocoder fails (e.g. offline).
  Future<String> reverseGeocode(LatLng point) async {
    try {
      final placemarks = await _geocoder.placemarkFromCoordinates(
        point.latitude,
        point.longitude,
      );
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = <String>{};
        for (final part in [p.street, p.subLocality, p.locality]) {
          if (part != null && part.trim().isNotEmpty) parts.add(part.trim());
        }
        if (parts.isNotEmpty) return parts.join(', ');
      }
    } catch (_) {}
    return _nearestLandmark(point);
  }

  String _nearestLandmark(LatLng point) {
    var closest = landmarks.first;
    var minDist = double.infinity;
    for (final landmark in landmarks) {
      final dist = Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        landmark.position.latitude,
        landmark.position.longitude,
      );
      if (dist < minDist) {
        minDist = dist;
        closest = landmark;
      }
    }
    return closest.name;
  }

  /// Fetches a driving route from the public OSRM server; falls back to a
  /// straight line so the UI keeps working offline.
  Future<TaxiRoute> fetchRoute(LatLng from, LatLng to) async {
    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/'
        '${from.longitude},${from.latitude};${to.longitude},${to.latitude}'
        '?overview=full&geometries=geojson',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final routes = data['routes'] as List<dynamic>?;
        if (data['code'] == 'Ok' && routes != null && routes.isNotEmpty) {
          final route = routes.first as Map<String, dynamic>;
          final coords = (route['geometry']['coordinates'] as List<dynamic>)
              .map(
                (c) => LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()),
              )
              .toList();
          return TaxiRoute(
            points: coords,
            distanceMeters: (route['distance'] as num).toDouble(),
            durationSeconds: (route['duration'] as num).toDouble(),
          );
        }
      }
    } catch (_) {}
    final distance = Geolocator.distanceBetween(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude,
    );
    return TaxiRoute(
      points: [from, to],
      distanceMeters: distance,
      durationSeconds: distance / 8.3, // ~30 km/h city driving estimate
    );
  }
}
