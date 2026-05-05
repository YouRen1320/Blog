import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * 全局异常过滤器:把所有抛出的错误映射成统一格式的 JSON。
 *
 * 形状:
 *   { statusCode, message, path, timestamp }
 *
 * 处理三类错误:
 * 1. NestJS 的 HttpException(controller / pipe / guard 抛出的)
 * 2. Prisma 的已知错误(如 unique 冲突 P2002)→ 映射到合适的 HTTP 状态
 * 3. 其它未知错误 → 500
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as any).message ?? exception.message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 唯一约束冲突 → 409
      // P2025 记录不存在 → 404
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta as any)?.target;
          message = `已存在相同的 ${Array.isArray(target) ? target.join(',') : (target ?? '记录')}`;
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = '记录不存在';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
