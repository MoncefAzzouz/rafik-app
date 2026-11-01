import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rafik_app/src/features/splash/widgets/animated_brand.dart';

void main() {
  for (final reduceMotion in [false, true]) {
    testWidgets('splash completes once (reduced motion: $reduceMotion)', (
      tester,
    ) async {
      var completions = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(disableAnimations: reduceMotion),
            child: AnimatedBrand(onComplete: () => completions++),
          ),
        ),
      );
      await tester.pump();
      expect(completions, 0);
      await tester.pump(Duration(milliseconds: reduceMotion ? 200 : 3100));
      expect(completions, 1);
      await tester.pump(const Duration(seconds: 1));
      expect(completions, 1);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
    });
  }
}
