<template>
  <div>
    <div v-if="!loaded">Loading...</div>
    <p v-else-if="!post" class="text-zinc-500">Post not found.</p>
    <article v-else>
      <NuxtLink to="/" class="inline-block text-sm text-zinc-500 hover:text-blue-600 mb-6">&larr; Back to posts</NuxtLink>
      <header class="mb-8">
        <h1 class="text-3xl font-bold">{{ post.title }}</h1>
        <time class="block mt-2 text-sm text-zinc-500">{{ post.date }}</time>
        <time v-if="post.modified && post.modified !== post.date" class="block text-xs text-zinc-400">Modified: {{ post.modified }}</time>
        <TagEditor :slug="post.slug" :initial-tags="post.tags" @update:tags="onTagsUpdate" />
      </header>
      <div v-if="post.contentType === 'text'" class="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {{ post.content }}
      </div>
      <div v-else class="prose prose-zinc dark:prose-invert max-w-none" v-html="post.content" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { getPostBySlugClient } from '~/composables/useDb'
import TagEditor from '~/components/TagEditor.vue'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const post = ref<any>(null)
const loaded = ref(false)

const cleanedContent = computed(() => {
  if (!post.value) return ''
  return post.value.content.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim()
})

onMounted(async () => {
  const p = await getPostBySlugClient(slug.value)
  post.value = p
  loaded.value = true
})

function onTagsUpdate(newTags: string[]) {
  if (post.value) {
    post.value.tags = newTags
  }
}
</script>
