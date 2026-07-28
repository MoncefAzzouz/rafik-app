import 'package:latlong2/latlong.dart';

enum DeliveryStatus { offered, accepted, pickedUp, delivering, completed }

class DeliveryJob {
  final String id;
  final String pickupName;
  final String pickupAddress;
  final String destinationName;
  final String destinationAddress;
  final LatLng pickupPoint;
  final LatLng destinationPoint;
  final String packageType;
  final String vehicleType;
  final double pickupKm;
  final double tripKm;
  final int estimatedMinutes;
  final int payoutDzd;
  final int packageCount;
  final DateTime createdAt;
  DeliveryStatus status;

  DeliveryJob({
    required this.id,
    required this.pickupName,
    required this.pickupAddress,
    required this.destinationName,
    required this.destinationAddress,
    required this.pickupPoint,
    required this.destinationPoint,
    required this.packageType,
    required this.vehicleType,
    required this.pickupKm,
    required this.tripKm,
    required this.estimatedMinutes,
    required this.payoutDzd,
    required this.packageCount,
    required this.createdAt,
    this.status = DeliveryStatus.offered,
  });
}
