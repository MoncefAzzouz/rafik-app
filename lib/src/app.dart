import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/home/presentation/pages/driver_shell.dart';

class RafikDriverApp extends StatelessWidget {
  const RafikDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rafik Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const DriverShell(),
    );
  }
}
