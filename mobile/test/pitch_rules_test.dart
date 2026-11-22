import 'package:flutter_test/flutter_test.dart';
import 'package:pitchproof/data/pitch_rules.dart';

// The email rules must match the website's (lib/pitch-rules.ts).
void main() {
  const good = '''Hi Dr. Kale,

I'm Aarryan, a CS student in Nagpur. Your clinic's website takes about 9 seconds to open on a phone, and there's no WhatsApp button for booking.

I made a faster version so you can see the difference: https://pitchproof.example/p/sunrise-dental-care

If it's useful, I'd be happy to finish it properly. Could we talk for 10 minutes this week? If not, just reply "no" and I won't write again.

Aarryan''';

  test('a good draft passes every check', () {
    expect(emailPasses(good), isTrue);
  });

  test('a banned phrase fails the check', () {
    final bad = good.replaceFirst('I made', 'I hope this email finds you well. I made');
    expect(checkEmail(bad).firstWhere((c) => c.label == 'No banned phrases').ok, isFalse);
    expect(emailPasses(bad), isFalse);
  });

  test('too short or with two links fails', () {
    expect(emailPasses('Hi, see https://a.example. Reply no if not.'), isFalse);
    expect(emailPasses('$good https://b.example'), isFalse);
  });
}
