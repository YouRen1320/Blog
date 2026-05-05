import { Module } from '@nestjs/common';
import {
  PublicCommentsController,
  AdminCommentsController,
} from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [PublicCommentsController, AdminCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
