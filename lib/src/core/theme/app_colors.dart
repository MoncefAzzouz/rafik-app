import 'package:flutter/material.dart';

class AppColors {
  // Background Colors
  static const Color backgroundLight = Color(0xFFF8FAFC); // Soft light grey/blue for app background
  static const Color surfaceWhite = Color(0xFFFFFFFF); // Pure white for cards and sheets

  // Brand Accents
  static const Color teal = Color(0xFF1FE7C5);
  static const Color mintGreen = Color(0xFF28F0B2);
  static const Color deepBlue = Color(0xFF031C2D); // Keep this for strong text or app bar titles

  // Text Colors
  static const Color textPrimary = Color(0xFF0F172A); // Very dark slate for primary text
  static const Color textSecondary = Color(0xFF64748B); // Slate grey for secondary text

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [mintGreen, teal],
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [surfaceWhite, backgroundLight],
  );
}
