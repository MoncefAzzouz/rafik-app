import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

import '../domain/delivery_job.dart';

class DeliveryRepository extends ChangeNotifier {
  DeliveryRepository._();

  static final instance = DeliveryRepository._();

  bool _isOnline = false;
  DeliveryJob? _activeJob;
  final List<DeliveryJob> _completedJobs = [];

  final List<DeliveryJob> _offers = [
    DeliveryJob(
      id: 'RF-4821',
      pickupName: 'Park Mall Sétif',
      pickupAddress: 'Avenue de l’ALN, Sétif',
      destinationName: 'Cité El Hidhab',
      destinationAddress: 'Bloc 14, El Hidhab, Sétif',
      pickupPoint: const LatLng(36.1898, 5.4095),
      destinationPoint: const LatLng(36.2030, 5.4230),
      packageType: 'Electronics · Fragile',
      vehicleType: 'Car',
      pickupKm: 1.2,
      tripKm: 6.8,
      estimatedMinutes: 24,
      payoutDzd: 780,
      packageCount: 1,
      createdAt: DateTime.now().subtract(const Duration(minutes: 2)),
    ),
    DeliveryJob(
      id: 'RF-4819',
      pickupName: 'Sétif Centre',
      pickupAddress: 'Rue du 8 Mai 1945, Sétif',
      destinationName: 'Aïn Arnat',
      destinationAddress: 'Centre-ville, Aïn Arnat',
      pickupPoint: const LatLng(36.1911, 5.4137),
      destinationPoint: const LatLng(36.1866, 5.3126),
      packageType: 'Documents',
      vehicleType: 'Motorbike',
      pickupKm: 2.7,
      tripKm: 12.4,
      estimatedMinutes: 35,
      payoutDzd: 1120,
      packageCount: 2,
      createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
    ),
    DeliveryJob(
      id: 'RF-4815',
      pickupName: 'Zone Industrielle',
      pickupAddress: 'Zone Industrielle, Sétif',
      destinationName: 'El Eulma',
      destinationAddress: 'Route de Sétif, El Eulma',
      pickupPoint: const LatLng(36.1752, 5.3982),
      destinationPoint: const LatLng(36.1528, 5.6902),
      packageType: 'Home appliances · Heavy',
      vehicleType: 'Van',
      pickupKm: 4.1,
      tripKm: 28.6,
      estimatedMinutes: 52,
      payoutDzd: 2650,
      packageCount: 3,
      createdAt: DateTime.now().subtract(const Duration(minutes: 8)),
    ),
  ];

  bool get isOnline => _isOnline;
  DeliveryJob? get activeJob => _activeJob;
  List<DeliveryJob> get offers => List.unmodifiable(_offers);
  List<DeliveryJob> get completedJobs => List.unmodifiable(_completedJobs);
  int get todayEarnings =>
      _completedJobs.fold(3460, (sum, job) => sum + job.payoutDzd);
  int get todayTrips => 5 + _completedJobs.length;

  void toggleOnline() {
    _isOnline = !_isOnline;
    notifyListeners();
  }

  void accept(DeliveryJob job) {
    if (_activeJob != null) return;
    job.status = DeliveryStatus.accepted;
    _offers.remove(job);
    _activeJob = job;
    notifyListeners();
  }

  void advanceActiveJob() {
    final job = _activeJob;
    if (job == null) return;
    switch (job.status) {
      case DeliveryStatus.accepted:
        job.status = DeliveryStatus.pickedUp;
      case DeliveryStatus.pickedUp:
        job.status = DeliveryStatus.delivering;
      case DeliveryStatus.delivering:
        job.status = DeliveryStatus.completed;
        _completedJobs.insert(0, job);
        _activeJob = null;
      case DeliveryStatus.offered:
      case DeliveryStatus.completed:
        break;
    }
    notifyListeners();
  }
}
