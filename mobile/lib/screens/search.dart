import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/settle.dart';
import '../widgets/ui.dart';

/// New search: what kind of business to look for, where, and how many.
/// For now this saves the search; running the agent on it comes with the
/// agent steps.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String skill = 'web';
  String type = businessTypes.first;
  final _sector = TextEditingController();
  String get _sectorText => type == 'Other' ? _sector.text.trim() : type;

  /// Opens a list of business types from the bottom of the screen.
  Future<void> _pickType() async {
    FocusScope.of(context).unfocus();
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: C.card,
      showDragHandle: true,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
          child: ListView(shrinkWrap: true, padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), children: [
            Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 8), child: Text('Type of business', style: T.h2)),
            for (final t in [...businessTypes, 'Other'])
              Pressable(
                scale: 0.98,
                onTap: () => Navigator.of(context).pop(t),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
                  decoration: BoxDecoration(color: t == type ? C.primarySoft : null, borderRadius: BorderRadius.circular(14)),
                  child: Row(children: [
                    Expanded(child: Text(t, style: T.h3.copyWith(color: t == type ? C.primary : C.fg))),
                    if (t == type) const Icon(Icons.check_rounded, color: C.primary, size: 20),
                  ]),
                ),
              ),
          ]),
        ),
      ),
    );
    if (picked != null) setState(() => type = picked);
  }
  final _city = TextEditingController(text: 'Nagpur');
  double count = 10;
  bool busy = false;
  String? note;
  bool ok = false;

  Future<void> _run() async {
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      note = null;
    });
    try {
      await Repo.saveSearch(skill: skill, sector: _sectorText, city: _city.text, count: count.round());
      setState(() {
        ok = true;
        note = '${count.round()} ${_sectorText.toLowerCase()} in ${_city.text.trim()}. The agent steps are not connected to the app yet, so the next steps wait.';
      });
    } catch (e) {
      setState(() {
        ok = false;
        note = '$e'.replaceFirst('Exception: ', '');
      });
    }
    if (mounted) setState(() => busy = false);
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
                                for (final (i, (step, done)) in const [
                                  ('Search saved', true),
                                  ('Find businesses', false),
                                  ('Check their websites', false),
                                  ('Draft emails for you to approve', false),
                                ].indexed)
                                  Padding(
                                    padding: EdgeInsets.only(top: i == 0 ? 0 : 10),
                                    child: Row(children: [
                                      Container(
                                        width: 26,
                                        height: 26,
                                        decoration: BoxDecoration(color: done ? C.green : C.bg, shape: BoxShape.circle),
                                        child: Icon(done ? Icons.check_rounded : Icons.more_horiz_rounded, size: 16, color: done ? Colors.white : C.muted),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(child: Text(step, style: T.h3.copyWith(color: done ? C.fg : C.muted))),
                                    ]),
                                  ),
                                const SizedBox(height: 14),
                                Text('Businesses the agent finds will be listed here and in Leads.', style: T.small.copyWith(fontSize: 12)),
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
