import 'package:flutter/material.dart';
import 'parcel_vehicle_select_page.dart';
import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';

/// A truck category from `GET /api/truck/categories`, with its nested,
/// allowed `truckTypes` — booking requires picking a category first since
/// `POST /api/truck/orders` requires `categoryId`.
class TruckCategory {
  final String id;
  final String name;
  final String? description;
  final String? image;
  final bool isActive;
  final List<TruckTypeOption> truckTypes;

  const TruckCategory({
    required this.id,
    required this.name,
    this.description,
    this.image,
    required this.isActive,
    required this.truckTypes,
  });

  factory TruckCategory.fromJson(Map<String, dynamic> json) {
    final types = (json['truckTypes'] as List<dynamic>? ?? [])
        .map((e) => TruckTypeOption.fromJson(e as Map<String, dynamic>))
        .toList();
    return TruckCategory(
      id: json['id'].toString(),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      image: json['image']?.toString(),
      isActive: json['isActive'] as bool? ?? true,
      truckTypes: types,
    );
  }
}

class ParcelCategorySelectPage extends StatefulWidget {
  const ParcelCategorySelectPage({super.key});

  @override
  State<ParcelCategorySelectPage> createState() =>
      _ParcelCategorySelectPageState();
}

class _ParcelCategorySelectPageState extends State<ParcelCategorySelectPage> {
  // Cosmetic icon/color pairing cycled by index — the backend doesn't send
  // per-category colors, only an optional image.
  static const List<List<Color>> _palette = [
    [Color(0xFFAB47BC), Color(0xFFF3E5F5)],
    [Color(0xFFFFA726), Color(0xFFFFF3E0)],
    [Color(0xFF29B6F6), Color(0xFFE1F5FE)],
    [Color(0xFFFF7043), Color(0xFFFBE9E7)],
    [Color(0xFFD84315), Color(0xFFFBE9E7)],
    [Color(0xFF1E88E5), Color(0xFFE3F2FD)],
    [Color(0xFFEF5350), Color(0xFFFFEBEE)],
    [Color(0xFF0288D1), Color(0xFFE0F7FA)],
    [Color(0xFFE53935), Color(0xFFFFEBEE)],
    [Color(0xFF78909C), Color(0xFFECEFF1)],
  ];

  bool _isLoading = true;
  String? _errorMessage;
  List<TruckCategory> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await ApiClient.instance.get('/api/truck/categories');
    if (!mounted) return;

    switch (result) {
      case Success(value: final data):
        final categories = (data as List)
            .map((e) => TruckCategory.fromJson(e as Map<String, dynamic>))
            .where((c) => c.isActive)
            .toList();
        setState(() {
          _categories = categories;
          _isLoading = false;
        });
      case Failure(failure: final failure):
        setState(() {
          _errorMessage = failure.message;
          _isLoading = false;
        });
    }
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

                  Expanded(child: _buildBody(s)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBody(AppStrings s) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.wifi_off_rounded,
                size: 48,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadCategories,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
                child: Text(s.retry),
              ),
            ],
          ),
        ),
      );
    }

    if (_categories.isEmpty) {
      return Center(
        child: Text(
          s.noResults,
          style: TextStyle(color: Colors.grey.shade600),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 1.15,
      ),
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        final colors = _palette[index % _palette.length];

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              SmoothPageRoute(
                page: ParcelVehicleSelectPage(
                  categoryId: category.id,
                  categoryName: category.name,
                  truckTypes: category.truckTypes,
                ),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF7F8FA),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade100, width: 1),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: colors[1],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: category.image != null && category.image!.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            category.image!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                Icon(
                                  Icons.local_shipping_rounded,
                                  color: colors[0],
                                  size: 28,
                                ),
                          ),
                        )
                      : Icon(
                          Icons.local_shipping_rounded,
                          color: colors[0],
                          size: 28,
                        ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    category.name,
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
    );
  }
}
