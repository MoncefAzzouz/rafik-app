import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../deliveries/data/delivery_repository.dart';
import '../../../deliveries/domain/delivery_job.dart';
import '../../../deliveries/presentation/pages/active_delivery_page.dart';

class DriverActivityPage extends StatefulWidget {
  final DeliveryRepository repository;

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
              currentCount: widget.repository.activeJob == null ? 0 : 1,
              onSelected: (value) => setState(() => selectedTab = value),
            ),
          ),
          Expanded(
            child: IndexedStack(
              index: selectedTab,
              children: [
                _CurrentActivity(repository: widget.repository),
                const _HistoryActivity(),
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
  final DeliveryRepository repository;

  const _CurrentActivity({required this.repository});

  @override
  Widget build(BuildContext context) {
    final job = repository.activeJob;
    if (job == null) {
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
            'Go online from Home and accept a parcel request. It will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.muted, height: 1.4),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
      children: [
        Container(
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
                    job.id,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  _StatusChip(status: job.status),
                ],
              ),
              const SizedBox(height: 18),
              _location(
                Icons.storefront_rounded,
                job.pickupName,
                job.pickupAddress,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 17),
                child: Container(width: 2, height: 24, color: AppColors.line),
              ),
              _location(
                Icons.location_on_rounded,
                job.destinationName,
                job.destinationAddress,
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Text(
                    '${job.payoutDzd} DA',
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${job.tripKm} km · ${job.estimatedMinutes} min',
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
                    builder: (_) => ActiveDeliveryPage(repository: repository),
                  ),
                ),
                child: const Text('Continue delivery'),
              ),
            ],
          ),
        ),
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
              style: const TextStyle(
                color: AppColors.ink,
                fontWeight: FontWeight.w800,
              ),
            ),
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
  final DeliveryStatus status;

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
        DeliveryStatus.accepted => 'To pickup',
        DeliveryStatus.pickedUp => 'Picked up',
        DeliveryStatus.delivering => 'Delivering',
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
  const _HistoryActivity();

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
    children: [
      _day('Today · July 28', [
        _item(
          'RF-4768',
          'Park Mall → El Hidhab',
          'Completed · 10:42',
          '690 DA',
        ),
        _item(
          'RF-4759',
          'Sétif Centre → Aïn Arnat',
          'Completed · 09:16',
          '1,050 DA',
        ),
        _item(
          'RF-4744',
          'El Bez → Sétif Centre',
          'Completed · 08:21',
          '720 DA',
        ),
      ]),
      const SizedBox(height: 22),
      _day('Yesterday · July 27', [
        _item(
          'RF-4692',
          'Zone Industrielle → El Eulma',
          'Completed · 17:50',
          '2,480 DA',
        ),
        _item(
          'RF-4681',
          'Aïn Arnat → Park Mall',
          'Cancelled · 15:03',
          '0 DA',
          cancelled: true,
        ),
        _item(
          'RF-4660',
          'Sétif Centre → El Bez',
          'Completed · 11:37',
          '830 DA',
        ),
      ]),
    ],
  );

  Widget _day(String title, List<Widget> children) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: const TextStyle(
          color: AppColors.ink,
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      ),
      const SizedBox(height: 10),
      ...children,
    ],
  );

  Widget _item(
    String id,
    String route,
    String status,
    String amount, {
    bool cancelled = false,
  }) => Container(
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
            color: (cancelled ? AppColors.red : AppColors.green).withAlpha(18),
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
                route,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                '$id · $status',
                style: const TextStyle(color: AppColors.muted, fontSize: 11),
              ),
            ],
          ),
        ),
        Text(
          amount,
          style: const TextStyle(
            color: AppColors.ink,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    ),
  );
}
