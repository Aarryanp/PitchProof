import 'package:flutter/material.dart';
import '../theme.dart';
import 'pressable.dart';

/// Pill-shaped button. [kind] picks the colour: primary (blue), dark,
/// soft (white card) or plain (text only).
enum BtnKind { primary, dark, soft, plain }

class Btn extends StatelessWidget {
  const Btn(this.label, {super.key, this.onTap, this.icon, this.kind = BtnKind.primary, this.expand = false, this.big = true, this.busy = false});
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final BtnKind kind;
  final bool expand;
  final bool big;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, shadow) = switch (kind) {
      BtnKind.primary => (C.primary, Colors.white, [const BoxShadow(color: Color(0x553B5BDB), blurRadius: 18, offset: Offset(0, 8), spreadRadius: -8)]),
      BtnKind.dark => (C.ink, Colors.white, [const BoxShadow(color: Color(0x551B1D2A), blurRadius: 18, offset: Offset(0, 8), spreadRadius: -8)]),
      BtnKind.soft => (C.card, C.fg, cardShadow),
      BtnKind.plain => (Colors.transparent, C.muted, const <BoxShadow>[]),
    };
    final content = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (busy)
          SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: fg))
        else if (icon != null)
          Icon(icon, size: 19, color: fg),
        if (busy || icon != null) const SizedBox(width: 8),
        Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: big ? 16 : 14)),
      ],
    );
    return Pressable(
      radius: BorderRadius.circular(999),
      rippleColor: kind == BtnKind.primary || kind == BtnKind.dark ? const Color(0x33FFFFFF) : const Color(0x1F1B1D2A),
      onTap: busy ? null : onTap,
      child: AnimatedContainer(
        duration: M.fast,
        height: big ? 54 : 42,
        padding: EdgeInsets.symmetric(horizontal: big ? 24 : 18),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999), boxShadow: shadow),
        child: content,
      ),
    );
  }
}

/// A white rounded card.
class SoftCard extends StatelessWidget {
  const SoftCard({super.key, required this.child, this.padding = const EdgeInsets.all(18), this.color = C.card, this.onTap});
  final Widget child;
  final EdgeInsets padding;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final box = Container(width: double.infinity, padding: padding, decoration: cardBox(color: color), child: child);
    return onTap == null ? box : Pressable(onTap: onTap, scale: 0.98, radius: BorderRadius.circular(S.radius), rippleColor: color == C.card ? const Color(0x1F1B1D2A) : const Color(0x33FFFFFF), child: box);
  }
}

/// Small rounded label, like "Hard evidence" or a problem found.
class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.bg = C.primarySoft, this.fg = C.primary, this.icon});
  final String text;
  final Color bg;
  final Color fg;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 13, color: fg), const SizedBox(width: 4)],
          Flexible(child: Text(text, style: TextStyle(color: fg, fontSize: 12.5, fontWeight: FontWeight.w700, height: 1.25))),
        ]),
      );
}

/// Round coloured circle with the first letter of a business name.
/// The colour comes from the name, so a business always gets the same one.
class Avatar extends StatelessWidget {
  const Avatar(this.name, {super.key, this.size = 44});
  final String name;
  final double size;
  static const _palette = [
    (Color(0xFFFFE3E3), Color(0xFFC92A2A)),
    (Color(0xFFE3FAFC), Color(0xFF0B7285)),
    (Color(0xFFFFF3BF), Color(0xFF946800)),
    (Color(0xFFE7ECFF), Color(0xFF3B5BDB)),
    (Color(0xFFE6FCF5), Color(0xFF087F5B)),
    (Color(0xFFF3F0FF), Color(0xFF6741D9)),
  ];
  @override
  Widget build(BuildContext context) {
    var h = 0;
    for (final c in name.codeUnits) {
      h = (h * 31 + c) & 0x7fffffff;
    }
    final (bg, fg) = _palette[h % _palette.length];
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Text(name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase(),
          style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: size * 0.4)),
    );
  }
}

/// Yellow note shown above screens that show made-up sample data.
class SampleNote extends StatelessWidget {
  const SampleNote(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(color: C.problemBg, borderRadius: BorderRadius.circular(18)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.science_outlined, size: 18, color: C.problemFg),
          const SizedBox(width: 10),
          Expanded(
            child: Text.rich(TextSpan(children: [
              const TextSpan(text: 'Sample data. ', style: TextStyle(fontWeight: FontWeight.w800)),
              TextSpan(text: text),
            ]), style: const TextStyle(color: Color(0xFF6B3D00), fontSize: 13.5, height: 1.35, fontWeight: FontWeight.w500)),
          ),
        ]),
      );
}

/// Round back button used at the top of pushed screens.
class BackBtn extends StatelessWidget {
  const BackBtn({super.key, this.label});
  final String? label;
  @override
  Widget build(BuildContext context) => Pressable(
        radius: BorderRadius.circular(999),
        onTap: () => Navigator.of(context).maybePop(),
        child: Container(
          height: 40,
          padding: EdgeInsets.only(left: 10, right: label == null ? 10 : 16),
          decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(999), boxShadow: cardShadow),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.arrow_back_rounded, size: 20),
            if (label != null) ...[const SizedBox(width: 6), Text(label!, style: const TextStyle(fontWeight: FontWeight.w700))],
          ]),
        ),
      );
}

/// Heading at the top of a tab: big title and a grey line under it.
class ScreenTitle extends StatelessWidget {
  const ScreenTitle(this.title, {super.key, this.subtitle, this.trailing});
  final String title;
  final String? subtitle;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: T.title),
            if (subtitle != null) ...[const SizedBox(height: 4), Text(subtitle!, style: T.small)],
          ]),
        ),
        ?trailing,
      ]);
}

/// Icon for each service a student can offer.
IconData skillIcon(String key) => switch (key) {
      'design' => Icons.palette_outlined,
      'seo' => Icons.trending_up_rounded,
      'chatbot' => Icons.smart_toy_outlined,
      'content' => Icons.edit_note_rounded,
      'social' => Icons.campaign_outlined,
      'video' => Icons.movie_outlined,
      'app' => Icons.phone_iphone_rounded,
      _ => Icons.code_rounded,
    };

/// Your photo in a circle. Falls back to the coloured letter if there is no
/// photo or it fails to load.
class ProfilePhoto extends StatelessWidget {
  const ProfilePhoto({super.key, required this.url, required this.name, this.size = 44});
  final String? url;
  final String name;
  final double size;
  @override
  Widget build(BuildContext context) {
    final letter = Avatar(name, size: size);
    if (url == null || url!.isEmpty) return letter;
    return ClipOval(
      child: Image.network(url!, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, _, _) => letter, loadingBuilder: (_, child, p) => p == null ? child : letter),
    );
  }
}
