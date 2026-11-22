import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';

/// Results: four blocks (sent, opened, replies, positive replies). Tap a
/// block to see those companies. Below them, every company you emailed,
/// best first: positive replies, other replies, opened, then just sent.
class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});
  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  late Future<Loaded<Results>> _data = Repo.results();

  void _openList(String title, List<SentPitch> list) =>
      Navigator.of(context).push(CupertinoPageRoute(builder: (_) => _CompanyListScreen(title: title, pitches: list)));

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
              const ScreenTitle('Results', subtitle: 'How your emails are doing.'),
              const SizedBox(height: 18),
              if (snap.hasError)
                Text('Could not load results: ${snap.error}', style: const TextStyle(color: C.danger))
              else if (!snap.hasData)
                const ListSkeleton(rows: 2)
              else
                ..._content(snap.data!.value),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _content(Results r) {
    final all = r.ordered;
    final blocks = [
      ('Emails sent', r.sent, Icons.send_rounded, all),
      ('Pages opened', r.opened, Icons.visibility_outlined, all.where((p) => p.outcome != Outcome.sent).toList()),
      ('Replies', r.replied, Icons.chat_bubble_outline_rounded, all.where((p) => p.outcome.index <= Outcome.replied.index).toList()),
      ('Positive replies', r.positive, Icons.thumb_up_alt_outlined, all.where((p) => p.outcome == Outcome.positive).toList()),
    ];
    return [
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: S.gap,
        crossAxisSpacing: S.gap,
        childAspectRatio: 1.35,
        children: [
          for (final (i, (label, n, icon, list)) in blocks.indexed)
            Settle(
              index: i,
              child: SoftCard(
                color: i == 3 ? C.primary : C.card,
                padding: const EdgeInsets.all(16),
                onTap: () => _openList(label, list),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Icon(icon, size: 18, color: i == 3 ? Colors.white70 : C.muted),
                    const Spacer(),
                    Icon(Icons.chevron_right_rounded, size: 20, color: i == 3 ? Colors.white70 : C.muted),
                  ]),
                  const Spacer(),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: n.toDouble()),
                    duration: const Duration(milliseconds: 800),
                    curve: M.ease,
                    builder: (_, v, _) => Text('${v.round()}', style: T.big.copyWith(color: i == 3 ? Colors.white : C.fg, fontSize: 30)),
                  ),
                  const SizedBox(height: 2),
                  Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.small.copyWith(color: i == 3 ? Colors.white70 : C.muted, fontWeight: FontWeight.w600)),
                ]),
              ),
            ),
        ],
      ),
      const SizedBox(height: 26),
      Text('COMPANIES', style: T.tiny),
      const SizedBox(height: 10),
      if (all.isEmpty)
        Settle(index: 4, child: SoftCard(child: Text('No emails sent yet. Companies show here once you approve and send your first pitches.', style: T.small))),
      for (final (i, p) in all.indexed) ...[
        Settle(index: 4 + i, child: _CompanyRow(p)),
        const SizedBox(height: 10),
      ],
    ];
  }
}

/// One company you emailed, with how far it got.
class _CompanyRow extends StatelessWidget {
  const _CompanyRow(this.p);
  final SentPitch p;
  @override
  Widget build(BuildContext context) {
    final meta = [p.sector, p.city].whereType<String>().where((x) => x.isNotEmpty).join(' · ');
    final (bg, fg) = switch (p.outcome) {
      Outcome.positive => (C.okBg, C.okFg),
      Outcome.replied => (C.primarySoft, C.primary),
      Outcome.opened => (C.problemBg, C.problemFg),
      Outcome.sent => (const Color(0xFFECEEF6), C.muted),
    };
    return SoftCard(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Avatar(p.companyName, size: 42),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.companyName, style: T.h3),
            if (meta.isNotEmpty) Text(meta, style: T.small),
          ]),
        ),
        const SizedBox(width: 8),
        Pill(outcomeName(p.outcome), bg: bg, fg: fg),
      ]),
    );
  }
}

/// The companies behind one block, opened by tapping it.
class _CompanyListScreen extends StatelessWidget {
  const _CompanyListScreen({required this.title, required this.pitches});
  final String title;
  final List<SentPitch> pitches;
  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      body: ListView(
        padding: EdgeInsets.fromLTRB(S.page, pad.top + 12, S.page, pad.bottom + 30),
        children: [
          const Align(alignment: Alignment.centerLeft, child: BackBtn(label: 'Results')),
          const SizedBox(height: 18),
          ScreenTitle(title, subtitle: '${pitches.length} ${pitches.length == 1 ? 'company' : 'companies'}'),
          const SizedBox(height: 18),
          if (pitches.isEmpty) SoftCard(child: Text('None yet.', style: T.small)),
          for (final (i, p) in pitches.indexed) ...[
            Settle(index: i, child: _CompanyRow(p)),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}
