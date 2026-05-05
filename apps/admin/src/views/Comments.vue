<template>
  <!-- /comments — admin comment moderation page (approve / reject / delete). -->
  <!--
    /comments —— 评论审核:
    · 顶部 hero 显示当前过滤的状态 + 计数,提供 status 切换
    · 列表卡片显示评论全文 + 文章 / 邮箱 / IP / 时间
    · 操作:approve / reject / delete (delete 是物理删除,适合垃圾)
  -->
  <AdminShell active="comments">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">COMMENTS</div>
        <div class="kicker-rule" />
        <h1 class="cn title">评论审核</h1>
        <p class="cn lede">
          共 {{ meta.total }} 条 ·
          <span v-if="filterStatus === 'PENDING'">待审核</span>
          <span v-else-if="filterStatus === 'APPROVED'">已通过</span>
          <span v-else-if="filterStatus === 'REJECTED'">已拒绝</span>
          <span v-else>全部状态</span>
        </p>

        <div class="filters">
          <button
            v-for="opt in filterOptions"
            :key="opt.value ?? 'all'"
            class="chip"
            :class="{ active: filterStatus === opt.value }"
            type="button"
            @click="setFilter(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </header>

      <div v-if="loading" class="card empty">加载中…</div>
      <div v-else-if="comments.length === 0" class="card empty">
        当前过滤下没有评论。
      </div>

      <article
        v-for="c in comments"
        :key="c.id"
        class="card item"
        :class="['status-' + c.status.toLowerCase()]"
      >
        <header class="item-head">
          <div class="meta">
            <span class="serif author">{{ c.authorName }}</span>
            <span class="mono email">&lt;{{ c.authorEmail }}&gt;</span>
            <span class="mono ip">IP {{ c.ipAddress || '?' }}</span>
            <span class="mono time">{{ formatTime(c.createdAt) }}</span>
          </div>
          <div class="article-link">
            评论于
            <a :href="webUrlFor(c.article.slug)" target="_blank" rel="noopener">
              「{{ c.article.title }}」 ↗
            </a>
          </div>
        </header>

        <p class="content">{{ c.content }}</p>

        <footer class="item-foot">
          <span class="mono status-tag">{{ c.status }}</span>
          <span class="actions">
            <button
              v-if="c.status !== 'APPROVED'"
              class="primary small"
              type="button"
              @click="onApprove(c)"
            >通过</button>
            <button
              v-if="c.status !== 'REJECTED'"
              class="ghost small"
              type="button"
              @click="onReject(c)"
            >拒绝</button>
            <button class="link danger" type="button" @click="onDelete(c)">删除</button>
          </span>
        </footer>
      </article>

      <div v-if="meta.totalPages > 1" class="paging mono">
        <button
          class="link"
          :disabled="page <= 1"
          type="button"
          @click="page = Math.max(1, page - 1); reload()"
        >← 上一页</button>
        <span>{{ page }} / {{ meta.totalPages }}</span>
        <button
          class="link"
          :disabled="page >= meta.totalPages"
          type="button"
          @click="page = Math.min(meta.totalPages, page + 1); reload()"
        >下一页 →</button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import {
  fetchComments,
  updateCommentStatus,
  deleteComment,
  type AdminComment,
  type CommentStatus,
} from '../api/comments'

// 列表状态:数据 + 分页 + 当前过滤
const comments = ref<AdminComment[]>([])
const loading = ref(false)
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const page = ref(1)
const filterStatus = ref<CommentStatus | undefined>('PENDING')

// 默认进来看 PENDING(最常用),其他过滤一键切换
const filterOptions: { value: CommentStatus | undefined; label: string }[] = [
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: undefined, label: '全部' },
]

function setFilter(s: CommentStatus | undefined) {
  filterStatus.value = s
  page.value = 1
  reload()
}

async function reload() {
  loading.value = true
  try {
    const res = await fetchComments({
      page: page.value,
      pageSize: 20,
      status: filterStatus.value,
    })
    comments.value = res.data
    meta.value = res.meta
  } finally {
    loading.value = false
  }
}

onMounted(reload)

async function onApprove(c: AdminComment) {
  await updateCommentStatus(c.id, 'APPROVED')
  await reload()
}

async function onReject(c: AdminComment) {
  if (!confirm(`拒绝来自 ${c.authorName} 的评论?`)) return
  await updateCommentStatus(c.id, 'REJECTED')
  await reload()
}

async function onDelete(c: AdminComment) {
  if (!confirm(`物理删除来自 ${c.authorName} 的评论?(无法恢复,适合垃圾)`)) return
  await deleteComment(c.id)
  await reload()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// admin 域 → web 域:dev 时直跳 :3100,生产同域不同 host
const webUrlFor = computed(() => (slug: string) => {
  if (typeof window === 'undefined') return `/articles/${slug}`
  const host = window.location.hostname
  if (host.endsWith('iyouren.top')) return `https://www.iyouren.top/articles/${slug}`
  return `http://localhost:3100/articles/${slug}`
})
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.hero { padding: 32px 36px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.lede { font-size: 13px; color: var(--ink-2); margin: 8px 0 0; }

.filters { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.chip {
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.chip.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.empty { padding: 28px 32px; color: var(--ink-3); font-size: 13px; }

.item { padding: 18px 24px; border-left: 3px solid transparent; }
.item.status-pending  { border-left-color: #d4a017; }
.item.status-approved { border-left-color: #1f7a3e; }
.item.status-rejected { border-left-color: #b3261e; }

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: baseline;
  font-size: 12px;
}
.author { font-size: 14px; font-weight: 500; }
.email, .ip, .time { color: var(--ink-3); }

.article-link {
  font-size: 12px;
  color: var(--ink-2);
}
.article-link a { color: var(--ink); text-decoration: none; }
.article-link a:hover { text-decoration: underline; }

.content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink);
  margin: 0 0 14px;
  white-space: pre-wrap;
}

.item-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-tag {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--ink-3);
}
.actions { display: flex; gap: 10px; }

.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}
.primary.small { padding: 4px 12px; font-size: 11px; }

.ghost {
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.ghost.small { padding: 4px 12px; font-size: 11px; }

.link {
  background: none;
  border: 0;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 12px;
}
.link:hover { color: var(--ink); }
.link.danger { color: #b3261e; }
.link:disabled { color: var(--ink-3); cursor: not-allowed; }

.paging {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: var(--ink-2);
  padding: 16px;
}
</style>
