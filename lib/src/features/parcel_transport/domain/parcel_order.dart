/// A truck order matching the backend `TruckOrder` shape
/// (`rafik-app-backend`'s `/api/truck/orders` resource).
class ParcelOrder {
  final String id;
  final String orderNumber;
  final String categoryId;
  final String categoryName;
  final String? truckTypeId;
  final String? truckTypeName;
  final String pickupAddress;
  final String? pickupWilaya;
  final double? pickupLat;
  final double? pickupLng;
  final String destinationAddress;
  final String? destinationWilaya;
  final double? destinationLat;
  final double? destinationLng;
  final double? distanceKm;
  final String description;
  final String? invoiceStatus;
  final String? scheduledType;
  final DateTime? scheduledDate;
  final double? estimatedPrice;
  final double? agreedPrice;
  final String status;
  final String? mapsDirectionsUrl;
  final String? mapsPickupUrl;
  final String? mapsDestinationUrl;
  final DateTime createdAt;

  const ParcelOrder({
    required this.id,
    required this.orderNumber,
    required this.categoryId,
    required this.categoryName,
    this.truckTypeId,
    this.truckTypeName,
    required this.pickupAddress,
    this.pickupWilaya,
    this.pickupLat,
    this.pickupLng,
    required this.destinationAddress,
    this.destinationWilaya,
    this.destinationLat,
    this.destinationLng,
    this.distanceKm,
    required this.description,
    this.invoiceStatus,
    this.scheduledType,
    this.scheduledDate,
    this.estimatedPrice,
    this.agreedPrice,
    required this.status,
    this.mapsDirectionsUrl,
    this.mapsPickupUrl,
    this.mapsDestinationUrl,
    required this.createdAt,
  });

  factory ParcelOrder.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map<String, dynamic>?;
    final truckType = json['truckType'] as Map<String, dynamic>?;
    final maps = json['maps'] as Map<String, dynamic>?;

    return ParcelOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      categoryId:
          json['categoryId']?.toString() ?? category?['id']?.toString() ?? '',
      categoryName: category?['name']?.toString() ?? '',
      truckTypeId:
          json['truckTypeId']?.toString() ?? truckType?['id']?.toString(),
      truckTypeName: truckType?['name']?.toString(),
      pickupAddress: json['pickupAddress']?.toString() ?? '',
      pickupWilaya: json['pickupWilaya']?.toString(),
      pickupLat: (json['pickupLat'] as num?)?.toDouble(),
      pickupLng: (json['pickupLng'] as num?)?.toDouble(),
      destinationAddress: json['destinationAddress']?.toString() ?? '',
      destinationWilaya: json['destinationWilaya']?.toString(),
      destinationLat: (json['destinationLat'] as num?)?.toDouble(),
      destinationLng: (json['destinationLng'] as num?)?.toDouble(),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      description: json['description']?.toString() ?? '',
      invoiceStatus: json['invoiceStatus']?.toString(),
      scheduledType: json['scheduledType']?.toString(),
      scheduledDate: json['scheduledDate'] != null
          ? DateTime.tryParse(json['scheduledDate'].toString())
          : null,
      estimatedPrice: (json['estimatedPrice'] as num?)?.toDouble(),
      agreedPrice: (json['agreedPrice'] as num?)?.toDouble(),
      status: json['status']?.toString() ?? 'requested',
      mapsDirectionsUrl: maps?['directionsUrl']?.toString(),
      mapsPickupUrl: maps?['pickupMapUrl']?.toString(),
      mapsDestinationUrl: maps?['destinationMapUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ??
              DateTime.now())
          : DateTime.now(),
    );
  }

  static const Set<String> archivedStatuses = {
    'delivered',
    'cancelled_by_client',
    'cancelled_by_driver',
    'cancelled_by_admin',
  };

  bool get isArchived => archivedStatuses.contains(status);
  bool get isCancelled => status.startsWith('cancelled_');
  bool get isDelivered => status == 'delivered';
}

/// Maps the backend's 9 literal order-status strings onto a 0-4 stepper
/// position (requested → accepted → arrived/loading → in_transit →
/// delivered), or -1 for any of the 3 `cancelled_*` statuses, which get a
/// distinct visual treatment instead of a stepper position.
int parcelStatusStepIndex(String status) {
  switch (status) {
    case 'requested':
      return 0;
    case 'accepted':
      return 1;
    case 'arrived':
    case 'loading':
      return 2;
    case 'in_transit':
      return 3;
    case 'delivered':
      return 4;
    default:
      return -1;
  }
}

/// Result of `POST /api/truck/quote` — a pre-commitment price estimate.
class TruckQuote {
  final double? estimatedPrice;
  final double? distanceKm;
  final int? durationMin;
  final String? destinationDisplay;

  const TruckQuote({
    this.estimatedPrice,
    this.distanceKm,
    this.durationMin,
    this.destinationDisplay,
  });

  factory TruckQuote.fromJson(Map<String, dynamic> json) => TruckQuote(
    estimatedPrice: (json['estimatedPrice'] as num?)?.toDouble(),
    distanceKm: (json['distanceKm'] as num?)?.toDouble(),
    durationMin: (json['durationMin'] as num?)?.toInt(),
    destinationDisplay: json['destinationDisplay']?.toString(),
  );
}
