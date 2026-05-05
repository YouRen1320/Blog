-- 启用 pgvector(全新 DB 走这条 migration 时必须先建扩展)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "embedding" vector(512);
