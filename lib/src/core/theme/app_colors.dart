import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors (Rafik Identity)
  static const Color deepNavy = Color(0xFF021B63);
  static const Color royalBlue = Color(0xFF0A5BFF);
  static const Color electricBlue = Color(0xFF2196FF);
  static const Color cyan = Color(0xFF35D7FF);
  
  // Mapping to theme colors
  static const Color primary = royalBlue;
  static const Color primaryLight = electricBlue;

  // Background Colors
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  static const Color backgroundLight = Color(0xFFF9FAFB);

  // Text Colors
  static const Color textPrimary = Color(0xFF111827); // Very dark gray for headings
  static const Color textSecondary = Color(0xFF6B7280); // Gray for descriptions

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [royalBlue, electricBlue],
  );

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFF063B8F),
      royalBlue,
    ],
  );

  static const LinearGradient qrButtonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [royalBlue, cyan],
  );
}
