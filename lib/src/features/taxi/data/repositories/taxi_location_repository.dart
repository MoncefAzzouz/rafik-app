import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../domain/taxi_location.dart';
import '../datasources/device_location_data_source.dart';
import '../datasources/routing_data_source.dart';

class TaxiLocationRepository {
  final DeviceLocationDataSource _deviceLocation;
  final RoutingDataSource _routing;

  TaxiLocationRepository({
    DeviceLocationDataSource? deviceLocation,
    RoutingDataSource? routing,
  }) : _deviceLocation = deviceLocation ?? DeviceLocationDataSource(),
       _routing = routing ?? RoutingDataSource();

  static const landmarks = <Landmark>[
    Landmark('Sétif, Algérie', kSetifCenter),
    Landmark('Avenue Mokhtar Laaribi, Sétif', LatLng(36.1960, 5.4010)),
    Landmark('Gare Routière de Sétif', LatLng(36.1770, 5.4030)),
    Landmark('Université Ferhat Abbas, El Bez, Sétif', LatLng(36.1830, 5.3610)),
    Landmark('Stade 8 Mai 1945, Sétif', LatLng(36.1786, 5.3905)),
    Landmark('Aïn Arnat, Sétif', LatLng(36.1866, 5.3126)),
    Landmark('Cité El Maabouda, Sétif', LatLng(36.2030, 5.4230)),
    Landmark('El Hidhab, Sétif', LatLng(36.2130, 5.3960)),
  ];

  Future<LatLng?> getCurrentPosition() async {
    try {
      return await _deviceLocation.currentPosition();
    } catch (_) {
      return null;
    }
  }

  Future<String> reverseGeocode(LatLng point) async {
    try {
      final address = await _deviceLocation.reverseGeocode(point);
      if (address != null) return address;
    } catch (_) {
      // The local landmark below keeps map selection usable offline.
    }
    return _nearestLandmark(point);
  }

  Future<TaxiRoute> fetchRoute(LatLng from, LatLng to) async {
    try {
      final route = await _routing.fetchRoute(from, to);
      if (route != null) return route;
    } catch (_) {
      // A straight-line estimate keeps booking usable when routing is offline.
    }

    final distance = Geolocator.distanceBetween(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude,
    );
    return TaxiRoute(
      points: [from, to],
      distanceMeters: distance,
      durationSeconds: distance / 8.3,
    );
  }

  String _nearestLandmark(LatLng point) {
    var closest = landmarks.first;
    var shortestDistance = double.infinity;
    for (final landmark in landmarks) {
      final distance = Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        landmark.position.latitude,
        landmark.position.longitude,
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closest = landmark;
      }
    }
    return closest.name;
  }
}
