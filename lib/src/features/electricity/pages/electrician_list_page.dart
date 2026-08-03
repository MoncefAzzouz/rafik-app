import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_colors.dart';
import 'electrician_detail_page.dart';

class Electrician {
  final String name;
  final String image;
  final double rating;
  final int reviews;
  final int experienceYears;
  final List<String> tags;
  final int startingPrice;
  final String location;
  final String bio;
  final List<String> workImages;

  Electrician({
    required this.name,
    required this.image,
    required this.rating,
    required this.reviews,
    required this.experienceYears,
    required this.tags,
    required this.startingPrice,
    required this.location,
    required this.bio,
    required this.workImages,
  });
}

class ElectricianListPage extends StatefulWidget {
  const ElectricianListPage({super.key});

  @override
  State<ElectricianListPage> createState() => _ElectricianListPageState();
}

class _ElectricianListPageState extends State<ElectricianListPage> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _simulateLoading();
  }

  void _simulateLoading() {
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  final List<Electrician> _electricians = [
    Electrician(
      name: 'Sofiane Rahmani',
      image:
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Real professional electrician image
      rating: 4.9,
      reviews: 142,
      experienceYears: 8,
      tags: ['Short Circuit', 'House Wiring', 'AC Installation'],
      startingPrice: 1500,
      location: 'Setif Center',
      bio:
          'Professional certified electrician with 8 years of experience. Specialist in domestic wiring, emergency short circuits, and smart home installations. Fast response time and quality guaranteed.',
      workImages: [
        'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Electrical panel
        'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Wiring installation
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Tools/work
        'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Outdoor lighting
      ],
    ),
    Electrician(
      name: 'Mourad Belkacem',
      image:
          'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Professional headshot
      rating: 4.8,
      reviews: 98,
      experienceYears: 6,
      tags: ['Appliance Repair', 'Lighting Setup', 'Main Panels'],
      startingPrice: 1200,
      location: 'Beb Ezzouar, Setif',
      bio:
          'Expert electrician specializing in industrial and household systems. From fuse replacements to whole-house electrical renovations, I deliver clean, safe, and code-compliant work.',
      workImages: [
        'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Smart switches
        'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Panel board
        'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Technician working
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Testing wires
      ],
    ),
    Electrician(
      name: 'Yacine Madani',
      image:
          'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Headshot
      rating: 4.7,
      reviews: 64,
      experienceYears: 5,
      tags: ['CCTV & Alarm', 'Smart Intercom', 'Network Cabling'],
      startingPrice: 1800,
      location: 'El Eulma, Setif',
      bio:
          'Tech-focused electrician specializing in smart home systems, home automation, security cameras, and electrical maintenance. Clean work and highly detail-oriented.',
      workImages: [
        'https://images.unsplash.com/photo-1524486361537-8ad156838585?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Network switch
        'https://images.unsplash.com/photo-1516216621174-b127cc58e57b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // CCTV camera
        'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Control panel
        'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Socket wiring
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // Navy Gradient Header Section
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: AppColors.headerGradient,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              right: 16,
              bottom: 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                      'Electricians',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Padding(
                  padding: EdgeInsets.only(left: 4),
                  child: Text(
                    'Find top-rated local electrical experts near you',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Electricians List
          Expanded(
            child: _isLoading
                ? _buildShimmerLoading()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _electricians.length,
                    itemBuilder: (context, index) {
                      final electrician = _electricians[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ElectricianDetailPage(
                                electrician: electrician,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(6),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                            border: Border.all(
                              color: Colors.grey.shade100,
                              width: 1.5,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Electrician Photo
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Image.network(
                                    electrician.image,
                                    width: 80,
                                    height: 90,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(width: 16),

                                // Electrician Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              electrician.name,
                                              style: const TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              const Icon(
                                                Icons.star_rounded,
                                                color: Colors.amber,
                                                size: 18,
                                              ),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${electrician.rating}',
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.work_history_outlined,
                                            color: Colors.grey.shade500,
                                            size: 13,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${electrician.experienceYears} Years Exp.',
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Icon(
                                            Icons.location_on_outlined,
                                            color: Colors.grey.shade500,
                                            size: 13,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            electrician.location.split(',')[0],
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),

                                      // Tags
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 4,
                                        children: electrician.tags.take(2).map((
                                          tag,
                                        ) {
                                          return Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: AppColors.royalBlue
                                                  .withAlpha(10),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              tag,
                                              style: const TextStyle(
                                                color: AppColors.royalBlue,
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                      const SizedBox(height: 8),

                                      // Starting Price
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Starting from',
                                            style: TextStyle(
                                              color: Colors.grey.shade500,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          Text(
                                            '${electrician.startingPrice} DA',
                                            style: const TextStyle(
                                              color: AppColors.royalBlue,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
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
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (context, index) {
          return Container(
            height: 120,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
          );
        },
      ),
    );
  }
}
