import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../features/orders/domain/truck_order.dart';
import '../theme/app_colors.dart';

class DriverMap extends StatefulWidget {
  final bool online;
  final BorderRadius borderRadius;
  final LatLng? center;
  final double controlsTop;

  /// Nearby open orders to show as pins (home screen). Ignored when
  /// [activeOrder] is set.
  final List<TruckOrder> offers;

  /// The order currently being tracked (active-delivery screen). When set,
  /// the map shows pickup + destination pins and zooms to fit both.
  final TruckOrder? activeOrder;

  const DriverMap({
    super.key,
    required this.online,
    this.borderRadius = const BorderRadius.all(Radius.circular(28)),
    this.center,
    this.controlsTop = 16,
    this.offers = const [],
    this.activeOrder,
  });

  @override
  State<DriverMap> createState() => _DriverMapState();
}

class _DriverMapState extends State<DriverMap> {
  static const _setifCenter = LatLng(36.1911, 5.4137);
  static const _defaultZoom = 13.5;
  final _controller = MapController();

  LatLng get _center => widget.center ?? _setifCenter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fitToFocusPoints());
  }

  @override
  void didUpdateWidget(covariant DriverMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_sameFocus(oldWidget)) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fitToFocusPoints());
    } else if (oldWidget.center != widget.center && widget.center != null) {
      _controller.move(_center, _defaultZoom);
    }
  }

  bool _sameFocus(DriverMap oldWidget) {
    if (oldWidget.activeOrder?.id != widget.activeOrder?.id) return false;
    if (oldWidget.offers.length != widget.offers.length) return false;
    for (var i = 0; i < widget.offers.length; i++) {
      if (oldWidget.offers[i].id != widget.offers[i].id) return false;
    }
    return true;
  }

  /// Pickup/destination of the tracked order, or the driver's position plus
  /// every nearby offer's pickup point — whichever is relevant right now.
  List<LatLng> _focusPoints() {
    final order = widget.activeOrder;
    if (order != null) {
      return [
        if (order.pickupLat != null && order.pickupLng != null)
          LatLng(order.pickupLat!, order.pickupLng!),
        if (order.destinationLat != null && order.destinationLng != null)
          LatLng(order.destinationLat!, order.destinationLng!),
      ];
    }
    if (widget.offers.isNotEmpty) {
      return [
        _center,
        for (final offer in widget.offers)
          if (offer.pickupLat != null && offer.pickupLng != null)
            LatLng(offer.pickupLat!, offer.pickupLng!),
      ];
    }
    return const [];
  }

  void _fitToFocusPoints() {
    if (!mounted) return;
    final points = _focusPoints();
    if (points.isEmpty) return;
    try {
      if (points.length == 1) {
        // Only one real coordinate to show (e.g. a tracked order whose
        // destination has no coordinates yet) — center on it directly
        // instead of silently doing nothing, which is what a bounds-fit
        // needs at least 2 points for.
        _controller.move(points.first, 15);
        return;
      }
      _controller.fitCamera(
        CameraFit.bounds(
          bounds: LatLngBounds.fromPoints(points),
          padding: const EdgeInsets.fromLTRB(40, 60, 40, 60),
          maxZoom: 16,
        ),
      );
    } catch (_) {
      // Controller not attached yet (e.g. called before onMapReady fires) —
      // onMapReady/the next didUpdateWidget will retry.
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.activeOrder;

    return ClipRRect(
      borderRadius: widget.borderRadius,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _controller,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: _defaultZoom,
              minZoom: 4,
              maxZoom: 19,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
              onMapReady: _fitToFocusPoints,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'dz.rafik.driver',
              ),
              MarkerLayer(
                markers: [
                  if (order != null) ...[
                    if (order.pickupLat != null && order.pickupLng != null)
                      Marker(
                        point: LatLng(order.pickupLat!, order.pickupLng!),
                        width: 44,
                        height: 44,
                        child: const _RoutePin(
                          icon: Icons.storefront_rounded,
                          color: AppColors.blue,
                        ),
                      ),
                    if (order.destinationLat != null &&
                        order.destinationLng != null)
                      Marker(
                        point: LatLng(
                          order.destinationLat!,
                          order.destinationLng!,
                        ),
                        width: 44,
                        height: 44,
                        child: const _RoutePin(
                          icon: Icons.flag_rounded,
                          color: AppColors.green,
                        ),
                      ),
                  ] else
                    for (final offer in widget.offers)
                      if (offer.pickupLat != null && offer.pickupLng != null)
                        Marker(
                          point: LatLng(offer.pickupLat!, offer.pickupLng!),
                          width: 78,
                          height: 42,
                          child: _OfferPin(
                            label: offer.estimatedPrice != null
                                ? '${offer.estimatedPrice} DA'
                                : '—',
                          ),
                        ),
                  if (order == null)
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
            top: widget.controlsTop,
            right: 16,
            child: Material(
              color: Colors.white,
              shape: const CircleBorder(),
              elevation: 4,
              child: IconButton(
                tooltip: 'Recenter map',
                onPressed: () {
                  if (_focusPoints().isNotEmpty) {
                    _fitToFocusPoints();
                  } else {
                    _controller.move(_center, _defaultZoom);
                  }
                },
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

class _RoutePin extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _RoutePin({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      shape: BoxShape.circle,
      border: Border.all(color: color, width: 3),
      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
    ),
    child: Icon(icon, color: color, size: 20),
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
