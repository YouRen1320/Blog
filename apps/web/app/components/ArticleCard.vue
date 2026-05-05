<template>
  <!--
    ArticleCard — v3 chlo.is split layout.

    Top half is a 50/50 split:
      left  → French Republican Calendar month (mono caption) + serif title
              + italic 'Youren' attribution (echoes the chlo.is signature).
      right → procedural ink-wash artwork (InkArt) on a #0E0E0C background.

    Bottom half lives below a hairline rule and contains the headline again
    in larger serif, summary, and the meta row (date · read time · pinned).

    The card itself is a soft cream "card" surface with the v3 `--shadow`,
    so the warm-gray page bg shows around it.
  -->
  <article class="card">
    <div class="top">
      <div class="meta">
        <div>
          <div class="mono caption">{{ post.season }}</div>
          <div class="caption-rule" />
        </div>
        <div class="cn title-sm">{{ post.title }}</div>
        <div class="serif-disp signature">{{ post.author }}</div>
      </div>
      <div class="art">
        <InkArt :seed="post.seed ?? 0" />
      </div>
    </div>

    <div class="body">
      <h3 class="cn title">{{ post.title }}</h3>
      <p class="cn summary">{{ post.summary }}</p>
      <div class="footer">
        <span>◷ {{ post.date }}</span>
        <span>⌖ {{ post.readingTime }}</span>
        <span v-if="post.commentCount && post.commentCount > 0">💬 {{ post.commentCount }}</span>
        <span class="spacer" />
        <span v-if="post.pinned" class="pinned">★ 置顶</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import InkArt from './InkArt.vue'

// Card data shape. `seed` selects which InkArt variant paints the cover;
// `season` is the French Republican Calendar month label shown as a caption.
interface PostCard {
  // 数据库 cuid 是 string;v3 mock 时是 number。这里用 union 兼容两种。
  id: string | number
  season: string
  title: string
  author: string
  summary: string
  date: string
  readingTime: string
  pinned?: boolean
  seed?: number
  // V1.19:已审核评论数,>0 才渲染 💬 N
  commentCount?: number
}

defineProps<{
  post: PostCard
}>()
</script>

<style scoped>
.card {
  background: var(--card);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 168px;
}

.meta {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.caption {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
}

.caption-rule {
  width: 18px;
  height: 1px;
  background: var(--ink-3);
  margin-top: 4px;
}

.title-sm {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.signature {
  font-style: italic;
  font-size: 16px;
  color: var(--accent);
}

.art {
  background: #0E0E0C; /* keeps the dark frame even before SVG paints */
}

.body {
  padding: 20px 18px 18px;
  border-top: 1px solid var(--rule);
}

.title {
  font-size: 17px;
  margin: 0;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.summary {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 18px;
}

.footer {
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: var(--ink-3);
  align-items: center;
}

.spacer { flex: 1; }
.pinned { color: #A78A3D; }
</style>
