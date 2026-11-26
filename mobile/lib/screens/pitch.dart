import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/models.dart';
import '../data/pitch_rules.dart';
import '../data/repo.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';

/// Pitch review: what the audit found (with proof), the fix preview, and
/// the email draft. Pick a tone to get a fresh AI version, edit it, or write
/// your own with the AI draft kept as a suggestion. The rule checks run as
/// you type, and Approve stays off until they all pass. Approving does not
/// send anything by itself.
class PitchScreen extends StatefulWidget {
  const PitchScreen({super.key, required this.id});
  final String id;
  @override
  State<PitchScreen> createState() => _PitchScreenState();
}

class _PitchScreenState extends State<PitchScreen> {
  // Fill the text boxes when the pitch arrives, not while the screen is being
  // drawn: changing a text box mid-draw stopped the screen from ever showing.
  late final Future<Loaded<Pitch?>> _data = Repo.pitch(widget.id).then((d) {
    if (d.value != null) _fill(d.value!);
    return d;
  });
  final _subject = TextEditingController();
  final _body = TextEditingController();
  final _personal = TextEditingController();
  bool _filled = false;
  final _bodyFocus = FocusNode();
  bool _busy = false;
  String? _note;
  String? _toneLoading; // the tone chip waiting for a new version
  String? _tonePicked; // the last tone the student asked for
  ({String subject, String body, String label})? _suggestion;

  static const _tones = [('friendly', 'Friendly'), ('formal', 'Formal'), ('short', 'Short')];

  @override
  void dispose() {
    for (final c in [_subject, _body, _personal]) {
      c.dispose();
    }
    _bodyFocus.dispose();
    super.dispose();
  }

  Future<void> _retone(bool sample, String pitchId, String tone, String label) async {
    if (_toneLoading != null) return;
    if (sample) {
      setState(() => _note = 'Sample data: tones work on your real pitches.');
      return;
    }
    setState(() {
      _toneLoading = tone;
      _note = null;
    });
    try {
      final d = await Agent.redraft(pitchId, tone);
      if (!mounted) return;
      setState(() {
        _tonePicked = tone;
        _suggestion = (subject: d.subject, body: d.body, label: '$label version');
      });
    } catch (e) {
      if (mounted) setState(() => _note = '$e'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _toneLoading = null);
    }
  }

  /// Clears the message so the student can write it themselves, keeping the
  /// AI draft below as a suggestion to copy from.
  void _writeOwn() {
    setState(() {
      if (_body.text.trim().isNotEmpty) _suggestion = (subject: _subject.text, body: _body.text, label: 'AI draft');
      _body.clear();
    });
    _bodyFocus.requestFocus();
  }

  void _useSuggestion() {
    final s = _suggestion;
    if (s == null) return;
    HapticFeedback.selectionClick();
    setState(() {
      if (s.subject.trim().isNotEmpty) _subject.text = s.subject;
      _body.text = s.body;
      _suggestion = null;
    });
  }

  @override
  void initState() {
    super.initState();
    _body.addListener(() {
      if (mounted) setState(() {});
    });
  }

  void _fill(Pitch p) {
    if (_filled) return;
    _filled = true;
    _subject.text = p.subject;
    _body.text = p.body;
    _personal.text = p.personalLine;
  }

  Future<void> _run(bool sample, Future<void> Function() action, {String? done, bool approve = false, bool leave = false}) async {
    if (sample) {
      if (approve) return _approved(sample: true);
      setState(() => _note = 'Sample data: nothing was saved.');
      return;
    }
    setState(() {
      _busy = true;
      _note = null;
    });
    try {
      await action();
      if (!mounted) return;
      if (approve) return _approved(sample: false);
      if (leave) return Navigator.of(context).pop();
      setState(() => _note = done);
    } catch (e) {
      setState(() => _note = '$e'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _approved({required bool sample}) async {
    HapticFeedback.mediumImpact();
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0x661B1D2A),
      isScrollControlled: true,
      builder: (_) => _ApprovedSheet(sample: sample),
    );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      body: FutureBuilder(
        future: _data,
        builder: (context, snap) {
          final d = snap.data;
          final p = d?.value;
          return ListView(
            padding: EdgeInsets.fromLTRB(S.page, top + 12, S.page, MediaQuery.of(context).padding.bottom + 32),
            children: [
              const Align(alignment: Alignment.centerLeft, child: BackBtn(label: 'Leads')),
              const SizedBox(height: 18),
              if (snap.hasError) Text('Could not load: ${snap.error}', style: const TextStyle(color: C.danger)),
              if (!snap.hasData && !snap.hasError)
                const Shimmer(child: Column(children: [Bone(height: 64, radius: S.radius), SizedBox(height: S.gap), Bone(height: 180, radius: S.radius), SizedBox(height: S.gap), Bone(height: 260, radius: S.radius)])),
              if (snap.hasData && p == null) Text('This pitch was not found.', style: T.body),
              if (p != null) ..._content(p, d!.sample),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _content(Pitch p, bool sample) {
    final hard = p.findings.where((f) => f.hard).length;
    final checks = checkEmail(_body.text);
    final allOk = checks.every((c) => c.ok);
    final editable = p.status == 'draft';
    final meta = [p.sector, p.city].whereType<String>().join(' · ');
    return [
      if (sample) ...[const Settle(child: SampleNote('A made-up business. Approving here saves nothing.')), const SizedBox(height: 16)],
      Settle(
        index: 1,
        child: Row(children: [
          Avatar(p.companyName, size: 56),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.companyName, style: T.title.copyWith(fontSize: 24)),
              if (meta.isNotEmpty) Text(meta, style: T.small),
              if (p.website != null) Text(p.website!, style: T.small.copyWith(color: C.primary)),
            ]),
          ),
        ]),
      ),
      const SizedBox(height: 18),
      Settle(
        index: 2,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('What the audit found', style: T.h2),
            const SizedBox(height: 4),
            Text(hard > 0 ? 'Passed the quality gate: $hard ${hard == 1 ? 'problem has' : 'problems have'} hard evidence.' : 'No problem has hard evidence yet.', style: T.small),
            for (final f in p.findings) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: f.hard ? const Color(0xFFFFF8EC) : C.bg, borderRadius: BorderRadius.circular(16)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text(f.problem, style: T.h3)),
                    f.hard
                        ? const Pill('Hard evidence', bg: C.okBg, fg: C.okFg, icon: Icons.check_circle_rounded)
                        : const Pill('Opinion', bg: Color(0xFFECEEF6), fg: C.muted, icon: Icons.help_outline_rounded),
                  ]),
                  const SizedBox(height: 6),
                  Text(f.evidence, style: T.body.copyWith(fontSize: 14)),
                  const SizedBox(height: 4),
                  Text('Source: ${f.source}', style: T.small.copyWith(fontSize: 12)),
                ]),
              ),
            ],
          ]),
        ),
      ),
      const SizedBox(height: S.gap),
      Settle(
        index: 3,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Fix preview', style: T.h2),
            const SizedBox(height: 4),
            Text('A new version of their home page, made from their own site\'s text. The email links to it.', style: T.small),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: _PreviewBox(label: 'Their site today', value: sample ? '9.1 s' : 'Today', after: false)),
              const SizedBox(width: S.gap),
              Expanded(child: _PreviewBox(label: 'Your new version', value: sample ? '1.8 s' : 'New', after: true)),
            ]),
            if (!sample && p.pageSlug != null) ...[
              const SizedBox(height: 14),
              SelectableText('$apiUrl/p/${p.pageSlug}/preview', style: T.small.copyWith(color: C.primary)),
              const SizedBox(height: 10),
              Btn('Copy link to open it', icon: Icons.link_rounded, kind: BtnKind.soft, big: false, expand: true, onTap: () {
                Clipboard.setData(ClipboardData(text: '$apiUrl/p/${p.pageSlug}/preview'));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied. Paste it in your browser.')));
              }),
            ],
          ]),
        ),
      ),
      const SizedBox(height: S.gap),
      Settle(
        index: 4,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(children: [
              Expanded(child: Text('Email draft', style: T.h2)),
              if (!editable) Pill(p.status, bg: p.status == 'replied' ? C.okBg : C.problemBg, fg: p.status == 'replied' ? C.okFg : C.problemFg),
            ]),
            const SizedBox(height: 4),
            Text(
              p.contact?.email == null
                  ? 'No contact email found yet.'
                  : 'To ${p.contact!.name != null ? '${p.contact!.name}${p.contact!.role != null ? ', ${p.contact!.role}' : ''} · ' : ''}${p.contact!.email}',
              style: T.small,
            ),
            if (editable) ...[
              const SizedBox(height: 14),
              Text('Tone', style: T.tiny),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final (key, label) in _tones)
                  _ToneChip(label, selected: _tonePicked == key, loading: _toneLoading == key, onTap: () => _retone(sample, p.id, key, label)),
                _ToneChip('Write my own', icon: Icons.edit_rounded, onTap: _writeOwn),
              ]),
            ],
            const SizedBox(height: 14),
            Text('Subject', style: T.tiny),
            const SizedBox(height: 6),
            TextField(controller: _subject, enabled: editable),
            const SizedBox(height: 12),
            Text('Message', style: T.tiny),
            const SizedBox(height: 6),
            TextField(
              controller: _body,
              focusNode: _bodyFocus,
              enabled: editable,
              minLines: 8,
              maxLines: null,
              style: T.body.copyWith(fontSize: 14.5, height: 1.5),
              decoration: const InputDecoration(hintText: 'Write it your way. The checks below keep it within the rules.'),
            ),
            AnimatedSize(
              duration: M.normal,
              curve: M.ease,
              alignment: Alignment.topCenter,
              child: AnimatedSwitcher(
                duration: M.normal,
                switchInCurve: M.ease,
                transitionBuilder: (w, a) => FadeTransition(opacity: a, child: SlideTransition(position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(a), child: w)),
                child: _suggestion == null || !editable
                    ? const SizedBox(width: double.infinity, key: ValueKey('none'))
                    : _Suggestion(key: ValueKey(_suggestion), s: _suggestion!, onUse: _useSuggestion, onDismiss: () => setState(() => _suggestion = null)),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                for (final c in checks)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      AnimatedSwitcher(
                        duration: M.normal,
                        transitionBuilder: (w, a) => ScaleTransition(scale: CurvedAnimation(parent: a, curve: Curves.easeOutBack), child: w),
                        child: Icon(c.ok ? Icons.check_circle_rounded : Icons.cancel_rounded, key: ValueKey(c.ok), size: 18, color: c.ok ? C.green : C.danger),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text.rich(TextSpan(children: [
                          TextSpan(text: c.label, style: TextStyle(color: c.ok ? C.fg : C.danger, fontWeight: FontWeight.w600)),
                          if (c.detail != null) TextSpan(text: '  ·  ${c.detail}', style: const TextStyle(color: C.muted)),
                        ]), style: const TextStyle(fontSize: 13.5)),
                      ),
                    ]),
                  ),
              ]),
            ),
            const SizedBox(height: 12),
            Text('Your personal line (optional)', style: T.tiny),
            const SizedBox(height: 6),
            TextField(controller: _personal, enabled: editable, decoration: const InputDecoration(hintText: 'Something only you know is true')),
            const SizedBox(height: 6),
            Text('Before you approve: would you say this to their face?', style: T.small.copyWith(fontSize: 12)),
            if (_note != null) ...[
              const SizedBox(height: 12),
              Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: C.okBg, borderRadius: BorderRadius.circular(14)), child: Text(_note!, style: const TextStyle(color: C.okFg, fontWeight: FontWeight.w600))),
            ],
            if (editable) ...[
              const SizedBox(height: 16),
              Btn(_busy ? 'Approving…' : 'Approve and send',
                  icon: Icons.send_rounded,
                  expand: true,
                  busy: _busy,
                  onTap: allOk && p.contact?.email != null ? () => _run(sample, () => Repo.approve(p.id, _subject.text, _body.text, _personal.text), approve: true) : null),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: Btn('Save edits', kind: BtnKind.soft, expand: true, onTap: () => _run(sample, () => Repo.saveDraft(p.id, _subject.text, _body.text, _personal.text), done: 'Saved.'))),
                const SizedBox(width: 10),
                Expanded(child: Btn('Skip', kind: BtnKind.plain, expand: true, onTap: () => _run(sample, () => Repo.skip(p.id), leave: true))),
              ]),
            ],
          ]),
        ),
      ),
    ];
  }
}

/// A soft rounded chip for picking the email's tone. Shows a small spinner
/// while the new version is being written.
class _ToneChip extends StatelessWidget {
  const _ToneChip(this.label, {required this.onTap, this.selected = false, this.loading = false, this.icon});
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final bool loading;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Pressable(
        onTap: onTap,
        radius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: M.fast,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: selected ? C.primarySoft : C.bg,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? C.primary : C.line),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            AnimatedSwitcher(
              duration: M.fast,
              child: loading
                  ? const SizedBox(key: ValueKey('spin'), width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: C.primary))
                  : icon != null
                      ? Icon(icon, key: const ValueKey('icon'), size: 15, color: C.muted)
                      : const SizedBox(key: ValueKey('empty'), width: 0),
            ),
            if (loading || icon != null) const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: selected ? C.primary : C.fg)),
          ]),
        ),
      );
}

/// A version of the email the student can copy in with one tap, or ignore.
class _Suggestion extends StatelessWidget {
  const _Suggestion({super.key, required this.s, required this.onUse, required this.onDismiss});
  final ({String subject, String body, String label}) s;
  final VoidCallback onUse;
  final VoidCallback onDismiss;
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: C.primarySoft, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.auto_awesome_rounded, size: 16, color: C.primary),
            const SizedBox(width: 6),
            Expanded(child: Text('Suggestion: ${s.label}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: C.primary))),
          ]),
          if (s.subject.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(s.subject, style: T.h3.copyWith(fontSize: 14)),
          ],
          const SizedBox(height: 6),
          Text(s.body, style: T.body.copyWith(fontSize: 14, height: 1.5)),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: Btn('Use this', kind: BtnKind.primary, big: false, expand: true, onTap: onUse)),
            const SizedBox(width: 10),
            Expanded(child: Btn('Dismiss', kind: BtnKind.plain, big: false, expand: true, onTap: onDismiss)),
          ]),
        ]),
      );
}

class _PreviewBox extends StatelessWidget {
  const _PreviewBox({required this.label, required this.value, required this.after});
  final String label;
  final String value;
  final bool after;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            height: 110,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              FractionallySizedBox(widthFactor: after ? 0.65 : 1, child: Container(height: 10, decoration: BoxDecoration(color: after ? const Color(0xFFB9C6F5) : C.line, borderRadius: BorderRadius.circular(4)))),
              const SizedBox(height: 6),
              Container(height: 6, decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(3))),
              const SizedBox(height: 4),
              FractionallySizedBox(widthFactor: 0.8, child: Container(height: 6, decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(3)))),
              const Spacer(),
              after
                  ? FractionallySizedBox(widthFactor: 0.55, child: Container(height: 18, decoration: BoxDecoration(color: const Color(0xFF8CD9A4), borderRadius: BorderRadius.circular(999))))
                  : Expanded(flex: 3, child: Container(decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(6)))),
            ]),
          ),
          const SizedBox(height: 10),
          Text(label, style: T.small.copyWith(fontSize: 12)),
          Text(value, style: T.h2.copyWith(color: after ? C.okFg : C.fg)),
        ]),
      );
}

/// The moment after Approve: a green circle pops in and the check draws.
class _ApprovedSheet extends StatefulWidget {
  const _ApprovedSheet({required this.sample});
  final bool sample;
  @override
  State<_ApprovedSheet> createState() => _ApprovedSheetState();
}

class _ApprovedSheetState extends State<_ApprovedSheet> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pop = CurvedAnimation(parent: _c, curve: const Interval(0.1, 0.6, curve: Curves.elasticOut));
    final draw = CurvedAnimation(parent: _c, curve: const Interval(0.35, 0.75, curve: Curves.easeOut));
    final text = CurvedAnimation(parent: _c, curve: const Interval(0.4, 1, curve: M.ease));
    return Container(
      padding: EdgeInsets.fromLTRB(24, 12, 24, MediaQuery.of(context).padding.bottom + 20),
      decoration: const BoxDecoration(color: C.card, borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) => Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 5, decoration: BoxDecoration(color: C.line, borderRadius: BorderRadius.circular(3))),
          const SizedBox(height: 26),
          Transform.scale(
            scale: pop.value,
            child: Container(
              width: 84,
              height: 84,
              decoration: const BoxDecoration(color: C.green, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0x662F9E44), blurRadius: 26, offset: Offset(0, 12), spreadRadius: -8)]),
              child: CustomPaint(painter: _CheckPainter(draw.value)),
            ),
          ),
          const SizedBox(height: 20),
          Opacity(
            opacity: text.value,
            child: Transform.translate(
              offset: Offset(0, 10 * (1 - text.value)),
              child: Column(children: [
                Text(widget.sample ? "That's how approving feels" : 'Approved', style: T.title.copyWith(fontSize: 22)),
                const SizedBox(height: 8),
                Text(
                  widget.sample ? 'This is sample data, so nothing was saved or sent.' : "It goes out with today's batch once Gmail is connected.",
                  textAlign: TextAlign.center,
                  style: T.body.copyWith(color: C.muted),
                ),
                const SizedBox(height: 24),
                Btn('Back to leads', expand: true, onTap: () => Navigator.of(context).pop()),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _CheckPainter extends CustomPainter {
  _CheckPainter(this.t);
  final double t;
  @override
  void paint(Canvas canvas, Size size) {
    if (t <= 0) return;
    final s = size.width / 32;
    final path = Path()
      ..moveTo(9 * s, 16.5 * s)
      ..lineTo(14 * s, 21.5 * s)
      ..lineTo(23.5 * s, 11 * s);
    final out = Path();
    var left = path.computeMetrics().fold<double>(0, (a, m) => a + m.length) * t;
    for (final m in path.computeMetrics()) {
      final take = left.clamp(0, m.length).toDouble();
      out.addPath(m.extractPath(0, take), Offset.zero);
      left -= take;
    }
    canvas.drawPath(out, Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 3.2 * s..strokeCap = StrokeCap.round..strokeJoin = StrokeJoin.round);
  }

  @override
  bool shouldRepaint(_CheckPainter old) => old.t != t;
}
