import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 标 @Global() 是因为 PrismaService 几乎每个业务模块都要用,
 * 不想每个模块的 imports 数组里都重复写一遍 PrismaModule。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
