import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;
import 'package:latlong2/latlong.dart';

/// The app keeps `latlong2` coordinates in its models and services; Google
/// Maps has its own LatLng type, so convert at the map boundary only.
extension AppLatLng on LatLng {
  gmaps.LatLng get g => gmaps.LatLng(latitude, longitude);
}

extension GoogleLatLng on gmaps.LatLng {
  LatLng get app => LatLng(latitude, longitude);
}

/// Smallest box containing every point in [points] (at least one).
gmaps.LatLngBounds boundsOf(List<LatLng> points) {
  var south = points.first.latitude, north = south;
  var west = points.first.longitude, east = west;
  for (final p in points) {
    if (p.latitude < south) south = p.latitude;
    if (p.latitude > north) north = p.latitude;
    if (p.longitude < west) west = p.longitude;
    if (p.longitude > east) east = p.longitude;
  }
  return gmaps.LatLngBounds(
    southwest: gmaps.LatLng(south, west),
    northeast: gmaps.LatLng(north, east),
  );
}

/// Google Maps markers need bitmaps, not widgets, so the pins and dots the
/// old flutter_map layers drew as widgets are painted to PNG here (cached).
class MapIcons {
  MapIcons._();

  static final _cache = <String, gmaps.BitmapDescriptor>{};

  static double get _ratio =>
      ui.PlatformDispatcher.instance.views.first.devicePixelRatio;

  /// A location-pin glyph (tip at the bottom centre — use anchor 0.5, 0.9).
  static Future<gmaps.BitmapDescriptor> pin(Color color, {double size = 38}) {
    return _cached('pin-${color.toARGB32()}-$size', size, (canvas, px) {
      final painter = TextPainter(
        textDirection: TextDirection.ltr,
        text: TextSpan(
          text: String.fromCharCode(Icons.location_on_rounded.codePoint),
          style: TextStyle(
            fontSize: px,
            fontFamily: Icons.location_on_rounded.fontFamily,
            package: Icons.location_on_rounded.fontPackage,
            color: color,
          ),
        ),
      )..layout();
      painter.paint(
        canvas,
        Offset((px - painter.width) / 2, (px - painter.height) / 2),
      );
    });
  }

  /// A filled dot with a white ring and a soft shadow.
  static Future<gmaps.BitmapDescriptor> dot(
    Color color, {
    double size = 24,
    double ring = 3,
  }) {
    return _cached('dot-${color.toARGB32()}-$size-$ring', size, (canvas, px) {
      final c = Offset(px / 2, px / 2);
      final scale = px / size;
      final radius = px / 2 - 3 * scale;
      canvas.drawCircle(
        c.translate(0, scale),
        radius,
        Paint()
          ..color = Colors.black26
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 2 * scale),
      );
      canvas.drawCircle(c, radius, Paint()..color = Colors.white);
      canvas.drawCircle(c, radius - ring * scale, Paint()..color = color);
    });
  }

  /// A solid disc with a white ring and a coloured core — route start/end.
  static Future<gmaps.BitmapDescriptor> ring(Color color, {double size = 24}) {
    return _cached('ring-${color.toARGB32()}-$size', size, (canvas, px) {
      final c = Offset(px / 2, px / 2);
      final scale = px / size;
      canvas.drawCircle(
        c.translate(0, scale),
        px / 2 - 2 * scale,
        Paint()
          ..color = Colors.black26
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 2 * scale),
      );
      canvas.drawCircle(c, px / 2 - 2 * scale, Paint()..color = color);
      canvas.drawCircle(c, 7 * scale, Paint()..color = Colors.white);
      canvas.drawCircle(c, 3.5 * scale, Paint()..color = color);
    });
  }

  /// An image asset scaled to [size] logical pixels.
  static Future<gmaps.BitmapDescriptor> asset(String path, {double size = 34}) {
    final key = 'asset-$path-$size';
    final hit = _cache[key];
    if (hit != null) return Future.value(hit);
    return rootBundle.load(path).then((data) async {
      final codec = await ui.instantiateImageCodec(
        data.buffer.asUint8List(),
        targetWidth: (size * _ratio).round(),
      );
      final frame = await codec.getNextFrame();
      final bytes = await frame.image.toByteData(
        format: ui.ImageByteFormat.png,
      );
      return _cache[key] = gmaps.BitmapDescriptor.bytes(
        bytes!.buffer.asUint8List(),
        imagePixelRatio: _ratio,
      );
    });
  }

  static Future<gmaps.BitmapDescriptor> _cached(
    String key,
    double size,
    void Function(Canvas canvas, double px) paint,
  ) async {
    final hit = _cache[key];
    if (hit != null) return hit;
    final px = size * _ratio;
    final recorder = ui.PictureRecorder();
    paint(Canvas(recorder), px);
    final image = await recorder.endRecording().toImage(px.ceil(), px.ceil());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return _cache[key] = gmaps.BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      imagePixelRatio: _ratio,
    );
  }
}
