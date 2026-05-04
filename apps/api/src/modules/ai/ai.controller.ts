import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiDraftDto } from './dto/create-draft.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/ai')
@Roles('ADMIN')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * 用 AI 生成一篇草稿并落库。
   * 路径放在 /admin/ai 下,只有 ADMIN 能访问 ——
   * 移动端的"AI 帮我写"按钮也走这个端点(用户必须是登录的 ADMIN)。
   */
  @Post('drafts')
  generateDraft(@CurrentUser() user: AuthUser, @Body() dto: CreateAiDraftDto) {
    return this.ai.createDraft(user.id, dto);
  }
}
