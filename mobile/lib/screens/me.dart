import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models.dart';
import '../data/repo.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/pressable.dart';
import '../widgets/refresh_list.dart';
import '../widgets/settle.dart';
import '../widgets/shimmer.dart';
import '../widgets/ui.dart';
import 'onboarding.dart';
import 'settings.dart';
import 'sign_in.dart';
import 'tour.dart';
import 'welcome.dart';

/// Me: a profile page like the ones on job sites. A cover banner, your
/// avatar over it, your details below, then your projects and settings.
class MeScreen extends StatefulWidget {
  const MeScreen({super.key});
  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  late Future<Loaded<(Student, List<Project>)>> _data = Repo.profile();
  final _cached = Repo.cachedProfile();

  void _reload() => setState(() {
        _data = Repo.profile();
      });

  String? _photo;
  bool _uploading = false;

  /// Choose, take or remove your profile photo.
  Future<void> _photoSheet(Student s) async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: C.card,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 8), child: Text('Profile photo', style: T.h2)),
            _SheetRow(icon: Icons.photo_library_outlined, label: 'Choose from photos', onTap: () => Navigator.pop(context, 'gallery')),
            _SheetRow(icon: Icons.photo_camera_outlined, label: 'Take a photo', onTap: () => Navigator.pop(context, 'camera')),
            if ((_photo ?? s.photoUrl) != null) _SheetRow(icon: Icons.delete_outline_rounded, label: 'Remove photo', danger: true, onTap: () => Navigator.pop(context, 'remove')),
          ]),
        ),
      ),
    );
    if (choice == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      if (choice == 'remove') {
        await Repo.removePhoto();
        _photo = null;
        s.photoUrl = null;
      } else {
        final f = await ImagePicker().pickImage(source: choice == 'camera' ? ImageSource.camera : ImageSource.gallery, maxWidth: 800, maxHeight: 800, imageQuality: 85);
        if (f != null) {
          final ext = f.name.split('.').last.toLowerCase();
          _photo = await Repo.uploadPhoto(await f.readAsBytes(), const {'png', 'webp', 'heic'}.contains(ext) ? ext : 'jpg');
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not change the photo: ${'$e'.replaceFirst('Exception: ', '')}')));
    }
    if (mounted) setState(() => _uploading = false);
  }

  /// Asks twice-over, then deletes the account and everything in it.
  Future<void> _deleteAccount() async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: C.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(S.radius)),
        title: Text('Delete your account?', style: T.h2),
        content: Text('This removes your profile, projects, searches, leads, drafts, emails and photo for good. It cannot be undone.', style: T.body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: C.fg, fontWeight: FontWeight.w700))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: C.danger, fontWeight: FontWeight.w800))),
        ],
      ),
    );
    if (yes != true || !mounted) return;
    try {
      await Repo.deleteAccount();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(fadeRoute(const WelcomeScreen()), (_) => false);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not delete the account: ${'$e'.replaceFirst('Exception: ', '')}')));
    }
  }

  Future<void> _signOut() async {
    await Cache.clear();
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
        initialData: _cached,
        builder: (context, snap) => RefreshList(
          top: snap.hasData ? -1 : 16,
          padding: EdgeInsets.zero,
          onRefresh: () async {
            _reload();
            await _data;
          },
          children: [
            if (!snap.hasData)
              const Padding(padding: EdgeInsets.symmetric(horizontal: S.page), child: ListSkeleton(rows: 2))
            else ...[
              _header(snap.data!.value.$1, pad.top),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: S.page),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: _content(snap.data!)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Cover banner across the top, the avatar sitting over its bottom edge,
  /// then name, year and city, one line about you and your skills.
  Widget _header(Student s, double top) {
    final goal = switch (s.goal) { 'freelance' => 'Paid projects', 'internship' => 'An internship', 'job' => 'A job', _ => null };
    const cover = 150.0, avatar = 96.0;
    final meta = [s.yearOrGrad, s.city].whereType<String>().where((x) => x.isNotEmpty).join(' · ');
    return Settle(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Stack(clipBehavior: Clip.none, children: [
          Container(
            height: cover + top,
            decoration: const BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF3B5BDB), Color(0xFF7048E8)]),
            ),
            child: Stack(children: [
              Positioned(right: -40, top: -30, child: Container(width: 180, height: 180, decoration: const BoxDecoration(color: Color(0x14FFFFFF), shape: BoxShape.circle))),
              Positioned(right: 70, bottom: -50, child: Container(width: 120, height: 120, decoration: const BoxDecoration(color: Color(0x10FFFFFF), shape: BoxShape.circle))),
            ]),
          ),
          Positioned(
            left: S.page,
            bottom: -avatar / 2,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: C.bg, shape: BoxShape.circle, boxShadow: cardShadow),
              child: Pressable(
                radius: BorderRadius.circular(999),
                onTap: userId == null ? null : () => _photoSheet(s),
                child: Stack(clipBehavior: Clip.none, children: [
                  ProfilePhoto(url: _photo ?? s.photoUrl ?? googlePhoto, name: s.name.isEmpty ? (userEmail ?? '?') : s.name, size: avatar),
                  if (userId != null)
                    Positioned(
                      right: 0,
                      bottom: 2,
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(color: C.ink, shape: BoxShape.circle, border: Border.all(color: C.bg, width: 3)),
                        child: _uploading
                            ? const Padding(padding: EdgeInsets.all(6), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.photo_camera_rounded, size: 14, color: Colors.white),
                      ),
                    ),
                ]),
              ),
            ),
          ),
        ]),
        const SizedBox(height: avatar / 2 + 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: S.page),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.name.isEmpty ? 'Your name' : s.name, style: T.title.copyWith(fontSize: 26)),
            if (meta.isNotEmpty) ...[const SizedBox(height: 2), Text(meta, style: T.small.copyWith(fontSize: 14))],
            if ((s.bio ?? '').isNotEmpty) ...[const SizedBox(height: 12), Text(s.bio!, style: T.body)],
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (goal != null) Pill(goal),
              for (final k in s.skills) Pill(skillName(k), bg: C.card, fg: C.fg),
            ]),
          ]),
        ),
      ]),
    );
  }

  List<Widget> _content(Loaded<(Student, List<Project>)> d) {
    final (s, projects) = d.value;
    final signedIn = userId != null;
    return [
      const SizedBox(height: 22),
      Text('THINGS YOU HAVE MADE', style: T.tiny),
      const SizedBox(height: 10),
      Settle(
        index: 2,
        child: SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (projects.isEmpty) Text('None yet.', style: T.small),
            for (final (i, p) in projects.indexed)
              Padding(
                padding: EdgeInsets.only(top: i == 0 ? 0 : 14),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(12)),
                    child: Icon(skillIcon(p.skillTag), size: 19),
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
            _Row(icon: Icons.notifications_none_rounded, label: 'Notifications', onTap: () => Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const NotificationSettingsScreen()))),
            const Divider(height: 1, indent: 56, color: C.line),
            _Row(icon: Icons.play_circle_outline_rounded, label: 'Replay the tour', onTap: () => Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const TourScreen(replay: true)))),
            const Divider(height: 1, indent: 56, color: C.line),
            _Row(icon: Icons.shield_outlined, label: 'Privacy policy', onTap: () => Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const PrivacyPolicyScreen()))),
            if (signedIn) ...[
              const Divider(height: 1, indent: 56, color: C.line),
              _Row(icon: Icons.logout_rounded, label: 'Sign out', onTap: _signOut),
            ],
          ]),
        ),
      ),
      const SizedBox(height: 12),
      Text('At most 15 new pitches a day and 2 follow-ups per business. Follow-ups stop on any reply.', style: T.small.copyWith(fontSize: 12)),
      if (signedIn) ...[
        const SizedBox(height: 22),
        Settle(
          index: 5,
          child: Container(
            decoration: cardBox(),
            child: _Row(icon: Icons.delete_forever_outlined, label: 'Delete account', danger: true, onTap: _deleteAccount),
          ),
        ),
      ],
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
    return onTap == null ? row : Pressable(onTap: onTap, scale: 0.98, radius: BorderRadius.zero, child: row);
  }
}

class _SheetRow extends StatelessWidget {
  const _SheetRow({required this.icon, required this.label, required this.onTap, this.danger = false});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  @override
  Widget build(BuildContext context) => Pressable(
        scale: 0.98,
        radius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 15),
          child: Row(children: [
            Icon(icon, size: 22, color: danger ? C.danger : C.fg),
            const SizedBox(width: 16),
            Text(label, style: T.h3.copyWith(color: danger ? C.danger : C.fg)),
          ]),
        ),
      );
}
