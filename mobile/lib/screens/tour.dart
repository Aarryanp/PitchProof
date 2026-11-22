import 'package:flutter/material.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/ui.dart';
import 'home.dart';

/// A short tour of the app: four slides you can swipe through.
class TourScreen extends StatefulWidget {
  const TourScreen({super.key, this.replay = false});
  final bool replay;
  @override
  State<TourScreen> createState() => _TourScreenState();
}

class _TourScreenState extends State<TourScreen> {
  final _pages = PageController();
  int i = 0;

  static final _slides = [
    ('Search for businesses', 'Pick a type of business and a city. The agent finds up to 20 and checks each website with real tools.', const _SearchArt()),
    ('Only real problems count', 'A business reaches your leads only if a problem has hard proof, like a speed score or a missing contact button.', const _LeadsArt()),
    ('You approve every email', 'Each pitch has a short email in your voice and a page made for that business. Edit it, then press Approve. Nothing is sent without you.', const _EmailArt()),
    ('See what works', 'Results shows who opened your page and who replied, so you can see which pitches land.', const _ResultsArt()),
  ];

  void _done() {
    if (widget.replay) {
      Navigator.of(context).pop();
    } else {
      Navigator.of(context).pushAndRemoveUntil(fadeRoute(const HomeScreen()), (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final last = i == _slides.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(S.page, 8, S.page, 0),
            child: Align(alignment: Alignment.centerRight, child: Btn('Skip', kind: BtnKind.soft, big: false, onTap: _done)),
          ),
          Expanded(
            child: PageView.builder(
              controller: _pages,
              itemCount: _slides.length,
              onPageChanged: (v) => setState(() => i = v),
              itemBuilder: (context, n) => AnimatedBuilder(
                animation: _pages,
                builder: (context, child) {
                  // The picture moves a little slower than the page (parallax).
                  final page = _pages.hasClients && _pages.position.haveDimensions ? _pages.page ?? 0 : 0.0;
                  final d = (page - n).clamp(-1.0, 1.0);
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(S.page, 16, S.page, 0),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      AspectRatio(
                        aspectRatio: 1.15,
                        child: Container(
                          decoration: BoxDecoration(color: C.primarySoft, borderRadius: BorderRadius.circular(28)),
                          alignment: Alignment.center,
                          child: Transform.translate(offset: Offset(d * 60, 0), child: Opacity(opacity: 1 - d.abs() * 0.6, child: _slides[n].$3)),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text(_slides[n].$1, style: T.title),
                      const SizedBox(height: 10),
                      Text(_slides[n].$2, style: T.body.copyWith(color: C.muted, fontSize: 16)),
                    ]),
                  );
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(S.page, 0, S.page, 12),
            child: Row(children: [
              for (var j = 0; j < _slides.length; j++)
                Pressable(
                  onTap: () => _pages.animateToPage(j, duration: M.slow, curve: M.ease),
                  child: AnimatedContainer(
                    duration: M.normal,
                    curve: M.ease,
                    margin: const EdgeInsets.only(right: 6),
                    width: j == i ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(color: j == i ? C.primary : const Color(0xFFD5D9EA), borderRadius: BorderRadius.circular(4)),
                  ),
                ),
              const Spacer(),
              Btn(last ? (widget.replay ? 'Done' : "Let's go") : 'Next',
                  icon: last ? null : Icons.chevron_right_rounded,
                  onTap: () => last ? _done() : _pages.nextPage(duration: M.slow, curve: M.ease)),
            ]),
          ),
        ]),
      ),
    );
  }
}

Widget _mini({required Widget child}) => Container(width: 230, padding: const EdgeInsets.all(14), decoration: cardBox(), child: child);

class _SearchArt extends StatelessWidget {
  const _SearchArt();
  @override
  Widget build(BuildContext context) => _mini(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(999)),
            child: Row(children: [const Icon(Icons.search_rounded, size: 17, color: C.muted), const SizedBox(width: 6), Text('Clinics in Nagpur', style: T.h3.copyWith(fontSize: 13))]),
          ),
          const SizedBox(height: 10),
          for (final t in const ['Speed score', 'Phone check', 'Contact button'])
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [Text(t, style: T.small), const Spacer(), const Icon(Icons.check_circle_rounded, size: 16, color: C.green)]),
            ),
        ]),
      );
}

class _LeadsArt extends StatelessWidget {
  const _LeadsArt();
  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, children: [
        for (final (n, ok) in const [('Sunrise Dental', true), ('Metro Heart', false)])
          Opacity(
            opacity: ok ? 1 : 0.5,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _mini(
                child: Row(children: [
                  Avatar(n, size: 34),
                  const SizedBox(width: 10),
                  Expanded(child: Text(n, style: T.h3.copyWith(fontSize: 13.5))),
                  ok ? const Pill('9.1 s', bg: C.problemBg, fg: C.problemFg) : const Pill('Skipped', bg: C.bg, fg: C.muted),
                ]),
              ),
            ),
          ),
      ]);
}

class _EmailArt extends StatelessWidget {
  const _EmailArt();
  @override
  Widget build(BuildContext context) => _mini(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          for (final w in const [1.0, 0.9, 0.95, 0.6]) Padding(padding: const EdgeInsets.only(bottom: 7), child: FractionallySizedBox(widthFactor: w, child: Container(height: 8, decoration: BoxDecoration(color: C.line, borderRadius: BorderRadius.circular(4))))),
          const SizedBox(height: 6),
          Row(children: [
            Expanded(
              child: Container(
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: C.primary, borderRadius: BorderRadius.circular(999)),
                child: const Text('Approve', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
            const SizedBox(width: 8),
            Container(height: 34, padding: const EdgeInsets.symmetric(horizontal: 12), alignment: Alignment.center, decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(999)), child: const Text('Edit', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
          ]),
        ]),
      );
}

class _ResultsArt extends StatelessWidget {
  const _ResultsArt();
  @override
  Widget build(BuildContext context) => _mini(
        child: SizedBox(
          height: 120,
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            for (final (h, c) in const [(0.9, C.line), (0.5, Color(0xFFB9C6F5)), (0.3, C.primary)]) ...[
              Expanded(child: FractionallySizedBox(heightFactor: h, child: Container(decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(10))))),
              const SizedBox(width: 10),
            ],
          ]),
        ),
      );
}
