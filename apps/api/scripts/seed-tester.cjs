/**
 * 创建/更新测试者账号(role=USER) —— 幂等。
 *
 * 这是个**公开的 demo 账号**:密码默认 'tester12345',admin 登录页直接预填。
 * 因为它本来就要让任何人能登(只能写草稿、AI 每日 3 次),密码不是 secret。
 * 想换密码就传 TESTER_PASSWORD,记得同步改 apps/admin/src/views/Login.vue 的 DEMO_PASSWORD。
 *
 * 为什么是 .cjs 而不是 .ts:
 *   生产容器只装 production 依赖,ts-node 不在;但 @prisma/client + bcryptjs 在。
 *   纯 CommonJS JS 可以直接被生产 node 跑,不用编译。本地开发也能直接 `node` 跑。
 *
 * 用法:
 *   本地:cd apps/api && pnpm seed:tester
 *   生产:docker compose -f docker-compose.prod.yml --env-file .env.production \
 *         exec api node scripts/seed-tester.cjs
 *
 * 行为:
 *   - 首次跑:创建 role=USER 的账号
 *   - 重复跑:更新密码 + 强制 role=USER(防止误改成 ADMIN 后忘了)
 *   - 不动 username 之外的关联(文章、评论等都保留)
 */
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const email = process.env.TESTER_EMAIL || 'tester@iyouren.top';
const username = process.env.TESTER_USERNAME || 'tester';
const password = process.env.TESTER_PASSWORD || 'tester12345';

if (password.length < 8) {
  console.error('❌ TESTER_PASSWORD 至少 8 位');
  process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: UserRole.USER },
      create: { email, username, passwordHash, role: UserRole.USER },
    });
    console.log(`✅ 测试账号就绪`);
    console.log(`   email   : ${user.email}`);
    console.log(`   username: ${user.username}`);
    console.log(`   role    : ${user.role}`);
    console.log(`   登录入口:https://admin.iyouren.top`);
  } catch (e) {
    console.error('❌ Seed 失败:', e.message ?? e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
