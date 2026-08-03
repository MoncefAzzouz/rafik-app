import 'package:latlong2/latlong.dart';

import '../data/repositories/taxi_location_repository.dart';
import '../domain/taxi_location.dart';

export '../domain/taxi_location.dart';

/// Backwards-compatible facade for the booking UI.
///
/// New presentation code should depend on [TaxiLocationRepository] directly.
class TaxiLocationService {
  final TaxiLocationRepository _repository;

  TaxiLocationService({TaxiLocationRepository? repository})
    : _repository = repository ?? TaxiLocationRepository();

  static const landmarks = TaxiLocationRepository.landmarks;

  Future<LatLng?> getCurrentPosition() => _repository.getCurrentPosition();

  Future<String> reverseGeocode(LatLng point) =>
      _repository.reverseGeocode(point);

  Future<TaxiRoute> fetchRoute(LatLng from, LatLng to) =>
      _repository.fetchRoute(from, to);
}
