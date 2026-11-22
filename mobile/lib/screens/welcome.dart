import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets/logo.dart';
import '../widgets/settle.dart';
import '../widgets/ui.dart';
import 'home.dart';
import 'sign_in.dart';

/// First screen for someone who isn't signed in: what the app does, in
/// three cards, then "Get started" or a look around with sample data.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  static const _points = [
    (Icons.speed_rounded, 'Find businesses that need you', 'Real website checks show who has a slow, broken or outdated site.'),
    (Icons.verified_outlined, 'Prove it with real numbers', 'Only problems with hard evidence make it into a pitch.'),
    (Icons.send_rounded, 'Pitch in your own words', 'Short emails in your voice. Nothing is sent until you approve it.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(S.page, 12, S.page, 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Expanded(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Settle(child: LogoMark(size: 60)),
                const SizedBox(height: 20),
                Settle(index: 1, child: Text('Pitchproof', style: T.title.copyWith(fontSize: 34))),
                const SizedBox(height: 6),
                Settle(index: 2, child: Text('Turn your skills into clients, internships and jobs.', style: T.body.copyWith(color: C.muted, fontSize: 17))),
                const SizedBox(height: 28),
                for (var i = 0; i < _points.length; i++) ...[
                  if (i > 0) const SizedBox(height: S.gap),
                  Settle(
                    index: 4 + i * 2,
                    child: SoftCard(
                      padding: const EdgeInsets.all(16),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: const BoxDecoration(color: C.primarySoft, shape: BoxShape.circle),
                          child: Icon(_points[i].$1, color: C.primary, size: 21),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(_points[i].$2, style: T.h3),
                            const SizedBox(height: 3),
                            Text(_points[i].$3, style: T.small),
                          ]),
                        ),
                      ]),
                    ),
                  ),
                ],
              ]),
            ),
            Settle(
              index: 10,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Btn('Get started', expand: true, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInScreen()))),
                const SizedBox(height: 6),
                Btn('Look around with sample data',
                    kind: BtnKind.plain,
                    expand: true,
                    onTap: () => Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const HomeScreen()), (_) => false)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
