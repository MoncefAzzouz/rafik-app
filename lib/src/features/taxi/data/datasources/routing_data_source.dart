import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../domain/taxi_location.dart';

class RoutingDataSource {
  final http.Client _client;

  RoutingDataSource({http.Client? client}) : _client = client ?? http.Client();

  Future<TaxiRoute?> fetchRoute(LatLng from, LatLng to) async {
    final url = Uri.parse(
      'https://router.project-osrm.org/route/v1/driving/'
      '${from.longitude},${from.latitude};${to.longitude},${to.latitude}'
      '?overview=full&geometries=geojson',
    );
    final response = await _client.get(url).timeout(const Duration(seconds: 8));
    if (response.statusCode != 200) return null;

    final data = jsonDecode(response.body);
    if (data is! Map<String, dynamic> || data['code'] != 'Ok') return null;
    final routes = data['routes'];
    if (routes is! List || routes.isEmpty || routes.first is! Map) return null;
    final route = Map<String, dynamic>.from(routes.first as Map);
    final geometry = route['geometry'];
    if (geometry is! Map || geometry['coordinates'] is! List) return null;

    final points = <LatLng>[];
    for (final coordinate in geometry['coordinates'] as List) {
      if (coordinate is List &&
          coordinate.length >= 2 &&
          coordinate[0] is num &&
          coordinate[1] is num) {
        points.add(
          LatLng(
            (coordinate[1] as num).toDouble(),
            (coordinate[0] as num).toDouble(),
          ),
        );
      }
    }
    final distance = route['distance'];
    final duration = route['duration'];
    if (points.isEmpty || distance is! num || duration is! num) return null;

    return TaxiRoute(
      points: points,
      distanceMeters: distance.toDouble(),
      durationSeconds: duration.toDouble(),
    );
  }
}
