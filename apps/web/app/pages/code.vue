<template>
  <!--
    /code —— 占位页：暂时只保留一个 v3 风格的 hero。
    真正接入代码片段/项目卡之前，先用 chlo.is mood 的占位卡兜住路由。
  -->
  <section class="page">
    <div class="mono kicker">CODE · COMING SOON</div>
    <div class="kicker-rule" />
    <h1 class="cn title">代码</h1>
    <p class="cn lede">这里以后会放一些项目卡片、代码片段，以及我会反复打开的工程目录。</p>
  </section>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 32px 0;
}

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
</style>
