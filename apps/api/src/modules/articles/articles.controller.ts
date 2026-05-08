import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';

/**
 * V1.6 起 admin/articles 不再限定 ADMIN —— 任何登录 USER 都能 CRUD 自己的文章。
 * - listAdmin / findByIdScoped 在 service 层按 user.role 过滤(USER 只看自己)
 * - update / delete 走 assertOwnership(USER 只能动自己;ADMIN 全权)
 *
 * backfillEmbeddings 是全局批量任务,继续 ADMIN-only。
 * publish / unpublish 自 V1.x 起也限 ADMIN —— 测试者(USER)只能保存草稿,
 * 上下线由 ADMIN 决定,防止外部 USER 直接发文到公开站。
 */
@Controller('admin/articles')
export class ArticlesController {
  constructor(
    private readonly service: ArticlesService,
    private readonly embedding: EmbeddingService,
  ) {}

  /** 全局批量回填,ADMIN 限定。 */
  @Roles('ADMIN')
  @Post('backfill-embeddings')
  backfillEmbeddings() {
    return this.embedding.backfillMissingEmbeddings();
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ArticleQueryDto) {
    return this.service.listAdmin(query, user);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findByIdScoped(id, user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArticleDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.service.update(id, user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, user);
  }

  @Roles('ADMIN')
  @Patch(':id/publish')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.publish(id, user);
  }

  @Roles('ADMIN')
  @Patch(':id/unpublish')
  unpublish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.unpublish(id, user);
  }
}
