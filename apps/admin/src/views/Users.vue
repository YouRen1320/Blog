<template>
  <!--
    /users —— ADMIN 用户管理(V1.11):
    · 列表显示所有注册用户(分页 20/页)
    · 操作:升级 USER → ADMIN / 降级 ADMIN → USER / 删除(删自己被禁,删最后一个 ADMIN 被禁)
    · 该用户名下有文章时不能直接删,提示先迁移文章

    现在产品没多用户场景,此页主要给 admin 把信任的访客升 ADMIN 用。
  -->
  <AdminShell active="users">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">USERS · {{ meta.total }}</div>
        <div class="kicker-rule" />
        <h1 class="cn title">用户管理</h1>
        <p class="cn lede">注册的所有账号。改 role 让信任的人升 ADMIN,或者把无效账号删掉。</p>
      </header>

      <div v-if="loading" class="card empty">加载中…</div>
      <div v-else-if="users.length === 0" class="card empty">还没有任何注册用户。</div>

      <section v-else class="card table">
        <div class="row head mono">
          <span>USERNAME</span><span>EMAIL</span><span>ROLE</span><span>ARTICLES</span><span>JOINED</span><span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="u in users" :key="u.id" class="row body">
          <span class="serif name">{{ u.username }}<span v-if="u.id === me?.id" class="self-tag mono">YOU</span></span>
          <span class="mono email">{{ u.email }}</span>
          <span class="mono role" :class="`role-${u.role.toLowerCase()}`">{{ u.role }}</span>
          <span class="mono count">{{ u._count.articles }}</span>
          <span class="mono date">{{ formatDate(u.createdAt) }}</span>
          <span class="actions">
            <button
              v-if="u.role === 'USER'"
              class="link"
              type="button"
              :disabled="busy === u.id || u.id === me?.id"
              @click="onRole(u, 'ADMIN')"
            >升 ADMIN</button>
            <button
              v-else
              class="link"
              type="button"
              :disabled="busy === u.id || u.id === me?.id"
              @click="onRole(u, 'USER')"
            >降 USER</button>
            <button
              class="link danger"
              type="button"
              :disabled="busy === u.id || u.id === me?.id"
              @click="onDelete(u)"
            >删除</button>
          </span>
        </div>
      </section>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="meta.totalPages > 1" class="paging mono">
        <button class="link" :disabled="page <= 1" type="button" @click="page = Math.max(1, page - 1); load()">← 上一页</button>
        <span>{{ page }} / {{ meta.totalPages }}</span>
        <button class="link" :disabled="page >= meta.totalPages" type="button" @click="page = Math.min(meta.totalPages, page + 1); load()">下一页 →</button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import { fetchUsers, updateUserRole, deleteUser, type AdminUserItem, type UserRole } from '../api/users'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const me = computed(() => auth.user)

const users = ref<AdminUserItem[]>([])
const loading = ref(false)
const error = ref('')
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const page = ref(1)
const busy = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchUsers({ page: page.value, pageSize: 20 })
    users.value = res.data
    meta.value = res.meta
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function onRole(u: AdminUserItem, role: UserRole) {
  if (!confirm(`确定把 ${u.username} 改成 ${role}?`)) return
  busy.value = u.id
  error.value = ''
  try {
    await updateUserRole(u.id, role)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string | string[] } } }
    const msg = err?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('; ') : msg || '操作失败'
  } finally {
    busy.value = null
  }
}

async function onDelete(u: AdminUserItem) {
  if (u._count.articles > 0) {
    alert(`${u.username} 名下有 ${u._count.articles} 篇文章,先到 /articles 删完或转移再删用户`)
    return
  }
  if (!confirm(`物理删除 ${u.username}(${u.email})?无法恢复。`)) return
  busy.value = u.id
  error.value = ''
  try {
    await deleteUser(u.id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string | string[] } } }
    const msg = err?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('; ') : msg || '删除失败'
  } finally {
    busy.value = null
  }
}

onMounted(load)

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }
.hero { padding: 32px 36px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.lede { font-size: 13px; color: var(--ink-2); margin: 8px 0 0; }

.empty { padding: 28px 32px; color: var(--ink-3); font-size: 13px; }

.table { padding: 8px 0; }
.row {
  display: grid;
  grid-template-columns: 1.2fr 1.8fr 80px 80px 100px 1.2fr;
  gap: 14px;
  padding: 10px 28px;
  align-items: center;
}
.row.head { color: var(--ink-3); font-size: 9px; letter-spacing: 0.18em; padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--rule); }
.row.body { border-top: 1px solid var(--rule); font-size: 13px; }
.row.body:first-of-type { border-top: 0; }

.name { color: var(--ink); font-weight: 500; }
.self-tag { font-size: 9px; color: var(--accent); margin-left: 6px; letter-spacing: 0.14em; }
.email { color: var(--ink-2); font-size: 12px; }
.role { font-size: 10px; letter-spacing: 0.14em; padding: 2px 8px; border-radius: 6px; display: inline-block; width: fit-content; }
.role-admin { background: var(--accent); color: var(--bg); }
.role-user  { background: var(--bg); color: var(--ink-2); border: 1px solid var(--rule); }
.count { color: var(--ink-2); font-size: 12px; }
.date  { color: var(--ink-3); font-size: 11px; }
.actions { display: flex; gap: 10px; }

.actions-head { text-align: left; }

.link { background: none; border: 0; color: var(--ink-2); cursor: pointer; font-size: 11px; padding: 2px 4px; }
.link:hover { color: var(--ink); }
.link.danger { color: #b3261e; }
.link:disabled { color: var(--ink-3); cursor: not-allowed; }

.error { color: #c0392b; font-size: 12px; padding: 8px 16px; }

.paging {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: var(--ink-2);
  padding: 16px;
}

@media (max-width: 1100px) {
  .row { grid-template-columns: 1fr 1fr 80px 60px 100px; gap: 8px; }
  .row .actions { grid-column: 1 / -1; padding-top: 4px; }
}
@media (max-width: 700px) {
  .row { grid-template-columns: 1fr 70px; padding: 12px 16px; }
  .row.head .actions-head, .row .email, .row .count, .row .date { display: none; }
  .row.head { display: none; }
  .actions { grid-column: 1 / -1; }
}
</style>
