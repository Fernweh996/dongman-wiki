<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { works } from './data/works'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import CharacterDetail from './pages/CharacterDetail.vue'
import RelationGraph from './pages/RelationGraph.vue'
import RightPanel from './components/RightPanel.vue'
import type { PanelEntity } from './components/RightPanel.vue'
import AnnotationTool from './components/AnnotationTool.vue'
import AnnotationList from './components/AnnotationList.vue'
import { useAnnotations } from './composables/useAnnotations'
import { BASE } from './utils/base'

const sidebarOpen = ref(true)
const selectedWorkId = ref<string | null>(works[0]?.id ?? null)
const selectedCharacterId = ref<string | null>(works[0]?.characters[0]?.id ?? null)
const rightPanelEntity = ref<PanelEntity | null>(null)
const viewMode = ref<'character' | 'graph'>('character')
const classifyMode = ref<'tier' | 'faction'>(
  works[0]?.id === 'yi-ren-zhi-xia' ? 'faction' : 'tier'
)
const showAnnotations = ref(false)
const { annotations, add: addAnnotation, remove: removeAnnotation } = useAnnotations()
const mainRef = ref<HTMLElement>()

const selectedWork = computed(() => works.find((w) => w.id === selectedWorkId.value) ?? null)
const selectedCharacter = computed(
  () => selectedWork.value?.characters.find((c) => c.id === selectedCharacterId.value) ?? null
)
const genderThemeClass = computed(
  () => (selectedCharacter.value?.gender === 'male' ? 'theme-male' : '')
)

// ESC 关闭面板
function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') rightPanelEntity.value = null
}
onMounted(() => {
  document.addEventListener('keydown', handleEsc)
  // 预加载所有角色的背景图和头像，点击时直接从浏览器缓存读取
  requestIdleCallback(() => {
    for (const work of works) {
      for (const ch of work.characters) {
        const bg = new Image()
        bg.src = `${BASE}backgrounds/${ch.id}.webp`
        const av = new Image()
        av.src = `${BASE}avatars/${ch.id}.webp`
      }
    }
  })
})
onUnmounted(() => document.removeEventListener('keydown', handleEsc))

// 切换人物时重置滚动
watch(selectedCharacterId, () => {
  if (mainRef.value) mainRef.value.scrollTop = 0
})

function handleSelectWork(workId: string) {
  selectedWorkId.value = workId
  const work = works.find((w) => w.id === workId)
  selectedCharacterId.value = work?.characters[0]?.id ?? null
  rightPanelEntity.value = null
  viewMode.value = 'character'
  classifyMode.value = workId === 'yi-ren-zhi-xia' ? 'faction' : 'tier'
}

function handleSelectCharacter(characterId: string) {
  selectedCharacterId.value = characterId
  rightPanelEntity.value = null
  viewMode.value = 'character'
}

function handleSearchSelect(workId: string, characterId: string) {
  selectedWorkId.value = workId
  selectedCharacterId.value = characterId
  rightPanelEntity.value = null
}

function handleOpenPanel(entity: PanelEntity) {
  rightPanelEntity.value = entity
}

function handlePanelCharacterSelect(workId: string, characterId: string) {
  selectedWorkId.value = workId
  selectedCharacterId.value = characterId
  rightPanelEntity.value = null
}

function onBgError(e: Event, characterId: string) {
  const img = e.target as HTMLImageElement
  if (img.src.endsWith(`/backgrounds/${characterId}.webp`)) {
    img.src = `${BASE}backgrounds/${characterId}.jpg`
  } else if (img.src.endsWith(`/backgrounds/${characterId}.jpg`)) {
    img.src = `${BASE}backgrounds/${characterId}.png`
  } else if (img.src.endsWith(`/backgrounds/${characterId}.png`)) {
    img.src = `${BASE}backgrounds/${characterId}.jpeg`
  } else {
    img.style.display = 'none'
  }
}
</script>

<template>
  <div class="h-screen flex flex-col" :style="{ fontFamily: 'var(--font-body)' }">
    <a href="#main-content" class="skip-link">跳至主内容</a>

    <!-- 顶栏 -->
    <header
      class="sticky top-0 z-50 px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
      :style="{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e8e4e8',
      }"
    >
      <button
        class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer flex-shrink-0"
        :style="{ color: 'var(--text-muted)' }"
        @click="sidebarOpen = !sidebarOpen"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" :x2="sidebarOpen ? '21' : '15'" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1
        class="text-lg font-bold flex-shrink-0 hidden sm:block"
        :style="{ fontFamily: 'var(--font-heading)', color: '#5a4d60', letterSpacing: '3px' }"
      >
        万卷书
      </h1>

      <div class="flex-1 max-w-xl">
        <SearchBar @select="handleSearchSelect" />
      </div>

      <!-- 纠偏标注按钮 -->
      <button
        class="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer flex-shrink-0"
        :style="{ color: showAnnotations ? 'var(--accent)' : 'var(--text-muted)' }"
        title="纠偏记录"
        @click="showAnnotations = !showAnnotations"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span
          v-if="annotations.length > 0"
          :style="{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >
          {{ annotations.length }}
        </span>
      </button>
    </header>

    <!-- F型主体 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧导航 -->
      <Sidebar
        :open="sidebarOpen"
        :selected-work-id="selectedWorkId"
        :selected-character-id="selectedCharacterId"
        :view-mode="viewMode"
        :classify-mode="classifyMode"
        @select-work="handleSelectWork"
        @select-character="handleSelectCharacter"
        @set-view-mode="viewMode = $event"
        @set-classify-mode="classifyMode = $event"
      />

      <!-- 中间内容区 -->
      <main
        id="main-content"
        ref="mainRef"
        :class="`flex-1 overflow-y-auto ${genderThemeClass}`"
        :style="{
          background: 'var(--bg-primary)',
          position: 'relative',
          ...(viewMode === 'graph' ? { display: 'flex', flexDirection: 'column' } : {}),
        }"
      >
        <!-- 关系图模式 -->
        <RelationGraph
          v-if="viewMode === 'graph' && selectedWork"
          :work="selectedWork"
          @open-panel="handleOpenPanel"
        />

        <!-- 角色详情模式 -->
        <template v-else>
          <!-- 背景图 -->
          <template v-if="selectedCharacter">
            <div
              :style="{
                position: 'sticky',
                top: '0',
                height: '0',
                overflow: 'visible',
                zIndex: 0,
                pointerEvents: 'none',
              }"
            >
              <div :style="{ height: '100vh', width: '100%' }">
                <img
                  :key="selectedCharacter.id"
                  :src="`${BASE}backgrounds/${selectedCharacter.id}.webp`"
                  alt=""
                  :style="{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6,
                  }"
                  @error="onBgError($event, selectedCharacter!.id)"
                />
                <div
                  :style="{
                    position: 'absolute',
                    inset: '0',
                    background: 'rgba(250, 246, 248, 0.4)',
                  }"
                />
              </div>
            </div>
          </template>

          <div :style="{ position: 'relative', zIndex: 1 }">
            <template v-if="selectedCharacter && selectedWork">
              <AnnotationTool :character-id="selectedCharacter.id" :on-add="addAnnotation">
                <CharacterDetail
                  :character="selectedCharacter"
                  :work="selectedWork"
                  @open-panel="handleOpenPanel"
                />
              </AnnotationTool>
            </template>
            <div
              v-else
              class="flex items-center justify-center h-full min-h-[60vh]"
            >
              <p class="text-base" :style="{ color: 'var(--text-muted)' }">
                请从左侧选择一个角色
              </p>
            </div>
          </div>
        </template>
      </main>

      <!-- 右侧：卡片 -->
      <aside
        v-if="rightPanelEntity && !showAnnotations"
        :class="`flex-shrink-0 overflow-y-auto ${genderThemeClass}`"
        :style="{
          width: '360px',
          minWidth: '360px',
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }"
      >
        <RightPanel
          :entity="rightPanelEntity"
          :works="works"
          @close="rightPanelEntity = null"
          @link-click="handleOpenPanel"
          @character-select="handlePanelCharacterSelect"
        />
      </aside>

      <!-- 右侧：纠偏记录面板 -->
      <aside
        v-if="showAnnotations"
        class="flex-shrink-0"
        :style="{
          width: '360px',
          minWidth: '360px',
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }"
      >
        <AnnotationList
          :annotations="annotations"
          @remove="removeAnnotation"
          @close="showAnnotations = false"
        />
      </aside>
    </div>
  </div>
</template>
