import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/articles')
@Roles('ADMIN')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

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
