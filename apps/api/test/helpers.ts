import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 启动一个完整的 Nest app(跟生产配置一致),供 e2e 用。
 * 关闭管道颜色 / disable 一些日志可以让测试输出更干净,这里图省事就用默认。
 */
export async function bootstrapTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/**
 * 把数据库重置到一个干净的"只有 admin"状态。
 * 注意:不能 drop schema,因为 e2e 跟开发用同一个 DB(简化设置);
 * 所以采用按 FK 反向顺序 deleteMany。
 */
export async function resetDb(prisma: PrismaService) {
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * 标准 admin 账号 + 拿到 token 的 helper。
 */
export const TEST_ADMIN = {
  email: 'e2e-admin@iyouren.top',
  username: 'e2e-admin',
  password: 'admin12345',
};

export async function ensureAdmin(prisma: PrismaService) {
  const passwordHash = await bcrypt.hash(TEST_ADMIN.password, 10);
  return prisma.user.upsert({
    where: { email: TEST_ADMIN.email },
    update: {},
    create: {
      email: TEST_ADMIN.email,
      username: TEST_ADMIN.username,
      passwordHash,
      role: 'ADMIN',
    },
  });
}
