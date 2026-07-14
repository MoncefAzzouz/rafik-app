import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' show LatLng;
import '../../../core/theme/app_colors.dart';
import '../services/taxi_location_service.dart';

enum TaxiState {
  input, // Screen 1: Location & Destination Input Screen
  mapPicker, // Screen 2: Map Location Picker Screen
  rideDetails, // Screen 3: Ride Details & Vehicle Selector Screen
  searching, // Screen 4: Searching drivers with pulse animation
  driverFound, // Screen 5: Driver found success screen
}

class TaxiBookingPage extends StatefulWidget {
  const TaxiBookingPage({super.key});

  @override
  State<TaxiBookingPage> createState() => _TaxiBookingPageState();
}

class _TaxiBookingPageState extends State<TaxiBookingPage>
    with TickerProviderStateMixin {
  // Navigation & UI State
  TaxiState _currentState = TaxiState.input;
  bool _pickingSource = false; // true if picking source, false if destination

  // Real map & location state
  final MapController _mapController = MapController();
  final TaxiLocationService _locationService = TaxiLocationService();
  String _sourceAddress = "";
  String _destinationAddress = "";
  LatLng _sourceCoord = kSetifCenter;
  LatLng? _destinationCoord;
  LatLng? _userLocation;
  String? _pickerAddress;
  Timer? _geocodeDebounce;

  // Route between source and destination (OSRM, falls back to straight line)
  List<LatLng> _routePoints = [];
  double? _routeDistanceMeters;
  double? _routeDurationSeconds;

  // Address inputs controllers for simulated keyboard typing
  final TextEditingController _destinationInputController =
      TextEditingController();
  final FocusNode _destinationFocus = FocusNode();

  // Selected vehicle & payment
  String _selectedVehicle = "Classic";

  // Animation Controllers
  late AnimationController _pulseAnimationController;
  late AnimationController _pinHoverController;

  // Nearby mock taxis scattered around the user's position (no backend yet)
  List<LatLng> _nearbyTaxis = [];

  @override
  void initState() {
    super.initState();

    // Searching radar pulse controller
    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    // Pin hover float animation
    _pinHoverController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _initLocation();
  }

  @override
  void dispose() {
    _geocodeDebounce?.cancel();
    _pulseAnimationController.dispose();
    _pinHoverController.dispose();
    _destinationInputController.dispose();
    _destinationFocus.dispose();
    super.dispose();
  }

  // Locate the user via GPS (falls back to Sétif center when denied/off)
  Future<void> _initLocation() async {
    final position = await _locationService.getCurrentPosition();
    final center = position ?? kSetifCenter;
    final address = await _locationService.reverseGeocode(center);
    if (!mounted) return;
    setState(() {
      _userLocation = position;
      _sourceCoord = center;
      _sourceAddress = address;
      _scatterTaxis(center);
    });
    _mapController.move(center, 15);
  }

  // Place mock taxis at small random offsets around a point
  void _scatterTaxis(LatLng around) {
    final rng = math.Random(7);
    _nearbyTaxis = List.generate(
      5,
      (_) => LatLng(
        around.latitude + (rng.nextDouble() - 0.5) * 0.008,
        around.longitude + (rng.nextDouble() - 0.5) * 0.008,
      ),
    );
  }

  // Reverse-geocode the map center while the user pans the picker (debounced)
  void _onMapEvent(MapEvent event) {
    if (_currentState != TaxiState.mapPicker) return;
    _geocodeDebounce?.cancel();
    _geocodeDebounce = Timer(const Duration(milliseconds: 400), () async {
      final center = _mapController.camera.center;
      final address = await _locationService.reverseGeocode(center);
      if (mounted && _currentState == TaxiState.mapPicker) {
        setState(() => _pickerAddress = address);
      }
    });
  }

  // Navigate to map picker
  void _openMapPicker({required bool isSource}) {
    setState(() {
      _pickingSource = isSource;
      _currentState = TaxiState.mapPicker;
      _pickerAddress = isSource
          ? _sourceAddress
          : (_destinationAddress.isNotEmpty
                ? _destinationAddress
                : _sourceAddress);
      _destinationFocus.unfocus();
    });
    final target = isSource ? _sourceCoord : (_destinationCoord ?? _sourceCoord);
    _mapController.move(target, 16);
  }

  // Handle Map Picker Confirm
  Future<void> _confirmLocation() async {
    final pickedCoord = _mapController.camera.center;
    final address =
        _pickerAddress ?? await _locationService.reverseGeocode(pickedCoord);
    if (!mounted) return;

    setState(() {
      if (_pickingSource) {
        _sourceAddress = address;
        _sourceCoord = pickedCoord;
        _currentState = TaxiState.input;
      } else {
        _destinationAddress = address;
        _destinationCoord = pickedCoord;
        _destinationInputController.text = address;
        // If source is already chosen, we proceed to details
        _currentState = _sourceAddress.isNotEmpty
            ? TaxiState.rideDetails
            : TaxiState.input;
      }
    });

    if (!_pickingSource && _currentState == TaxiState.rideDetails) {
      await _loadRoute();
    }
  }

  // Fetch the driving route and fit the camera around it
  Future<void> _loadRoute() async {
    final destination = _destinationCoord;
    if (destination == null) return;
    final route = await _locationService.fetchRoute(_sourceCoord, destination);
    if (!mounted) return;
    setState(() {
      _routePoints = route.points;
      _routeDistanceMeters = route.distanceMeters;
      _routeDurationSeconds = route.durationSeconds;
    });
    _mapController.fitCamera(
      CameraFit.bounds(
        bounds: LatLngBounds.fromPoints([_sourceCoord, destination]),
        padding: const EdgeInsets.fromLTRB(50, 140, 50, 330),
      ),
    );
  }

  // Distance-based fare estimate in DZD (rounded to 10)
  int _priceFor(String vehicle) {
    final km = (_routeDistanceMeters ?? 3000) / 1000;
    final multiplier = vehicle == "Comfort A/C"
        ? 1.4
        : vehicle == "VIP"
        ? 2.25
        : 1.0;
    return (((100 + km * 30) * multiplier) / 10).round() * 10;
  }

  String _priceLabel(String vehicle) => "${_priceFor(vehicle)} DZD";

  // "HH:mm - N min" arrival estimate (trip duration + driver pickup wait)
  String _etaDetails(int pickupWaitMinutes) {
    final trip = Duration(
      seconds: (_routeDurationSeconds ?? 600).round() + pickupWaitMinutes * 60,
    );
    final arrival = DateTime.now().add(trip);
    final hh = arrival.hour.toString().padLeft(2, '0');
    final mm = arrival.minute.toString().padLeft(2, '0');
    return "$hh:$mm - $pickupWaitMinutes min";
  }

  // Start Searching
  void _startSearching() {
    setState(() {
      _currentState = TaxiState.searching;
    });

    // Simulate finding a driver after 3.5 seconds
    Timer(const Duration(milliseconds: 3500), () {
      if (mounted && _currentState == TaxiState.searching) {
        setState(() {
          _currentState = TaxiState.driverFound;
        });
      }
    });
  }

  // Reset/Cancel Ride
  void _cancelRide() {
    setState(() {
      _currentState = TaxiState.input;
      _destinationAddress = "";
      _destinationCoord = null;
      _destinationInputController.clear();
      _routePoints = [];
      _routeDistanceMeters = null;
      _routeDurationSeconds = null;
    });
    _mapController.move(_sourceCoord, 15);
  }

  // Recenter the map on the device's real GPS position
  Future<void> _recenterGPS() async {
    final position = await _locationService.getCurrentPosition();
    if (!mounted) return;
    if (position != null) {
      setState(() => _userLocation = position);
      _mapController.move(position, 16);
    } else {
      _mapController.move(_sourceCoord, 15);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Light status bar style
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Continuous Interactive Map Background
          Positioned.fill(child: _buildMapBackground()),

          // 2. State-dependent Overlay Views
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder: (child, animation) {
              return FadeTransition(opacity: animation, child: child);
            },
            child: _buildOverlayContent(),
          ),

          // 3. Floating Back Button (Visible in Map Picker, Details, etc.)
          if (_currentState != TaxiState.input &&
              _currentState != TaxiState.searching &&
              _currentState != TaxiState.driverFound)
            Positioned(
              top: MediaQuery.of(context).padding.top + 12,
              left: 16,
              child: FloatingActionButton.small(
                heroTag: "backBtn",
                backgroundColor: Colors.white,
                elevation: 4,
                shape: const CircleBorder(),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  color: Colors.black87,
                ),
                onPressed: () {
                  setState(() {
                    if (_currentState == TaxiState.mapPicker) {
                      _currentState = TaxiState.input;
                    } else if (_currentState == TaxiState.rideDetails) {
                      _currentState = TaxiState.input;
                    }
                  });
                },
              ),
            ),
        ],
      ),
    );
  }

  // --- MAP RENDERING ---
  Widget _buildMapBackground() {
    // In input mode, the map is hidden behind a full white overlay.
    // However, keeping it rendered underneath allows smooth transitions.
    final bool interactive =
        _currentState == TaxiState.mapPicker ||
        _currentState == TaxiState.rideDetails;
    final destination = _destinationCoord;
    final bool showRoute =
        destination != null &&
        (_currentState == TaxiState.rideDetails ||
            _currentState == TaxiState.searching ||
            _currentState == TaxiState.driverFound);

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _sourceCoord,
        initialZoom: 15,
        minZoom: 4,
        maxZoom: 19,
        interactionOptions: InteractionOptions(
          flags: interactive
              ? InteractiveFlag.all & ~InteractiveFlag.rotate
              : InteractiveFlag.none,
        ),
        onMapEvent: _onMapEvent,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.example.rafik_app',
        ),
        if (showRoute && _routePoints.isNotEmpty)
          PolylineLayer(
            polylines: [
              Polyline(
                points: _routePoints,
                strokeWidth: 10,
                color: AppColors.primary.withAlpha(45),
              ),
              Polyline(
                points: _routePoints,
                strokeWidth: 6,
                color: AppColors.primary,
              ),
            ],
          ),
        MarkerLayer(
          markers: [
            for (final taxi in _nearbyTaxis)
              Marker(
                point: taxi,
                width: 34,
                height: 34,
                child: Image.asset(
                  'assets/icons/tAxos.png',
                  fit: BoxFit.contain,
                ),
              ),
            if (_userLocation != null)
              Marker(
                point: _userLocation!,
                width: 22,
                height: 22,
                child: _buildUserLocationDot(),
              ),
            if (showRoute) ...[
              Marker(
                point: _sourceCoord,
                width: 24,
                height: 24,
                child: _buildRingPin(AppColors.cyan),
              ),
              Marker(
                point: destination,
                width: 24,
                height: 24,
                child: _buildRingPin(AppColors.primary),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildUserLocationDot() {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.electricBlue,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
      ),
    );
  }

  Widget _buildRingPin(Color color) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
      ),
      child: Center(
        child: Container(
          width: 14,
          height: 14,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
          ),
          child: Center(
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(shape: BoxShape.circle, color: color),
            ),
          ),
        ),
      ),
    );
  }

  // --- OVERLAY LAYER STATE MANAGER ---
  Widget _buildOverlayContent() {
    switch (_currentState) {
      case TaxiState.input:
        return _buildInputScreen();
      case TaxiState.mapPicker:
        return _buildMapPickerScreen();
      case TaxiState.rideDetails:
        return _buildRideDetailsScreen();
      case TaxiState.searching:
        return _buildSearchingScreen();
      case TaxiState.driverFound:
        return _buildDriverFoundScreen();
    }
  }

  // ==========================================
  // SCREEN 1: LOCATION INPUT
  // ==========================================
  Widget _buildInputScreen() {
    return Container(
      key: const ValueKey("inputScreen"),
      color: Colors.white,
      width: double.infinity,
      height: double.infinity,
      child: Column(
        children: [
          // Header section
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Colors.black87,
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                    },
                  ),
                  // "Change rider" pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppColors.primary.withAlpha(60),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      color: Colors.white,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.person_outline_rounded,
                          color: AppColors.primary,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          "Change rider",
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: AppColors.primary.withAlpha(180),
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                  // Calendar/Plus Action Icon
                  IconButton(
                    icon: const Icon(
                      Icons.calendar_today_outlined,
                      color: Colors.black87,
                    ),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),

          // Search Card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(12),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Vertical dotted connector line
                  Positioned(
                    left: 12,
                    top: 24,
                    bottom: 24,
                    child: CustomPaint(
                      painter: DottedLinePainter(),
                      child: const SizedBox(width: 2, height: 40),
                    ),
                  ),
                  Column(
                    children: [
                      // Source Field
                      GestureDetector(
                        onTap: () => _openMapPicker(isSource: true),
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          children: [
                            Container(
                              width: 26,
                              alignment: Alignment.center,
                              child: Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.cyan,
                                    width: 3,
                                  ),
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    "Pickup location",
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _sourceAddress.isNotEmpty
                                        ? _sourceAddress
                                        : "Select pickup location",
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.my_location_rounded,
                              color: AppColors.primary,
                              size: 18,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFEEEEEE)),
                      const SizedBox(height: 12),
                      // Destination Field
                      Row(
                        children: [
                          Container(
                            width: 26,
                            alignment: Alignment.center,
                            child: Container(
                              width: 14,
                              height: 14,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: TextField(
                              controller: _destinationInputController,
                              focusNode: _destinationFocus,
                              readOnly: true, // Navigate to map picker on click
                              onTap: () => _openMapPicker(isSource: false),
                              style: const TextStyle(
                                color: Colors.black87,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: const InputDecoration(
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                                border: InputBorder.none,
                                hintText: "Enter your destination",
                                hintStyle: TextStyle(
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _openMapPicker(isSource: false),
                            child: const Icon(
                              Icons.add_rounded,
                              color: AppColors.primary,
                              size: 22,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Recent locations / history
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              children: [
                _buildHistoryRow(
                  "Sétif",
                  "Sétif, Sétif, Algérie",
                  kSetifCenter,
                ),
                const Padding(
                  padding: EdgeInsets.only(left: 48),
                  child: Divider(height: 1, color: Color(0xFFEEEEEE)),
                ),
                _buildHistoryRow(
                  "Aïn Arnat",
                  "Aïn Arnat, Sétif, Algérie",
                  const LatLng(36.1866, 5.3126),
                ),
                const Padding(
                  padding: EdgeInsets.only(left: 48),
                  child: Divider(height: 1, color: Color(0xFFEEEEEE)),
                ),
              ],
            ),
          ),

          // Select location on the map bottom bar
          GestureDetector(
            onTap: () => _openMapPicker(isSource: false),
            child: Container(
              width: double.infinity,
              height: 56,
              color: const Color(0xFFEFF5FF),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map_outlined, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    "Select location on the map",
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryRow(String title, String subtitle, LatLng coord) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.history_rounded, color: Colors.red, size: 18),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 15,
          color: Colors.black87,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(color: Colors.grey, fontSize: 12),
      ),
      onTap: () {
        setState(() {
          _destinationAddress = subtitle;
          _destinationCoord = coord;
          _destinationInputController.text = subtitle;
          _currentState = TaxiState.rideDetails;
        });
        _loadRoute();
      },
    );
  }

  // ==========================================
  // SCREEN 2: MAP LOCATION PICKER
  // ==========================================
  Widget _buildMapPickerScreen() {
    final String currentAddress = _pickerAddress ?? "Sétif, Algérie";

    return Container(
      key: const ValueKey("mapPickerScreen"),
      child: Stack(
        children: [
          // Center Pin Widget
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 38), // Pin tip is centered
              child: AnimatedBuilder(
                animation: _pinHoverController,
                builder: (context, child) {
                  // Hover displacement
                  final double hoverOffset = _pinHoverController.value * 6;
                  return Stack(
                    alignment: Alignment.bottomCenter,
                    clipBehavior: Clip.none,
                    children: [
                      // Pin Shadow
                      Positioned(
                        bottom: -4,
                        child: Container(
                          width: 14,
                          height: 6,
                          decoration: BoxDecoration(
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(70),
                                blurRadius: 4,
                                spreadRadius: 1,
                              ),
                            ],
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      // The Pin SVG/Vector
                      Transform.translate(
                        offset: Offset(0, -hoverOffset),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Speech bubble above pin
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.deepNavy,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(50),
                                    blurRadius: 10,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  const Text(
                                    "Move the map to specify your location.",
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    currentAddress,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Small triangle connector below bubble
                            CustomPaint(
                              painter: TrianglePainter(),
                              child: const SizedBox(width: 12, height: 8),
                            ),
                            const SizedBox(height: 4),
                            // Map Pin Icon
                            Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 6,
                                    offset: Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.location_on_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),

          // Floating Top Search Bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 72, // Leave room for back button
            right: 16,
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(20),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const SizedBox(width: 14),
                  const Icon(
                    Icons.search_rounded,
                    color: Colors.grey,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      currentAddress,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 14),
                ],
              ),
            ),
          ),

          // Floating GPS Recenter FAB
          Positioned(
            bottom: 120,
            right: 16,
            child: FloatingActionButton(
              heroTag: "gpsBtn",
              backgroundColor: Colors.white,
              elevation: 4,
              shape: const CircleBorder(),
              onPressed: _recenterGPS,
              child: const Icon(
                Icons.my_location_rounded,
                color: AppColors.cyan,
              ),
            ),
          ),

          // Confirm Button Bottom Panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 15,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _confirmLocation,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      "Confirm",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // SCREEN 3: RIDE DETAILS & VEHICLES
  // ==========================================
  Widget _buildRideDetailsScreen() {
    return Container(
      key: const ValueKey("rideDetailsScreen"),
      child: Stack(
        children: [
          // Top Summary Route Display Card
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 72,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(20),
                    blurRadius: 12,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Stack(
                      alignment: Alignment.centerLeft,
                      children: [
                        Positioned(
                          left: 4,
                          top: 14,
                          bottom: 14,
                          child: Container(
                            width: 1,
                            color: Colors.grey.shade300,
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 9,
                                  height: 9,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: AppColors.cyan,
                                      width: 2,
                                    ),
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _sourceAddress,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Container(
                                  width: 9,
                                  height: 9,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _destinationAddress,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Edit Button
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _currentState = TaxiState.input;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.edit_outlined,
                        color: Colors.black54,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Coupon percentage overlay on the right
          Positioned(
            top: MediaQuery.of(context).padding.top + 100,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.percent_rounded,
                color: AppColors.primary,
                size: 20,
              ),
            ),
          ),

          // Bottom Sheet: Ride options & pricing
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 18,
                    offset: Offset(0, -6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag indicator
                  const SizedBox(height: 10),
                  Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Swipe up to view all our vehicles",
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Vehicle options list
                  SizedBox(
                    height: 110,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        _buildVehicleCard(
                          "Classic",
                          _priceLabel("Classic"),
                          _etaDetails(3),
                          3,
                          AppColors.primary,
                        ),
                        _buildVehicleCard(
                          "Comfort A/C",
                          _priceLabel("Comfort A/C"),
                          _etaDetails(5),
                          4,
                          AppColors.electricBlue,
                          isAC: true,
                        ),
                        _buildVehicleCard(
                          "VIP",
                          _priceLabel("VIP"),
                          _etaDetails(7),
                          4,
                          const Color(0xFF37474F),
                          isVIP: true,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Request Button
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _startSearching,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          "Request $_selectedVehicle",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(
    String name,
    String price,
    String details,
    int capacity,
    Color carColor, {
    bool isAC = false,
    bool isVIP = false,
  }) {
    final bool isSelected = _selectedVehicle == name;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedVehicle = name;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF5FF) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade200,
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(20),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Vehicle Visual (Vector Drawn custom representation)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 56,
                  height: 36,
                  child: Image.asset(
                    'assets/icons/tAxos.png',
                    fit: BoxFit.contain,
                  ),
                ),
                Text(
                  price,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.info_outline_rounded,
                      color: Colors.grey,
                      size: 12,
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(
                      Icons.access_time_rounded,
                      color: Colors.grey,
                      size: 10,
                    ),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(
                        details,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 9,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.person_rounded,
                      color: Colors.grey,
                      size: 10,
                    ),
                    Text(
                      "$capacity",
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 9,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // SCREEN 4: SEARCHING DRIVERS
  // ==========================================
  Widget _buildSearchingScreen() {
    return Container(
      key: const ValueKey("searchingScreen"),
      color: Colors.black.withAlpha(120), // Translucent black overlay
      child: Stack(
        children: [
          // Center Pulsing Radar
          Center(
            child: AnimatedBuilder(
              animation: _pulseAnimationController,
              builder: (context, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Pulse
                    Container(
                      width: 180 + (_pulseAnimationController.value * 120),
                      height: 180 + (_pulseAnimationController.value * 120),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary.withAlpha(
                          (40 * (1.0 - _pulseAnimationController.value))
                              .toInt(),
                        ),
                      ),
                    ),
                    // Inner Pulse
                    Container(
                      width: 100 + (_pulseAnimationController.value * 80),
                      height: 100 + (_pulseAnimationController.value * 80),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary.withAlpha(
                          (70 * (1.0 - _pulseAnimationController.value))
                              .toInt(),
                        ),
                      ),
                    ),
                    // Center Core
                    Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary,
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.local_taxi_rounded,
                          color: Colors.white,
                          size: 38,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Bottom card
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 15,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Searching for nearby drivers...",
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "$_selectedVehicle • ${_priceLabel(_selectedVehicle)}",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const LinearProgressIndicator(
                    color: AppColors.primary,
                    backgroundColor: Color(0xFFEFF5FF),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton(
                      onPressed: _cancelRide,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: Colors.red.shade200,
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        "Cancel request",
                        style: TextStyle(
                          color: Colors.red,
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
        ],
      ),
    );
  }

  // ==========================================
  // SCREEN 5: DRIVER FOUND SUCCESS
  // ==========================================
  Widget _buildDriverFoundScreen() {
    return Container(
      key: const ValueKey("driverFoundScreen"),
      color: Colors.black.withAlpha(70),
      child: Stack(
        children: [
          // Driver bottom sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black38,
                    blurRadius: 20,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Success Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.check_circle_rounded,
                              color: Colors.green,
                              size: 16,
                            ),
                            SizedBox(width: 6),
                            Text(
                              "Driver found!",
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Driver Details
                  Row(
                    children: [
                      // Driver Profile Avatar
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFEFF5FF),
                          border: Border.all(
                            color: AppColors.primary.withAlpha(50),
                            width: 2,
                          ),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.person_rounded,
                            color: AppColors.primary,
                            size: 32,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Ahmed",
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 17,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                Icon(
                                  Icons.star_rounded,
                                  color: Colors.amber.shade700,
                                  size: 15,
                                ),
                                const SizedBox(width: 3),
                                const Text(
                                  "4.9 • 1,240 trips",
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              "16-342-0193",
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            "White Hyundai Accent",
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  const SizedBox(height: 16),

                  // ETA & Cost row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Estimated Arrival",
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            "3 mins away",
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            "Cost of Ride",
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            _priceLabel(_selectedVehicle),
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Actions row
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 50,
                          child: ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.message_rounded, size: 18),
                            label: const Text(
                              "Message",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SizedBox(
                          height: 50,
                          child: OutlinedButton.icon(
                            onPressed: _cancelRide,
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 18,
                              color: Colors.red,
                            ),
                            label: const Text(
                              "Cancel Ride",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.red.shade100),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// CUSTOM PAINTERS & DETAILS
// ==========================================

// Custom Painter for drawing a dotted connector line
class DottedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.grey.shade400
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    const double dashHeight = 4.0;
    const double dashSpace = 4.0;
    double startY = 0;

    while (startY < size.height) {
      canvas.drawLine(
        Offset(size.width / 2, startY),
        Offset(size.width / 2, startY + dashHeight),
        paint,
      );
      startY += dashHeight + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Custom Painter for drawing speech bubble pointer triangle
class TrianglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = AppColors.deepNavy
      ..style = PaintingStyle.fill;

    final Path path = Path();
    path.moveTo(0, 0);
    path.lineTo(size.width, 0);
    path.lineTo(size.width / 2, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
