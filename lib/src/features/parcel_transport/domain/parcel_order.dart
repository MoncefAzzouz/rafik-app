class ParcelOrder {
  final String id;
  final String vehicleName;
  final String pickup;
  final String delivery;
  final String description;
  final String timing;
  final int helpers;
  final String invoice;
  final DateTime dateCreated;
  bool isCompleted;
  bool isCancelled;

  ParcelOrder({
    required this.id,
    required this.vehicleName,
    required this.pickup,
    required this.delivery,
    required this.description,
    required this.timing,
    required this.helpers,
    required this.invoice,
    required this.dateCreated,
    this.isCompleted = false,
    this.isCancelled = false,
  });
}
