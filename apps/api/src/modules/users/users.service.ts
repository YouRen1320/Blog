import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  paginate,
  type PaginationQueryDto,
} from '../../common/dto/pagination.dto';

const userPublicSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /** ADMIN 端用户列表(分页),按注册时间倒序。 */
  async listAdmin(query: PaginationQueryDto) {
    const { page, pageSize } = query;
    // 不用 $transaction batch(同 comments 那个 v1.3 踩过的 self-relation 边界 bug)
    const total = await this.prisma.user.count();
    const data = await this.prisma.user.findMany({
      select: userPublicSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return paginate(data, total, page, pageSize);
  }

  /**
   * 改 role。规则:
   * - 不能动自己的 role(防止 ADMIN 不小心把自己降级)
   * - 不能把最后一个 ADMIN 降级(防止系统失去 ADMIN)
   */
  async updateRole(targetId: string, role: UserRole, currentUserId: string) {
    if (targetId === currentUserId) {
      throw new BadRequestException('不能修改自己的 role');
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('用户不存在');

    if (target.role === UserRole.ADMIN && role === UserRole.USER) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ConflictException('至少需要保留一个 ADMIN,无法降级最后一个');
      }
    }
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: userPublicSelect,
    });
  }

  /**
   * 删除用户。规则:
   * - 不能删自己
   * - 不能删最后一个 ADMIN
   * - 该用户名下文章会因为 schema `onDelete: Restrict` 阻止删除,前端先迁移 / 删文章
   */
  async remove(targetId: string, currentUserId: string) {
    if (targetId === currentUserId) {
      throw new BadRequestException('不能删除自己');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      include: { _count: { select: { articles: true } } },
    });
    if (!target) throw new NotFoundException('用户不存在');

    if (target.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ConflictException('至少需要保留一个 ADMIN,无法删除最后一个');
      }
    }
    if (target._count.articles > 0) {
      throw new ConflictException(
        `用户名下还有 ${target._count.articles} 篇文章,先删除或转移再删用户`,
      );
    }
    await this.prisma.user.delete({ where: { id: targetId } });
  }
}
