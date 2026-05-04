<template>
  <!--
    /links —— v3 mood：
    单列 720px；按"分组"组织；每组顶上 mono kicker + 短分隔线；
    每条链接是一行：左侧名字 + 右侧 hostname mono；下面一行 cn 描述。
    与 /writing 的"目录式"风格一致。
  -->
  <section class="page">
    <header class="head">
      <div class="mono kicker">LINKS · {{ totalLinks }} ENTRIES</div>
      <div class="kicker-rule" />
      <h1 class="cn title">链接</h1>
      <p class="cn lede">一些我持续关注、愿意推荐，或者想认真保存下来的站点与链接。</p>
    </header>

    <section
      v-for="group in groups"
      :key="group.title"
      class="group"
    >
      <div class="mono group-kicker">{{ group.kicker }}</div>
      <div class="kicker-rule" />
      <h2 class="cn group-title">{{ group.title }}</h2>

      <ol class="list">
        <li v-for="item in group.items" :key="item.name" class="row">
          <div class="row-head">
            <a
              :href="item.href"
              target="_blank"
              rel="noreferrer"
              class="cn row-name"
            >
              {{ item.name }}
            </a>
            <span class="mono row-host">{{ hostOf(item.href) }}</span>
          </div>
          <p class="cn row-desc">{{ item.description }}</p>
        </li>
      </ol>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 链接分组：kicker 是 mono 上标；items 一组同类链接。
const groups = [
  {
    kicker: 'FRIENDS',
    title: '友站',
    items: [
      {
        name: 'Chlorine',
        href: 'https://chlo.is/',
        description: '一个让我很喜欢的个人站，安静、克制，也很有自己的气质。',
      },
      {
        name: 'Example Friend',
        href: 'https://example.com/',
        description: '这里以后可以放你真正想交换友链的朋友站点。',
      },
    ],
  },
  {
    kicker: 'PLACES I VISIT',
    title: '常去的地方',
    items: [
      {
        name: 'Codeberg',
        href: 'https://codeberg.org/',
        description: '我会持续关注的一类独立开发与开源社区空间。',
      },
      {
        name: 'Fediverse',
        href: 'https://joinmastodon.org/',
        description: '相对缓慢、相对自由，也更容易形成真实连接的一种网络角落。',
      },
    ],
  },
  {
    kicker: 'PROJECTS · REFERENCES',
    title: '工具与参考',
    items: [
      {
        name: 'NowNowNow',
        href: 'https://nownownow.com/about',
        description: '关于 now page 概念的来源说明，也是这类个人页面很重要的参考。',
      },
      {
        name: 'Krita',
        href: 'https://krita.org/',
        description: '如果后面继续练习绘画，这会是我大概率会常用的工具之一。',
      },
    ],
  },
]

// 简易 host 提取：去掉协议头，截到第一个 / 之前。SSR 安全（无 URL 解析依赖）。
function hostOf(href: string) {
  return href.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

const totalLinks = computed(() =>
  groups.reduce((sum, g) => sum + g.items.length, 0),
)
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 48px; }

.kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.kicker-rule {
  width: 24px;
  height: 1px;
  background: var(--ink-3);
  margin-bottom: 22px;
}

.title {
  font-size: 36px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  font-size: 15px;
  color: var(--ink-2);
  margin: 14px 0 0;
}

.group { margin-bottom: 56px; }

.group-kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.group-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  padding: 16px 0;
  border-bottom: 1px solid var(--rule);
}

.row-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.row-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.row-name:hover { color: var(--accent); }

.row-host {
  font-size: 11px;
  color: var(--ink-3);
}

.row-desc {
  font-size: 14px;
  color: var(--ink-2);
  margin: 6px 0 0;
}
</style>
