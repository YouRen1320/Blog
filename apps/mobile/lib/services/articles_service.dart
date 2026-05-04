import 'package:dio/dio.dart';
import '../models/article.dart';
import 'api_client.dart';

class ArticlesService {
  final ApiClient _client;
  ArticlesService(this._client);

  // ── 公开接口 ────────────────────────────────────────
  Future<PaginatedResponse<ArticleSummary>> listPublished({
    int page = 1,
    int pageSize = 20,
  }) async {
    final res = await _client.dio.get('/articles', queryParameters: {
      'page': page,
      'pageSize': pageSize,
    });
    return PaginatedResponse.fromJson(
      res.data as Map<String, dynamic>,
      ArticleSummary.fromJson,
    );
  }

  Future<ArticleDetail> getBySlug(String slug) async {
    final res = await _client.dio.get('/articles/$slug');
    if (res.statusCode == 404) {
      throw DioException(
        requestOptions: res.requestOptions,
        response: res,
        type: DioExceptionType.badResponse,
        message: '文章不存在',
      );
    }
    return ArticleDetail.fromJson(res.data as Map<String, dynamic>);
  }

  // ── 后台接口(需要 ADMIN token) ─────────────────────
  Future<PaginatedResponse<ArticleSummary>> listAdmin({
    int page = 1,
    int pageSize = 20,
    ArticleStatus? status,
  }) async {
    final res = await _client.dio.get('/admin/articles', queryParameters: {
      'page': page,
      'pageSize': pageSize,
      if (status != null) 'status': _statusToServer(status),
    });
    return PaginatedResponse.fromJson(
      res.data as Map<String, dynamic>,
      ArticleSummary.fromJson,
    );
  }

  Future<ArticleDetail> createDraft({
    required String title,
    required String content,
    String? slug,
    String? summary,
    List<String>? tagIds,
    String? categoryId,
  }) async {
    final res = await _client.dio.post('/admin/articles', data: {
      'title': title,
      'content': content,
      if (slug != null && slug.isNotEmpty) 'slug': slug,
      if (summary != null && summary.isNotEmpty) 'summary': summary,
      if (tagIds != null) 'tagIds': tagIds,
      if (categoryId != null) 'categoryId': categoryId,
    });
    return ArticleDetail.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ArticleDetail> getAdminById(String id) async {
    final res = await _client.dio.get('/admin/articles/$id');
    return ArticleDetail.fromJson(res.data as Map<String, dynamic>);
  }

  String _statusToServer(ArticleStatus s) => switch (s) {
        ArticleStatus.draft => 'DRAFT',
        ArticleStatus.published => 'PUBLISHED',
        ArticleStatus.archived => 'ARCHIVED',
      };
}
