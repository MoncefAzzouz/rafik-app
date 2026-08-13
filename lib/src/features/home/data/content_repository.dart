import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/app_module.dart';
import '../domain/app_promo.dart';
import '../domain/app_slide.dart';

/// Admin-managed home content (slides, service-tile modules, promos).
/// There's no realtime push for this — callers should refresh on screen
/// visit and support pull-to-refresh.
class ContentRepository extends ChangeNotifier {
  ContentRepository._();

  static final instance = ContentRepository._();

  List<AppSlide> homeSlides = [];
  List<AppModule> modules = [];
  List<AppPromo> promos = [];
  List<AppSlide> promoBanners = [];

  Future<void> refreshHome() async {
    final results = await Future.wait([
      ApiClient.instance.get('/api/app/slides', query: const {'type': 'home'}),
      ApiClient.instance.get('/api/app/modules'),
    ]);

    var changed = false;
    switch (results[0]) {
      case Success(value: final data):
        homeSlides = (data as List)
            .map((e) => AppSlide.fromJson(e as Map<String, dynamic>))
            .toList();
        changed = true;
      case Failure():
        break; // keep the previously loaded slides on a failed refresh
    }
    switch (results[1]) {
      case Success(value: final data):
        modules = (data as List)
            .map((e) => AppModule.fromJson(e as Map<String, dynamic>))
            .toList();
        changed = true;
      case Failure():
        break;
    }
    if (changed) notifyListeners();
  }

  /// Fetches both real promo codes (`PromoCode` rows with `appBanner` set via
  /// the admin's per-code "Add banner" action) and standalone promo banners
  /// (`AppSlide` rows with `type: 'promo'`, created via the admin's "New
  /// Banner" button on the app-promos page) — these are two independent
  /// resources on the backend, and the admin UI lets you create either one.
  Future<void> refreshPromos() async {
    final results = await Future.wait([
      ApiClient.instance.get('/api/app/promos'),
      ApiClient.instance.get(
        '/api/app/slides',
        query: const {'type': 'promo'},
      ),
    ]);

    var changed = false;
    switch (results[0]) {
      case Success(value: final data):
        promos = (data as List)
            .map((e) => AppPromo.fromJson(e as Map<String, dynamic>))
            .toList();
        changed = true;
      case Failure():
        break; // keep the previously loaded promos on a failed refresh
    }
    switch (results[1]) {
      case Success(value: final data):
        promoBanners = (data as List)
            .map((e) => AppSlide.fromJson(e as Map<String, dynamic>))
            .toList();
        changed = true;
      case Failure():
        break;
    }
    if (changed) notifyListeners();
  }
}
