import { openDB, type IDBPDatabase } from 'idb'

const STORAGE_KEY = 'blog-posts'
const TAGS_STORAGE_KEY = 'blog-tags'
const TAG_ORDER_KEY = 'blog-tag-order'

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

function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ')
}

function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags || []) {
    const normalized = normalizeTag(tag)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

function readStoredTagEntries(): Array<{ tag: string; updatedAt: string }> {
  const storage = getClientStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(TAGS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Array<{ tag: string; updatedAt: string }>) : []
  } catch {
    return []
  }
}

function writeStoredTagEntries(entries: Array<{ tag: string; updatedAt: string }>) {
  const storage = getClientStorage()
  if (!storage) return
  storage.setItem(TAGS_STORAGE_KEY, JSON.stringify(entries))
}

function readTagOrder(): string[] {
  const storage = getClientStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(TAG_ORDER_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeTagOrder(order: string[]) {
  const storage = getClientStorage()
  if (!storage) return
  storage.setItem(TAG_ORDER_KEY, JSON.stringify(order))
}

function syncTagsWithPosts(posts: PostRecord[]) {
  const entries = readStoredTagEntries()
  const map = new Map(entries.map((entry) => [entry.tag.toLowerCase(), entry]))
  for (const post of posts) {
    for (const tag of normalizeTagList(post.tags || [])) {
      const key = tag.toLowerCase()
      const updatedAt = post.modified || post.date || formatNow()
      const existing = map.get(key)
      if (!existing || updatedAt > existing.updatedAt) {
        map.set(key, { tag, updatedAt })
      }
    }
  }
  const nextEntries = Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  writeStoredTagEntries(nextEntries)
  return nextEntries
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
  const normalizedPosts = posts.map((post) => ({
    ...post,
    tags: normalizeTagList(post.tags || []),
  }))
  const sortedPosts = sortPosts(normalizedPosts.map((post) => ensurePostId(post)))
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

  syncTagsWithPosts(sortedPosts)
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

export function moveTagUp(tag: string) {
  const order = readTagOrder()
  const idx = order.findIndex((t) => t.toLowerCase() === tag.toLowerCase())
  if (idx <= 0) return
  [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
  writeTagOrder(order)
}

export function moveTagToTop(tag: string) {
  const order = readTagOrder()
  const idx = order.findIndex((t) => t.toLowerCase() === tag.toLowerCase())
  if (idx <= 0) return
  const [item] = order.splice(idx, 1)
  order.unshift(item)
  writeTagOrder(order)
}

export function addTagToLibrary(tag: string) {
  const normalized = normalizeTag(tag)
  if (!normalized) return
  const entries = readStoredTagEntries()
  const key = normalized.toLowerCase()
  if (entries.some((e) => e.tag.toLowerCase() === key)) return
  entries.push({ tag: normalized, updatedAt: formatNow() })
  writeStoredTagEntries(entries)
}

export function removeTagFromLibrary(tag: string) {
  const entries = readStoredTagEntries()
  const key = tag.toLowerCase()
  const filtered = entries.filter((e) => e.tag.toLowerCase() !== key)
  writeStoredTagEntries(filtered)
}

export async function getPostBySlugClient(slug: string): Promise<PostRecord | undefined> {
  if (process.server || typeof window === 'undefined') return undefined
  const posts = await getAllPostsClient()
  return posts.find((post) => post.slug === slug)
}

export async function getPostsByTagClient(tag: string): Promise<PostRecord[]> {
  const all = await getAllPostsClient()
  const normalized = normalizeTag(tag)
  return all.filter((p) => p.tags.some((t) => t.toLowerCase() === normalized.toLowerCase()))
}

export async function getAllTagsClient(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPostsClient()
  const tagEntries = readStoredTagEntries()
  const order = readTagOrder()
  const countMap = new Map<string, number>()
  for (const post of posts) {
    for (const t of normalizeTagList(post.tags || [])) {
      countMap.set(t.toLowerCase(), (countMap.get(t.toLowerCase()) || 0) + 1)
    }
  }
  const tagSet = new Set<string>()
  const result: { tag: string; count: number }[] = []
  if (order.length > 0) {
    for (const t of order) {
      const key = t.toLowerCase()
      const count = countMap.get(key) || 0
      if (count > 0 || tagEntries.some((e) => e.tag.toLowerCase() === key)) {
        tagSet.add(key)
        result.push({ tag: t, count })
      }
    }
  }
  for (const post of posts) {
    for (const t of normalizeTagList(post.tags || [])) {
      const key = t.toLowerCase()
      if (!tagSet.has(key)) {
        tagSet.add(key)
        const count = countMap.get(key) || 0
        result.push({ tag: t, count })
      }
    }
  }
  return result.sort((a, b) => b.count - a.count)
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

  const normalizedPost = { ...post, tags: normalizeTagList(post.tags || []) }
  const existingPosts = await getAllPostsClient()
  const mergedPosts = mergePosts(existingPosts, [ensurePostId(normalizedPost)])
  await persistPostsToAllStores(mergedPosts)
}
