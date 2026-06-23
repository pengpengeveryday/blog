import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface PostRecord {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
  readingTime: string
  content: string
}

function extractDescription(content: string, frontmatterDesc?: string): string {
  if (frontmatterDesc) return frontmatterDesc
  const text = content.replace(/[#*`\[\]]/g, '').trim()
  return text.length > 150 ? text.slice(0, 150) + '...' : text
}

function calculateReadingTime(content: string): string {
  const words = content.split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

export function getEmbeddedPosts(): PostRecord[] {
  const postsDir = path.join(process.cwd(), 'content/posts')
  if (!fs.existsSync(postsDir)) return []

  const fileNames = fs.readdirSync(postsDir).filter((fn) => fn.endsWith('.md'))
  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')
    const fullPath = path.join(postsDir, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const rendered = marked.parse(content) as string
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      tags: (data.tags as string[]) || [],
      description: extractDescription(content, data.description as string | undefined),
      readingTime: calculateReadingTime(content),
      content: rendered,
    }
  })
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}
