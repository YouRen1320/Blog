import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Roles } from '../../common/decorators/roles.decorator';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads');

// 只接图片,白名单 mime 比 ext 严
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * admin 端图片上传。
 *
 * - 路径:`POST /admin/uploads`(multipart/form-data,字段名 `file`)
 * - 校验:mime 白名单 + ≤ 8MB
 * - 文件名:随机 hash 防止上传同名覆盖,扩展名保留
 * - 存储:本地磁盘 `UPLOAD_ROOT`(默认 `/app/uploads`,docker 挂 volume 持久化)
 * - 返回:`{ url: "/uploads/<hash>.ext", filename, size, mimetype }`
 *
 * 公开访问:Caddy `www.iyouren.top/uploads/*` 反代到 api,
 * NestJS app.module 用 `ServeStaticModule` 暴露 `UPLOAD_ROOT` 到 `/uploads`。
 */
@Controller('admin/uploads')
@Roles('ADMIN')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          return cb(
            new BadRequestException(
              `不支持的图片类型 ${file.mimetype}(允许 jpeg/png/webp/gif/avif)`,
            ),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
        filename: (_req, file, cb) => {
          const hash = randomBytes(12).toString('hex');
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${hash}${ext}`);
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未收到文件,字段名应为 file');
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
