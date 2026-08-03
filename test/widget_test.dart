import 'package:flutter_test/flutter_test.dart';
import 'package:rafik_app/main.dart';

void main() {
  testWidgets('app starts on the first onboarding page', (tester) async {
    await tester.pumpWidget(const RafikApp());

    expect(find.text('Everything You Need'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });

  testWidgets('onboarding continues to login', (tester) async {
    await tester.pumpWidget(const RafikApp());

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Start with Rafik'), findsOneWidget);
    await tester.tap(find.text('Start with Rafik'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('LOGIN'), findsOneWidget);
  });
}
