import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 全局 Prisma 数据库客户端封装。
 *
 * 选用 NestJS 模块化方式而不是裸 PrismaClient 单例的原因:
 * - 复用 NestJS 的生命周期钩子(模块启动/停止时连断开连接,避免泄漏)
 * - 测试里好替换(@nestjs/testing 提供 mock provider)
 * - 与 ConfigModule 配合,future 可注入连接池配置
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
