import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/settle.dart';
import '../widgets/ui.dart';

/// New search: what kind of business to look for, where, and how many.
/// "Run the agent" asks the server to pick businesses, then checks them a
/// few at a time and shows each result here as it comes in. Drafts land in
/// Leads under "Needs approval". Nothing is sent from here.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String skill = 'web';
  String type = businessGroups.first.types.first;
  final _sector = TextEditingController();
  String get _sectorText => type == 'Other' ? _sector.text.trim() : type;

  /// Opens a list of business types from the bottom of the screen, in
  /// groups, with a box at the top to filter it.
  Future<void> _pickType() async {
    FocusScope.of(context).unfocus();
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: C.card,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => _TypePicker(current: type),
    );
    if (picked != null) setState(() => type = picked);
  }

  final _city = TextEditingController(text: 'Nagpur');
  double count = 10;
  bool busy = false;
  String? note;
  bool ok = false;

  List<AgentLead> _leads = [];
  bool _finding = false;

  Future<void> _run() async {
    FocusScope.of(context).unfocus();
    if (_sectorText.isEmpty) {
      setState(() {
        ok = false;
        note = 'Type the kind of business first.';
      });
      return;
    }
    setState(() {
      busy = true;
      _finding = true;
      ok = true;
      note = '${count.round()} ${_sectorText.toLowerCase()} in ${_city.text.trim()}.';
      _leads = [];
    });
    try {
      final r = await Agent.start(skill: skill, sector: _sectorText, city: _city.text, count: count.round());
      if (!mounted) return;
      setState(() {
        ok = true;
        _finding = false;
        _leads = r.leads;
        note = r.leads.isEmpty ? 'No new businesses for ${_sectorText.toLowerCase()} in ${_city.text.trim()}. ${r.note}' : r.note;
      });
      // Check three at a time: each check can take up to a minute.
      final queue = [...r.leads];
      Future<void> worker() async {
        while (queue.isNotEmpty) {
          final lead = queue.removeAt(0);
          await Agent.check(r.searchId, skill, lead);
          if (mounted) setState(() {});
        }
      }
      await Future.wait([worker(), worker(), worker()]);
    } catch (e) {
      if (mounted) {
        setState(() {
          ok = false;
          _finding = false;
          note = '$e'.replaceFirst('Exception: ', '');
        });
      }
    }
    if (mounted) setState(() => busy = false);
  }

  int _count(String stage) => _leads.where((l) => l.stage == stage).length;

  Widget _step(String label, bool done, {bool active = false}) => Row(children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(color: done ? C.green : C.bg, shape: BoxShape.circle),
          child: done
              ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
              : active
                  ? const Padding(padding: EdgeInsets.all(6), child: CircularProgressIndicator(strokeWidth: 2, color: C.primary))
                  : const Icon(Icons.more_horiz_rounded, size: 16, color: C.muted),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: T.h3.copyWith(color: done || active ? C.fg : C.muted))),
      ]);

  Widget _leadRow(AgentLead l) {
    final (IconData icon, Color color) = switch (l.stage) {
      null => (Icons.hourglass_top_rounded, C.muted),
      'needs_approval' => (Icons.mark_email_unread_rounded, C.green),
      'audited' => (Icons.fact_check_rounded, C.primary),
      'skipped' => (Icons.do_not_disturb_on_rounded, C.muted),
      _ => (Icons.error_outline_rounded, C.problemFg),
    };
    final line = l.stage == null ? 'Checking the website…' : [l.topProblem, l.note].whereType<String>().where((t) => t.isNotEmpty).join(' · ');
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.only(top: 2), child: Icon(icon, size: 20, color: color)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.name, style: T.h3),
            if (line.isNotEmpty) Text(line, style: T.small),
          ]),
        ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      body: ListView(
        padding: EdgeInsets.fromLTRB(S.page, pad.top + 16, S.page, pad.bottom + 110),
        children: [
          const ScreenTitle('New search', subtitle: 'The agent checks each website and keeps only the ones with a real, measurable problem.'),
          const SizedBox(height: 22),
          Settle(
            child: SoftCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text('What can you offer?', style: T.h3),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final o in skillOptions)
                    Pressable(
                      onTap: () => setState(() => skill = o.key),
                      child: AnimatedContainer(
                        duration: M.fast,
                        height: 44,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(color: skill == o.key ? C.ink : C.bg, borderRadius: BorderRadius.circular(999)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(skillIcon(o.key), size: 18, color: skill == o.key ? Colors.white : C.fg),
                          const SizedBox(width: 6),
                          Text(o.name, style: TextStyle(fontWeight: FontWeight.w700, color: skill == o.key ? Colors.white : C.fg)),
                        ]),
                      ),
                    ),
                ]),
                const SizedBox(height: 18),
                Text('Type of business', style: T.h3),
                const SizedBox(height: 8),
                Pressable(
                  scale: 0.98,
                  onTap: _pickType,
                  child: Container(
                    height: 54,
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: C.line)),
                    child: Row(children: [
                      Expanded(child: Text(type, style: T.body.copyWith(fontWeight: FontWeight.w600))),
                      const Icon(Icons.expand_more_rounded, color: C.muted),
                    ]),
                  ),
                ),
                AnimatedSize(
                  duration: M.normal,
                  curve: M.ease,
                  child: type != 'Other'
                      ? const SizedBox(width: double.infinity)
                      : Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: TextField(controller: _sector, autofocus: true, textCapitalization: TextCapitalization.sentences, decoration: const InputDecoration(hintText: 'Type it, e.g. Pet shops')),
                        ),
                ),
                const SizedBox(height: 18),
                Text('City', style: T.h3),
                const SizedBox(height: 8),
                TextField(controller: _city, decoration: const InputDecoration(hintText: 'e.g. Nagpur')),
                const SizedBox(height: 18),
                Row(children: [
                  Text('How many businesses', style: T.h3),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: C.primarySoft, borderRadius: BorderRadius.circular(999)),
                    child: Text('${count.round()}', style: const TextStyle(color: C.primary, fontWeight: FontWeight.w800)),
                  ),
                ]),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: C.primary,
                    inactiveTrackColor: C.line,
                    thumbColor: C.primary,
                    overlayColor: C.primary.withValues(alpha: 0.1),
                    trackHeight: 6,
                  ),
                  child: Slider(value: count, min: 1, max: 20, divisions: 19, onChanged: (v) => setState(() => count = v)),
                ),
                Text('At most 20 per search. You approve every email, up to 15 a day.', style: T.small),
              ]),
            ),
          ),
          const SizedBox(height: 18),
          Settle(index: 2, child: Btn('Run the agent', icon: Icons.auto_awesome_rounded, expand: true, busy: busy, onTap: _run)),
          // What the agent did with this search shows right here, under the button.
          AnimatedSize(
            duration: M.normal,
            curve: M.ease,
            alignment: Alignment.topCenter,
            child: note == null
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 18),
                    child: !ok
                        ? Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(color: C.problemBg, borderRadius: BorderRadius.circular(16)),
                            child: Text(note!, style: const TextStyle(color: C.problemFg, fontWeight: FontWeight.w600)),
                          )
                        : Settle(
                            child: SoftCard(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('This search', style: T.h2),
                                const SizedBox(height: 2),
                                Text(note!, style: T.small),
                                const SizedBox(height: 14),
                                _step(_finding ? 'Finding businesses' : 'Found ${_leads.length} ${_leads.length == 1 ? 'business' : 'businesses'}', !_finding, active: _finding),
                                const SizedBox(height: 10),
                                _step(
                                  _leads.isEmpty || _leads.any((l) => !l.done) ? 'Check their websites' : 'Checked ${_leads.length}, skipped ${_count('skipped')} with no real problem',
                                  _leads.isNotEmpty && _leads.every((l) => l.done),
                                  active: !_finding && _leads.any((l) => !l.done),
                                ),
                                const SizedBox(height: 10),
                                _step(
                                  _count('needs_approval') > 0 ? '${_count('needs_approval')} ${_count('needs_approval') == 1 ? 'email' : 'emails'} ready for you in Leads' : 'Draft emails for you to approve',
                                  _count('needs_approval') > 0 && !busy,
                                  active: busy && !_finding,
                                ),
                                for (final l in _leads) _leadRow(l),
                                const SizedBox(height: 14),
                                Text('Nothing is sent until you open a draft in Leads and press Approve.', style: T.small.copyWith(fontSize: 12)),
                              ]),
                            ),
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _TypePicker extends StatefulWidget {
  const _TypePicker({required this.current});
  final String current;
  @override
  State<_TypePicker> createState() => _TypePickerState();
}

class _TypePickerState extends State<_TypePicker> {
  String q = '';

  Widget _row(String t) => Pressable(
        scale: 0.98,
        onTap: () => Navigator.of(context).pop(t),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(color: t == widget.current ? C.primarySoft : null, borderRadius: BorderRadius.circular(14)),
          child: Row(children: [
            Expanded(child: Text(t, style: T.h3.copyWith(color: t == widget.current ? C.primary : C.fg))),
            if (t == widget.current) const Icon(Icons.check_rounded, color: C.primary, size: 20),
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final query = q.trim().toLowerCase();
    return Padding(
      padding: EdgeInsets.only(bottom: mq.viewInsets.bottom),
      child: SizedBox(
        height: mq.size.height * 0.78,
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(S.page, 0, S.page, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Type of business', style: T.h2),
              const SizedBox(height: 12),
              TextField(
                onChanged: (v) => setState(() => q = v),
                decoration: const InputDecoration(hintText: 'Search, e.g. SaaS or salons', prefixIcon: Icon(Icons.search_rounded, color: C.muted)),
              ),
            ]),
          ),
          Expanded(
            child: ListView(padding: EdgeInsets.fromLTRB(8, 4, 8, mq.padding.bottom + 12), children: [
              for (final g in businessGroups) ...[
                if (g.types.any((t) => t.toLowerCase().contains(query))) ...[
                  Padding(padding: const EdgeInsets.fromLTRB(14, 14, 14, 6), child: Text(g.name.toUpperCase(), style: T.tiny)),
                  for (final t in g.types.where((t) => t.toLowerCase().contains(query))) _row(t),
                ],
              ],
              const Padding(padding: EdgeInsets.fromLTRB(14, 14, 14, 6), child: Divider(height: 1, color: C.line)),
              _row('Other'),
            ]),
          ),
        ]),
      ),
    );
  }
}
