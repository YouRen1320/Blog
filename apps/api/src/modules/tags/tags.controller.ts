import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * GET 任何登录用户都可读(测试者写文章要勾标签);
 * POST/PATCH/DELETE 仅 ADMIN(防止 USER 乱建标签)。
 */
@Controller('admin/tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.service.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
