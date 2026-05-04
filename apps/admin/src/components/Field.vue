<template>
  <!--
    Field —— 设置页通用的表单字段容器：
      label（mono caption）+ optional hint（短说明）+ slot（控件本体）
    保持留白和分隔线一致，避免在 Settings 里反复写一样的 .row。
  -->
  <div class="field">
    <div class="head">
      <label class="mono label">{{ label }}</label>
      <span v-if="hint" class="hint cn">{{ hint }}</span>
    </div>
    <div class="control">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
</script>

<style scoped>
.field {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  padding: 16px 0;
  border-top: 1px solid var(--rule);
  align-items: start;
}
.field:first-child { border-top: 0; }

.head { display: flex; flex-direction: column; gap: 4px; }

.label {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--ink);
  text-transform: uppercase;
}

.hint {
  font-size: 12px;
  color: var(--ink-3);
}

.control { min-width: 0; }

@media (max-width: 720px) {
  .field { grid-template-columns: 1fr; }
}
</style>
