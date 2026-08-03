import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/theme/app_colors.dart';

class OffersPage extends StatelessWidget {
  const OffersPage({super.key});

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          20,
          10,
          20,
          100,
        ), // padding bottom for nav bar
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Latest Offers
            const Text(
              'Latest Offers',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                children: [
                  _buildImageCard('assets/images/1.svg', 280),
                  const SizedBox(width: 16),
                  _buildImageCard('assets/images/Offers.svg', 280),
                ],
              ),
            ),
            const SizedBox(height: 30),

            // Limited Offer
            const Text(
              'Limited Offer',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildImageCard(
              'assets/images/1 (2).png',
              double.infinity,
              height: 180,
            ),
            const SizedBox(height: 30),

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
                    colors: [const Color(0xFF4DB5F4), const Color(0xFF38A3F1)],
                  ),
                  const SizedBox(width: 16),
                  _buildServiceCard(
                    icon: FontAwesomeIcons.houseUser,
                    title: 'Shifting Service',
                    discount: '20% Off',
                    colors: [const Color(0xFF10B981), const Color(0xFF059669)],
                  ),
                  const SizedBox(width: 16),
                  _buildServiceCard(
                    icon: FontAwesomeIcons.truckFast,
                    title: 'Vehicle Service',
                    discount: 'Save 30%',
                    colors: [const Color(0xFFF43F5E), const Color(0xFFE11D48)],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageCard(
    String assetPath,
    double width, {
    double height = 120,
  }) {
    final isSvg = assetPath.toLowerCase().endsWith('.svg');

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        image: !isSvg
            ? DecorationImage(image: AssetImage(assetPath), fit: BoxFit.contain)
            : null,
      ),
      child: isSvg
          ? ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SvgPicture.asset(assetPath, fit: BoxFit.contain),
            )
          : null,
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
