<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  getGender?: (name: string) => 'male' | 'female' | 'unknown' | null
}>()

const emit = defineEmits<{
  linkClick: [name: string]
}>()

const parts = computed(() => {
  const result: { type: 'text' | 'link'; value: string }[] = []
  const regex = /\[\[([^\]]+)\]\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(props.text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: props.text.slice(lastIndex, match.index) })
    }
    result.push({ type: 'link', value: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < props.text.length) {
    result.push({ type: 'text', value: props.text.slice(lastIndex) })
  }
  return result
})

function chipClass(name: string) {
  const gender = props.getGender?.(name)
  return gender === 'male' ? 'link-chip link-chip-blue' : 'link-chip'
}
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <span v-if="part.type === 'text'">{{ part.value }}</span>
      <button
        v-else
        :class="chipClass(part.value)"
        @click="emit('linkClick', part.value)"
      >
        {{ part.value }}
      </button>
    </template>
  </span>
</template>
