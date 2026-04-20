<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ForceGraph from 'force-graph'
import type { Work } from '../data/works'
import type { PanelEntity } from '../components/RightPanel.vue'

interface GraphNode {
  id: string
  name: string
  tier: 1 | 2 | 3
  gender: 'male' | 'female' | 'unknown'
  factions: string[]
  x?: number
  y?: number
  fx?: number
  fy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: string
}

const props = defineProps<{
  work: Work
}>()

const emit = defineEmits<{
  openPanel: [entity: PanelEntity]
}>()

const containerRef = ref<HTMLDivElement>()
const hoveredNode = ref<string | null>(null)
const focusedNode = ref<string | null>(null)
const resetKey = ref(0)
const selectedSeason = ref<number | null>(null)

let graph: any = null

const TIER_RADIUS: Record<1 | 2 | 3, number> = { 1: 28, 2: 18, 3: 13 }

const GENDER_COLORS: Record<string, string> = {
  male: '#8ba7b8',
  female: '#c4929e',
  unknown: '#a0999f',
}

const FACTION_COLORS = [
  '#b87272', '#7b96a8', '#8aaa7e', '#c4a66a',
  '#9b88a4', '#7caab0', '#b08a9a', '#98a87b',
]

const useFactionColors = computed(() => props.work.id === 'yi-ren-zhi-xia')

const factionColorMap = computed(() => {
  const map = new Map<string, string>()
  const names = props.work.factions.map((f) => f.name)
  const memberIds = new Set(props.work.factions.flatMap((f) => f.members))
  if (props.work.characters.some((c) => !memberIds.has(c.id))) names.push('无阵营')
  names.forEach((name, i) => {
    map.set(name, FACTION_COLORS[i % FACTION_COLORS.length])
  })
  return map
})

const charFactionsMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const f of props.work.factions) {
    for (const mid of f.members) {
      const list = map.get(mid) ?? []
      list.push(f.name)
      map.set(mid, list)
    }
  }
  return map
})

const coreIds = computed(() => new Set(props.work.characters.filter((c) => c.tier === 1).map((c) => c.id)))

const legend = computed(() => {
  if (!useFactionColors.value) {
    const items: { name: string; color: string }[] = []
    const hasM = props.work.characters.some((c) => c.gender === 'male')
    const hasF = props.work.characters.some((c) => c.gender === 'female')
    const hasU = props.work.characters.some((c) => c.gender === 'unknown')
    if (hasM) items.push({ name: '男', color: GENDER_COLORS.male })
    if (hasF) items.push({ name: '女', color: GENDER_COLORS.female })
    if (hasU) items.push({ name: '未知', color: GENDER_COLORS.unknown })
    return items
  }
  const items: { name: string; color: string }[] = []
  const memberIds = new Set(props.work.factions.flatMap((f) => f.members))
  for (const f of props.work.factions) {
    items.push({ name: f.name, color: factionColorMap.value.get(f.name) ?? '#8a7e90' })
  }
  if (props.work.characters.some((c) => !memberIds.has(c.id))) {
    items.push({ name: '无阵营', color: factionColorMap.value.get('无阵营') ?? '#8a7e90' })
  }
  return items
})

const graphData = computed(() => {
  // trigger rebuild on resetKey
  void resetKey.value
  const charIds = new Set(props.work.characters.map((c) => c.id))
  const cx = 0
  const cy = 0

  const coreChars = props.work.characters.filter((c) => c.tier === 1)
  const t2Chars = props.work.characters.filter((c) => c.tier === 2)
  const t3Chars = props.work.characters.filter((c) => c.tier === 3)

  const nodes: GraphNode[] = []

  coreChars.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / Math.max(coreChars.length, 1)
    const rx = coreChars.length > 1 ? 100 : 0
    const ry = coreChars.length > 1 ? 50 : 0
    nodes.push({
      id: c.id, name: c.name, tier: c.tier, gender: c.gender,
      factions: charFactionsMap.value.get(c.id) ?? ['无阵营'],
      x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle),
    })
  })

  t2Chars.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / Math.max(t2Chars.length, 1) - Math.PI / 2
    nodes.push({
      id: c.id, name: c.name, tier: c.tier, gender: c.gender,
      factions: charFactionsMap.value.get(c.id) ?? ['无阵营'],
      x: cx + 380 * Math.cos(angle), y: cy + 200 * Math.sin(angle),
    })
  })

  t3Chars.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / Math.max(t3Chars.length, 1) + Math.PI / 4
    nodes.push({
      id: c.id, name: c.name, tier: c.tier, gender: c.gender,
      factions: charFactionsMap.value.get(c.id) ?? ['无阵营'],
      x: cx + 520 * Math.cos(angle), y: cy + 280 * Math.sin(angle),
    })
  })

  const links: GraphLink[] = []
  const linkSet = new Set<string>()
  for (const c of props.work.characters) {
    for (const rel of c.relations) {
      if (!charIds.has(rel.target)) continue
      if (selectedSeason.value !== null && rel.seasons && rel.seasons.length > 0) {
        if (!rel.seasons.includes(selectedSeason.value)) continue
      }
      const key = [c.id, rel.target].sort().join('|') + '|' + rel.type
      if (linkSet.has(key)) continue
      linkSet.add(key)
      links.push({ source: c.id, target: rel.target, type: rel.type })
    }
  }

  return { nodes, links }
})

const focusedNeighbors = computed(() => {
  if (!focusedNode.value) return null
  const neighbors = new Set<string>()
  neighbors.add(focusedNode.value)
  for (const link of graphData.value.links) {
    const src = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id
    const tgt = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id
    if (src === focusedNode.value) neighbors.add(tgt)
    if (tgt === focusedNode.value) neighbors.add(src)
  }
  return neighbors
})

function handleReset() {
  resetKey.value++
  focusedNode.value = null
  selectedSeason.value = null
}

function initGraph() {
  if (!containerRef.value) return
  // Clear previous
  if (graph) {
    graph._destructor?.()
    containerRef.value.innerHTML = ''
  }

  const fg = ForceGraph()(containerRef.value)
  graph = fg

  fg
    .graphData(JSON.parse(JSON.stringify(graphData.value)))
    .backgroundColor('rgba(0,0,0,0)')
    .d3AlphaDecay(0.04)
    .d3VelocityDecay(0.35)
    .warmupTicks(80)
    .cooldownTicks(200)
    .enableNodeDrag(true)
    .enableZoomInteraction(true)
    .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode
      const r = TIER_RADIUS[n.tier] / globalScale * 1.8
      const isHovered = hoveredNode.value === n.id
      const isCore = coreIds.value.has(n.id)
      const isFocused = focusedNode.value === n.id
      const fn = focusedNeighbors.value
      const isRelated = fn ? fn.has(n.id) : true
      const dimmed = fn !== null && !isRelated

      const colors = useFactionColors.value
        ? n.factions.map((f: string) => factionColorMap.value.get(f) ?? '#8a7e90')
        : [GENDER_COLORS[n.gender] ?? GENDER_COLORS.unknown]

      if (isCore && !dimmed) {
        ctx.beginPath()
        ctx.arc(n.x ?? 0, n.y ?? 0, r + 5 / globalScale, 0, 2 * Math.PI)
        ctx.strokeStyle = (colors[0] ?? '#8a7e90') + '50'
        ctx.lineWidth = 3 / globalScale
        ctx.stroke()
      }

      if (colors.length <= 1) {
        ctx.beginPath()
        ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI)
        const c = colors[0] ?? '#8a7e90'
        ctx.fillStyle = dimmed ? c + '18' : isFocused || isHovered ? c : c + 'dd'
        ctx.fill()
      } else {
        const sliceAngle = (2 * Math.PI) / colors.length
        colors.forEach((c: string, i: number) => {
          ctx.beginPath()
          ctx.moveTo(n.x ?? 0, n.y ?? 0)
          ctx.arc(n.x ?? 0, n.y ?? 0, r, -Math.PI / 2 + sliceAngle * i, -Math.PI / 2 + sliceAngle * (i + 1))
          ctx.closePath()
          ctx.fillStyle = dimmed ? c + '18' : isFocused || isHovered ? c : c + 'dd'
          ctx.fill()
        })
        if (!dimmed) {
          colors.forEach((_: string, i: number) => {
            const angle = -Math.PI / 2 + sliceAngle * i
            ctx.beginPath()
            ctx.moveTo(n.x ?? 0, n.y ?? 0)
            ctx.lineTo((n.x ?? 0) + r * Math.cos(angle), (n.y ?? 0) + r * Math.sin(angle))
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'
            ctx.lineWidth = 1 / globalScale
            ctx.stroke()
          })
        }
      }

      if (isFocused) {
        ctx.beginPath()
        ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI)
        ctx.strokeStyle = '#2a1f2d'
        ctx.lineWidth = 3 / globalScale
        ctx.stroke()
      } else if (isHovered && !dimmed) {
        ctx.beginPath()
        ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()
      }

      const fontSize = Math.max(14 / globalScale, 4)
      ctx.font = `${isCore ? 'bold ' : ''}${fontSize}px "Noto Sans SC", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = dimmed ? '#2a1f2d18' : '#2a1f2d'
      ctx.fillText(n.name, n.x ?? 0, (n.y ?? 0) + r + 4 / globalScale)
    })
    .nodePointerAreaPaint((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode
      const r = TIER_RADIUS[n.tier] / globalScale * 1.8
      ctx.beginPath()
      ctx.arc(n.x ?? 0, n.y ?? 0, r + 8 / globalScale, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    })
    .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const src = link.source as GraphNode
      const tgt = link.target as GraphNode
      if (!src.x || !src.y || !tgt.x || !tgt.y) return

      const isHL = hoveredNode.value !== null && (src.id === hoveredNode.value || tgt.id === hoveredNode.value)
      const fn = focusedNeighbors.value
      const isLinked = fn ? (fn.has(src.id) && fn.has(tgt.id)) : true
      const dimmed = fn !== null && !isLinked

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      if (dimmed) {
        ctx.strokeStyle = '#d8cfc015'
        ctx.lineWidth = 0.5 / globalScale
      } else if (isHL) {
        ctx.strokeStyle = '#a05070'
        ctx.lineWidth = 2 / globalScale
      } else {
        ctx.strokeStyle = '#d8cfc0'
        ctx.lineWidth = 0.8 / globalScale
      }
      ctx.stroke()

      if (!dimmed) {
        const mx = (src.x + tgt.x) / 2
        const my = (src.y + tgt.y) / 2
        const fs = Math.max(13 / globalScale, 4)
        ctx.font = `${fs}px "Noto Sans SC", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = isHL ? '#a05070' : '#998d7d'
        ctx.fillText(link.type, mx, my)
      }
    })
    .onNodeClick((node: any) => {
      focusedNode.value = focusedNode.value === node.id ? null : node.id
      emit('openPanel', { type: 'character', id: node.id, workId: props.work.id })
    })
    .onNodeHover((node: any) => {
      hoveredNode.value = node?.id ?? null
    })

  // Configure forces
  const MIN_DIST = 150
  fg.d3Force('charge')?.strength((node: any) => coreIds.value.has(node.id) ? -600 : -300)
  fg.d3Force('link')?.distance((link: any) => {
    const src = typeof link.source === 'string' ? link.source : link.source.id
    const tgt = typeof link.target === 'string' ? link.target : link.target.id
    if (coreIds.value.has(src) || coreIds.value.has(tgt)) return Math.max(MIN_DIST, 160)
    return Math.max(MIN_DIST, 200)
  })
  fg.d3Force('center')?.strength(0.02)

  // Fit to view after initial simulation
  setTimeout(() => {
    fg.zoomToFit(400, 60)
  }, 500)
}

// Resize observer
let ro: ResizeObserver | null = null

onMounted(() => {
  initGraph()

  if (containerRef.value) {
    ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (graph) {
        graph.width(width).height(height)
      }
    })
    ro.observe(containerRef.value)
  }
})

onUnmounted(() => {
  ro?.disconnect()
  if (graph) {
    graph._destructor?.()
    graph = null
  }
})

// Re-init when data changes
watch([graphData], () => {
  nextTick(() => initGraph())
})
</script>

<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
    }"
  >
    <!-- 顶部：图例 + 复位 -->
    <div
      :style="{
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(250, 246, 248, 0.92)',
        zIndex: 10,
        flexShrink: 0,
      }"
    >
      <!-- 图例 -->
      <div
        v-for="item in legend"
        :key="item.name"
        :style="{ display: 'flex', alignItems: 'center', gap: '4px' }"
      >
        <span
          :style="{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: item.color,
            display: 'inline-block',
          }"
        />
        <span
          :style="{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-heading)',
          }"
        >
          {{ item.name }}
        </span>
      </div>

      <!-- 季度筛选 -->
      <template v-if="work.seasons && work.seasons.length > 0">
        <span :style="{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }" />
        <button
          :style="{
            padding: '3px 10px',
            borderRadius: '14px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            border: selectedSeason === null ? '1.5px solid var(--accent)' : '1px solid var(--border)',
            background: selectedSeason === null ? 'var(--bg-accent-pink)' : 'transparent',
            color: selectedSeason === null ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: selectedSeason === null ? 600 : 400,
            transition: 'all 0.2s',
          }"
          @click="selectedSeason = null"
        >
          全部
        </button>
        <button
          v-for="s in work.seasons"
          :key="s.number"
          :style="{
            padding: '3px 10px',
            borderRadius: '14px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            border: selectedSeason === s.number ? '1.5px solid var(--accent)' : '1px solid var(--border)',
            background: selectedSeason === s.number ? 'var(--bg-accent-pink)' : 'transparent',
            color: selectedSeason === s.number ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: selectedSeason === s.number ? 600 : 400,
            transition: 'all 0.2s',
          }"
          @click="selectedSeason = s.number"
        >
          {{ s.name }}
        </button>
      </template>

      <span :style="{ flex: '1' }" />

      <!-- 复位按钮 -->
      <button
        :style="{
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-heading)',
          cursor: 'pointer',
          border: '1px solid var(--pink)',
          background: 'var(--bg-accent-pink)',
          color: 'var(--accent)',
          fontWeight: 600,
          transition: 'all 0.2s',
        }"
        @click="handleReset"
      >
        复位
      </button>
    </div>

    <!-- 图谱容器 -->
    <div ref="containerRef" :style="{ flex: '1', position: 'relative', minHeight: '0' }" />
  </div>
</template>
