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

@Controller('admin/articles')
@Roles('ADMIN')
export class ArticlesController {
  constructor(
    private readonly service: ArticlesService,
    private readonly embedding: EmbeddingService,
  ) {}

  /**
   * 给老文章批量回填 embedding(只处理 PUBLISHED 且 embedding 为 NULL 的)。
   * 同步处理,串行调用 BGE,每篇 ~2-3s,响应可能要几十秒到几分钟,
   * 前端调用时要把 axios timeout 调大。
   * 注意路径在 :id 之前注册,避免被 @Get(':id') / @Patch(':id') 拦截。
   */
  @Post('backfill-embeddings')
  backfillEmbeddings() {
    return this.embedding.backfillMissingEmbeddings();
  }

  @Get()
  list(@Query() query: ArticleQueryDto) {
    return this.service.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArticleDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }
}
