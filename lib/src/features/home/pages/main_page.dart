import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'home_page.dart';
import 'offers_page.dart';
import 'activities_page.dart';
import '../../profile/pages/profile_page.dart';
import '../../parcel_transport/pages/parcel_dashboard_page.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const OffersPage(),
    const ActivitiesPage(),
    const ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      extendBody: true, // Allows body to flow under the floating nav bar
      body: _pages[_currentIndex],
      bottomNavigationBar: SafeArea(
        bottom: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(20), // 0.08 opacity approx
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
                height: 72,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                color: Colors.white,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Expanded(child: _buildNavItem(label: 'Home', index: 0)),
                    Expanded(child: _buildNavItem(label: 'Promos', index: 1)),
                    Expanded(
                      child: _buildNavItem(label: 'Activities', index: 2),
                    ),
                    Expanded(child: _buildNavItem(label: 'Profile', index: 3)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  int _getActivityCount() {
    // Scheduled items from activities data + active parcel orders
    return ActivitiesPage.scheduledCount + ParcelDashboardPage.activeOrders.length;
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
          vertical: isActive ? 8 : 12,
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
            const SizedBox(height: 4),
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

    final icons = [
      Icons.home_rounded,
      Icons.new_releases_outlined,
      Icons.receipt_long_outlined,
      Icons.person_outline_rounded,
    ];

    return Icon(icons[index], color: color, size: 30);
  }
}
