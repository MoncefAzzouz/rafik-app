import 'package:flutter/material.dart';
import 'src/core/theme/app_theme.dart';
import 'src/core/l10n/app_strings.dart';
import 'src/features/onboarding/pages/onboarding_page.dart';

void main() {
  runApp(const RafikApp());
}

class RafikApp extends StatelessWidget {
  const RafikApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        return MaterialApp(
          title: 'Rafik App',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          // Apply RTL for Arabic, LTR for French & English
          builder: (context, child) => Directionality(
            textDirection: AppLanguage.instance.textDirection,
            child: child!,
          ),
          home: const OnboardingPage(),
        );
      },
    );
  }
}
