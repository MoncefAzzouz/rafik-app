import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:latlong2/latlong.dart';
import 'package:rafik_app/src/features/taxi/data/datasources/routing_data_source.dart';

void main() {
  group('RoutingDataSource', () {
    test('parses a valid OSRM route', () async {
      final client = MockClient(
        (_) async => http.Response('''
          {
            "code": "Ok",
            "routes": [{
              "distance": 1250.5,
              "duration": 310.0,
              "geometry": {"coordinates": [[5.4, 36.1], [5.5, 36.2]]}
            }]
          }
          ''', 200),
      );

      final route = await RoutingDataSource(
        client: client,
      ).fetchRoute(const LatLng(36.1, 5.4), const LatLng(36.2, 5.5));

      expect(route, isNotNull);
      expect(route!.distanceMeters, 1250.5);
      expect(route.durationSeconds, 310);
      expect(route.points, const [LatLng(36.1, 5.4), LatLng(36.2, 5.5)]);
    });

    test('returns null for malformed responses', () async {
      final client = MockClient(
        (_) async => http.Response('{"code":"Ok"}', 200),
      );

      final route = await RoutingDataSource(
        client: client,
      ).fetchRoute(const LatLng(36.1, 5.4), const LatLng(36.2, 5.5));

      expect(route, isNull);
    });
  });
}
