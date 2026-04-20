<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { works } from '../data/works'

interface SearchResult {
  workId: string
  workName: string
  characterId: string
  characterName: string
  matchedAlias?: string
}

const emit = defineEmits<{
  select: [workId: string, characterId: string]
}>()

const query = ref('')
const results = ref<SearchResult[]>([])
const open = ref(false)
const activeIdx = ref(-1)
const containerRef = ref<HTMLDivElement>()

function search(q: string) {
  if (!q.trim()) {
    results.value = []
    return
  }
  const lower = q.toLowerCase()
  const matched: SearchResult[] = []
  for (const work of works) {
    for (const ch of work.characters) {
      const nameMatch = ch.name.toLowerCase().includes(lower)
      const aliasMatch = ch.aliases.find((a) => a.toLowerCase().includes(lower))
      if (nameMatch || aliasMatch) {
        matched.push({
          workId: work.id,
          workName: work.name,
          characterId: ch.id,
          characterName: ch.name,
          matchedAlias: aliasMatch,
        })
      }
    }
  }
  results.value = matched
  activeIdx.value = -1
}

function handleChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  query.value = val
  search(val)
  open.value = true
}

function handleSelect(r: SearchResult) {
  open.value = false
  query.value = ''
  results.value = []
  emit('select', r.workId, r.characterId)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!open.value || !results.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIdx.value = Math.min(activeIdx.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIdx.value = Math.max(activeIdx.value - 1, 0)
  } else if (e.key === 'Enter' && activeIdx.value >= 0) {
    e.preventDefault()
    handleSelect(results.value[activeIdx.value])
  }
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative w-full max-w-lg mx-auto">
    <input
      type="text"
      :value="query"
      placeholder="查阅人物道号…"
      class="w-full px-4 py-2 rounded-full text-sm"
      :style="{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }"
      @input="handleChange"
      @focus="query && (open = true)"
      @keydown="handleKeyDown"
    />
    <ul
      v-if="open && results.length > 0"
      class="absolute z-50 mt-1 w-full rounded-xl shadow-lg max-h-72 overflow-y-auto"
      :style="{ background: 'var(--bg-card)', border: '1px solid var(--border)' }"
    >
      <li v-for="(r, i) in results" :key="`${r.workId}-${r.characterId}`">
        <button
          class="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer text-sm"
          :style="{
            color: 'var(--text-primary)',
            background: i === activeIdx ? 'var(--bg-hover)' : 'transparent',
          }"
          @click="handleSelect(r)"
        >
          <span class="font-medium">{{ r.characterName }}</span>
          <span
            v-if="r.matchedAlias"
            :style="{ color: 'var(--text-muted)', fontSize: '0.8rem' }"
          >
            ({{ r.matchedAlias }})
          </span>
          <span
            class="ml-auto"
            :style="{ color: 'var(--text-muted)', fontSize: '0.8rem' }"
          >
            {{ r.workName }}
          </span>
        </button>
      </li>
    </ul>
    <div
      v-if="open && query && results.length === 0"
      class="absolute z-50 mt-1 w-full rounded-xl shadow-lg px-4 py-3 text-sm"
      :style="{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }"
    >
      未查到此人
    </div>
  </div>
</template>
