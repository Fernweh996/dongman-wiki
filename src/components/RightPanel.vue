<script setup lang="ts">
import type { Ability, Work } from '../data/works'
import RadarChart from './RadarChart.vue'
import { BASE } from '../utils/base'

export interface PanelEntity {
  type: 'character' | 'faction' | 'ability' | 'event' | 'work' | 'storyline'
  id: string
  workId: string
  storylineData?: {
    characterName: string
    characterId: string
    phase: string
    description: string
    prevNode?: { phase: string; description: string; index: number }
    nextNode?: { phase: string; description: string; index: number }
    currentIndex: number
    totalNodes: number
  }
}

const props = defineProps<{
  entity: PanelEntity | null
  works: Work[]
}>()

const emit = defineEmits<{
  close: []
  linkClick: [entity: PanelEntity]
  characterSelect: [workId: string, characterId: string]
}>()

function findAbility(work: Work, name: string): Ability | undefined {
  for (const ch of work.characters) {
    const f = ch.abilities.find((a) => a.name === name)
    if (f) return f
  }
  return undefined
}

function getWork() {
  return props.works.find((w) => w.id === props.entity?.workId)
}

function navigateTo(
  data: NonNullable<PanelEntity['storylineData']>,
  targetNode: { phase: string; description: string; index: number },
  workId: string
) {
  const idx = targetNode.index
  const currentAsNav = {
    phase: data.phase,
    description: data.description,
    index: data.currentIndex,
  }

  let newPrev: typeof data.prevNode
  let newNext: typeof data.nextNode

  if (idx < data.currentIndex) {
    newPrev =
      data.prevNode && data.prevNode.index !== idx ? data.prevNode : undefined
    newNext = currentAsNav
  } else {
    newPrev = currentAsNav
    newNext =
      data.nextNode && data.nextNode.index !== idx ? data.nextNode : undefined
  }

  emit('linkClick', {
    type: 'storyline',
    id: `${data.characterId}-storyline-${idx}`,
    workId,
    storylineData: {
      characterName: data.characterName,
      characterId: data.characterId,
      phase: targetNode.phase,
      description: targetNode.description,
      currentIndex: idx,
      totalNodes: data.totalNodes,
      prevNode: newPrev,
      nextNode: newNext,
    },
  })

  const el = document.getElementById(`storyline-node-${idx}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const tierCfg: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: '核心', color: 'var(--accent)' },
  2: { label: '重要', color: 'var(--accent-alt)' },
  3: { label: '高光', color: 'var(--text-muted)' },
}
</script>

<template>
  <div v-if="entity" class="h-full overflow-y-auto">
    <div class="p-5">
      <!-- 关闭按钮 -->
      <div class="flex justify-end mb-3">
        <button
          class="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          :style="{ color: 'var(--text-muted)' }"
          @click="emit('close')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 根据类型展示不同内容 -->
      <template v-if="getWork()">
        <!-- 角色面板 -->
        <template v-if="entity.type === 'character'">
          <template v-for="ch in [getWork()!.characters.find(c => c.id === entity.id)]" :key="'ch'">
            <div v-if="ch" class="space-y-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                  :style="{ border: '2px solid var(--pink)', boxShadow: '0 2px 10px rgba(243,185,210,0.15)' }"
                >
                  <img
                    :src="`${BASE}avatars/${ch.id}.webp`"
                    :alt="ch.name"
                    class="w-full h-full object-cover"
                    @error="(e) => {
                      const img = (e as any).target as HTMLImageElement
                      if (img.src.endsWith('.webp')) { img.src = `${BASE}avatars/${ch.id}.jpg` }
                      else if (img.src.endsWith('.jpg')) { img.src = `${BASE}avatars/${ch.id}.png` }
                      else {
                        img.style.display = 'none'
                        img.parentElement!.innerHTML = `<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-accent-pink);font-family:var(--font-heading);font-size:1.5rem;color:var(--accent)'>${ch.name[0]}</div>`
                      }
                    }"
                  />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold mb-1"
                    :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
                  >
                    {{ ch.name }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <span
                      class="seal-stamp"
                      :style="{ borderColor: tierCfg[ch.tier].color, color: tierCfg[ch.tier].color }"
                    >
                      T{{ ch.tier }} {{ tierCfg[ch.tier].label }}
                    </span>
                    <span
                      v-if="ch.aliases.length > 0"
                      class="text-sm"
                      :style="{ color: 'var(--text-muted)' }"
                    >
                      {{ ch.aliases.join(' / ') }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex justify-center">
                <RadarChart :stats="ch.stats" :size="220" />
              </div>

              <!-- 阵营 -->
              <template v-if="getWork()!.factions.filter(f => f.members.includes(ch.id)).length > 0">
                <div>
                  <h4
                    class="text-xs font-bold mb-2"
                    :style="{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }"
                  >
                    所属阵营
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="f in getWork()!.factions.filter(f => f.members.includes(ch.id))"
                      :key="f.id"
                      class="link-chip-blue link-chip"
                      @click="emit('linkClick', { type: 'faction', id: f.id, workId: getWork()!.id })"
                    >
                      {{ f.name }}
                    </button>
                  </div>
                </div>
              </template>

              <!-- 能力 -->
              <template v-if="ch.abilities.length > 0">
                <div>
                  <h4
                    class="text-xs font-bold mb-2"
                    :style="{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }"
                  >
                    能力
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="(a, i) in ch.abilities"
                      :key="i"
                      class="p-3 rounded-lg bg-flower-water"
                      :style="{ border: '1px solid var(--border)' }"
                    >
                      <span class="text-sm font-bold" :style="{ color: 'var(--accent)' }">{{ a.name }}</span>
                      <p class="text-sm mt-1" :style="{ color: 'var(--text-secondary)', lineHeight: '1.7' }">
                        {{ a.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 关系 -->
              <template v-if="ch.relations.length > 0">
                <div>
                  <h4
                    class="text-xs font-bold mb-2"
                    :style="{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }"
                  >
                    关键关系
                  </h4>
                  <div class="space-y-2">
                    <div v-for="(rel, i) in ch.relations" :key="i" class="flex items-center gap-2">
                      <span
                        class="seal-stamp"
                        :style="{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '2px' }"
                      >
                        {{ rel.type }}
                      </span>
                      <button
                        v-if="getWork()!.characters.find(c => c.id === rel.target)"
                        class="text-sm cursor-pointer hover:underline"
                        :style="{ color: 'var(--pink-deep)' }"
                        @click="emit('characterSelect', getWork()!.id, rel.target)"
                      >
                        {{ getWork()!.characters.find(c => c.id === rel.target)!.name }}
                      </button>
                      <span v-else class="text-sm" :style="{ color: 'var(--text-muted)' }">{{ rel.target }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <button
                class="w-full mt-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                :style="{
                  background: 'var(--bg-accent-pink)',
                  color: 'var(--accent)',
                  border: '1px solid var(--pink)',
                }"
                @click="emit('characterSelect', getWork()!.id, ch.id)"
              >
                跳转到人物页卡 →
              </button>
            </div>
            <p v-else :style="{ color: 'var(--text-muted)' }">未找到角色</p>
          </template>
        </template>

        <!-- 阵营面板 -->
        <template v-else-if="entity.type === 'faction'">
          <template v-for="f in [getWork()!.factions.find(f => f.id === entity.id)]" :key="'f'">
            <div v-if="f" class="space-y-5">
              <h3
                class="text-xl font-bold"
                :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
              >
                {{ f.name }}
              </h3>
              <p
                class="text-sm leading-relaxed"
                :style="{ color: 'var(--text-secondary)', lineHeight: '1.8' }"
              >
                {{ f.description }}
              </p>
              <div v-if="f.members.length > 0">
                <h4
                  class="text-xs font-bold mb-2"
                  :style="{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }"
                >
                  成员
                </h4>
                <div class="flex flex-wrap gap-2">
                  <template v-for="mid in f.members" :key="mid">
                    <button
                      v-if="getWork()!.characters.find(c => c.id === mid)"
                      class="link-chip"
                      @click="emit('characterSelect', getWork()!.id, mid)"
                    >
                      {{ getWork()!.characters.find(c => c.id === mid)!.name }}
                    </button>
                    <span v-else class="text-sm" :style="{ color: 'var(--text-muted)' }">{{ mid }}</span>
                  </template>
                </div>
              </div>
            </div>
            <p v-else :style="{ color: 'var(--text-muted)' }">未找到阵营</p>
          </template>
        </template>

        <!-- 能力面板 -->
        <template v-else-if="entity.type === 'ability'">
          <template v-for="a in [findAbility(getWork()!, entity.id)]" :key="'a'">
            <div v-if="a" class="space-y-4">
              <h3
                class="text-xl font-bold"
                :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
              >
                {{ a.name }}
              </h3>
              <p
                class="text-sm leading-relaxed"
                :style="{ color: 'var(--text-secondary)', lineHeight: '1.8' }"
              >
                {{ a.description }}
              </p>
            </div>
            <p v-else :style="{ color: 'var(--text-muted)' }">未找到能力</p>
          </template>
        </template>

        <!-- 事件面板 -->
        <template v-else-if="entity.type === 'event'">
          <template v-for="ev in [getWork()!.events.find(e => e.id === entity.id)]" :key="'ev'">
            <div v-if="ev" class="space-y-4">
              <h3
                class="text-xl font-bold"
                :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
              >
                {{ ev.name }}
              </h3>
              <p
                class="text-sm leading-relaxed"
                :style="{ color: 'var(--text-secondary)', lineHeight: '1.8' }"
              >
                {{ ev.description }}
              </p>
            </div>
            <p v-else :style="{ color: 'var(--text-muted)' }">未找到事件</p>
          </template>
        </template>

        <!-- 故事线面板 -->
        <template v-else-if="entity.type === 'storyline' && entity.storylineData">
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="seal-stamp" :style="{ fontSize: '0.7rem', padding: '1px 8px' }">故事线</span>
              <span class="text-sm" :style="{ color: 'var(--text-muted)' }">{{ entity.storylineData.characterName }}</span>
              <span class="text-xs" :style="{ color: 'var(--text-muted)' }">
                ({{ entity.storylineData.currentIndex + 1 }}/{{ entity.storylineData.totalNodes }})
              </span>
            </div>
            <h3
              class="text-xl font-bold"
              :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
            >
              {{ entity.storylineData.phase }}
            </h3>
            <div class="ink-divider" />
            <p
              class="text-sm leading-relaxed"
              :style="{ color: 'var(--text-secondary)', lineHeight: '1.8' }"
            >
              {{ entity.storylineData.description }}
            </p>

            <div
              class="flex justify-between items-center pt-4"
              :style="{ borderTop: '1px solid var(--border)' }"
            >
              <button
                v-if="entity.storylineData.prevNode"
                class="flex items-center gap-1 text-sm cursor-pointer hover:underline"
                :style="{ color: 'var(--accent)' }"
                @click="navigateTo(entity.storylineData!, entity.storylineData!.prevNode!, entity.workId)"
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
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                上一个
              </button>
              <span v-else />
              <button
                v-if="entity.storylineData.nextNode"
                class="flex items-center gap-1 text-sm cursor-pointer hover:underline"
                :style="{ color: 'var(--accent)' }"
                @click="navigateTo(entity.storylineData!, entity.storylineData!.nextNode!, entity.workId)"
              >
                下一个
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
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <span v-else />
            </div>
          </div>
        </template>

        <!-- 作品面板 -->
        <template v-else-if="entity.type === 'work'">
          <div class="space-y-4">
            <h3
              class="text-xl font-bold"
              :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
            >
              {{ getWork()!.name }}
            </h3>
            <p
              class="text-sm leading-relaxed"
              :style="{ color: 'var(--text-secondary)', lineHeight: '1.8' }"
            >
              {{ getWork()!.description }}
            </p>
            <div class="flex gap-4 text-sm" :style="{ color: 'var(--text-muted)' }">
              <span>角色：{{ getWork()!.characters.length }}</span>
              <span>阵营：{{ getWork()!.factions.length }}</span>
            </div>
          </div>
        </template>
      </template>
      <p v-else :style="{ color: 'var(--text-muted)' }">未找到数据</p>
    </div>
  </div>
</template>
