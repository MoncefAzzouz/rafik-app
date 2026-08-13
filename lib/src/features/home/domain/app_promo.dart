/// An in-app promo code, matching the backend's public promo shape
/// (`GET /api/app/promos`).
class AppPromo {
  final String id;
  final String code;
  final String? description;
  final String scope;
  final String discountType; // 'PERCENTAGE' | 'FIXED'
  final double discountValue;
  final double? maxDiscount;
  final double? minOrderAmount;
  final DateTime? expiresAt;
  final String? appBanner;

  const AppPromo({
    required this.id,
    required this.code,
    this.description,
    required this.scope,
    required this.discountType,
    required this.discountValue,
    this.maxDiscount,
    this.minOrderAmount,
    this.expiresAt,
    this.appBanner,
  });

  /// A short, formatted label like "20% off" or "500 DZD off".
  String get discountLabel => discountType == 'PERCENTAGE'
      ? '${discountValue.toStringAsFixed(discountValue % 1 == 0 ? 0 : 1)}% off'
      : '${discountValue.toStringAsFixed(0)} DZD off';

  factory AppPromo.fromJson(Map<String, dynamic> json) {
    return AppPromo(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      description: json['description'] as String?,
      scope: json['scope']?.toString() ?? 'ALL',
      discountType: json['discountType']?.toString() ?? 'PERCENTAGE',
      discountValue: (json['discountValue'] as num?)?.toDouble() ?? 0,
      maxDiscount: (json['maxDiscount'] as num?)?.toDouble(),
      minOrderAmount: (json['minOrderAmount'] as num?)?.toDouble(),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
      appBanner: json['appBanner'] as String?,
    );
  }
}
