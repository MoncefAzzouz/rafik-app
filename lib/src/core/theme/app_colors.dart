import 'package:flutter/material.dart';

class AppColors {
  // Background Colors
  static const Color backgroundDark = Color(0xFF031C2D);
  static const Color backgroundLight = Color(0xFF0B2F45);

  // Accents
  static const Color teal = Color(0xFF1FE7C5);
  static const Color mintGreen = Color(0xFF28F0B2);

  // Text Colors
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(
    0xFFA0B3C6,
  ); // Muted for descriptions

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [mintGreen, teal],
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [backgroundDark, backgroundLight],
  );
}
