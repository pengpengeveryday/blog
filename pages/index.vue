<template>
  <div class="space-y-10">
    <section>
      <h1 class="text-3xl font-bold mb-2">Blog Posts</h1>
      <p class="text-zinc-600 dark:text-zinc-400">Welcome to my blog.</p>
    </section>

    <div class="flex flex-wrap gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <NuxtLink
        to="/"
        :class="['px-3 py-1.5 text-sm rounded-full transition-colors', !tag ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700']"
      >
        All
      </NuxtLink>
      <NuxtLink
        v-for="{ tag: t, count } in tags" :key="t"
        :to="`/?tag=${t}`"
        :class="['px-3 py-1.5 text-sm rounded-full transition-colors', tag === t ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700']"
      >
        {{ t }} ({{ count }})
      </NuxtLink>
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
import { getAllPostsClient, getAllTagsClient, getPostsByTagClient } from '~/composables/useDb'

const route = useRoute()
const tag = computed(() => route.query.tag as string | undefined)

const posts = ref<any[]>([])
const tags = ref<{ tag: string; count: number }[]>([])
const loaded = ref(false)

async function loadData() {
  tags.value = await getAllTagsClient()
  posts.value = tag.value ? await getPostsByTagClient(tag.value) : await getAllPostsClient()
  loaded.value = true
}

onMounted(loadData)
watch(tag, () => { if (process.client) loadData() })
</script>
