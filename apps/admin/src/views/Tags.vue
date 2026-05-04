<template>
  <!--
    /tags —— 标签管理(V1-07 接 NestJS):
    · 顶部 hero 卡 + 新建表单(name + slug,slug 留空时后端自动生成)
    · 表格:点"编辑"切换内联输入,保存后变回展示态
  -->
  <AdminShell active="tags">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker">TAGS</div>
            <div class="kicker-rule" />
            <h1 class="cn title">标签管理</h1>
            <p class="cn lede">共 {{ tags.length }} 个标签,被引用 {{ totalCount }} 次。</p>
          </div>
          <button v-if="!showCreate" class="primary" type="button" @click="showCreate = true">+ 新建标签</button>
        </div>

        <form v-if="showCreate" class="create-form" @submit.prevent="onCreate">
          <input v-model="newName" class="input" placeholder="标签名称(必填)" required />
          <input v-model="newSlug" class="input mono" placeholder="slug(可选,留空自动生成)" />
          <button class="primary" type="submit" :disabled="submitting">保存</button>
          <button class="link" type="button" @click="cancelCreate">取消</button>
        </form>
      </header>

      <section class="card table" v-if="tags.length > 0">
        <div class="row head mono">
          <span>NAME</span><span>SLUG</span><span>COUNT</span><span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="tag in tags" :key="tag.id" class="row body">
          <template v-if="editingId === tag.id">
            <input v-model="editName" class="input inline" />
            <input v-model="editSlug" class="input inline mono" />
            <span class="mono count">{{ tag._count?.articles ?? 0 }}</span>
            <span class="actions">
              <button class="link accent" type="button" @click="onSave(tag)">保存</button>
              <button class="link" type="button" @click="cancelEdit">取消</button>
            </span>
          </template>
          <template v-else>
            <span class="serif name">#{{ tag.name }}</span>
            <span class="mono slug">{{ tag.slug }}</span>
            <span class="mono count">{{ tag._count?.articles ?? 0 }}</span>
            <span class="actions">
              <button class="link" type="button" @click="startEdit(tag)">编辑</button>
              <button class="link danger" type="button" @click="onDelete(tag)">删除</button>
            </span>
          </template>
        </div>
      </section>

      <p v-if="error" class="error mono">{{ error }}</p>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import { listTags, createTag, updateTag, deleteTag, type Tag } from '../api/tags'
import { extractErrorMessage } from '../composables/useApiError'

const tags = ref<Tag[]>([])
const error = ref('')
const submitting = ref(false)

const showCreate = ref(false)
const newName = ref('')
const newSlug = ref('')

const editingId = ref<string | null>(null)
const editName = ref('')
const editSlug = ref('')

const totalCount = computed(() => tags.value.reduce((s, t) => s + (t._count?.articles ?? 0), 0))

async function load() {
  try { tags.value = await listTags() } catch (e) { error.value = extractErrorMessage(e) }
}
onMounted(load)

function cancelCreate() { showCreate.value = false; newName.value = ''; newSlug.value = ''; error.value = '' }
async function onCreate() {
  submitting.value = true; error.value = ''
  try {
    await createTag({ name: newName.value.trim(), slug: newSlug.value.trim() || undefined })
    cancelCreate()
    await load()
  } catch (e) { error.value = extractErrorMessage(e) } finally { submitting.value = false }
}

function startEdit(t: Tag) { editingId.value = t.id; editName.value = t.name; editSlug.value = t.slug }
function cancelEdit() { editingId.value = null }
async function onSave(t: Tag) {
  error.value = ''
  try {
    await updateTag(t.id, { name: editName.value.trim(), slug: editSlug.value.trim() })
    editingId.value = null
    await load()
  } catch (e) { error.value = extractErrorMessage(e) }
}

async function onDelete(t: Tag) {
  if (!confirm(`确定要删除标签 #${t.name}?`)) return
  try { await deleteTag(t.id); await load() } catch (e) { error.value = extractErrorMessage(e) }
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

.create-form { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 10px; align-items: center; }
.input { padding: 8px 12px; background: var(--bg); border: 1px solid var(--rule); border-radius: 8px; font-size: 13px; color: var(--ink); outline: none; }
.input:focus { border-color: var(--accent); }
.input.inline { padding: 6px 10px; font-size: 12px; }

.table { padding: 8px 0; }
.row { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr; gap: 16px; padding: 14px 32px; align-items: center; }
.row.head { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); border-bottom: 1px solid var(--rule); }
.row.body { border-top: 1px solid var(--rule); }
.row.body:first-of-type { border-top: 0; }
.row.body:hover { background: var(--bg); }
.actions-head { text-align: right; }

.name { font-size: 18px; font-weight: 500; color: var(--ink); }
.slug { font-size: 12px; color: var(--ink-3); }
.count { font-size: 12px; color: var(--ink-2); }

.actions { display: flex; gap: 14px; justify-content: flex-end; }
.link { background: transparent; border: 0; color: var(--ink-2); font-size: 12px; cursor: pointer; padding: 4px 0; }
.link:hover { color: var(--ink); }
.link.danger:hover { color: #B95C50; }
.link.accent { color: var(--accent); }

.error { color: #c0392b; font-size: 12px; padding: 12px 0; text-align: center; }
</style>
