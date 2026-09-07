import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../l10n/app_strings.dart';
import '../theme/app_colors.dart';
import '../../features/taxi/data/datasources/device_location_data_source.dart';
import 'picked_location.dart';

/// A standalone "drop a pin on the map" screen. The map moves under a fixed
/// centre pin and the address is reverse-geocoded as it settles; confirming
/// pops the route with the resolved [PickedLocation].
///
/// Kept feature-agnostic so any flow that needs a single point (the home
/// location sheet today, address book entries later) can push it.
class LocationPickerPage extends StatefulWidget {
  /// Where to open the map. When null the device's own position is used,
  /// falling back to [fallbackCenter].
  final PickedLocation? initialLocation;

  const LocationPickerPage({super.key, this.initialLocation});

  /// Sétif — the app's home city, used only when GPS gives us nothing.
  static const fallbackCenter = LatLng(36.1911, 5.4137);

  @override
  State<LocationPickerPage> createState() => _LocationPickerPageState();
}

class _LocationPickerPageState extends State<LocationPickerPage> {
  final MapController _mapController = MapController();
  final DeviceLocationDataSource _deviceLocation = DeviceLocationDataSource();

  LatLng _center = LocationPickerPage.fallbackCenter;
  String? _address;
  LatLng? _lastGeocodedPoint;
  bool _isGeocoding = false;
  bool _isLocating = false;
  bool _mapReady = false;

  /// Tags each geocode so a slow, stale response can never overwrite a newer
  /// one after the user has dragged the map on.
  int _geocodeRequestId = 0;
  Timer? _geocodeDebounce;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialLocation;
    if (initial != null) {
      _center = initial.coordinate;
      _address = initial.address;
      _lastGeocodedPoint = initial.coordinate;
    } else {
      _startAtDeviceLocation();
    }
  }

  @override
  void dispose() {
    _geocodeDebounce?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _startAtDeviceLocation() async {
    setState(() => _isLocating = true);
    final location = await _deviceLocation.currentPosition();
    if (!mounted) return;
    setState(() {
      _isLocating = false;
      _center = location ?? LocationPickerPage.fallbackCenter;
    });
    if (_mapReady) _mapController.move(_center, 16);
    _scheduleGeocode(_center);
  }

  Future<void> _recenterOnDevice(AppStrings s) async {
    setState(() => _isLocating = true);
    final location = await _deviceLocation.currentPosition();
    if (!mounted) return;
    setState(() => _isLocating = false);
    if (location == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(s.locationUnavailable)));
      return;
    }
    _mapController.move(location, 16);
  }

  Future<String> _reverseGeocode(LatLng point) async {
    try {
      final address = await _deviceLocation.reverseGeocode(point);
      if (address != null && address.trim().isNotEmpty) return address;
    } catch (_) {
      // Fall through to the coordinate below rather than inventing a place
      // name the user would have no way to verify.
    }
    return '${point.latitude.toStringAsFixed(5)}, '
        '${point.longitude.toStringAsFixed(5)}';
  }

  void _scheduleGeocode(LatLng point) {
    _geocodeDebounce?.cancel();
    setState(() => _isGeocoding = true);
    _geocodeDebounce = Timer(
      const Duration(milliseconds: 400),
      () => _runGeocode(point),
    );
  }

  Future<void> _runGeocode(LatLng point) async {
    final requestId = ++_geocodeRequestId;
    final address = await _reverseGeocode(point);
    if (!mounted || requestId != _geocodeRequestId) return;
    setState(() {
      _address = address;
      _lastGeocodedPoint = point;
      _isGeocoding = false;
    });
  }

  void _onMapEvent(MapEvent event) {
    if (!_mapReady) return;
    _center = _mapController.camera.center;
    _scheduleGeocode(_center);
  }

  Future<void> _confirm() async {
    final center = _mapReady ? _mapController.camera.center : _center;
    String address;
    if (_lastGeocodedPoint == center && _address != null) {
      address = _address!;
    } else {
      // Never hand back a cached address belonging to a different point —
      // resolve the exact confirmed coordinate first.
      _geocodeDebounce?.cancel();
      setState(() => _isGeocoding = true);
      address = await _reverseGeocode(center);
      if (!mounted) return;
    }
    if (!mounted) return;
    Navigator.pop(
      context,
      PickedLocation(coordinate: center, address: address),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        return Directionality(
          textDirection: lang == AppLang.ar
              ? TextDirection.rtl
              : TextDirection.ltr,
          child: Scaffold(
            body: Stack(
              children: [
                Positioned.fill(
                  child: FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _center,
                      initialZoom: 16,
                      minZoom: 4,
                      maxZoom: 19,
                      interactionOptions: const InteractionOptions(
                        flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                      ),
                      onMapReady: () => _mapReady = true,
                      onMapEvent: _onMapEvent,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.example.rafik_app',
                      ),
                    ],
                  ),
                ),

                // Fixed centre pin — the map moves under it, matching the
                // parcel and taxi pickers.
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 36),
                    child: Icon(
                      Icons.location_on_rounded,
                      color: AppColors.primary,
                      size: 46,
                    ),
                  ),
                ),

                _buildTopBar(context, s),
                _buildRecenterButton(s),
                _buildBottomCard(s),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopBar(BuildContext context, AppStrings s) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      right: 16,
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.close_rounded,
                color: Colors.black87,
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 10,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                s.locationPickerHint,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecenterButton(AppStrings s) {
    return Positioned(
      right: 16,
      bottom: 170,
      child: Material(
        color: Colors.white,
        shape: const CircleBorder(),
        elevation: 3,
        child: IconButton(
          tooltip: s.locationUseCurrent,
          onPressed: _isLocating ? null : () => _recenterOnDevice(s),
          icon: _isLocating
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.my_location_rounded, color: AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildBottomCard(AppStrings s) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 16,
              offset: Offset(0, -4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_pin, color: Colors.grey, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _isGeocoding
                        ? Row(
                            children: [
                              const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                s.locationPickerResolving,
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          )
                        : Text(
                            _address ?? s.locationPickerHint,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isGeocoding ? null : _confirm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade200,
                    disabledForegroundColor: Colors.grey.shade400,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    s.locationPickerConfirm,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
