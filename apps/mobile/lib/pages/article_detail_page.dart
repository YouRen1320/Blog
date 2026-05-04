// 文章详情。markdown 渲染用 flutter_markdown。
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/articles_provider.dart';
import '../theme/tokens.dart';
import '../utils/format.dart';

class ArticleDetailPage extends ConsumerWidget {
  final String slug;
  const ArticleDetailPage({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(articleBySlugProvider(slug));
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        iconTheme: IconThemeData(color: context.ink2),
        title: Text('文章', style: AppType.cn(fontSize: 13, color: context.ink2)),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('找不到这篇文章。\n($e)',
                style: AppType.cn(color: context.ink2), textAlign: TextAlign.center),
          ),
        ),
        data: (article) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(frenchSeason(article.publishedAt),
                  style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.8)),
              const SizedBox(height: 6),
              Container(width: 24, height: 1, color: context.ink3),
              const SizedBox(height: 22),
              Text(article.title,
                  style: AppType.cn(fontSize: 28, fontWeight: FontWeight.w600, color: context.ink, height: 1.3)),
              if ((article.summary ?? '').isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(article.summary!,
                    style: AppType.cn(fontSize: 15, color: context.ink2, height: 1.6)),
              ],
              const SizedBox(height: 16),
              Wrap(
                spacing: 18,
                runSpacing: 6,
                children: [
                  Text('◷ ${readingTime(article.content)}',
                      style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2)),
                  Text('≣ ${article.content.length} 字',
                      style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2)),
                  if (article.publishedAt != null)
                    Text('✎ ${shortDate(article.publishedAt!)}',
                        style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2)),
                  if (article.author != null)
                    Text('✦ ${article.author!.username}',
                        style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2)),
                ],
              ),
              const SizedBox(height: 28),
              MarkdownBody(
                data: article.content,
                styleSheet: _markdownStyle(context),
                selectable: true,
              ),
              if (article.tags.isNotEmpty) ...[
                const SizedBox(height: 28),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: article.tags
                      .map((t) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: context.card,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('#${t.name}',
                                style: AppType.mono(fontSize: 10, color: context.ink3, letterSpacing: 1.2)),
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

  MarkdownStyleSheet _markdownStyle(BuildContext c) => MarkdownStyleSheet(
        p: AppType.cn(fontSize: 15, height: 1.85, color: c.ink),
        h1: AppType.cn(fontSize: 24, fontWeight: FontWeight.w700, color: c.ink, height: 1.3),
        h2: AppType.cn(fontSize: 20, fontWeight: FontWeight.w600, color: c.ink, height: 1.35),
        h3: AppType.cn(fontSize: 17, fontWeight: FontWeight.w600, color: c.ink, height: 1.4),
        blockquote: AppType.cn(fontSize: 15, color: c.ink2, fontStyle: FontStyle.italic, height: 1.7),
        blockquoteDecoration: BoxDecoration(
          color: c.card,
          border: Border(left: BorderSide(color: c.accent, width: 2)),
        ),
        code: AppType.mono(fontSize: 13, color: c.ink),
        codeblockDecoration: BoxDecoration(
          color: c.ink,
          borderRadius: BorderRadius.circular(10),
        ),
        codeblockPadding: const EdgeInsets.all(14),
        a: AppType.cn(fontSize: 15, color: c.accent, height: 1.85),
      );
}
