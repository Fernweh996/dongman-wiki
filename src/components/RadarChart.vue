<script setup lang="ts">
import type { CharacterStats } from '../data/works'

const props = defineProps<{ stats: CharacterStats; size?: number }>()

const LABELS: { key: keyof CharacterStats; label: string }[] = [
  { key: 'power', label: '战力' },
  { key: 'wisdom', label: '智谋' },
  { key: 'speed', label: '速度' },
  { key: 'defense', label: '防御' },
  { key: 'technique', label: '技巧' },
  { key: 'potential', label: '潜力' },
]

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const s = props.size ?? 220
const cx = s / 2
const cy = s / 2
const maxR = s * 0.36
const angleStep = 360 / LABELS.length

function hexPoints(scale: number) {
  return LABELS.map((_, i) => {
    const { x, y } = polarToXY(cx, cy, maxR * scale, i * angleStep)
    return `${x},${y}`
  }).join(' ')
}

const dataPoints = LABELS.map((l, i) => {
  const val = Math.min(100, Math.max(0, props.stats[l.key])) / 100
  const { x, y } = polarToXY(cx, cy, maxR * val, i * angleStep)
  return `${x},${y}`
}).join(' ')

const axisEnds = LABELS.map((_, i) => polarToXY(cx, cy, maxR, i * angleStep))

const dataCircles = LABELS.map((l, i) => {
  const val = Math.min(100, Math.max(0, props.stats[l.key])) / 100
  return polarToXY(cx, cy, maxR * val, i * angleStep)
})

const labelPositions = LABELS.map((l, i) => ({
  ...polarToXY(cx, cy, maxR + 20, i * angleStep),
  label: l.label,
  key: l.key,
}))
</script>

<template>
  <svg :width="s" :height="s" :viewBox="`0 0 ${s} ${s}`">
    <polygon
      v-for="scale in [0.25, 0.5, 0.75, 1.0]"
      :key="scale"
      :points="hexPoints(scale)"
      class="radar-axis"
      fill="none"
    />
    <line
      v-for="(end, i) in axisEnds"
      :key="'ax' + i"
      :x1="cx"
      :y1="cy"
      :x2="end.x"
      :y2="end.y"
      class="radar-axis"
    />
    <polygon :points="dataPoints" class="radar-fill" />
    <circle
      v-for="(pt, i) in dataCircles"
      :key="'d' + i"
      :cx="pt.x"
      :cy="pt.y"
      r="3.5"
      fill="var(--pink-darker)"
    />
    <text
      v-for="lp in labelPositions"
      :key="lp.key"
      :x="lp.x"
      :y="lp.y"
      text-anchor="middle"
      dominant-baseline="central"
      class="radar-label"
    >
      {{ lp.label }}
    </text>
  </svg>
</template>
