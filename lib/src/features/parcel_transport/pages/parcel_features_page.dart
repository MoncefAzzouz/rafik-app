import 'package:flutter/material.dart';
import 'parcel_map_page.dart';
import 'parcel_vehicle_select_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../../../core/widgets/cached_image.dart';

/// One selectable value of a [TruckFeature] (e.g. "20" for Size).
class TruckFeatureOption {
  final String id;
  final String label;
  final String? image;

  const TruckFeatureOption({required this.id, required this.label, this.image});

  factory TruckFeatureOption.fromJson(Map<String, dynamic> json) =>
      TruckFeatureOption(
        id: json['id'].toString(),
        label: json['label']?.toString() ?? '',
        image: json['image']?.toString(),
      );
}

/// An admin-defined feature of a truck type (`features` on
/// `GET /api/truck/types`), e.g. Size, with its image/label options.
class TruckFeature {
  final String id;
  final String name;
  final List<TruckFeatureOption> options;

  const TruckFeature({
    required this.id,
    required this.name,
    required this.options,
  });

  factory TruckFeature.fromJson(Map<String, dynamic> json) => TruckFeature(
    id: json['id'].toString(),
    name: json['name']?.toString() ?? '',
    options: (json['options'] as List? ?? const [])
        .map((e) => TruckFeatureOption.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

/// Shown after a truck type is picked, only when that type has features.
class ParcelFeaturesPage extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final TruckTypeOption truckType;
  final List<TruckFeature> features;

  const ParcelFeaturesPage({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.truckType,
    required this.features,
  });

  @override
  State<ParcelFeaturesPage> createState() => _ParcelFeaturesPageState();
}

class _ParcelFeaturesPageState extends State<ParcelFeaturesPage> {
  /// featureId -> chosen optionId
  final Map<String, String> _selected = {};

  Widget _optionTile(TruckFeature feature, TruckFeatureOption option) {
    final isSelected = _selected[feature.id] == option.id;
    final hasImage = option.image != null && option.image!.isNotEmpty;
    return GestureDetector(
      onTap: () => setState(() => _selected[feature.id] = option.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withAlpha(12)
              : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primary.withAlpha(30)
                  : Colors.black.withAlpha(5),
              blurRadius: isSelected ? 10 : 6,
              offset: Offset(0, isSelected ? 4 : 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Expanded(
                    child: hasImage
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedImage(
                              url: option.image!,
                              width: double.infinity,
                              fit: BoxFit.contain,
                              errorBuilder: (_) => const Icon(
                                Icons.local_shipping_outlined,
                                size: 40,
                                color: AppColors.primary,
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.local_shipping_outlined,
                            size: 40,
                            color: AppColors.primary,
                          ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    feature.name.trim(),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    option.label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 13,
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
                  child: const Icon(Icons.check, color: Colors.white, size: 14),
                ),
              ),
          ],
        ),
      ),
    );
  }

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
                          onTap: () => Navigator.popUntil(
                            context,
                            (route) => route.isFirst,
                          ),
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
                                s.truckFeatures,
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                widget.truckType.name.trim(),
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
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      children: [
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                          childAspectRatio: 0.9,
                          children: [
                            for (final f in widget.features)
                              for (final o in f.options) _optionTile(f, o),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: () => Navigator.push(
                          context,
                          SmoothPageRoute(
                            page: ParcelMapPage(
                              categoryId: widget.categoryId,
                              categoryName: widget.categoryName,
                              truckType: widget.truckType,
                            ),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
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
