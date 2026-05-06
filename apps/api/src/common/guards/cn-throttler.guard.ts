import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * 把 nestjs-throttler 默认抛的 "ThrottlerException: Too Many Requests"
 * 替换为中文提示。前端不翻译时也能直接展示给用户看。
 *
 * 注意:throwThrottlingException 是 ThrottlerGuard 的 protected 方法,
 * 这里 override 即可,所有命名桶(default / strict / ai)走同一条文案。
 */
@Injectable()
export class CnThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('请求太频繁,请稍后再试');
  }
}
