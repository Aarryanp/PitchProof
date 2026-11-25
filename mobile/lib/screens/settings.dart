import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import '../widgets/settle.dart';
import '../widgets/ui.dart';

/// Small page shell for the settings screens: back button, title, body.
class _Page extends StatelessWidget {
  const _Page({required this.title, this.subtitle, required this.children});
  final String title;
  final String? subtitle;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      body: ListView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(S.page, pad.top + 12, S.page, pad.bottom + 30),
        children: [
          const Align(alignment: Alignment.centerLeft, child: BackBtn(label: 'Me')),
          const SizedBox(height: 18),
          ScreenTitle(title, subtitle: subtitle),
          const SizedBox(height: 18),
          ...children,
        ],
      ),
    );
  }
}

/// Which alerts you want. Saved on this phone. The alerts themselves are
/// sent once the daily job (n8n) is connected.
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});
  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  static const _items = [
    ('approve', Icons.mark_email_unread_outlined, 'Emails ready to approve', 'When the agent has drafted new pitches for you'),
    ('reply', Icons.chat_bubble_outline_rounded, 'Replies', 'When a business writes back'),
    ('opened', Icons.visibility_outlined, 'Page opened', 'When a business opens the page made for them'),
    ('daily', Icons.wb_sunny_outlined, 'Daily summary', 'One message each morning with what happened'),
  ];
  SharedPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((p) {
      if (mounted) setState(() => _prefs = p);
    }).catchError((_) {});
  }

  bool _on(String k) => _prefs?.getBool('notify.$k') ?? true;

  @override
  Widget build(BuildContext context) => _Page(
        title: 'Notifications',
        subtitle: 'Choose what you want to hear about.',
        children: [
          Settle(
            child: Container(
              decoration: cardBox(),
              child: Column(children: [
                for (final (i, (k, icon, label, hint)) in _items.indexed) ...[
                  if (i > 0) const Divider(height: 1, indent: 56, color: C.line),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 10, 12),
                    child: Row(children: [
                      Icon(icon, size: 22),
                      const SizedBox(width: 18),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: T.h3), Text(hint, style: T.small)])),
                      Switch.adaptive(
                        value: _on(k),
                        activeTrackColor: C.primary,
                        onChanged: (v) {
                          _prefs?.setBool('notify.$k', v);
                          setState(() {});
                        },
                      ),
                    ]),
                  ),
                ],
              ]),
            ),
          ),
          const SizedBox(height: 12),
          Text('Saved on this phone. Alerts start once the daily follow-up job is connected.', style: T.small.copyWith(fontSize: 12)),
        ],
      );
}

/// Plain-words privacy policy: what we keep, why, and how to delete it.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});
  static const _sections = [
    ('What we keep about you', 'Your name, email, city, year, the services you offer, one line about you, your projects, and your profile photo.'),
    ('What we keep about businesses', 'Public information only: the business name, website, city, the results of our website checks, and a public contact email or phone from their own site or listings.'),
    ('How we use it', 'To find businesses that need your skills, check their websites, build a page for each one and draft short emails for you to edit. Nothing is sent until you press Approve, at most 15 new emails a day, and follow-ups stop on any reply.'),
    ('Who we share it with', 'Businesses you email see your name, photo, one line about you and your projects on the page made for them. We use Supabase to store data, Google Gemini to write drafts, Google PageSpeed to test sites, and Crustdata and Olostep to find businesses and read their websites. We never sell your data.'),
    ('Business pages', 'Each page is private (only the link opens it), hidden from search engines, and deleted if the business says no.'),
    ('Deleting your data', 'Me → Delete account removes your profile, projects, searches, leads, drafts, emails and photo for good. Businesses you found become free for other students.'),
    ('Contact', 'Questions about your data? Write to the Pitchproof team. A contact email is added here before the app is published.'),
  ];

  @override
  Widget build(BuildContext context) => _Page(
        title: 'Privacy policy',
        subtitle: 'Last updated 22 November 2026.',
        children: [
          for (final (i, (h, body)) in _sections.indexed)
            Settle(
              index: i,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(h, style: T.h3),
                  const SizedBox(height: 4),
                  Text(body, style: T.body.copyWith(color: C.muted, height: 1.45)),
                ]),
              ),
            ),
        ],
      );
}
