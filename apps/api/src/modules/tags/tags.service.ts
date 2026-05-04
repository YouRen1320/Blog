import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { makeSlug } from '../../common/utils/slug';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    });
  }

  async findById(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('标签不存在');
    return tag;
  }

  create(dto: CreateTagDto) {
    return this.prisma.tag.create({
      data: {
        name: dto.name,
        slug: dto.slug ?? makeSlug(dto.name),
      },
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findById(id);
    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, slug: dto.slug },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    // schema 里 ArticleTag.tag 是 onDelete: Cascade,关联记录会被自动清掉
    return this.prisma.tag.delete({ where: { id } });
  }
}
