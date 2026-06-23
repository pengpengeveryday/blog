<template>
  <div class="space-y-8">
    <div v-if="!loaded">Loading...</div>
    <p v-else-if="posts.length === 0" class="text-zinc-500">No posts found.</p>
    <template v-else>
      <div>
        <NuxtLink to="/tags" class="inline-block text-sm text-zinc-500 hover:text-blue-600 mb-4">&larr; All tags</NuxtLink>
        <h1 class="text-3xl font-bold">{{ tag }}</h1>
        <p class="text-zinc-500 mt-1">{{ posts.length }} posts</p>
      </div>
      <div class="space-y-6">
        <article v-for="post in posts" :key="post.slug" class="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <NuxtLink :to="`/posts/${post.slug}`" class="group">
            <h2 class="text-xl font-semibold group-hover:text-blue-600 transition-colors">{{ post.title }}</h2>
          </NuxtLink>
          <time class="block mt-1 text-sm text-zinc-500">{{ post.date }}</time>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getPostsByTagClient } from '~/composables/useDb'

const route = useRoute()
const tag = computed(() => route.params.tag as string)

const posts = ref<any[]>([])
const loaded = ref(false)

onMounted(async () => {
  posts.value = await getPostsByTagClient(tag.value)
  loaded.value = true
})
</script>
