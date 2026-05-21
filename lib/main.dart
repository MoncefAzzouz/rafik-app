import 'package:flutter/material.dart';
import 'src/core/theme/app_theme.dart';
import 'src/features/onboarding/pages/onboarding_page.dart';

void main() {
  runApp(const RafikApp());
}

class RafikApp extends StatelessWidget {
  const RafikApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rafik App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const OnboardingPage(),
    );
  }
}
