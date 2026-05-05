import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * 公开读:web 端拉站点标题 / 副标 / ICP,无需鉴权。
 */
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly service: SettingsService) {}

  @Public()
  @Get()
  get() {
    return this.service.getPublic();
  }
}

/**
 * 管理员读 + 改:返回全部字段,改完返回最新值给前端 dirty 比对。
 */
@Controller('admin/settings')
@Roles('ADMIN')
export class AdminSettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get() {
    return this.service.getAdmin();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.service.update(dto);
  }
}
