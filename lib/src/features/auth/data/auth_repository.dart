import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/network/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/driver_user.dart';

/// Session state for the driver app, backed by secure storage so the driver
/// stays logged in across app restarts. Mirrors the admin web's storage key
/// names (`rafik_auth_token` / `rafik_auth_user`).
class AuthRepository extends ChangeNotifier {
  AuthRepository._();

  static final instance = AuthRepository._();

  static const _tokenKey = 'rafik_auth_token';
  static const _userKey = 'rafik_auth_user';

  final _storage = const FlutterSecureStorage();

  DriverUser? _user;
  String? _token;
  bool _isBootstrapping = true;

  DriverUser? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _user != null && _token != null;
  bool get isBootstrapping => _isBootstrapping;

  /// Optimistically restores the last known session from secure storage so
  /// the UI can render immediately, then revalidates it against the server.
  /// Keeps the session on a network failure (offline start-up) but clears it
  /// if the server actively rejects the token (401/403).
  Future<void> bootstrap() async {
    _isBootstrapping = true;
    notifyListeners();

    final storedToken = await _storage.read(key: _tokenKey);
    final storedUserJson = await _storage.read(key: _userKey);

    if (storedToken != null && storedUserJson != null) {
      try {
        _token = storedToken;
        _user = DriverUser.fromJson(
          jsonDecode(storedUserJson) as Map<String, dynamic>,
        );
        ApiClient.instance.updateToken(_token);
      } catch (_) {
        _token = null;
        _user = null;
      }
    }

    if (_token != null) {
      final result = await ApiClient.instance.get('/api/auth/me');
      switch (result) {
        case Success(value: final value):
          final json = value as Map<String, dynamic>;
          if (json['role'] == 'TRUCKER') {
            _user = DriverUser.fromJson(json);
            await _persistSession();
          } else {
            await _clearSession();
          }
        case Failure(failure: final failure):
          if (failure is AuthFailure) {
            await _clearSession();
          }
          // Network/unexpected failures: keep the optimistically restored
          // session so the driver can still use the app offline.
      }
    }

    _isBootstrapping = false;
    notifyListeners();
  }

  Future<Result<DriverUser>> login(String email, String password) async {
    final result = await ApiClient.instance.post(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );

    return result.fold(
      onSuccess: (value) async {
        final json = value as Map<String, dynamic>;
        final userJson = json['user'] as Map<String, dynamic>;
        if (userJson['role'] != 'TRUCKER') {
          return const Failure(
            AuthFailure('This app is for truck drivers only'),
          );
        }

        _token = json['token'] as String;
        _user = DriverUser.fromJson(userJson);
        ApiClient.instance.updateToken(_token);
        await _persistSession();
        notifyListeners();
        return Success(_user!);
      },
      onFailure: (failure) async => Failure<DriverUser>(failure),
    );
  }

  Future<Result<DriverUser>> register({
    required String driverName,
    required String phone,
    required String email,
    required String password,
    required String truckTypeId,
    String? plate,
    String? wilaya,
    String? commune,
  }) async {
    final result = await ApiClient.instance.post(
      '/api/truck/register',
      body: {
        'driverName': driverName,
        'phone': phone,
        'email': email,
        'password': password,
        'truckTypeId': truckTypeId,
        if (plate != null && plate.isNotEmpty) 'plate': plate,
        if (wilaya != null && wilaya.isNotEmpty) 'wilaya': wilaya,
        if (commune != null && commune.isNotEmpty) 'commune': commune,
      },
    );

    return result.fold(
      onSuccess: (_) => login(email, password),
      onFailure: (failure) async => Failure<DriverUser>(failure),
    );
  }

  Future<void> logout() async {
    await _clearSession();
    notifyListeners();
  }

  Future<void> _persistSession() async {
    if (_token == null || _user == null) return;
    await _storage.write(key: _tokenKey, value: _token);
    await _storage.write(key: _userKey, value: jsonEncode(_user!.toJson()));
  }

  Future<void> _clearSession() async {
    _token = null;
    _user = null;
    ApiClient.instance.updateToken(null);
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}
