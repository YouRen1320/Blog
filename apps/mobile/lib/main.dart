// Youren Blog · Mobile (Flutter)
// 入口：装载 v3 主题，给三个屏（浏览/语音/草稿）配上底部导航。
// 暗色模式靠 ThemeMode.system 跟随系统；后续可加 Provider 控制。
import 'package:flutter/material.dart';
import 'screens/browse_screen.dart';
import 'screens/voice_screen.dart';
import 'screens/draft_screen.dart';
import 'theme/tokens.dart';

void main() => runApp(const YourenApp());

class YourenApp extends StatelessWidget {
  const YourenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Youren · Mobile',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(dark: false),
      darkTheme: buildTheme(dark: true),
      themeMode: ThemeMode.system,
      home: const RootShell(),
    );
  }
}

/// 三屏外壳：底部 3 标签对应浏览 / 语音 / 草稿。
/// 浏览屏自带浮起药丸导航，因此切到它时隐藏外壳的底部 nav。
class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int idx = 0;

  static const _screens = <Widget>[
    BrowseScreen(),
    VoiceScreen(),
    DraftScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: IndexedStack(index: idx, children: _screens),
      bottomNavigationBar: idx == 0
          ? null
          : _BottomNav(
              index: idx,
              onChange: (i) => setState(() => idx = i),
            ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onChange;
  const _BottomNav({required this.index, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final tabs = ['◉', '✎', '✦'];
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: Container(
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(999),
            boxShadow: v3Shadow,
          ),
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: List.generate(tabs.length, (i) {
              final on = i == index;
              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onChange(i),
                  child: Center(
                    child: Text(
                      tabs[i],
                      style: TextStyle(
                        fontSize: 16,
                        color: on ? context.accent : context.ink3,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
