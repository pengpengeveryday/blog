import { openDB, type IDBPDatabase } from 'idb'

export interface PostRecord {
  slug: string
  title: string
  date: string
  modified: string
  tags: string[]
  description: string
  readingTime: string
  content: string
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export { formatNow }

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (process.server) return null
  if (!dbPromise) {
    dbPromise = openDB('blog-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'slug' })
        }
      },
    })
  }
  return dbPromise
}

export async function seedPosts(posts: PostRecord[]) {
  if (process.server) return
  const db = await getDb()
  if (!db) return
  const tx = db.transaction('posts', 'readwrite')
  const existing = await tx.store.count()
  if (existing === 0) {
    for (const post of posts) {
      await tx.store.put(post)
    }
  }
  await tx.done
}

export async function getAllPostsClient(): Promise<PostRecord[]> {
  if (process.server) return []
  const db = await getDb()
  if (!db) return []
  const posts = await db.getAll('posts')
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlugClient(slug: string): Promise<PostRecord | undefined> {
  if (process.server) return undefined
  const db = await getDb()
  if (!db) return undefined
  return db.get('posts', slug)
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

export async function savePost(post: PostRecord) {
  if (process.server) return
  const db = await getDb()
  if (!db) return
  await db.put('posts', post)
}
