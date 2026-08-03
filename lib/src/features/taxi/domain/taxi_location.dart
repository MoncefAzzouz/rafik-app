import 'package:latlong2/latlong.dart';

const LatLng kSetifCenter = LatLng(36.1911, 5.4137);

class Landmark {
  final String name;
  final LatLng position;

  const Landmark(this.name, this.position);
}

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
