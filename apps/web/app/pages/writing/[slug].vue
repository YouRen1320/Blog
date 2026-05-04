<template>
  <!--
    /writing/[slug] —— 文章详情页（v3 chlo.is mood）
    单列 720px：
      · 顶部 kicker：共和历月份 + mono 小标 + 短分隔线
      · 中央：标题、副标、mono 元数据（阅读时长 / 字数 / 日期 / 置顶）
      · hero：黑底 InkArt（与卡片封面同源）
      · 目录卡（折叠）
      · 正文 prose：段落 / h2 / 引文 / 代码块 / 强调标签
      · 底部 prev / next 卡片对
    数据当前是内联 mock。等接入 NestJS 后端时换成 useFetch。
  -->
  <article class="page">
    <div class="kicker mono">{{ post.season }}</div>
    <div class="kicker-rule" />

    <h1 class="cn title">{{ post.title }}</h1>
    <p class="cn subtitle">{{ post.subtitle }}</p>

    <div class="meta mono">
      <span>◷ {{ post.readingTime }}</span>
      <span>≣ {{ post.wordCount }}</span>
      <span>✎ {{ post.date }}</span>
      <span v-if="post.pinned" class="pinned">★ 置顶</span>
    </div>

    <!-- hero ink-art 封面 -->
    <div class="hero">
      <InkArt :seed="post.seed" />
    </div>

    <!-- 折叠目录 -->
    <button class="toc" type="button" @click="tocOpen = !tocOpen">
      <span class="cn toc-label">≡ 目录 · {{ post.sections.length }} 章节</span>
      <span class="toc-chevron" :class="{ open: tocOpen }">⌄</span>
    </button>
    <nav v-if="tocOpen" class="toc-list cn">
      <a
        v-for="section in post.sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="toc-link"
      >
        {{ section.title }}
      </a>
    </nav>

    <!-- 正文 -->
    <div class="prose cn">
      <p>
        查戈斯群岛——这串散落在印度洋中部的珊瑚环礁，对于绝大多数人来说，是一个完全陌生的地名。
        但若提起它的顶级域名 <span class="mono inline-code">.io</span>，开发者们便不会陌生。
      </p>
      <p>这是一个关于殖民、流离、与一个互联网命名空间如何意外成为科技行业图腾的故事。</p>

      <h2 id="exiled" class="section">一、被驱逐的群岛</h2>
      <p>
        1965 年，英国从毛里求斯切割出查戈斯群岛，命名为「英属印度洋领地」。三年后，岛上原住民——
        查戈斯人——开始被强制迁离。这场驱逐在国际社会中沉寂了将近半个世纪。
      </p>

      <blockquote class="pull-quote serif-disp">
        一个域名的存亡，背后是真实的人在被记起或被遗忘。
      </blockquote>

      <h2 id="io-tld" class="section">二、IO 顶级域名的诞生</h2>
      <p>
        1997 年，IANA 为「英属印度洋领地」分配了 <span class="mono inline-code">.io</span> 国家代码顶级域名。
        它的注册与运营由一家私人公司接管。在此后近三十年间，这个域名成为科技公司的最爱：短、酷、暗合
        input/output 的双关。
      </p>

      <pre class="code mono">$ whois example.io
Domain Name: EXAMPLE.IO
Registry: .io Registry
Country: British Indian Ocean Territory</pre>

      <p>但每一次输入这个后缀，几乎没有人想到那个被驱逐的故事。</p>
    </div>

    <!-- 上下篇导航 -->
    <nav class="prev-next">
      <NuxtLink v-if="post.prev" :to="`/writing/${post.prev.slug}`" class="nav-card">
        <div class="mono nav-kicker">← PREVIOUS</div>
        <div class="cn nav-title">{{ post.prev.title }}</div>
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="post.next" :to="`/writing/${post.next.slug}`" class="nav-card right">
        <div class="mono nav-kicker">NEXT →</div>
        <div class="cn nav-title">{{ post.next.title }}</div>
      </NuxtLink>
    </nav>
  </article>
</template>

<script setup lang="ts">
import InkArt from '../../components/InkArt.vue'

// 拿到当前 slug。后续接 API 时按这个 slug 去请求 /api/posts/:slug。
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// 折叠目录开关。
const tocOpen = ref(false)

// 内联 mock：仅做视觉走查。真实数据应来自后端。
// 用一个常量对象兜底，未匹配 slug 时直接展示这一篇。
const post = computed(() => ({
  slug: slug.value || 'chagos-io',
  season: 'VENDÉMIAIRE',
  title: '查戈斯群岛与 .io 的命运',
  subtitle: '献与被遗忘者。',
  readingTime: '22 分钟阅读',
  wordCount: '6,420 字',
  date: '2025-08-06',
  pinned: true,
  seed: 0,
  sections: [
    { id: 'exiled', title: '一、被驱逐的群岛' },
    { id: 'io-tld', title: '二、IO 顶级域名的诞生' },
    { id: 'tech-mascot', title: '三、科技图腾的形成' },
    { id: 'sovereignty', title: '四、主权回归' },
    { id: 'aftermath', title: '五、若 .io 退场' },
  ],
  prev: { slug: 'rings', title: '「环节」' },
  next: { slug: 'hello-mitra', title: 'Hello, Mitra' },
}))
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 32px 0;
}

.kicker {
  font-size: 9px;
  color: var(--ink-3);
  letter-spacing: 0.18em;
  margin-bottom: 6px;
}

.kicker-rule {
  width: 24px;
  height: 1px;
  background: var(--ink-3);
  margin-bottom: 22px;
}

.title {
  font-size: 34px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.subtitle {
  font-size: 15px;
  color: var(--ink-2);
  margin: 12px 0 24px;
}

.meta {
  font-size: 11px;
  color: var(--ink-3);
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.meta .pinned { color: #A78A3D; }

.hero {
  height: 280px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow);
  margin-bottom: 36px;
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
  margin: 44px 0 14px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
  scroll-margin-top: 80px;
}

.inline-code {
  font-size: 14px;
  background: var(--card);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--ink);
}

.pull-quote {
  border-left: 2px solid var(--accent);
  margin: 32px 0;
  padding: 4px 18px;
  color: var(--ink-2);
  font-style: italic;
  font-size: 18px;
  line-height: 1.6;
}

.code {
  background: var(--card);
  border-radius: 8px;
  padding: 20px 24px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-2);
  overflow: auto;
  box-shadow: var(--shadow);
  margin: 24px 0;
  white-space: pre;
}

.prev-next {
  margin-top: 60px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.nav-card {
  background: var(--card);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: var(--shadow);
  text-decoration: none;
  color: inherit;
  display: block;
}
.nav-card.right { text-align: right; }

.nav-kicker {
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
}

.nav-title {
  font-size: 14px;
  font-weight: 600;
  margin-top: 6px;
  color: var(--ink);
}
.nav-card:hover .nav-title { color: var(--accent); }
</style>
