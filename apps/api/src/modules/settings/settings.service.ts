import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

/**
 * 站点配置 service。
 *
 * 数据形态:`site_settings` 表只有一行,id="singleton"。Migration 已经
 * 插入这行,正常情况下查不到时也用 upsert 兜底,避免线上空表。
 *
 * 公开 vs 管理:`getPublic()` 只返回展示字段(title/tagline/icp),
 * `getAdmin()` 返回全部。这样 AI 模型名 / JWT 配置等不会泄漏到 web 端。
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensure() {
    return this.prisma.siteSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  /** web 端用,只返回前台需要的展示字段。 */
  async getPublic() {
    const s = await this.ensure();
    return {
      title: s.title,
      tagline: s.tagline,
      icp: s.icp,
      aboutMarkdown: s.aboutMarkdown,
    };
  }

  /** admin 用,返回完整配置。 */
  async getAdmin() {
    return this.ensure();
  }

  /** PATCH 语义:只更新提供的字段。返回完整最新配置。 */
  async update(dto: UpdateSettingsDto) {
    await this.ensure();
    return this.prisma.siteSetting.update({
      where: { id: SINGLETON_ID },
      data: dto,
    });
  }
}
