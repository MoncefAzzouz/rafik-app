import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'home_page.dart';
import 'offers_page.dart';
import 'activities_page.dart';
import '../../profile/pages/profile_page.dart';

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
                    Expanded(
                      child: _buildNavItem(
                        label: 'Home',
                        icon: Icons.home_rounded,
                        index: 0,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Promos',
                        icon: Icons.local_offer_rounded,
                        index: 1,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Activities',
                        icon: Icons.receipt_long_rounded,
                        index: 2,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Profile',
                        icon: Icons.person_rounded,
                        index: 3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required String label,
    required IconData icon,
    required int index,
  }) {
    final isActive = _currentIndex == index;
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
              : Colors.transparent, // ~0.12 opacity
          borderRadius: BorderRadius.circular(30),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 24,
              color: isActive ? AppColors.primary : AppColors.textSecondary,
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
}
