import 'package:flutter/foundation.dart';

import '../domain/parcel_order.dart';

class ParcelOrderRepository extends ChangeNotifier {
  ParcelOrderRepository._();

  static final instance = ParcelOrderRepository._();

  final List<ParcelOrder> _activeOrders = [];
  final List<ParcelOrder> _archivedOrders = [];

  List<ParcelOrder> get activeOrders => List.unmodifiable(_activeOrders);
  List<ParcelOrder> get archivedOrders => List.unmodifiable(_archivedOrders);
  int get activeCount => _activeOrders.length;

  void add(ParcelOrder order) {
    _activeOrders.add(order);
    notifyListeners();
  }

  void complete(ParcelOrder order) => _archive(order, isCompleted: true);

  void cancel(ParcelOrder order) => _archive(order, isCompleted: false);

  void _archive(ParcelOrder order, {required bool isCompleted}) {
    if (!_activeOrders.remove(order)) return;
    order.isCompleted = isCompleted;
    order.isCancelled = !isCompleted;
    _archivedOrders.add(order);
    notifyListeners();
  }
}
