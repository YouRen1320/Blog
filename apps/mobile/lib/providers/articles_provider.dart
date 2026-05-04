import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/articles_service.dart';
import '../models/article.dart';
import 'auth_provider.dart';

final articlesServiceProvider = Provider<ArticlesService>(
  (ref) => ArticlesService(ref.watch(apiClientProvider)),
);

/// 公开文章列表(分页 1,首屏)。下拉刷新 / 翻页通过 ref.invalidate 重新拉。
final publicArticlesProvider = FutureProvider<PaginatedResponse<ArticleSummary>>(
  (ref) async {
    final service = ref.watch(articlesServiceProvider);
    return service.listPublished(page: 1, pageSize: 50);
  },
);

/// 单篇文章详情。
final articleBySlugProvider = FutureProvider.family<ArticleDetail, String>(
  (ref, slug) async {
    final service = ref.watch(articlesServiceProvider);
    return service.getBySlug(slug);
  },
);

/// admin 草稿列表(需要 ADMIN token)。
final draftsProvider = FutureProvider<PaginatedResponse<ArticleSummary>>(
  (ref) async {
    final service = ref.watch(articlesServiceProvider);
    return service.listAdmin(status: ArticleStatus.draft, pageSize: 50);
  },
);
