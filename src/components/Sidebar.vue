<script setup lang="ts">
import { computed } from 'vue'
import { works } from '../data/works'
import type { Work } from '../data/works'
import { BASE } from '../utils/base'

const props = defineProps<{
  open: boolean
  selectedWorkId: string | null
  selectedCharacterId: string | null
  viewMode: 'character' | 'graph'
  classifyMode: 'tier' | 'faction'
}>()

const emit = defineEmits<{
  selectWork: [workId: string]
  selectCharacter: [characterId: string]
  setViewMode: [mode: 'character' | 'graph']
  setClassifyMode: [mode: 'tier' | 'faction']
}>()

const selectedWork = computed(() => works.find((w) => w.id === props.selectedWorkId))

const hasFactions = computed(
  () =>
    !!(
      selectedWork.value?.factionClassification &&
      Object.keys(selectedWork.value.factionClassification).length > 0
    )
)

const tierConfig: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: '核心', color: 'var(--accent)' },
  2: { label: '重要', color: 'var(--accent-alt)' },
  3: { label: '高光', color: 'var(--text-muted)' },
}

function getByTier(work: Work) {
  const byTier = new Map<1 | 2 | 3, typeof work.characters>()
  for (const ch of work.characters) {
    const list = byTier.get(ch.tier) ?? []
    list.push(ch)
    byTier.set(ch.tier, list)
  }
  return byTier
}
</script>

<template>
  <aside
    class="flex-shrink-0 overflow-y-auto transition-all duration-300"
    :style="{
      width: open ? '210px' : '0px',
      minWidth: open ? '210px' : '0px',
      opacity: open ? 1 : 0,
      padding: open ? '16px 8px' : '0px',
      background: '#ffffff',
      borderRight: open ? '1px solid #e8e4e8' : 'none',
    }"
  >
    <template v-if="open">
      <div class="mb-4">
        <h3
          class="px-3 py-1 text-xs font-bold"
          :style="{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '3px',
          }"
        >
          典籍
        </h3>
        <div class="mt-1 space-y-1">
          <button
            v-for="work in works"
            :key="work.id"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-lg cursor-pointer text-left"
            :style="{
              backgroundColor: work.id === selectedWorkId ? 'var(--bg-accent-pink)' : 'transparent',
              color: work.id === selectedWorkId ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: work.id === selectedWorkId ? 700 : 400,
              fontFamily: 'var(--font-heading)',
            }"
            @click="emit('selectWork', work.id)"
          >
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{
                backgroundColor: work.id === selectedWorkId ? 'var(--pink-deep)' : 'var(--border-strong)',
              }"
            />
            {{ work.name }}
          </button>
        </div>
      </div>

      <template v-if="selectedWork">
        <div class="ink-divider mx-2 mb-4" />

        <div v-if="!selectedWork.characters.length" style="padding: 2rem 1rem; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
          📝 角色数据待补充
        </div>

        <div v-else>
          <div class="flex items-center justify-between px-3 py-1">
            <h3
              class="text-xs font-bold"
              :style="{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '3px',
              }"
            >
              人物
            </h3>
            <button
              v-if="hasFactions"
              class="text-xs px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              :style="{
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                background: 'transparent',
                fontSize: '0.65rem',
              }"
              @click="emit('setClassifyMode', classifyMode === 'tier' ? 'faction' : 'tier')"
            >
              {{ classifyMode === 'tier' ? '门派' : '层级' }}
            </button>
          </div>

          <!-- 关系链按钮 -->
          <div class="px-2 mt-1 mb-2">
            <button
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-lg cursor-pointer"
              :style="{
                backgroundColor: viewMode === 'graph' ? 'var(--bg-accent-pink)' : 'transparent',
                color: viewMode === 'graph' ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${viewMode === 'graph' ? 'var(--pink)' : 'var(--border)'}`,
                fontWeight: viewMode === 'graph' ? 700 : 400,
              }"
              @click="emit('setViewMode', viewMode === 'graph' ? 'character' : 'graph')"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="12" cy="18" r="3" />
                <line x1="8.5" y1="7.5" x2="10.5" y2="16" />
                <line x1="15.5" y1="7.5" x2="13.5" y2="16" />
                <line x1="9" y1="6" x2="15" y2="6" />
              </svg>
              关系链
            </button>
          </div>

          <!-- 按阵营分类 -->
          <template v-if="classifyMode === 'faction' && hasFactions">
            <div class="mt-2 space-y-3">
              <div
                v-for="[factionName, charIds] in Object.entries(selectedWork.factionClassification!)"
                :key="factionName"
              >
                <template
                  v-if="charIds.map(id => selectedWork!.characters.find(c => c.id === id)).filter(Boolean).length > 0"
                >
                  <div
                    class="px-3 py-0.5 text-xs font-medium"
                    :style="{ color: 'var(--accent-alt)', fontFamily: 'var(--font-heading)' }"
                  >
                    {{ factionName }}
                  </div>
                  <div class="space-y-0.5">
                    <template v-for="id in charIds" :key="id">
                      <template v-if="selectedWork!.characters.find(c => c.id === id)">
                        <button
                          class="w-full text-left px-3 py-1.5 text-sm transition-colors rounded-lg cursor-pointer flex items-center gap-2"
                          :style="{
                            backgroundColor: id === selectedCharacterId ? 'var(--bg-accent-pink)' : 'transparent',
                            color: id === selectedCharacterId ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: id === selectedCharacterId ? 600 : 400,
                          }"
                          @click="emit('selectCharacter', id)"
                        >
                          <img
                            :src="`${BASE}avatars/${id}.webp`"
                            alt=""
                            class="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            :style="{ border: '1px solid var(--border)' }"
                            @error="(e: Event) => {
                              const img = e.target as HTMLImageElement
                              if (img.src.endsWith('.webp')) { img.src = `${BASE}avatars/${id}.jpg` }
                              else if (img.src.endsWith('.jpg')) { img.src = `${BASE}avatars/${id}.png` }
                              else { img.style.display = 'none' }
                            }"
                          />
                          {{ selectedWork!.characters.find(c => c.id === id)!.name }}
                        </button>
                      </template>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- 按层级分类 -->
          <template v-else>
            <div class="mt-2 space-y-3">
              <template v-for="tier in ([1, 2, 3] as const)" :key="tier">
                <div v-if="getByTier(selectedWork).get(tier)?.length">
                  <div
                    class="px-3 py-0.5 text-xs font-medium"
                    :style="{ color: tierConfig[tier].color, fontFamily: 'var(--font-heading)' }"
                  >
                    {{ tierConfig[tier].label }}
                  </div>
                  <div class="space-y-0.5">
                    <button
                      v-for="ch in getByTier(selectedWork).get(tier)"
                      :key="ch!.id"
                      class="w-full text-left px-3 py-1.5 text-sm transition-colors rounded-lg cursor-pointer flex items-center gap-2"
                      :style="{
                        backgroundColor: ch!.id === selectedCharacterId ? 'var(--bg-accent-pink)' : 'transparent',
                        color: ch!.id === selectedCharacterId ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: ch!.id === selectedCharacterId ? 600 : 400,
                      }"
                      @click="emit('selectCharacter', ch!.id)"
                    >
                      <img
                        :src="`${BASE}avatars/${ch!.id}.webp`"
                        alt=""
                        class="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        :style="{ border: '1px solid var(--border)' }"
                        @error="(e: Event) => {
                          const img = e.target as HTMLImageElement
                          if (img.src.endsWith('.webp')) { img.src = `${BASE}avatars/${ch!.id}.jpg` }
                          else if (img.src.endsWith('.jpg')) { img.src = `${BASE}avatars/${ch!.id}.png` }
                          else { img.style.display = 'none' }
                        }"
                      />
                      {{ ch!.name }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </template>
    </template>
  </aside>
</template>
