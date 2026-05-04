// /drafts —— admin 端的草稿列表。
// 需要登录 ADMIN 才能拿到数据;USER 角色看不到。
// 点击行进编辑,FAB "+ 新建" 进 /draft/new。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/article.dart';
import '../providers/articles_provider.dart';
import '../theme/tokens.dart';

class DraftsPage extends ConsumerWidget {
  const DraftsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(draftsProvider);
    return Scaffold(
      backgroundColor: context.bg,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: context.ink,
        foregroundColor: context.bg,
        icon: const Icon(Icons.add),
        label: Text('新建草稿', style: AppType.sans(fontSize: 13, fontWeight: FontWeight.w500)),
        onPressed: () => context.push('/draft/new'),
      ),
      body: RefreshIndicator(
        color: context.accent,
        onRefresh: () async => ref.invalidate(draftsProvider),
        child: async.when(
          loading: () => _state(context, child: const CircularProgressIndicator()),
          error: (e, _) => _state(
            context,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text('加载失败:$e\n(只有 ADMIN 角色能看到草稿)',
                  style: AppType.cn(color: context.ink2), textAlign: TextAlign.center),
            ),
          ),
          data: (page) {
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
              itemCount: page.data.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                if (i == 0) return _header(context, page.total);
                if (page.data.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 60),
                    child: Center(
                      child: Text('还没有草稿。点 + 新建一篇。', style: AppType.cn(color: context.ink3)),
                    ),
                  );
                }
                final a = page.data[i - 1];
                return _DraftCard(article: a);
              },
            );
          },
        ),
      ),
    );
  }

  Widget _state(BuildContext c, {required Widget child}) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [SizedBox(height: MediaQuery.of(c).size.height * 0.3), Center(child: child)],
      );

  Widget _header(BuildContext c, int total) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('DRAFTS · $total', style: AppType.mono(fontSize: 9, color: c.ink3, letterSpacing: 1.8)),
            const SizedBox(height: 6),
            Container(width: 24, height: 1, color: c.ink3),
            const SizedBox(height: 16),
            Text('草稿', style: AppType.cn(fontSize: 28, fontWeight: FontWeight.w600, color: c.ink)),
            const SizedBox(height: 8),
            Text('未发布的文章。点击编辑,发布到后台审核。',
                style: AppType.cn(fontSize: 13, color: c.ink2)),
          ],
        ),
      );
}

class _DraftCard extends StatelessWidget {
  final ArticleSummary article;
  const _DraftCard({required this.article});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/draft/${article.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: context.bg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('DRAFT',
                        style: AppType.mono(fontSize: 9, color: context.ink3, letterSpacing: 1.6)),
                  ),
                  const Spacer(),
                  // 列表 API 没返回 createdAt,只有 publishedAt(草稿恒为 null)和无更新时间。
                  // 用 slug 当尾巴,保持节奏感。
                  Text('/${article.slug}',
                      style: AppType.mono(fontSize: 10, color: context.ink3)),
                ],
              ),
              const SizedBox(height: 10),
              Text(article.title,
                  style: AppType.cn(fontSize: 16, fontWeight: FontWeight.w600, color: context.ink, height: 1.4)),
              if ((article.summary ?? '').isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  article.summary!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppType.cn(fontSize: 12, color: context.ink2, height: 1.6),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
