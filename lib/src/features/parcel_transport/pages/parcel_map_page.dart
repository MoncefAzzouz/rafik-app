import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'parcel_details_page.dart';
import 'parcel_vehicle_select_page.dart'; // import TruckTypeOption
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../../../core/location/picked_location.dart';

class ParcelMapPage extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final TruckTypeOption truckType;

  const ParcelMapPage({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.truckType,
  });

  @override
  State<ParcelMapPage> createState() => _ParcelMapPageState();
}

class _ParcelMapPageState extends State<ParcelMapPage> {
  // Algiers — used only as a last-resort map center when GPS is unavailable
  // and neither point has been picked yet.
  static const _fallbackCenter = LatLng(36.75, 3.06);

  final MapController _overviewMapController = MapController();
  final MapController _pickerMapController = MapController();
  final Geocoding _geocoder = Geocoding();

  PickedLocation? _pickup;
  PickedLocation? _destination;

  bool _isPicking = false;
  bool _pickingIsPickupField = true;
  LatLng _pickerCenter = _fallbackCenter;
  String? _pickerAddress;
  LatLng? _lastGeocodedPoint;
  bool _isGeocoding = false;
  bool _isLocating = false;
  int _geocodeRequestId = 0;
  Timer? _geocodeDebounce;

  @override
  void dispose() {
    _geocodeDebounce?.cancel();
    _overviewMapController.dispose();
    _pickerMapController.dispose();
    super.dispose();
  }

  // ── Device location ──────────────────────────────────────────────

  Future<LatLng?> _getDeviceLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      return LatLng(position.latitude, position.longitude);
    } catch (_) {
      final last = await Geolocator.getLastKnownPosition();
      return last == null ? null : LatLng(last.latitude, last.longitude);
    }
  }

  // ── Reverse geocoding ────────────────────────────────────────────

  Future<String> _reverseGeocode(LatLng point) async {
    try {
      final placemarks = await _geocoder.placemarkFromCoordinates(
        point.latitude,
        point.longitude,
      );
      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        final parts = <String>{};
        for (final part in [
          placemark.street,
          placemark.subLocality,
          placemark.locality,
        ]) {
          if (part != null && part.trim().isNotEmpty) parts.add(part.trim());
        }
        if (parts.isNotEmpty) return parts.join('، ');
      }
    } catch (_) {
      // Fall through to the honest coordinate fallback below rather than
      // guessing a place name.
    }
    return '${point.latitude.toStringAsFixed(5)}, ${point.longitude.toStringAsFixed(5)}';
  }

  /// Debounced background geocode while the user drags the picker map.
  /// Tagged with a request id so a slow, stale call can never overwrite a
  /// newer one (the taxi feature's picker has this exact bug).
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
      _pickerAddress = address;
      _lastGeocodedPoint = point;
      _isGeocoding = false;
    });
  }

  // ── Picker flow ──────────────────────────────────────────────────

  Future<void> _openPicker(bool isPickup) async {
    final existing = isPickup ? _pickup : _destination;
    final other = isPickup ? _destination : _pickup;

    setState(() {
      _isPicking = true;
      _pickingIsPickupField = isPickup;
    });

    LatLng startCenter;
    if (existing != null) {
      startCenter = existing.coordinate;
    } else if (other != null) {
      startCenter = other.coordinate;
    } else {
      setState(() => _isLocating = true);
      startCenter = await _getDeviceLocation() ?? _fallbackCenter;
      if (!mounted) return;
      setState(() => _isLocating = false);
    }

    setState(() {
      _pickerCenter = startCenter;
      _pickerAddress = existing?.address;
      _lastGeocodedPoint = existing?.coordinate;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _pickerMapController.move(startCenter, 15);
      if (existing == null) _scheduleGeocode(startCenter);
    });
  }

  Future<void> _recenterPickerOnDevice() async {
    setState(() => _isLocating = true);
    final location = await _getDeviceLocation();
    if (!mounted) return;
    setState(() => _isLocating = false);
    if (location == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذر تحديد موقعك الحالي')),
      );
      return;
    }
    _pickerMapController.move(location, 16);
  }

  void _onPickerMapEvent(MapEvent event) {
    if (!_isPicking) return;
    _pickerCenter = _pickerMapController.camera.center;
    _scheduleGeocode(_pickerCenter);
  }

  Future<void> _confirmPicker() async {
    final center = _pickerMapController.camera.center;
    String address;
    if (_lastGeocodedPoint == center && _pickerAddress != null) {
      address = _pickerAddress!;
    } else {
      // Never trust a possibly-stale cached address for a different point —
      // resolve the exact confirmed coordinate before proceeding.
      _geocodeDebounce?.cancel();
      setState(() => _isGeocoding = true);
      address = await _reverseGeocode(center);
      if (!mounted) return;
    }

    final picked = PickedLocation(coordinate: center, address: address);
    setState(() {
      if (_pickingIsPickupField) {
        _pickup = picked;
      } else {
        _destination = picked;
      }
      _isPicking = false;
      _isGeocoding = false;
    });
    _zoomOverviewToRoute();
  }

  void _cancelPicker() {
    setState(() => _isPicking = false);
  }

  void _zoomOverviewToRoute() {
    final pickup = _pickup?.coordinate;
    final destination = _destination?.coordinate;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (pickup != null && destination != null) {
        _overviewMapController.fitCamera(
          CameraFit.bounds(
            bounds: LatLngBounds.fromPoints([pickup, destination]),
            padding: const EdgeInsets.fromLTRB(50, 100, 50, 360),
          ),
        );
      } else if (pickup != null) {
        _overviewMapController.move(pickup, 13);
      } else if (destination != null) {
        _overviewMapController.move(destination, 13);
      }
    });
  }

  // ── UI ───────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Stack(
          children: [
            _buildOverview(context),
            if (_isPicking) _buildPicker(context),
          ],
        ),
      ),
    );
  }

  Widget _buildOverview(BuildContext context) {
    final pickupPoint = _pickup?.coordinate;
    final destinationPoint = _destination?.coordinate;
    final routePoints = <LatLng>[
      if (pickupPoint != null) pickupPoint,
      if (destinationPoint != null) destinationPoint,
    ];

    return Stack(
      children: [
        Positioned.fill(
          child: FlutterMap(
            mapController: _overviewMapController,
            options: const MapOptions(
              initialCenter: _fallbackCenter,
              initialZoom: 11,
              minZoom: 4,
              maxZoom: 19,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.rafik_app',
              ),
              if (routePoints.length == 2)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: routePoints,
                      strokeWidth: 6,
                      color: Colors.blue.shade600,
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  if (pickupPoint != null)
                    Marker(
                      point: pickupPoint,
                      width: 40,
                      height: 40,
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: AppColors.primary,
                        size: 38,
                      ),
                    ),
                  if (destinationPoint != null)
                    Marker(
                      point: destinationPoint,
                      width: 40,
                      height: 40,
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: Colors.black,
                        size: 38,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),

        Positioned(
          top: MediaQuery.of(context).padding.top + 16,
          right: 16,
          child: GestureDetector(
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
                Icons.arrow_forward,
                color: Colors.black87,
                size: 24,
              ),
            ),
          ),
        ),

        Positioned(
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
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  _addressRow(
                    icon: Icons.location_on_rounded,
                    iconColor: AppColors.primary,
                    label: 'عنوان استلام البضائع',
                    placeholder: 'حدد نقطة الاستلام على الخريطة',
                    value: _pickup?.address,
                    onTap: () => _openPicker(true),
                  ),
                  const SizedBox(height: 12),
                  _addressRow(
                    icon: Icons.location_on_rounded,
                    iconColor: Colors.black87,
                    label: 'عنوان تسليم البضائع',
                    placeholder: 'حدد نقطة التسليم على الخريطة',
                    value: _destination?.address,
                    onTap: () => _openPicker(false),
                  ),

                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: (_pickup == null || _destination == null)
                          ? null
                          : () {
                              Navigator.push(
                                context,
                                SmoothPageRoute(
                                  page: ParcelDetailsPage(
                                    categoryId: widget.categoryId,
                                    categoryName: widget.categoryName,
                                    truckType: widget.truckType,
                                    pickupAddress: _pickup!.address,
                                    pickupLat: _pickup!.coordinate.latitude,
                                    pickupLng: _pickup!.coordinate.longitude,
                                    destinationAddress:
                                        _destination!.address,
                                    destinationLat:
                                        _destination!.coordinate.latitude,
                                    destinationLng:
                                        _destination!.coordinate.longitude,
                                  ),
                                ),
                              );
                            },
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
                      child: const Text(
                        'مواصلة',
                        style: TextStyle(
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
        ),
      ],
    );
  }

  Widget _addressRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String placeholder,
    required String? value,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value ?? placeholder,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: value != null ? Colors.black : Colors.grey,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.map_outlined, color: Colors.grey, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildPicker(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: FlutterMap(
            mapController: _pickerMapController,
            options: MapOptions(
              initialCenter: _pickerCenter,
              initialZoom: 15,
              minZoom: 4,
              maxZoom: 19,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
              onMapEvent: _onPickerMapEvent,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.rafik_app',
              ),
            ],
          ),
        ),

        // Fixed center pin overlay — the map moves under it, not the other
        // way around (same pattern as the taxi booking flow's picker).
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

        Positioned(
          top: MediaQuery.of(context).padding.top + 16,
          right: 16,
          left: 16,
          child: Row(
            children: [
              GestureDetector(
                onTap: _cancelPicker,
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
                    _pickingIsPickupField
                        ? 'حرّك الخريطة لتحديد نقطة الاستلام'
                        : 'حرّك الخريطة لتحديد نقطة التسليم',
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
        ),

        Positioned(
          right: 16,
          bottom: 190,
          child: Material(
            color: Colors.white,
            shape: const CircleBorder(),
            elevation: 3,
            child: IconButton(
              tooltip: 'استخدم موقعي الحالي',
              onPressed: _isLocating ? null : _recenterPickerOnDevice,
              icon: _isLocating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(
                      Icons.my_location_rounded,
                      color: AppColors.primary,
                    ),
            ),
          ),
        ),

        Positioned(
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
                      const Icon(
                        Icons.location_pin,
                        color: Colors.grey,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _isGeocoding
                            ? Row(
                                children: const [
                                  SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Text(
                                    'جارٍ تحديد العنوان...',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              )
                            : Text(
                                _pickerAddress ?? 'حرّك الخريطة لتحديد الموقع',
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
                      onPressed: _confirmPicker,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'تأكيد الموقع',
                        style: TextStyle(
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
        ),
      ],
    );
  }
}
