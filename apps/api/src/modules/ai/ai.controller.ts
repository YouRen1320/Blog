import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { CreateAiDraftDto } from './dto/create-draft.dto';
import { AiDailyQuotaGuard } from '../../common/guards/ai-daily-quota.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';

/**
 * V1.x:AI 接口对所有登录用户开放(原来 ADMIN-only)。
 * - ADMIN 不限次数,只受 ai 档 10/min 限流约束
 * - USER(测试者)受 AiDailyQuotaGuard 控制,每日 3 次跨入口共享
 */
@Controller('admin/ai')
@UseGuards(AiDailyQuotaGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

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

  /**
   * 编辑器内联 AI(续写 / 改写 / 扩写 / 摘要 / 起标题)。
   * body 不走 NestJS DTO 校验,直接透传给 ai-service —— InlineRequest schema 在 Python 端校验。
   * 这种"中间人 SSE"用 @Body() 接 unknown + @Res() 自己写流即可。
   * ai 档限流 10/min,跟流式生成共享 quota。
   */
  @Throttle({ ai: { limit: 10, ttl: 60_000 } })
  @Post('inline')
  async inline(@Body() body: unknown, @Res() res: ExpressResponse) {
    await this.ai.streamInline(body, res);
  }

  /**
   * 语音转文字。multipart/form-data 字段 file(audio/m4a / wav / mp3 / webm)。
   * 上限 10MB,转写慢时占资源,所以走 ai 档限流(10/min)。
   */
  @Throttle({ ai: { limit: 10, ttl: 60_000 } })
  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    return this.ai.transcribe(file);
  }
}
