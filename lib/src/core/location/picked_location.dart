import 'package:latlong2/latlong.dart';

/// A user-picked map point paired with its resolved display address, kept
/// together as one unit so the two can never drift out of sync (unlike
/// tracking a coordinate and an address as separate, independently-mutated
/// fields).
class PickedLocation {
  final LatLng coordinate;
  final String address;

  const PickedLocation({required this.coordinate, required this.address});
}
