import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../../../core/services/sound_service.dart';
import '../../auth/domain/truck_profile.dart';
import '../domain/truck_order.dart';

class TruckRepository extends ChangeNotifier {
  TruckRepository._();

  static final instance = TruckRepository._();

  static const _pollInterval = Duration(seconds: 15);

  TruckProfile? truck;
  bool online = false;
  List<TruckOrder> availableNow = [];
  List<TruckOrder> availableScheduled = [];
  List<TruckOrder> active = [];
  List<TruckOrder> scheduled = [];
  List<TruckOrder> completed = [];

  Timer? _pollTimer;

  int get todayEarnings {
    final now = DateTime.now();
    return completed
        .where((order) {
          final delivered = order.deliveredAt;
          if (delivered == null) return false;
          return delivered.year == now.year &&
              delivered.month == now.month &&
              delivered.day == now.day;
        })
        .fold<int>(0, (sum, order) => sum + (order.driverEarnings ?? 0));
  }

  int get todayTrips {
    final now = DateTime.now();
    return completed.where((order) {
      final delivered = order.deliveredAt;
      if (delivered == null) return false;
      return delivered.year == now.year &&
          delivered.month == now.month &&
          delivered.day == now.day;
    }).length;
  }

  List<TruckOrder> _parseOrders(dynamic value) => (value as List? ?? [])
      .cast<Map<String, dynamic>>()
      .map(TruckOrder.fromJson)
      .toList();

  Future<void> refreshDashboard() async {
    final result = await ApiClient.instance.get('/api/truck/driver/dashboard');
    result.fold(
      onSuccess: (value) {
        final json = value as Map<String, dynamic>;
        final wasOnline = online;
        final previousOfferIds = {
          for (final order in [...availableNow, ...availableScheduled])
            order.id,
        };

        online = json['online'] as bool? ?? false;
        final available = json['available'] as Map<String, dynamic>?;
        availableNow = _parseOrders(available?['now']);
        availableScheduled = _parseOrders(available?['scheduled']);
        active = _parseOrders(json['active']);
        scheduled = _parseOrders(json['scheduled']);
        completed = _parseOrders(json['completed']);

        // Only chime for orders that are genuinely new since the last poll —
        // not on the very first load (nothing to compare against yet) and
        // not on the transition to online (that dashboard refresh naturally
        // surfaces every already-open order at once).
        if (wasOnline) {
          final hasNewOffer = [
            ...availableNow,
            ...availableScheduled,
          ].any((order) => !previousOfferIds.contains(order.id));
          if (hasNewOffer) SoundService.instance.playNewOrder();
        }

        notifyListeners();
        _syncPolling();
      },
      onFailure: (_) {},
    );
  }

  Future<void> refreshTruckProfile() async {
    final result = await ApiClient.instance.get('/api/truck/trucks/me');
    result.fold(
      onSuccess: (value) {
        truck = TruckProfile.fromJson(value as Map<String, dynamic>);
        notifyListeners();
      },
      onFailure: (_) {},
    );
  }

  Future<Result<void>> toggleOnline() async {
    final result = await ApiClient.instance.patch(
      '/api/truck/driver/status',
      body: {'online': !online},
    );
    return result.fold(
      onSuccess: (value) async {
        final json = value as Map<String, dynamic>;
        online = json['online'] as bool? ?? online;
        notifyListeners();
        _syncPolling();
        await refreshDashboard();
        return const Success(null);
      },
      onFailure: (failure) async => Failure(failure),
    );
  }

  /// Starts/stops background polling for new orders. The backend has no
  /// realtime push, so this is the only way the driver hears about a new
  /// request without manually reopening the app — but it's only worth doing
  /// while online, since offline drivers can't be assigned anything anyway.
  void _syncPolling() {
    if (online) {
      _pollTimer ??= Timer.periodic(_pollInterval, (_) => refreshDashboard());
    } else {
      _pollTimer?.cancel();
      _pollTimer = null;
    }
  }

  Future<Result<void>> acceptOrder(String orderId) =>
      _lifecycleCall('/api/truck/orders/$orderId/accept');

  Future<Result<void>> markArrived(String orderId) =>
      _lifecycleCall('/api/truck/orders/$orderId/arrived');

  Future<Result<void>> markLoading(String orderId) =>
      _lifecycleCall('/api/truck/orders/$orderId/loading');

  Future<Result<void>> startTransit(String orderId) =>
      _lifecycleCall('/api/truck/orders/$orderId/start');

  Future<Result<void>> completeOrder(String orderId) =>
      _lifecycleCall('/api/truck/orders/$orderId/complete');

  Future<Result<void>> cancelOrder(String orderId, {String? reason}) =>
      _lifecycleCall(
        '/api/truck/orders/$orderId/cancel',
        body: reason != null ? {'reason': reason} : null,
      );

  Future<Result<void>> _lifecycleCall(String path, {Object? body}) async {
    final result = await ApiClient.instance.post(path, body: body);
    return result.fold(
      onSuccess: (_) async {
        await refreshDashboard();
        return const Success(null);
      },
      onFailure: (failure) async => Failure(failure),
    );
  }
}
