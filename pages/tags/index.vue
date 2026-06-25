<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold">Tags</h1>
      <p class="mt-1 text-sm text-zinc-500">{{ tags.length }} tag{{ tags.length !== 1 ? 's' : '' }} in total</p>
    </div>

    <div class="pb-5 border-b border-zinc-200 dark:border-zinc-700">
      <div v-if="!loaded" class="py-8 text-center text-sm text-zinc-400">Loading...</div>

      <template v-else-if="tags.length === 0 && !editing">
        <div class="py-8 text-center text-sm text-zinc-400">
          <p>No tags yet.</p>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2.5">
          <div
            v-for="{ tag, count } in tags" :key="tag"
            @click="onTagClick(tag)"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerCancel"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-xs transition-all dark:border-zinc-700 dark:bg-zinc-800 select-none"
            style="touch-action: manipulation; cursor: pointer"
            :class="editing ? 'border-zinc-300 bg-white dark:border-zinc-600' : 'border-zinc-200 bg-white hover:border-blue-200 hover:shadow-sm dark:hover:border-blue-800'"
          >
            <span
              class="transition-colors"
              :class="editing ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400'"
            >
              {{ tag }}
            </span>
            <span class="text-xs tabular-nums text-zinc-400">{{ count }}</span>
            <template v-if="editing">
              <button
                type="button"
                @click="handleMoveUp(tag)"
                class="inline-flex h-4 w-4 items-center justify-center rounded text-xs text-zinc-300 transition-colors hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
              <button
                type="button"
                @click="handlePinToTop(tag)"
                class="inline-flex h-4 w-4 items-center justify-center rounded text-xs text-zinc-300 transition-colors hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="3" /><polyline points="18 9 12 3 6 9" /></svg>
              </button>
              <button
                type="button"
                @click="handleRemoveTag(tag)"
                class="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-xs transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                :aria-label="`Remove ${tag}`"
              >
                ×
              </button>
            </template>
          </div>

          <div v-if="editing" class="inline-flex items-center gap-1">
            <input
              v-if="adding"
              ref="addInputRef"
              v-model="newTag"
              @keydown.enter.prevent="handleAddTag"
              @keydown.escape="cancelAdd"
              @blur="blurAdd"
              placeholder="Tag name..."
              class="w-28 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-blue-500"
            />
            <button
              v-if="!adding"
              type="button"
              @click="startAdd"
              class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-zinc-600 dark:hover:border-blue-500"
              aria-label="Add tag"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              @click="editing = false"
              class="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-500 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addTagToLibrary, getAllTagsClient, moveTagToTop, moveTagUp, removeTagFromLibrary } from '~/composables/useDb'

const tags = ref<{ tag: string; count: number }[]>([])
const loaded = ref(false)
const editing = ref(false)
const adding = ref(false)
const newTag = ref('')
const addInputRef = ref<HTMLInputElement>()
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function onPointerDown() {
  if (editing.value) return
  longPressTimer = setTimeout(() => {
    editing.value = true
    longPressTimer = null
  }, 500)
}

function onPointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onPointerCancel() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onTagClick(tag: string) {
  if (editing.value) return
  navigateTo(`/tags/${tag}`)
}

async function refreshTags() {
  tags.value = await getAllTagsClient()
  loaded.value = true
}

function startAdd() {
  adding.value = true
  nextTick(() => addInputRef.value?.focus())
}

function cancelAdd() {
  adding.value = false
  newTag.value = ''
}

function blurAdd() {
  if (!newTag.value.trim()) {
    cancelAdd()
  }
}

async function handleMoveUp(tagName: string) {
  moveTagUp(tagName)
  await refreshTags()
}

async function handlePinToTop(tagName: string) {
  moveTagToTop(tagName)
  await refreshTags()
}

async function handleAddTag() {
  const value = newTag.value.trim()
  if (!value) return
  await addTagToLibrary(value)
  newTag.value = ''
  adding.value = false
  await refreshTags()
}

async function handleRemoveTag(tag: string) {
  await removeTagFromLibrary(tag)
  await refreshTags()
}

onMounted(async () => {
  await refreshTags()
})
</script>
