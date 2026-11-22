import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';
import 'home.dart';
import 'onboarding.dart';
import 'pitch.dart';

/// Leads: every business the agent found, grouped by stage, top to bottom
/// in the order a lead moves: Found, Audited, Needs approval, Sent, Page
/// opened, Replied. Skipped ones sit at the end, folded away.
class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});
  @override
  State<LeadsScreen> createState() => LeadsScreenState();
}

class LeadsScreenState extends State<LeadsScreen> {
  late Future<({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile})> _data = Repo.leads();
  bool _showSkipped = false;

  void reload() => setState(() => _data = Repo.leads());

  Future<void> _open(Lead l) async {
    await Navigator.of(context).push(CupertinoPageRoute(builder: (_) => PitchScreen(id: l.pitchId!)));
    reload();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 78),
        child: Pressable(
          onTap: () => HomeScreen.of(context).go(1),
          child: Container(
            width: 58,
            height: 58,
            decoration: const BoxDecoration(color: C.ink, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0x661B1D2A), blurRadius: 22, offset: Offset(0, 10), spreadRadius: -8)]),
            child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
          ),
        ),
      ),
      body: RefreshIndicator(
        color: C.primary,
        onRefresh: () async {
          reload();
          await _data;
        },
        child: FutureBuilder(
          future: _data,
          builder: (context, snap) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: EdgeInsets.fromLTRB(S.page, MediaQuery.of(context).padding.top + 16, S.page, bottom + 110),
              children: [
                const ScreenTitle('Leads', subtitle: 'Businesses the agent found, and where each pitch stands.'),
                const SizedBox(height: 18),
                AnimatedSwitcher(
                  duration: M.normal,
                  child: snap.hasError
                      ? Text('Could not load leads: ${snap.error}', style: const TextStyle(color: C.danger))
                      : !snap.hasData
                          ? const ListSkeleton()
                          : _content(snap.data!),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _content(({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile}) d) {
    final leads = d.leads.value;
    int n(Stage s) => leads.where((l) => l.stage == s).length;
    final waiting = leads.where((l) => l.stage == Stage.needsApproval && l.pitchId != null).toList();
    var i = 0;
    return Column(key: const ValueKey('content'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (d.signedIn && !d.hasProfile) ...[
        Settle(
          index: i++,
          child: SoftCard(
            color: C.primary,
            padding: const EdgeInsets.all(16),
            onTap: () async {
              await Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const OnboardingScreen(editing: true)));
              reload();
            },
            child: Row(children: [
              Container(width: 42, height: 42, decoration: const BoxDecoration(color: Color(0x26FFFFFF), shape: BoxShape.circle), child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Finish setting up', style: T.h3.copyWith(color: Colors.white)),
                  Text('A few questions so the agent knows what you offer.', style: T.small.copyWith(color: Colors.white70)),
                ]),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.white),
            ]),
          ),
        ),
        const SizedBox(height: S.gap),
      ],
      if (d.leads.sample) ...[
        Settle(index: i++, child: SampleNote(d.signedIn ? 'Made-up businesses. Your real leads show here once the agent runs.' : 'Made-up businesses so you can see how the app works.')),
        const SizedBox(height: S.gap),
      ],
      Settle(
        index: i++,
        child: Row(children: [
          Expanded(child: _Stat(value: leads.length, label: 'Found')),
          const SizedBox(width: S.gap),
          Expanded(child: _Stat(value: waiting.length, label: 'To approve', highlight: waiting.isNotEmpty)),
          const SizedBox(width: S.gap),
          Expanded(child: _Stat(value: n(Stage.replied), label: 'Replied')),
        ]),
      ),
      if (waiting.isNotEmpty) ...[
        const SizedBox(height: S.gap),
        Settle(
          index: i++,
          child: SoftCard(
            padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
            onTap: () => _open(waiting.first),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${waiting.length} ${waiting.length == 1 ? 'pitch is' : 'pitches are'} waiting for you', style: T.h3),
                  const SizedBox(height: 2),
                  Text('Nothing is sent until you approve it.', style: T.small),
                ]),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(color: C.primary, borderRadius: BorderRadius.circular(999)),
                child: const Text('Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
              ),
            ]),
          ),
        ),
      ],
      const SizedBox(height: 26),
      for (final (k, s) in stageOrder.where((s) => s != Stage.skipped).indexed)
        Settle(
          index: i + k,
          child: _StageSection(
            number: k + 1,
            stage: s,
            leads: leads.where((l) => l.stage == s).toList(),
            last: k == stageOrder.length - 2,
            onOpen: _open,
          ),
        ),
      const SizedBox(height: 8),
      if (n(Stage.skipped) > 0)
        Settle(
          index: i + 7,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Pressable(
              onTap: () => setState(() => _showSkipped = !_showSkipped),
              scale: 0.98,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(color: const Color(0xFFECEEF6), borderRadius: BorderRadius.circular(18)),
                child: Row(children: [
                  const Icon(Icons.do_not_disturb_on_outlined, size: 18, color: C.muted),
                  const SizedBox(width: 10),
                  Expanded(child: Text('Skipped  ·  ${n(Stage.skipped)}', style: T.h3.copyWith(color: C.muted))),
                  AnimatedRotation(turns: _showSkipped ? 0.5 : 0, duration: M.normal, child: const Icon(Icons.expand_more_rounded, color: C.muted)),
                ]),
              ),
            ),
            AnimatedSize(
              duration: M.normal,
              curve: M.ease,
              alignment: Alignment.topCenter,
              child: !_showSkipped
                  ? const SizedBox(width: double.infinity)
                  : Column(children: [
                      for (final (j, l) in leads.where((l) => l.stage == Stage.skipped).indexed)
                        Padding(padding: const EdgeInsets.only(top: 10), child: Settle(index: j, child: _LeadCard(lead: l, onOpen: _open))),
                    ]),
            ),
          ]),
        ),
    ]);
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, this.highlight = false});
  final int value;
  final String label;
  final bool highlight;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(14, 14, 10, 12),
        decoration: cardBox(color: highlight ? C.primary : C.card),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: value.toDouble()),
            duration: const Duration(milliseconds: 700),
            curve: M.ease,
            builder: (_, v, _) => Text('${v.round()}', style: T.big.copyWith(color: highlight ? Colors.white : C.fg)),
          ),
          const SizedBox(height: 6),
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.small.copyWith(color: highlight ? Colors.white70 : C.muted, fontWeight: FontWeight.w600)),
        ]),
      );
}

/// One stage in the sequence: a numbered dot on a line down the left,
/// the stage name and count, then its leads.
class _StageSection extends StatelessWidget {
  const _StageSection({required this.number, required this.stage, required this.leads, required this.last, required this.onOpen});
  final int number;
  final Stage stage;
  final List<Lead> leads;
  final bool last;
  final ValueChanged<Lead> onOpen;

  Color get _dot => switch (stage) {
        Stage.needsApproval => C.primary,
        Stage.sent || Stage.opened => C.amber,
        Stage.replied => C.green,
        _ => const Color(0xFF9AA0B8),
      };

  @override
  Widget build(BuildContext context) {
    final empty = leads.isEmpty;
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(
          width: 30,
          child: Column(children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: empty ? C.card : _dot, shape: BoxShape.circle, border: Border.all(color: empty ? C.line : _dot, width: 2)),
              child: Text('$number', style: TextStyle(color: empty ? C.muted : Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
            ),
            if (!last) Expanded(child: Container(width: 2, margin: const EdgeInsets.symmetric(vertical: 4), color: C.line)),
          ]),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: last ? 12 : 22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              SizedBox(
                height: 28,
                child: Row(children: [
                  Text(stageName(stage), style: T.h2.copyWith(fontSize: 17, color: empty ? C.muted : C.fg)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: empty ? const Color(0xFFECEEF6) : _dot.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
                    child: Text('${leads.length}', style: TextStyle(color: empty ? C.muted : _dot, fontWeight: FontWeight.w800, fontSize: 12.5)),
                  ),
                ]),
              ),
              Text(empty ? 'Nothing here yet.' : stageHint(stage), style: T.small),
              for (final l in leads) ...[const SizedBox(height: 10), _LeadCard(lead: l, onOpen: onOpen)],
            ]),
          ),
        ),
      ]),
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({required this.lead, required this.onOpen});
  final Lead lead;
  final ValueChanged<Lead> onOpen;
  @override
  Widget build(BuildContext context) {
    final meta = [lead.sector, lead.city].whereType<String>().join(' · ');
    return SoftCard(
      padding: const EdgeInsets.all(14),
      onTap: lead.pitchId == null ? null : () => onOpen(lead),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Avatar(lead.companyName, size: 42),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lead.companyName, style: T.h3),
            if (meta.isNotEmpty) ...[const SizedBox(height: 2), Text(meta, style: T.small)],
            if (lead.topProblem != null) ...[const SizedBox(height: 8), Pill(lead.topProblem!, bg: C.problemBg, fg: C.problemFg)],
            if (lead.skipReason != null) ...[const SizedBox(height: 8), Pill(lead.skipReason!, bg: const Color(0xFFECEEF6), fg: C.muted)],
          ]),
        ),
        if (lead.pitchId != null) const Padding(padding: EdgeInsets.only(top: 10, left: 6), child: Icon(Icons.chevron_right_rounded, color: C.muted)),
      ]),
    );
  }
}
