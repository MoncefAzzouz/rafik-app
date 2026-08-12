import 'package:audioplayers/audioplayers.dart';

/// Plays short local notification sounds (e.g. a new delivery request
/// arriving). Best-effort — a failed/blocked sound should never crash
/// anything else in the app.
class SoundService {
  SoundService._();

  static final instance = SoundService._();

  final AudioPlayer _player = AudioPlayer();

  Future<void> playNewOrder() async {
    try {
      await _player.stop();
      await _player.play(AssetSource('sounds/soundOrder.mp3'));
    } catch (_) {
      // Ignore — e.g. platform audio session busy or asset missing.
    }
  }
}
