import { getEmbeddedPosts } from '../utils/posts-data'

export default defineEventHandler(() => {
  return getEmbeddedPosts()
})
