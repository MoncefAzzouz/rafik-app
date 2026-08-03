import 'package:flutter/material.dart';
import 'parcel_map_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';

class VehicleType {
  final String Function(AppStrings s) nameGetter;
  final String image;
  final String code;

  VehicleType({
    required this.nameGetter,
    required this.image,
    required this.code,
  });

  String get name => nameGetter(AppStrings(AppLanguage.instance.value));
  String localizedName(AppStrings s) => nameGetter(s);
}

class ParcelVehicleSelectPage extends StatefulWidget {
  const ParcelVehicleSelectPage({super.key});

  @override
  State<ParcelVehicleSelectPage> createState() =>
      _ParcelVehicleSelectPageState();
}

class _ParcelVehicleSelectPageState extends State<ParcelVehicleSelectPage> {
  String? _selectedVehicleCode;

  final List<VehicleType> _vehicles = [
    VehicleType(
      nameGetter: (s) => 'CAMION 6x2 PLATEAU',
      image: 'assets/images/311.png',
      code: 'camion_6x2_plateau',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 PLATEAU',
      image: 'assets/images/a1.png',
      code: 'camion_6x4_plateau',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x2 MARICHI',
      image: 'assets/images/a2.png',
      code: 'camion_6x2_marichi',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 MARICHI',
      image: 'assets/images/a3.png',
      code: 'camion_6x4_marichi',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x2 Citerne Alimentaire',
      image: 'assets/images/a33.png',
      code: 'camion_6x2_citerne_alim',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 Citerne Non Alimentaire',
      image: 'assets/images/a213.png',
      code: 'camion_6x4_citerne_non_alim',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x2 À Froid',
      image: 'assets/images/a223.png',
      code: 'camion_6x2_froid',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 À Froid',
      image: 'assets/images/adsac.png',
      code: 'camion_6x4_froid',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x2 À Panne',
      image: 'assets/images/dsad.png',
      code: 'camion_6x2_panne',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 À Panne',
      image: 'assets/images/l21.png',
      code: 'camion_6x4_panne',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 10T - 20T MARICHI - PLATEAU',
      image: 'assets/images/lsx.png',
      code: 'camion_10t_20t_marichi_plateau',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 10T - 20T À Froid',
      image: 'assets/images/v2.png',
      code: 'camion_10t_20t_froid',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION Porte Véhicule',
      image: 'assets/images/v21.png',
      code: 'camion_porte_vehicule',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION Porte-Char',
      image: 'assets/images/X12.png',
      code: 'camion_porte_char',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION Dépannage 10T - 20T Lourdes',
      image: 'assets/images/dsad.png',
      code: 'camion_depannage_lourdes',
    ),
    VehicleType(
      nameGetter: (s) => 'CAMION 6x4 Citerne',
      image: 'assets/images/a213.png',
      code: 'camion_6x4_citerne',
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
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
                            Text(
                              s.parcelNewOrder,
                              style: const TextStyle(
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
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.vehicleTypeTitle,
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                s.vehicleTypeSubtitle,
                                style: TextStyle(
                                  color: Colors.grey.shade500,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 2x2 Grid Selector List of Vehicles (2 under 2)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: GridView.builder(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                          childAspectRatio: 1.15,
                        ),
                        itemCount: _vehicles.length,
                        itemBuilder: (context, index) {
                          final vehicle = _vehicles[index];
                          final isSelected =
                              _selectedVehicleCode == vehicle.code;

                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedVehicleCode = vehicle.code;
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withAlpha(12)
                                    : const Color(0xFFF9FAFB),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary
                                      : Colors.grey.shade200,
                                  width: isSelected ? 2 : 1,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color:
                                              AppColors.primary.withAlpha(30),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        ),
                                      ]
                                    : [
                                        BoxShadow(
                                          color: Colors.black.withAlpha(5),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                              ),
                              child: Stack(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            child: vehicle.image.startsWith('assets/')
                                                ? Image.asset(
                                                    vehicle.image,
                                                    width: double.infinity,
                                                    fit: BoxFit.contain,
                                                    errorBuilder: (context,
                                                        error, stackTrace) {
                                                      return const Icon(
                                                        Icons
                                                            .image_not_supported_outlined,
                                                        size: 36,
                                                        color: Colors.grey,
                                                      );
                                                    },
                                                  )
                                                : Image.network(
                                                    vehicle.image,
                                                    width: double.infinity,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (context,
                                                        error, stackTrace) {
                                                      return const Icon(
                                                        Icons
                                                            .image_not_supported_outlined,
                                                        size: 36,
                                                        color: Colors.grey,
                                                      );
                                                    },
                                                  ),
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          vehicle.localizedName(s),
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: isSelected
                                                ? AppColors.primary
                                                : Colors.black87,
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isSelected)
                                    Positioned(
                                      top: 8,
                                      left: 8,
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.check,
                                          color: Colors.white,
                                          size: 14,
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
                  ),

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
                        child: Text(
                          s.next,
                          style: const TextStyle(
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
      },
    );
  }
}
