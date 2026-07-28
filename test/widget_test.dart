import 'package:flutter_test/flutter_test.dart';
import 'package:rafik_driver/src/app.dart';

void main() {
  testWidgets('driver home shows availability and parcel map', (tester) async {
    await tester.pumpWidget(const RafikDriverApp());

    expect(find.text('Sétif, Algeria'), findsOneWidget);
    expect(find.text('You’re currently offline'), findsOneWidget);
    expect(find.text('Offline'), findsOneWidget);
  });

  testWidgets('home location opens the map picker', (tester) async {
    await tester.pumpWidget(const RafikDriverApp());

    await tester.tap(find.text('Sétif, Algeria'));
    await tester.pumpAndSettle();

    expect(find.text('Choose your work location'), findsOneWidget);
    expect(find.text('Confirm location'), findsOneWidget);
  });

  testWidgets('bottom navigation opens earnings', (tester) async {
    await tester.pumpWidget(const RafikDriverApp());

    await tester.tap(find.text('Earnings'));
    await tester.pumpAndSettle();

    expect(find.text('18,940 DA'), findsOneWidget);
    expect(find.text('Recent payouts'), findsOneWidget);
  });

  testWidgets('activity separates current work from history', (tester) async {
    await tester.pumpWidget(const RafikDriverApp());

    await tester.tap(find.text('Activity'));
    await tester.pumpAndSettle();

    expect(find.text('Current'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('No active delivery'), findsOneWidget);

    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();

    expect(find.text('Today · July 28'), findsOneWidget);
    expect(find.textContaining('RF-4768'), findsOneWidget);
  });

  testWidgets('profile opens driver information pages', (tester) async {
    await tester.pumpWidget(const RafikDriverApp());

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Personal information'));
    await tester.pumpAndSettle();

    expect(find.text('Full name'), findsOneWidget);
    expect(find.text('Save changes'), findsOneWidget);
  });
}
