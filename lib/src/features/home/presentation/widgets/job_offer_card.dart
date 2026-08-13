import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../orders/domain/truck_order.dart';

class JobOfferCard extends StatelessWidget {
  final TruckOrder order;
  final VoidCallback onTap;

  const JobOfferCard({super.key, required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheduled = order.scheduledType == 'scheduled';

    return Card(
      margin: EdgeInsets.zero,
      color: Colors.white,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: AppColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.local_shipping_rounded,
                      color: Colors.white,
                      size: 21,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.orderNumber.isEmpty
                              ? 'Delivery request'
                              : order.orderNumber,
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          order.category?.name ??
                              order.truckType?.name ??
                              'Delivery',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (scheduled)
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.amber.withAlpha(20),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'LATER',
                        style: TextStyle(
                          color: AppColors.amber,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .6,
                        ),
                      ),
                    ),
                  Text(
                    '${order.estimatedPrice ?? 0} DA',
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              _RouteLine(color: AppColors.blue, label: order.pickupAddress),
              Padding(
                padding: const EdgeInsets.only(left: 5),
                child: Container(width: 2, height: 14, color: AppColors.line),
              ),
              _RouteLine(
                color: AppColors.green,
                label: order.destinationAddress,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Icon(Icons.route_rounded, size: 16, color: AppColors.muted),
                  const SizedBox(width: 6),
                  Text(
                    order.distanceKm != null
                        ? '${order.distanceKm} km'
                        : 'Distance unavailable',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'View request',
                    style: TextStyle(
                      color: AppColors.blue,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.blue,
                    size: 19,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RouteLine extends StatelessWidget {
  final Color color;
  final String label;

  const _RouteLine({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 3),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: AppColors.ink,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    ],
  );
}
