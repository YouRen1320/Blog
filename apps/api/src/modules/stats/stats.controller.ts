import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * `/admin/stats/overview` —— Dashboard 用的全局聚合数据。
 * ADMIN-only(USER 看自己 stats 等多用户深耕时再说,留 v1.x+)。
 */
@Controller('admin/stats')
@Roles('ADMIN')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  overview() {
    return this.service.overview();
  }
}
