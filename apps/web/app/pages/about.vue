<template>
  <!--
    /about —— v3 chlo.is mood：
    单列 720px；顶部 mono kicker + 标题 + lede；
    目录用浮起的 card 而非左侧 border 列表，与 /now 对齐；
    各小节带 h2 hairline rule，正文走 cn 16/1.85。
  -->
  <article class="page">
    <header class="head">
      <div class="mono kicker">ABOUT · YOUREN</div>
      <div class="kicker-rule" />
      <h1 class="cn title">关于</h1>
      <p class="cn lede">关于我，也关于这个站点为什么会以这样的方式存在。</p>
    </header>

    <button class="toc" type="button" @click="tocOpen = !tocOpen">
      <span class="cn toc-label">≡ 目录 · {{ sections.length }} 节</span>
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
      <h2 id="who-am-i" class="section">Who am I</h2>
      <p>
        我是 YouRen。平时写代码，也写一点文字，偶尔会把一些和技术、表达、审美有关的想法放到这里。
      </p>
      <p>
        我不太想把自己定义得过于固定。与其说我是什么，不如说我一直在不同兴趣之间移动，
        然后慢慢学着把它们整理成一个更完整的自我。
      </p>

      <h2 id="what-i-do" class="section">What I do</h2>
      <p>
        现在我主要把精力放在编程、写作和持续学习上。对我来说，这三件事并不是彼此分开的，
        它们经常会在同一段时间里互相影响。
      </p>
      <p>
        我喜欢那种既能动手做、又能留下痕迹的事情：做一个页面、写一篇文章、整理一个长期会继续维护的小项目。
      </p>

      <h2 id="this-blog" class="section">This blog</h2>
      <blockquote class="card-quote serif-disp">
        It is not a place that updates fast. It is a place that stays.
      </blockquote>
      <p>
        这个博客对我来说，不只是一个放内容的地方。它更像一个稳定的自留地：可以慢慢写，慢慢改，
        也可以允许自己在这里保留一些还没有完全成形的想法。
      </p>
      <p>
        我希望它不是一个只追求更新频率的站点，而是一个能够长久留下来、持续生长的地方。
      </p>

      <h2 id="contact" class="section">Contact</h2>
      <p>
        如果你想通过友链、站点交流、或者其他方式联系我，
        这里会慢慢补上更完整的联系方式。
        目前你也可以先把这里当成一个持续更新的自我介绍页。
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
// 目录默认收起，点击展开。
const tocOpen = ref(false)

// 与正文 h2 的 id 一一对应。
const sections = [
  { id: 'who-am-i', title: 'Who am I' },
  { id: 'what-i-do', title: 'What I do' },
  { id: 'this-blog', title: 'This blog' },
  { id: 'contact', title: 'Contact' },
]
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 28px; }

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

.toc-label { font-size: 13px; color: var(--ink-2); }

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

.card-quote {
  background: var(--card);
  border-radius: 8px;
  padding: 20px 24px;
  margin: 24px 0;
  font-size: 16px;
  font-style: italic;
  line-height: 1.55;
  color: var(--ink-2);
  box-shadow: var(--shadow);
}
</style>
