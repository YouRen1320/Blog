<template>
  <!--
    /tags —— v3 设计的标签页：
    顶部 mono kicker 给出标签总数；标题 + lede；
    中部一张大卡片，里面把所有标签按权重（字号）排列，形成自然的「标签云」；
    底部接一个「最近被标记」短列表，与 /writing 列表风格一致。
  -->
  <section class="page">
    <header class="head">
      <div class="mono kicker">TAGS · {{ tags.length }} IN TOTAL</div>
      <div class="kicker-rule" />
      <h1 class="cn title">所有标签，按权重排列。</h1>
      <p class="cn lede">园子里所有写过的题目，都收在这里。</p>
    </header>

    <!-- 标签云：font-size 由权重 size 决定 -->
    <div class="cloud">
      <a
        v-for="tag in tags"
        :key="tag.slug"
        class="tag serif"
        :style="{ fontSize: `${tag.size}px` }"
        href="#"
      >
        #{{ tag.name }}<span class="mono count">{{ tag.count }}</span>
      </a>
    </div>

    <!-- 最近被标记 -->
    <div class="recent">
      <div class="mono kicker">RECENTLY TAGGED · WRITING</div>
      <div class="kicker-rule" />

      <ol class="list">
        <li v-for="row in recent" :key="row.slug" class="row">
          <span class="mono row-date">{{ row.date }}</span>
          <NuxtLink :to="`/writing/${row.slug}`" class="cn row-title">
            {{ row.title }}
          </NuxtLink>
          <span class="cn row-summary">{{ row.summary }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
// 标签数据：name/count/size。size 直接当 px 字号，按手感分级。
// slug 留给将来的 /tags/[slug] 路由。
const tags = [
  { name: 'nestjs', slug: 'nestjs', count: 18, size: 28 },
  { name: 'writing', slug: 'writing', count: 22, size: 32 },
  { name: 'typescript', slug: 'typescript', count: 31, size: 40 },
  { name: 'essay', slug: 'essay', count: 18, size: 28 },
  { name: 'nuxt', slug: 'nuxt', count: 14, size: 24 },
  { name: 'reading', slug: 'reading', count: 13, size: 22 },
  { name: 'llm', slug: 'llm', count: 11, size: 20 },
  { name: 'prisma', slug: 'prisma', count: 9, size: 18 },
  { name: 'design', slug: 'design', count: 9, size: 18 },
  { name: 'monorepo', slug: 'monorepo', count: 7, size: 16 },
  { name: 'postgres', slug: 'postgres', count: 7, size: 16 },
  { name: 'flutter', slug: 'flutter', count: 6, size: 16 },
  { name: 'rag', slug: 'rag', count: 5, size: 14 },
  { name: 'docker', slug: 'docker', count: 4, size: 14 },
  { name: 'agent', slug: 'agent', count: 3, size: 13 },
  { name: 'vue', slug: 'vue', count: 8, size: 17 },
  { name: 'notes', slug: 'notes', count: 6, size: 16 },
  { name: 'git', slug: 'git', count: 4, size: 14 },
]

// 最近被打上 tag 的文章。
const recent = [
  { date: '2026-04-28', slug: 'hello-mitra', title: 'Hello, Mitra', summary: '契约既成……' },
  { date: '2026-04-14', slug: 'rewriting-30', title: '学习重新写作 · 三十', summary: '一些写作的练习。' },
  { date: '2026-03-13', slug: 'yearly-24', title: '岁时录（二十四）', summary: '写周报好了。' },
]
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 40px; }

.kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.kicker-rule {
  width: 24px;
  height: 1px;
  background: var(--ink-3);
  margin-bottom: 22px;
}

.title {
  font-size: 36px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  font-size: 15px;
  color: var(--ink-2);
  margin: 14px 0 0;
}

.cloud {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 36px 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: baseline;
}

.tag {
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;
}
.tag:hover { color: var(--accent); }

.count {
  font-size: 10px;
  color: var(--ink-3);
  margin-left: 4px;
  vertical-align: middle;
}

.recent { margin-top: 56px; }

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 120px 1fr 1.2fr;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
  align-items: baseline;
}

.row-date {
  font-size: 11px;
  color: var(--ink-3);
}

.row-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
}
.row-title:hover { color: var(--accent); }

.row-summary {
  font-size: 14px;
  color: var(--ink-2);
}

@media (max-width: 640px) {
  .row { grid-template-columns: 80px 1fr; }
  .row-summary { grid-column: 1 / -1; padding-left: 96px; }
}
</style>
