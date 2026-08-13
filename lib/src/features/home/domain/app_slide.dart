/// A home/promo banner slide, matching the backend `AppSlide` shape
/// (`GET /api/app/slides`).
class AppSlide {
  final String id;
  final String type;
  final String? title;
  final String? subtitle;
  final String image;
  final String? link;
  final String? promoCodeId;
  final int sortOrder;

  const AppSlide({
    required this.id,
    required this.type,
    this.title,
    this.subtitle,
    required this.image,
    this.link,
    this.promoCodeId,
    required this.sortOrder,
  });

  factory AppSlide.fromJson(Map<String, dynamic> json) {
    return AppSlide(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'home',
      title: json['title'] as String?,
      subtitle: json['subtitle'] as String?,
      image: json['image']?.toString() ?? '',
      link: json['link'] as String?,
      promoCodeId: json['promoCodeId'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}
