<template>
  <!--
    /inbox —— AI 草稿收件箱(V4-05 接真实数据):
    左:草稿列表(只显示 status=DRAFT 的文章,新建顺序倒序)
    右:选中草稿的预览 + 操作按钮(进编辑器 / 删除)
    顶部:输入 prompt → 生成 → 自动刷新列表
  -->
  <AdminShell active="drafts">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker accent">✦ AI INBOX · {{ drafts.length }} PENDING</div>
            <div class="kicker-rule" />
            <h1 class="cn title">AI 草稿收件箱</h1>
            <p class="cn lede">未发布的草稿(包括 AI 生成 + 移动端 + 后台手写)。</p>
          </div>
        </div>

        <!--
          表单只保留流式生成:非流式入口的同步等待容易撞 90s 超时,体验差。
          流式 SSE 边写边推,既快又能让用户看到进度。
        -->
        <form class="generate-form" @submit.prevent="onStreamGenerate">
          <input
            v-model="prompt"
            class="input prompt"
            placeholder="让 AI 起草:写一篇 ___ 的文章 …"
            :disabled="streaming"
          />
          <select v-model="tone" class="input" :disabled="streaming">
            <option value="technical">技术 · 严谨</option>
            <option value="casual">随笔 · 轻盈</option>
            <option value="poetic">诗意 · 抒情</option>
            <option value="narrative">记叙 · 故事</option>
          </select>
          <select v-model="length" class="input" :disabled="streaming">
            <option value="short">短</option>
            <option value="medium">中</option>
            <option value="long">长</option>
          </select>
          <button class="primary" type="submit" :disabled="streaming || !prompt.trim()">
            {{ streaming ? '生成中…' : '✦ 生成草稿' }}
          </button>
        </form>
        <p v-if="error" class="error mono">{{ error }}</p>

        <!-- 流式生成时的实时预览面板:边写边渲染,完成后自动跳编辑器 -->
        <section v-if="streaming || streamBuffer" class="card stream-panel">
          <div class="mono stream-kicker">
            STREAMING ·
            <span :class="['dot', streaming ? 'live' : 'done']" />
            {{ streaming ? '正在生成' : (streamSavedId ? '已落库' : '已结束') }}
          </div>
          <pre class="stream-text">{{ streamBuffer }}<span v-if="streaming" class="cursor">▌</span></pre>
          <div v-if="streamSavedId" class="actions">
            <RouterLink :to="`/editor/${streamSavedId}`" class="primary">
              进入编辑器 →
            </RouterLink>
          </div>
        </section>
      </header>

      <div v-if="loading" class="card empty mono">LOADING…</div>
      <div v-else-if="drafts.length === 0" class="card empty mono">收件箱空了。让 AI 帮你写一篇。</div>

      <div v-else class="layout">
        <aside class="card list">
          <button
            v-for="(d, i) in drafts"
            :key="d.id"
            type="button"
            class="list-row"
            :class="{ active: activeId === d.id, first: i === 0 }"
            @click="activeId = d.id"
          >
            <div class="cn list-title">{{ d.title }}</div>
            <div class="mono list-meta">/{{ d.slug }} · {{ formatDate(d.updatedAt) }}</div>
          </button>
        </aside>

        <section v-if="active" class="card preview">
          <div class="mono preview-kicker">DRAFT · {{ formatDate(active.updatedAt) }}</div>
          <div class="preview-rule" />
          <h2 class="cn preview-title">{{ active.title }}</h2>
          <p v-if="active.summary" class="cn preview-sub">{{ active.summary }}</p>
          <div class="meta-row mono">
            <span v-if="active.category">◐ {{ active.category.name }}</span>
            <span v-for="t in active.tags" :key="t.tag.id">#{{ t.tag.name }}</span>
          </div>
          <div class="cn preview-body">
            <pre>{{ truncated(active) }}</pre>
          </div>
          <div class="actions">
            <RouterLink :to="`/editor/${active.id}`" class="primary">编辑并审核 →</RouterLink>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { listArticles, type ArticleSummary } from '../api/articles'
import { streamAiDraft } from '../api/ai'
import { extractErrorMessage } from '../composables/useApiError'

const drafts = ref<ArticleSummary[]>([])
const loading = ref(false)
const error = ref('')
const activeId = ref<string | null>(null)

const prompt = ref('')
const tone = ref<'technical' | 'casual' | 'poetic' | 'narrative'>('technical')
const length = ref<'short' | 'medium' | 'long'>('medium')

// 流式生成状态
const streaming = ref(false)
const streamBuffer = ref('')
const streamSavedId = ref<string | null>(null)

const active = computed(() => drafts.value.find((d) => d.id === activeId.value))

async function load() {
  loading.value = true
  error.value = ''
  try {
    // 收件箱只看 AI 草稿(手动建的草稿走 /articles 列表)
    const res = await listArticles({ status: 'DRAFT', source: 'AI', pageSize: 50 })
    drafts.value = res.data
    if (drafts.value.length > 0 && !activeId.value) {
      activeId.value = drafts.value[0].id
    }
  } catch (e) {
    error.value = extractErrorMessage(e, '加载草稿失败')
  } finally {
    loading.value = false
  }
}

/**
 * 流式生成:走 SSE 端点,边收 chunk 边拼到 streamBuffer。
 * 收到 saved 事件后自动刷新草稿列表 + 提供"进入编辑器"快捷入口。
 */
async function onStreamGenerate() {
  if (streaming.value) return
  streaming.value = true
  error.value = ''
  streamBuffer.value = ''
  streamSavedId.value = null
  const text = prompt.value.trim()
  try {
    await streamAiDraft(
      { prompt: text, tone: tone.value, length: length.value },
      (e) => {
        if (e.type === 'chunk') streamBuffer.value += e.text
        else if (e.type === 'saved') streamSavedId.value = e.articleId
        else if (e.type === 'error') error.value = e.message
      },
    )
    if (streamSavedId.value) {
      prompt.value = ''
      await load()
      activeId.value = streamSavedId.value
    }
  } catch (e) {
    error.value = extractErrorMessage(e, '流式生成失败')
  } finally {
    streaming.value = false
  }
}

onMounted(load)

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// list 接口返回的 article 不带 content;这里展示就用 summary 即可,完整正文进编辑器看
function truncated(a: ArticleSummary): string {
  return a.summary || '（详细正文请进编辑器查看）'
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.hero { padding: 32px 36px; }
.hero-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker.accent { color: var(--accent); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.lede { font-size: 13px; color: var(--ink-2); margin: 8px 0 0; }

.generate-form {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 2fr 0.8fr 0.6fr auto auto;
  gap: 10px;
  align-items: center;
}
.input {
  padding: 10px 14px; background: var(--bg); border: 1px solid var(--rule);
  border-radius: 10px; font-size: 13px; color: var(--ink); outline: none;
}
.input:focus { border-color: var(--accent); }
.input.prompt { font-family: inherit; }

.primary {
  background: var(--ink); color: var(--bg); border: 0;
  padding: 10px 16px; border-radius: 10px; font-size: 12px;
  font-weight: 500; cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.primary:hover { opacity: 0.92; }
.primary:disabled { opacity: 0.5; cursor: progress; }

.error { color: #c0392b; font-size: 12px; padding: 8px 0 0; }

.ghost {
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.ghost:hover { color: var(--ink); border-color: var(--ink); }
.ghost:disabled { opacity: 0.5; cursor: not-allowed; }

/* 流式预览面板:实时展示 LLM 推送的 markdown,带闪烁光标和状态点 */
.stream-panel {
  margin-top: 18px;
  padding: 18px 22px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 12px;
}
.stream-kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.live  { background: var(--accent); animation: pulse 1.2s infinite; }
.dot.done  { background: var(--ink-3); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
.stream-text {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 360px;
  overflow-y: auto;
  margin: 0;
  padding: 4px 0;
}
.cursor {
  color: var(--accent);
  animation: blink 1s steps(2) infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.empty { padding: 40px; text-align: center; color: var(--ink-3); font-size: 11px; letter-spacing: 0.16em; }

.layout { display: grid; grid-template-columns: 320px 1fr; gap: 16px; min-height: 480px; }
.list { padding: 12px 0; overflow-y: auto; max-height: 70vh; }
.list-row {
  display: block; width: 100%; text-align: left; padding: 12px 22px;
  background: transparent; border: 0; border-top: 1px solid var(--rule);
  cursor: pointer; color: inherit;
}
.list-row.first { border-top: 0; }
.list-row:hover { background: var(--bg); }
.list-row.active { background: var(--bg); }
.list-title { font-size: 13px; font-weight: 500; color: var(--ink); }
.list-meta { font-size: 10px; color: var(--ink-3); margin-top: 3px; }

.preview { padding: 28px 32px; }
.preview-kicker { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); }
.preview-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 16px; }
.preview-title { font-size: 24px; font-weight: 600; margin: 0; color: var(--ink); }
.preview-sub { font-size: 14px; color: var(--ink-2); margin: 10px 0 0; }
.meta-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; font-size: 10px; color: var(--ink-3); letter-spacing: 0.12em; }
.preview-body {
  margin-top: 22px; padding: 16px; background: var(--bg); border-radius: 10px;
  font-size: 13px; color: var(--ink-2); line-height: 1.7;
  max-height: 220px; overflow: auto;
}
.preview-body pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; }

.actions { margin-top: 22px; display: flex; gap: 10px; }
</style>
