class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultApiBaseUrl,
  );

  // Compile-time default: the live production backend, since there's no
  // local backend running day-to-day. Override with --dart-define=API_BASE_URL=...
  //   Android emulator (local backend): http://10.0.2.2:4000
  //   iOS simulator (local backend):    http://127.0.0.1:4000
  //   physical device (local backend):  http://<lan-ip>:4000
  static const String _defaultApiBaseUrl = 'https://rafik-algerie.com';
}
