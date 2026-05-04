// 草稿编辑器(简化版):
// - 新建模式 /draft/new        :空表单 → 调 POST /admin/articles
// - 编辑模式 /draft/:id         :预填数据(V1 后端返回 ArticleDetail)→ 暂时只做"看",
//   完整编辑能力(改/发布/删)留给 V4 之后,因为本期重点是"能从手机提交草稿"
// 移动端不接 publish/delete,这两个动作仍由 admin 后台做(职责明确)。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/articles_provider.dart';
import '../theme/tokens.dart';

class DraftEditorPage extends ConsumerStatefulWidget {
  final String? id;
  const DraftEditorPage({super.key, this.id});

  @override
  ConsumerState<DraftEditorPage> createState() => _DraftEditorPageState();
}

class _DraftEditorPageState extends ConsumerState<DraftEditorPage> {
  final _title = TextEditingController();
  final _content = TextEditingController();
  bool _busy = false;
  String? _error;

  bool get _isNew => widget.id == null;

  @override
  void initState() {
    super.initState();
    if (!_isNew) _load();
  }

  Future<void> _load() async {
    setState(() => _busy = true);
    try {
      final detail = await ref.read(articlesServiceProvider).getAdminById(widget.id!);
      _title.text = detail.title;
      _content.text = detail.content;
    } catch (e) {
      setState(() => _error = '加载失败:$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _content.text.trim().isEmpty) {
      setState(() => _error = '标题和正文都不能空');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(articlesServiceProvider).createDraft(
            title: _title.text.trim(),
            content: _content.text,
          );
      ref.invalidate(draftsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('草稿已保存')),
        );
        context.pop();
      }
    } catch (e) {
      setState(() => _error = '保存失败:$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        iconTheme: IconThemeData(color: context.ink2),
        title: Text(_isNew ? '新建草稿' : '查看草稿',
            style: AppType.cn(fontSize: 14, color: context.ink, fontWeight: FontWeight.w500)),
        actions: [
          if (_isNew)
            TextButton(
              onPressed: _busy ? null : _save,
              child: Text(_busy ? '…' : '保存',
                  style: AppType.sans(fontSize: 13, fontWeight: FontWeight.w600, color: context.accent)),
            ),
        ],
      ),
      body: _busy && !_isNew
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _title,
                    enabled: _isNew,
                    style: AppType.cn(fontSize: 24, fontWeight: FontWeight.w600, color: context.ink),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: '标题',
                    ),
                  ),
                  Container(height: 1, color: context.rule),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _content,
                    enabled: _isNew,
                    minLines: 10,
                    maxLines: null,
                    style: AppType.cn(fontSize: 15, color: context.ink, height: 1.7),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: '正文(支持 Markdown,发布到 web 时会渲染)',
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Text(_error!, style: AppType.sans(fontSize: 12, color: const Color(0xFFC0392B))),
                  ],
                  if (!_isNew) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(10)),
                      child: Text(
                        '草稿的发布 / 编辑 / 删除请到 admin 后台完成。\n'
                        '移动端只负责"快速记录创意"的入口。',
                        style: AppType.cn(fontSize: 12, color: context.ink3, height: 1.6),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
