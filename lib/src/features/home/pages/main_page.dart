import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'home_page.dart';
import 'offers_page.dart';

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
    const Center(child: Text('Activities', style: TextStyle(color: AppColors.textPrimary))),
    const Center(child: Text('Profile', style: TextStyle(color: AppColors.textPrimary))),
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
                color: Colors.white.withAlpha(102), // 0.4 opacity approx
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Expanded(
                      child: _buildNavItem(
                        label: 'Home',
                        activeIconPath: 'assets/icons/Home-color.png',
                        inactiveIconPath: 'assets/icons/Home.png',
                        index: 0,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Promos',
                        activeIconPath: 'assets/icons/promo-color.png',
                        inactiveIconPath: 'assets/icons/promo.png',
                        index: 1,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Activities',
                        activeIconPath: 'assets/icons/Paper-color.png',
                        inactiveIconPath: 'assets/icons/Paper.png',
                        index: 2,
                      ),
                    ),
                    Expanded(
                      child: _buildNavItem(
                        label: 'Profile',
                        activeIconPath: 'assets/icons/Profile-color.png',
                        inactiveIconPath: 'assets/icons/Profile.png',
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
    required String activeIconPath,
    required String inactiveIconPath,
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
        margin: EdgeInsets.symmetric(vertical: isActive ? 8 : 12, horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withAlpha(30) : Colors.transparent, // ~0.12 opacity
          borderRadius: BorderRadius.circular(30),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              isActive ? activeIconPath : inactiveIconPath,
              width: 24,
              height: 24,
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
