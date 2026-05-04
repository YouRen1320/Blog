// InkArt —— 与 web 端 InkArt 同源，三种程序化水墨纹路。
// 用 CustomPainter 在黑底上画白线条。seed 决定 variant。
import 'dart:math' as math;
import 'package:flutter/material.dart';

class InkArt extends StatelessWidget {
  /// seed 决定 variant 与扰动相位，相同 seed 始终画出相同纹理。
  final int seed;
  final double aspectRatio;

  const InkArt({super.key, this.seed = 0, this.aspectRatio = 200 / 180});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: ColoredBox(
        color: const Color(0xFF0E0E0C),
        child: CustomPaint(
          painter: _InkPainter(seed: seed),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _InkPainter extends CustomPainter {
  final int seed;
  _InkPainter({required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final variant = seed.abs() % 3;
    // 设计原图按 200x180 viewBox 编排，这里按比例缩放到实际像素。
    final sx = size.width / 200;
    final sy = size.height / 180;

    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke;

    if (variant == 0) {
      // 横向编织笔触
      paint.strokeWidth = 0.4;
      paint.color = Colors.white.withValues(alpha: 0.7);
      for (var i = 0; i < 60; i++) {
        final p = Path();
        final startY = 100 + math.sin(i * 0.3 + seed) * 30;
        final ctrlY = 20 + ((i * 13) % 60).toDouble();
        final endY = 140 + math.cos(i * 0.2 + seed) * 40;
        p.moveTo((20 + i * 2) * sx, startY * sy);
        p.quadraticBezierTo(
          (100 + i) * sx,
          ctrlY * sy,
          (180 - i * 1.5) * sx,
          endY * sy,
        );
        canvas.drawPath(p, paint);
      }
    } else if (variant == 1) {
      // 垂直雾柱
      paint.strokeWidth = 0.3;
      paint.color = Colors.white.withValues(alpha: 0.55);
      for (var i = 0; i < 80; i++) {
        final x1 = 100 + math.sin(i * 0.5 + seed) * 60;
        final x2 = 100 + math.sin(i * 0.5 + seed + 0.4) * 70;
        final y1 = 10 + i * 1.8;
        final y2 = 20 + i * 1.8;
        canvas.drawLine(Offset(x1 * sx, y1 * sy), Offset(x2 * sx, y2 * sy), paint);
      }
    } else {
      // 旋转扁椭圆羽
      paint.strokeWidth = 0.5;
      paint.color = Colors.white.withValues(alpha: 0.6);
      for (var i = 0; i < 40; i++) {
        final cx = 100 + math.sin(i + seed) * 8;
        const cy = 90.0;
        final r = 8 + i * 2;
        canvas.save();
        canvas.translate(cx * sx, cy * sy);
        canvas.rotate((i * 4 + seed * 10) * math.pi / 180);
        final rect = Rect.fromCenter(
          center: Offset.zero,
          width: r * 2 * sx,
          height: r * 0.6 * sy,
        );
        canvas.drawOval(rect, paint);
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(covariant _InkPainter old) => old.seed != seed;
}
