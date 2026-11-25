import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

/// Anything you can tap: it shrinks a little while your finger is down and
/// springs back when you let go, with a light tap of the phone's vibration.
/// Give it a [radius] (the shape's corner roundness) and a soft ripple also
/// spreads out from where your finger touched.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.onTap, this.scale = 0.96, this.haptic = true, this.radius, this.rippleColor = const Color(0x1F1B1D2A)});
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final bool haptic;
  final BorderRadius? radius;
  final Color rippleColor;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> with SingleTickerProviderStateMixin {
  bool _down = false;
  Offset _at = Offset.zero;
  late final _ripple = AnimationController(vsync: this, duration: const Duration(milliseconds: 520));

  @override
  void dispose() {
    _ripple.dispose();
    super.dispose();
  }

  void _set(bool v) {
    if (widget.onTap == null) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    Widget child = widget.child;
    if (widget.radius != null) {
      child = Stack(children: [
        child,
        Positioned.fill(
          child: IgnorePointer(
            child: ClipRRect(
              borderRadius: widget.radius!,
              child: AnimatedBuilder(
                animation: _ripple,
                builder: (_, _) => CustomPaint(painter: _RipplePainter(_at, _ripple.value, widget.rippleColor)),
              ),
            ),
          ),
        ),
      ]);
    }
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (d) {
        _set(true);
        if (widget.onTap != null && widget.radius != null) {
          _at = d.localPosition;
          _ripple.forward(from: 0);
        }
      },
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap == null
          ? null
          : () {
              if (widget.haptic) HapticFeedback.selectionClick();
              widget.onTap!();
            },
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: _down ? const Duration(milliseconds: 90) : const Duration(milliseconds: 260),
        curve: _down ? Curves.easeOut : Curves.easeOutBack,
        child: AnimatedOpacity(
          opacity: widget.onTap == null ? 0.5 : 1,
          duration: M.fast,
          child: child,
        ),
      ),
    );
  }
}

/// A circle that grows from the touch point and fades out.
class _RipplePainter extends CustomPainter {
  _RipplePainter(this.at, this.t, this.color);
  final Offset at;
  final double t;
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    if (t == 0 || t == 1) return;
    final far = [Offset.zero, Offset(size.width, 0), Offset(0, size.height), Offset(size.width, size.height)].map((c) => (c - at).distance).reduce((a, b) => a > b ? a : b);
    final grow = Curves.easeOutCubic.transform(t);
    final fade = t < 0.5 ? 1.0 : 1 - (t - 0.5) / 0.5;
    canvas.drawCircle(at, far * grow, Paint()..color = color.withValues(alpha: color.a * fade));
  }

  @override
  bool shouldRepaint(_RipplePainter old) => old.t != t || old.at != at;
}
