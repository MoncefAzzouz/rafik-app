import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'restaurant_details_page.dart';

class CategoryDetailsPage extends StatelessWidget {
  final String categoryName;

  const CategoryDetailsPage({
    super.key,
    required this.categoryName,
  });

  // Predefined mock data for category stores
  List<Map<String, dynamic>> _getStoresForCategory() {
    if (categoryName == 'Courses') {
      return [
        {
          'name': 'Fruits & Légumes - BBZ',
          'image': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
          'rating': '4.8',
          'reviews': '8',
          'type': 'Courses',
          'time': '30 - 40 min',
          'fee': '195 DA',
        },
        {
          'name': 'Boucherie - BBZ',
          'image': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300',
          'rating': '4.8',
          'reviews': '17',
          'type': 'Courses',
          'time': '30 - 40 min',
          'fee': '195 DA',
        },
      ];
    } else if (categoryName == 'Pizzas') {
      return [
        {
          'name': 'Pizzeria Apollino',
          'image': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
          'rating': '4.8',
          'reviews': '120',
          'type': 'Pizzas & Tacos',
          'time': '20 - 30 min',
          'fee': '195 DA',
        },
      ];
    } else if (categoryName == 'Burgers') {
      return [
        {
          'name': 'Burger House',
          'image': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
          'rating': '4.9',
          'reviews': '450',
          'type': 'Burgers & Fries',
          'time': '15 - 25 min',
          'fee': '195 DA',
        },
        {
          'name': 'Naan - BBZ',
          'image': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=300',
          'rating': '4.6',
          'reviews': '856',
          'type': 'Burgers',
          'time': '30 - 40 min',
          'fee': 'Free',
        },
      ];
    } else {
      return [
        {
          'name': 'Quick Bites',
          'image': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300',
          'rating': '4.5',
          'reviews': '99',
          'type': categoryName,
          'time': '25 - 35 min',
          'fee': '195 DA',
        },
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final stores = _getStoresForCategory();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Green back button
            Padding(
              padding: const EdgeInsets.only(left: 12, top: 12),
              child: IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: Color(0xFF1E523A), // Dark Green matching screenshot
                  size: 24,
                ),
                onPressed: () => Navigator.pop(context),
              ),
            ),

            // Large Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Text(
                categoryName,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Stores list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: stores.length,
                itemBuilder: (context, index) {
                  final store = stores[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RestaurantDetailsPage(
                              restaurantName: store['name'],
                              restaurantImage: store['image'],
                              rating: store['rating'],
                              reviewsCount: store['reviews'],
                              cuisineType: store['type'],
                            ),
                          ),
                        );
                      },
                      child: Container(
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(4),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Left image with badge
                            Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(16),
                                    bottomLeft: Radius.circular(16),
                                  ),
                                  child: Image.network(
                                    store['image'],
                                    width: 110,
                                    height: 120,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        width: 110,
                                        color: Colors.grey.shade100,
                                        child: const Icon(
                                          Icons.storefront_rounded,
                                          color: AppColors.textSecondary,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  left: 8,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withAlpha(140),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'Preorder',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 16),
                            // Right Details
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      store['name'],
                                      style: const TextStyle(
                                        color: Colors.black,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
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
                                          '${store['rating']} (${store['reviews']})',
                                          style: const TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      store['type'],
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${store['time']} • ${store['fee']}',
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
