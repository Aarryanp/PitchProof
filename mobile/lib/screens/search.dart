import 'package:flutter/material.dart';
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
  final _sector = TextEditingController(text: 'Clinics');
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
      await Repo.saveSearch(skill: skill, sector: _sector.text, city: _city.text, count: count.round());
      setState(() {
        ok = true;
        note = 'Search saved. The agent will look for ${count.round()} businesses once its steps are connected.';
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
                Row(children: [
                  for (final (k, label, icon) in const [('web', 'Web', Icons.code_rounded), ('design', 'Design', Icons.palette_outlined)]) ...[
                    Expanded(
                      child: Pressable(
                        onTap: () => setState(() => skill = k),
                        child: AnimatedContainer(
                          duration: M.fast,
                          height: 48,
                          decoration: BoxDecoration(color: skill == k ? C.ink : C.bg, borderRadius: BorderRadius.circular(999)),
                          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(icon, size: 18, color: skill == k ? Colors.white : C.fg),
                            const SizedBox(width: 6),
                            Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: skill == k ? Colors.white : C.fg)),
                          ]),
                        ),
                      ),
                    ),
                    if (k == 'web') const SizedBox(width: 10),
                  ],
                ]),
                const SizedBox(height: 18),
                Text('Type of business', style: T.h3),
                const SizedBox(height: 8),
                TextField(controller: _sector, decoration: const InputDecoration(hintText: 'e.g. Clinics, cafes, coaching classes')),
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
          AnimatedSize(
            duration: M.normal,
            curve: M.ease,
            child: note == null
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 14),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: ok ? C.okBg : C.problemBg, borderRadius: BorderRadius.circular(16)),
                      child: Text(note!, style: TextStyle(color: ok ? C.okFg : C.problemFg, fontWeight: FontWeight.w600)),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
