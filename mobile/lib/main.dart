import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'data/repo.dart';
import 'screens/splash.dart';
import 'theme.dart';

// The Supabase address and public key come from the build command
// (--dart-define-from-file=env.json), never from the code.
const _url = String.fromEnvironment('SUPABASE_URL');
const _key = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (_url.isNotEmpty && _key.isNotEmpty) {
    await Supabase.initialize(url: _url, publishableKey: _key);
    hasBackend = true;
    await Cache.init();
  }
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: C.bg,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));
  runApp(const PitchproofApp());
}

class PitchproofApp extends StatelessWidget {
  const PitchproofApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pitchproof',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const SplashScreen(),
    );
  }
}

/// Fades one whole screen into the next (used after splash and sign-in).
Route<R> fadeRoute<R>(Widget page) => PageRouteBuilder<R>(
      transitionDuration: const Duration(milliseconds: 420),
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, a, _, child) => FadeTransition(
        opacity: CurvedAnimation(parent: a, curve: Curves.easeOut),
        child: ScaleTransition(scale: Tween(begin: 1.03, end: 1.0).animate(CurvedAnimation(parent: a, curve: M.ease)), child: child),
      ),
    );
