<template>
  <!--
    /login —— v3 设计的 AdminLoginV3：
    单卡居中表单，斜体 Y logo，欢迎语下面提示「有 N 篇 AI 草稿在等你」。
    提交目前只是跳转 /dashboard；接 NestJS 时换成 fetch /api/auth/login。
  -->
  <div class="page">
    <form class="card" @submit.prevent="onSubmit">
      <div class="logo serif-disp">Y</div>
      <h1 class="cn title">欢迎回来</h1>
      <p class="hint">有 4 篇 AI 草稿在等你。</p>

      <label class="mono label">EMAIL</label>
      <input v-model="email" class="input" type="email" autocomplete="email" />

      <label class="mono label">PASSWORD</label>
      <input v-model="password" class="input" type="password" autocomplete="current-password" />

      <button class="submit" type="submit">登入 →</button>

      <div class="mono foot">
        <a class="forgot">忘记密码</a>
        <span>JWT · BEARER</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单字段；默认值仅做演示，真正接入认证后请去掉默认值。
const email = ref('admin@youren.dev')
const password = ref('••••••••••')

function onSubmit() {
  // TODO: 接入 NestJS auth：POST /api/auth/login，存 token 后再 push。
  router.push('/dashboard')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: 360px;
  background: var(--card);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 40px 36px;
}

.logo {
  font-size: 36px;
  font-style: italic;
  color: var(--accent);
  text-align: center;
  margin-bottom: 8px;
  line-height: 1;
}

.title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  color: var(--ink);
}

.hint {
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  margin: 6px 0 32px;
}

.label {
  display: block;
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
}

.input {
  width: 100%;
  margin-top: 6px;
  margin-bottom: 20px;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
  outline: none;
}
.input:focus { border-color: var(--accent); }

.input + .label { margin-top: 0; }
.input:last-of-type { margin-bottom: 24px; }

.submit {
  width: 100%;
  padding: 12px 0;
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.submit:hover { opacity: 0.92; }

.foot {
  margin-top: 18px;
  font-size: 10px;
  color: var(--ink-3);
  display: flex;
  justify-content: space-between;
}

.forgot { color: inherit; cursor: pointer; }
.forgot:hover { color: var(--ink-2); }
</style>
