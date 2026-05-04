<template>
  <!--
    /editor —— v3 AdminEditorV3：左主编辑区 + 右 320px AI 助手栏。
    左：mono 顶部条（返回 / 草稿态 / 上次保存）→ 共和历月份小标 →
        标题 + 副标 input → 正文（演示了一处 AI 内联建议高亮）。
    右：当前建议卡 + 快捷动作 + 相关 RAG 列表（带百分比）。
  -->
  <AdminShell active="writing">
    <div class="layout">
      <section class="card editor">
        <div class="mono topbar">
          <span>← WRITING</span>
          <span>·</span>
          <span>DRAFT · AI ASSISTED</span>
          <span>·</span>
          <span class="accent">SAVED {{ savedAgo }}s</span>
        </div>

        <div class="mono kicker">{{ post.season }}</div>
        <div class="kicker-rule" />

        <input
          v-model="post.title"
          class="cn title-input"
          placeholder="标题"
        />
        <input
          v-model="post.subtitle"
          class="cn subtitle-input"
          placeholder="副标"
        />

        <div class="cn body">
          <p>查戈斯群岛——这串散落在印度洋中部的珊瑚环礁，对于绝大多数人来说，是一个完全陌生的地名。</p>
          <p>
            但若提起它的顶级域名 <span class="mono inline-code">.io</span>，<span class="ai-suggest">开发者们便不会陌生<span class="mono ai-hint">✦ AI 建议 · ↵ 接受 · ESC 略过</span></span>
          </p>
          <p class="dim">继续写作…</p>
        </div>
      </section>

      <aside class="card aside">
        <div class="mono section-kicker accent">✦ AI ASSIST</div>

        <div class="suggestion">
          <div class="mono suggestion-meta">SUGGESTION 1 / 3</div>
          <p class="cn suggestion-text">第二章可以用一个具体例子开篇。当前过渡较为隐晦。</p>
          <div class="mono suggestion-keys">
            <span class="accent">↵ 应用</span>
            <span>↓ 下一条</span>
            <span>ESC 关</span>
          </div>
        </div>

        <div>
          <div class="mono section-kicker">QUICK ACTIONS</div>
          <button v-for="a in quickActions" :key="a" class="quick-action" type="button">
            {{ a }}<span class="quick-arrow">→</span>
          </button>
        </div>

        <div>
          <div class="mono section-kicker">RELATED · RAG</div>
          <div v-for="r in related" :key="r.title" class="related">
            <span class="cn related-title">{{ r.title }}</span>
            <span class="mono related-score">{{ r.score }}%</span>
          </div>
        </div>
      </aside>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'

// 用 reactive 让标题/副标的双向绑定生效；后续接 NestJS 时改成 store。
const post = reactive({
  season: 'VENDÉMIAIRE',
  title: '查戈斯群岛与 .io 的命运',
  subtitle: '献与被遗忘者。',
})

// 假装的"上次保存"时间，单位秒；真实场景应来自 PATCH 响应。
const savedAgo = ref(12)

const quickActions = [
  '改写 — 简洁',
  '从光标续写',
  '翻译为英文',
  '生成 3 个标签',
  '查找相关笔记',
]

const related = [
  { title: '局部吸引子', score: 94 },
  { title: 'Hello, Mitra', score: 78 },
  { title: '岁时录二十四', score: 64 },
]
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  min-height: calc(100vh - 48px);
}

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.editor { padding: 32px 44px; }

.topbar {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.topbar .accent { color: var(--accent); }

.kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-top: 28px;
}

.kicker-rule {
  width: 18px;
  height: 1px;
  background: var(--ink-3);
  margin-top: 4px;
  margin-bottom: 18px;
}

.title-input {
  width: 100%;
  border: 0;
  font-size: 32px;
  font-weight: 600;
  background: transparent;
  color: var(--ink);
  outline: none;
  padding: 0;
  letter-spacing: -0.01em;
}

.subtitle-input {
  width: 100%;
  border: 0;
  font-size: 16px;
  background: transparent;
  color: var(--ink-2);
  outline: none;
  padding: 8px 0 18px;
  border-bottom: 1px solid var(--rule);
}

.body {
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink-2);
  margin-top: 28px;
}
.body p { margin: 0 0 14px; }
.body .dim { color: var(--ink-4); }

.inline-code {
  font-size: 14px;
  background: var(--bg);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--ink);
}

.ai-suggest {
  background: rgba(107, 122, 90, 0.12);
  padding: 0 4px;
  border-radius: 3px;
  color: var(--ink);
  position: relative;
}

.ai-hint {
  display: block;
  font-size: 9px;
  color: var(--accent);
  margin-top: 2px;
  letter-spacing: 0.12em;
}

.aside {
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-self: start;
  position: sticky;
  top: 24px;
}

.section-kicker {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.section-kicker.accent { color: var(--accent); }

.suggestion {
  background: var(--bg);
  border-radius: 12px;
  padding: 14px 16px;
}

.suggestion-meta {
  font-size: 9px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  margin-bottom: 8px;
}

.suggestion-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
}

.suggestion-keys {
  display: flex;
  gap: 14px;
  font-size: 10px;
  color: var(--ink-3);
  margin-top: 10px;
}
.suggestion-keys .accent { color: var(--accent); }

.quick-action {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: var(--bg);
  border: 0;
  border-radius: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.quick-action:hover { color: var(--ink); }
.quick-arrow { float: right; color: var(--ink-3); }

.related {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-top: 1px solid var(--rule);
}

.related-title {
  font-size: 13px;
  color: var(--ink-2);
}

.related-score {
  font-size: 10px;
  color: var(--accent);
}

@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; }
  .aside { position: static; }
}
</style>
