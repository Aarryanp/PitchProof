import 'package:flutter/material.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/ui.dart';
import 'tour.dart';

/// Questions about the student, one per screen, with a progress bar.
/// Used after the first sign-in, and again from "Edit profile".
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, this.student, this.projects, this.editing = false});
  final Student? student;
  final List<Project>? projects;
  final bool editing;
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late final Student s = widget.student ?? Student();
  late final List<Project> projects = widget.projects?.isNotEmpty == true ? widget.projects! : [Project()];
  late final _name = TextEditingController(text: s.name);
  late final _city = TextEditingController(text: s.city ?? '');
  late final _year = TextEditingController(text: s.yearOrGrad ?? '');
  late final _bio = TextEditingController(text: s.bio ?? '');
  int step = 0;
  bool forward = true;
  bool saving = false;
  String? error;

  @override
  void initState() {
    super.initState();
    for (final c in [_name, _city, _year, _bio]) {
      c.addListener(() => setState(() {}));
    }
  }

  /// Each step: its question, a hint, the answer widget, whether Continue
  /// is allowed, and [optional] steps get a "Do this later" button.
  List<({String title, String hint, Widget body, bool ok, bool optional})> get steps => [
        (title: "What's your name?", hint: 'Companies see this on the page made for them.', ok: _name.text.trim().isNotEmpty, optional: false, body: _field(_name, 'Your name')),
        (
          title: 'Where are you based?',
          hint: 'The agent looks for businesses near you first.',
          ok: _city.text.trim().isNotEmpty,
          optional: false,
          body: Column(children: [_field(_city, 'City, e.g. Nagpur'), const SizedBox(height: S.gap), _field(_year, 'Year, e.g. 3rd year or graduate')]),
        ),
        (
          title: 'What can you do?',
          hint: 'Pick as many as you like. The agent only pitches what you can deliver.',
          ok: s.skills.isNotEmpty,
          optional: false,
          body: Column(children: [
            for (final k in skillOptions)
              Padding(
                padding: const EdgeInsets.only(bottom: S.gap),
                child: _Choice(
                  icon: skillIcon(k.key),
                  label: k.name,
                  hint: k.hint,
                  selected: s.skills.contains(k.key),
                  onTap: () => setState(() => s.skills.contains(k.key) ? s.skills.remove(k.key) : s.skills.add(k.key)),
                ),
              ),
          ]),
        ),
        (title: 'One line about you', hint: 'Shown on the company page, under your name.', ok: _bio.text.trim().isNotEmpty, optional: true, body: _field(_bio, 'e.g. CS student who builds fast sites for small businesses', lines: 3)),
        (
          title: 'Things you have made',
          hint: 'Two or three is plenty. Companies see these.',
          ok: projects.any((p) => p.title.trim().isNotEmpty),
          optional: true,
          body: Column(children: [
            for (var i = 0; i < projects.length; i++) Padding(padding: const EdgeInsets.only(bottom: S.gap), child: _ProjectCard(key: ObjectKey(projects[i]), p: projects[i], onChanged: () => setState(() {}), onRemove: projects.length > 1 ? () => setState(() => projects.removeAt(i)) : null)),
            if (projects.length < 3) Btn('Add another', icon: Icons.add_rounded, kind: BtnKind.soft, big: false, onTap: () => setState(() => projects.add(Project()))),
          ]),
        ),
      ];

  Widget _field(TextEditingController c, String hint, {int lines = 1}) =>
      TextField(controller: c, minLines: lines, maxLines: lines == 1 ? 1 : 6, decoration: InputDecoration(hintText: hint), textCapitalization: TextCapitalization.sentences);

  Future<void> _next() async {
    FocusScope.of(context).unfocus();
    if (step < steps.length - 1) {
      setState(() {
        forward = true;
        step++;
      });
      return;
    }
    s
      ..name = _name.text
      ..city = _city.text
      ..yearOrGrad = _year.text
      ..bio = _bio.text;
    if (userId == null) {
      // Looking around without an account: nothing to save, carry on.
      if (widget.editing) return Navigator.of(context).pop();
      Navigator.of(context).pushAndRemoveUntil(fadeRoute(const TourScreen()), (_) => false);
      return;
    }
    setState(() {
      saving = true;
      error = null;
    });
    try {
      await Repo.saveProfile(s, projects);
      if (!mounted) return;
      if (widget.editing) {
        Navigator.of(context).pop(true);
      } else {
        Navigator.of(context).pushAndRemoveUntil(fadeRoute(const TourScreen()), (_) => false);
      }
    } catch (e) {
      setState(() => error = '$e'.replaceFirst('Exception: ', ''));
    }
    if (mounted) setState(() => saving = false);
  }

  void _back() {
    if (step == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    setState(() {
      forward = false;
      step--;
    });
  }

  @override
  Widget build(BuildContext context) {
    final all = steps;
    final cur = all[step];
    final last = step == all.length - 1;
    return PopScope(
      canPop: step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        body: SafeArea(
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(S.page, 8, S.page, 0),
              child: Row(children: [
                AnimatedOpacity(
                  opacity: step == 0 && !widget.editing ? 0 : 1,
                  duration: M.fast,
                  child: Pressable(
                    radius: BorderRadius.circular(999),
                    onTap: step == 0 && !widget.editing ? null : _back,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: C.card, shape: BoxShape.circle, boxShadow: cardShadow),
                      child: Icon(step == 0 ? Icons.close_rounded : Icons.arrow_back_rounded, size: 20),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Row(children: [
                    for (var i = 0; i < all.length; i++) ...[
                      if (i > 0) const SizedBox(width: 5),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            height: 6,
                            color: C.line,
                            alignment: Alignment.centerLeft,
                            child: AnimatedFractionallySizedBox(
                              duration: const Duration(milliseconds: 420),
                              curve: M.ease,
                              widthFactor: i <= step ? 1 : 0,
                              child: Container(color: C.primary),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ]),
                ),
                const SizedBox(width: 14),
                SizedBox(width: 32, child: Text('${step + 1}/${all.length}', textAlign: TextAlign.right, style: T.tiny)),
              ]),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 360),
                switchInCurve: M.ease,
                switchOutCurve: Curves.easeIn,
                transitionBuilder: (child, a) {
                  final incoming = child.key == ValueKey(step);
                  final dx = (incoming ? 1 : -1) * (forward ? 0.12 : -0.12);
                  return FadeTransition(
                    opacity: a,
                    child: SlideTransition(position: Tween(begin: Offset(dx, 0), end: Offset.zero).animate(a), child: child),
                  );
                },
                child: ListView(
                  key: ValueKey(step),
                  padding: const EdgeInsets.fromLTRB(S.page, 32, S.page, 24),
                  children: [
                    Text(cur.title, style: T.title),
                    const SizedBox(height: 8),
                    Text(cur.hint, style: T.body.copyWith(color: C.muted)),
                    const SizedBox(height: 24),
                    cur.body,
                    if (error != null) ...[const SizedBox(height: 12), Text(error!, style: const TextStyle(color: C.danger, fontWeight: FontWeight.w600))],
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(S.page, 0, S.page, 12),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Btn(last ? (widget.editing ? 'Save' : 'Finish') : 'Continue', expand: true, busy: saving, onTap: cur.ok ? _next : null),
                // Optional steps can be skipped now and filled in later from Me.
                AnimatedSize(
                  duration: M.fast,
                  child: cur.optional && !cur.ok
                      ? Padding(padding: const EdgeInsets.only(top: 4), child: Btn('Do this later', kind: BtnKind.plain, expand: true, onTap: saving ? null : _next))
                      : const SizedBox(width: double.infinity),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// A big tappable option card with an icon, used for skills.
class _Choice extends StatelessWidget {
  const _Choice({required this.icon, required this.label, required this.hint, required this.selected, required this.onTap});
  final IconData icon;
  final String label;
  final String hint;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Pressable(
        onTap: onTap,
        scale: 0.98,
        radius: BorderRadius.circular(S.radius),
        child: AnimatedContainer(
          duration: M.fast,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFFF3F5FF) : C.card,
            borderRadius: BorderRadius.circular(S.radius),
            border: Border.all(color: selected ? C.primary : Colors.transparent, width: 2),
            boxShadow: cardShadow,
          ),
          child: Row(children: [
            AnimatedContainer(
              duration: M.fast,
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: selected ? C.primary : C.bg, shape: BoxShape.circle),
              child: Icon(icon, color: selected ? Colors.white : C.fg, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: T.h3), const SizedBox(height: 2), Text(hint, style: T.small)])),
            AnimatedScale(
              scale: selected ? 1 : 0,
              duration: M.normal,
              curve: Curves.easeOutBack,
              child: const Icon(Icons.check_circle_rounded, color: C.primary),
            ),
          ]),
        ),
      );
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({super.key, required this.p, required this.onChanged, this.onRemove});
  final Project p;
  final VoidCallback onChanged;
  final VoidCallback? onRemove;
  @override
  Widget build(BuildContext context) => SoftCard(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextFormField(initialValue: p.title, decoration: const InputDecoration(hintText: 'Name, e.g. Bakery website'), onChanged: (v) {
            p.title = v;
            onChanged();
          }),
          const SizedBox(height: 10),
          TextFormField(initialValue: p.oneLine, decoration: const InputDecoration(hintText: 'What you made, and the result'), onChanged: (v) => p.oneLine = v),
          const SizedBox(height: 10),
          TextFormField(initialValue: p.link, keyboardType: TextInputType.url, decoration: const InputDecoration(hintText: 'Link (optional)'), onChanged: (v) => p.link = v),
          const SizedBox(height: 10),
          Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
            for (final t in skillOptions.map((o) => o.key)) ...[
              Pressable(
                radius: BorderRadius.circular(999),
                onTap: () {
                  p.skillTag = t;
                  onChanged();
                },
                child: AnimatedContainer(
                  duration: M.fast,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: p.skillTag == t ? C.ink : C.bg, borderRadius: BorderRadius.circular(999)),
                  child: Text(const {'web': 'Web', 'design': 'Design', 'seo': 'SEO', 'chatbot': 'Chatbot', 'content': 'Writing', 'social': 'Social', 'video': 'Video', 'app': 'App'}[t] ?? t, style: TextStyle(color: p.skillTag == t ? Colors.white : C.fg, fontWeight: FontWeight.w700, fontSize: 13)),
                ),
              ),
            ],
            if (onRemove != null) Btn('Remove', icon: Icons.delete_outline_rounded, kind: BtnKind.plain, big: false, onTap: onRemove),
          ]),
        ]),
      );
}
