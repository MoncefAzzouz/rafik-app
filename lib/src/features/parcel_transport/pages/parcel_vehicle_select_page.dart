import 'package:flutter/material.dart';
import 'parcel_map_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';

/// A truck type nested under a [TruckCategory] (`GET /api/truck/categories`)
/// — this is what gates which `truckTypeId` a `POST /api/truck/orders` call
/// may use for the chosen category.
class TruckTypeOption {
  final String id;
  final String name;
  final String? capacityLabel;
  final num? priceMultiplier;
  final String? image;

  const TruckTypeOption({
    required this.id,
    required this.name,
    this.capacityLabel,
    this.priceMultiplier,
    this.image,
  });

  factory TruckTypeOption.fromJson(Map<String, dynamic> json) =>
      TruckTypeOption(
        id: json['id'].toString(),
        name: json['name']?.toString() ?? '',
        capacityLabel: json['capacityLabel']?.toString(),
        priceMultiplier: json['priceMultiplier'] as num?,
        image: json['image']?.toString(),
      );
}

class ParcelVehicleSelectPage extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final List<TruckTypeOption> truckTypes;

  const ParcelVehicleSelectPage({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.truckTypes,
  });

  @override
  State<ParcelVehicleSelectPage> createState() =>
      _ParcelVehicleSelectPageState();
}

class _ParcelVehicleSelectPageState extends State<ParcelVehicleSelectPage> {
  String? _selectedTruckTypeId;

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
                                widget.categoryName,
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

                  // 2x2 Grid Selector List of Truck Types
                  Expanded(
                    child: widget.truckTypes.isEmpty
                        ? Center(
                            child: Text(
                              s.noResults,
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          )
                        : Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                            ),
                            child: GridView.builder(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 14,
                                    mainAxisSpacing: 14,
                                    childAspectRatio: 1.05,
                                  ),
                              itemCount: widget.truckTypes.length,
                              itemBuilder: (context, index) {
                                final truckType = widget.truckTypes[index];
                                final isSelected =
                                    _selectedTruckTypeId == truckType.id;

                                return GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _selectedTruckTypeId = truckType.id;
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(
                                      milliseconds: 200,
                                    ),
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
                                                color: AppColors.primary
                                                    .withAlpha(30),
                                                blurRadius: 10,
                                                offset: const Offset(0, 4),
                                              ),
                                            ]
                                          : [
                                              BoxShadow(
                                                color: Colors.black.withAlpha(
                                                  5,
                                                ),
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
                                                child:
                                                    truckType.image != null &&
                                                        truckType
                                                            .image!
                                                            .isNotEmpty
                                                    ? ClipRRect(
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              12,
                                                            ),
                                                        child: Image.network(
                                                          truckType.image!,
                                                          width:
                                                              double.infinity,
                                                          fit: BoxFit.contain,
                                                          errorBuilder:
                                                              (
                                                                context,
                                                                error,
                                                                stackTrace,
                                                              ) => const Icon(
                                                                Icons
                                                                    .local_shipping_outlined,
                                                                size: 40,
                                                                color: AppColors
                                                                    .primary,
                                                              ),
                                                        ),
                                                      )
                                                    : const Icon(
                                                        Icons
                                                            .local_shipping_outlined,
                                                        size: 40,
                                                        color:
                                                            AppColors.primary,
                                                      ),
                                              ),
                                              const SizedBox(height: 10),
                                              Text(
                                                truckType.name,
                                                textAlign: TextAlign.center,
                                                maxLines: 2,
                                                overflow:
                                                    TextOverflow.ellipsis,
                                                style: TextStyle(
                                                  color: isSelected
                                                      ? AppColors.primary
                                                      : Colors.black87,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              if (truckType.capacityLabel !=
                                                      null &&
                                                  truckType
                                                      .capacityLabel!
                                                      .isNotEmpty) ...[
                                                const SizedBox(height: 3),
                                                Text(
                                                  truckType.capacityLabel!,
                                                  textAlign: TextAlign.center,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    color:
                                                        Colors.grey.shade500,
                                                    fontSize: 11,
                                                    fontWeight:
                                                        FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          Positioned(
                                            top: 8,
                                            left: 8,
                                            child: Container(
                                              padding: const EdgeInsets.all(
                                                4,
                                              ),
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
                        onPressed: _selectedTruckTypeId == null
                            ? null
                            : () {
                                final selected = widget.truckTypes.firstWhere(
                                  (t) => t.id == _selectedTruckTypeId,
                                );
                                Navigator.push(
                                  context,
                                  SmoothPageRoute(
                                    page: ParcelMapPage(
                                      categoryId: widget.categoryId,
                                      categoryName: widget.categoryName,
                                      truckType: selected,
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
