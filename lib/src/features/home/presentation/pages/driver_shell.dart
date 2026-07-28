import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../activity/presentation/pages/activity_page.dart';
import '../../../deliveries/data/delivery_repository.dart';
import '../../../deliveries/presentation/pages/active_delivery_page.dart';
import '../../../earnings/presentation/pages/earnings_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import 'home_page.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  final repository = DeliveryRepository.instance;
  int index = 0;

  late final pages = [
    DriverHomePage(repository: repository),
    DriverActivityPage(repository: repository),
    EarningsPage(repository: repository),
    const DriverProfilePage(),
  ];

  @override
  void initState() {
    super.initState();
    repository.addListener(_refresh);
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
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.backgroundLight,
    extendBody: true,
    body: Stack(
      children: [
        IndexedStack(index: index, children: pages),
        if (repository.activeJob != null)
          Positioned(
            left: 20,
            right: 20,
            bottom: 104,
            child: _ActiveDeliveryBanner(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ActiveDeliveryPage(repository: repository),
                ),
              ),
            ),
          ),
      ],
    ),
    bottomNavigationBar: SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: 12),
      child: Container(
        height: 72,
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: AppColors.deepNavy.withAlpha(24),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            _NavItem(
              label: 'Home',
              icon: Icons.home_rounded,
              selected: index == 0,
              onTap: () => _select(0),
            ),
            _NavItem(
              label: 'Activity',
              icon: Icons.receipt_long_rounded,
              selected: index == 1,
              onTap: () => _select(1),
            ),
            _NavItem(
              label: 'Earnings',
              icon: Icons.bar_chart_rounded,
              selected: index == 2,
              onTap: () => _select(2),
            ),
            _NavItem(
              label: 'Profile',
              icon: Icons.person_rounded,
              selected: index == 3,
              onTap: () => _select(3),
            ),
          ],
        ),
      ),
    ),
  );

  void _select(int value) {
    if (value != index) setState(() => index = value);
  }
}

class _NavItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      selected: selected,
      button: true,
      label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(30),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 8),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.royalBlue.withAlpha(26)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 27,
                color: selected ? AppColors.royalBlue : AppColors.textSecondary,
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected
                      ? AppColors.royalBlue
                      : AppColors.textSecondary,
                  fontSize: 10,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _ActiveDeliveryBanner extends StatelessWidget {
  final VoidCallback onTap;

  const _ActiveDeliveryBanner({required this.onTap});

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.deepNavy,
    elevation: 8,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Icon(Icons.navigation_rounded, color: AppColors.cyan),
            SizedBox(width: 11),
            Expanded(
              child: Text(
                'Continue active delivery',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: Colors.white70),
          ],
        ),
      ),
    ),
  );
}
