import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/repo.dart';
import '../main.dart';
import '../theme.dart';
import '../widgets/logo.dart';
import '../widgets/settle.dart';
import '../widgets/ui.dart';
import 'home.dart';
import 'onboarding.dart';

/// Where Supabase sends people back after Google or the email link.
/// On phones this opens the app (set up in AndroidManifest.xml and Info.plist).
String get _redirect => kIsWeb ? Uri.base.origin : 'app.pitchproof://login-callback';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});
  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  bool _google = false;
  bool _sending = false;
  bool _sent = false;
  String? _error;
  StreamSubscription<AuthState>? _sub;

  @override
  void initState() {
    super.initState();
    if (hasBackend) {
      // When sign-in finishes (back from Google or the email link), move on.
      _sub = Supabase.instance.client.auth.onAuthStateChange.listen((s) async {
        if (s.event == AuthChangeEvent.signedIn && mounted) {
          final student = await Repo.myStudent();
          if (!mounted) return;
          Navigator.of(context).pushAndRemoveUntil(fadeRoute(student == null ? const OnboardingScreen() : const HomeScreen()), (_) => false);
        }
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _email.dispose();
    super.dispose();
  }

  Future<void> _withGoogle() async {
    if (!hasBackend) return setState(() => _error = 'This build has no database connection.');
    setState(() {
      _google = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithOAuth(OAuthProvider.google, redirectTo: _redirect);
    } catch (e) {
      setState(() => _error = '$e');
    }
    if (mounted) setState(() => _google = false);
  }

  Future<void> _withEmail() async {
    final email = _email.text.trim();
    if (!email.contains('@')) return setState(() => _error = 'Enter your email address.');
    if (!hasBackend) return setState(() => _error = 'This build has no database connection.');
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithOtp(email: email, emailRedirectTo: _redirect);
      setState(() => _sent = true);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    }
    if (mounted) setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(S.page, 12, S.page, 24),
          children: [
            const Align(alignment: Alignment.centerLeft, child: BackBtn()),
            const SizedBox(height: 32),
            const Settle(child: LogoMark(size: 52)),
            const SizedBox(height: 20),
            Settle(index: 1, child: Text('Sign in', style: T.title)),
            const SizedBox(height: 6),
            Settle(index: 2, child: Text('Use the Google account or email you want replies to come to.', style: T.body.copyWith(color: C.muted))),
            const SizedBox(height: 28),
            Settle(
              index: 3,
              child: Btn(_google ? 'Opening Google…' : 'Continue with Google', icon: Icons.g_mobiledata_rounded, kind: BtnKind.soft, expand: true, busy: _google, onTap: _withGoogle),
            ),
            const SizedBox(height: 22),
            Settle(
              index: 4,
              child: Row(children: [
                const Expanded(child: Divider(color: C.line)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('or use your email', style: T.small)),
                const Expanded(child: Divider(color: C.line)),
              ]),
            ),
            const SizedBox(height: 22),
            AnimatedSwitcher(
              duration: M.normal,
              child: _sent
                  ? SoftCard(
                      key: const ValueKey('sent'),
                      child: Row(children: [
                        const Icon(Icons.mark_email_read_outlined, color: C.primary),
                        const SizedBox(width: 12),
                        Expanded(child: Text('Check ${_email.text.trim()} for a sign-in link. Open it on this phone.', style: T.body)),
                      ]),
                    )
                  : Settle(
                      index: 5,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          decoration: const InputDecoration(hintText: 'you@example.com'),
                          onSubmitted: (_) => _withEmail(),
                        ),
                        const SizedBox(height: S.gap),
                        Btn(_sending ? 'Sending…' : 'Email me a link', kind: BtnKind.primary, expand: true, busy: _sending, onTap: _withEmail),
                      ]),
                    ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Text(_error!, style: const TextStyle(color: C.danger, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      ),
    );
  }
}
