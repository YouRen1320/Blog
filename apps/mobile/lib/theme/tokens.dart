// v3 设计 token —— 与 apps/web、apps/admin 共享同一组色值与字体。
// 字体走 google_fonts 远程加载，保证视觉与 web 端 1:1 对齐。
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTokens {
  // 亮色
  static const bg = Color(0xFFF4F2EE);
  static const card = Color(0xFFFBFAF7);
  static const ink = Color(0xFF1F2421);
  static const ink2 = Color(0xFF4F5650);
  static const ink3 = Color(0xFF8A8F89);
  static const ink4 = Color(0xFFB5B8B2);
  static const rule = Color(0xFFE4E2DC);
  static const accent = Color(0xFF6B7A5A);
  static const pinned = Color(0xFFA78A3D);

  // 暗色
  static const darkBg = Color(0xFF15181A);
  static const darkCard = Color(0xFF1C2022);
  static const darkInk = Color(0xFFE8E6DF);
  static const darkInk2 = Color(0xFFB0B3AC);
  static const darkInk3 = Color(0xFF71746E);
  static const darkInk4 = Color(0xFF4A4D49);
  static const darkRule = Color(0xFF262A2C);
  static const darkAccent = Color(0xFF9DAE85);
}

/// BuildContext 扩展：按当前亮/暗自动取色。
extension AppPalette on BuildContext {
  bool get _dark => Theme.of(this).brightness == Brightness.dark;

  Color get bg => _dark ? AppTokens.darkBg : AppTokens.bg;
  Color get card => _dark ? AppTokens.darkCard : AppTokens.card;
  Color get ink => _dark ? AppTokens.darkInk : AppTokens.ink;
  Color get ink2 => _dark ? AppTokens.darkInk2 : AppTokens.ink2;
  Color get ink3 => _dark ? AppTokens.darkInk3 : AppTokens.ink3;
  Color get ink4 => _dark ? AppTokens.darkInk4 : AppTokens.ink4;
  Color get rule => _dark ? AppTokens.darkRule : AppTokens.rule;
  Color get accent => _dark ? AppTokens.darkAccent : AppTokens.accent;
}

/// v3 阴影：与 web 端的 --shadow 对齐。
const v3Shadow = [
  BoxShadow(color: Color(0x0A14140F), offset: Offset(0, 1), blurRadius: 2),
  BoxShadow(color: Color(0x0A14140F), offset: Offset(0, 8), blurRadius: 24),
];

/// 字体工厂：每次返回的 TextStyle 都按当前色调注入字体；
/// 业务代码直接调用而不用关心字体名。
class AppType {
  /// 中文衬线（正文）：Noto Serif SC，对应 web 的 .cn。
  static TextStyle cn({
    double? fontSize,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    Color? color,
    double? height,
    double? letterSpacing,
  }) =>
      GoogleFonts.notoSerifSc(
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        color: color,
        height: height,
        letterSpacing: letterSpacing,
      );

  /// 西文衬线（正文）：Source Serif 4，对应 web 的 .serif。
  static TextStyle serif({
    double? fontSize,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    Color? color,
    double? height,
  }) =>
      GoogleFonts.sourceSerif4(
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        color: color,
        height: height,
      );

  /// 西文衬线（display 斜体）：Cormorant Garamond，对应 web 的 .serif-disp。
  static TextStyle disp({
    double? fontSize,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    Color? color,
    double? height,
  }) =>
      GoogleFonts.cormorantGaramond(
        fontSize: fontSize,
        fontWeight: fontWeight ?? FontWeight.w400,
        fontStyle: fontStyle ?? FontStyle.italic,
        color: color,
        height: height,
      );

  /// 无衬线（UI）：Inter，对应 web 的 .sans。
  static TextStyle sans({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  /// 等宽（小标 / 元数据）：JetBrains Mono，对应 web 的 .mono。
  static TextStyle mono({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
  }) =>
      GoogleFonts.jetBrainsMono(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
      );
}

/// 主题样式生成。Material 3 关掉，以避免覆盖我们的色板。
ThemeData buildTheme({required bool dark}) {
  final base = dark
      ? ThemeData.dark(useMaterial3: false)
      : ThemeData.light(useMaterial3: false);
  final bg = dark ? AppTokens.darkBg : AppTokens.bg;
  final ink = dark ? AppTokens.darkInk : AppTokens.ink;

  return base.copyWith(
    scaffoldBackgroundColor: bg,
    primaryColor: dark ? AppTokens.darkAccent : AppTokens.accent,
    colorScheme: base.colorScheme.copyWith(
      primary: dark ? AppTokens.darkAccent : AppTokens.accent,
      surface: dark ? AppTokens.darkCard : AppTokens.card,
    ),
    // 整体 textTheme 用 Inter 兜底，具体场景用 AppType.* 覆盖。
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: ink,
      displayColor: ink,
    ),
  );
}
