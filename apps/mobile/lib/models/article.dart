// 文章数据类。
// - ArticleSummary:列表用,无 content
// - ArticleDetail:详情用,带 content + author
// - 后端公开接口和 admin 接口共享这些字段(admin 多 status / authorId)

enum ArticleStatus { draft, published, archived }

ArticleStatus _statusFrom(String s) {
  switch (s) {
    case 'PUBLISHED':
      return ArticleStatus.published;
    case 'ARCHIVED':
      return ArticleStatus.archived;
    case 'DRAFT':
    default:
      return ArticleStatus.draft;
  }
}

class CategoryRef {
  final String id;
  final String name;
  final String slug;
  const CategoryRef({required this.id, required this.name, required this.slug});

  factory CategoryRef.fromJson(Map<String, dynamic> j) => CategoryRef(
        id: j['id'] as String,
        name: j['name'] as String,
        slug: j['slug'] as String,
      );
}

class TagRef {
  final String id;
  final String name;
  final String slug;
  const TagRef({required this.id, required this.name, required this.slug});

  factory TagRef.fromJson(Map<String, dynamic> j) => TagRef(
        id: j['id'] as String,
        name: j['name'] as String,
        slug: j['slug'] as String,
      );
}

class AuthorRef {
  final String id;
  final String username;
  const AuthorRef({required this.id, required this.username});
  factory AuthorRef.fromJson(Map<String, dynamic> j) => AuthorRef(
        id: j['id'] as String,
        username: j['username'] as String,
      );
}

class ArticleSummary {
  final String id;
  final String title;
  final String slug;
  final String? summary;
  final String? cover;
  final ArticleStatus? status; // 公开接口不返回 status
  final DateTime? publishedAt;
  final CategoryRef? category;
  final List<TagRef> tags;

  const ArticleSummary({
    required this.id,
    required this.title,
    required this.slug,
    this.summary,
    this.cover,
    this.status,
    this.publishedAt,
    this.category,
    this.tags = const [],
  });

  factory ArticleSummary.fromJson(Map<String, dynamic> j) {
    final tagsRaw = j['tags'] as List? ?? const [];
    return ArticleSummary(
      id: j['id'] as String,
      title: j['title'] as String,
      slug: j['slug'] as String,
      summary: j['summary'] as String?,
      cover: j['cover'] as String?,
      status: j['status'] != null ? _statusFrom(j['status'] as String) : null,
      publishedAt: j['publishedAt'] != null ? DateTime.parse(j['publishedAt'] as String) : null,
      category: j['category'] != null ? CategoryRef.fromJson(j['category'] as Map<String, dynamic>) : null,
      tags: tagsRaw.map((t) {
        // 公开接口形态:{ tag: { id, name, slug } }
        // admin 接口形态相同
        final m = t as Map<String, dynamic>;
        return TagRef.fromJson(m['tag'] as Map<String, dynamic>);
      }).toList(),
    );
  }
}

class ArticleDetail extends ArticleSummary {
  final String content;
  final AuthorRef? author;

  const ArticleDetail({
    required super.id,
    required super.title,
    required super.slug,
    super.summary,
    super.cover,
    super.status,
    super.publishedAt,
    super.category,
    super.tags,
    required this.content,
    this.author,
  });

  factory ArticleDetail.fromJson(Map<String, dynamic> j) {
    final base = ArticleSummary.fromJson(j);
    return ArticleDetail(
      id: base.id,
      title: base.title,
      slug: base.slug,
      summary: base.summary,
      cover: base.cover,
      status: base.status,
      publishedAt: base.publishedAt,
      category: base.category,
      tags: base.tags,
      content: j['content'] as String,
      author: j['author'] != null ? AuthorRef.fromJson(j['author'] as Map<String, dynamic>) : null,
    );
  }
}

class PaginatedResponse<T> {
  final List<T> data;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  const PaginatedResponse({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> j,
    T Function(Map<String, dynamic>) itemFromJson,
  ) {
    final meta = j['meta'] as Map<String, dynamic>;
    return PaginatedResponse(
      data: (j['data'] as List).map((e) => itemFromJson(e as Map<String, dynamic>)).toList(),
      page: meta['page'] as int,
      pageSize: meta['pageSize'] as int,
      total: meta['total'] as int,
      totalPages: meta['totalPages'] as int,
    );
  }
}
