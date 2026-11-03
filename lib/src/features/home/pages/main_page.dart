import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import 'home_page.dart';
import 'offers_page.dart';
import 'activities_page.dart';
import '../../profile/pages/profile_page.dart';
import '../../parcel_transport/data/parcel_order_repository.dart';
import '../../auth/data/auth_repository.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> with WidgetsBindingObserver {
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
    WidgetsBinding.instance.addObserver(this);
    _parcelOrders.addListener(_onOrdersChanged);
    _refreshOrders();
  }

  void _refreshOrders() {
    if (AuthRepository.instance.isAuthenticated) {
      _parcelOrders.fetchAll();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshOrders();
  }

  void _onOrdersChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
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
        if (index == 0 || index == 2) _refreshOrders();
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
      return SizedBox(
        width: 30,
        height: 30,
        child: Center(
          child: SvgPicture.string(
            '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 15l6 -6" />
  <circle cx="9.5" cy="9.5" r="1.1" fill="black" stroke="none" />
  <circle cx="14.5" cy="14.5" r="1.1" fill="black" stroke="none" />
  <path d="M5 7.2a2.2 2.2 0 0 1 2.2 -2.2h1a2.2 2.2 0 0 0 1.55 -.64l.7 -.7a2.2 2.2 0 0 1 3.12 0l.7 .7a2.2 2.2 0 0 0 1.55 .64h1a2.2 2.2 0 0 1 2.2 2.2v1a2.2 2.2 0 0 0 .64 1.55l.7 .7a2.2 2.2 0 0 1 0 3.12l-.7 .7a2.2 2.2 0 0 0 -.64 1.55v1a2.2 2.2 0 0 1 -2.2 2.2h-1a2.2 2.2 0 0 0 -1.55 .64l-.7 .7a2.2 2.2 0 0 1 -3.12 0l-.7 -.7a2.2 2.2 0 0 0 -1.55 -.64h-1a2.2 2.2 0 0 1 -2.2 -2.2v-1a2.2 2.2 0 0 0 -.64 -1.55l-.7 -.7a2.2 2.2 0 0 1 0 -3.12l.7 -.7a2.2 2.2 0 0 0 .64 -1.55v-1" />
</svg>''',
            width: 27,
            height: 27,
            colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
          ),
        ),
      );
    }

    final icons = [
      Icons.home_rounded,
      Icons.discount_outlined,
      Icons.receipt_long_outlined,
      Icons.person_outline_rounded,
    ];

    return Icon(icons[index], color: color, size: 30);
  }
}
