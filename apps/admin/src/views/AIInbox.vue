<template>
  <!--
    /inbox —— v3 AIInboxV3：左 320 列表 + 右草稿预览主区。
    左：草稿条目，第一条默认选中（带 var(--bg) 高亮）；
    右：草稿元信息条（mono accent，模型 + 完成度）→ 大标题 + 副标 →
        正文 prose → 来源备忘录卡 → 操作按钮组（重生 / 丢弃 / 编辑并通过）。
  -->
  <AdminShell active="drafts">
    <div class="layout">
      <aside class="card list">
        <div class="mono list-kicker">✦ AI INBOX · {{ items.length }}</div>
        <button
          v-for="(d, i) in items"
          :key="d.id"
          type="button"
          class="list-row"
          :class="{ active: i === activeIdx, first: i === 0 }"
          @click="activeIdx = i"
        >
          <div class="cn list-title">{{ d.title }}</div>
          <div class="mono list-meta">{{ d.meta }}</div>
        </button>
      </aside>

      <section class="card preview">
        <div class="mono preview-kicker accent">
          ✦ AI DRAFT · {{ active.confidence }}% · {{ active.model }}
        </div>
        <div class="preview-rule" />

        <h2 class="cn preview-title">{{ active.title }}</h2>
        <p class="cn preview-sub">{{ active.subtitle }}</p>

        <div class="cn preview-body">
          <p>
            上线一个小 AI 功能，最大的工作量在于决定它<em>不做</em>什么。
            诱惑总是让模型站到聚光灯下；真正的活儿是反过来——让它消失到工作流里去。
          </p>
          <p>
            这个博客的第一版 AI 助手做得太多了：建议标题、改写段落、生成标签、挑封面、写摘要——一次性都来。结果就是一个我从来不打开的侧栏。
          </p>
          <p class="dim">… 还有 5 段。</p>
        </div>

        <div class="source">
          <div class="mono source-kicker">SOURCE · VOICE TRANSCRIPT</div>
          <p class="cn source-text">
            “嗯我想写一个关于上线一个小 AI 功能的事情，我一直在想的是第一版做得太多了……”
          </p>
        </div>

        <div class="actions">
          <button class="btn" type="button">重新生成</button>
          <button class="btn" type="button">丢弃</button>
          <span class="spacer" />
          <button class="btn primary" type="button">编辑并通过 →</button>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'

// 草稿列表；后续接 NestJS 时换成 fetch /api/ai/drafts。
const items = [
  {
    id: 1,
    title: '上线一个小 AI 功能的笔记',
    meta: 'flutter · 12m',
    subtitle: '从 2 分钟语音备忘录生成 · 720 字',
    confidence: 87,
    model: 'GPT-4.1',
  },
  {
    id: 2,
    title: '关于 prisma migration 的三件事',
    meta: 'prompt · 14m',
    subtitle: '基于 prompt 生成 · 540 字',
    confidence: 81,
    model: 'GPT-4.1',
  },
  {
    id: 3,
    title: '为什么写作总在前一晚',
    meta: 'flutter · 38m',
    subtitle: '从 1 分钟语音备忘录生成 · 480 字',
    confidence: 74,
    model: 'GPT-4.1',
  },
  {
    id: 4,
    title: 'monorepo 自律的小记',
    meta: 'prompt · 1h',
    subtitle: '基于 prompt 生成 · 612 字',
    confidence: 79,
    model: 'GPT-4.1',
  },
]

// 当前选中的索引；预览面板从这一项读数据。
const activeIdx = ref(0)
const active = computed(() => items[activeIdx.value])
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: calc(100vh - 48px);
}

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.list { padding: 24px 0; overflow: hidden; }

.list-kicker {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--accent);
  padding: 0 24px 16px;
}

.list-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 24px;
  border: 0;
  border-top: 1px solid var(--rule);
  background: transparent;
  cursor: pointer;
}
.list-row.first { border-top: 0; }
.list-row.active { background: var(--bg); }
.list-row:hover { background: var(--bg); }

.list-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

.list-meta {
  font-size: 10px;
  color: var(--ink-3);
  margin-top: 4px;
}

.preview { padding: 32px 40px; }

.preview-kicker {
  font-size: 10px;
  letter-spacing: 0.16em;
}
.preview-kicker.accent { color: var(--accent); }

.preview-rule {
  width: 18px;
  height: 1px;
  background: var(--accent);
  margin: 4px 0 16px;
}

.preview-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.preview-sub {
  font-size: 14px;
  color: var(--ink-3);
  font-style: italic;
  margin: 8px 0 0;
}

.preview-body {
  font-size: 15px;
  line-height: 1.85;
  color: var(--ink-2);
  margin-top: 32px;
}
.preview-body p { margin: 0 0 14px; }
.preview-body .dim { color: var(--ink-4); }

.source {
  background: var(--bg);
  border-radius: 12px;
  padding: 18px 22px;
  margin-top: 28px;
}

.source-kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.source-text {
  font-size: 13px;
  font-style: italic;
  color: var(--ink-3);
  margin: 0;
  line-height: 1.65;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 32px;
  align-items: center;
}

.spacer { flex: 1; }

.btn {
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.btn:hover { color: var(--ink); }

.btn.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  padding: 10px 22px;
  font-weight: 500;
}
.btn.primary:hover { opacity: 0.92; }

@media (max-width: 1000px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
