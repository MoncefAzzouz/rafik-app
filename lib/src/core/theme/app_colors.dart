import 'package:flutter/material.dart';

abstract final class AppColors {
  // Exact Rafik customer-app brand palette.
  static const deepNavy = Color(0xFF021B63);
  static const royalBlue = Color(0xFF0A5BFF);
  static const electricBlue = Color(0xFF2196FF);
  static const cyan = Color(0xFF35D7FF);
  static const backgroundWhite = Color(0xFFFFFFFF);
  static const backgroundLight = Color(0xFFF9FAFB);
  static const textPrimary = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);

  // Semantic aliases keep feature code independent from palette names.
  static const navy = deepNavy;
  static const navySoft = Color(0xFF063B8F);
  static const blue = royalBlue;
  static const green = Color(0xFF24C875);
  static const amber = Color(0xFFFFB020);
  static const red = Color(0xFFFF5D5D);
  static const canvas = backgroundLight;
  static const ink = textPrimary;
  static const muted = textSecondary;
  static const line = Color(0xFFE5E7EB);

  static const primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [royalBlue, electricBlue],
  );
}
