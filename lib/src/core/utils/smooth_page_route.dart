import 'package:flutter/material.dart';

class SmoothPageRoute extends PageRouteBuilder {
  final Widget page;

  SmoothPageRoute({required this.page, super.settings})
    : super(
        pageBuilder: (context, animation, secondaryAnimation) => page,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          // A subtle card slide-in from the side (RTL friendly) combined with fade
          const begin = Offset(0.08, 0.0);
          const end = Offset.zero;
          final curve = CurveTween(curve: Curves.easeOutQuart);
          final tween = Tween(begin: begin, end: end).chain(curve);

          return SlideTransition(
            position: animation.drive(tween),
            child: FadeTransition(opacity: animation, child: child),
          );
        },
        transitionDuration: const Duration(milliseconds: 350),
        reverseTransitionDuration: const Duration(milliseconds: 250),
      );
}
