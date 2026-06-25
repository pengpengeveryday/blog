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
        <label class="block text-sm font-medium mb-1">Date</label>
        <input v-model="dateStr" type="datetime-local" required
          class="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tags (comma separated)</label>
        <input v-model="tagsStr" placeholder="e.g. react, tutorial"
          class="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Content (Markdown)</label>
        <textarea v-model="content" placeholder="Write your post in Markdown..." required :rows="16"
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
import { savePost, formatNow, getAllPostsClient } from '~/composables/useDb'

const router = useRouter()
const title = ref('')
const dateStr = ref(formatNow().slice(0, 16))
const tagsStr = ref('')
const content = ref('')
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

async function handleSubmit() {
  if (!title.value.trim() || !content.value.trim()) return

  saving.value = true
  error.value = ''

  const tagArray = tagsStr.value.split(',').map((t) => t.trim()).filter(Boolean)

  try {
    const html = await marked.parse(content.value.trim())
    const date = dateStr.value.replace('T', ' ') + ':00'
    const now = formatNow()
    const existingPosts = await getAllPostsClient()
    const slug = buildUniqueSlug(title.value, existingPosts.map((post) => post.slug))

    await savePost({
      slug,
      title: title.value.trim(),
      date,
      modified: now,
      tags: tagArray,
      description: extractDescription(content.value),
      readingTime: readingTime(content.value),
      content: html,
    })

    router.push(`/posts/${slug}`)
  } catch {
    error.value = 'Failed to create post'
    saving.value = false
  }
}
</script>
