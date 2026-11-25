import 'package:flutter/material.dart';
import '../data/repo.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/logo.dart';
import 'home.dart';
import 'onboarding.dart';
import 'welcome.dart';

/// Launch screen: the white logo springs in on blue, the check draws itself,
/// the name rises, then the app fades to the right first screen.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1250))..forward();

  @override
  void initState() {
    super.initState();
    _go();
  }

  Future<void> _go() async {
    // Work out where to go while the animation plays.
    Widget next = const WelcomeScreen();
    if (userId != null) {
      try {
        next = (await Repo.myStudent()) == null ? const OnboardingScreen() : const HomeScreen();
      } catch (_) {
        next = const HomeScreen();
      }
    }
    await Future.delayed(const Duration(milliseconds: 1400));
    if (mounted) Navigator.of(context).pushReplacement(fadeRoute(next));
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pop = CurvedAnimation(parent: _c, curve: const Interval(0, 0.5, curve: Curves.elasticOut));
    final draw = CurvedAnimation(parent: _c, curve: const Interval(0.35, 0.7, curve: Curves.easeOut));
    final name = CurvedAnimation(parent: _c, curve: const Interval(0.45, 0.85, curve: M.ease));
    return Scaffold(
      backgroundColor: C.primary,
      body: Center(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) => Column(mainAxisSize: MainAxisSize.min, children: [
            Transform.scale(
              scale: 0.6 + 0.4 * pop.value,
              child: Opacity(
                opacity: (_c.value * 4).clamp(0, 1),
                child: DecoratedBox(
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(24), boxShadow: const [
                    BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, 14), spreadRadius: -6),
                  ]),
                  child: LogoMark(size: 84, box: Colors.white, tick: C.primary, draw: draw.value),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Opacity(
              opacity: name.value,
              child: Transform.translate(
                offset: Offset(0, 10 * (1 - name.value)),
                child: const Text('Pitchproof', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
