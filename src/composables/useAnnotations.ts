import { ref } from 'vue'

export interface Annotation {
  id: string
  selectedText: string
  note: string
  characterId: string
  timestamp: string
}

const STORAGE_KEY = 'dongman-wiki-annotations'

function loadAnnotations(): Annotation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveAnnotations(list: Annotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function useAnnotations() {
  const annotations = ref<Annotation[]>(loadAnnotations())

  const add = (a: Omit<Annotation, 'id' | 'timestamp'>) => {
    annotations.value = [
      ...annotations.value,
      { ...a, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
    ]
    saveAnnotations(annotations.value)
  }

  const remove = (id: string) => {
    annotations.value = annotations.value.filter((a) => a.id !== id)
    saveAnnotations(annotations.value)
  }

  return { annotations, add, remove }
}
