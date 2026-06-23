<template>
  <div class="flex gap-2 mt-3 flex-wrap items-center">
    <template v-for="tag in localTags" :key="tag">
      <span v-if="editing" class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
        {{ tag }}
        <button @click="removeTag(tag)" class="hover:text-red-500 transition-colors leading-none text-sm">&times;</button>
      </span>
      <button
        v-else
        @click="handleClick(tag)"
        @pointerdown="startTimer"
        @pointerup="clearTimer"
        @pointercancel="clearTimer"
        class="inline-block px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer select-none"
        style="touch-action: manipulation"
      >
        {{ tag }}
      </button>
    </template>
    <template v-if="editing">
      <input
        ref="inputRef"
        @keydown.enter.prevent="addTag"
        @keydown.escape="doneEditing"
        placeholder="New tag..."
        class="w-24 px-2 py-0.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:border-blue-500"
      />
      <button @click="addTag"
        class="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors select-none"
        style="touch-action: manipulation"
      >
        +
      </button>
      <button @click="doneEditing"
        class="px-2 py-0.5 text-xs rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors select-none"
        style="touch-action: manipulation"
      >
        Done
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getPostBySlugClient, savePost } from '~/composables/useDb'

const props = defineProps<{
  slug: string
  initialTags: string[]
}>()

const emit = defineEmits<{
  'update:tags': [tags: string[]]
}>()

const editing = ref(false)
const localTags = ref<string[]>([...props.initialTags])
const inputRef = ref<HTMLInputElement | null>(null)
const longPressRef = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(editing, (val) => {
  if (val && inputRef.value) {
    nextTick(() => inputRef.value?.focus())
  }
})

function startTimer() {
  longPressRef.value = false
  timer = setTimeout(() => {
    longPressRef.value = true
    editing.value = true
  }, 500)
}

function clearTimer() {
  if (timer) { clearTimeout(timer); timer = null }
}

function handleClick(tag: string) {
  if (longPressRef.value) {
    longPressRef.value = false
    return
  }
  navigateTo(`/tags/${tag}`)
}

async function saveTagsToDb(newTags: string[]) {
  const post = await getPostBySlugClient(props.slug)
  if (post) {
    post.tags = newTags
    await savePost(post)
  }
}

async function addTag() {
  if (!inputRef.value) return
  const value = inputRef.value.value.trim()
  if (!value) return

  inputRef.value.value = ''
  const next = [...localTags.value, value]
  localTags.value = next
  emit('update:tags', next)
  await saveTagsToDb(next)
}

async function removeTag(tag: string) {
  const next = localTags.value.filter((t) => t !== tag)
  localTags.value = next
  emit('update:tags', next)
  await saveTagsToDb(next)
}

function doneEditing() {
  editing.value = false
}
</script>
