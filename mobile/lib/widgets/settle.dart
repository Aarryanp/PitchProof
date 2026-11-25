import 'package:flutter/material.dart';
import '../theme.dart';

/// Makes a card fade in and rise a little when it first appears.
/// Give each card in a list its position as [index] so they arrive one by one.
class Settle extends StatefulWidget {
  const Settle({super.key, required this.child, this.index = 0, this.offset = 14});
  final Widget child;
  final int index;
  final double offset;

  @override
  State<Settle> createState() => _SettleState();
}

class _SettleState extends State<Settle> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
  late final Animation<double> _t = CurvedAnimation(parent: _c, curve: M.ease);

  @override
  void initState() {
    super.initState();
    final delay = Duration(milliseconds: 40 * widget.index.clamp(0, 10));
    Future.delayed(delay, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).disableAnimations) return widget.child;
    return AnimatedBuilder(
      animation: _t,
      builder: (context, child) => Opacity(
        opacity: _t.value,
        child: Transform.translate(offset: Offset(0, (1 - _t.value) * widget.offset), child: child),
      ),
      child: widget.child,
    );
  }
}
