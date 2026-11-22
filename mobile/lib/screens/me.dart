import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';
import 'onboarding.dart';
import 'sign_in.dart';
import 'tour.dart';
import 'welcome.dart';

/// Me: your profile as companies see it, and the app settings.
class MeScreen extends StatefulWidget {
  const MeScreen({super.key});
  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  late Future<Loaded<(Student, List<Project>)>> _data = Repo.profile();

  void _reload() => setState(() => _data = Repo.profile());

  Future<void> _signOut() async {
    if (hasBackend) await Supabase.instance.client.auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(fadeRoute(const WelcomeScreen()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      body: FutureBuilder(
        future: _data,
        builder: (context, snap) => ListView(
          padding: EdgeInsets.fromLTRB(S.page, pad.top + 16, S.page, pad.bottom + 110),
          children: [
            const ScreenTitle('Me', subtitle: 'Companies see your name, one line about you and these projects.'),
            const SizedBox(height: 18),
            if (!snap.hasData) const ListSkeleton(rows: 2) else ..._content(snap.data!),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(Loaded<(Student, List<Project>)> d) {
    final (s, projects) = d.value;
    final signedIn = userId != null;
    final goal = switch (s.goal) { 'freelance' => 'Paid projects', 'internship' => 'An internship', 'job' => 'A job', _ => null };
    return [
      if (d.sample) ...[const Settle(child: SampleNote('This is an example profile. Sign in to make your own.')), const SizedBox(height: S.gap)],
      Settle(
        index: 1,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Avatar(s.name.isEmpty ? (userEmail ?? '?') : s.name, size: 60),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.name.isEmpty ? 'Your name' : s.name, style: T.h2.copyWith(fontSize: 20)),
                  Text([s.yearOrGrad, s.city].whereType<String>().where((x) => x.isNotEmpty).join(' · '), style: T.small),
                ]),
              ),
            ]),
            if ((s.bio ?? '').isNotEmpty) ...[const SizedBox(height: 14), Text(s.bio!, style: T.body)],
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (goal != null) Pill(goal),
              for (final k in s.skills) Pill(k == 'web' ? 'Web development' : 'Design', bg: C.bg, fg: C.fg),
            ]),
          ]),
        ),
      ),
      const SizedBox(height: S.gap),
      Settle(
        index: 2,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Things you have made', style: T.h2),
            if (projects.isEmpty) ...[const SizedBox(height: 8), Text('None yet.', style: T.small)],
            for (final p in projects)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(12)),
                    child: Icon(p.skillTag == 'design' ? Icons.palette_outlined : Icons.code_rounded, size: 19),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(p.title, style: T.h3), if (p.oneLine.isNotEmpty) Text(p.oneLine, style: T.small)])),
                ]),
              ),
          ]),
        ),
      ),
      const SizedBox(height: 18),
      Settle(
        index: 3,
        child: signedIn
            ? Btn('Edit profile', icon: Icons.edit_outlined, kind: BtnKind.soft, expand: true, onTap: () async {
                final saved = await Navigator.of(context).push(CupertinoPageRoute(builder: (_) => OnboardingScreen(student: s, projects: projects, editing: true)));
                if (saved == true) _reload();
              })
            : Btn('Sign in to make your own', expand: true, onTap: () => Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const SignInScreen()))),
      ),
      const SizedBox(height: 26),
      Text('SETTINGS', style: T.tiny),
      const SizedBox(height: 10),
      Settle(
        index: 4,
        child: Container(
          decoration: cardBox(),
          child: Column(children: [
            _Row(icon: Icons.mail_outline_rounded, label: 'Gmail', trailing: const Pill('Not connected', bg: Color(0xFFECEEF6), fg: C.muted)),
            const Divider(height: 1, indent: 56, color: C.line),
            _Row(icon: Icons.speed_rounded, label: 'Daily limit', trailing: Text('${s.dailyLimit} a day', style: T.small.copyWith(fontWeight: FontWeight.w700))),
            const Divider(height: 1, indent: 56, color: C.line),
            _Row(icon: Icons.play_circle_outline_rounded, label: 'Replay the tour', onTap: () => Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const TourScreen(replay: true)))),
            if (signedIn) ...[
              const Divider(height: 1, indent: 56, color: C.line),
              _Row(icon: Icons.logout_rounded, label: 'Sign out', danger: true, onTap: _signOut),
            ],
          ]),
        ),
      ),
      const SizedBox(height: 12),
      Text('At most 15 new pitches a day and 2 follow-ups per business. Follow-ups stop on any reply.', style: T.small.copyWith(fontSize: 12)),
    ];
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.label, this.trailing, this.onTap, this.danger = false});
  final IconData icon;
  final String label;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool danger;
  @override
  Widget build(BuildContext context) {
    final row = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      child: Row(children: [
        Icon(icon, size: 22, color: danger ? C.danger : C.fg),
        const SizedBox(width: 18),
        Expanded(child: Text(label, style: T.h3.copyWith(color: danger ? C.danger : C.fg))),
        trailing ?? const Icon(Icons.chevron_right_rounded, color: C.muted),
      ]),
    );
    return onTap == null ? row : Pressable(onTap: onTap, scale: 0.98, child: row);
  }
}
