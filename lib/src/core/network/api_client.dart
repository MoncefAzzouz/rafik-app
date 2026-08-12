import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/env.dart';
import '../errors/app_failure.dart';
import '../result/result.dart';

/// Thin wrapper around [http.Client] that prefixes [Env.apiBaseUrl], attaches
/// the bearer token, and maps failures onto [AppFailure]. App-wide singleton
/// so [updateToken] (called by AuthRepository on login/logout) is visible to
/// every repository that shares this instance.
class ApiClient {
  ApiClient._({http.Client? client}) : _client = client ?? http.Client();

  static final ApiClient instance = ApiClient._();

  final http.Client _client;
  String? _token;

  void updateToken(String? token) => _token = token;

  Future<Result<dynamic>> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<Result<dynamic>> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<Result<dynamic>> put(String path, {Object? body}) =>
      _send('PUT', path, body: body);

  Future<Result<dynamic>> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body);

  Future<Result<dynamic>> delete(String path) => _send('DELETE', path);

  Future<Result<dynamic>> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    final uri = Uri.parse('${Env.apiBaseUrl}$path').replace(
      queryParameters: query != null && query.isNotEmpty ? query : null,
    );
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
    final encodedBody = body != null ? jsonEncode(body) : null;

    try {
      final response = await _dispatch(
        method,
        uri,
        headers,
        encodedBody,
      ).timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } on SocketException catch (e) {
      return Failure(NetworkFailure('No connection to the server', e));
    } on TimeoutException catch (e) {
      return Failure(NetworkFailure('The server took too long to respond', e));
    } catch (e) {
      return Failure(UnexpectedFailure(e.toString(), e));
    }
  }

  Future<http.Response> _dispatch(
    String method,
    Uri uri,
    Map<String, String> headers,
    String? body,
  ) {
    switch (method) {
      case 'GET':
        return _client.get(uri, headers: headers);
      case 'POST':
        return _client.post(uri, headers: headers, body: body);
      case 'PUT':
        return _client.put(uri, headers: headers, body: body);
      case 'PATCH':
        return _client.patch(uri, headers: headers, body: body);
      case 'DELETE':
        return _client.delete(uri, headers: headers);
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }
  }

  Result<dynamic> _handleResponse(http.Response response) {
    final status = response.statusCode;
    dynamic decoded;
    if (response.body.isNotEmpty) {
      try {
        decoded = jsonDecode(response.body);
      } catch (_) {
        decoded = null;
      }
    }

    if (status >= 200 && status < 300) {
      return Success(decoded);
    }

    final message = (decoded is Map && decoded['error'] is String)
        ? decoded['error'] as String
        : 'Something went wrong (status $status)';

    if (status == 401 || status == 403) {
      return Failure(AuthFailure(message));
    }
    return Failure(NetworkFailure(message));
  }
}
