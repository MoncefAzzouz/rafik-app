import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// A vector logo reveal. No photograph, image background, or asset decoding.
class AnimatedBrand extends StatefulWidget {
  const AnimatedBrand({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<AnimatedBrand> createState() => _AnimatedBrandState();
}

class _AnimatedBrandState extends State<AnimatedBrand>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 3000),
      )..addStatusListener((status) {
        if (status == AnimationStatus.completed) widget.onComplete();
      });
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.duration = const Duration(milliseconds: 150);
    }
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      label: 'Rafik',
      image: true,
      child: ExcludeSemantics(
        child: RepaintBoundary(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) => CustomPaint(
              painter: _BrandPainter(
                progress: reduceMotion ? 1 : _controller.value,
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandPainter extends CustomPainter {
  const _BrandPainter({required this.progress});

  final double progress;

  double phase(double start, double end) =>
      ((progress - start) / (end - start)).clamp(0.0, 1.0);

  static final _rTop = Path()
    ..moveTo(7, 0)
    ..lineTo(151, 0)
    ..cubicTo(199, 0, 235, 38, 235, 86)
    ..cubicTo(235, 134, 199, 173, 151, 173)
    ..lineTo(103, 117)
    ..lineTo(145, 117)
    ..cubicTo(163, 117, 177, 104, 177, 87)
    ..cubicTo(177, 70, 163, 57, 145, 57)
    ..lineTo(61, 57)
    ..cubicTo(29, 57, 10, 37, 1, 9)
    ..quadraticBezierTo(-2, 0, 7, 0)
    ..close();
  static final _rLeg = Path()
    ..moveTo(35, 116)
    ..lineTo(96, 116)
    ..quadraticBezierTo(104, 116, 111, 124)
    ..lineTo(220, 246)
    ..quadraticBezierTo(226, 256, 214, 256)
    ..lineTo(167, 256)
    ..quadraticBezierTo(158, 256, 151, 248)
    ..lineTo(30, 129)
    ..quadraticBezierTo(22, 116, 35, 116)
    ..close();
  static final _a = Path()
    ..fillType = PathFillType.evenOdd
    ..moveTo(324, 94)
    ..cubicTo(371, 94, 406, 129, 406, 177)
    ..lineTo(406, 243)
    ..quadraticBezierTo(406, 257, 392, 257)
    ..lineTo(374, 257)
    ..quadraticBezierTo(363, 257, 363, 245)
    ..lineTo(363, 241)
    ..cubicTo(350, 253, 335, 260, 316, 260)
    ..cubicTo(272, 260, 242, 224, 242, 178)
    ..cubicTo(242, 130, 277, 94, 324, 94)
    ..close()
    ..addOval(const Rect.fromLTWH(285, 136, 78, 82));
  static final _f = Path()
    ..moveTo(426, 96)
    ..lineTo(442, 96)
    ..lineTo(442, 82)
    ..cubicTo(442, 39, 469, 20, 508, 20)
    ..lineTo(514, 20)
    ..quadraticBezierTo(526, 20, 526, 33)
    ..lineTo(526, 49)
    ..quadraticBezierTo(526, 62, 513, 62)
    ..lineTo(505, 62)
    ..quadraticBezierTo(484, 62, 484, 84)
    ..lineTo(484, 96)
    ..lineTo(513, 96)
    ..quadraticBezierTo(526, 96, 526, 109)
    ..lineTo(526, 124)
    ..quadraticBezierTo(526, 137, 513, 137)
    ..lineTo(484, 137)
    ..lineTo(484, 243)
    ..quadraticBezierTo(484, 256, 471, 256)
    ..lineTo(455, 256)
    ..quadraticBezierTo(442, 256, 442, 243)
    ..lineTo(442, 137)
    ..lineTo(426, 137)
    ..quadraticBezierTo(413, 137, 413, 124)
    ..lineTo(413, 109)
    ..quadraticBezierTo(413, 96, 426, 96)
    ..close();
  static final _i = Path()
    ..addRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(550, 96, 43, 160),
        const Radius.circular(14),
      ),
    );
  static final _k = Path()
    ..moveTo(637, 28)
    ..lineTo(649, 28)
    ..quadraticBezierTo(663, 28, 663, 42)
    ..lineTo(663, 162)
    ..lineTo(713, 105)
    ..quadraticBezierTo(720, 96, 733, 96)
    ..lineTo(758, 96)
    ..quadraticBezierTo(770, 96, 762, 108)
    ..lineTo(704, 171)
    ..lineTo(768, 242)
    ..quadraticBezierTo(779, 256, 762, 256)
    ..lineTo(736, 256)
    ..quadraticBezierTo(726, 256, 719, 247)
    ..lineTo(676, 198)
    ..lineTo(663, 212)
    ..lineTo(663, 243)
    ..quadraticBezierTo(663, 256, 650, 256)
    ..lineTo(637, 256)
    ..quadraticBezierTo(623, 256, 623, 242)
    ..lineTo(623, 42)
    ..quadraticBezierTo(623, 28, 637, 28)
    ..close();

  @override
  void paint(Canvas canvas, Size size) {
    final bounds = Offset.zero & size;
    final center = Offset(size.width / 2, size.height * .46);
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.royalBlue, AppColors.deepNavy],
          stops: [0, 1],
        ).createShader(bounds),
    );

    // Broad, restrained pools of brand color give depth without an image tile.
    final bloom = Curves.easeOut.transform(phase(0, .5));
    final glowBounds = Rect.fromCircle(center: center, radius: size.width * .9);
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = RadialGradient(
          colors: [
            AppColors.electricBlue.withValues(alpha: .4 * bloom),
            AppColors.electricBlue.withValues(alpha: 0),
          ],
        ).createShader(glowBounds),
    );

    final width = math.min(size.width * .8, 380.0);
    final scale = width / 775;
    canvas.save();
    canvas.translate(center.dx - width / 2, center.dy - 130 * scale);
    canvas.scale(scale);

    // A travelling point draws the R, then its two solid ribbons resolve.
    final draw = Curves.easeInOutCubic.transform(phase(0, .32));
    final reveal = Curves.easeOut.transform(phase(.21, .4));
    final rPosition =
        (1 - Curves.easeInOutCubic.transform(phase(.24, .5))) * 270;
    canvas.save();
    canvas.translate(rPosition, 0);
    final ribbonPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [AppColors.cyan, AppColors.electricBlue, AppColors.royalBlue],
      ).createShader(const Rect.fromLTWH(0, 0, 235, 256));
    for (final path in [_rTop, _rLeg]) {
      for (final metric in path.computeMetrics()) {
        canvas.drawPath(
          metric.extractPath(0, metric.length * draw),
          Paint()
            ..color = AppColors.cyan.withValues(alpha: 1 - reveal)
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..strokeWidth = 5,
        );
      }
      canvas.saveLayer(
        const Rect.fromLTWH(-10, -10, 260, 280),
        Paint()..color = Colors.white.withValues(alpha: reveal),
      );
      canvas.drawPath(path, ribbonPaint);
      canvas.restore();
    }
    canvas.restore();

    final letters = [_a, _f, _i, _k];
    for (var index = 0; index < letters.length; index++) {
      final t = phase(.31 + index * .065, .59 + index * .065);
      if (t == 0) continue;
      final arrival = Curves.easeOutBack.transform(t);
      final pivot = letters[index].getBounds().bottomCenter;
      canvas.save();
      canvas.translate(
        pivot.dx + (1 - arrival) * 125,
        pivot.dy + (1 - arrival) * 105,
      );
      canvas.rotate((1 - arrival) * .28);
      canvas.scale(.72 + arrival * .28);
      canvas.translate(-pivot.dx, -pivot.dy);
      canvas.drawPath(
        letters[index],
        Paint()
          ..color = Colors.white.withValues(
            alpha: phase(.31 + index * .065, .40 + index * .065),
          ),
      );
      canvas.restore();
    }

    // The dot is the moving protagonist: an arc, a landing, a small squash.
    final dot = phase(.52, .84);
    if (dot > 0) {
      final flight = Curves.easeOutCubic.transform(dot);
      final dotCenter = Offset(
        180 + (571 - 180) * flight,
        50 - math.sin(flight * math.pi) * 185,
      );
      final landing = math.sin(phase(.79, .88) * math.pi);
      canvas.save();
      canvas.translate(dotCenter.dx, dotCenter.dy);
      canvas.scale(1 + landing * .2, 1 - landing * .18);
      canvas.drawCircle(
        Offset.zero,
        26,
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.cyan, AppColors.electricBlue],
          ).createShader(const Rect.fromLTWH(-26, -26, 52, 52)),
      );
      canvas.restore();
    }

    // The landing sends out a single ring that disappears before the handoff.
    final ring = phase(.8, .98);
    if (ring > 0 && ring < 1) {
      canvas.drawCircle(
        const Offset(571, 50),
        26 + ring * 100,
        Paint()
          ..color = AppColors.cyan.withValues(alpha: .45 * (1 - ring))
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2 * (1 - ring),
      );
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_BrandPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
