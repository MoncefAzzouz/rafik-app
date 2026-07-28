import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/driver_location.dart';

class LocationPickerPage extends StatefulWidget {
  final DriverLocation initialLocation;

  const LocationPickerPage({super.key, required this.initialLocation});

  @override
  State<LocationPickerPage> createState() => _LocationPickerPageState();
}

class _LocationPickerPageState extends State<LocationPickerPage> {
  final mapController = MapController();
  late LatLng selectedPoint = widget.initialLocation.coordinates;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Stack(
      children: [
        Positioned.fill(
          child: FlutterMap(
            mapController: mapController,
            options: MapOptions(
              initialCenter: selectedPoint,
              initialZoom: 15,
              minZoom: 4,
              maxZoom: 19,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
              onPositionChanged: (camera, hasGesture) {
                if (hasGesture) selectedPoint = camera.center;
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'dz.rafik.driver',
              ),
            ],
          ),
        ),
        const Center(
          child: Padding(
            padding: EdgeInsets.only(bottom: 42),
            child: Icon(
              Icons.location_on_rounded,
              color: AppColors.royalBlue,
              size: 52,
              shadows: [Shadow(color: Colors.black26, blurRadius: 10)],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _roundButton(
                  icon: Icons.arrow_back_rounded,
                  onPressed: () => Navigator.pop(context),
                ),
                _roundButton(
                  icon: Icons.my_location_rounded,
                  onPressed: _useGps,
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            padding: EdgeInsets.fromLTRB(
              20,
              18,
              20,
              18 + MediaQuery.paddingOf(context).bottom,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choose your work location',
                  style: TextStyle(
                    color: AppColors.ink,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Move the map until the pin is at the location you want.',
                  style: TextStyle(color: AppColors.muted),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _confirm,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.royalBlue,
                  ),
                  child: const Text('Confirm location'),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  Widget _roundButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 4,
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon, color: AppColors.deepNavy),
      ),
    );
  }

  Future<void> _useGps() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) _showMessage('Location permission is required.');
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      selectedPoint = LatLng(position.latitude, position.longitude);
      mapController.move(selectedPoint, 16);
    } catch (_) {
      if (mounted) _showMessage('Unable to read your current location.');
    }
  }

  void _confirm() {
    final latitude = selectedPoint.latitude.toStringAsFixed(4);
    final longitude = selectedPoint.longitude.toStringAsFixed(4);
    Navigator.pop(
      context,
      DriverLocation(
        label: 'Selected location',
        subtitle: '$latitude, $longitude',
        coordinates: selectedPoint,
      ),
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}
