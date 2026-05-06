import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { CnThrottlerGuard } from './common/guards/cn-throttler.guard';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { PublicModule } from './modules/public/public.module';
import { AiModule } from './modules/ai/ai.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CommentsModule } from './modules/comments/comments.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StatsModule } from './modules/stats/stats.module';
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
    // - default:200 req/min,基线(后台一次进 dashboard 就 4-6 个并发请求,
    //                         留余量给路由切换 + admin 重渲染)
    // - strict :高基线,登录/注册/改密在 controller 上 @Throttle 收紧到 5/min
    // - ai     :高基线,AI inline / drafts 在 controller 上 @Throttle 收紧到 10/min
    // ! nestjs-throttler 多桶语义:每个命名桶都对所有请求生效,即使 controller 没用 @Throttle。
    //   所以 strict / ai 的"基线"必须够大,否则普通 GET 都会被收紧到 5 / 10。
    // 测试环境(NODE_ENV=test)放宽到很高,避免 e2e 测试被限流误伤
    ThrottlerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? [
            { name: 'default', ttl: 60_000, limit: 10_000 },
            { name: 'strict', ttl: 60_000, limit: 10_000 },
            { name: 'ai', ttl: 60_000, limit: 10_000 },
          ]
        : [
            { name: 'default', ttl: 60_000, limit: 200 },
            { name: 'strict', ttl: 60_000, limit: 1000 },
            { name: 'ai', ttl: 60_000, limit: 1000 },
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
    SettingsModule,
    CommentsModule,
    UploadsModule,
    StatsModule,
    // 把上传的图片暴露成 /uploads/* 静态文件给 web / admin 直接访问
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        // 一年浏览器 + CDN 缓存(文件名是 hash,改图自动换 URL)
        maxAge: '365d',
        immutable: true,
      },
    }),
  ],
  providers: [
    // 守卫顺序:Throttler → Jwt → Roles
    // 测试环境跳过 ThrottlerGuard,避免 e2e 测试被 5/min 限流误伤
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [{ provide: APP_GUARD, useClass: CnThrottlerGuard }]),
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
