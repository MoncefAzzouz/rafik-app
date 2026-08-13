import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/driver_map.dart';
import '../../../deliveries/presentation/pages/active_delivery_page.dart';
import '../../../orders/data/truck_repository.dart';
import '../../../orders/domain/truck_order.dart';
import '../../domain/driver_location.dart';
import '../widgets/job_offer_card.dart';

class DriverHomePage extends StatefulWidget {
  final TruckRepository repository;

  const DriverHomePage({super.key, required this.repository});

  @override
  State<DriverHomePage> createState() => _DriverHomePageState();
}

class _DriverHomePageState extends State<DriverHomePage>
    with WidgetsBindingObserver {
  bool _locationRequestInProgress = false;
  Future<bool>? _locationLookup;
  DriverLocation location = const DriverLocation(
    label: 'Sétif, Algeria',
    subtitle: 'Tap to change work location',
    coordinates: LatLng(36.1911, 5.4137),
  );

  TruckRepository get repository => widget.repository;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshCurrentLocation();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshCurrentLocation(requestPermission: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: repository,
      builder: (context, _) {
        final offers = [
          ...repository.availableNow,
          ...repository.availableScheduled,
        ];

        return LayoutBuilder(
          builder: (context, constraints) {
            final maxOffersHeight = (constraints.maxHeight * .40).clamp(
              190.0,
              300.0,
            );

            return SizedBox.expand(
              child: Stack(
                fit: StackFit.expand,
                clipBehavior: Clip.hardEdge,
                children: [
                  DriverMap(
                    online: repository.online,
                    borderRadius: BorderRadius.zero,
                    center: location.coordinates,
                    offers: offers,
                    controlsTop: 82,
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 10, right: 14),
                        child: _AvailabilityControl(
                          online: repository.online,
                          onTap: _toggleAvailability,
                        ),
                      ),
                    ),
                  ),
                  if (repository.online)
                    Positioned(
                      left: 14,
                      right: 14,
                      bottom: 14,
                      child: offers.isEmpty
                          ? const _WaitingForRequests()
                          : ConstrainedBox(
                              constraints: BoxConstraints(
                                maxHeight: maxOffersHeight,
                              ),
                              child: ListView.separated(
                                padding: EdgeInsets.zero,
                                shrinkWrap: true,
                                itemCount: offers.length,
                                separatorBuilder: (_, _) =>
                                    const SizedBox(height: 10),
                                itemBuilder: (context, index) {
                                  final order = offers[index];
                                  return JobOfferCard(
                                    order: order,
                                    onTap: () => _showOffer(context, order),
                                  );
                                },
                              ),
                            ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showOffer(BuildContext context, TruckOrder order) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _OfferSheet(
        order: order,
        onAccept: () async {
          final result = await repository.acceptOrder(order.id);
          if (!sheetContext.mounted) return;
          result.fold(
            onSuccess: (_) {
              Navigator.pop(sheetContext);
              if (context.mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ActiveDeliveryPage(
                      repository: repository,
                      order: order,
                    ),
                  ),
                );
              }
            },
            onFailure: (failure) {
              ScaffoldMessenger.of(
                sheetContext,
              ).showSnackBar(SnackBar(content: Text(failure.message)));
            },
          );
        },
      ),
    );
  }

  Future<void> _toggleAvailability() async {
    if (_locationRequestInProgress) return;
    _locationRequestInProgress = true;
    try {
      await _performToggleAvailability();
    } finally {
      _locationRequestInProgress = false;
    }
  }

  Future<void> _performToggleAvailability() async {
    if (repository.online) {
      final result = await repository.toggleOnline();
      if (!mounted) return;
      result.fold(
        onSuccess: (_) {},
        onFailure: (failure) => ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message))),
      );
      return;
    }

    if (!await Geolocator.isLocationServiceEnabled()) {
      if (!mounted) return;
      final openSettings = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Turn on location'),
          content: const Text(
            'GPS must be enabled before you can go online and receive nearby requests.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Open settings'),
            ),
          ],
        ),
      );
      if (openSettings == true) await Geolocator.openLocationSettings();
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Location permission is required to go online.'),
          action: permission == LocationPermission.deniedForever
              ? SnackBarAction(
                  label: 'Settings',
                  onPressed: Geolocator.openAppSettings,
                )
              : null,
        ),
      );
      return;
    }

    final locationUpdated = await _refreshCurrentLocation(
      requestPermission: false,
    );
    if (!mounted) return;
    if (locationUpdated) {
      final result = await repository.toggleOnline();
      if (!mounted) return;
      result.fold(
        onSuccess: (_) {},
        onFailure: (failure) => ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message))),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get your current GPS location. Try again.'),
        ),
      );
    }
  }

  Future<bool> _refreshCurrentLocation({bool requestPermission = true}) async {
    final activeLookup = _locationLookup;
    if (activeLookup != null) return activeLookup;

    final lookup = _resolveCurrentLocation(
      requestPermission: requestPermission,
    );
    _locationLookup = lookup;
    try {
      return await lookup;
    } finally {
      if (identical(_locationLookup, lookup)) _locationLookup = null;
    }
  }

  Future<bool> _resolveCurrentLocation({
    required bool requestPermission,
  }) async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied && requestPermission) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }

    var locationUpdated = false;
    try {
      final cachedPosition = await Geolocator.getLastKnownPosition();
      if (cachedPosition != null) {
        _applyCurrentPosition(cachedPosition);
        locationUpdated = true;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      _applyCurrentPosition(position);
      return true;
    } catch (_) {
      return locationUpdated;
    }
  }

  void _applyCurrentPosition(Position position) {
    if (!mounted) return;
    setState(() {
      location = DriverLocation(
        label: 'Current location',
        subtitle:
            '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}',
        coordinates: LatLng(position.latitude, position.longitude),
      );
    });
  }
}

class _AvailabilityControl extends StatelessWidget {
  final bool online;
  final Future<void> Function() onTap;

  const _AvailabilityControl({required this.online, required this.onTap});

  @override
  Widget build(BuildContext context) => Semantics(
    label: online ? 'Go offline' : 'Go online',
    button: true,
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          width: 68,
          height: 48,
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: online ? AppColors.green : AppColors.deepNavy,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(45),
                blurRadius: 16,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: AnimatedAlign(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
            alignment: online ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              width: 34,
              height: 34,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.power_settings_new_rounded,
                color: online ? AppColors.green : AppColors.deepNavy,
                size: 20,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

// Kept temporarily as a reference for the former full-width availability
// treatment while the compact map control is used above.
// ignore: unused_element
class _Header extends StatelessWidget {
  final TruckRepository repository;
  final DriverLocation location;
  final VoidCallback onLocationTap;
  final Future<void> Function() onToggleOnline;

  const _Header({
    required this.repository,
    required this.location,
    required this.onLocationTap,
    required this.onToggleOnline,
  });

  @override
  Widget build(BuildContext context) => Column(
    children: [
      InkWell(
        onTap: onLocationTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.royalBlue.withAlpha(18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_on_rounded,
                  color: AppColors.royalBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      location.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      location.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 12),
      Semantics(
        label: repository.online ? 'Go offline' : 'Go online',
        button: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onToggleOnline,
            borderRadius: BorderRadius.circular(20),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              decoration: BoxDecoration(
                color: repository.online ? AppColors.green : AppColors.deepNavy,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color:
                        (repository.online
                                ? AppColors.green
                                : AppColors.deepNavy)
                            .withAlpha(35),
                    blurRadius: 16,
                    offset: const Offset(0, 7),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(28),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.power_settings_new_rounded,
                      color: Colors.white,
                      size: 23,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          repository.online
                              ? 'You are online'
                              : 'You are offline',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          repository.online
                              ? 'Tap to stop receiving requests'
                              : 'Tap when you are ready to deliver',
                          style: TextStyle(
                            color: Colors.white.withAlpha(185),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 46,
                    height: 28,
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(48),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 250),
                      alignment: repository.online
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ],
  );
}

// ignore: unused_element
class _TodayStrip extends StatelessWidget {
  final TruckRepository repository;

  const _TodayStrip({required this.repository});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(22),
      boxShadow: [
        BoxShadow(
          color: AppColors.royalBlue.withAlpha(45),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ],
    ),
    child: Row(
      children: [
        Expanded(child: _metric('TODAY', '${repository.todayEarnings} DA')),
        Container(width: 1, height: 34, color: Colors.white24),
        Expanded(child: _metric('DELIVERIES', '${repository.todayTrips}')),
        Container(width: 1, height: 34, color: Colors.white24),
        Expanded(
          child: _metric('STATUS', repository.online ? 'Online' : 'Offline'),
        ),
      ],
    ),
  );

  Widget _metric(String label, String value) => Column(
    children: [
      Text(
        label,
        style: const TextStyle(
          color: Colors.white54,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: .8,
        ),
      ),
      const SizedBox(height: 5),
      Text(
        value,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.w900,
        ),
      ),
    ],
  );
}

// ignore: unused_element
class _EmptyOnlineState extends StatelessWidget {
  const _EmptyOnlineState();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(26),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
    ),
    child: const Column(
      children: [
        Icon(Icons.power_settings_new_rounded, color: AppColors.blue, size: 32),
        SizedBox(height: 10),
        Text(
          'You’re currently offline',
          style: TextStyle(color: AppColors.ink, fontWeight: FontWeight.w900),
        ),
        SizedBox(height: 4),
        Text(
          'Go online when you are ready to receive delivery requests.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.muted),
        ),
      ],
    ),
  );
}

class _WaitingForRequests extends StatelessWidget {
  const _WaitingForRequests();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      color: Colors.white.withAlpha(245),
      borderRadius: BorderRadius.circular(18),
      boxShadow: [
        BoxShadow(
          color: AppColors.deepNavy.withAlpha(28),
          blurRadius: 18,
          offset: const Offset(0, 7),
        ),
      ],
    ),
    child: const Row(
      children: [
        Icon(Icons.notifications_active_outlined, color: AppColors.blue),
        SizedBox(width: 12),
        Expanded(
          child: Text(
            'You are online. New delivery requests will appear on the map.',
            style: TextStyle(
              color: AppColors.ink,
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
          ),
        ),
      ],
    ),
  );
}

class _OfferSheet extends StatelessWidget {
  final TruckOrder order;
  final VoidCallback onAccept;

  const _OfferSheet({required this.order, required this.onAccept});

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      22,
      12,
      22,
      10 + MediaQuery.paddingOf(context).bottom,
    ),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 42,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.line,
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ),
        const SizedBox(height: 22),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Delivery request · ${order.orderNumber}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${order.estimatedPrice ?? 0} DA',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            if (order.distanceKm != null) const SizedBox(width: 10),
            if (order.distanceKm != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${order.distanceKm} km',
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 22),
        _route(
          Icons.storefront_rounded,
          AppColors.blue,
          'PICKUP',
          order.pickupAddress,
          [
            order.pickupWilaya,
            order.pickupCommune,
          ].whereType<String>().join(', '),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 17),
          child: Container(width: 2, height: 26, color: AppColors.line),
        ),
        _route(
          Icons.location_on_rounded,
          AppColors.green,
          'DROP-OFF',
          order.destinationAddress,
          order.destinationWilaya ?? '',
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const Icon(Icons.inventory_2_outlined, color: AppColors.navy),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  order.category?.name ?? 'Delivery',
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                order.truckType?.name ?? '',
                style: const TextStyle(
                  color: AppColors.muted,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: onAccept,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.royalBlue,
            foregroundColor: Colors.white,
          ),
          child: const Text('Accept delivery'),
        ),
      ],
    ),
  );

  Widget _route(
    IconData icon,
    Color color,
    String label,
    String title,
    String subtitle,
  ) => Row(
    children: [
      Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color.withAlpha(18),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      const SizedBox(width: 13),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.muted,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: .7,
              ),
            ),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.ink,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (subtitle.isNotEmpty)
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
          ],
        ),
      ),
    ],
  );
}
