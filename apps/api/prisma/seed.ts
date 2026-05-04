/**
 * 种子数据脚本
 *
 * 用途:本地开发 / e2e 测试时把数据库重置到一个已知状态。
 * 跑法:`pnpm db:seed`(已经在根 .env 注入 DATABASE_URL 后调用)
 *
 * 设计原则:
 * - 幂等:重复跑不会报错(用 upsert)
 * - 数据简单可读:看一眼就知道环境是 demo 状态
 * - 不要在这里塞业务逻辑;只造静态测试数据
 */
import { PrismaClient, ArticleStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── 管理员 ──────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@iyouren.top" },
    update: {},
    create: {
      email: "admin@iyouren.top",
      username: "admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // ── 分类 ─────────────────────────────────────────
  const categoriesData = [
    { name: "前端", slug: "frontend", description: "Web 前端工程实践" },
    { name: "后端", slug: "backend", description: "NestJS / Prisma / 数据库" },
    { name: "DevOps", slug: "devops", description: "Docker / CI/CD / 部署" },
  ];
  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );

  // ── 标签 ─────────────────────────────────────────
  const tagsData = [
    { name: "TypeScript", slug: "typescript" },
    { name: "Vue", slug: "vue" },
    { name: "Nuxt", slug: "nuxt" },
    { name: "NestJS", slug: "nestjs" },
    { name: "Prisma", slug: "prisma" },
  ];
  const tags = await Promise.all(
    tagsData.map((t) =>
      prisma.tag.upsert({
        where: { slug: t.slug },
        update: {},
        create: t,
      }),
    ),
  );

  // ── 文章 ─────────────────────────────────────────
  const backend = categories.find((c) => c.slug === "backend")!;
  const frontend = categories.find((c) => c.slug === "frontend")!;
  const tagNest = tags.find((t) => t.slug === "nestjs")!;
  const tagPrisma = tags.find((t) => t.slug === "prisma")!;
  const tagVue = tags.find((t) => t.slug === "vue")!;
  const tagTs = tags.find((t) => t.slug === "typescript")!;

  await prisma.article.upsert({
    where: { slug: "hello-blog" },
    update: {},
    create: {
      title: "你好,博客",
      slug: "hello-blog",
      summary: "这是 Blog 项目的第一篇示例文章,用于验证种子数据。",
      content: `# 你好,博客

这是一个**示例文章**,由 V1-02 的 seed 脚本写入。

如果你能在网页上看到这篇,说明从数据库到接口到前端的整条链路都跑通了。`,
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: backend.id,
      publishedAt: new Date(),
      tags: {
        create: [{ tagId: tagNest.id }, { tagId: tagPrisma.id }],
      },
    },
  });

  await prisma.article.upsert({
    where: { slug: "draft-vue-component" },
    update: {},
    create: {
      title: "Vue 组件设计草稿",
      slug: "draft-vue-component",
      summary: "草稿状态的文章,用于验证 admin 的草稿管理。",
      content: "这是一篇还没发布的草稿。",
      status: ArticleStatus.DRAFT,
      authorId: admin.id,
      categoryId: frontend.id,
      tags: {
        create: [{ tagId: tagVue.id }, { tagId: tagTs.id }],
      },
    },
  });

  console.log("✅ Seed 完成");
  console.log("   管理员:admin@iyouren.top / admin12345");
  console.log(`   文章:已发布 1 篇 + 草稿 1 篇`);
  console.log(`   分类:${categories.length} 个,标签:${tags.length} 个`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
