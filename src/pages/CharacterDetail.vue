<script setup lang="ts">
import type { Character, Work } from '../data/works'
import { works } from '../data/works'
import type { PanelEntity } from '../components/RightPanel.vue'
import LinkedText from '../components/LinkedText.vue'

const props = defineProps<{
  character: Character
  work: Work
}>()

const emit = defineEmits<{
  openPanel: [entity: PanelEntity]
}>()

function getGender(name: string): 'male' | 'female' | 'unknown' | null {
  const ch = props.work.characters.find((c) => c.name === name || c.aliases.includes(name))
  return ch?.gender ?? null
}

function handleLinkClick(name: string) {
  const ch = props.work.characters.find((c) => c.name === name || c.aliases.includes(name))
  if (ch) {
    emit('openPanel', { type: 'character', id: ch.id, workId: props.work.id })
    return
  }
  const faction = props.work.factions.find((f) => f.name === name)
  if (faction) {
    emit('openPanel', { type: 'faction', id: faction.id, workId: props.work.id })
    return
  }
  const event = props.work.events.find((e) => e.name === name)
  if (event) {
    emit('openPanel', { type: 'event', id: event.id, workId: props.work.id })
    return
  }
  for (const c of props.work.characters) {
    const ability = c.abilities.find((a) => a.name === name)
    if (ability) {
      emit('openPanel', { type: 'ability', id: ability.name, workId: props.work.id })
      return
    }
  }
  const targetWork = works.find((w) => w.name === name)
  if (targetWork) {
    emit('openPanel', { type: 'work', id: targetWork.id, workId: targetWork.id })
    return
  }
}

// Group relations by type
function getGroupedRelations(character: Character) {
  const grouped = new Map<string, typeof character.relations>()
  for (const rel of character.relations) {
    const list = grouped.get(rel.type) ?? []
    list.push(rel)
    grouped.set(rel.type, list)
  }
  return Array.from(grouped.entries())
}

function getReversedStoryline(character: Character) {
  return character.storyline.slice().reverse()
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-8 py-10 relative">
    <!-- 半透明底色 -->
    <div
      class="absolute inset-0 -mx-8 -my-10 rounded-none"
      :style="{ background: 'rgba(250, 246, 248, 0.82)', zIndex: -1 }"
    />

    <!-- 右上角桃花装饰 -->
    <svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      class="absolute top-0 right-0 opacity-[0.07] pointer-events-none"
    >
      <path
        d="M180 10 Q160 40 140 50 Q120 55 100 70 Q80 85 70 110 Q65 130 60 150"
        stroke="var(--pink-deep)"
        stroke-width="2"
        fill="none"
      />
      <path
        d="M140 50 Q130 35 120 40 Q110 45 115 55 Q120 65 135 55 Q142 50 140 50Z"
        fill="var(--pink)"
        opacity="0.6"
      />
      <path
        d="M120 68 Q108 58 102 65 Q96 72 103 80 Q110 88 118 78 Q122 72 120 68Z"
        fill="var(--pink)"
        opacity="0.5"
      />
      <path
        d="M160 30 Q150 18 142 24 Q134 30 140 40 Q146 48 156 38 Q162 32 160 30Z"
        fill="var(--pink)"
        opacity="0.7"
      />
      <circle cx="140" cy="50" r="2" fill="var(--accent)" opacity="0.8" />
      <circle cx="118" cy="72" r="1.5" fill="var(--accent)" opacity="0.6" />
      <circle cx="155" cy="32" r="2" fill="var(--accent)" opacity="0.7" />
      <ellipse
        cx="90"
        cy="95"
        rx="4"
        ry="3"
        fill="var(--pink)"
        opacity="0.3"
        transform="rotate(-30 90 95)"
      />
      <ellipse
        cx="75"
        cy="120"
        rx="3"
        ry="2"
        fill="var(--pink)"
        opacity="0.2"
        transform="rotate(-45 75 120)"
      />
    </svg>

    <!-- 角色信息区 -->
    <header class="mb-10">
      <div class="flex gap-6 items-start">
        <!-- 头像 -->
        <div class="flex-shrink-0">
          <div
            class="rounded-2xl overflow-hidden"
            :style="{
              border: '2px solid var(--pink)',
              boxShadow: '0 4px 16px rgba(243,185,210,0.2)',
              width: '120px',
              height: '120px',
            }"
          >
            <img
              :src="`/avatars/${character.id}.jpg`"
              :alt="character.name"
              class="w-full h-full object-cover"
              @error="(e: Event) => {
                const img = e.target as HTMLImageElement
                if (img.src.endsWith('.jpg')) { img.src = `/avatars/${character.id}.png` }
                else {
                  img.style.display = 'none'
                  img.parentElement!.innerHTML = `<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-accent-pink);font-family:var(--font-heading);font-size:2.5rem;color:var(--accent)'>${character.name[0]}</div>`
                }
              }"
            />
          </div>
        </div>

        <!-- 名字、别名、简介 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <h1
              class="text-3xl font-bold"
              :style="{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }"
            >
              {{ character.name }}
            </h1>
            <span
              v-if="character.status"
              class="text-xs px-2 py-0.5 rounded-full"
              :style="{ backgroundColor: 'var(--bg-accent-blue)', color: 'var(--accent-alt)' }"
            >
              {{ character.status }}
            </span>
          </div>
          <p
            v-if="character.aliases.length > 0"
            class="text-sm mb-2"
            :style="{ color: 'var(--text-secondary)' }"
          >
            别名：{{ character.aliases.join('、') }}
          </p>
          <p
            class="text-sm leading-relaxed mt-2"
            :style="{
              color: 'var(--text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }"
          >
            <LinkedText
              :text="character.summary"
              :get-gender="getGender"
              @link-click="handleLinkClick"
            />
          </p>
        </div>
      </div>

      <!-- 引用文案 -->
      <div v-if="character.quotes.length > 0" class="mt-5 space-y-2">
        <blockquote v-for="(q, i) in character.quotes" :key="i" class="quote-block">
          <p>&ldquo;{{ q.text }}&rdquo;</p>
          <footer class="mt-1 text-sm not-italic" :style="{ color: 'var(--text-muted)' }">
            &mdash; {{ q.source }}
          </footer>
        </blockquote>
      </div>
    </header>

    <!-- 性格 -->
    <section v-if="character.personality.length > 0" class="mb-12">
      <h2
        class="text-xl font-bold mb-3 flex items-center"
        :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
      >
        性格
      </h2>
      <div class="ink-divider" />
      <div class="mt-4">
        <ul class="space-y-2.5">
          <li
            v-for="(p, i) in character.personality"
            :key="i"
            class="flex items-start gap-3 text-base"
            :style="{ color: 'var(--text-primary)' }"
          >
            <span class="mt-2 w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: 'var(--pink-deep)' }" />
            {{ p }}
          </li>
        </ul>
      </div>
    </section>

    <!-- 能力 -->
    <section v-if="character.abilities.length > 0" class="mb-12">
      <h2
        class="text-xl font-bold mb-3 flex items-center"
        :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
      >
        能力
      </h2>
      <div class="ink-divider" />
      <div class="mt-4">
        <div class="overflow-x-auto">
          <table class="w-full text-base">
            <thead>
              <tr :style="{ borderBottom: '2px solid var(--border-strong)' }">
                <th class="text-left py-2.5 pr-4 font-bold" :style="{ color: 'var(--text-primary)', minWidth: '6rem' }">
                  名称
                </th>
                <th class="text-left py-2.5 font-bold" :style="{ color: 'var(--text-primary)' }">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(a, i) in character.abilities"
                :key="i"
                :style="{ borderBottom: '1px solid var(--border)' }"
              >
                <td class="py-3 pr-4 font-medium">
                  <button
                    class="cursor-pointer hover:underline"
                    :style="{ color: 'var(--accent)' }"
                    @click="emit('openPanel', { type: 'ability', id: a.name, workId: work.id })"
                  >
                    {{ a.name }}
                  </button>
                </td>
                <td class="py-3" :style="{ color: 'var(--text-secondary)' }">{{ a.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 人物关系 -->
    <section v-if="character.relations.length > 0" class="mb-12">
      <h2
        class="text-xl font-bold mb-3 flex items-center"
        :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
      >
        人物关系
      </h2>
      <div class="ink-divider" />
      <div class="mt-4">
        <div class="space-y-3">
          <div
            v-for="[type, rels] in getGroupedRelations(character)"
            :key="type"
            class="p-3 rounded-lg card-spring"
          >
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="seal-stamp" :style="{ fontSize: '0.7rem', padding: '1px 8px' }">
                {{ type }}
              </span>
              <template v-for="(rel, j) in rels" :key="j">
                <span v-if="j > 0" :style="{ color: 'var(--text-muted)' }">、</span>
                <button
                  v-if="work.characters.find(c => c.id === rel.target)"
                  class="font-medium text-base cursor-pointer hover:underline"
                  :style="{ color: 'var(--pink-deep)' }"
                  @click="emit('openPanel', { type: 'character', id: rel.target, workId: work.id })"
                >
                  {{ work.characters.find(c => c.id === rel.target)!.name }}
                </button>
                <span v-else class="font-medium text-base" :style="{ color: 'var(--text-primary)' }">
                  {{ rel.target }}
                </span>
              </template>
            </div>
            <!-- 描述 -->
            <template v-if="rels.length > 1 && new Set(rels.map(r => r.description)).size === 1">
              <p class="text-sm" :style="{ color: 'var(--text-secondary)' }">
                <LinkedText :text="rels[0].description" :get-gender="getGender" @link-click="handleLinkClick" />
              </p>
            </template>
            <template v-else>
              <p
                v-for="(rel, j) in rels"
                :key="j"
                class="text-sm"
                :style="{ color: 'var(--text-secondary)' }"
              >
                <span
                  v-if="rels.length > 1 && work.characters.find(c => c.id === rel.target)"
                  :style="{ color: 'var(--text-muted)' }"
                >
                  {{ work.characters.find(c => c.id === rel.target)!.name }}：
                </span>
                <LinkedText :text="rel.description" :get-gender="getGender" @link-click="handleLinkClick" />
              </p>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- 身世背景 -->
    <section v-if="character.background" class="mb-12">
      <h2
        class="text-xl font-bold mb-3 flex items-center"
        :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
      >
        身世背景
      </h2>
      <div class="ink-divider" />
      <div class="mt-4">
        <p class="text-base leading-loose" :style="{ color: 'var(--text-primary)' }">
          <LinkedText :text="character.background" :get-gender="getGender" @link-click="handleLinkClick" />
        </p>
      </div>
    </section>

    <!-- 核心故事线 -->
    <section v-if="character.storyline.length > 0" class="mb-12">
      <h2
        class="text-xl font-bold mb-3 flex items-center"
        :style="{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }"
      >
        核心故事线
      </h2>
      <div class="ink-divider" />
      <div class="mt-4">
        <div class="relative pl-7">
          <div class="timeline-line absolute left-2.5 top-2 bottom-2" />
          <div class="space-y-7">
            <div
              v-for="(node, i) in getReversedStoryline(character)"
              :key="i"
              class="relative"
              :id="`storyline-node-${i}`"
            >
              <div class="timeline-dot absolute -left-[1.125rem] top-1" />
              <button
                class="text-left cursor-pointer group w-full"
                @click="emit('openPanel', {
                  type: 'storyline',
                  id: `${character.id}-storyline-${i}`,
                  workId: work.id,
                  storylineData: {
                    characterName: character.name,
                    characterId: character.id,
                    phase: node.phase,
                    description: node.description,
                    currentIndex: i,
                    totalNodes: getReversedStoryline(character).length,
                    prevNode: i > 0 ? { phase: getReversedStoryline(character)[i - 1].phase, description: getReversedStoryline(character)[i - 1].description, index: i - 1 } : undefined,
                    nextNode: i < getReversedStoryline(character).length - 1 ? { phase: getReversedStoryline(character)[i + 1].phase, description: getReversedStoryline(character)[i + 1].description, index: i + 1 } : undefined,
                  },
                })"
              >
                <h4
                  class="font-bold text-base mb-1 group-hover:underline inline-flex items-center gap-2"
                  :style="{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }"
                >
                  {{ node.phase }}
                  <span
                    v-if="node.arc"
                    class="text-xs font-normal px-2 py-0.5 rounded-full"
                    :style="{
                      backgroundColor: 'var(--bg-accent-blue)',
                      color: 'var(--accent-alt)',
                      fontSize: '0.7rem',
                    }"
                  >
                    {{ node.arc }}
                  </span>
                </h4>
              </button>
              <p class="text-sm leading-relaxed" :style="{ color: 'var(--text-secondary)' }">
                <LinkedText :text="node.description" :get-gender="getGender" @link-click="handleLinkClick" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
