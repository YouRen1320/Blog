<template>
  <!--
    /writing —— 文章总列表（v3 chlo.is mood）：
    单列 720px，按年份分组；每条只显示标题 + 共和历月份 + 日期，
    以「目录」感而非「卡片」感呈现。详情页跳到 /writing/[slug]。
  -->
  <section class="page">
    <header class="head">
      <div class="mono kicker">WRITING · {{ totalPosts }} IN TOTAL</div>
      <div class="kicker-rule" />
      <h1 class="cn title">写作</h1>
      <p class="cn lede">这里收录我在博客上公开发布的文章。按年份倒序排列。</p>
    </header>

    <div class="years">
      <section v-for="group in groupedPosts" :key="group.year" class="year-block">
        <h2 class="cn year-title">{{ group.year }}</h2>

        <ol class="list">
          <li v-for="post in group.items" :key="`${group.year}-${post.slug}`" class="row">
            <span class="mono row-date">{{ post.date }}</span>
            <NuxtLink :to="`/writing/${post.slug}`" class="cn row-title">
              {{ post.title }}
            </NuxtLink>
            <span class="mono row-month">{{ post.monthFr }}</span>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
// 文章存档：每条记录最少必要字段。`slug` 拼到 /writing/[slug] 路由。
// monthFr 是法国共和历月份（mono 小标签贯穿 v3 各页面）。
const archive = [
  {
    year: 2026,
    items: [
      { title: 'Hello, Mitra', slug: 'hello-mitra', date: '04-28', monthFr: 'PLUVIÔSE' },
      { title: 'Hello, Stalwart', slug: 'hello-stalwart', date: '04-26', monthFr: 'PLUVIÔSE' },
      { title: '学习重新写作 · 三十', slug: 'rewriting-30', date: '04-14', monthFr: 'GERMINAL' },
      { title: '「环节」', slug: 'rings', date: '03-29', monthFr: 'VENDÉMIAIRE' },
      { title: '局部吸引子', slug: 'local-attractor', date: '03-17', monthFr: 'PLUVIÔSE' },
      { title: '岁时录（二十四）', slug: 'yearly-24', date: '03-13', monthFr: 'FLORÉAL' },
      { title: 'Adult', slug: 'adult', date: '03-10', monthFr: 'VENTÔSE' },
      { title: '06', slug: 'lattraction', date: '03-08', monthFr: 'ÉQUINOXE' },
      { title: 'Hello, Sequoia PGP', slug: 'hello-sequoia', date: '03-05', monthFr: 'PLUVIÔSE' },
    ],
  },
  {
    year: 2025,
    items: [
      { title: '查戈斯群岛与 .io 的命运', slug: 'chagos-io', date: '08-06', monthFr: 'VENDÉMIAIRE' },
    ],
  },
]

// 直接使用，模板用 v-for 即可。
const groupedPosts = archive

// 给副标题用的总数。
const totalPosts = computed(() =>
  archive.reduce((sum, group) => sum + group.items.length, 0)
)
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 48px; }

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

.years {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.year-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
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
  letter-spacing: -0.01em;
}
.row-title:hover { color: var(--accent); }

.row-month {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
}
</style>
