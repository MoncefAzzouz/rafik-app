class TruckProfile {
  final String id;
  final String truckCode;
  final String driverName;
  final String phone;
  final String? email;
  final String? plate;
  final String? truckTypeId;
  final String? truckTypeName;
  final String status;
  final double? rating;
  final int totalTrips;
  final bool isVerified;
  final bool isActive;
  final String? wilaya;
  final String? commune;

  const TruckProfile({
    required this.id,
    required this.truckCode,
    required this.driverName,
    required this.phone,
    this.email,
    this.plate,
    this.truckTypeId,
    this.truckTypeName,
    required this.status,
    this.rating,
    required this.totalTrips,
    required this.isVerified,
    required this.isActive,
    this.wilaya,
    this.commune,
  });

  factory TruckProfile.fromJson(Map<String, dynamic> json) {
    final truckType = json['truckType'] as Map<String, dynamic>?;
    return TruckProfile(
      id: json['id'].toString(),
      truckCode: json['truckCode'] as String? ?? '',
      driverName: json['driverName'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String?,
      plate: json['plate'] as String?,
      truckTypeId: json['truckTypeId']?.toString(),
      truckTypeName: truckType?['name'] as String?,
      status: json['status'] as String? ?? 'offline',
      rating: (json['rating'] as num?)?.toDouble(),
      totalTrips: (json['totalTrips'] as num?)?.toInt() ?? 0,
      isVerified: json['isVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      wilaya: json['wilaya'] as String?,
      commune: json['commune'] as String?,
    );
  }
}
