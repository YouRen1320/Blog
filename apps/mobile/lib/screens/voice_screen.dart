// FlutterVoiceV3 —— 语音录入屏：
//   · 顶部 accent kicker "✦ NEW AI DRAFT"
//   · 大标题"说一句话给我听。"
//   · 中部 transcript 卡（活字三色：当前最高对比，越早越淡）
//   · 底部一组迷你音柱 + 圆形录音按钮 + 计时与提示
//
// 现在没有真实的语音识别接入；按钮按下只切换 isRecording 状态，
// 后续接 speech_to_text 后把 transcript 改成 stream。
import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  bool isRecording = true; // 默认进入即录，与设计稿一致

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '✦ NEW AI DRAFT',
                style: AppType.mono(
                  fontSize: 9,
                  letterSpacing: 1.6,
                  color: context.accent,
                ),
              ),
              const SizedBox(height: 4),
              Container(width: 18, height: 1, color: context.accent),
              const SizedBox(height: 14),
              Text(
                '说一句话给我听。',
                style: AppType.cn(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: context.ink,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 22),
              Expanded(child: _Transcript()),
              const SizedBox(height: 20),
              _RecorderControls(
                isRecording: isRecording,
                onTap: () => setState(() => isRecording = !isRecording),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Transcript extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(18),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TRANSCRIPT · LIVE',
            style: AppType.mono(
              fontSize: 9,
              letterSpacing: 1.4,
              color: context.ink3,
            ),
          ),
          const SizedBox(height: 10),
          // 活字三色：最近一句最深，越早越淡，模拟"刚说"的高亮感。
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '嗯，我想写一篇关于上线一个小 AI 功能的事情，',
                  style: AppType.cn(
                    fontSize: 14,
                    height: 1.7,
                    color: context.ink,
                  ),
                ),
                TextSpan(
                  text: '我一直在想的是第一版做得太多了，',
                  style: AppType.cn(
                    fontSize: 14,
                    height: 1.7,
                    color: context.ink2,
                  ),
                ),
                TextSpan(
                  text: '我觉得真正的工作是让它消失到工作流里去……',
                  style: AppType.cn(
                    fontSize: 14,
                    height: 1.7,
                    color: context.ink3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecorderControls extends StatelessWidget {
  final bool isRecording;
  final VoidCallback onTap;
  const _RecorderControls({required this.isRecording, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final bars = [8, 14, 22, 18, 26, 12, 20, 16, 24, 10, 18, 14, 22, 16];

    return Column(
      children: [
        // 音柱
        SizedBox(
          height: 28,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: bars
                .map((h) => Container(
                      width: 2,
                      height: h.toDouble(),
                      margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      color: context.accent.withValues(
                        alpha: 0.4 + (h / 26) * 0.6,
                      ),
                    ))
                .toList(),
          ),
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: context.ink,
              shape: BoxShape.circle,
              boxShadow: v3Shadow,
            ),
            alignment: Alignment.center,
            child: Text(
              isRecording ? '●' : '▶',
              style: AppType.sans(
                color: context.bg,
                fontSize: 18,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          isRecording ? 'RECORDING · 1:23 · TAP TO STOP' : 'TAP TO RESUME',
          style: AppType.mono(
            fontSize: 10,
            letterSpacing: 1.2,
            color: context.ink3,
          ),
        ),
      ],
    );
  }
}
