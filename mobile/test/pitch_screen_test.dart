import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pitchproof/screens/pitch.dart';

// The Pitch screen used to stay on its loading shimmer forever: it filled the
// text boxes while drawing, which Flutter refuses. This opens a draft and
// checks the screen shows it, down to the email box.
void main() {
  testWidgets('pitch screen opens a draft', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: PitchScreen(id: 'sample-1')));
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(find.text('Sunrise Dental Care'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Email draft'), 300, scrollable: find.byType(Scrollable).first);
    expect(find.text('Email draft'), findsOneWidget);
    expect(find.text('Friendly'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 5));
  });
}
