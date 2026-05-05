<template>
  <!--
    /settings —— 后台「站点设置」：分组卡片，
    每组里若干字段（input / textarea / toggle）。
    全部表单只做视觉与交互骨架，未连接 API。
  -->
  <AdminShell active="settings">
    <div class="stack">
      <header class="card hero">
        <div class="mono kicker">SETTINGS</div>
        <div class="kicker-rule" />
        <h1 class="cn title">站点设置</h1>
        <p class="cn lede">这些设置会影响展示页与后台的整体行为。</p>
      </header>

      <section class="card group">
        <div class="mono group-kicker">SITE · 基本信息</div>

        <Field label="站点标题" hint="出现在浏览器标签和页脚版权处">
          <input v-model="form.title" class="input" type="text" />
        </Field>
        <Field label="副标 / 描述" hint="出现在 Profile hero 下方">
          <input v-model="form.tagline" class="input" type="text" />
        </Field>
        <Field label="ICP 备案号" hint="出现在页脚右侧">
          <input v-model="form.icp" class="input" type="text" />
        </Field>

        <Field label="ABOUT 页内容" hint="支持 Markdown,出现在 web /about">
          <textarea
            v-model="form.aboutMarkdown"
            class="input about-input"
            rows="8"
            placeholder="# 关于我&#10;&#10;在这里介绍你自己..."
          />
        </Field>
      </section>

      <section class="card group">
        <div class="mono group-kicker">AI · 模型与默认行为</div>

        <Field label="默认模型" hint="新草稿默认使用哪个模型生成">
          <select v-model="form.model" class="input">
            <option>GPT-4.1</option>
            <option>Claude 4.7 Opus</option>
            <option>Claude 4.6 Sonnet</option>
            <option>Gemini 2.5 Pro</option>
          </select>
        </Field>
        <Field label="自动审核 confidence 阈值" hint="高于此值的草稿可一键通过">
          <input v-model.number="form.threshold" class="input mono" type="number" min="0" max="100" />
        </Field>

        <Toggle v-model="form.streaming" label="启用流式生成" />
        <Toggle v-model="form.ragRelated" label="文章页显示 RAG 相关推荐" />
      </section>

      <!--
        AI · 维护：把发布的老文章回填 RAG 向量，给新草稿提供更好的上下文。
        - 一次只处理 status=PUBLISHED 且 embedding=NULL 的文章，重复点不会重做
        - 后端串行跑 BGE，每篇 ~2-3s，请求 timeout 给 5 分钟
        - 完成后展示 total / processed / failed 三项汇总
      -->
      <section class="card group">
        <div class="mono group-kicker">AI · 维护</div>
        <p class="ai-desc cn">
          为已发布但还没向量化的旧文章批量补算 embedding，
          补完后这些文章会进入 RAG 检索范围，新草稿生成时能引用到它们。
        </p>

        <div v-if="backfill.message" :class="['pwd-msg', backfill.kind]">
          {{ backfill.message }}
        </div>

        <div class="actions">
          <button
            class="primary"
            type="button"
            :disabled="backfill.running"
            @click="runBackfill"
          >
            {{ backfill.running ? '正在回填，请稍候…' : '批量回填 embedding' }}
          </button>
        </div>
      </section>

      <section class="card group">
        <div class="mono group-kicker">AUTH · 安全</div>

        <Field label="JWT 过期" hint="单位：小时">
          <input v-model.number="form.jwtHours" class="input mono" type="number" min="1" max="720" />
        </Field>
        <Toggle v-model="form.requireMfa" label="登录强制 2FA" />
      </section>

      <!--
        改密码区块：独立提交，不跟"保存设置"按钮绑定。
        - 校验：新密码 ≥ 8 位，且不能和确认密码不一致
        - 后端 strict 限流 5/min，UI 层不再单独节流
        - 成功后清空表单 + 提示"建议重新登录"，但不强制踢人(token 仍有效)
      -->
      <section class="card group">
        <div class="mono group-kicker">AUTH · 改密码</div>

        <Field label="当前密码">
          <input v-model="pwd.current" class="input" type="password" autocomplete="current-password" />
        </Field>
        <Field label="新密码" hint="至少 8 位">
          <input v-model="pwd.next" class="input" type="password" autocomplete="new-password" />
        </Field>
        <Field label="确认新密码">
          <input v-model="pwd.confirm" class="input" type="password" autocomplete="new-password" />
        </Field>

        <div v-if="pwd.message" :class="['pwd-msg', pwd.kind]">{{ pwd.message }}</div>

        <div class="actions">
          <button class="primary" type="button" :disabled="pwd.submitting" @click="submitPasswordChange">
            {{ pwd.submitting ? '提交中...' : '修改密码' }}
          </button>
        </div>
      </section>

      <div v-if="settings.message" :class="['pwd-msg', settings.kind]">
        {{ settings.message }}
      </div>

      <div class="actions">
        <button class="ghost" type="button" :disabled="settings.saving" @click="resetForm">放弃修改</button>
        <button class="primary" type="button" :disabled="settings.saving" @click="submitSettings">
          {{ settings.saving ? '保存中…' : '保存设置' }}
        </button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import Field from '../components/Field.vue'
import Toggle from '../components/Toggle.vue'
import { changePasswordRequest } from '../api/auth'
import { backfillArticleEmbeddings } from '../api/articles'
import { fetchSettings, updateSettings, type SiteSettings } from '../api/settings'

// 表单字段映射后端 model:title/tagline/icp 影响 web 端展示;
// model/threshold/streaming/ragRelated/jwtHours/requireMfa 当前是占位,
// 持久化但运行时还没消费(留给后续接入)。
const form = reactive({
  title: '',
  tagline: '',
  icp: '',
  aboutMarkdown: '',
  model: '',
  threshold: 85,
  streaming: true,
  ragRelated: true,
  jwtHours: 24,
  requireMfa: false,
})

// 把后端字段映射到表单(命名差异:aiModel→model,aiThreshold→threshold 等)
function applyServer(s: SiteSettings) {
  form.title = s.title
  form.tagline = s.tagline
  form.icp = s.icp
  form.aboutMarkdown = s.aboutMarkdown ?? ''
  form.model = s.aiModel
  form.threshold = s.aiThreshold
  form.streaming = s.aiStreaming
  form.ragRelated = s.aiRagRelated
  form.jwtHours = s.jwtHours
  form.requireMfa = s.requireMfa
}

const settings = reactive({
  loaded: false,
  saving: false,
  message: '' as string,
  kind: 'info' as 'info' | 'error' | 'success',
})

onMounted(async () => {
  try {
    const s = await fetchSettings()
    applyServer(s)
    settings.loaded = true
  } catch (e) {
    settings.kind = 'error'
    settings.message = `加载站点设置失败:${(e as Error).message ?? '未知错误'}`
  }
})

async function submitSettings() {
  if (!settings.loaded) {
    settings.kind = 'error'
    settings.message = '配置尚未加载,请稍后再试'
    return
  }
  settings.saving = true
  settings.kind = 'info'
  settings.message = '正在保存…'
  try {
    const s = await updateSettings({
      title: form.title,
      tagline: form.tagline,
      icp: form.icp,
      aboutMarkdown: form.aboutMarkdown,
      aiModel: form.model,
      aiThreshold: form.threshold,
      aiStreaming: form.streaming,
      aiRagRelated: form.ragRelated,
      jwtHours: form.jwtHours,
      requireMfa: form.requireMfa,
    })
    applyServer(s)
    settings.kind = 'success'
    settings.message = '已保存。web 端的标题 / 副标 / ICP 立即生效(下次刷新可见)。'
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string | string[] } } }
    const msg = err?.response?.data?.message
    settings.kind = 'error'
    settings.message = (Array.isArray(msg) ? msg.join('; ') : msg) || '保存失败,请稍后再试'
  } finally {
    settings.saving = false
  }
}

// 放弃修改 = 重新拉一遍服务端值
async function resetForm() {
  if (!confirm('丢弃当前修改,从服务器重新加载?')) return
  try {
    const s = await fetchSettings()
    applyServer(s)
    settings.kind = 'info'
    settings.message = '已重置为服务器版本。'
  } catch (e) {
    settings.kind = 'error'
    settings.message = `重置失败:${(e as Error).message ?? '未知错误'}`
  }
}

// 改密码独立 state，不混进 form，避免误"放弃修改"把它清掉
const pwd = reactive({
  current: '',
  next: '',
  confirm: '',
  submitting: false,
  message: '' as string,
  kind: 'info' as 'info' | 'error' | 'success',
})

function setMsg(kind: 'info' | 'error' | 'success', message: string) {
  pwd.kind = kind
  pwd.message = message
}

// 批量回填 state：跟改密码一样独立，避免被"放弃修改"清掉
const backfill = reactive({
  running: false,
  message: '' as string,
  kind: 'info' as 'info' | 'error' | 'success',
})

async function runBackfill() {
  if (backfill.running) return
  backfill.running = true
  backfill.kind = 'info'
  backfill.message = '正在调用后端串行回填，请耐心等待…'
  try {
    const res = await backfillArticleEmbeddings()
    if (res.total === 0) {
      backfill.kind = 'success'
      backfill.message = '已经没有需要回填的文章（所有 PUBLISHED 都已索引）。'
    } else if (res.failed === 0) {
      backfill.kind = 'success'
      backfill.message = `回填完成：共 ${res.total} 篇，全部成功。`
    } else {
      backfill.kind = 'error'
      backfill.message = `回填完成：共 ${res.total} 篇，成功 ${res.processed}，失败 ${res.failed}。可重试一次。`
    }
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string | string[] } } }
    const status = err?.response?.status
    backfill.kind = 'error'
    backfill.message = status
      ? `回填失败（HTTP ${status}），请稍后再试。`
      : '回填失败，请检查网络或后端日志。'
  } finally {
    backfill.running = false
  }
}

async function submitPasswordChange() {
  // 前端基础校验，后端会再校验一次
  if (!pwd.current || !pwd.next || !pwd.confirm) {
    setMsg('error', '请填写完整')
    return
  }
  if (pwd.next.length < 8) {
    setMsg('error', '新密码至少 8 位')
    return
  }
  if (pwd.next !== pwd.confirm) {
    setMsg('error', '两次输入的新密码不一致')
    return
  }
  if (pwd.next === pwd.current) {
    setMsg('error', '新密码不能与当前密码相同')
    return
  }

  pwd.submitting = true
  setMsg('info', '正在提交...')
  try {
    await changePasswordRequest(pwd.current, pwd.next)
    pwd.current = ''
    pwd.next = ''
    pwd.confirm = ''
    setMsg('success', '密码已更新。建议在所有设备重新登录。')
  } catch (e: unknown) {
    // axios 错误结构：err.response.data.message，可能是字符串或字符串数组
    const err = e as { response?: { status?: number; data?: { message?: string | string[] } } }
    const status = err?.response?.status
    const raw = err?.response?.data?.message
    const text = Array.isArray(raw) ? raw.join('; ') : raw
    if (status === 401) setMsg('error', text || '当前密码不正确')
    else if (status === 429) setMsg('error', '请求过于频繁，稍后再试')
    else setMsg('error', text || '修改失败，请稍后再试')
  } finally {
    pwd.submitting = false
  }
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.hero { padding: 32px 36px; }

.kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
}

.kicker-rule {
  width: 18px;
  height: 1px;
  background: var(--ink-3);
  margin: 4px 0 14px;
}

.title {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.lede {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 0;
}

.group { padding: 24px 32px; }

.group-kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 12px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
  outline: none;
}
.input:focus { border-color: var(--accent); }
.about-input {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  resize: vertical;
  min-height: 160px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ghost {
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.ghost:hover { color: var(--ink); }

.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.primary:hover { opacity: 0.92; }
.primary:disabled { opacity: 0.55; cursor: not-allowed; }

.ai-desc {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.65;
  margin: 0 0 14px;
}

.pwd-msg {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 6px 0 12px;
}
.pwd-msg.info    { background: var(--bg); color: var(--ink-2); }
.pwd-msg.error   { background: #fdecec; color: #b3261e; }
.pwd-msg.success { background: #e8f5ee; color: #1f7a3e; }
</style>
