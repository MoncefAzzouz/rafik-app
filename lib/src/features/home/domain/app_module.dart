/// A home-screen service tile, matching the backend `AppModule` shape
/// (`GET /api/app/modules`). `icon` is either a full image URL or a bare
/// emoji string — the backend gives no separate flag, so callers must sniff
/// it (see `_ModuleIcon` in home_page.dart).
class AppModule {
  final String id;
  final String type;
  final String? refId;
  final String label;
  final String? labelAr;
  final String? icon;
  final String? color;
  final String? link;
  final bool locked;
  final bool comingSoon;
  final int sortOrder;

  const AppModule({
    required this.id,
    required this.type,
    this.refId,
    required this.label,
    this.labelAr,
    this.icon,
    this.color,
    this.link,
    required this.locked,
    required this.comingSoon,
    required this.sortOrder,
  });

  /// The module types with a real page built for them so far. `truck_category`
  /// is an admin-created tile scoped to one specific TruckCategory (via
  /// [refId]) — it's still the truck/parcel feature, just finer-grained, so
  /// it routes to the same place as a plain `truck` module.
  bool get hasWiredDestination =>
      type == 'truck' || type == 'truck_category' || type == 'taxi' || type == 'food';

  /// `truck` and `truck_category` both open the parcel/truck flow.
  bool get isTruck => type == 'truck' || type == 'truck_category';

  bool get isTappable => !locked && !comingSoon && hasWiredDestination;

  factory AppModule.fromJson(Map<String, dynamic> json) {
    return AppModule(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'custom',
      refId: json['refId'] as String?,
      label: json['label']?.toString() ?? '',
      labelAr: json['labelAr'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      link: json['link'] as String?,
      locked: json['locked'] as bool? ?? false,
      comingSoon: json['comingSoon'] as bool? ?? false,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}
