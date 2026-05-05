<template>
  <!--
    AdminShell —— 后台公共骨架（v3 设计的 AdminShellV3）：
      · 220px 左侧栏（卡片化）：斜体 Y logo + 主导航 + 当前用户 + 主题切换
      · 右侧 main 区域，由具体视图通过默认 slot 填充
    侧栏当前项由 props.active 决定（值为路由名 dashboard/editor/inbox 等）
  -->
  <div class="shell">
    <aside class="aside">
      <div class="logo serif-disp">Y</div>

      <nav class="nav">
        <RouterLink
          v-for="item in items"
          :key="item.key"
          :to="item.to"
          class="nav-item"
          :class="{ active: active === item.key }"
        >
          <span class="nav-left">
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </span>
          <span v-if="item.badge" class="mono nav-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <div class="user">
        <div>
          <div class="user-name">Youren</div>
          <div class="mono user-role">admin</div>
        </div>
        <button class="theme-toggle" @click="toggle" :aria-label="dark ? '切到浅色' : '切到深色'">
          {{ dark ? '☼' : '☾' }}
        </button>
      </div>
    </aside>

    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTheme } from '../composables/useTheme'

defineProps<{
  // 当前激活的导航项 key；与下方 items 对应。
  active: 'dashboard' | 'writing' | 'drafts' | 'tags' | 'cats' | 'comments' | 'settings'
}>()

const { dark, toggle } = useTheme()

// 主导航数据：badge 为可选数字，用来在 AI 草稿这类"待处理"项上显示数量。
type NavItem = {
  key: 'dashboard' | 'writing' | 'drafts' | 'tags' | 'cats' | 'comments' | 'settings'
  icon: string
  label: string
  to: string
  badge?: string
}

const items: NavItem[] = [
  { key: 'dashboard', icon: '○', label: 'Index', to: '/dashboard' },
  { key: 'writing', icon: '✎', label: 'Writing', to: '/articles' },
  { key: 'drafts', icon: '✦', label: 'AI Drafts', to: '/inbox' },
  { key: 'tags', icon: '#', label: 'Tags', to: '/tags' },
  { key: 'cats', icon: '◐', label: 'Categories', to: '/categories' },
  { key: 'comments', icon: '✉', label: 'Comments', to: '/comments' },
  { key: 'settings', icon: '⚙', label: 'Settings', to: '/settings' },
]
</script>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--bg);
  padding: 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}

.aside {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 24px;
  height: fit-content;
  max-height: calc(100vh - 48px);
}

.logo {
  font-size: 32px;
  font-style: italic;
  color: var(--accent);
  padding: 0 8px 18px;
  line-height: 1;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 14px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--ink-2);
  text-decoration: none;
  cursor: pointer;
}

.nav-item:hover { background: var(--bg); }

.nav-item.active {
  background: var(--bg);
  color: var(--ink);
  font-weight: 500;
}

.nav-left { display: flex; align-items: center; gap: 12px; }

.nav-icon { color: var(--ink-3); width: 18px; text-align: center; }
.nav-item.active .nav-icon { color: var(--accent); }

.nav-badge {
  font-size: 10px;
  color: var(--accent);
}

.user {
  margin-top: auto;
  padding: 12px 14px 0;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-size: 12px;
  color: var(--ink);
  font-weight: 500;
}

.user-role {
  font-size: 10px;
  color: var(--ink-3);
}

.theme-toggle {
  background: transparent;
  border: 0;
  color: var(--ink-3);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
}
.theme-toggle:hover { color: var(--ink); }

.main { min-width: 0; }

/* === 移动端适配(< 900px)=== */
/* 220px 固定 sidebar 在窄屏会挤掉内容,改成顶栏横排导航 + 用户信息折下面 */
@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 12px;
  }
  .aside {
    position: static;
    max-height: none;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    padding: 12px 14px;
    gap: 8px;
  }
  .logo { padding: 0 8px 0 4px; font-size: 24px; }
  .nav {
    flex-direction: row;
    flex: 1 1 auto;
    gap: 2px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar { display: none; }
  .nav-item {
    padding: 6px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }
  .nav-badge { display: none; }   /* 横排空间紧,badge 隐掉 */
  .user {
    margin-top: 0;
    padding: 0;
    border-top: 0;
    border-left: 1px solid var(--rule);
    padding-left: 12px;
    gap: 6px;
  }
  .user-name { font-size: 11px; }
  .user-role { display: none; }
}

@media (max-width: 480px) {
  .shell { padding: 8px; gap: 8px; }
  .aside { padding: 10px; }
  .logo { display: none; }   /* 极窄屏让位给 nav */
  .user { display: none; }   /* 极窄屏让位给 nav,user 信息只在 settings 看 */
}
</style>
