import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../deliveries/presentation/pages/active_delivery_page.dart';
import '../../../orders/data/truck_repository.dart';
import '../../../orders/domain/truck_order.dart';

class DriverActivityPage extends StatefulWidget {
  final TruckRepository repository;

  const DriverActivityPage({super.key, required this.repository});

  @override
  State<DriverActivityPage> createState() => _DriverActivityPageState();
}

class _DriverActivityPageState extends State<DriverActivityPage> {
  int selectedTab = 0;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.repository,
    builder: (context, _) => SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 22, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Activity',
                  style: TextStyle(
                    color: AppColors.ink,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Manage current work and delivery history',
                  style: TextStyle(color: AppColors.muted),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 14),
            child: _ActivityTabBar(
              selectedIndex: selectedTab,
              currentCount: widget.repository.active.length,
              onSelected: (value) => setState(() => selectedTab = value),
            ),
          ),
          Expanded(
            child: IndexedStack(
              index: selectedTab,
              children: [
                _CurrentActivity(repository: widget.repository),
                _HistoryActivity(repository: widget.repository),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _ActivityTabBar extends StatelessWidget {
  final int selectedIndex;
  final int currentCount;
  final ValueChanged<int> onSelected;

  const _ActivityTabBar({
    required this.selectedIndex,
    required this.currentCount,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) => Container(
    height: 52,
    padding: const EdgeInsets.all(5),
    decoration: BoxDecoration(
      color: const Color(0xFFEFF3F7),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Row(
      children: [
        _tab('Current', 0, badge: currentCount),
        _tab('History', 1),
      ],
    ),
  );

  Widget _tab(String label, int index, {int badge = 0}) {
    final selected = selectedIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () => onSelected(index),
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            boxShadow: selected
                ? const [BoxShadow(color: Color(0x14021B63), blurRadius: 10)]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: selected
                      ? AppColors.royalBlue
                      : AppColors.textSecondary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 7),
                Container(
                  width: 19,
                  height: 19,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.royalBlue,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CurrentActivity extends StatelessWidget {
  final TruckRepository repository;

  const _CurrentActivity({required this.repository});

  @override
  Widget build(BuildContext context) {
    final orders = repository.active;
    if (orders.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(20, 40, 20, 120),
        children: const [
          Icon(
            Icons.inventory_2_outlined,
            color: AppColors.royalBlue,
            size: 62,
          ),
          SizedBox(height: 18),
          Text(
            'No active delivery',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.ink,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 7),
          Text(
            'Go online from Home and accept a delivery request. It will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.muted, height: 1.4),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
      children: [
        for (final order in orders) ...[
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.royalBlue.withAlpha(35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.orderNumber,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    _StatusChip(status: order.status),
                  ],
                ),
                const SizedBox(height: 18),
                _location(
                  Icons.storefront_rounded,
                  order.pickupAddress,
                  order.pickupWilaya ?? '',
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 17),
                  child: Container(width: 2, height: 24, color: AppColors.line),
                ),
                _location(
                  Icons.location_on_rounded,
                  order.destinationAddress,
                  order.destinationWilaya ?? '',
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Text(
                      '${order.agreedPrice ?? order.estimatedPrice ?? 0} DA',
                      style: const TextStyle(
                        color: AppColors.green,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    if (order.distanceKm != null)
                      Text(
                        '${order.distanceKm} km',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ActiveDeliveryPage(
                        repository: repository,
                        order: order,
                      ),
                    ),
                  ),
                  child: const Text('Continue delivery'),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _location(IconData icon, String title, String subtitle) => Row(
    children: [
      Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.royalBlue.withAlpha(18),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.royalBlue, size: 19),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: AppColors.royalBlue.withAlpha(18),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      switch (status) {
        TruckOrderStatus.accepted => 'To pickup',
        TruckOrderStatus.arrived => 'Arrived',
        TruckOrderStatus.loading => 'Loading',
        TruckOrderStatus.inTransit => 'In transit',
        _ => 'Active',
      },
      style: const TextStyle(
        color: AppColors.royalBlue,
        fontSize: 11,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

class _HistoryActivity extends StatelessWidget {
  final TruckRepository repository;

  const _HistoryActivity({required this.repository});

  @override
  Widget build(BuildContext context) {
    final orders = repository.completed;
    if (orders.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(20, 40, 20, 120),
        children: const [
          Icon(Icons.history_rounded, color: AppColors.royalBlue, size: 62),
          SizedBox(height: 18),
          Text(
            'No delivery history yet',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.ink,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 7),
          Text(
            'Completed and cancelled deliveries will show up here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.muted, height: 1.4),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
      children: [for (final order in orders) _item(order)],
    );
  }

  Widget _item(TruckOrder order) {
    final cancelled = order.status.startsWith('cancelled');
    final statusLabel = switch (order.status) {
      TruckOrderStatus.delivered => 'Completed',
      TruckOrderStatus.cancelledByClient => 'Cancelled by client',
      TruckOrderStatus.cancelledByDriver => 'Cancelled by you',
      TruckOrderStatus.cancelledByAdmin => 'Cancelled by admin',
      _ => order.status,
    };
    final timestamp = order.deliveredAt ?? order.cancelledAt ?? order.createdAt;
    final timeLabel = timestamp != null
        ? '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}'
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: (cancelled ? AppColors.red : AppColors.green).withAlpha(
                18,
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              cancelled ? Icons.close_rounded : Icons.check_rounded,
              color: cancelled ? AppColors.red : AppColors.green,
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${order.pickupAddress} → ${order.destinationAddress}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${order.orderNumber} · $statusLabel${timeLabel.isNotEmpty ? ' · $timeLabel' : ''}',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
          Text(
            '${cancelled ? 0 : order.driverEarnings ?? order.agreedPrice ?? order.estimatedPrice ?? 0} DA',
            style: const TextStyle(
              color: AppColors.ink,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}
