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
