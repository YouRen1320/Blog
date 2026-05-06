import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
// import { RegisterDto } from './dto/register.dto'; // 注册关闭后暂不引入
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // strict 档:5 req/min。比默认严,防爆破。
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /**
   * 公开注册 —— 单作者博客阶段先关闭,只保留 ADMIN 在后台 /admin/users
   * 创建账号。日后想开放注册时,把下面整段取消注释 + 同步打开
   * apps/admin 的 /register 路由 + Login 页入口即可。
   */
  // @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  // @Public()
  // @HttpCode(HttpStatus.CREATED)
  // @Post('register')
  // register(@Body() dto: RegisterDto) {
  //   return this.auth.register(dto.username, dto.email, dto.password);
  // }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return user;
  }

  // 改密码同样走 strict 限流(5/min),防止暴力试探当前密码
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Patch('password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
