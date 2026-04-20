<script setup lang="ts">
import type { Annotation } from '../composables/useAnnotations'

defineProps<{
  annotations: Annotation[]
}>()

const emit = defineEmits<{
  remove: [id: string]
  close: []
}>()

function handleExport(annotations: Annotation[]) {
  const blob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `纠偏记录_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div :style="{ height: '100%', display: 'flex', flexDirection: 'column' }">
    <!-- 头部 -->
    <div
      :style="{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }"
    >
      <h3
        :style="{
          fontFamily: 'var(--font-heading)',
          fontSize: '16px',
          color: 'var(--text-primary)',
          margin: '0',
        }"
      >
        纠偏记录
      </h3>
      <div :style="{ display: 'flex', gap: '8px' }">
        <button
          v-if="annotations.length > 0"
          :style="{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--accent-alt)',
          }"
          @click="handleExport(annotations)"
        >
          导出
        </button>
        <button
          :style="{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
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
    </div>

    <!-- 列表 -->
    <div :style="{ flex: '1', overflowY: 'auto', padding: '12px 16px' }">
      <p
        v-if="annotations.length === 0"
        :style="{
          color: 'var(--text-muted)',
          fontSize: '14px',
          textAlign: 'center',
          marginTop: '40px',
        }"
      >
        暂无纠偏记录。选中页面文本即可标注。
      </p>
      <div v-else :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
        <div
          v-for="a in [...annotations].reverse()"
          :key="a.id"
          :style="{
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
          }"
        >
          <p
            :style="{
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'var(--bg-accent-pink)',
              padding: '4px 8px',
              borderRadius: '4px',
              marginBottom: '6px',
              maxHeight: '40px',
              overflow: 'hidden',
              lineHeight: '1.5',
            }"
          >
            &ldquo;{{ a.selectedText }}&rdquo;
          </p>
          <p
            :style="{
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              marginBottom: '8px',
            }"
          >
            {{ a.note }}
          </p>
          <div
            :style="{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }"
          >
            <span :style="{ fontSize: '11px', color: 'var(--text-muted)' }">
              {{ new Date(a.timestamp).toLocaleString('zh-CN') }}
            </span>
            <button
              :style="{
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                padding: '2px 6px',
              }"
              @click="emit('remove', a.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
