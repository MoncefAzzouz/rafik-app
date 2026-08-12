import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/splash/pages/bootstrap_page.dart';

class RafikDriverApp extends StatelessWidget {
  const RafikDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rafik Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const BootstrapPage(),
    );
  }
}
