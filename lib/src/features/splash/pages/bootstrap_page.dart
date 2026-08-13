import 'package:flutter/material.dart';

import '../../auth/data/auth_repository.dart';
import '../../home/pages/main_page.dart';
import '../../onboarding/pages/onboarding_page.dart';

/// First screen the app shows. Restores/revalidates any persisted session
/// via [AuthRepository.bootstrap] then routes to [MainPage] (authenticated)
/// or [OnboardingPage] (not authenticated).
class BootstrapPage extends StatefulWidget {
  const BootstrapPage({super.key});

  @override
  State<BootstrapPage> createState() => _BootstrapPageState();
}

class _BootstrapPageState extends State<BootstrapPage> {
  @override
  void initState() {
    super.initState();
    AuthRepository.instance.bootstrap().then((_) => _navigate());
  }

  void _navigate() {
    if (!mounted) return;
    final isAuthenticated = AuthRepository.instance.isAuthenticated;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) =>
            isAuthenticated ? const MainPage() : const OnboardingPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
