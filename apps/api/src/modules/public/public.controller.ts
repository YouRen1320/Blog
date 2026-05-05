import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/**
 * 公开接口聚合在一起,统一加 @Public() 跳过 JWT。
 *
 * 路径设计原则:
 * - 文章列表 / 详情:/articles、/articles/:slug
 * - 按分类 / 标签筛选:/categories/:slug/articles、/tags/:slug/articles
 *
 * 列表只返回简略信息(无 content),详情才带正文,避免列表 payload 过大。
 */
@Public()
@Controller()
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('articles')
  listArticles(@Query() query: PaginationQueryDto) {
    return this.service.listArticles(query);
  }

  /**
   * 全文搜索:`/search?q=xxx`。无 q 或 q 太长返空。
   * 上限 20 条,够首屏展示。
   */
  @Get('search')
  search(@Query('q') q: string) {
    return this.service.search(q ?? '');
  }

  @Get('articles/:slug')
  articleDetail(@Param('slug') slug: string) {
    return this.service.findArticleBySlug(slug);
  }

  /** V1.20:同分类下最新 3 篇,排除自己。空数组合法。 */
  @Get('articles/:slug/related')
  related(@Param('slug') slug: string) {
    return this.service.relatedArticles(slug);
  }

  @Get('categories/:slug/articles')
  byCategory(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.service.listByCategory(slug, query);
  }

  @Get('tags/:slug/articles')
  byTag(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.service.listByTag(slug, query);
  }
}
