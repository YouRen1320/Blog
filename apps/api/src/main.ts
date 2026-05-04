import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  Logger.log(`🚀 API listening on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
