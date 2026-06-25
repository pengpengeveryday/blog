<template>
  <div class="space-y-10">
    <section>
      <h1 class="text-3xl font-bold mb-2">Blog Posts</h1>
      <p class="text-zinc-600 dark:text-zinc-400">Welcome to my blog.</p>
    </section>

    <div class="pb-4 border-b border-zinc-200 dark:border-zinc-700">
      <div class="flex flex-wrap items-center gap-2">
        <template v-for="{ tag: t, count } in tags" :key="t">
          <div
            @click="onTagClick(t)"
            @pointerdown="(e) => onPointerDown(e, t)"
            @pointerup="onPointerUp"
            @pointercancel="onPointerCancel"
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm shadow-xs transition-all select-none"
            style="touch-action: manipulation; cursor: pointer"
            :class="editing ? 'border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' : (tag === t ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700')"
          >
            <span>{{ t }} ({{ count }})</span>
            <template v-if="editing">
              <button
                type="button"
                @click="handleMoveUp(t)"
                class="inline-flex h-4 w-4 items-center justify-center rounded text-xs text-zinc-300 transition-colors hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
              <button
                type="button"
                @click="handlePinToTop(t)"
                class="inline-flex h-4 w-4 items-center justify-center rounded text-xs text-zinc-300 transition-colors hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="3" /><polyline points="18 9 12 3 6 9" /></svg>
              </button>
              <button
                type="button"
                @click="handleRemoveTag(t)"
                class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-xs transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/40 dark:hover:text-red-400"
              >
                ×
              </button>
            </template>
          </div>
        </template>
        <button
          v-if="editing && !adding"
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
        <input
          v-if="adding"
          ref="addInputRef"
          v-model="newTag"
          @keydown.enter.prevent="handleAddTag"
          @keydown.escape="cancelAdd"
          @blur="blurAdd"
          placeholder="Tag name..."
          class="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-blue-500"
        />
        <button
          v-if="editing"
          type="button"
          @click="editing = false"
          class="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-500 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </button>
      </div>
    </div>

    <div v-if="!loaded">Loading...</div>
    <div v-else class="space-y-8">
      <article v-for="post in posts" :key="post.slug">
        <NuxtLink :to="`/posts/${post.slug}`" class="group block">
          <h2 class="text-xl font-semibold group-hover:text-blue-600 transition-colors">{{ post.title }}</h2>
          <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{{ post.description }}</p>
        </NuxtLink>
        <div class="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <time>{{ post.date }}</time>
          <span>&middot;</span>
          <span>{{ post.readingTime }}</span>
          <template v-if="post.tags.length > 0">
            <span>&middot;</span>
            <div class="flex gap-1.5">
              <NuxtLink v-for="t in post.tags" :key="t" :to="`/?tag=${t}`" class="hover:text-blue-600 transition-colors">#{{ t }}</NuxtLink>
            </div>
          </template>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addTagToLibrary, getAllTagsClient, getPostsByTagClient, moveTagToTop, moveTagUp, removeTagFromLibrary } from '~/composables/useDb'

const route = useRoute()
const tag = computed(() => route.query.tag as string | undefined)

const posts = ref<any[]>([])
const tags = ref<{ tag: string; count: number }[]>([])
const loaded = ref(false)
const editing = ref(false)
const adding = ref(false)
const newTag = ref('')
const addInputRef = ref<HTMLInputElement>()
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressTag = ''

function onTagClick(tagName: string) {
  if (editing.value) return
  navigateTo(`/?tag=${tagName}`)
}

function onPointerDown(e: PointerEvent, tagName: string) {
  if (editing.value) return
  longPressTag = tagName
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

async function loadData() {
  try {
    tags.value = await getAllTagsClient()
    const routeTag = route.query.tag as string | undefined
    if (routeTag && tags.value.some((t) => t.tag === routeTag)) {
      posts.value = await getPostsByTagClient(routeTag)
    } else if (tags.value.length > 0) {
      await navigateTo(`/?tag=${tags.value[0].tag}`, { replace: true })
      return
    } else {
      posts.value = []
    }
  } catch (error) {
    console.warn('Failed to load posts', error)
    posts.value = []
    tags.value = []
  } finally {
    loaded.value = true
  }
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

async function handleAddTag() {
  const value = newTag.value.trim()
  if (!value) return
  await addTagToLibrary(value)
  newTag.value = ''
  adding.value = false
  await loadData()
}

async function handleMoveUp(tagName: string) {
  moveTagUp(tagName)
  await loadData()
}

async function handlePinToTop(tagName: string) {
  moveTagToTop(tagName)
  await loadData()
}

async function handleRemoveTag(tagName: string) {
  await removeTagFromLibrary(tagName)
  await loadData()
}

onMounted(loadData)
watch(tag, () => { if (process.client) loadData() })
</script>
