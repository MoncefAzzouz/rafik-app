import 'package:flutter/material.dart';
import 'parcel_map_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smooth_page_route.dart';

class VehicleType {
  final String name;
  final String image;
  final String code;

  VehicleType({
    required this.name,
    required this.image,
    required this.code,
  });
}

class ParcelVehicleSelectPage extends StatefulWidget {
  const ParcelVehicleSelectPage({super.key});

  @override
  State<ParcelVehicleSelectPage> createState() => _ParcelVehicleSelectPageState();
}

class _ParcelVehicleSelectPageState extends State<ParcelVehicleSelectPage> {
  String? _selectedVehicleCode;

  final List<VehicleType> _vehicles = [
    VehicleType(
      name: 'هاربين',
      image: 'https://images.unsplash.com/photo-1516576880669-dfc1d53db4a0?w=400', // mini pickup
      code: 'harbin',
    ),
    VehicleType(
      name: 'فورغون',
      image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', // van
      code: 'fourgon',
    ),
    VehicleType(
      name: 'شاحنة مغلقة',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400', // cargo truck
      code: 'truck',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Icon(
                            Icons.arrow_back,
                            color: Colors.black87,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Text(
                          'طلب جديد',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        // Cancel request, go back to dashboard
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      child: Text(
                        'إلغاء',
                        style: TextStyle(
                          color: Colors.blue.shade600,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Subheader Box containing Truck Icon and Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.local_shipping_outlined,
                        color: AppColors.primary,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'نوع المركبة',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'اختر نوع الشاحنة المناسب لشحنتك',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Horizontal Selector List of Vehicles
              SizedBox(
                height: 160,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  itemCount: _vehicles.length,
                  itemBuilder: (context, index) {
                    final vehicle = _vehicles[index];
                    final isSelected = _selectedVehicleCode == vehicle.code;

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedVehicleCode = vehicle.code;
                        });
                      },
                      child: Container(
                        width: 130,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : Colors.transparent,
                            width: 2,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withAlpha(20),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : null,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                vehicle.image,
                                height: 75,
                                width: 100,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.image_not_supported_outlined,
                                    size: 40,
                                    color: Colors.grey,
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              vehicle.name,
                              style: TextStyle(
                                color: isSelected ? AppColors.primary : Colors.black87,
                                fontSize: 14,
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

              const Spacer(),

              // Bottom CTA button
              Padding(
                padding: const EdgeInsets.all(20),
                child: SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _selectedVehicleCode == null
                        ? null
                        : () {
                            Navigator.push(
                              context,
                              SmoothPageRoute(
                                page: ParcelMapPage(
                                  selectedVehicle: _vehicles.firstWhere(
                                    (v) => v.code == _selectedVehicleCode,
                                  ),
                                ),
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade200,
                      disabledForegroundColor: Colors.grey.shade400,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'التالي',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
