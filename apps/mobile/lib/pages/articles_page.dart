// /home —— 公开已发布文章列表。
// 下拉刷新 + 无限滚动(暂时只拉前 50 条,V1 文章量小够用)。
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/article.dart';
import '../providers/articles_provider.dart';
import '../theme/tokens.dart';
import '../utils/format.dart';

class ArticlesPage extends ConsumerWidget {
  const ArticlesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(publicArticlesProvider);
    return RefreshIndicator(
      color: context.accent,
      onRefresh: () async => ref.invalidate(publicArticlesProvider),
      child: asyncList.when(
        loading: () => _stateView(context, child: const CircularProgressIndicator()),
        error: (e, _) => _stateView(
          context,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('加载失败:$e', style: AppType.cn(color: context.ink2), textAlign: TextAlign.center),
          ),
        ),
        data: (page) {
          if (page.data.isEmpty) {
            return _stateView(context, child: Text('还没有发布的文章。', style: AppType.cn(color: context.ink3)));
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            itemCount: page.data.length + 1,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (_, i) {
              if (i == 0) return _header(context, page.total);
              return _ArticleCard(article: page.data[i - 1]);
            },
          );
        },
      ),
    );
  }

  Widget _stateView(BuildContext c, {required Widget child}) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(c).size.height * 0.35),
          Center(child: child),
        ],
      );

  Widget _header(BuildContext c, int total) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('WRITING · $total IN TOTAL', style: AppType.mono(fontSize: 9, color: c.ink3, letterSpacing: 1.8)),
            const SizedBox(height: 6),
            Container(width: 24, height: 1, color: c.ink3),
            const SizedBox(height: 16),
            Text('写作', style: AppType.cn(fontSize: 28, fontWeight: FontWeight.w600, color: c.ink)),
            const SizedBox(height: 8),
            Text('博客发布的全部文章。下拉刷新。', style: AppType.cn(fontSize: 13, color: c.ink2)),
          ],
        ),
      );
}

class _ArticleCard extends StatelessWidget {
  final ArticleSummary article;
  const _ArticleCard({required this.article});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/article/${article.slug}'),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    frenchSeason(article.publishedAt),
                    style: AppType.mono(fontSize: 9, color: context.ink3, letterSpacing: 1.6),
                  ),
                  const SizedBox(width: 8),
                  Container(width: 14, height: 1, color: context.ink3),
                  const Spacer(),
                  if (article.publishedAt != null)
                    Text(shortDate(article.publishedAt!), style: AppType.mono(fontSize: 10, color: context.ink3)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                article.title,
                style: AppType.cn(fontSize: 18, fontWeight: FontWeight.w600, color: context.ink, height: 1.35),
              ),
              if ((article.summary ?? '').isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  article.summary!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppType.cn(fontSize: 13, color: context.ink2, height: 1.6),
                ),
              ],
              if (article.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: article.tags
                      .map((t) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: context.bg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('#${t.name}', style: AppType.mono(fontSize: 9, color: context.ink3, letterSpacing: 1.2)),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
