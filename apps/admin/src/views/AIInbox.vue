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

        <form class="generate-form" @submit.prevent="onGenerate">
          <input
            v-model="prompt"
            class="input prompt"
            placeholder="让 AI 起草:写一篇 ___ 的文章 …"
            :disabled="generating"
          />
          <select v-model="tone" class="input" :disabled="generating">
            <option value="technical">技术 · 严谨</option>
            <option value="casual">随笔 · 轻盈</option>
            <option value="poetic">诗意 · 抒情</option>
            <option value="narrative">记叙 · 故事</option>
          </select>
          <select v-model="length" class="input" :disabled="generating">
            <option value="short">短</option>
            <option value="medium">中</option>
            <option value="long">长</option>
          </select>
          <button class="primary" type="submit" :disabled="generating || !prompt.trim()">
            {{ generating ? '生成中…' : '✦ 生成草稿' }}
          </button>
        </form>
        <p v-if="error" class="error mono">{{ error }}</p>
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
import { generateAiDraft } from '../api/ai'
import { extractErrorMessage } from '../composables/useApiError'

const drafts = ref<ArticleSummary[]>([])
const loading = ref(false)
const error = ref('')
const activeId = ref<string | null>(null)

const prompt = ref('')
const tone = ref<'technical' | 'casual' | 'poetic' | 'narrative'>('technical')
const length = ref<'short' | 'medium' | 'long'>('medium')
const generating = ref(false)

const active = computed(() => drafts.value.find((d) => d.id === activeId.value))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listArticles({ status: 'DRAFT', pageSize: 50 })
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

async function onGenerate() {
  generating.value = true
  error.value = ''
  try {
    const created = await generateAiDraft({
      prompt: prompt.value.trim(),
      tone: tone.value,
      length: length.value,
    })
    prompt.value = ''
    await load()
    activeId.value = created.id // 高亮刚生成的
  } catch (e) {
    error.value = extractErrorMessage(e, '生成失败,确认 ai-service 已启动')
  } finally {
    generating.value = false
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
  grid-template-columns: 2fr 0.8fr 0.6fr auto;
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
