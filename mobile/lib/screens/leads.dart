import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/refresh_list.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';
import 'home.dart';
import 'onboarding.dart';
import 'pitch.dart';

/// Leads: one plain list of the businesses the agent found. The ones
/// waiting for your approval come first, then the furthest along. Each card
/// shows its stage. Skipped ones sit at the end, folded away.
class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});
  @override
  State<LeadsScreen> createState() => LeadsScreenState();
}

class LeadsScreenState extends State<LeadsScreen> {
  late Future<({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile})> _data = Repo.leads();
  final _cached = Repo.cachedLeads();
  bool _showSkipped = false;

  void reload() => setState(() {
        _data = Repo.leads();
      });

  Future<void> _open(Lead l) async {
    await Navigator.of(context).push(CupertinoPageRoute(builder: (_) => PitchScreen(id: l.pitchId!)));
    reload();
  }

  @override
  Widget build(BuildContext context) {
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
      body: FutureBuilder(
        future: _data,
        initialData: _cached,
        builder: (context, snap) => RefreshList(
          onRefresh: () async {
            reload();
            await _data;
          },
          children: [
            const ScreenTitle('Leads', subtitle: 'Businesses the agent found.'),
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
        ),
      ),
    );
  }

  Widget _content(({Loaded<List<Lead>> leads, bool signedIn, bool hasProfile}) d) {
    final leads = d.leads.value;
    int n(Stage s) => leads.where((l) => l.stage == s).length;
    // One plain list, the ones that need you first, then the furthest along.
    const order = [Stage.needsApproval, Stage.replied, Stage.opened, Stage.sent, Stage.audited, Stage.found];
    final active = [for (final s in order) ...leads.where((l) => l.stage == s)];
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
      if (active.isEmpty)
        Settle(
          index: i++,
          child: SoftCard(
            padding: const EdgeInsets.all(22),
            child: Column(children: [
              Container(width: 54, height: 54, decoration: const BoxDecoration(color: C.primarySoft, shape: BoxShape.circle), child: const Icon(Icons.travel_explore_rounded, color: C.primary)),
              const SizedBox(height: 12),
              Text('No leads yet', style: T.h2),
              const SizedBox(height: 4),
              Text('Run a search and the businesses the agent finds show up here.', style: T.small, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Btn('New search', icon: Icons.add_rounded, onTap: () => HomeScreen.of(context).go(1)),
            ]),
          ),
        ),
      for (final l in active) ...[
        Settle(index: i++, child: _LeadCard(lead: l, onOpen: _open)),
        const SizedBox(height: 10),
      ],
      const SizedBox(height: 8),
      if (n(Stage.skipped) > 0)
        Settle(
          index: i,
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
            Row(children: [
              Expanded(child: Text(lead.companyName, style: T.h3)),
              if (lead.stage != Stage.skipped) _StagePill(lead.stage),
            ]),
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

/// Small coloured label with the lead's stage.
class _StagePill extends StatelessWidget {
  const _StagePill(this.stage);
  final Stage stage;
  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (stage) {
      Stage.needsApproval => (C.primary, Colors.white),
      Stage.replied => (C.okBg, C.okFg),
      Stage.sent || Stage.opened => (C.problemBg, C.problemFg),
      _ => (const Color(0xFFECEEF6), C.muted),
    };
    return Pill(stageName(stage), bg: bg, fg: fg);
  }
}
