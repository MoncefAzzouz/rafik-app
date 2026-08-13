import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/user.dart';

/// Session state + auth API calls. Singleton [ChangeNotifier], mirroring the
/// convention used by ParcelOrderRepository (private constructor + static
/// `instance`) so it can be listened to from anywhere in the widget tree.
class AuthRepository extends ChangeNotifier {
  AuthRepository._();

  static final AuthRepository instance = AuthRepository._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _tokenKey = 'rafik_auth_token';
  static const String _userKey = 'rafik_auth_user';

  AppUser? _currentUser;
  bool _isBootstrapping = true;

  AppUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isBootstrapping => _isBootstrapping;

  /// Restores a persisted session (if any), optimistically, then revalidates
  /// it against the backend in the background. Call once at app startup.
  Future<void> bootstrap() async {
    try {
      final token = await _storage.read(key: _tokenKey);
      final userJson = await _storage.read(key: _userKey);
      if (token == null || userJson == null) {
        return;
      }

      // Optimistic restore so the UI can proceed immediately even offline.
      _currentUser = AppUser.fromJson(
        jsonDecode(userJson) as Map<String, dynamic>,
      );
      ApiClient.instance.updateToken(token);

      final result = await ApiClient.instance.get('/api/auth/me');
      switch (result) {
        case Success(value: final data):
          final user = AppUser.fromJson(data as Map<String, dynamic>);
          _currentUser = user;
          await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
        case Failure(failure: final failure):
          if (failure is AuthFailure) {
            // Token really is invalid/expired — clear the session.
            await _clearSession();
          }
          // Any other failure (no network, timeout, server hiccup) — keep
          // the optimistic session; don't force logout just because the
          // phone has no signal at launch.
      }
    } finally {
      _isBootstrapping = false;
      notifyListeners();
    }
  }

  Future<Result<AppUser>> login(String email, String password) async {
    debugPrint('[Auth] login → POST /api/auth/login (email: $email)');
    final result = await ApiClient.instance.post(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );
    return _handleAuthResponse('login', result);
  }

  Future<Result<AppUser>> register({
    required String email,
    required String phone,
    required String password,
    required String fullName,
  }) async {
    debugPrint('[Auth] register → POST /api/auth/register (email: $email, phone: $phone)');
    final result = await ApiClient.instance.post(
      '/api/auth/register',
      body: {
        'email': email,
        'phone': phone,
        'password': password,
        'fullName': fullName,
      },
    );
    return _handleAuthResponse('register', result);
  }

  Future<void> logout() async {
    await _clearSession();
  }

  Future<Result<AppUser>> _handleAuthResponse(
    String action,
    Result<dynamic> result,
  ) async {
    switch (result) {
      case Success(value: final data):
        final map = data as Map<String, dynamic>;
        final token = map['token'] as String;
        final user = AppUser.fromJson(map['user'] as Map<String, dynamic>);
        debugPrint(
          '[Auth] $action ← success (user: ${user.id}, role: ${user.role}, '
          'token: ${token.substring(0, token.length < 8 ? token.length : 8)}…)',
        );
        await _persistSession(token, user);
        return Success(user);
      case Failure(failure: final failure):
        debugPrint('[Auth] $action ← failure (${failure.runtimeType}: ${failure.message})');
        return Failure(failure);
    }
  }

  Future<void> _persistSession(String token, AppUser user) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
    ApiClient.instance.updateToken(token);
    _currentUser = user;
    notifyListeners();
  }

  Future<void> _clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    ApiClient.instance.updateToken(null);
    _currentUser = null;
    notifyListeners();
  }
}
