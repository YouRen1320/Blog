import { Module, OnModuleInit } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { UploadsController } from './uploads.controller';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads');

@Module({ controllers: [UploadsController] })
export class UploadsModule implements OnModuleInit {
  /** 启动时确保目录存在,避免首次上传 ENOENT。 */
  onModuleInit() {
    mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
}
