<template>
  <!--
    Article comment section: APPROVED 评论列表(嵌套 / Gravatar)+ 匿名提交。
    嵌套用 buildTree → flattenTree + depth padding,免抽递归组件。
  -->
  <section class="comments">
    <header class="comments-head">
      <h2 class="cn">评论</h2>
      <span class="mono count">{{ comments.length }} 条</span>
    </header>

    <div v-if="loading" class="muted">加载中…</div>

    <ul v-else-if="flatComments.length > 0" class="list">
      <li
        v-for="c in flatComments"
        :key="c.id"
        class="item"
        :style="{ paddingLeft: c.depth * 24 + 'px' }"
      >
        <div class="head">
          <img
            class="avatar"
            :src="`https://www.gravatar.com/avatar/${c.authorEmailHash}?s=64&d=identicon`"
            :alt="c.authorName"
            loading="lazy"
            width="32"
            height="32"
          />
          <span class="serif name">{{ c.authorName }}</span>
          <span v-if="c.depth > 0" class="reply-to mono">↳ 回复</span>
          <span class="mono time">{{ formatTime(c.createdAt) }}</span>
          <button
            class="reply-btn mono"
            type="button"
            @click="startReply(c)"
          >回复</button>
        </div>
        <p class="content">{{ c.content }}</p>
      </li>
    </ul>

    <div v-else class="muted">还没有评论。来当第一个吧。</div>

    <!-- 提交表单(顶层 + 回复都用这一个,parentId 决定是否回复) -->
    <form class="form" @submit.prevent="onSubmit">
      <h3 class="cn form-title">
        {{ replyToName ? `回复 @${replyToName}` : '发表评论' }}
        <button v-if="replyToName" type="button" class="cancel-reply" @click="cancelReply">✕ 取消回复</button>
      </h3>
      <p class="muted hint">
        评论会先经过审核才会公开显示。邮箱用于显示 Gravatar 头像,**邮箱本身不公开**。
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
          placeholder="邮箱(必填,Gravatar 头像)"
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
import { useArticleComments, submitComment, type PublicComment } from '../composables/useComments'

const props = defineProps<{ slug: string }>()

// useFetch SSR + 客户端共享。后端默认 ASC,旧→新
const { data, pending: loading, refresh } = await useArticleComments(props.slug)
const comments = computed(() => data.value?.data ?? [])

/**
 * 把平铺 list 转成树:parentId === null 是顶层,其他按 parentId 挂到父节点 children。
 * 然后 DFS 展平回数组,每项带 depth。
 */
type Flat = PublicComment & { depth: number; children: Flat[] }
const flatComments = computed<Flat[]>(() => {
  const map = new Map<string, Flat>()
  comments.value.forEach((c) => map.set(c.id, { ...c, depth: 0, children: [] }))
  const roots: Flat[] = []
  comments.value.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parentId && map.has(c.parentId)) {
      const parent = map.get(c.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  // DFS 展平,父在前子在后(已审核才在 list,所以 parent 一定先来)
  const out: Flat[] = []
  function visit(n: Flat) {
    out.push(n)
    n.children.forEach(visit)
  }
  roots.forEach(visit)
  return out
})

const form = reactive({
  authorName: '',
  authorEmail: '',
  content: '',
  parentId: null as string | null,
})
const replyToName = ref<string | null>(null)

function startReply(c: PublicComment) {
  form.parentId = c.id
  replyToName.value = c.authorName
  // 滚到表单
  setTimeout(() => {
    document.querySelector('section.comments form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 50)
}
function cancelReply() {
  form.parentId = null
  replyToName.value = null
}

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
      parentId: form.parentId ?? undefined,
    })
    form.content = ''
    cancelReply()
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
  border-top: 1px solid var(--rule);
  padding: 16px 0;
  position: relative;
}
.item:first-child { border-top: 0; }

/* 嵌套层级用左侧细线表示父子关系,而不是单纯缩进显得突兀 */
.item[style*="padding-left"]::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 16px;
  bottom: 16px;
  width: 1px;
  background: var(--rule);
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--bg);
  flex-shrink: 0;
}
.name { font-size: 14px; font-weight: 500; color: var(--ink); }
.reply-to { font-size: 10px; color: var(--ink-3); letter-spacing: 0.1em; }
.time { font-size: 11px; color: var(--ink-3); letter-spacing: 0.06em; margin-left: auto; }
.reply-btn {
  background: transparent;
  border: 0;
  color: var(--ink-3);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  letter-spacing: 0.1em;
}
.reply-btn:hover { color: var(--accent); }

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
.form-title {
  font-size: 16px;
  margin: 0 0 4px;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 12px;
}
.cancel-reply {
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--mono, ui-monospace, monospace);
}
.cancel-reply:hover { color: var(--ink); border-color: var(--ink); }

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

@media (max-width: 720px) {
  .comments { padding: 0 20px 60px; margin: 36px auto 0; }
}
</style>
