import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { makeSlug } from '../../common/utils/slug';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug ?? makeSlug(dto.name),
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    // 这里不会级联删 articles,因为 schema 里 article.category 用了 SetNull
    return this.prisma.category.delete({ where: { id } });
  }
}
