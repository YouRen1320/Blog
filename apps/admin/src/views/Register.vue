<template>
  <!--
    /register —— 公开注册:
    任何人可以注册一个 USER 账号。注册成功后立即登录(后端返 token),
    跳转 /dashboard。USER 在 /articles 只能看 / 写自己的文章,ADMIN 仍由现有
    ADMIN 在后台升级。
  -->
  <div class="page">
    <form class="card" @submit.prevent="onSubmit">
      <div class="logo serif-disp">Y</div>
      <h1 class="cn title">注册账号</h1>
      <p class="hint">写完文章可以发到这个博客平台</p>

      <label class="mono label" for="reg-username">USERNAME</label>
      <input
        id="reg-username"
        v-model.trim="username"
        class="input mono"
        type="text"
        autocomplete="username"
        placeholder="字母 / 数字 / _ / -,3-30 位"
        required
        minlength="3"
        maxlength="30"
        pattern="[a-zA-Z0-9_-]+"
      />

      <label class="mono label" for="reg-email">EMAIL</label>
      <input
        id="reg-email"
        v-model.trim="email"
        class="input"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />

      <label class="mono label" for="reg-password">PASSWORD</label>
      <input
        id="reg-password"
        v-model="password"
        class="input"
        type="password"
        autocomplete="new-password"
        placeholder="至少 8 位"
        required
        minlength="8"
      />

      <p v-if="error" class="error">{{ error }}</p>

      <button class="submit" :disabled="submitting" type="submit">
        {{ submitting ? '注册中…' : '注册并登入 →' }}
      </button>

      <div class="mono foot">
        <RouterLink to="/login" class="forgot">已有账号?登入 →</RouterLink>
        <span>JWT · BEARER</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { registerRequest } from '../api/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    const res = await registerRequest(username.value, email.value, password.value)
    // 直接走 auth store 写入登录态(避免再调一次 login)
    auth.setSession(res.accessToken, res.user)
    router.replace('/dashboard')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string | string[] } } }
    const msg = err?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('; ') : msg || '注册失败,请稍后再试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 跟 Login.vue 完全一致的视觉,保持登录 / 注册体验同源 */
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

.title { font-size: 22px; font-weight: 600; margin: 0; text-align: center; color: var(--ink); }
.hint { font-size: 12px; color: var(--ink-3); text-align: center; margin: 6px 0 32px; }

.label { display: block; font-size: 10px; color: var(--ink-3); letter-spacing: 0.14em; }

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
.input:last-of-type { margin-bottom: 16px; }

.error { font-size: 12px; color: #c0392b; margin: 0 0 12px; text-align: center; }

.submit {
  width: 100%; padding: 12px 0;
  background: var(--ink); color: var(--bg);
  border: 0; border-radius: 10px;
  font-size: 13px; font-weight: 500; cursor: pointer;
}
.submit:hover:not(:disabled) { opacity: 0.92; }
.submit:disabled { opacity: 0.5; cursor: progress; }

.foot {
  margin-top: 18px; font-size: 10px; color: var(--ink-3);
  display: flex; justify-content: space-between;
}
.forgot { color: inherit; cursor: pointer; text-decoration: none; }
.forgot:hover { color: var(--ink-2); }

@media (max-width: 480px) {
  .card { width: 100%; padding: 28px 22px; }
}
</style>
