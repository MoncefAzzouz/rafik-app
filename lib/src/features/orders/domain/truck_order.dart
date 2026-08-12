/// Plain-string status constants (not a closed Dart enum) since the backend
/// may add more literal values over time.
class TruckOrderStatus {
  static const requested = 'requested';
  static const accepted = 'accepted';
  static const arrived = 'arrived';
  static const loading = 'loading';
  static const inTransit = 'in_transit';
  static const delivered = 'delivered';
  static const cancelledByClient = 'cancelled_by_client';
  static const cancelledByDriver = 'cancelled_by_driver';
  static const cancelledByAdmin = 'cancelled_by_admin';

  const TruckOrderStatus._();
}

class TruckOrderCategory {
  final String id;
  final String name;

  const TruckOrderCategory({required this.id, required this.name});

  factory TruckOrderCategory.fromJson(Map<String, dynamic> json) =>
      TruckOrderCategory(
        id: json['id'].toString(),
        name: json['name'] as String? ?? '',
      );
}

class TruckOrderTruckType {
  final String id;
  final String name;
  final double? priceMultiplier;
  final String? capacityLabel;

  const TruckOrderTruckType({
    required this.id,
    required this.name,
    this.priceMultiplier,
    this.capacityLabel,
  });

  factory TruckOrderTruckType.fromJson(Map<String, dynamic> json) =>
      TruckOrderTruckType(
        id: json['id'].toString(),
        name: json['name'] as String? ?? '',
        priceMultiplier: (json['priceMultiplier'] as num?)?.toDouble(),
        capacityLabel: json['capacityLabel'] as String?,
      );
}

class TruckOrderMaps {
  final String? pickupMapUrl;
  final String? destinationMapUrl;
  final String? directionsUrl;

  const TruckOrderMaps({
    this.pickupMapUrl,
    this.destinationMapUrl,
    this.directionsUrl,
  });

  factory TruckOrderMaps.fromJson(Map<String, dynamic>? json) =>
      TruckOrderMaps(
        pickupMapUrl: json?['pickupMapUrl'] as String?,
        destinationMapUrl: json?['destinationMapUrl'] as String?,
        directionsUrl: json?['directionsUrl'] as String?,
      );
}

class TruckOrder {
  final String id;
  final String orderNumber;
  final String? clientId;
  final String clientName;
  final String? clientPhone;
  final String? categoryId;
  final TruckOrderCategory? category;
  final String? truckTypeId;
  final TruckOrderTruckType? truckType;
  final String pickupAddress;
  final String? pickupWilaya;
  final String? pickupCommune;
  final double? pickupLat;
  final double? pickupLng;
  final String destinationAddress;
  final String? destinationWilaya;
  final double? destinationLat;
  final double? destinationLng;
  final double? distanceKm;
  final String? description;
  final String? invoiceStatus;
  final String? scheduledType;
  final DateTime? scheduledDate;
  final int? estimatedPrice;
  final int? agreedPrice;
  final String status;
  final String? cancelledBy;
  final String? cancelReason;
  final String? cancelStage;
  final DateTime? createdAt;
  final DateTime? acceptedAt;
  final DateTime? arrivedAt;
  final DateTime? loadingAt;
  final DateTime? transitAt;
  final DateTime? deliveredAt;
  final DateTime? cancelledAt;
  final double? commissionPercentSnapshot;
  final int? commissionAmount;
  final int? driverEarnings;
  final TruckOrderMaps maps;

  const TruckOrder({
    required this.id,
    required this.orderNumber,
    this.clientId,
    required this.clientName,
    this.clientPhone,
    this.categoryId,
    this.category,
    this.truckTypeId,
    this.truckType,
    required this.pickupAddress,
    this.pickupWilaya,
    this.pickupCommune,
    this.pickupLat,
    this.pickupLng,
    required this.destinationAddress,
    this.destinationWilaya,
    this.destinationLat,
    this.destinationLng,
    this.distanceKm,
    this.description,
    this.invoiceStatus,
    this.scheduledType,
    this.scheduledDate,
    this.estimatedPrice,
    this.agreedPrice,
    required this.status,
    this.cancelledBy,
    this.cancelReason,
    this.cancelStage,
    this.createdAt,
    this.acceptedAt,
    this.arrivedAt,
    this.loadingAt,
    this.transitAt,
    this.deliveredAt,
    this.cancelledAt,
    this.commissionPercentSnapshot,
    this.commissionAmount,
    this.driverEarnings,
    this.maps = const TruckOrderMaps(),
  });

  factory TruckOrder.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) =>
        value == null ? null : DateTime.tryParse(value as String);

    return TruckOrder(
      id: json['id'].toString(),
      orderNumber: json['orderNumber']?.toString() ?? '',
      clientId: json['clientId']?.toString(),
      clientName: json['clientName'] as String? ?? '',
      clientPhone: json['clientPhone'] as String?,
      categoryId: json['categoryId']?.toString(),
      category: json['category'] != null
          ? TruckOrderCategory.fromJson(
              json['category'] as Map<String, dynamic>,
            )
          : null,
      truckTypeId: json['truckTypeId']?.toString(),
      truckType: json['truckType'] != null
          ? TruckOrderTruckType.fromJson(
              json['truckType'] as Map<String, dynamic>,
            )
          : null,
      pickupAddress: json['pickupAddress'] as String? ?? '',
      pickupWilaya: json['pickupWilaya'] as String?,
      pickupCommune: json['pickupCommune'] as String?,
      pickupLat: (json['pickupLat'] as num?)?.toDouble(),
      pickupLng: (json['pickupLng'] as num?)?.toDouble(),
      destinationAddress: json['destinationAddress'] as String? ?? '',
      destinationWilaya: json['destinationWilaya'] as String?,
      destinationLat: (json['destinationLat'] as num?)?.toDouble(),
      destinationLng: (json['destinationLng'] as num?)?.toDouble(),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      description: json['description'] as String?,
      invoiceStatus: json['invoiceStatus'] as String?,
      scheduledType: json['scheduledType'] as String?,
      scheduledDate: parseDate(json['scheduledDate']),
      estimatedPrice: (json['estimatedPrice'] as num?)?.toInt(),
      agreedPrice: (json['agreedPrice'] as num?)?.toInt(),
      status: json['status'] as String? ?? TruckOrderStatus.requested,
      cancelledBy: json['cancelledBy'] as String?,
      cancelReason: json['cancelReason'] as String?,
      cancelStage: json['cancelStage'] as String?,
      createdAt: parseDate(json['createdAt']),
      acceptedAt: parseDate(json['acceptedAt']),
      arrivedAt: parseDate(json['arrivedAt']),
      loadingAt: parseDate(json['loadingAt']),
      transitAt: parseDate(json['transitAt']),
      deliveredAt: parseDate(json['deliveredAt']),
      cancelledAt: parseDate(json['cancelledAt']),
      commissionPercentSnapshot: (json['commissionPercentSnapshot'] as num?)
          ?.toDouble(),
      commissionAmount: (json['commissionAmount'] as num?)?.toInt(),
      driverEarnings: (json['driverEarnings'] as num?)?.toInt(),
      maps: TruckOrderMaps.fromJson(json['maps'] as Map<String, dynamic>?),
    );
  }
}
