<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">New Post</h1>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Title</label>
        <input v-model="title" placeholder="Post title" required
          class="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tags</label>
        <div class="rounded-2xl border border-zinc-200/80 bg-white/90 p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
          <div class="flex flex-wrap gap-2">
            <template v-for="tag in selectedTags" :key="tag">
              <span class="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {{ tag }}
                <button type="button" @click="removeTag(tag)" class="leading-none text-zinc-400 transition-colors hover:text-red-500">×</button>
              </span>
            </template>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="relative flex-1">
              <select v-model="tagInput" class="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-9 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:bg-zinc-900">
                <option value="">Select or type a tag</option>
                <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                ▼
              </div>
            </div>
            <button type="button" @click="addTag" class="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
              Add
            </button>
          </div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Content Format</label>
        <div class="flex gap-2">
          <label class="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <input v-model="contentFormat" type="radio" value="markdown" class="h-4 w-4 text-blue-600" />
            <span>Markdown</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <input v-model="contentFormat" type="radio" value="text" class="h-4 w-4 text-blue-600" />
            <span>Plain text</span>
          </label>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Content</label>
        <textarea v-model="content" :placeholder="contentFormat === 'markdown' ? 'Write your post in Markdown...' : 'Write your post as plain text...'" required :rows="16"
          class="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:border-blue-500 font-mono resize-y" />
      </div>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <div class="flex gap-3">
        <button type="submit" :disabled="saving"
          class="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
          {{ saving ? 'Publishing...' : 'Publish' }}
        </button>
        <button type="button" @click="router.back()"
          class="px-4 py-2 text-sm rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { savePost, formatNow, getAllPostsClient, getAllTagsClient } from '~/composables/useDb'

const router = useRouter()
const title = ref('')
const tagInput = ref('')
const selectedTags = ref<string[]>([])
const availableTags = ref<string[]>([])
const content = ref('')
const contentFormat = ref<'markdown' | 'text'>('markdown')
const saving = ref(false)
const error = ref('')

function slugify(text: string): string {
  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const slug = normalized
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'untitled'
}

function buildUniqueSlug(title: string, existingSlugs: Iterable<string>): string {
  const baseSlug = slugify(title) || 'untitled'
  const used = new Set(existingSlugs)
  if (!used.has(baseSlug)) return baseSlug

  let counter = 2
  let candidate = `${baseSlug}-${counter}`
  while (used.has(candidate)) {
    counter += 1
    candidate = `${baseSlug}-${counter}`
  }
  return candidate
}

function extractDescription(text: string): string {
  const clean = text.replace(/[#*`\[\]]/g, '').trim()
  return clean.length > 150 ? clean.slice(0, 150) + '...' : clean
}

function readingTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

function addTag() {
  const value = tagInput.value.trim()
  if (!value) return
  const normalized = value.toLowerCase()
  if (!selectedTags.value.some((tag) => tag.toLowerCase() === normalized)) {
    selectedTags.value = [...selectedTags.value, value]
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((item) => item !== tag)
}

onMounted(async () => {
  const tags = await getAllTagsClient()
  availableTags.value = tags.map((item) => item.tag).sort((a, b) => a.localeCompare(b))
})

async function handleSubmit() {
  if (!title.value.trim() || !content.value.trim()) return

  saving.value = true
  error.value = ''

  try {
    const now = formatNow()
    const normalizedContent = content.value.trim()
    const html = contentFormat.value === 'markdown'
      ? await marked.parse(normalizedContent)
      : normalizedContent
    const existingPosts = await getAllPostsClient()
    const slug = buildUniqueSlug(title.value, existingPosts.map((post) => post.slug))

    await savePost({
      slug,
      title: title.value.trim(),
      date: now,
      modified: now,
      tags: selectedTags.value,
      description: extractDescription(normalizedContent),
      readingTime: readingTime(normalizedContent),
      content: html,
      contentType: contentFormat.value,
    })

    router.push(`/posts/${slug}`)
  } catch {
    error.value = 'Failed to create post'
    saving.value = false
  }
}
</script>
