<template>
  <!--
    Toggle —— v3 风格的开关：
      左侧药丸轨道（var(--bg)），右侧 16px 圆点。
      开启时轨道背景换成 accent，圆点滑到右侧。
    用 v-model:modelValue 双向绑定 boolean。
  -->
  <button
    type="button"
    class="toggle"
    role="switch"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="cn label">{{ label }}</span>
    <span class="track" :class="{ on: modelValue }">
      <span class="dot" />
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--rule);
  padding: 16px 0;
  cursor: pointer;
  text-align: left;
}

.label {
  font-size: 14px;
  color: var(--ink);
}

.track {
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--bg);
  border: 1px solid var(--rule);
  position: relative;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--card);
  box-shadow: var(--shadow);
  transition: transform 0.15s ease;
}

.track.on {
  background: var(--accent);
  border-color: var(--accent);
}
.track.on .dot { transform: translateX(16px); }
</style>
