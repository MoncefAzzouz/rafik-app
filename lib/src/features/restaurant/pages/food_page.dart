import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_colors.dart';
import 'category_details_page.dart';
import 'restaurant_details_page.dart';

class FoodPage extends StatefulWidget {
  const FoodPage({super.key});

  @override
  State<FoodPage> createState() => _FoodPageState();
}

class _FoodPageState extends State<FoodPage> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _simulateLoading();
  }

  void _simulateLoading() {
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  final List<Map<String, String>> _categories = [
    {
      'name': 'Courses',
      'image':
          'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=200',
    },
    {
      'name': 'Pizzas',
      'image':
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
    },
    {
      'name': 'Burgers',
      'image':
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    },
    {
      'name': 'Tacos',
      'image':
          'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    },
    {
      'name': 'Sandwiches',
      'image':
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200',
    },
  ];

  final List<Map<String, dynamic>> _dailyOffers = [
    {
      'name': 'Naan - BBZ',
      'image':
          'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400',
      'rating': '4.6',
      'reviews': '856',
      'type': 'Burgers',
      'time': '30 - 40 min',
      'price': 'Free',
      'fee': '195 DA',
      'preorder': true,
      'ad': true,
    },
    {
      'name': 'Chicken Crousty',
      'image':
          'https://images.unsplash.com/photo-1562967914-608f82629710?w=400',
      'rating': '4.7',
      'reviews': '4',
      'type': 'Poulet',
      'time': '40 - 50 min',
      'price': '195 DA',
      'fee': '',
      'preorder': true,
      'ad': false,
    },
  ];

  final List<Map<String, dynamic>> _popularNearby = [
    {
      'name': 'Pizzeria Apollino',
      'image':
          'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=300',
      'rating': '4.8',
      'reviews': '120',
      'type': 'Pizzas & Tacos',
      'time': '20 - 30 min',
      'priceRange': r'$$',
    },
    {
      'name': 'Burger House',
      'image':
          'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300',
      'rating': '4.9',
      'reviews': '450',
      'type': 'Burgers & Fries',
      'time': '15 - 25 min',
      'priceRange': r'$$$',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. Header with Gradient and Location (Home style with Back button)
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
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withAlpha(30),
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Hello, Moncef',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {},
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withAlpha(30),
                            ),
                            child: const Icon(
                              Icons.favorite_border_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Padding(
                      padding: const EdgeInsets.only(left: 44),
                      child: GestureDetector(
                        onTap: () {},
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
                    ),
                    const SizedBox(height: 18),
                  ],
                ),
              ),
            ),

            // 2. White Rounded Container (Content Area)
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(color: AppColors.backgroundLight),
              child: _isLoading
                  ? _buildShimmerLoading()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),

                        // Categories Horizontal List
                        SizedBox(
                          height: 120,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            itemCount: _categories.length,
                            itemBuilder: (context, index) {
                              final cat = _categories[index];
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                ),
                                child: GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            CategoryDetailsPage(
                                              categoryName: cat['name']!,
                                            ),
                                      ),
                                    );
                                  },
                                  behavior: HitTestBehavior.opaque,
                                  child: Column(
                                    children: [
                                      Container(
                                        width: 68,
                                        height: 68,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.white,
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withAlpha(8),
                                              blurRadius: 8,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: ClipOval(
                                          child: Image.network(
                                            cat['image']!,
                                            fit: BoxFit.cover,
                                            errorBuilder:
                                                (context, error, stackTrace) {
                                                  return Container(
                                                    color: Colors.grey.shade200,
                                                    child: const Icon(
                                                      Icons.fastfood_rounded,
                                                      color: AppColors
                                                          .textSecondary,
                                                    ),
                                                  );
                                                },
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        cat['name']!,
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Premium Brand Promotional Banner
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 12,
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withAlpha(30),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(18),
                            child: Row(
                              children: [
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Faim ? Commandez ! 🍕',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Text(
                                        'Profitez de -20% sur votre première commande avec le code RAFIK20',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          height: 1.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: AppColors.primary,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 10,
                                    ),
                                  ),
                                  child: const Text(
                                    'Profiter',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Offres du jour Section Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Text(
                                    'Offres du jour',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Text('🥳', style: TextStyle(fontSize: 17)),
                                ],
                              ),
                              GestureDetector(
                                onTap: () {},
                                child: const Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.royalBlue,
                                  size: 22,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Offres du jour Horizontal List
                        SizedBox(
                          height: 220,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            itemCount: _dailyOffers.length,
                            itemBuilder: (context, index) {
                              final offer = _dailyOffers[index];
                              return GestureDetector(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          RestaurantDetailsPage(
                                            restaurantName: offer['name'],
                                            restaurantImage: offer['image'],
                                            rating: offer['rating'],
                                            reviewsCount: offer['reviews'],
                                            cuisineType: offer['type'],
                                          ),
                                    ),
                                  );
                                },
                                child: Container(
                                  width: 260,
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                  ),
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
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius:
                                                const BorderRadius.vertical(
                                                  top: Radius.circular(20),
                                                ),
                                            child: Image.network(
                                              offer['image'],
                                              height: 120,
                                              width: double.infinity,
                                              fit: BoxFit.cover,
                                              errorBuilder:
                                                  (context, error, stackTrace) {
                                                    return Container(
                                                      height: 120,
                                                      color:
                                                          Colors.grey.shade200,
                                                      child: const Icon(
                                                        Icons
                                                            .restaurant_rounded,
                                                        color: AppColors
                                                            .textSecondary,
                                                        size: 40,
                                                      ),
                                                    );
                                                  },
                                            ),
                                          ),
                                          Positioned(
                                            top: 10,
                                            left: 10,
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 10,
                                                    vertical: 4,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF00E676),
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                              child: const Text(
                                                'Livraison gratuite',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            top: 10,
                                            right: 10,
                                            child: Row(
                                              children: [
                                                if (offer['preorder'])
                                                  Container(
                                                    margin:
                                                        const EdgeInsets.only(
                                                          right: 4,
                                                        ),
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color: Colors.black
                                                          .withAlpha(120),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                    ),
                                                    child: const Text(
                                                      'Preorder',
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 9,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                if (offer['ad'])
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color: Colors.white,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                    ),
                                                    child: const Text(
                                                      'Ad',
                                                      style: TextStyle(
                                                        color: Colors.black87,
                                                        fontSize: 9,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              offer['name'],
                                              style: const TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.star_rounded,
                                                  color: Colors.amber,
                                                  size: 16,
                                                ),
                                                const SizedBox(width: 2),
                                                Text(
                                                  '${offer['rating']} (${offer['reviews']})',
                                                  style: const TextStyle(
                                                    color:
                                                        AppColors.textPrimary,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                const Text(
                                                  '•',
                                                  style: TextStyle(
                                                    color:
                                                        AppColors.textSecondary,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  offer['type'],
                                                  style: const TextStyle(
                                                    color:
                                                        AppColors.textSecondary,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              '${offer['time']} • ${offer['price']} ${offer['fee'] != '' ? '• ${offer['fee']}' : ''}',
                                              style: const TextStyle(
                                                color: AppColors.textSecondary,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Populaires à proximité Section Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 24, 20, 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Populaires à proximité',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {},
                                child: const Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.royalBlue,
                                  size: 22,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20),
                          child: Text(
                            'Les choix les plus populaires, à ne pas manquer !',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                        // Populaires à proximité Vertical list
                        ListView.builder(
                          physics: const NeverScrollableScrollPhysics(),
                          shrinkWrap: true,
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                          itemCount: _popularNearby.length,
                          itemBuilder: (context, index) {
                            final item = _popularNearby[index];
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => RestaurantDetailsPage(
                                      restaurantName: item['name'],
                                      restaurantImage: item['image'],
                                      rating: item['rating'],
                                      reviewsCount: item['reviews'],
                                      cuisineType: item['type'],
                                    ),
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
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
                                        item['image'],
                                        height: 72,
                                        width: 72,
                                        fit: BoxFit.cover,
                                        errorBuilder:
                                            (context, error, stackTrace) {
                                              return Container(
                                                height: 72,
                                                width: 72,
                                                color: Colors.grey.shade200,
                                                child: const Icon(
                                                  Icons.storefront_rounded,
                                                  color:
                                                      AppColors.textSecondary,
                                                ),
                                              );
                                            },
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item['name'],
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(
                                                Icons.star_rounded,
                                                color: Colors.amber,
                                                size: 14,
                                              ),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${item['rating']} (${item['reviews']})',
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              const Text(
                                                '•',
                                                style: TextStyle(
                                                  color:
                                                      AppColors.textSecondary,
                                                  fontSize: 10,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                item['type'],
                                                style: const TextStyle(
                                                  color:
                                                      AppColors.textSecondary,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            '${item['priceRange']} • ${item['time']}',
                                            style: const TextStyle(
                                              color: AppColors.textSecondary,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          // Categories horizontal list shimmer
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: 5,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Column(
                    children: [
                      Container(
                        width: 68,
                        height: 68,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 50,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Promotional Banner shimmer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Container(
              width: double.infinity,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),

          // Daily offers header shimmer
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 120,
                  height: 18,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),

          // Daily offers cards shimmer
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: 2,
              itemBuilder: (context, index) {
                return Container(
                  width: 260,
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                );
              },
            ),
          ),

          // Popular nearby header shimmer
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
            child: Container(
              width: 140,
              height: 18,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),

          // Popular nearby vertical cards shimmer
          ListView.builder(
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 2,
            itemBuilder: (context, index) {
              return Container(
                height: 100,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
