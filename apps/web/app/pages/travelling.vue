<template>
  <!--
    /travelling —— v3 mood：
    与 /now、/about 同骨架。中部加一组"目的地占位卡"，每张卡上 mono 状态标。
    准备接入的外链（开往、十年之约等）先用 status="planned" 占位。
  -->
  <article class="page">
    <header class="head">
      <div class="mono kicker">TRAVELLING · WAYPOINTS</div>
      <div class="kicker-rule" />
      <h1 class="cn title">中转站</h1>
      <p class="cn lede">这是一个暂时性的跳转页，用来安放我之后会慢慢接入的项目、计划和外部入口。</p>
    </header>

    <div class="prose cn">
      <h2 id="about-this-page" class="section">关于这一页</h2>
      <p>
        这里不会是一个传统意义上的"文章页"，而更像是一个中转站。以后如果我接入开往、十年之约，
        或者整理一些值得单独放出来的外部入口，它们会逐步被放到这里。
      </p>
      <p>
        在真正接好这些外部链接之前，这一页先作为一个保留位置，说明它将来会承担什么角色。
      </p>

      <h2 id="plans" class="section">计划</h2>
      <p>
        目前比较明确的方向，是把一些和个人站、独立博客、站点互访有关的计划接进来。
        这样这个页面就不会只是一个链接出口，而会慢慢变成一个更完整的入口页。
      </p>
    </div>

    <div class="destinations">
      <div class="mono section-kicker">FUTURE DESTINATIONS</div>
      <div class="kicker-rule" />
      <div class="cards">
        <article
          v-for="dest in destinations"
          :key="dest.title"
          class="dest"
        >
          <div class="dest-head">
            <div class="cn dest-title">{{ dest.title }}</div>
            <span class="mono dest-status" :class="dest.status">
              {{ dest.status.toUpperCase() }}
            </span>
          </div>
          <p class="cn dest-desc">{{ dest.desc }}</p>
        </article>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// 占位目的地：status 控制右上角小标颜色（planned/wip/live）。
const destinations = [
  {
    title: '开往 / Travellings',
    desc: '加入由独立博客组成的随机串门环。',
    status: 'planned' as const,
  },
  {
    title: '十年之约',
    desc: '长期写作 / 长期维护的承诺记录。',
    status: 'planned' as const,
  },
  {
    title: 'IndieWebRing',
    desc: '与志同道合的个人站组成的小型 webring。',
    status: 'wip' as const,
  },
  {
    title: 'Atom / RSS',
    desc: '订阅入口，准备好就接到页脚。',
    status: 'wip' as const,
  },
]
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

.head { margin-bottom: 36px; }

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

.destinations { margin-top: 56px; }

.section-kicker {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }

.dest {
  background: var(--card);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 18px 22px;
}

.dest-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.dest-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.dest-status {
  font-size: 9px;
  letter-spacing: 0.18em;
}
.dest-status.planned { color: var(--ink-3); }
.dest-status.wip { color: var(--accent); }
.dest-status.live { color: #6FA37F; }

.dest-desc {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 0;
  line-height: 1.6;
}
</style>
