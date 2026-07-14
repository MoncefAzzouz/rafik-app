import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../restaurant/pages/food_page.dart';
import '../../taxi/pages/taxi_booking_page.dart';
import '../../electricity/pages/electrician_list_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;

  final List<String> _banners = [
    'assets/imagesss/banner.PNG',
    'assets/imagesss/telegram-cloud-photo-size-4-5866005413520674090-y.jpg',
    'assets/imagesss/telegram-cloud-photo-size-4-5866005413520674091-y.jpg',
  ];

  @override
  void initState() {
    super.initState();
    _startBannerTimer();
  }

  void _startBannerTimer() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_bannerController.hasClients) {
        int nextIndex = _currentBannerIndex + 1;
        if (nextIndex >= _banners.length) {
          nextIndex = 0;
        }
        _bannerController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Set status bar icons to light (white) for the dark header gradient
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
    );

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Column(
          children: [
            // 1. Navy Gradient Header Section
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: AppColors.headerGradient,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting & Location
                    const Text(
                      'Hello, Moncef',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: _showLocationSheet,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_on_rounded,
                            color: AppColors.cyan,
                            size: 12,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Setif, Algeria',
                            style: TextStyle(
                              color: AppColors.cyan,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(width: 2),
                          Icon(
                            Icons.keyboard_arrow_right_rounded,
                            color: AppColors.cyan,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // 2. White Rounded Container (Rest of the Page Content)
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: AppColors.backgroundLight,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              padding: const EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Promotional Banner Section (Swipable PageView)
                  Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      SizedBox(
                        height: 180,
                        width: double.infinity,
                        child: PageView.builder(
                          controller: _bannerController,
                          onPageChanged: (index) {
                            setState(() {
                              _currentBannerIndex = index;
                            });
                          },
                          itemCount: _banners.length,
                          itemBuilder: (context, index) {
                            return _buildBannerCard(index);
                          },
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            _banners.length,
                            (index) => AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: _currentBannerIndex == index ? 12 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: _currentBannerIndex == index
                                    ? Colors.white
                                    : Colors.white.withAlpha(128),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Services Grid Container (White Card style)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 20,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(8),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildServiceItem(
                              'assets/imagesss/food icon.PNG',
                              'Food',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const FoodPage(),
                                  ),
                                );
                              },
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0038.PNG',
                              'Taxi',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const TaxiBookingPage(),
                                  ),
                                );
                              },
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0039.PNG',
                              'Supermarket',
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0040.PNG',
                              'Home Service',
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildServiceItem(
                              'assets/imagesss/IMG_0044.PNG',
                              'Parcel\nDelivery',
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0041.PNG',
                              'Electricity',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const ElectricianListPage(),
                                  ),
                                );
                              },
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0042.PNG',
                              'Bricolage\n(DIY)',
                            ),
                            _buildServiceItem(
                              'assets/imagesss/IMG_0045.PNG',
                              'Plumbing',
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildServiceItem(
                              'assets/imagesss/IMG_0043.PNG',
                              'Parcel\nTransport',
                            ),
                            _buildServiceItem('', 'More', isCustomMore: true),
                            const Expanded(child: SizedBox()),
                            const Expanded(child: SizedBox()),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Reorder Section
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(
                            Icons.refresh_rounded,
                            color: AppColors.royalBlue,
                            size: 22,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Reorder your favorite meals',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: () {},
                        child: const Row(
                          children: [
                            Text(
                              'View all',
                              style: TextStyle(
                                color: AppColors.royalBlue,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.royalBlue,
                              size: 16,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.grey.shade100,
                        width: 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(8),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
                            width: 72,
                            height: 72,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: 72,
                                height: 72,
                                color: Colors.grey.shade200,
                                child: const Icon(
                                  Icons.restaurant_rounded,
                                  color: AppColors.textSecondary,
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Pizzeria Apollino',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                '2 items',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'May 12, 2024 at 18:45',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        GestureDetector(
                          onTap: () {},
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: const BoxDecoration(
                              color: Color(0xFFEFF5FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.shopping_cart_outlined,
                              color: AppColors.royalBlue,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(
                    height: 120,
                  ), // Spacing for floating bottom nav
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLocationSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 8),
                Container(
                  width: 84,
                  height: 6,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8E5EE),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Location',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 18),
                const Divider(height: 1, color: Color(0xFFE8E8E8)),
                const SizedBox(height: 20),
                _buildLocationRow(
                  icon: Icons.my_location_rounded,
                  title: 'Use my current location',
                  subtitle: 'Avenue des Frères Meslem, Sétif, Algérie',
                  trailing: Icons.check_rounded,
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(height: 26),
                _buildLocationRow(
                  icon: Icons.map_outlined,
                  title: 'Choose another location',
                  trailing: Icons.chevron_right_rounded,
                  onTap: () {},
                ),
                const SizedBox(height: 26),
                _buildLocationRow(
                  icon: Icons.add_rounded,
                  title: 'Add a new address',
                  trailing: Icons.chevron_right_rounded,
                  onTap: () {},
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLocationRow({
    required IconData icon,
    required String title,
    String? subtitle,
    required IconData trailing,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Row(
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 26),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 16),
            Icon(trailing, color: AppColors.textPrimary, size: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerCard(int index) {
    final bannerText = _bannerText(index);

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _banners[index],
            width: double.infinity,
            fit: BoxFit.cover,
          ),
          if (bannerText != null) ...[
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    AppColors.primary.withAlpha(210),
                    AppColors.primary.withAlpha(95),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            Directionality(
              textDirection: TextDirection.rtl,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(2, 18, 20, 18),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 150),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          bannerText['title']!,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            height: 1.12,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          bannerText['subtitle']!,
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color: Colors.white.withAlpha(230),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(
                              bannerText['action']!,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Map<String, String>? _bannerText(int index) {
    switch (index) {
      case 0:
        return {
          'title': 'كل خدماتك\nفي تطبيق واحد',
          'subtitle': 'توصيل، تاكسي، وتسوق',
          'action': 'اطلب الآن',
        };
      case 1:
        return {
          'title': 'وجبتك المفضلة\nتوصلك بسرعة',
          'subtitle': 'مطاعمك القريبة بين يديك',
          'action': 'اطلب الآن',
        };
      case 2:
        return {
          'title': 'مشوارك جاهز\nفي دقائق',
          'subtitle': 'تنقل بسهولة وأمان',
          'action': 'احجز الآن',
        };
      default:
        return null;
    }
  }

  // Service Grid Item Builder
  Widget _buildServiceItem(
    String assetPath,
    String title, {
    bool isCustomMore = false,
    VoidCallback? onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: const BoxDecoration(shape: BoxShape.circle),
              child: ClipOval(
                child: isCustomMore
                    ? const Center(
                        child: Icon(
                          Icons.more_horiz_rounded,
                          color: AppColors.royalBlue,
                          size: 32,
                        ),
                      )
                    : Padding(
                        padding: const EdgeInsets.all(
                          4.0,
                        ), // Padding to keep premium borders
                        child: Image.asset(assetPath, fit: BoxFit.contain),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
