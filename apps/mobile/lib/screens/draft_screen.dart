// FlutterDraftV3 —— AI 草稿预览屏：
//   · 顶部 mono 行：← BACK 与 ✦ AI DRAFT · 87% 两端对齐
//   · "VOICE → DRAFT" kicker
//   · 标题 / 副标 / 正文 prose（用 ink-2 行高 1.75）
//   · 底栏两按钮：重新生成 + 保存草稿（accent 主按钮）
import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class DraftScreen extends StatelessWidget {
  const DraftScreen({super.key});

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
                // 顶部 mono 行
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '← BACK',
                      style: AppType.mono(
                        fontSize: 10,
                        letterSpacing: 1.4,
                        color: context.ink3,
                      ),
                    ),
                    Text(
                      '✦ AI DRAFT · 87%',
                      style: AppType.mono(
                        fontSize: 10,
                        letterSpacing: 1.4,
                        color: context.accent,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  'VOICE → DRAFT',
                  style: AppType.mono(
                    fontSize: 9,
                    letterSpacing: 1.6,
                    color: context.ink3,
                  ),
                ),
                const SizedBox(height: 4),
                Container(width: 18, height: 1, color: context.ink3),
                const SizedBox(height: 14),
                Text(
                  '上线一个小 AI 功能的笔记',
                  style: AppType.cn(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: context.ink,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '从你的 2 分钟语音备忘录生成。',
                  style: AppType.cn(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    color: context.ink3,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: context.rule)),
                  ),
                  padding: const EdgeInsets.only(top: 14),
                  child: _ProseBody(),
                ),
              ],
            ),
            const Positioned(
              left: 20,
              right: 20,
              bottom: 18,
              child: _BottomActions(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProseBody extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final body = AppType.cn(
      fontSize: 13,
      height: 1.75,
      color: context.ink2,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(text: '上线一个小 AI 功能，最大的工作量在于决定它', style: body),
                TextSpan(
                  text: '不做',
                  style: body.copyWith(fontStyle: FontStyle.italic),
                ),
                TextSpan(
                  text: '什么。诱惑总是让模型站到聚光灯下；真正的活儿是反过来。',
                  style: body,
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Text(
            '第一版做得太多了：建议标题、改写、生成标签、挑封面，一次性都来。结果就是一个我从来不打开的侧栏。',
            style: body,
          ),
        ),
        Text('… 还有 4 段。', style: body.copyWith(color: context.ink4)),
      ],
    );
  }
}

class _BottomActions extends StatelessWidget {
  const _BottomActions();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _PillButton(
            label: '重新生成',
            background: context.bg,
            border: context.rule,
            color: context.ink2,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _PillButton(
            label: '保存草稿 →',
            background: context.ink,
            color: context.bg,
            isPrimary: true,
          ),
        ),
      ],
    );
  }
}

class _PillButton extends StatelessWidget {
  final String label;
  final Color background;
  final Color color;
  final Color? border;
  final bool isPrimary;
  const _PillButton({
    required this.label,
    required this.background,
    required this.color,
    this.border,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: border != null ? Border.all(color: border!) : null,
      ),
      padding: const EdgeInsets.symmetric(vertical: 12),
      alignment: Alignment.center,
      child: Text(
        label,
        style: AppType.sans(
          fontSize: 12,
          color: color,
          fontWeight: isPrimary ? FontWeight.w500 : FontWeight.w400,
        ),
      ),
    );
  }
}
