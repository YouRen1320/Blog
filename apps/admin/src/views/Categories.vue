<template>
  <!--
    /categories —— 后台「分类」管理。
    与 Tags 使用同样的表格骨架，但分类一般少很多，列里会带「描述」字段。
  -->
  <AdminShell active="cats">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker">CATEGORIES</div>
            <div class="kicker-rule" />
            <h1 class="cn title">分类管理</h1>
            <p class="cn lede">为内容拟定有限的、稳定的归类。{{ categories.length }} 个分类。</p>
          </div>
          <button class="primary" type="button">+ 新建分类</button>
        </div>
      </header>

      <section class="card table">
        <div class="row head mono">
          <span>NAME</span>
          <span>DESCRIPTION</span>
          <span>POSTS</span>
          <span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="cat in categories" :key="cat.slug" class="row body">
          <span class="cn name">{{ cat.name }}</span>
          <span class="cn desc">{{ cat.desc }}</span>
          <span class="mono count">{{ cat.posts }}</span>
          <span class="actions">
            <button class="link" type="button">编辑</button>
            <button class="link danger" type="button">删除</button>
          </span>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import AdminShell from '../components/AdminShell.vue'

// 分类数据：和标签不同，分类是有限稳定的，所以条目很少。
const categories = [
  { name: '随笔', slug: 'essay', desc: '日常的、私人化的、未必有定论的文字。', posts: 18 },
  { name: '技术笔记', slug: 'tech', desc: '工程上的具体探索与学习记录。', posts: 22 },
  { name: '阅读', slug: 'reading', desc: '读书、读论文、读代码后的整理。', posts: 13 },
  { name: '历史', slug: 'history', desc: '从域名、地名、概念出发的历史小考。', posts: 5 },
  { name: '设计', slug: 'design', desc: '关于网页、字体、视觉与节奏的笔记。', posts: 9 },
]
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.hero { padding: 32px 36px; }

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
}

.kicker-rule {
  width: 18px;
  height: 1px;
  background: var(--ink-3);
  margin: 4px 0 14px;
}

.title {
  font-size: 30px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.lede {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 0;
}

.primary {
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.primary:hover { opacity: 0.92; }

.table { padding: 8px 0; }

.row {
  display: grid;
  grid-template-columns: 1.4fr 3fr 0.8fr 1fr;
  gap: 16px;
  padding: 14px 32px;
  align-items: center;
}

.row.head {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  border-bottom: 1px solid var(--rule);
}

.row.body { border-top: 1px solid var(--rule); }
.row.body:first-of-type { border-top: 0; }

.row.body:hover { background: var(--bg); }

.actions-head { text-align: right; }

.name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.desc {
  font-size: 13px;
  color: var(--ink-2);
}

.count {
  font-size: 12px;
  color: var(--ink-2);
}

.actions {
  display: flex;
  gap: 14px;
  justify-content: flex-end;
}

.link {
  background: transparent;
  border: 0;
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}
.link:hover { color: var(--ink); }
.link.danger:hover { color: #B95C50; }
</style>
