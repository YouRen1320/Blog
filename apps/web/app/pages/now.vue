<template>
  <!--
    /now —— v3 设计的 "如今" 页：
    单列 720px 阅读栏，顶部为标题 + mono 元数据条；
    紧接一个浮起的目录卡（折叠交互后续接），随后是 chlo.is mood 的正文：
      · 普通段落用 cn (Noto Serif SC) + 1.85 行高
      · 内联引用 borderLeft 用 --rule
      · 大段引述块用 card 浮起 + serif 字体
    所有颜色走 token，自动跟随暗色模式。
  -->
  <article class="page">
    <header class="head">
      <h1 class="cn title">如今</h1>
      <div class="mono meta">
        <span>◷ 2 分钟阅读</span>
        <span>≣ 851 字</span>
        <span>✎ 更新于 2026-04-02</span>
      </div>
    </header>

    <!-- 目录卡（视觉与交互简化版） -->
    <button class="toc" type="button" @click="tocOpen = !tocOpen">
      <span class="cn toc-label">≡ 目录</span>
      <span class="toc-chevron" :class="{ open: tocOpen }">⌄</span>
    </button>
    <nav v-if="tocOpen" class="toc-list cn">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="toc-link"
      >
        {{ section.title }}
      </a>
    </nav>

    <div class="prose cn">
      <p>这里是园子的「如今」页面，也称：</p>
      <blockquote class="inline-quote serif-disp">
        某只元素娘的精神状态信息公示板
      </blockquote>

      <h2 id="about-now" class="section">有关 / now</h2>
      <p>
        这里原本有一段简短的 Now Page 的介绍，但小氯把它去掉了。它的名字本身和它的创始人
        <a class="accent">Derek Sivers</a> 已经把事情讲得很明白了。
      </p>

      <blockquote class="card-quote serif">
        So a website with a link that says "now" goes to a page that tells you what
        this person is focused on at this point in their life. For short, we call it
        a "now page".<br><br>
        [...]<br><br>
        Think of <strong>what you'd tell a friend you hadn't seen in a year.</strong>
        <br><br>
        <em class="accent">NowNowNow</em>
      </blockquote>

      <p>
        所以，如您所见，我并不会在这里讲什么具体的、微小的动态。如果您希望听碎碎念，
        可以去 <a class="accent">Fediverse</a> 看热闹。
      </p>

      <h2 id="bacterium" class="section">菌落</h2>
      <p>
        最近我刷 Fediverse 的强度异常高，闲来无事就跑到 TL 上和老友们 Connect deep, grow wild.
        大概社交媒体的价值就在于此吧。
      </p>

      <h2 id="reading" class="section">在读</h2>
      <p>
        正在读一些不太相关的书：和分布式系统有关的论文、一本 19 世纪的小说、几篇关于「占地」与
        城市边界的随笔。它们之间没有线索，但放在一起看反而让脑子安静下来。
      </p>

      <h2 id="building" class="section">在做</h2>
      <p>
        慢慢搭这个站点。它不像产品，更像是一个能放心走久的地方——每次写完一篇，就像把石头压住一页风。
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
// 目录展开状态。点击目录卡时切换。
const tocOpen = ref(true)

// 目录数据：与正文中 h2 的 id 一一对应。
const sections = [
  { id: 'about-now', title: '有关 / now' },
  { id: 'bacterium', title: '菌落' },
  { id: 'reading', title: '在读' },
  { id: 'building', title: '在做' },
]
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 32px 0;
}

.head { margin-bottom: 28px; }

.title {
  font-size: 32px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.meta {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 12px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.toc {
  width: 100%;
  background: var(--card);
  border: 0;
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 16px;
  text-align: left;
  color: inherit;
}

.toc-label {
  font-size: 13px;
  color: var(--ink-2);
}

.toc-chevron {
  color: var(--ink-3);
  transition: transform 0.2s ease;
}
.toc-chevron.open { transform: rotate(180deg); }

.toc-list {
  background: var(--card);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 10px 18px 14px;
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-link {
  font-size: 14px;
  color: var(--ink-2);
  text-decoration: none;
  padding: 4px 0;
}
.toc-link:hover { color: var(--accent); }

.prose {
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink-2);
}

.prose p { margin: 0 0 18px; }

.section {
  font-size: 22px;
  font-weight: 600;
  margin-top: 40px;
  margin-bottom: 14px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
  scroll-margin-top: 80px;
}

.inline-quote {
  border-left: 2px solid var(--rule);
  margin: 20px 0;
  padding: 4px 16px;
  color: var(--ink-3);
  font-style: italic;
  font-size: 16px;
}

.card-quote {
  background: var(--card);
  border-radius: 8px;
  padding: 20px 24px;
  margin: 24px 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
  box-shadow: var(--shadow);
}

.accent {
  color: var(--accent);
  cursor: pointer;
  text-decoration: none;
}
.accent:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
