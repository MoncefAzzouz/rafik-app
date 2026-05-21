import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFFFD6B22); // Main Orange
  static const Color primaryLight = Color(0xFFFF9457); // Lighter Orange for gradients

  // Background Colors
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  static const Color backgroundLight = Color(0xFFF9FAFB);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF111827); // Very dark gray for headings
  static const Color textSecondary = Color(0xFF6B7280); // Gray for descriptions

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryLight, primary],
  );
}
