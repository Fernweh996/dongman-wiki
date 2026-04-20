<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Annotation } from '../composables/useAnnotations'

const props = defineProps<{
  characterId: string
  onAdd: (a: Omit<Annotation, 'id' | 'timestamp'>) => void
}>()

const containerRef = ref<HTMLDivElement>()
const floatPos = ref<{ x: number; y: number } | null>(null)
const selectedText = ref('')
const showForm = ref(false)
const note = ref('')

function handleMouseUp() {
  const sel = window.getSelection()
  const text = sel?.toString().trim()
  if (!text || text.length < 2) {
    if (!showForm.value) floatPos.value = null
    return
  }
  const range = sel!.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = containerRef.value?.getBoundingClientRect()
  if (!containerRect) return

  floatPos.value = {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top - containerRect.top - 40,
  }
  selectedText.value = text
}

function handleSave() {
  if (!note.value.trim()) return
  props.onAdd({
    selectedText: selectedText.value,
    note: note.value.trim(),
    characterId: props.characterId,
  })
  showForm.value = false
  floatPos.value = null
  note.value = ''
  selectedText.value = ''
  window.getSelection()?.removeAllRanges()
}

function handleCancel() {
  showForm.value = false
  floatPos.value = null
  note.value = ''
  selectedText.value = ''
}

function handleClickOutside(e: MouseEvent) {
  if (showForm.value) return
  const target = e.target as HTMLElement
  if (target.closest('[data-annotation-float]')) return
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="containerRef" :style="{ position: 'relative' }" @mouseup="handleMouseUp">
    <slot />

    <!-- 浮动标注按钮 -->
    <button
      v-if="floatPos && !showForm"
      data-annotation-float
      :style="{
        position: 'absolute',
        left: floatPos.x + 'px',
        top: floatPos.y + 'px',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '2px solid var(--pink)',
        background: 'var(--bg-card)',
        color: 'var(--accent)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '14px',
      }"
      title="标注纠偏"
      @click="showForm = true"
    >
      <svg
        width="16"
        height="16"
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
    </button>

    <!-- 标注表单弹窗 -->
    <div
      v-if="showForm && floatPos"
      data-annotation-float
      :style="{
        position: 'absolute',
        left: Math.max(0, floatPos.x - 160) + 'px',
        top: (floatPos.y - 10) + 'px',
        zIndex: 101,
        width: '320px',
        background: 'var(--bg-card)',
        border: '1px solid var(--pink)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(243,185,210,0.2)',
      }"
    >
      <div :style="{ marginBottom: '8px' }">
        <span
          :style="{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
          }"
        >
          选中内容
        </span>
        <p
          :style="{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-accent-pink)',
            padding: '6px 10px',
            borderRadius: '6px',
            marginTop: '4px',
            lineHeight: '1.5',
            maxHeight: '60px',
            overflow: 'hidden',
          }"
        >
          {{ selectedText }}
        </p>
      </div>
      <div :style="{ marginBottom: '10px' }">
        <span
          :style="{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
          }"
        >
          纠偏意见
        </span>
        <textarea
          v-model="note"
          placeholder="写下你的纠偏意见..."
          autofocus
          :style="{
            width: '100%',
            marginTop: '4px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'vertical',
            minHeight: '60px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
          }"
          @focus="($event.target as HTMLTextAreaElement).style.borderColor = 'var(--pink)'"
          @blur="($event.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'"
        />
      </div>
      <div :style="{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }">
        <button
          :style="{
            padding: '5px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
          }"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          :style="{
            padding: '5px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            border: '1px solid var(--pink)',
            background: 'var(--bg-accent-pink)',
            color: 'var(--accent)',
            fontWeight: '600',
          }"
          @click="handleSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
