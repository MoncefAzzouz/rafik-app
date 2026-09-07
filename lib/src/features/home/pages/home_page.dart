import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/cached_image.dart';
import '../../restaurant/pages/food_page.dart';
import '../../taxi/pages/taxi_booking_page.dart';
import '../../parcel_transport/pages/parcel_dashboard_page.dart';
import '../../parcel_transport/pages/parcel_category_select_page.dart';
import '../../parcel_transport/data/parcel_order_repository.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/pages/login_page.dart';
import '../data/content_repository.dart';
import '../domain/app_module.dart';
import '../domain/app_slide.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../../../core/location/picked_location.dart';
import '../../../core/location/location_picker_page.dart';
import '../../taxi/data/datasources/device_location_data_source.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final PageController _bannerController = PageController();
  final ParcelOrderRepository _parcelOrders = ParcelOrderRepository.instance;
  final ContentRepository _content = ContentRepository.instance;
  final DeviceLocationDataSource _deviceLocation = DeviceLocationDataSource();
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;

  /// The delivery location shown in the header. Null until the user picks one
  /// (or GPS resolves), which is when the fallback city label below is
  /// replaced by a real address.
  PickedLocation? _location;
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _parcelOrders.addListener(_onExternalStateChanged);
    _content.addListener(_onExternalStateChanged);
    _startBannerTimer();
    _content.refreshHome();
  }

  void _onExternalStateChanged() {
    if (mounted) setState(() {});
  }

  void _startBannerTimer() {
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      final count = _content.homeSlides.length;
      if (count == 0 || !_bannerController.hasClients) return;
      int nextIndex = _currentBannerIndex + 1;
      if (nextIndex >= count) {
        nextIndex = 0;
      }
      _bannerController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _parcelOrders.removeListener(_onExternalStateChanged);
    _content.removeListener(_onExternalStateChanged);
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  void _handleSlideTap(AppSlide slide) {
    final link = slide.link?.trim();
    if (link == null || link.isEmpty) return;

    if (link.toLowerCase().startsWith('http')) {
      launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
      return;
    }

    final normalized = link.toLowerCase();
    if (normalized.contains('truck')) {
      _openParcelDashboard();
    } else if (normalized.contains('taxi')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const TaxiBookingPage()),
      );
    } else if (normalized.contains('food')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const FoodPage()),
      );
    }
  }

  void _openParcelDashboard() {
    Navigator.push(
      context,
      SmoothPageRoute(
        page: const ParcelDashboardPage(),
        settings: const RouteSettings(name: 'parcel_dashboard'),
      ),
    );
  }

  /// Tapping the Truck tile should go straight into booking a new order,
  /// not the dashboard (new/archive tabs) — that's still reachable from the
  /// "active orders" banner below when there's something to actually manage.
  void _startNewParcelOrder() {
    if (!AuthRepository.instance.isAuthenticated) {
      Navigator.push(context, SmoothPageRoute(page: const LoginPage()));
      return;
    }
    Navigator.push(
      context,
      SmoothPageRoute(page: const ParcelCategorySelectPage()),
    );
  }

  VoidCallback? _moduleOnTap(AppModule module) {
    if (!module.isTappable) return null;
    if (module.isTruck) return _startNewParcelOrder;
    switch (module.type) {
      case 'taxi':
        return () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const TaxiBookingPage()),
        );
      case 'food':
        return () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const FoodPage()),
        );
      default:
        return null;
    }
  }

  String _moduleLabel(AppModule module) {
    if (AppLanguage.instance.value == AppLang.ar &&
        (module.labelAr ?? '').isNotEmpty) {
      return module.labelAr!;
    }
    return module.label;
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
      // Matches the light content container below, not the header's navy —
      // any gap below short content (e.g. after hiding a section) then
      // reads as more of the same light background instead of exposed blue.
      backgroundColor: AppColors.backgroundLight,
      body: RefreshIndicator(
        onRefresh: _content.refreshHome,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: ClampingScrollPhysics(),
          ),
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
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.location_on_rounded,
                              color: AppColors.cyan,
                              size: 12,
                            ),
                            const SizedBox(width: 4),
                            ConstrainedBox(
                              constraints: BoxConstraints(
                                maxWidth:
                                    MediaQuery.of(context).size.width - 100,
                              ),
                              child: Text(
                                _location?.address ?? _fallbackLocationLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.cyan,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 2),
                            const Icon(
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
                    // Promotional Banner Section (admin-managed slides)
                    if (_content.homeSlides.isNotEmpty) ...[
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
                              itemCount: _content.homeSlides.length,
                              itemBuilder: (context, index) {
                                final slide = _content.homeSlides[index];
                                return GestureDetector(
                                  onTap: () => _handleSlideTap(slide),
                                  child: _buildBannerCard(slide),
                                );
                              },
                            ),
                          ),
                          Positioned(
                            bottom: 12,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                _content.homeSlides.length,
                                (index) => AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 3,
                                  ),
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
                    ],

                    // Services Grid Container (White Card style, admin-managed modules)
                    if (_content.modules.isNotEmpty)
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
                        // A Wrap sizes each row to its own tallest tile
                        // instead of forcing every row to a fixed
                        // aspect-ratio height (GridView's approach) — so
                        // the container's total height always matches how
                        // many modules actually exist instead of growing
                        // padding along with every extra row.
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            const spacing = 8.0;
                            final tileWidth =
                                (constraints.maxWidth - 3 * spacing) / 4;
                            return Wrap(
                              spacing: spacing,
                              runSpacing: 20,
                              children: [
                                for (final module in _content.modules)
                                  SizedBox(
                                    width: tileWidth,
                                    child: _buildServiceItem(
                                      module,
                                      _moduleLabel(module),
                                      badgeCount: module.isTruck
                                          ? _parcelOrders.activeCount
                                          : 0,
                                      onTap: _moduleOnTap(module),
                                    ),
                                  ),
                                SizedBox(
                                  width: tileWidth,
                                  child: _buildServiceItem(null, _moreLabel()),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    if (_parcelOrders.activeCount > 0) ...[
                      const SizedBox(height: 14),
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(18),
                          onTap: _openParcelDashboard,
                          child: Ink(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 13,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.royalBlue.withAlpha(18),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: AppColors.royalBlue.withAlpha(45),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: const BoxDecoration(
                                    color: AppColors.royalBlue,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.local_shipping_rounded,
                                    color: Colors.white,
                                    size: 21,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${_parcelOrders.activeCount} active parcel ${_parcelOrders.activeCount == 1 ? 'order' : 'orders'}',
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        'Tap to view and manage your delivery',
                                        style: TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.royalBlue,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(
                      height: 120,
                    ), // Spacing for floating bottom nav
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Label shown before any location has been resolved or picked.
  static const String _fallbackLocationLabel = 'Setif, Algeria';

  void _showLocationSheet() {
    final s = AppStrings(AppLanguage.instance.value);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        // StatefulBuilder so the "Locating…" subtitle and the selected-row
        // check mark update while the sheet is still open.
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Directionality(
              textDirection: s.lang == AppLang.ar
                  ? TextDirection.rtl
                  : TextDirection.ltr,
              child: Container(
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
                      Text(
                        s.locationSheetTitle,
                        style: const TextStyle(
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
                        title: s.locationUseCurrent,
                        subtitle: _isLocating
                            ? s.locationDetecting
                            : _location?.address,
                        trailing: _location == null
                            ? Icons.chevron_right_rounded
                            : Icons.check_rounded,
                        onTap: _isLocating
                            ? null
                            : () => _useCurrentLocation(
                                sheetContext,
                                setSheetState,
                                s,
                              ),
                      ),
                      const SizedBox(height: 26),
                      _buildLocationRow(
                        icon: Icons.map_outlined,
                        title: s.locationChooseOnMap,
                        trailing: Icons.chevron_right_rounded,
                        onTap: () => _pickLocationOnMap(sheetContext),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  /// Resolves the device position, reverse-geocodes it, and adopts it as the
  /// delivery location.
  Future<void> _useCurrentLocation(
    BuildContext sheetContext,
    StateSetter setSheetState,
    AppStrings s,
  ) async {
    setState(() => _isLocating = true);
    setSheetState(() {});

    final point = await _deviceLocation.currentPosition();
    String? address;
    if (point != null) {
      try {
        address = await _deviceLocation.reverseGeocode(point);
      } catch (_) {
        // Keep the coordinate — an un-named point is still a usable one.
      }
    }

    if (!mounted) return;
    setState(() {
      _isLocating = false;
      if (point != null) {
        _location = PickedLocation(
          coordinate: point,
          address: address?.trim().isNotEmpty == true
              ? address!.trim()
              : '${point.latitude.toStringAsFixed(5)}, '
                    '${point.longitude.toStringAsFixed(5)}',
        );
      }
    });

    if (!sheetContext.mounted) return;
    if (point == null) {
      setSheetState(() {});
      ScaffoldMessenger.of(
        sheetContext,
      ).showSnackBar(SnackBar(content: Text(s.locationUnavailable)));
      return;
    }
    Navigator.pop(sheetContext);
  }

  /// Opens the full-screen map picker and adopts whatever the user confirms.
  Future<void> _pickLocationOnMap(BuildContext sheetContext) async {
    Navigator.pop(sheetContext);
    final picked = await Navigator.push<PickedLocation>(
      context,
      SmoothPageRoute<PickedLocation>(
        page: LocationPickerPage(initialLocation: _location),
      ),
    );
    if (!mounted || picked == null) return;
    setState(() => _location = picked);
  }

  Widget _buildLocationRow({
    required IconData icon,
    required String title,
    String? subtitle,
    required IconData trailing,
    required VoidCallback? onTap,
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

  Widget _buildBannerCard(AppSlide slide) {
    final hasText =
        (slide.title ?? '').isNotEmpty || (slide.subtitle ?? '').isNotEmpty;

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CachedImage(
            url: slide.image,
            width: double.infinity,
            errorBuilder: (context) => Container(
              color: Colors.grey.shade200,
              child: const Center(
                child: Icon(
                  Icons.image_not_supported_rounded,
                  color: AppColors.textSecondary,
                  size: 32,
                ),
              ),
            ),
          ),
          if (hasText) ...[
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
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
              child: Align(
                alignment: Alignment.centerLeft,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 170),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if ((slide.title ?? '').isNotEmpty)
                        Text(
                          slide.title!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            height: 1.12,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      if ((slide.subtitle ?? '').isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          slide.subtitle!,
                          style: TextStyle(
                            color: Colors.white.withAlpha(230),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Renders `module.icon`, which the backend gives as either a full image
  /// URL or a bare emoji string with no flag distinguishing which.
  Widget _buildModuleIcon(AppModule module) {
    final icon = module.icon?.trim();
    if (icon == null || icon.isEmpty) {
      return const Icon(
        Icons.apps_rounded,
        color: AppColors.royalBlue,
        size: 28,
      );
    }
    if (icon.toLowerCase().startsWith('http')) {
      return Padding(
        padding: const EdgeInsets.all(4),
        child: CachedImage(
          url: icon,
          fit: BoxFit.contain,
          errorBuilder: (context) => const Icon(
            Icons.apps_rounded,
            color: AppColors.royalBlue,
            size: 28,
          ),
        ),
      );
    }
    return Center(child: Text(icon, style: const TextStyle(fontSize: 30)));
  }

  // Service Grid Item Builder. `module` is null only for the static "More" tile.
  Widget _buildServiceItem(
    AppModule? module,
    String title, {
    int badgeCount = 0,
    VoidCallback? onTap,
  }) {
    final isLocked = module != null && !module.isTappable;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Opacity(
                opacity: isLocked ? 0.45 : 1,
                child: Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(shape: BoxShape.circle),
                  child: ClipOval(
                    child: module == null
                        ? const Center(
                            child: Icon(
                              Icons.more_horiz_rounded,
                              color: AppColors.royalBlue,
                              size: 32,
                            ),
                          )
                        : _buildModuleIcon(module),
                  ),
                ),
              ),
              if (isLocked)
                Positioned(
                  right: -2,
                  bottom: -2,
                  child: Container(
                    width: 25,
                    height: 25,
                    decoration: BoxDecoration(
                      color: AppColors.royalBlue,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(35),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.lock_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                ),
              if (!isLocked && badgeCount > 0)
                Positioned(
                  right: -4,
                  top: -4,
                  child: Container(
                    constraints: const BoxConstraints(
                      minWidth: 24,
                      minHeight: 24,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.redAccent,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Text(
                      badgeCount > 99 ? '99+' : '$badgeCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isLocked
                  ? AppColors.textPrimary.withAlpha(120)
                  : AppColors.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  String _moreLabel() {
    switch (AppLanguage.instance.value) {
      case AppLang.ar:
        return 'المزيد';
      case AppLang.fr:
        return 'Plus';
      case AppLang.en:
        return 'More';
    }
  }
}
