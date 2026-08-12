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
import 'location_picker_page.dart';

class DriverHomePage extends StatefulWidget {
  final TruckRepository repository;

  const DriverHomePage({super.key, required this.repository});

  @override
  State<DriverHomePage> createState() => _DriverHomePageState();
}

class _DriverHomePageState extends State<DriverHomePage> {
  bool _locationRequestInProgress = false;
  DriverLocation location = const DriverLocation(
    label: 'Sétif, Algeria',
    subtitle: 'Tap to change work location',
    coordinates: LatLng(36.1911, 5.4137),
  );

  TruckRepository get repository => widget.repository;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: repository,
      builder: (context, _) => SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              sliver: SliverToBoxAdapter(
                child: _Header(
                  repository: repository,
                  location: location,
                  onLocationTap: _chooseLocation,
                  onToggleOnline: _toggleAvailability,
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              sliver: SliverToBoxAdapter(
                child: SizedBox(
                  height: 300,
                  child: DriverMap(
                    online: repository.online,
                    center: location.coordinates,
                    offers: repository.availableNow,
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 2),
              sliver: SliverToBoxAdapter(
                child: _TodayStrip(repository: repository),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Nearby requests',
                      style: TextStyle(
                        color: AppColors.ink,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '${repository.availableNow.length} available',
                      style: const TextStyle(
                        color: AppColors.blue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (!repository.online)
              const SliverPadding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 120),
                sliver: SliverToBoxAdapter(child: _EmptyOnlineState()),
              )
            else ...[
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                sliver: SliverList.separated(
                  itemCount: repository.availableNow.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final order = repository.availableNow[index];
                    return JobOfferCard(
                      order: order,
                      onTap: () => _showOffer(context, order),
                    );
                  },
                ),
              ),
              if (repository.availableScheduled.isNotEmpty) ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
                  sliver: SliverToBoxAdapter(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Scheduled requests',
                          style: TextStyle(
                            color: AppColors.ink,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          '${repository.availableScheduled.length} available',
                          style: const TextStyle(
                            color: AppColors.blue,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                  sliver: SliverList.separated(
                    itemCount: repository.availableScheduled.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = repository.availableScheduled[index];
                      return JobOfferCard(
                        order: order,
                        onTap: () => _showOffer(context, order),
                      );
                    },
                  ),
                ),
              ] else
                const SliverPadding(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, 120),
                  sliver: SliverToBoxAdapter(child: SizedBox.shrink()),
                ),
            ],
          ],
        ),
      ),
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
                    builder: (_) =>
                        ActiveDeliveryPage(repository: repository, order: order),
                  ),
                );
              }
            },
            onFailure: (failure) {
              ScaffoldMessenger.of(sheetContext).showSnackBar(
                SnackBar(content: Text(failure.message)),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _chooseLocation() async {
    final selected = await Navigator.push<DriverLocation>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationPickerPage(initialLocation: location),
      ),
    );
    if (selected != null && mounted) setState(() => location = selected);
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

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      if (!mounted) return;
      final coordinates = LatLng(position.latitude, position.longitude);
      setState(() {
        location = DriverLocation(
          label: 'Current location',
          subtitle:
              '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}',
          coordinates: coordinates,
        );
      });
      final result = await repository.toggleOnline();
      if (!mounted) return;
      result.fold(
        onSuccess: (_) {},
        onFailure: (failure) => ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message))),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get your current GPS location. Try again.'),
        ),
      );
    }
  }
}

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
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: InkWell(
          onTap: onLocationTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  color: AppColors.royalBlue,
                  size: 20,
                ),
                const SizedBox(width: 5),
                Flexible(
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
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
      Semantics(
        label: repository.online ? 'Go offline' : 'Go online',
        button: true,
        child: InkWell(
          onTap: onToggleOnline,
          borderRadius: BorderRadius.circular(30),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: repository.online ? AppColors.green : Colors.white,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: repository.online ? AppColors.green : AppColors.line,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: repository.online ? Colors.white : AppColors.muted,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 7),
                Text(
                  repository.online ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: repository.online ? Colors.white : AppColors.ink,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}

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
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delivery request · ${order.orderNumber}',
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${order.estimatedPrice ?? 0} DA',
                  style: const TextStyle(
                    color: AppColors.green,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
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
          [order.pickupWilaya, order.pickupCommune]
              .whereType<String>()
              .join(', '),
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
