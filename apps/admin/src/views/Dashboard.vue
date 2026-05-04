<template>
  <!--
    /dashboard —— v3 AdminDashV3 仪表盘：
      · 顶部欢迎卡：mono kicker + 短分隔线 + 大标题
      · 4 列指标卡（mono caption + 大数字 + accent 增量）
      · 下面分两栏：左 = 近 7 天活动；右 = AI 收件箱预览
  -->
  <AdminShell active="dashboard">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">GOOD MORNING</div>
        <div class="kicker-rule" />
        <h1 class="cn hero-title">有 {{ inbox.length }} 篇 AI 草稿在等你。</h1>
      </header>

      <div class="metrics">
        <div v-for="m in metrics" :key="m.label" class="card metric">
          <div class="mono metric-label">{{ m.label.toUpperCase() }}</div>
          <div class="serif metric-value">{{ m.value }}</div>
          <div class="metric-delta">{{ m.delta }}</div>
        </div>
      </div>

      <div class="split">
        <section class="card">
          <div class="mono section-kicker">RECENT ACTIVITY · 7 DAYS</div>
          <div
            v-for="(row, i) in activities"
            :key="i"
            class="row"
            :class="{ first: i === 0 }"
          >
            <span
              class="mono row-action"
              :class="{ accent: row.action === 'ai draft' }"
            >{{ row.action.toUpperCase() }}</span>
            <span class="cn row-title">{{ row.title }}</span>
            <span class="mono row-time">{{ row.time }}</span>
          </div>
        </section>

        <section class="card">
          <div class="mono section-kicker accent">✦ AI INBOX · {{ inbox.length }} PENDING</div>
          <div v-for="(d, i) in inbox" :key="i" class="inbox-row" :class="{ first: i === 0 }">
            <div class="cn inbox-title">{{ d.title }}</div>
            <div class="mono inbox-meta">{{ d.meta }}</div>
          </div>
          <RouterLink to="/inbox" class="inbox-cta">查看全部 →</RouterLink>
        </section>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'

// 4 个指标卡。delta 走 accent 色，所以正负都用同一种色调（设计一致性优先）。
const metrics = [
  { label: '已发布', value: '47', delta: '+3 本月' },
  { label: '草稿', value: '12', delta: '4 篇 AI' },
  { label: '30 天访问', value: '24,891', delta: '+18%' },
  { label: '订阅者', value: '1,204', delta: '+42 本周' },
]

// 近期活动；action 走 mono 上标，title 走 cn 大字，time 走 mono 右对齐。
const activities = [
  { action: 'published', title: 'Hello, Mitra', time: '2 小时前' },
  { action: 'ai draft', title: '关于 agent 编排的笔记', time: '4 小时前' },
  { action: 'edited', title: '查戈斯群岛与 .io', time: '昨天' },
  { action: 'reviewed', title: 'prisma × nestjs', time: '2 天前' },
]

// AI 收件箱预览，与 /inbox 共享数据结构（后续抽到 store）。
const inbox = [
  { title: '上线一个小 AI 功能的笔记', meta: 'flutter · 12m' },
  { title: '关于 prisma migration 的三件事', meta: 'prompt · 14m' },
  { title: '为什么写作总在前一晚', meta: 'flutter · 38m' },
  { title: 'monorepo 自律的小记', meta: 'prompt · 1h' },
]
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.hero { padding: 32px 36px; }

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

.hero-title {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric {
  border-radius: 14px;
  padding: 20px 22px;
}

.metric-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.metric-delta {
  font-size: 11px;
  color: var(--accent);
  margin-top: 4px;
}

.split {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.section-kicker {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  margin-bottom: 14px;
  padding: 24px 28px 0;
}
.section-kicker.accent { color: var(--accent); padding: 24px 24px 0; }

.row {
  display: grid;
  grid-template-columns: 90px 1fr 70px;
  gap: 14px;
  padding: 12px 28px;
  border-top: 1px solid var(--rule);
  align-items: baseline;
}
.row.first { border-top: 0; }

.row-action {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}
.row-action.accent { color: var(--accent); }

.row-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

.row-time {
  font-size: 10px;
  color: var(--ink-3);
  text-align: right;
}

.inbox-row {
  padding: 12px 24px;
  border-top: 1px solid var(--rule);
}
.inbox-row.first { border-top: 0; }

.inbox-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.inbox-meta {
  font-size: 10px;
  color: var(--ink-3);
  margin-top: 2px;
}

.inbox-cta {
  display: block;
  margin: 14px 24px 24px;
  padding: 10px 0;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 12px;
  color: var(--ink-2);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.inbox-cta:hover { color: var(--ink); }

@media (max-width: 1100px) {
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .split { grid-template-columns: 1fr; }
}
</style>
