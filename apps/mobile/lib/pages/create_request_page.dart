// /create —— AI 创作入口。
//
// V1.5 起:语音输入接通 record + permission_handler →
// POST /admin/ai/transcribe(后端走 Whisper)→ 拿到的文字 append 进 prompt 框。
// 流程:点击 mic → 请求权限 → 录 m4a 临时文件 → 再点 mic 停止 + 上传 → 文字落进框。
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import '../providers/ai_provider.dart';
import '../providers/articles_provider.dart';
import '../theme/tokens.dart';

const _toneLabels = [
  ('technical', '技术 · 严谨'),
  ('casual', '随笔 · 轻盈'),
  ('poetic', '诗意 · 抒情'),
  ('narrative', '记叙 · 故事'),
];

const _lengthLabels = [
  ('short', '短 · 800 字'),
  ('medium', '中 · 1500 字'),
  ('long', '长 · 3000 字'),
];

class CreateRequestPage extends ConsumerStatefulWidget {
  const CreateRequestPage({super.key});

  @override
  ConsumerState<CreateRequestPage> createState() => _CreateRequestPageState();
}

class _CreateRequestPageState extends ConsumerState<CreateRequestPage> {
  final _prompt = TextEditingController();
  String _tone = 'technical';
  String _length = 'medium';
  bool _busy = false;
  String? _error;

  // 录音 state
  final _recorder = AudioRecorder();
  bool _recording = false;
  bool _transcribing = false;

  @override
  void dispose() {
    _recorder.dispose();
    _prompt.dispose();
    super.dispose();
  }

  /// mic 按钮:第一次按 → 请求权限 + 开始录;第二次按 → 停止 + 上传 + 拿文字
  Future<void> _toggleRecord() async {
    if (_busy || _transcribing) return;
    if (_recording) {
      await _stopAndTranscribe();
    } else {
      await _startRecord();
    }
  }

  Future<void> _startRecord() async {
    final granted = await Permission.microphone.request();
    if (!granted.isGranted) {
      setState(() => _error = '麦克风权限被拒,无法语音输入');
      return;
    }
    try {
      final dir = await getTemporaryDirectory();
      final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 16000),
        path: path,
      );
      setState(() {
        _recording = true;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = '录音启动失败:$e');
    }
  }

  Future<void> _stopAndTranscribe() async {
    final path = await _recorder.stop();
    setState(() {
      _recording = false;
      _transcribing = path != null;
      _error = null;
    });
    if (path == null) return;
    try {
      final text = await ref.read(aiServiceProvider).transcribe(path);
      // append 到 prompt 框,不覆盖已有文字
      final cur = _prompt.text;
      _prompt.text = cur.isEmpty ? text : '$cur $text';
      _prompt.selection = TextSelection.collapsed(offset: _prompt.text.length);
    } catch (e) {
      setState(() => _error = '语音转写失败:$e');
    } finally {
      // 删临时文件
      try {
        await File(path).delete();
      } catch (_) {}
      if (mounted) setState(() => _transcribing = false);
    }
  }

  Future<void> _submit() async {
    if (_prompt.text.trim().isEmpty) {
      setState(() => _error = '先告诉 AI 你想写什么');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final draft = await ref.read(aiServiceProvider).generateDraft(
            prompt: _prompt.text.trim(),
            tone: _tone,
            length: _length,
          );
      ref.invalidate(draftsProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('已生成草稿:${draft.title}')),
      );
      context.go('/drafts');
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

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
            '描述你想写什么,选语气和长度。\n点"生成"后,文章会作为草稿落进收件箱待审核。',
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
                    enabled: !_busy,
                    style: AppType.cn(fontSize: 14, color: context.ink, height: 1.6),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.all(14),
                      border: InputBorder.none,
                      hintText: '写一篇关于 Prisma 与 NestJS 集成的入门文章',
                      hintStyle: AppType.cn(fontSize: 14, color: context.ink3, height: 1.6),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: (_busy || _transcribing) ? null : _toggleRecord,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    // 录音中:红色脉冲色;转写中:accent;空闲:卡片色
                    color: _recording
                        ? const Color(0xFFB95C50)
                        : (_transcribing ? context.accent : context.card),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: _transcribing
                      ? const Center(
                          child: SizedBox(
                            width: 18, height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          ),
                        )
                      : Icon(
                          _recording ? Icons.stop_circle_outlined : Icons.mic_none_outlined,
                          color: _recording ? Colors.white : context.ink3,
                        ),
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
            children: _toneLabels.map((t) => _chip(context, t.$2, _tone == t.$1, () => setState(() => _tone = t.$1))).toList(),
          ),
          const SizedBox(height: 20),
          _label(context, 'LENGTH'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _lengthLabels.map((l) => _chip(context, l.$2, _length == l.$1, () => setState(() => _length = l.$1))).toList(),
          ),
          if (_error != null) ...[
            const SizedBox(height: 18),
            Text(_error!, style: AppType.sans(fontSize: 12, color: const Color(0xFFC0392B))),
          ],
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: _busy
                  ? const SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                    )
                  : const Icon(Icons.auto_awesome, size: 18),
              label: Text(_busy ? '生成中…' : '✦ 生成草稿', style: AppType.sans(fontSize: 14, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(
                backgroundColor: context.ink,
                foregroundColor: context.bg,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _busy ? null : _submit,
            ),
          ),
          const SizedBox(height: 14),
          Center(
            child: Text(
              'POST /admin/ai/drafts → ai-service → 落库',
              style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2),
            ),
          ),
        ],
      ),
    );
  }

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
