import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/driver_map.dart';
import '../../data/delivery_repository.dart';
import '../../domain/delivery_job.dart';

class ActiveDeliveryPage extends StatelessWidget {
  final DeliveryRepository repository;

  const ActiveDeliveryPage({super.key, required this.repository});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: repository,
      builder: (context, _) {
        final job = repository.activeJob;
        if (job == null) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.green,
                    size: 80,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Delivery completed!',
                    style: TextStyle(
                      color: AppColors.ink,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Great work. Your earnings were updated.',
                    style: TextStyle(color: AppColors.muted),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: 220,
                    child: FilledButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Back to home'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        final goingToPickup = job.status == DeliveryStatus.accepted;
        return Scaffold(
          body: Stack(
            children: [
              Positioned.fill(
                child: DriverMap(
                  online: repository.isOnline,
                  borderRadius: BorderRadius.zero,
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Align(
                    alignment: Alignment.topLeft,
                    child: Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      elevation: 3,
                      child: IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                    ),
                  ),
                ),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  padding: EdgeInsets.fromLTRB(
                    22,
                    16,
                    22,
                    20 + MediaQuery.paddingOf(context).bottom,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(30),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 5,
                          decoration: BoxDecoration(
                            color: AppColors.line,
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        _stageLabel(job.status),
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .8,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        goingToPickup ? job.pickupName : job.destinationName,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 23,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        goingToPickup
                            ? job.pickupAddress
                            : job.destinationAddress,
                        style: const TextStyle(color: AppColors.muted),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          _action(
                            Icons.navigation_rounded,
                            'Navigate',
                            onTap: () => _navigate(context, job),
                          ),
                          const SizedBox(width: 10),
                          _action(Icons.call_rounded, 'Call', onTap: () {}),
                          const SizedBox(width: 10),
                          _action(
                            Icons.chat_bubble_outline_rounded,
                            'Message',
                            onTap: () {},
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: repository.advanceActiveJob,
                        child: Text(_buttonLabel(job.status)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _action(IconData icon, String label, {required VoidCallback onTap}) =>
      Expanded(
        child: Material(
          color: AppColors.canvas,
          borderRadius: BorderRadius.circular(15),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(15),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                children: [
                  Icon(icon, color: AppColors.navy, size: 21),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

  Future<void> _navigate(BuildContext context, DeliveryJob job) async {
    final destination = job.status == DeliveryStatus.accepted
        ? job.pickupPoint
        : job.destinationPoint;
    final uri = Uri.https('www.google.com', '/maps/dir/', {
      'api': '1',
      'destination': '${destination.latitude},${destination.longitude}',
      'travelmode': 'driving',
    });
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open navigation.')),
      );
    }
  }

  String _stageLabel(DeliveryStatus status) => switch (status) {
    DeliveryStatus.accepted => 'DRIVE TO PICKUP',
    DeliveryStatus.pickedUp => 'PACKAGE COLLECTED',
    DeliveryStatus.delivering => 'DRIVE TO DROP-OFF',
    _ => 'DELIVERY',
  };

  String _buttonLabel(DeliveryStatus status) => switch (status) {
    DeliveryStatus.accepted => 'Confirm package pickup',
    DeliveryStatus.pickedUp => 'Start delivery',
    DeliveryStatus.delivering => 'Complete delivery',
    _ => 'Continue',
  };
}
