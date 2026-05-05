-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "title" TEXT NOT NULL DEFAULT 'YouRen',
    "tagline" TEXT NOT NULL DEFAULT 'An element-soul who writes.',
    "icp" TEXT NOT NULL DEFAULT '',
    "aiModel" TEXT NOT NULL DEFAULT 'mimo-v2.5-pro',
    "aiThreshold" INTEGER NOT NULL DEFAULT 85,
    "aiStreaming" BOOLEAN NOT NULL DEFAULT true,
    "aiRagRelated" BOOLEAN NOT NULL DEFAULT true,
    "jwtHours" INTEGER NOT NULL DEFAULT 24,
    "requireMfa" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- 插入 singleton 行,后续 update 走 upsert
INSERT INTO "site_settings" ("id", "updatedAt") VALUES ('singleton', NOW());
