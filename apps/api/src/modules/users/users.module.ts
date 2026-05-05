import { Module } from '@nestjs/common';
import {
  UsersController,
  AdminUsersController,
} from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
