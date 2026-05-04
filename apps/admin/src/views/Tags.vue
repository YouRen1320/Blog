<template>
  <!--
    /tags —— 后台「标签」管理：
      · 顶部 hero 卡：mono kicker + 大标题 + 简短副标
      · 标签管理表：mono caption 列头 + 可编辑的标签行
        每行：标签名 · 文章数 · 编辑 / 删除
      · 顶部右侧"+ 新建"按钮（占位，未接 API）
  -->
  <AdminShell active="tags">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker">TAGS</div>
            <div class="kicker-rule" />
            <h1 class="cn title">标签管理</h1>
            <p class="cn lede">管理博客里所有的标签。{{ tags.length }} 个标签，共标记 {{ totalCount }} 篇。</p>
          </div>
          <button class="primary" type="button">+ 新建标签</button>
        </div>
      </header>

      <section class="card table">
        <div class="row head mono">
          <span>NAME</span>
          <span>SLUG</span>
          <span>COUNT</span>
          <span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="tag in tags" :key="tag.slug" class="row body">
          <span class="serif name">#{{ tag.name }}</span>
          <span class="mono slug">{{ tag.slug }}</span>
          <span class="mono count">{{ tag.count }}</span>
          <span class="actions">
            <button class="link" type="button">编辑</button>
            <button class="link danger" type="button">删除</button>
          </span>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AdminShell from '../components/AdminShell.vue'

// 标签管理数据：后续接 NestJS 的 GET /api/tags
const tags = [
  { name: 'typescript', slug: 'typescript', count: 31 },
  { name: 'writing', slug: 'writing', count: 22 },
  { name: 'nestjs', slug: 'nestjs', count: 18 },
  { name: 'essay', slug: 'essay', count: 18 },
  { name: 'nuxt', slug: 'nuxt', count: 14 },
  { name: 'reading', slug: 'reading', count: 13 },
  { name: 'llm', slug: 'llm', count: 11 },
  { name: 'prisma', slug: 'prisma', count: 9 },
  { name: 'design', slug: 'design', count: 9 },
  { name: 'vue', slug: 'vue', count: 8 },
  { name: 'monorepo', slug: 'monorepo', count: 7 },
  { name: 'postgres', slug: 'postgres', count: 7 },
  { name: 'flutter', slug: 'flutter', count: 6 },
  { name: 'notes', slug: 'notes', count: 6 },
  { name: 'rag', slug: 'rag', count: 5 },
  { name: 'docker', slug: 'docker', count: 4 },
  { name: 'git', slug: 'git', count: 4 },
  { name: 'agent', slug: 'agent', count: 3 },
]

const totalCount = computed(() => tags.reduce((s, t) => s + t.count, 0))
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.hero { padding: 32px 36px; }

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
}

.kicker-rule {
  width: 18px;
  height: 1px;
  background: var(--ink-3);
  margin: 4px 0 14px;
}

.title {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.lede {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 0;
}

.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.primary:hover { opacity: 0.92; }

.table { padding: 8px 0; }

.row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 16px;
  padding: 14px 32px;
  align-items: center;
}

.row.head {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  border-bottom: 1px solid var(--rule);
}

.row.body {
  border-top: 1px solid var(--rule);
}
.row.body:first-of-type { border-top: 0; }

.row.body:hover { background: var(--bg); }

.actions-head { text-align: right; }

.name {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
}

.slug {
  font-size: 12px;
  color: var(--ink-3);
}

.count {
  font-size: 12px;
  color: var(--ink-2);
}

.actions {
  display: flex;
  gap: 14px;
  justify-content: flex-end;
}

.link {
  background: transparent;
  border: 0;
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}
.link:hover { color: var(--ink); }
.link.danger:hover { color: #B95C50; }
</style>
