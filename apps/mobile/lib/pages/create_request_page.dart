// /create —— AI 创作入口(V3-06 占位版)。
//
// V3 阶段:UI + 交互骨架就位,但"AI 帮我写"按钮只 toast 提示等 V4。
// V4 时:接入 NestJS /ai/generate/article,提交后跳到结果预览页 → 落库为草稿。
//
// 语音输入按钮 V3 也只是占位(Material 麦克风图标),V4 时接 speech_to_text。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/tokens.dart';

const _tones = ['技术 · 严谨', '随笔 · 轻盈', '诗意 · 抒情', '记叙 · 故事'];
const _lengths = ['短 · 800 字', '中 · 1500 字', '长 · 3000 字'];

class CreateRequestPage extends ConsumerStatefulWidget {
  const CreateRequestPage({super.key});

  @override
  ConsumerState<CreateRequestPage> createState() => _CreateRequestPageState();
}

class _CreateRequestPageState extends ConsumerState<CreateRequestPage> {
  final _prompt = TextEditingController();
  String _tone = _tones[0];
  String _length = _lengths[1];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('AI · CREATE', style: AppType.mono(fontSize: 9, color: context.accent, letterSpacing: 1.8)),
          const SizedBox(height: 6),
          Container(width: 24, height: 1, color: context.accent),
          const SizedBox(height: 16),
          Text('让 AI 帮你起稿', style: AppType.cn(fontSize: 28, fontWeight: FontWeight.w600, color: context.ink)),
          const SizedBox(height: 8),
          Text(
            '描述你想写什么,选语气和长度,AI 会生成结构化草稿:标题 / 摘要 / 正文 / 标签 / 分类。',
            style: AppType.cn(fontSize: 13, color: context.ink2, height: 1.7),
          ),
          const SizedBox(height: 28),
          _label(context, 'PROMPT'),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(12)),
                  child: TextField(
                    controller: _prompt,
                    minLines: 4,
                    maxLines: 8,
                    style: AppType.cn(fontSize: 14, color: context.ink, height: 1.6),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.all(14),
                      border: InputBorder.none,
                      hintText: '比如:写一篇关于 Prisma 与 NestJS 集成的入门文章',
                      hintStyle: AppType.cn(fontSize: 14, color: context.ink3, height: 1.6),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => _info(context, '语音输入将在 V4 接 speech_to_text 后启用'),
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(14)),
                  child: Icon(Icons.mic_none_outlined, color: context.ink3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _label(context, 'TONE'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _tones.map((t) => _chip(context, t, _tone == t, () => setState(() => _tone = t))).toList(),
          ),
          const SizedBox(height: 20),
          _label(context, 'LENGTH'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _lengths.map((l) => _chip(context, l, _length == l, () => setState(() => _length = l))).toList(),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: Text('AI 帮我写', style: AppType.sans(fontSize: 14, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(
                backgroundColor: context.ink,
                foregroundColor: context.bg,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => _info(context, 'AI 服务在 V4 上线\n这一步将提交到 /ai/generate/article'),
            ),
          ),
          const SizedBox(height: 14),
          Center(
            child: Text(
              'V4 起接入 xiaomi MiMo · 结果会落进草稿箱',
              style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2),
            ),
          ),
        ],
      ),
    );
  }

  void _info(BuildContext c, String msg) => ScaffoldMessenger.of(c).showSnackBar(
        SnackBar(
          content: Text(msg, style: AppType.cn(fontSize: 13)),
          duration: const Duration(seconds: 3),
        ),
      );

  Widget _label(BuildContext c, String text) =>
      Text(text, style: AppType.mono(fontSize: 9, color: c.ink3, letterSpacing: 1.8));

  Widget _chip(BuildContext c, String text, bool active, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: active ? c.ink : c.card,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: active ? c.ink : c.rule),
          ),
          child: Text(
            text,
            style: AppType.cn(fontSize: 12, color: active ? c.bg : c.ink2, fontWeight: FontWeight.w500),
          ),
        ),
      );
}
