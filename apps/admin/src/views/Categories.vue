<template>
  <!--
    /categories —— 分类管理(V1-07 接 NestJS)。结构与 Tags 一致,
    多了 description 字段(可选)。
  -->
  <AdminShell active="cats">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker">CATEGORIES</div>
            <div class="kicker-rule" />
            <h1 class="cn title">分类管理</h1>
            <p class="cn lede">共 {{ categories.length }} 个分类。</p>
          </div>
          <button v-if="!showCreate" class="primary" type="button" @click="showCreate = true">+ 新建分类</button>
        </div>

        <form v-if="showCreate" class="create-form" @submit.prevent="onCreate">
          <input v-model="newName" class="input" placeholder="分类名称(必填)" required />
          <input v-model="newSlug" class="input mono" placeholder="slug(可选)" />
          <input v-model="newDesc" class="input" placeholder="描述(可选)" />
          <button class="primary" type="submit" :disabled="submitting">保存</button>
          <button class="link" type="button" @click="cancelCreate">取消</button>
        </form>
      </header>

      <section class="card table" v-if="categories.length > 0">
        <div class="row head mono">
          <span>NAME</span><span>SLUG</span><span>DESC</span><span>COUNT</span><span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="c in categories" :key="c.id" class="row body">
          <template v-if="editingId === c.id">
            <input v-model="editName" class="input inline" />
            <input v-model="editSlug" class="input inline mono" />
            <input v-model="editDesc" class="input inline" />
            <span class="mono count">{{ c._count?.articles ?? 0 }}</span>
            <span class="actions">
              <button class="link accent" @click="onSave(c)">保存</button>
              <button class="link" @click="cancelEdit">取消</button>
            </span>
          </template>
          <template v-else>
            <span class="serif name">{{ c.name }}</span>
            <span class="mono slug">{{ c.slug }}</span>
            <span class="cn desc">{{ c.description || '—' }}</span>
            <span class="mono count">{{ c._count?.articles ?? 0 }}</span>
            <span class="actions">
              <button class="link" @click="startEdit(c)">编辑</button>
              <button class="link danger" @click="onDelete(c)">删除</button>
            </span>
          </template>
        </div>
      </section>

      <p v-if="error" class="error mono">{{ error }}</p>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import { listCategories, createCategory, updateCategory, deleteCategory, type Category } from '../api/categories'
import { extractErrorMessage } from '../composables/useApiError'

const categories = ref<Category[]>([])
const error = ref('')
const submitting = ref(false)

const showCreate = ref(false)
const newName = ref('')
const newSlug = ref('')
const newDesc = ref('')

const editingId = ref<string | null>(null)
const editName = ref('')
const editSlug = ref('')
const editDesc = ref('')

async function load() {
  try { categories.value = await listCategories() } catch (e) { error.value = extractErrorMessage(e) }
}
onMounted(load)

function cancelCreate() { showCreate.value = false; newName.value = ''; newSlug.value = ''; newDesc.value = ''; error.value = '' }
async function onCreate() {
  submitting.value = true; error.value = ''
  try {
    await createCategory({ name: newName.value.trim(), slug: newSlug.value.trim() || undefined, description: newDesc.value.trim() || undefined })
    cancelCreate()
    await load()
  } catch (e) { error.value = extractErrorMessage(e) } finally { submitting.value = false }
}

function startEdit(c: Category) { editingId.value = c.id; editName.value = c.name; editSlug.value = c.slug; editDesc.value = c.description ?? '' }
function cancelEdit() { editingId.value = null }
async function onSave(c: Category) {
  error.value = ''
  try {
    await updateCategory(c.id, { name: editName.value.trim(), slug: editSlug.value.trim(), description: editDesc.value.trim() || undefined })
    editingId.value = null
    await load()
  } catch (e) { error.value = extractErrorMessage(e) }
}

async function onDelete(c: Category) {
  if (!confirm(`确定要删除分类「${c.name}」?`)) return
  try { await deleteCategory(c.id); await load() } catch (e) { error.value = extractErrorMessage(e) }
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.hero { padding: 32px 36px; }
.hero-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.lede { font-size: 13px; color: var(--ink-2); margin: 8px 0 0; }

.primary { background: var(--ink); color: var(--bg); border: 0; border-radius: 10px; padding: 10px 16px; font-size: 12px; font-weight: 500; cursor: pointer; }
.primary:hover { opacity: 0.92; }
.primary:disabled { opacity: 0.5; cursor: progress; }

.create-form { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr 1.5fr auto auto; gap: 10px; align-items: center; }
.input { padding: 8px 12px; background: var(--bg); border: 1px solid var(--rule); border-radius: 8px; font-size: 13px; color: var(--ink); outline: none; }
.input:focus { border-color: var(--accent); }
.input.inline { padding: 6px 10px; font-size: 12px; }

.table { padding: 8px 0; }
.row { display: grid; grid-template-columns: 1.4fr 1.2fr 2fr 0.6fr 1fr; gap: 16px; padding: 14px 32px; align-items: center; }
.row.head { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); border-bottom: 1px solid var(--rule); }
.row.body { border-top: 1px solid var(--rule); }
.row.body:first-of-type { border-top: 0; }
.row.body:hover { background: var(--bg); }
.actions-head { text-align: right; }

.name { font-size: 16px; font-weight: 500; color: var(--ink); }
.slug { font-size: 12px; color: var(--ink-3); }
.desc { font-size: 12px; color: var(--ink-2); }
.count { font-size: 12px; color: var(--ink-2); }

.actions { display: flex; gap: 14px; justify-content: flex-end; }
.link { background: transparent; border: 0; color: var(--ink-2); font-size: 12px; cursor: pointer; padding: 4px 0; }
.link:hover { color: var(--ink); }
.link.danger:hover { color: #B95C50; }
.link.accent { color: var(--accent); }

.error { color: #c0392b; font-size: 12px; padding: 12px 0; text-align: center; }
</style>
