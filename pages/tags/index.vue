<template>
  <div class="space-y-8">
    <h1 class="text-3xl font-bold">Tags</h1>
    <p v-if="!loaded">Loading...</p>
    <p v-else-if="tags.length === 0" class="text-zinc-500">No tags yet.</p>
    <div v-else class="flex flex-wrap gap-3">
      <NuxtLink
        v-for="{ tag, count } in tags" :key="tag"
        :to="`/tags/${tag}`"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
      >
        {{ tag }} <span class="text-xs text-zinc-400">({{ count }})</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAllTagsClient } from '~/composables/useDb'

const tags = ref<{ tag: string; count: number }[]>([])
const loaded = ref(false)

onMounted(async () => {
  tags.value = await getAllTagsClient()
  loaded.value = true
})
</script>
