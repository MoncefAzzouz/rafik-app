import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/cached_image.dart';
import '../data/content_repository.dart';
import '../domain/app_slide.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> {
  final ContentRepository _content = ContentRepository.instance;

  @override
  void initState() {
    super.initState();
    _content.addListener(_onContentChanged);
    _content.refreshPromos();
  }

  void _onContentChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _content.removeListener(_onContentChanged);
    super.dispose();
  }

  Future<void> _openBannerLink(String? link) async {
    if (link == null || link.isEmpty) return;
    if (link.toLowerCase().startsWith('http')) {
      await launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundWhite,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: const Text(
          'Offers',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _content.refreshPromos,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: ClampingScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(
            20,
            10,
            20,
            100,
          ), // padding bottom for nav bar
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Standalone promo banners (admin-managed, "New Banner" on
              // the app-promos page) — purely visual, not tied to a code.
              if (_content.promoBanners.isNotEmpty) ...[
                SizedBox(
                  height: 140,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    itemCount: _content.promoBanners.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) =>
                        _buildBanner(_content.promoBanners[index]),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Just for you
              const Text(
                'Just for you',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 180,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  children: [
                    _buildServiceCard(
                      icon: FontAwesomeIcons.paintRoller,
                      title: 'Painting Service',
                      discount: 'Save 30%',
                      colors: [
                        const Color(0xFF4DB5F4),
                        const Color(0xFF38A3F1),
                      ],
                    ),
                    const SizedBox(width: 16),
                    _buildServiceCard(
                      icon: FontAwesomeIcons.houseUser,
                      title: 'Shifting Service',
                      discount: '20% Off',
                      colors: [
                        const Color(0xFF10B981),
                        const Color(0xFF059669),
                      ],
                    ),
                    const SizedBox(width: 16),
                    _buildServiceCard(
                      icon: FontAwesomeIcons.truckFast,
                      title: 'Vehicle Service',
                      discount: 'Save 30%',
                      colors: [
                        const Color(0xFFF43F5E),
                        const Color(0xFFE11D48),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBanner(AppSlide slide) {
    final hasText =
        (slide.title ?? '').isNotEmpty || (slide.subtitle ?? '').isNotEmpty;

    return GestureDetector(
      onTap: () => _openBannerLink(slide.link),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          width: 260,
          height: 140,
          child: Stack(
            fit: StackFit.expand,
            children: [
              CachedImage(
                url: slide.image,
                errorBuilder: (context) => Container(
                  color: Colors.grey.shade200,
                  child: const Center(
                    child: Icon(
                      Icons.image_not_supported_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
              if (hasText) ...[
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withAlpha(160),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 12,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if ((slide.title ?? '').isNotEmpty)
                        Text(
                          slide.title!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      if ((slide.subtitle ?? '').isNotEmpty)
                        Text(
                          slide.subtitle!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withAlpha(220),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }


  Widget _buildServiceCard({
    required IconData icon,
    required String title,
    required String discount,
    required List<Color> colors,
  }) {
    return Container(
      width: 140,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51), // 0.2 opacity
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            discount,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51), // 0.2 opacity
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'ORDER NOW',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
