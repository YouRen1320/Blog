<template>
  <!--
    /login —— 真实接入 NestJS:
    - 调 useAuthStore().login(email, password) 拿 token 并存 store
    - 出错时显示后端返回的 message(401 邮箱密码错 / 400 字段不合法)
    - 成功后跳转到 ?redirect 指定的页面或默认 /dashboard
    - email/password 默认预填**测试账号**(role=USER,只能写不能发,AI 限 3 次/天),
      ADMIN 自己手动清空再输即可。测试账号的密码就是公开的,因此明文写在前端没问题。
  -->
  <div class="page">
    <form class="card" @submit.prevent="onSubmit">
      <div class="logo serif-disp">Y</div>
      <h1 class="cn title">欢迎回来</h1>
      <p class="hint">{{ subtitle }}</p>

      <label class="mono label" for="login-email">EMAIL</label>
      <input
        id="login-email"
        v-model="email"
        class="input"
        type="email"
        autocomplete="email"
        placeholder="you@youren.dev"
        required
      />

      <label class="mono label" for="login-password">PASSWORD</label>
      <input
        id="login-password"
        v-model="password"
        class="input"
        type="password"
        autocomplete="current-password"
        placeholder="••••••••"
        required
      />

      <p class="demo-hint">
        当前预填为<strong>测试账号</strong>(只能写草稿、AI 每日 3 次),直接点登入即可体验。
      </p>
      <p v-if="error" class="error">{{ error }}</p>

      <button class="submit" :disabled="submitting" type="submit">
        {{ submitting ? '登入中…' : '登入 →' }}
      </button>

      <div class="mono foot">
        <!-- 注册入口暂时关闭(单作者模式)。日后开放注册时把下行取消注释 -->
        <!-- <RouterLink to="/register" class="forgot">没账号?注册 →</RouterLink> -->
        <span>JWT · BEARER</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 测试账号默认值,跟 apps/api/scripts/seed-tester.cjs 的默认值保持同步。
// 这是公开的 demo 账号,密码不当 secret 处理。
const DEMO_EMAIL = 'tester@iyouren.top'
const DEMO_PASSWORD = 'tester12345'

const email = ref(DEMO_EMAIL)
const password = ref(DEMO_PASSWORD)
const error = ref('')
const submitting = ref(false)

const subtitle = computed(() => (auth.user ? `又见面了,${auth.user.username}` : '使用管理员账号登入'))

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    // USER(测试者)的 dashboard / settings 等都被隐藏掉了,
    // 默认跳到 /articles 让他直接看到自己的文章列表。ADMIN 仍走 /dashboard。
    const fallback = auth.user?.role === 'ADMIN' ? '/dashboard' : '/articles'
    const redirect = (route.query.redirect as string) || fallback
    router.replace(redirect)
  } catch (e: any) {
    // 后端 message 可能是字符串或字符串数组(class-validator 返回数组)
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('; ') : msg || '登录失败,请稍后再试'
  } finally {
    submitting.value = false
  }
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
.input:last-of-type { margin-bottom: 16px; }

.demo-hint {
  font-size: 11px;
  color: var(--ink-3);
  background: var(--bg);
  border: 1px dashed var(--rule);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0 0 14px;
  line-height: 1.5;
}
.demo-hint strong { color: var(--ink-2); font-weight: 600; }

.error {
  font-size: 12px;
  color: #c0392b;
  margin: 0 0 12px;
  text-align: center;
}

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
.submit:hover:not(:disabled) { opacity: 0.92; }
.submit:disabled { opacity: 0.5; cursor: progress; }

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
