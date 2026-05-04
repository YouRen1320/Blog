<template>
  <!--
    /login —— 真实接入 NestJS:
    - 调 useAuthStore().login(email, password) 拿 token 并存 store
    - 出错时显示后端返回的 message(401 邮箱密码错 / 400 字段不合法)
    - 成功后跳转到 ?redirect 指定的页面或默认 /dashboard
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

      <p v-if="error" class="error">{{ error }}</p>

      <button class="submit" :disabled="submitting" type="submit">
        {{ submitting ? '登入中…' : '登入 →' }}
      </button>

      <div class="mono foot">
        <a class="forgot">忘记密码</a>
        <span>JWT · BEARER</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

const subtitle = computed(() => (auth.user ? `又见面了,${auth.user.username}` : '使用管理员账号登入'))

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
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
