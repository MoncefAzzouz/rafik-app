import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/data/auth_repository.dart';
import '../../home/pages/main_page.dart';
import '../../onboarding/pages/onboarding_page.dart';
import '../widgets/animated_brand.dart';

/// First screen the app shows. Restores/revalidates any persisted session
/// via [AuthRepository.bootstrap] then routes to [MainPage] (authenticated)
/// or [OnboardingPage] (not authenticated).
class BootstrapPage extends StatefulWidget {
  const BootstrapPage({super.key});

  @override
  State<BootstrapPage> createState() => _BootstrapPageState();
}

class _BootstrapPageState extends State<BootstrapPage> {
  bool _sessionReady = false;
  bool _animationReady = false;
  bool _navigating = false;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      await AuthRepository.instance.bootstrap();
    } catch (error, stack) {
      debugPrint('Session restore failed: $error\n$stack');
    }
    _sessionReady = true;
    _navigate();
  }

  void _navigate() {
    if (!mounted || !_sessionReady || !_animationReady || _navigating) return;
    _navigating = true;
    final isAuthenticated = AuthRepository.instance.isAuthenticated;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 450),
        pageBuilder: (_, animation, secondaryAnimation) =>
            isAuthenticated ? const MainPage() : const OnboardingPage(),
        transitionsBuilder: (_, animation, secondaryAnimation, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.royalBlue,
      body: AnimatedBrand(
        onComplete: () {
          _animationReady = true;
          _navigate();
        },
      ),
    );
  }
}
