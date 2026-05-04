<template>
  <!--
    InkArt — procedural black-and-white "ink wash" thumbnail for article cards.
    Three deterministic variants (chosen by `seed % 3`) so re-renders keep the
    same look. Pure SVG, no images required. Adapted from design's `InkArt`.
  -->
  <svg
    viewBox="0 0 200 180"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    role="presentation"
  >
    <rect width="200" height="180" fill="#0E0E0C" />

    <!-- Variant 0: braided horizontal sweeps -->
    <g v-if="variant === 0" stroke="#fff" stroke-width="0.4" fill="none" opacity="0.7">
      <path
        v-for="i in 60"
        :key="`a-${i}`"
        :d="bracePath(i - 1)"
      />
    </g>

    <!-- Variant 1: vertical mist columns -->
    <g v-else-if="variant === 1" stroke="#fff" stroke-width="0.3" fill="none" opacity="0.55">
      <path
        v-for="i in 80"
        :key="`b-${i}`"
        :d="mistPath(i - 1)"
      />
    </g>

    <!-- Variant 2: rotating ellipse plumes -->
    <g v-else stroke="#fff" stroke-width="0.5" fill="none" opacity="0.6">
      <ellipse
        v-for="i in 40"
        :key="`c-${i}`"
        :cx="ellipseCx(i - 1)"
        cy="90"
        :rx="8 + (i - 1) * 2"
        :ry="(8 + (i - 1) * 2) * 0.3"
        :transform="`rotate(${(i - 1) * 4 + seed * 10} 100 90)`"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
// `seed` selects the variant and seeds its pseudo-randomness so the same
// article always paints the same texture.
const props = withDefaults(defineProps<{ seed?: number }>(), { seed: 0 })

const variant = computed(() => Math.abs(props.seed) % 3)

function bracePath(i: number) {
  const startY = 100 + Math.sin(i * 0.3 + props.seed) * 30
  const ctrlY = 20 + ((i * 13) % 60)
  const endY = 140 + Math.cos(i * 0.2 + props.seed) * 40
  return `M${20 + i * 2} ${startY} Q ${100 + i} ${ctrlY}, ${180 - i * 1.5} ${endY}`
}

function mistPath(i: number) {
  const x1 = 100 + Math.sin(i * 0.5 + props.seed) * 60
  const x2 = 100 + Math.sin(i * 0.5 + props.seed + 0.4) * 70
  const y1 = 10 + i * 1.8
  const y2 = 20 + i * 1.8
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

function ellipseCx(i: number) {
  return 100 + Math.sin(i + props.seed) * 8
}
</script>
