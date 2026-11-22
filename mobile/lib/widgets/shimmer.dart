import 'package:flutter/material.dart';
import '../theme.dart';

/// Grey shapes with a soft light sweeping across, shown while data loads.
class Shimmer extends StatefulWidget {
  const Shimmer({super.key, required this.child});
  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) => ShaderMask(
        blendMode: BlendMode.srcATop,
        shaderCallback: (rect) => LinearGradient(
          colors: const [C.shimmerA, C.shimmerB, C.shimmerA],
          stops: const [0.1, 0.5, 0.9],
          begin: Alignment(-1.6 + 3.2 * _c.value, 0),
          end: Alignment(-0.6 + 3.2 * _c.value, 0),
        ).createShader(rect),
        child: child,
      ),
      child: widget.child,
    );
  }
}

/// One grey block for a shimmer placeholder.
class Bone extends StatelessWidget {
  const Bone({super.key, this.width, this.height = 14, this.radius = 8});
  final double? width;
  final double height;
  final double radius;
  @override
  Widget build(BuildContext context) =>
      Container(width: width, height: height, decoration: BoxDecoration(color: C.shimmerA, borderRadius: BorderRadius.circular(radius)));
}

/// Placeholder shaped like a list of lead cards.
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.rows = 4});
  final int rows;
  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(children: [
        Row(children: [
          for (var i = 0; i < 3; i++) ...[
            if (i > 0) const SizedBox(width: S.gap),
            const Expanded(child: Bone(height: 76, radius: S.radius)),
          ]
        ]),
        for (var i = 0; i < rows; i++) ...[
          const SizedBox(height: S.gap),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: cardBox(),
            child: const Row(children: [
              Bone(width: 44, height: 44, radius: 22),
              SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Bone(width: 180), SizedBox(height: 8), Bone(width: 110, height: 12)])),
            ]),
          ),
        ],
      ]),
    );
  }
}
