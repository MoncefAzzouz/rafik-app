import 'package:latlong2/latlong.dart';

class DriverLocation {
  final String label;
  final String subtitle;
  final LatLng coordinates;

  const DriverLocation({
    required this.label,
    required this.subtitle,
    required this.coordinates,
  });
}
