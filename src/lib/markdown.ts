import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'

// 文章目录路径
const postsDirectory = path.join(process.cwd(), 'content/posts')

// 文章接口
export interface MarkdownPost {
  id: string
  slug: string
  title: string
  date: string
  author: string
  category: string
  tags: string[]
  excerpt: string
  readTime: string
  content: string
  contentHtml?: string
  views: number
}

// Front Matter 接口
interface FrontMatter {
  title: string
  date: string
  author: string
  category: string
  tags: string[]
  excerpt: string
  readTime: string
}

/**
 * 获取所有 Markdown 文件的 slug
 */
export function getPostSlugs(): string[] {
  // 确保目录存在
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    return []
  }
  
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''))
}

/**
 * 根据 slug 获取单篇文章数据
 */
export function getPostBySlug(slug: string): MarkdownPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const frontMatter = data as FrontMatter
    
    return {
      id: slug,
      slug,
      title: frontMatter.title || '无标题',
      date: frontMatter.date || new Date().toISOString().split('T')[0],
      author: frontMatter.author || '匿名',
      category: frontMatter.category || '未分类',
      tags: frontMatter.tags || [],
      excerpt: frontMatter.excerpt || content.slice(0, 150) + '...',
      readTime: frontMatter.readTime || estimateReadTime(content),
      content,
      views: Math.floor(Math.random() * 1000) + 100, // 模拟阅读量
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
}

/**
 * 获取所有文章（按日期排序）
 */
export function getAllPosts(): MarkdownPost[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is MarkdownPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  return posts
}

/**
 * 将 Markdown 内容转换为 HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm) // 支持 GFM（表格、任务列表等）
    .use(html, { sanitize: false })
    .process(markdown)
  
  let htmlContent = result.toString()
  
  // 为代码块添加 Prism 所需的 class
  // 将 <pre><code class="language-xxx"> 转换为 <pre class="language-xxx"><code class="language-xxx">
  htmlContent = htmlContent.replace(
    /<pre><code class="language-(\w+)">/g,
    '<pre class="language-$1"><code class="language-$1">'
  )
  
  // 处理没有指定语言的代码块
  htmlContent = htmlContent.replace(
    /<pre><code>/g,
    '<pre class="language-text"><code class="language-text">'
  )
  
  return htmlContent
}

/**
 * 获取带有 HTML 内容的文章
 */
export async function getPostWithHtml(slug: string): Promise<MarkdownPost | null> {
  const post = getPostBySlug(slug)
  
  if (!post) {
    return null
  }
  
  const contentHtml = await markdownToHtml(post.content)
  
  return {
    ...post,
    contentHtml,
  }
}

/**
 * 估算阅读时间
 */
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes}分钟`
}

/**
 * 获取所有分类
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const categories = new Set(posts.map(post => post.category))
  return ['全部', ...Array.from(categories)]
}

/**
 * 根据分类获取文章
 */
export function getPostsByCategory(category: string): MarkdownPost[] {
  const posts = getAllPosts()
  
  if (category === '全部') {
    return posts
  }
  
  return posts.filter(post => post.category === category)
}

/**
 * 搜索文章
 */
export function searchPosts(query: string): MarkdownPost[] {
  const posts = getAllPosts()
  const lowercaseQuery = query.toLowerCase()
  
  return posts.filter(post =>
    post.title.toLowerCase().includes(lowercaseQuery) ||
    post.excerpt.toLowerCase().includes(lowercaseQuery) ||
    post.content.toLowerCase().includes(lowercaseQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

/**
 * 获取所有标签
 */
export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = new Set<string>()
  
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag))
  })
  
  return Array.from(tags)
}

/**
 * 根据标签获取文章
 */
export function getPostsByTag(tag: string): MarkdownPost[] {
  const posts = getAllPosts()
  return posts.filter(post => post.tags.includes(tag))
}
