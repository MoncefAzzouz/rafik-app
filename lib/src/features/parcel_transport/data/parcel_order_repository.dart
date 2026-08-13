import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/parcel_order.dart';

class ParcelOrderRepository extends ChangeNotifier {
  ParcelOrderRepository._();

  static final instance = ParcelOrderRepository._();

  final List<ParcelOrder> _activeOrders = [];
  final List<ParcelOrder> _archivedOrders = [];

  List<ParcelOrder> get activeOrders => List.unmodifiable(_activeOrders);
  List<ParcelOrder> get archivedOrders => List.unmodifiable(_archivedOrders);
  int get activeCount => _activeOrders.length;

  /// Creates a real order via `POST /api/truck/orders`. On success the new
  /// order (with its server-assigned id/orderNumber/status) is added to the
  /// active list and listeners are notified.
  Future<Result<ParcelOrder>> create({
    required String clientName,
    required String clientPhone,
    required String categoryId,
    String? truckTypeId,
    required String pickupAddress,
    String? pickupWilaya,
    String? pickupCommune,
    double? pickupLat,
    double? pickupLng,
    required String destinationAddress,
    String? destinationWilaya,
    double? destinationLat,
    double? destinationLng,
    double? distanceKm,
    required String description,
    String? invoiceStatus,
    String? scheduledType,
    DateTime? scheduledDate,
    String? promoCode,
  }) async {
    final body = <String, dynamic>{
      'clientName': clientName,
      'clientPhone': clientPhone,
      'categoryId': categoryId,
      if (truckTypeId != null) 'truckTypeId': truckTypeId,
      'pickupAddress': pickupAddress,
      if (pickupWilaya != null) 'pickupWilaya': pickupWilaya,
      if (pickupCommune != null) 'pickupCommune': pickupCommune,
      if (pickupLat != null) 'pickupLat': pickupLat,
      if (pickupLng != null) 'pickupLng': pickupLng,
      'destinationAddress': destinationAddress,
      if (destinationWilaya != null) 'destinationWilaya': destinationWilaya,
      if (destinationLat != null) 'destinationLat': destinationLat,
      if (destinationLng != null) 'destinationLng': destinationLng,
      if (distanceKm != null) 'distanceKm': distanceKm,
      'description': description,
      if (invoiceStatus != null) 'invoiceStatus': invoiceStatus,
      if (scheduledType != null) 'scheduledType': scheduledType,
      if (scheduledDate != null)
        'scheduledDate': scheduledDate.toIso8601String(),
      if (promoCode != null) 'promoCode': promoCode,
    };

    final result = await ApiClient.instance.post(
      '/api/truck/orders',
      body: body,
    );

    switch (result) {
      case Success(value: final data):
        final order = ParcelOrder.fromJson(data as Map<String, dynamic>);
        _activeOrders.add(order);
        notifyListeners();
        return Success(order);
      case Failure(failure: final failure):
        return Failure(failure);
    }
  }

  /// Refreshes the local order lists from `GET /api/truck/orders` (the
  /// backend auto-scopes this to the logged-in CLIENT). On failure (e.g. no
  /// network) the existing local state is left untouched.
  Future<void> fetchAll() async {
    final result = await ApiClient.instance.get('/api/truck/orders');
    switch (result) {
      case Success(value: final data):
        final orders = (data as List)
            .map((e) => ParcelOrder.fromJson(e as Map<String, dynamic>))
            .toList();
        _activeOrders
          ..clear()
          ..addAll(orders.where((o) => !o.isArchived));
        _archivedOrders
          ..clear()
          ..addAll(orders.where((o) => o.isArchived));
        notifyListeners();
      case Failure():
        break;
    }
  }

  /// Refreshes a single order via `GET /api/truck/orders/:id` — cheaper than
  /// `fetchAll()` when only one tracked order needs to stay live (e.g. the
  /// tracking screen polling for status changes made by the driver).
  Future<Result<ParcelOrder>> fetchOne(String orderId) async {
    final result = await ApiClient.instance.get('/api/truck/orders/$orderId');
    switch (result) {
      case Success(value: final data):
        final order = ParcelOrder.fromJson(data as Map<String, dynamic>);
        _activeOrders.removeWhere((o) => o.id == orderId);
        _archivedOrders.removeWhere((o) => o.id == orderId);
        if (order.isArchived) {
          _archivedOrders.add(order);
        } else {
          _activeOrders.add(order);
        }
        notifyListeners();
        return Success(order);
      case Failure(failure: final failure):
        return Failure(failure);
    }
  }

  /// Cancels an order via `POST /api/truck/orders/:id/cancel` (permission
  /// checked server-side for CLIENT-owned orders). Moves the order from
  /// active to archived on success.
  Future<Result<ParcelOrder>> cancel(String orderId) async {
    final result = await ApiClient.instance.post(
      '/api/truck/orders/$orderId/cancel',
    );

    switch (result) {
      case Success(value: final data):
        final order = ParcelOrder.fromJson(data as Map<String, dynamic>);
        _activeOrders.removeWhere((o) => o.id == orderId);
        _archivedOrders.removeWhere((o) => o.id == orderId);
        if (order.isArchived) {
          _archivedOrders.add(order);
        } else {
          _activeOrders.add(order);
        }
        notifyListeners();
        return Success(order);
      case Failure(failure: final failure):
        return Failure(failure);
    }
  }

  /// Pre-commitment price estimate via `POST /api/truck/quote` (public, no
  /// auth needed).
  Future<Result<TruckQuote>> quote({
    String? truckTypeId,
    String? destinationWilaya,
    double? distanceKm,
    double? pickupLat,
    double? pickupLng,
    double? destinationLat,
    double? destinationLng,
  }) async {
    final body = <String, dynamic>{
      if (truckTypeId != null) 'truckTypeId': truckTypeId,
      if (destinationWilaya != null) 'destinationWilaya': destinationWilaya,
      if (distanceKm != null) 'distanceKm': distanceKm,
      if (pickupLat != null) 'pickupLat': pickupLat,
      if (pickupLng != null) 'pickupLng': pickupLng,
      if (destinationLat != null) 'destinationLat': destinationLat,
      if (destinationLng != null) 'destinationLng': destinationLng,
    };

    final result = await ApiClient.instance.post(
      '/api/truck/quote',
      body: body,
    );

    switch (result) {
      case Success(value: final data):
        return Success(TruckQuote.fromJson(data as Map<String, dynamic>));
      case Failure(failure: final failure):
        return Failure(failure);
    }
  }
}
