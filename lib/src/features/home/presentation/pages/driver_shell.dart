import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../activity/presentation/pages/activity_page.dart';
import '../../../deliveries/presentation/pages/active_delivery_page.dart';
import '../../../earnings/presentation/pages/earnings_page.dart';
import '../../../orders/data/truck_repository.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import 'home_page.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  final repository = TruckRepository.instance;
  int index = 0;

  late final pages = [
    DriverHomePage(repository: repository),
    DriverActivityPage(repository: repository),
    EarningsPage(repository: repository),
    DriverProfilePage(repository: repository),
  ];

  @override
  void initState() {
    super.initState();
    repository.addListener(_refresh);
    repository.refreshDashboard();
    repository.refreshTruckProfile();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    repository.removeListener(_refresh);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Prefer an in-progress job; fall back to one already accepted but
    // scheduled for later — both need somewhere tappable, otherwise a
    // scheduled job (the default when booking from rafik-app) is accepted
    // with real coordinates but never reachable in this app.
    final bannerOrder = repository.active.isNotEmpty
        ? repository.active.first
        : (repository.scheduled.isNotEmpty ? repository.scheduled.first : null);
    final isScheduled = repository.active.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      extendBody: false,
      body: Stack(
        fit: StackFit.expand,
        clipBehavior: Clip.hardEdge,
        children: [
          IndexedStack(index: index, children: pages),
          if (bannerOrder != null)
            Positioned(
              left: 20,
              right: 20,
              bottom: 16,
              child: _ActiveDeliveryBanner(
                label: isScheduled
                    ? 'Upcoming scheduled delivery'
                    : 'Continue active delivery',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ActiveDeliveryPage(
                      repository: repository,
                      order: bannerOrder,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: _select,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.royalBlue,
        unselectedItemColor: AppColors.textSecondary,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_rounded),
            label: 'Activity',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart_rounded),
            label: 'Earnings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  void _select(int value) {
    if (value != index) setState(() => index = value);
  }
}

class _ActiveDeliveryBanner extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ActiveDeliveryBanner({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.deepNavy,
    elevation: 8,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            const Icon(Icons.navigation_rounded, color: AppColors.cyan),
            const SizedBox(width: 11),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.white70),
          ],
        ),
      ),
    ),
  );
}
