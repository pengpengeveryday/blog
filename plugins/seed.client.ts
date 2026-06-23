import { seedPosts } from '~/composables/useDb'

export default defineNuxtPlugin(async () => {
  try {
    const posts = await $fetch('/api/posts')
    if (Array.isArray(posts) && posts.length > 0) {
      await seedPosts(posts)
    }
  } catch {
  }
})
