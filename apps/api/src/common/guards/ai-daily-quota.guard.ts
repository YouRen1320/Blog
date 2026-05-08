import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * AI 每日配额守卫 —— 给 role=USER 的测试者用,每个自然日(北京时间)最多 N 次。
 * ADMIN 直接放过。配额跨 3 个 AI 入口(drafts/stream / inline / transcribe)共享。
 *
 * 实现说明:
 * - 计数存内存 Map,容器重启会清零。对于"每日 3 次"的语义,重启多送几次不构成安全问题。
 * - 入口处计数(不管业务是否成功),避免恶意触发失败重试绕过。
 * - 不持久化、不审计——如果以后需要看测试者用了哪些 prompt,再换 DB 表。
 *
 * 自然日按北京时间(UTC+8)切分,跟用户直觉对齐。Date 字符串作为 key 的一部分,
 * 跨日自动重置。每个 userId 在 Map 里最多一个 entry,空间稳定。
 */
@Injectable()
export class AiDailyQuotaGuard implements CanActivate {
  static readonly DAILY_LIMIT = 3;

  private readonly buckets = new Map<
    string,
    { date: string; count: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) return true; // JwtAuthGuard 在前,正常不会走到这里;留个 noop 兜底
    if (user.role === 'ADMIN') return true;

    const today = beijingDateKey();
    const entry = this.buckets.get(user.id);

    if (!entry || entry.date !== today) {
      this.buckets.set(user.id, { date: today, count: 1 });
      return true;
    }

    if (entry.count >= AiDailyQuotaGuard.DAILY_LIMIT) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `今日 AI 调用已达上限(${AiDailyQuotaGuard.DAILY_LIMIT} 次/天),明天再来。`,
          quota: { limit: AiDailyQuotaGuard.DAILY_LIMIT, used: entry.count },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }
}

/** 北京时间今日的 YYYY-MM-DD,跟服务器本地时区无关。 */
function beijingDateKey(): string {
  const beijingMs = Date.now() + 8 * 60 * 60 * 1000;
  return new Date(beijingMs).toISOString().slice(0, 10);
}
