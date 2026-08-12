import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/driver_map.dart';
import '../../../orders/data/truck_repository.dart';
import '../../../orders/domain/truck_order.dart';

class ActiveDeliveryPage extends StatefulWidget {
  final TruckRepository repository;
  final TruckOrder order;

  const ActiveDeliveryPage({
    super.key,
    required this.repository,
    required this.order,
  });

  @override
  State<ActiveDeliveryPage> createState() => _ActiveDeliveryPageState();
}

class _ActiveDeliveryPageState extends State<ActiveDeliveryPage> {
  bool _isSubmitting = false;

  TruckRepository get repository => widget.repository;

  /// Finds the freshest copy of the order we're tracking from the
  /// repository's `active` list (falls back to the widget's order if it has
  /// since left that list, e.g. right after completing/cancelling).
  TruckOrder? _currentOrder() {
    for (final order in repository.active) {
      if (order.id == widget.order.id) return order;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: repository,
      builder: (context, _) {
        final order = _currentOrder();
        if (order == null) {
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
        final goingToPickup = order.status == TruckOrderStatus.accepted;
        return Scaffold(
          body: Stack(
            children: [
              Positioned.fill(
                child: DriverMap(
                  online: repository.online,
                  borderRadius: BorderRadius.zero,
                  activeOrder: order,
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
                        _stageLabel(order.status),
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .8,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        goingToPickup
                            ? order.pickupAddress
                            : order.destinationAddress,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 23,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        goingToPickup
                            ? [order.pickupWilaya, order.pickupCommune]
                                  .whereType<String>()
                                  .join(', ')
                            : order.destinationWilaya ?? '',
                        style: const TextStyle(color: AppColors.muted),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          _action(
                            Icons.navigation_rounded,
                            'Navigate',
                            onTap: () => _navigate(context, order),
                          ),
                          const SizedBox(width: 10),
                          _action(
                            Icons.call_rounded,
                            'Call',
                            onTap: () => _call(context, order),
                          ),
                          const SizedBox(width: 10),
                          _action(
                            Icons.chat_bubble_outline_rounded,
                            'Message',
                            onTap: null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: _isSubmitting
                            ? null
                            : () => _advance(context, order),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                  color: Colors.white,
                                ),
                              )
                            : Text(_buttonLabel(order.status)),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: _isSubmitting
                            ? null
                            : () => _confirmCancel(context, order),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.red,
                        ),
                        child: const Text('Cancel delivery'),
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

  Widget _action(
    IconData icon,
    String label, {
    required VoidCallback? onTap,
  }) => Expanded(
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
              Icon(
                icon,
                color: onTap == null ? AppColors.muted : AppColors.navy,
                size: 21,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: onTap == null ? AppColors.muted : AppColors.ink,
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

  Future<void> _navigate(BuildContext context, TruckOrder order) async {
    final url = order.maps.directionsUrl;
    if (url == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('No route available.')));
      return;
    }
    final uri = Uri.parse(url);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open navigation.')),
      );
    }
  }

  Future<void> _call(BuildContext context, TruckOrder order) async {
    final phone = order.clientPhone;
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No phone number available.')),
      );
      return;
    }
    final uri = Uri.parse('tel:$phone');
    final opened = await launchUrl(uri);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not place call.')));
    }
  }

  Future<void> _advance(BuildContext context, TruckOrder order) async {
    setState(() => _isSubmitting = true);
    final action = switch (order.status) {
      TruckOrderStatus.accepted => repository.markArrived,
      TruckOrderStatus.arrived => repository.markLoading,
      TruckOrderStatus.loading => repository.startTransit,
      TruckOrderStatus.inTransit => repository.completeOrder,
      _ => null,
    };
    if (action == null) {
      setState(() => _isSubmitting = false);
      return;
    }
    final result = await action(order.id);
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    result.fold(
      onSuccess: (_) {},
      onFailure: (failure) => ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(failure.message))),
    );
  }

  Future<void> _confirmCancel(BuildContext context, TruckOrder order) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) {
        final controller = TextEditingController();
        return AlertDialog(
          title: const Text('Cancel this delivery?'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'Reason (optional)',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Keep delivery'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.red),
              onPressed: () => Navigator.pop(dialogContext, controller.text),
              child: const Text('Cancel delivery'),
            ),
          ],
        );
      },
    );
    if (reason == null || !mounted) return;

    setState(() => _isSubmitting = true);
    final result = await repository.cancelOrder(
      order.id,
      reason: reason.trim().isEmpty ? null : reason.trim(),
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    result.fold(
      onSuccess: (_) {},
      onFailure: (failure) => ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(failure.message))),
    );
  }

  String _stageLabel(String status) => switch (status) {
    TruckOrderStatus.accepted => 'DRIVE TO PICKUP',
    TruckOrderStatus.arrived => 'ARRIVED AT PICKUP',
    TruckOrderStatus.loading => 'LOADING',
    TruckOrderStatus.inTransit => 'DRIVE TO DROP-OFF',
    _ => 'DELIVERY',
  };

  String _buttonLabel(String status) => switch (status) {
    TruckOrderStatus.accepted => 'Mark arrived',
    TruckOrderStatus.arrived => 'Start loading',
    TruckOrderStatus.loading => 'Start delivery',
    TruckOrderStatus.inTransit => 'Mark delivered',
    _ => 'Continue',
  };
}
