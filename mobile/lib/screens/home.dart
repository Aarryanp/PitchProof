import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import 'leads.dart';
import 'me.dart';
import 'results.dart';
import 'search.dart';

/// The main app after sign-in: four tabs and a floating tab bar at the
/// bottom. A soft blue pill slides to the tab you pick.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  /// Lets any screen inside switch tabs, e.g. "New search" on Leads.
  static HomeScreenState of(BuildContext context) => context.findAncestorStateOfType<HomeScreenState>()!;

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  int tab = 0;
  final _leadsKey = GlobalKey<LeadsScreenState>();
  late final _pages = [LeadsScreen(key: _leadsKey), const SearchScreen(), const ResultsScreen(), const MeScreen()];

  static const _tabs = [
    (Icons.view_agenda_outlined, Icons.view_agenda_rounded, 'Leads'),
    (Icons.search_rounded, Icons.search_rounded, 'Search'),
    (Icons.bar_chart_rounded, Icons.bar_chart_rounded, 'Results'),
    (Icons.person_outline_rounded, Icons.person_rounded, 'Me'),
  ];

  void go(int i) {
    if (i == tab) return;
    HapticFeedback.selectionClick();
    setState(() => tab = i);
    if (i == 0) _leadsKey.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      extendBody: true,
      body: Stack(children: [
        // All four tabs stay alive; the open one fades and rises in.
        for (var i = 0; i < _pages.length; i++)
          IgnorePointer(
            ignoring: i != tab,
            child: AnimatedOpacity(
              opacity: i == tab ? 1 : 0,
              duration: i == tab ? const Duration(milliseconds: 260) : const Duration(milliseconds: 120),
              curve: Curves.easeOut,
              child: AnimatedSlide(
                offset: i == tab ? Offset.zero : const Offset(0, 0.015),
                duration: const Duration(milliseconds: 320),
                curve: M.ease,
                child: TickerMode(enabled: i == tab, child: _pages[i]),
              ),
            ),
          ),
        Positioned(
          left: 14,
          right: 14,
          bottom: bottom + 10,
          child: _TabBar(index: tab, onTap: go, tabs: _tabs),
        ),
      ]),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.index, required this.onTap, required this.tabs});
  final int index;
  final ValueChanged<int> onTap;
  final List<(IconData, IconData, String)> tabs;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 66,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [BoxShadow(color: Color(0x3328326E), blurRadius: 30, offset: Offset(0, 10), spreadRadius: -12)],
      ),
      child: Stack(children: [
        AnimatedAlign(
          alignment: Alignment(-1 + 2 * index / (tabs.length - 1), 0),
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeOutBack,
          child: FractionallySizedBox(
            widthFactor: 1 / tabs.length,
            heightFactor: 1,
            child: Container(decoration: BoxDecoration(color: C.primarySoft, borderRadius: BorderRadius.circular(20))),
          ),
        ),
        Row(children: [
          for (var i = 0; i < tabs.length; i++)
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onTap(i),
                child: _TabItem(icon: i == index ? tabs[i].$2 : tabs[i].$1, label: tabs[i].$3, active: i == index),
              ),
            ),
        ]),
      ]),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({required this.icon, required this.label, required this.active});
  final IconData icon;
  final String label;
  final bool active;
  @override
  Widget build(BuildContext context) {
    final color = active ? C.primary : C.muted;
    return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      AnimatedScale(scale: active ? 1.08 : 1, duration: M.normal, curve: Curves.easeOutBack, child: Icon(icon, color: color, size: 23)),
      const SizedBox(height: 2),
      AnimatedDefaultTextStyle(
        duration: M.fast,
        style: TextStyle(color: color, fontSize: 11.5, fontWeight: active ? FontWeight.w800 : FontWeight.w600, fontFamily: font),
        child: Text(label),
      ),
    ]);
  }
}
