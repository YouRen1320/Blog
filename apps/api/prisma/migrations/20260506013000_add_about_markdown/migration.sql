-- AlterTable: SiteSetting 加 aboutMarkdown 字段(默认空,/about 页未设时显示占位)
ALTER TABLE "site_settings" ADD COLUMN "aboutMarkdown" TEXT NOT NULL DEFAULT '';
