import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';

/// Results: what was sent, opened and answered, and whether audit pitches
/// get more replies than generic ones.
class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});
  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  late Future<Loaded<Results>> _data = Repo.results();

  int _pct(int a, int b) => b == 0 ? 0 : (a * 100 / b).round();

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      body: RefreshIndicator(
        color: C.primary,
        onRefresh: () async {
          setState(() {
            _data = Repo.results();
          });
          await _data;
        },
        child: FutureBuilder(
          future: _data,
          builder: (context, snap) => ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: EdgeInsets.fromLTRB(S.page, pad.top + 16, S.page, pad.bottom + 110),
            children: [
              const ScreenTitle('Results', subtitle: 'How your pitches are doing.'),
              const SizedBox(height: 18),
              if (!snap.hasData) const ListSkeleton(rows: 2) else ..._content(snap.data!),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _content(Loaded<Results> d) {
    final r = d.value;
    final stats = [
      ('Emails sent', r.sent, null),
      ('Pages opened', r.opened, '${_pct(r.opened, r.sent)}% of sent'),
      ('Replies', r.replied, '${_pct(r.replied, r.sent)}% of sent'),
      ('Positive replies', r.positive, null),
    ];
    final rates = [('Audit pitch', r.audit), ('Generic pitch', r.generic)];
    final best = rates.map((x) => _pct(x.$2.$2, x.$2.$1)).fold(1, (a, b) => a > b ? a : b);
    return [
      if (d.sample) ...[const Settle(child: SampleNote('These numbers are made up. Yours show here after your first emails go out.')), const SizedBox(height: S.gap)],
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: S.gap,
        crossAxisSpacing: S.gap,
        childAspectRatio: 1.45,
        children: [
          for (final (i, s) in stats.indexed)
            Settle(
              index: i + 1,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: cardBox(color: i == 2 ? C.primary : C.card),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.$1, style: T.small.copyWith(color: i == 2 ? Colors.white70 : C.muted, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: s.$2.toDouble()),
                    duration: const Duration(milliseconds: 800),
                    curve: M.ease,
                    builder: (_, v, _) => Text('${v.round()}', style: T.big.copyWith(color: i == 2 ? Colors.white : C.fg, fontSize: 30)),
                  ),
                  if (s.$3 != null) ...[const SizedBox(height: 4), Text(s.$3!, style: T.small.copyWith(fontSize: 12, color: i == 2 ? Colors.white70 : C.muted))],
                ]),
              ),
            ),
        ],
      ),
      const SizedBox(height: S.gap),
      Settle(
        index: 5,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Audit pitch vs generic pitch', style: T.h2),
            const SizedBox(height: 4),
            Text('Reply rate for each kind of email, sent to similar businesses.', style: T.small),
            for (final (label, (sent, replied)) in rates) ...[
              const SizedBox(height: 16),
              Row(children: [
                Text(label, style: T.h3),
                const Spacer(),
                Text('${_pct(replied, sent)}% · $replied of $sent', style: T.small),
              ]),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  height: 12,
                  color: C.bg,
                  alignment: Alignment.centerLeft,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: _pct(replied, sent) / best),
                    duration: const Duration(milliseconds: 900),
                    curve: M.ease,
                    builder: (_, v, _) => FractionallySizedBox(
                      widthFactor: v,
                      child: Container(decoration: BoxDecoration(color: label.startsWith('Audit') ? C.primary : const Color(0xFFB4B9CC), borderRadius: BorderRadius.circular(999))),
                    ),
                  ),
                ),
              ),
            ],
          ]),
        ),
      ),
      const SizedBox(height: S.gap),
      Settle(
        index: 6,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Skills to learn next', style: T.h2),
            const SizedBox(height: 4),
            Text("Problems the agent found that your skills don't cover yet.", style: T.small),
            const SizedBox(height: 8),
            if (r.skillGaps.isEmpty) Text('None yet.', style: T.small),
            for (final (skill, n) in r.skillGaps)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(children: [
                  const Icon(Icons.lightbulb_outline_rounded, size: 18, color: C.amber),
                  const SizedBox(width: 10),
                  Expanded(child: Text(skill, style: T.body)),
                  Text('$n ${n == 1 ? 'business' : 'businesses'}', style: T.small),
                ]),
              ),
          ]),
        ),
      ),
    ];
  }
}
