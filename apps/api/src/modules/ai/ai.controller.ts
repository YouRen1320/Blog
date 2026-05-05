import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { CreateAiDraftDto } from './dto/create-draft.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';

@Controller('admin/ai')
@Roles('ADMIN')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * 非流式生成 —— 一次拿完整草稿落库。
   * ai 档:10 req/min,防 quota 一夜烧光。
   */
  @Throttle({ ai: { limit: 10, ttl: 60_000 } })
  @Post('drafts')
  generateDraft(@CurrentUser() user: AuthUser, @Body() dto: CreateAiDraftDto) {
    return this.ai.createDraft(user.id, dto);
  }

  /**
   * 流式生成 —— SSE 边写边推到前端,流末自动落库。
   * 上游 ai-service 走 markdown 流式输出,NestJS 在这里做"中间人":
   *   - chunk 事件直接转发给 admin
   *   - draft 事件拦下,流结束后用它落库
   *   - 落库成功补发 saved 事件 + articleId
   * 用 @Res() 而不是 @Sse():@Sse 要 RxJS Observable,我们直接 pipe 上游字节更简单。
   */
  @Throttle({ ai: { limit: 10, ttl: 60_000 } })
  @Post('drafts/stream')
  async streamDraft(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAiDraftDto,
    @Res() res: ExpressResponse,
  ) {
    await this.ai.streamDraft(user.id, dto, res);
  }
}
