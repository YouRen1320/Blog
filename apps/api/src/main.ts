// OTel 必须在所有业务 import 之前初始化,否则 auto-instrumentation 拿不到入口 hook
import './instrumentation';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // 接管 NestJS 默认 Logger,所有 service 里 new Logger() 也走 pino
  app.useLogger(app.get(PinoLogger));

  // 上线后会被 Caddy / Nginx 反代,trust proxy 让 throttler 取到真实客户端 IP
  // 而不是反代的 IP(否则一个反代过来全是同一 IP,被严格限流误伤)
  app.set('trust proxy', 1);

  // 安全头(HSTS / X-Content-Type-Options 等)
  app.use(helmet());

  // 跨域:V1 本地开发先允许全部,V2 部署再收紧到具体域名
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? [/iyouren\.top$/] : true,
    credentials: true,
  });

  // 全局校验管道:自动校验 DTO + 拒绝未声明的字段
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局异常过滤器:统一错误格式
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  app.get(PinoLogger).log(`🚀 API listening on http://localhost:${port}`);
}
bootstrap();
