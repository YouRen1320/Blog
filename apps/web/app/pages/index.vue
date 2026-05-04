<template>
  <!--
    首页 = Profile hero（v3 设计的 Profile 画板）+ 文章卡网格（Index 画板）
    布局：max-w 1100px，居中，配合全局 v3 暖灰底。
  -->

  <!-- 上半屏：自我介绍 hero -->
  <section class="profile">
    <div class="intro">
      <h1 class="serif title">SYN. <span class="name">Youren here.</span></h1>

      <div class="tags">
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <p class="tagline">An element-soul who writes.</p>

      <div class="chips">
        <a
          v-for="social in socials"
          :key="social.label"
          :href="social.href"
          :aria-label="social.label"
          class="chip"
        >
          <img :src="social.icon" :alt="social.label" class="chip-icon">
        </a>
      </div>
    </div>

    <div class="portrait">
      <div class="halo" aria-hidden="true" />
      <img :src="headImage" alt="YouRen avatar" class="portrait-img">
    </div>
  </section>

  <!-- 滚动提示 -->
  <NuxtLink to="#articles" class="scroll-hint" aria-label="向下滚动到文章">
    <span>↓</span>
  </NuxtLink>

  <!-- 下半:文章卡片网格(最多 6 张已发布,从 API 取) -->
  <section id="articles" class="grid-section">
    <NuxtLink
      v-for="item in postList"
      :key="item.id"
      :to="`/writing/${item.slug}`"
      class="card-link"
    >
      <ArticleCard :post="item.card" />
    </NuxtLink>
  </section>

  <div class="more-row">
    <NuxtLink to="/writing" class="more-btn mono">→ 阅读更多</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'
import headImage from '../assets/image/head.jpg'
import { useArticleList } from '../composables/useArticles'
import { frenchSeason, seedFromId, shortDate } from '../utils/format'

useSeoMeta({
  title: 'YouRen · 写作 / 笔记 / AI 内容生产',
  description: 'Youren 的博客主页:最新文章、笔记和 AI 内容生产实验。',
})

import atomIcon from '../assets/svg/atom.svg'
import codebergIcon from '../assets/svg/codeberg.svg'
import fediverseIcon from '../assets/svg/febiverse.svg'
import forgejoIcon from '../assets/svg/forgejo.svg'
import homeIcon from '../assets/svg/home.svg'
import openPgpIcon from '../assets/svg/openPGP_Public_Key.svg'

// hero 区的标签药丸；保持英文偏文学化的口吻，呼应 chlo.is 风格。
const tags = [
  'Element Worker',
  'Open Source Advocate',
  'A Writing Entity',
  'Resolute Tag Opponent',
]

// 圆形 icon chips：站内/站外入口。
const socials = [
  { label: 'Home', href: '#', icon: homeIcon },
  { label: 'Atom', href: '#', icon: atomIcon },
  { label: 'Fediverse', href: '#', icon: fediverseIcon },
  { label: 'Forgejo', href: '#', icon: forgejoIcon },
  { label: 'Codeberg', href: '#', icon: codebergIcon },
  { label: 'OpenPGP', href: '#', icon: openPgpIcon },
]

// 首页只展示最新 6 篇,长列表去 /writing。
// useFetch 在 SSR + CSR 下都能跑,失败时 data 为 null,默认空列表。
const { data } = await useArticleList({ pageSize: 6 })

const postList = computed(() => {
  return (data.value?.data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    card: {
      id: a.id,
      season: frenchSeason(a.publishedAt),
      title: a.title,
      author: 'Youren',
      summary: a.summary ?? '',
      date: shortDate(a.publishedAt),
      // 列表里没有 content,先粗估"3 min read";详情页才有真正字数
      readingTime: '3 min read',
      seed: seedFromId(a.id),
    },
  }))
})
</script>

<style scoped>
.profile {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 32px 0;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 40px;
  align-items: center;
  min-height: calc(100vh - 220px);
}

.intro { display: flex; flex-direction: column; gap: 0; }

.title {
  font-size: 40px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--ink);
  line-height: 1.15;
}
.title .name { font-weight: 600; }

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 28px;
}

.tag {
  background: var(--card);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 11px;
  color: var(--ink-2);
  box-shadow: var(--shadow);
}

.tagline {
  font-size: 14px;
  color: var(--ink-2);
  margin: 24px 0 0;
}

.chips {
  display: flex;
  gap: 10px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.chip {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: grid;
  place-items: center;
  color: var(--ink-2);
  transition: transform 0.15s ease;
}
.chip:hover { transform: translateY(-2px); }

.chip-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  opacity: 0.85;
}

.portrait {
  position: relative;
  width: 280px;
  height: 280px;
  justify-self: center;
}

/* 渐变光晕，呼应原有的暖色头像背景 */
.halo {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #DCE3CC, #F0E8D8, #C9D5E8);
  filter: blur(6px);
  opacity: 0.85;
}
:global(.dark) .halo { opacity: 0.4; }

.portrait-img {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
  box-shadow: var(--shadow);
}

.scroll-hint {
  display: block;
  text-align: center;
  padding: 60px 0 24px;
  color: var(--ink-3);
  font-size: 18px;
  text-decoration: none;
}
.scroll-hint:hover { color: var(--ink); }

.grid-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 32px 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  scroll-margin-top: 80px;
}

@media (max-width: 1000px) {
  .grid-section { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .profile { grid-template-columns: 1fr; padding-top: 40px; min-height: auto; }
  .portrait { width: 220px; height: 220px; }
  .grid-section { grid-template-columns: 1fr; }
}

.more-row {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 32px 0;
  display: flex;
  justify-content: flex-end;
}

.more-btn {
  background: var(--card);
  border: 0;
  border-radius: 999px;
  padding: 10px 18px;
  box-shadow: var(--shadow);
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.15s ease;
}
.more-btn:hover { color: var(--ink); }
</style>
