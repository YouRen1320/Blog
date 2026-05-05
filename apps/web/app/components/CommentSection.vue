<template>
  <!-- Article comment section: list APPROVED + anonymous submit form. -->
  <section class="comments">
    <header class="comments-head">
      <h2 class="cn">评论</h2>
      <span class="mono count">{{ comments.length }} 条</span>
    </header>

    <div v-if="loading" class="muted">加载中…</div>

    <ol v-else-if="comments.length > 0" class="list">
      <li v-for="c in comments" :key="c.id" class="item">
        <div class="head">
          <span class="serif name">{{ c.authorName }}</span>
          <span class="mono time">{{ formatTime(c.createdAt) }}</span>
        </div>
        <p class="content">{{ c.content }}</p>
      </li>
    </ol>

    <div v-else class="muted">还没有评论。来当第一个吧。</div>

    <!-- 提交表单 -->
    <form class="form" @submit.prevent="onSubmit">
      <h3 class="cn form-title">发表评论</h3>
      <p class="muted hint">
        评论会先经过审核才会公开显示。邮箱仅用于联系,**不会公开**。
      </p>

      <div class="row">
        <input
          v-model.trim="form.authorName"
          class="input"
          type="text"
          placeholder="昵称(必填)"
          maxlength="40"
          required
        />
        <input
          v-model.trim="form.authorEmail"
          class="input"
          type="email"
          placeholder="邮箱(必填,不公开)"
          required
        />
      </div>

      <textarea
        v-model="form.content"
        class="textarea"
        placeholder="想说点什么?"
        maxlength="1000"
        rows="5"
        required
      />

      <div v-if="message" :class="['msg', kind]">{{ message }}</div>

      <div class="actions">
        <span class="mono len">{{ form.content.length }} / 1000</span>
        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? '提交中…' : '提交评论' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useArticleComments, submitComment } from '../composables/useComments'

const props = defineProps<{ slug: string }>()

// useFetch SSR + 客户端共享。后端默认 ASC,旧→新
const { data, pending: loading, refresh } = await useArticleComments(props.slug)
const comments = computed(() => data.value?.data ?? [])

const form = reactive({
  authorName: '',
  authorEmail: '',
  content: '',
})

const submitting = ref(false)
const message = ref('')
const kind = ref<'info' | 'error' | 'success'>('info')

async function onSubmit() {
  if (form.content.length < 1) {
    setMsg('error', '评论不能为空')
    return
  }
  submitting.value = true
  setMsg('info', '正在提交…')
  try {
    await submitComment(props.slug, {
      authorName: form.authorName,
      authorEmail: form.authorEmail,
      content: form.content,
    })
    form.content = ''
    // 不刷新列表,因为新评论是 PENDING 不会出现;但可以乐观地 refresh 一次以防别人刚好也过审
    await refresh()
    setMsg('success', '评论已提交,审核通过后会公开显示。')
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; _data?: { message?: string | string[] } } }
    const status = err?.response?.status
    const raw = err?.response?._data?.message
    const text = Array.isArray(raw) ? raw.join('; ') : raw
    if (status === 429) setMsg('error', '提交太频繁,请稍后再试')
    else setMsg('error', text || '提交失败,请稍后再试')
  } finally {
    submitting.value = false
  }
}

function setMsg(k: 'info' | 'error' | 'success', m: string) {
  kind.value = k
  message.value = m
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.comments {
  max-width: 720px;
  margin: 60px auto 0;
  padding: 0 32px 80px;
}

.comments-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}
.comments-head h2 { font-size: 22px; margin: 0; color: var(--ink); }
.count { font-size: 11px; color: var(--ink-3); letter-spacing: 0.14em; }

.muted { color: var(--ink-3); font-size: 13px; padding: 8px 0; }
.hint { margin: 4px 0 16px; }

.list { list-style: none; padding: 0; margin: 0 0 32px; }
.item {
  border-bottom: 1px solid var(--rule);
  padding: 16px 0;
}
.item:last-child { border-bottom: 0; }
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.name { font-size: 14px; font-weight: 500; color: var(--ink); }
.time { font-size: 11px; color: var(--ink-3); letter-spacing: 0.06em; }
.content {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink);
  white-space: pre-wrap;
}

.form {
  background: var(--card);
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: var(--shadow);
}
.form-title { font-size: 16px; margin: 0 0 4px; color: var(--ink); }

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
@media (max-width: 540px) {
  .row { grid-template-columns: 1fr; }
}

.input, .textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 14px;
  color: var(--ink);
  outline: none;
  font-family: inherit;
}
.input:focus, .textarea:focus { border-color: var(--accent); }

.textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

.msg {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 12px 0 0;
}
.msg.info    { background: var(--bg); color: var(--ink-2); }
.msg.error   { background: #fdecec; color: #b3261e; }
.msg.success { background: #e8f5ee; color: #1f7a3e; }

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
}
.len { font-size: 11px; color: var(--ink-3); }

.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 13px;
  cursor: pointer;
}
.primary:hover { opacity: 0.92; }
.primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
