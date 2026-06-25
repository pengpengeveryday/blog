import { openDB, type IDBPDatabase } from 'idb'

const STORAGE_KEY = 'blog-posts'

export interface PostRecord {
  id?: string
  slug: string
  title: string
  date: string
  modified: string
  tags: string[]
  description: string
  readingTime: string
  content: string
  contentType?: 'markdown' | 'text'
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export { formatNow }

let dbPromise: Promise<IDBPDatabase> | null = null

function createPostId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function ensurePostId(post: PostRecord): PostRecord {
  if (post.id) return post
  return { ...post, id: createPostId() }
}

function getDb() {
  if (process.server || typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB('blog-db', 2, {
      upgrade(db) {
        if (db.objectStoreNames.contains('posts')) {
          db.deleteObjectStore('posts')
        }
        db.createObjectStore('posts', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

function getClientStorage() {
  if (process.server || typeof window === 'undefined') return null
  return window.localStorage
}

function readStoredPosts(): PostRecord[] {
  const storage = getClientStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PostRecord[]) : []
  } catch {
    return []
  }
}

function sortPosts(posts: PostRecord[]) {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))
}

function mergePosts(...sources: Array<PostRecord[] | undefined | null>): PostRecord[] {
  const map = new Map<string, PostRecord>()
  for (const source of sources) {
    for (const rawPost of source || []) {
      const post = ensurePostId(rawPost)
      if (!post?.slug) continue
      const key = post.id || post.slug
      const existing = map.get(key)
      if (!existing || (post.modified || post.date) > (existing.modified || existing.date)) {
        map.set(key, post)
      }
    }
  }
  return sortPosts(Array.from(map.values()))
}

async function persistPostsToAllStores(posts: PostRecord[]) {
  const sortedPosts = sortPosts(posts.map((post) => ensurePostId(post)))
  try {
    const storage = getClientStorage()
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(sortedPosts))
    }
  } catch {
    // ignore localStorage failures
  }

  try {
    const db = await getDb()
    if (db) {
      const tx = db.transaction('posts', 'readwrite')
      await tx.store.clear()
      for (const post of sortedPosts) {
        await tx.store.put(post)
      }
      await tx.done
    }
  } catch {
    // ignore IndexedDB failures
  }

}

export async function seedPosts(posts: PostRecord[]) {
  if (process.server || typeof window === 'undefined') return
  const mergedPosts = mergePosts(readStoredPosts(), posts)
  await persistPostsToAllStores(mergedPosts)
}

export async function getAllPostsClient(): Promise<PostRecord[]> {
  if (process.server || typeof window === 'undefined') return []

  const [dbPosts, localPosts] = await Promise.all([
    readStoredPostsFromDb(),
    Promise.resolve(readStoredPosts()),
  ])

  const mergedPosts = mergePosts(dbPosts, localPosts)
  if (mergedPosts.length > 0) {
    await persistPostsToAllStores(mergedPosts)
  }
  return mergedPosts
}

export async function getPostBySlugClient(slug: string): Promise<PostRecord | undefined> {
  if (process.server || typeof window === 'undefined') return undefined
  const posts = await getAllPostsClient()
  return posts.find((post) => post.slug === slug)
}

export async function getPostsByTagClient(tag: string): Promise<PostRecord[]> {
  const all = await getAllPostsClient()
  return all.filter((p) => p.tags.includes(tag))
}

export async function getAllTagsClient(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPostsClient()
  const map = new Map<string, number>()
  posts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
  return Array.from(map.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
}

async function readStoredPostsFromDb(): Promise<PostRecord[]> {
  if (process.server || typeof window === 'undefined') return []
  try {
    const db = await getDb()
    if (!db) return []
    const posts = await db.getAll('posts')
    return Array.isArray(posts) ? (posts as PostRecord[]) : []
  } catch {
    return []
  }
}

export async function savePost(post: PostRecord) {
  if (process.server || typeof window === 'undefined') return

  const normalizedPost = ensurePostId(post)
  const existingPosts = await getAllPostsClient()
  const mergedPosts = mergePosts(existingPosts, [normalizedPost])
  await persistPostsToAllStores(mergedPosts)
}
