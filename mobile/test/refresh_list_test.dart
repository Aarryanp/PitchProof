import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pitchproof/widgets/refresh_list.dart';

// Pulling the list down from the top must call onRefresh, as on an iPhone.
void main() {
  testWidgets('pull down to refresh calls onRefresh', (tester) async {
    var refreshed = 0;
    await tester.pumpWidget(MaterialApp(
      theme: ThemeData(platform: TargetPlatform.iOS),
      home: Scaffold(
        body: RefreshList(
          onRefresh: () async => refreshed++,
          children: [for (var i = 0; i < 3; i++) SizedBox(height: 80, child: Text('Row $i'))],
        ),
      ),
    ));
    await tester.fling(find.text('Row 0'), const Offset(0, 300), 1000);
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();
    expect(refreshed, 1);
  });
}
