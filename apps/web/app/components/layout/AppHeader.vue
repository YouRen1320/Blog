<template>
  <!--
    Sticky pill nav matching the Blog UI v3 (chlo.is mood) design:
    - Left: italic serif logo letter ("Y") rendered in the accent moss color.
    - Center: a soft "card" pill containing all-caps mono nav links.
    - Right: theme toggle (sun/moon glyph) backed by useTheme().
    The nav stays sticky at the top so the warm-gray bg shows through on scroll.
  -->
  <header class="app-header">
    <div class="bar">
      <NuxtLink to="/" class="logo serif-disp" aria-label="Home">Y</NuxtLink>

      <nav class="pill">
        <NuxtLink
          v-for="item in menu"
          :key="item.label"
          :to="item.to"
          class="pill-link mono"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <button
        class="theme-toggle"
        :aria-label="dark ? '切换到浅色' : '切换到深色'"
        @click="toggle"
      >
        {{ dark ? '☼' : '☾' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Top-level navigation. `to` paths map to existing /pages routes.
// Labels are uppercased via CSS so we keep them readable in source.
const menu = [
  { label: 'Now', to: '/now' },
  { label: 'Write', to: '/writing' },
  { label: 'Notes', to: '/notes' },
  { label: 'About', to: '/about' },
  { label: 'Links', to: '/links' },
  { label: 'Here', to: '/travelling' },
]

const route = useRoute()
const { dark, toggle } = useTheme()

// `/` is treated as Now's sibling — only highlight a route when it matches
// the start of the current path so /writing/[slug] still highlights "Write".
function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bg);
  padding: 20px 0;
}

.bar {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.logo {
  font-size: 36px;
  font-style: italic;
  color: var(--accent);
  font-weight: 400;
  letter-spacing: -0.01em;
  text-decoration: none;
  line-height: 1;
}

.pill {
  background: var(--card);
  border-radius: 999px;
  padding: 6px 8px;
  box-shadow: var(--shadow);
  display: flex;
  gap: 0;
  justify-self: center;
}

.pill-link {
  padding: 8px 18px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
  text-decoration: none;
  border-radius: 999px;
  transition: color 0.15s ease;
}

.pill-link:hover { color: var(--ink-2); }
.pill-link.active { color: var(--ink); }

.theme-toggle {
  justify-self: end;
  background: transparent;
  border: 0;
  color: var(--ink-3);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}
.theme-toggle:hover { color: var(--ink); }
</style>
