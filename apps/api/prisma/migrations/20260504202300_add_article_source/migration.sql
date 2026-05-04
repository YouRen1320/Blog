-- CreateEnum
CREATE TYPE "ArticleSource" AS ENUM ('MANUAL', 'AI');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "source" "ArticleSource" NOT NULL DEFAULT 'MANUAL';
