import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../theme/app_colors.dart';

class DriverMap extends StatefulWidget {
  final bool online;
  final BorderRadius borderRadius;
  final LatLng? center;

  const DriverMap({
    super.key,
    required this.online,
    this.borderRadius = const BorderRadius.all(Radius.circular(28)),
    this.center,
  });

  @override
  State<DriverMap> createState() => _DriverMapState();
}

class _DriverMapState extends State<DriverMap> {
  static const _setifCenter = LatLng(36.1911, 5.4137);
  final _controller = MapController();

  LatLng get _center => widget.center ?? _setifCenter;

  @override
  void didUpdateWidget(covariant DriverMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.center != widget.center && widget.center != null) {
      _controller.move(_center, 13.5);
    }
  }

  static const _offers = <({LatLng point, String price})>[
    (point: LatLng(36.1960, 5.4010), price: '780 DA'),
    (point: LatLng(36.2030, 5.4230), price: '1,120 DA'),
    (point: LatLng(36.1830, 5.3610), price: '2,650 DA'),
  ];

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: widget.borderRadius,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _controller,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: 13.5,
              minZoom: 4,
              maxZoom: 19,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'dz.rafik.driver',
              ),
              MarkerLayer(
                markers: [
                  for (final offer in _offers)
                    Marker(
                      point: offer.point,
                      width: 78,
                      height: 42,
                      child: _OfferPin(label: offer.price),
                    ),
                  Marker(
                    point: _center,
                    width: 54,
                    height: 54,
                    child: const _DriverMarker(),
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            top: 16,
            right: 16,
            child: Material(
              color: Colors.white,
              shape: const CircleBorder(),
              elevation: 4,
              child: IconButton(
                tooltip: 'Recenter map',
                onPressed: () => _controller.move(_center, 13.5),
                icon: const Icon(
                  Icons.my_location_rounded,
                  color: AppColors.deepNavy,
                ),
              ),
            ),
          ),
          Positioned(
            left: 10,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              color: Colors.white.withAlpha(220),
              child: const Text(
                '© OpenStreetMap contributors',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 8),
              ),
            ),
          ),
          if (!widget.online)
            Positioned.fill(
              child: ColoredBox(
                color: Colors.white.withAlpha(190),
                child: const Center(
                  child: Text(
                    'Go online to see nearby requests',
                    style: TextStyle(
                      color: AppColors.deepNavy,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DriverMarker extends StatelessWidget {
  const _DriverMarker();

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      shape: BoxShape.circle,
      border: Border.all(color: AppColors.royalBlue, width: 4),
      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 14)],
    ),
    child: const Icon(
      Icons.navigation_rounded,
      color: AppColors.royalBlue,
      size: 25,
    ),
  );
}

class _OfferPin extends StatelessWidget {
  final String label;

  const _OfferPin({required this.label});

  @override
  Widget build(BuildContext context) => Container(
    alignment: Alignment.center,
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.white, width: 2),
      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
    ),
    child: Text(
      label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.w900,
      ),
    ),
  );
}
