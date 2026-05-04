<template>
  <!--
    /notes —— v3 mood：
    单列 720px；按年份分组；每条 note 一张紧凑卡片：
      mono date · cn 标题 · cn 摘要
    与 /writing 列表行风格对照：notes 用 card 而非 row，强调"小段独立"。
  -->
  <section class="page">
    <header class="head">
      <div class="mono kicker">NOTES · {{ totalNotes }} ENTRIES</div>
      <div class="kicker-rule" />
      <h1 class="cn title">碎片</h1>
      <p class="cn lede">一些更短的记录、随笔和还没有长成正式文章的片段。</p>
    </header>

    <section
      v-for="group in groupedNotes"
      :key="group.year"
      class="year-block"
    >
      <h2 class="cn year-title">{{ group.year }}</h2>

      <div class="cards">
        <article
          v-for="note in group.items"
          :key="`${group.year}-${note.date}`"
          class="card"
        >
          <div class="mono note-date">{{ group.year }}-{{ note.date }}</div>
          <a :href="note.href" class="cn note-title">{{ note.title }}</a>
          <p class="cn note-summary">{{ note.summary }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 每年一组；items 数组是这一年的所有 note。
const groupedNotes = [
  {
    year: 2026,
    items: [
      {
        title: '在深夜改页面时想到的事',
        href: '#',
        summary: '有些页面不是为了完成任务，而是为了让自己更确定想把什么留下来。',
        date: '04-02',
      },
      {
        title: '关于慢一点的写作',
        href: '#',
        summary: '比起立刻发布，我更想把一些句子放久一点，看看它们最后会变成什么。',
        date: '03-28',
      },
      {
        title: '一个人维护小站的快乐',
        href: '#',
        summary: '它不是特别高效，却会让我很清楚哪些东西是真正属于自己的。',
        date: '03-18',
      },
    ],
  },
  {
    year: 2025,
    items: [
      {
        title: '想把零散记录整理起来',
        href: '#',
        summary: '也许笔记、短句和随笔不必被严格区分，它们都可以先留在这里。',
        date: '12-06',
      },
      {
        title: '一些没有写成文章的话',
        href: '#',
        summary: '不是所有想法都需要被写成长文，短一点也很好。',
        date: '09-14',
      },
    ],
  },
]

const totalNotes = computed(() =>
  groupedNotes.reduce((s, g) => s + g.items.length, 0),
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

.year-block { margin-bottom: 48px; }

.year-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--ink);
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: var(--card);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 18px 22px;
}

.note-date {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.note-title {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.note-title:hover { color: var(--accent); }

.note-summary {
  font-size: 14px;
  color: var(--ink-2);
  margin: 8px 0 0;
  line-height: 1.65;
}
</style>
