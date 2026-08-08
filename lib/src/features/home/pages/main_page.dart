import 'dart:ui';

import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import 'home_page.dart';
import 'offers_page.dart';
import 'activities_page.dart';
import '../../profile/pages/profile_page.dart';
import '../../parcel_transport/data/parcel_order_repository.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;
  final _parcelOrders = ParcelOrderRepository.instance;

  final List<Widget> _pages = [
    const HomePage(),
    const OffersPage(),
    const ActivitiesPage(),
    const ProfilePage(),
  ];

  @override
  void initState() {
    super.initState();
    _parcelOrders.addListener(_onOrdersChanged);
  }

  void _onOrdersChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _parcelOrders.removeListener(_onOrdersChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        return Scaffold(
          backgroundColor: AppColors.backgroundLight,
          extendBody: true,
          body: IndexedStack(index: _currentIndex, children: _pages),
          bottomNavigationBar: SafeArea(
            top: false,
            minimum: const EdgeInsets.only(bottom: 12),
            child: Container(
              height: 72,
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(22),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
                borderRadius: BorderRadius.circular(40),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(178),
                      border: Border.all(color: Colors.white.withAlpha(180)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Expanded(
                          child: _buildNavItem(label: s.navHome, index: 0),
                        ),
                        Expanded(
                          child: _buildNavItem(label: s.navPromos, index: 1),
                        ),
                        Expanded(
                          child: _buildNavItem(
                            label: s.navActivities,
                            index: 2,
                          ),
                        ),
                        Expanded(
                          child: _buildNavItem(label: s.navProfile, index: 3),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  int _getActivityCount() {
    // Scheduled items from activities data + active parcel orders
    return ActivitiesPage.scheduledCount + _parcelOrders.activeCount;
  }

  Widget _buildNavItem({required String label, required int index}) {
    final isActive = _currentIndex == index;
    final count = index == 2 ? _getActivityCount() : 0;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: EdgeInsets.symmetric(
          vertical: isActive ? 7 : 10,
          horizontal: 4,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primary.withAlpha(30)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                _buildNavIcon(index, isActive),
                if (count > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFF3B30),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        count > 9 ? '9+' : '$count',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: isActive ? AppColors.primary : AppColors.textSecondary,
                fontSize: 10,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavIcon(int index, bool isActive) {
    final color = isActive ? AppColors.primary : AppColors.textSecondary;

    if (index == 0) {
      return SizedBox(
        width: 30,
        height: 30,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(Icons.home_rounded, color: color, size: 30),
            if (isActive)
              Positioned(
                bottom: 8,
                child: Container(
                  width: 5,
                  height: 7,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(1.2),
                  ),
                ),
              ),
          ],
        ),
      );
    }

    if (index == 1) {
      return Icon(Icons.new_releases_outlined, color: color, size: 30);
    }

    final icons = [
      Icons.home_rounded,
      Icons.new_releases_outlined,
      Icons.receipt_long_outlined,
      Icons.person_outline_rounded,
    ];

    return Icon(icons[index], color: color, size: 30);
  }
}
