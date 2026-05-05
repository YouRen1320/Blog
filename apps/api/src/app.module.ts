import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { PublicModule } from './modules/public/public.module';
import { AiModule } from './modules/ai/ai.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
      validate: validateEnv,
    }),
    // 结构化日志:
    // - 生产 NODE_ENV=production:JSON 直出,便于 loki / grafana 收集
    // - 开发 development:pretty-print,带颜色和时间
    // - 自动给每个 HTTP 请求生成 reqId 串起 inbound + outbound 调用
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'HH:MM:ss' },
              },
        autoLogging: {
          ignore: (req) => req.url === '/healthz' || req.url === '/articles',
        },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
    // 速率限制:三档命名,具体接口用 @Throttle 显式覆盖
    // - default:60 req/min,基线
    // - strict :5 req/min,登录等防爆破
    // - ai     :10 req/min,AI 生成防 quota 烧光
    // 测试环境(NODE_ENV=test)放宽到很高,避免 e2e 测试被限流误伤
    ThrottlerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? [
            { name: 'default', ttl: 60_000, limit: 10_000 },
            { name: 'strict', ttl: 60_000, limit: 10_000 },
            { name: 'ai', ttl: 60_000, limit: 10_000 },
          ]
        : [
            { name: 'default', ttl: 60_000, limit: 60 },
            { name: 'strict', ttl: 60_000, limit: 5 },
            { name: 'ai', ttl: 60_000, limit: 10 },
          ],
    ),
    PrismaModule,
    EmbeddingModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    PublicModule,
    AiModule,
  ],
  providers: [
    // 守卫顺序:Throttler → Jwt → Roles
    // 测试环境跳过 ThrottlerGuard,避免 e2e 测试被 5/min 限流误伤
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [{ provide: APP_GUARD, useClass: ThrottlerGuard }]),
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
