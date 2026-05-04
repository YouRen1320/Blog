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

      <section class="card group">
        <div class="mono group-kicker">AUTH · 安全</div>

        <Field label="JWT 过期" hint="单位：小时">
          <input v-model.number="form.jwtHours" class="input mono" type="number" min="1" max="720" />
        </Field>
        <Toggle v-model="form.requireMfa" label="登录强制 2FA" />
      </section>

      <div class="actions">
        <button class="ghost" type="button">放弃修改</button>
        <button class="primary" type="button">保存设置</button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import Field from '../components/Field.vue'
import Toggle from '../components/Toggle.vue'

// 单一 reactive 对象当作 form。后续接 NestJS 时换成 fetch + dirty 比对。
const form = reactive({
  title: 'Youren',
  tagline: 'An element-soul who writes.',
  icp: '萌 ICP 备 20253545 号',
  model: 'GPT-4.1',
  threshold: 85,
  streaming: true,
  ragRelated: true,
  jwtHours: 24,
  requireMfa: false,
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
</style>
