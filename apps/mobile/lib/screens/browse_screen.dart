// FlutterBrowseV3 —— 移动端首屏：
//   · 顶部 italic Y + 微型 mono 导航字串
//   · "RECENT · N ENTRIES" kicker + 分隔线
//   · 文章卡列表（左文 + 右 InkArt 110px 方块）
//   · 底部 4 项浮起圆角 tab bar
import 'package:flutter/material.dart';
import '../theme/tokens.dart';
import '../widgets/ink_art.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 100),
              children: [
                _Header(),
                const SizedBox(height: 18),
                _Kicker(text: 'RECENT · 12 ENTRIES'),
                const SizedBox(height: 14),
                ..._entries.map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ArticleCard(entry: e),
                    )),
              ],
            ),
            const Positioned(
              left: 20,
              right: 20,
              bottom: 22,
              child: _BottomTabs(),
            ),
          ],
        ),
      ),
    );
  }
}

class _Entry {
  final String season;
  final String title;
  final String summary;
  final int seed;
  final bool pinned;
  const _Entry(this.season, this.title, this.summary, this.seed,
      {this.pinned = false});
}

const _entries = [
  _Entry('VENDÉMIAIRE', '查戈斯群岛与 .io 的命运', '献与被遗忘者。', 0, pinned: true),
  _Entry('PLUVIÔSE', 'Hello, Mitra', '契约既成……', 1),
  _Entry('FLORÉAL', '岁时录（二十四）', '写周报好了。', 2),
  _Entry('VENTÔSE', 'Adult', '长大以后，问题并不会自动消失。', 1),
];

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Y',
          style: AppType.disp(
            fontSize: 26,
            color: context.accent,
            height: 1,
          ),
        ),
        Text(
          'NOW · WRITE · ME',
          style: AppType.mono(
            fontSize: 11,
            color: context.ink3,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

/// 通用 mono kicker：小标题 + 短分隔线。
class _Kicker extends StatelessWidget {
  final String text;
  const _Kicker({required this.text});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text,
          style: AppType.mono(
            fontSize: 9,
            letterSpacing: 1.6,
            color: context.ink3,
          ),
        ),
        const SizedBox(height: 4),
        Container(width: 18, height: 1, color: context.ink3),
      ],
    );
  }
}

class _ArticleCard extends StatelessWidget {
  final _Entry entry;
  const _ArticleCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(14),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.season,
                        style: AppType.mono(
                          fontSize: 8,
                          letterSpacing: 1.6,
                          color: context.ink3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(width: 14, height: 1, color: context.ink3),
                      const SizedBox(height: 8),
                      Text(
                        entry.title,
                        style: AppType.cn(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: context.ink,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.summary,
                        style: AppType.cn(
                          fontSize: 11,
                          color: context.ink2,
                        ),
                      ),
                      if (entry.pinned) ...[
                        const SizedBox(height: 6),
                        Text(
                          '★ 置顶',
                          style: AppType.sans(
                            fontSize: 10,
                            color: AppTokens.pinned,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SizedBox(
                width: 110,
                child: InkArt(seed: entry.seed, aspectRatio: 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomTabs extends StatelessWidget {
  const _BottomTabs();

  @override
  Widget build(BuildContext context) {
    final tabs = [
      ('◉', true),
      ('✎', false),
      ('✦', false),
      ('◐', false),
    ];

    return Container(
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(999),
        boxShadow: v3Shadow,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: tabs
            .map((t) => Expanded(
                  child: Center(
                    child: Text(
                      t.$1,
                      style: AppType.sans(
                        fontSize: 16,
                        color: t.$2 ? context.accent : context.ink3,
                      ),
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }
}
