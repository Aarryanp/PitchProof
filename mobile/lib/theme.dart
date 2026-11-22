import 'package:flutter/material.dart';

/// Colours and text styles for the whole app: the "Soft cards" look.
/// A soft blue-grey background, white rounded cards, one blue accent.
class C {
  static const bg = Color(0xFFF4F5FB);
  static const fg = Color(0xFF1B1D2A);
  static const muted = Color(0xFF6D7186);
  static const line = Color(0xFFE3E6F0);
  static const card = Colors.white;
  static const primary = Color(0xFF3B5BDB);
  static const primarySoft = Color(0xFFE7ECFF);
  static const ink = Color(0xFF1B1D2A); // dark buttons and chips
  static const problemBg = Color(0xFFFFF1DC);
  static const problemFg = Color(0xFFA35A00);
  static const okBg = Color(0xFFE3F7EC);
  static const okFg = Color(0xFF1D7A4A);
  static const green = Color(0xFF2F9E44);
  static const amber = Color(0xFFF08C00);
  static const grey = Color(0xFFADB5BD);
  static const danger = Color(0xFFE03131);
  static const shimmerA = Color(0xFFE9EBF4);
  static const shimmerB = Color(0xFFF7F8FC);
}

/// Spacing used everywhere, so screens line up the same way.
class S {
  static const page = 20.0; // left and right edge of every screen
  static const gap = 12.0; // between cards
  static const radius = 22.0; // card corners
}

/// The soft shadow that makes white cards float.
const cardShadow = [
  BoxShadow(color: Color(0x0A28326E), blurRadius: 2, offset: Offset(0, 1)),
  BoxShadow(color: Color(0x2428326E), blurRadius: 24, offset: Offset(0, 8), spreadRadius: -12),
];

BoxDecoration cardBox({Color color = C.card, double radius = S.radius}) =>
    BoxDecoration(color: color, borderRadius: BorderRadius.circular(radius), boxShadow: cardShadow);

/// Standard motion: quick, with a soft landing.
class M {
  static const fast = Duration(milliseconds: 160);
  static const normal = Duration(milliseconds: 320);
  static const slow = Duration(milliseconds: 480);
  static const ease = Curves.easeOutCubic;
}

/// Plus Jakarta Sans, bundled in assets/fonts (Open Font License).
const font = 'Jakarta';

ThemeData buildTheme() {
  final base = ThemeData(useMaterial3: true, colorScheme: ColorScheme.fromSeed(seedColor: C.primary, primary: C.primary, surface: C.bg));
  final text = base.textTheme.apply(fontFamily: font, bodyColor: C.fg, displayColor: C.fg);
  return base.copyWith(
    // fontFamily on copyWith isn't available, so the text theme carries it.
    scaffoldBackgroundColor: C.bg,
    textTheme: text,
    splashFactory: NoSplash.splashFactory, // we use our own press feel
    highlightColor: Colors.transparent,
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: CupertinoPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: C.card,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: const TextStyle(color: C.muted),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: C.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: C.line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: C.primary, width: 1.6)),
    ),
    textSelectionTheme: const TextSelectionThemeData(cursorColor: C.primary),
  );
}

/// Text styles used by the screens.
class T {
  static TextStyle get title => TextStyle(fontFamily: font, fontSize: 28, fontWeight: FontWeight.w800, color: C.fg, height: 1.15, letterSpacing: -0.5);
  static TextStyle get h2 => TextStyle(fontFamily: font, fontSize: 18, fontWeight: FontWeight.w800, color: C.fg, letterSpacing: -0.2);
  static TextStyle get h3 => TextStyle(fontFamily: font, fontSize: 15, fontWeight: FontWeight.w700, color: C.fg);
  static TextStyle get body => TextStyle(fontFamily: font, fontSize: 15, fontWeight: FontWeight.w500, color: C.fg, height: 1.4);
  static TextStyle get small => TextStyle(fontFamily: font, fontSize: 13, fontWeight: FontWeight.w500, color: C.muted, height: 1.35);
  static TextStyle get tiny => TextStyle(fontFamily: font, fontSize: 11.5, fontWeight: FontWeight.w700, color: C.muted, letterSpacing: 0.3);
  static TextStyle get big => TextStyle(fontFamily: font, fontSize: 28, fontWeight: FontWeight.w800, color: C.fg, height: 1);
}
