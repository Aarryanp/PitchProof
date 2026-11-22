import 'package:flutter/material.dart';
import '../theme.dart';

/// The Pitchproof mark: a check inside a rounded square ("proof").
/// [draw] goes from 0 to 1 to draw the check in, for the splash.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 32, this.box = C.primary, this.tick = Colors.white, this.draw = 1});
  final double size;
  final Color box;
  final Color tick;
  final double draw;
  @override
  Widget build(BuildContext context) => CustomPaint(size: Size.square(size), painter: _LogoPainter(box, tick, draw));
}

class _LogoPainter extends CustomPainter {
  _LogoPainter(this.box, this.tick, this.draw);
  final Color box;
  final Color tick;
  final double draw;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 32;
    canvas.drawRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(9 * s)), Paint()..color = box);
    if (draw <= 0) return;
    final path = Path()
      ..moveTo(9.5 * s, 16.5 * s)
      ..lineTo(14 * s, 21 * s)
      ..lineTo(22.5 * s, 11.5 * s);
    final metric = path.computeMetrics().toList();
    final total = metric.fold<double>(0, (a, m) => a + m.length);
    var left = total * draw.clamp(0, 1);
    final out = Path();
    for (final m in metric) {
      final take = left.clamp(0, m.length).toDouble();
      out.addPath(m.extractPath(0, take), Offset.zero);
      left -= take;
    }
    canvas.drawPath(
      out,
      Paint()
        ..color = tick
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3 * s
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_LogoPainter old) => old.draw != draw || old.box != box;
}
