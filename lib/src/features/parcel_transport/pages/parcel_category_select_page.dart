import 'package:flutter/material.dart';
import 'parcel_vehicle_select_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';

class CategoryItem {
  final String id;
  final String Function(AppStrings s) titleGetter;
  final IconData icon;
  final Color iconColor;
  final Color bgColor;

  const CategoryItem({
    required this.id,
    required this.titleGetter,
    required this.icon,
    required this.iconColor,
    required this.bgColor,
  });
}

class ParcelCategorySelectPage extends StatefulWidget {
  const ParcelCategorySelectPage({super.key});

  @override
  State<ParcelCategorySelectPage> createState() =>
      _ParcelCategorySelectPageState();
}

class _ParcelCategorySelectPageState extends State<ParcelCategorySelectPage> {
  final List<CategoryItem> _categories = [
    CategoryItem(
      id: 'house_moving',
      titleGetter: (s) => s.catHouseMoving,
      icon: Icons.chair_rounded,
      iconColor: const Color(0xFFAB47BC),
      bgColor: const Color(0xFFF3E5F5),
    ),
    CategoryItem(
      id: 'commercial',
      titleGetter: (s) => s.catCommercial,
      icon: Icons.inventory_2_rounded,
      iconColor: const Color(0xFFFFA726),
      bgColor: const Color(0xFFFFF3E0),
    ),
    CategoryItem(
      id: 'appliances',
      titleGetter: (s) => s.catAppliances,
      icon: Icons.kitchen_rounded,
      iconColor: const Color(0xFF29B6F6),
      bgColor: const Color(0xFFE1F5FE),
    ),
    CategoryItem(
      id: 'towing',
      titleGetter: (s) => s.catTowing,
      icon: Icons.car_repair_rounded,
      iconColor: const Color(0xFFFF7043),
      bgColor: const Color(0xFFFBE9E7),
    ),
    CategoryItem(
      id: 'construction',
      titleGetter: (s) => s.catConstruction,
      icon: Icons.foundation_rounded,
      iconColor: const Color(0xFFD84315),
      bgColor: const Color(0xFFFBE9E7),
    ),
    CategoryItem(
      id: 'heavy_equipment',
      titleGetter: (s) => s.catHeavyEquipment,
      icon: Icons.shopping_bag_rounded,
      iconColor: const Color(0xFF1E88E5),
      bgColor: const Color(0xFFE3F2FD),
    ),
    CategoryItem(
      id: 'refrigerated',
      titleGetter: (s) => s.catRefrigerated,
      icon: Icons.ac_unit_rounded,
      iconColor: const Color(0xFFEF5350),
      bgColor: const Color(0xFFFFEBEE),
    ),
    CategoryItem(
      id: 'water',
      titleGetter: (s) => s.catWater,
      icon: Icons.water_drop_rounded,
      iconColor: const Color(0xFF0288D1),
      bgColor: const Color(0xFFE0F7FA),
    ),
    CategoryItem(
      id: 'fuels_chemicals',
      titleGetter: (s) => s.catFuelsChemicals,
      icon: Icons.local_gas_station_rounded,
      iconColor: const Color(0xFFE53935),
      bgColor: const Color(0xFFFFEBEE),
    ),
    CategoryItem(
      id: 'other',
      titleGetter: (s) => s.catOther,
      icon: Icons.more_horiz_rounded,
      iconColor: const Color(0xFF78909C),
      bgColor: const Color(0xFFECEFF1),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        return Directionality(
          textDirection: AppLanguage.instance.textDirection,
          child: Scaffold(
            backgroundColor: Colors.white,
            body: SafeArea(
              child: Column(
                children: [
                  // Top Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.arrow_back,
                                    color: Colors.black87,
                                    size: 24,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  s.parcelNewOrder,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.popUntil(
                              context,
                              (route) => route.isFirst,
                            );
                          },
                          child: Text(
                            s.cancel,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Category Grid
                  Expanded(
                    child: GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 1.15,
                      ),
                      itemCount: _categories.length,
                      itemBuilder: (context, index) {
                        final item = _categories[index];
                        final title = item.titleGetter(s);

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              SmoothPageRoute(
                                page: const ParcelVehicleSelectPage(),
                              ),
                            );
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF7F8FA),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.grey.shade100,
                                width: 1,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Icon graphic container
                                Container(
                                  width: 52,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: item.bgColor,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Icon(
                                    item.icon,
                                    color: item.iconColor,
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                  ),
                                  child: Text(
                                    title,
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      height: 1.2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
