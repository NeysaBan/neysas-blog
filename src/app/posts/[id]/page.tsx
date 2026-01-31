'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getArticleById, articles as hardcodedArticles } from '@/data/articles'
import { CodeHighlight } from '@/components/CodeHighlight'
import { ArrowLeft, Calendar, Clock, User, Eye, Tag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { MagicLamp } from '@/components/MagicLamp'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-git'
import 'prismjs/components/prism-diff'

interface Post {
  id: string
  slug: string
  title: string
  date: string
  author: string
  category: string
  tags: string[]
  excerpt: string
  readTime: string
  views: number
  content: string
  contentHtml?: string
}

export default function ArticlePage() {
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [viewsIncremented, setViewsIncremented] = useState(false)

  // 代码高亮 - 在内容加载后执行
  useEffect(() => {
    if (post?.contentHtml) {
      // 延迟执行以确保 DOM 已更新
      setTimeout(() => {
        Prism.highlightAll()
      }, 100)
    }
  }, [post?.contentHtml])

  // 增加浏览量 - 只在首次访问时执行
  useEffect(() => {
    const incrementViews = async () => {
      if (post?.slug && !viewsIncremented) {
        try {
          const response = await fetch(`/api/views/${post.slug}`, {
            method: 'POST'
          })
          const data = await response.json()
          if (data.success) {
            setPost(prev => prev ? { ...prev, views: data.views } : null)
            setViewsIncremented(true)
          }
        } catch (error) {
          console.error('Failed to increment views:', error)
        }
      }
    }
    incrementViews()
  }, [post?.slug, viewsIncremented])

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      
      // 尝试从 API 获取 Markdown 文章
      try {
        const slug = params.id as string
        const response = await fetch(`/api/posts/${slug}`)
        const data = await response.json()
        
        if (data.success && data.post) {
          setPost(data.post)
          
          // 获取所有文章用于导航
          const allResponse = await fetch('/api/posts')
          const allData = await allResponse.json()
          if (allData.success) {
            setAllPosts(allData.posts)
          }
          setLoading(false)
          return
        }
      } catch (error) {
        console.log('Markdown post not found, trying hardcoded articles')
      }
      
      // 回退到硬编码文章
      const hardcodedArticle = getArticleById(params.id as string)
      if (hardcodedArticle) {
        setPost({
          ...hardcodedArticle,
          slug: hardcodedArticle.id
        })
        setAllPosts(hardcodedArticles.map(a => ({ ...a, slug: a.id })))
      }
      
      setLoading(false)
    }
    
    fetchPost()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000101] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e8a917] animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#000101] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[#733657] text-4xl font-bold mb-4">文章未找到</h1>
          <Link href="/" className="text-[#e8a917] hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  // Get prev/next articles
  const currentIndex = allPosts.findIndex(a => a.slug === post.slug || a.id === post.id)
  const prevArticle = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextArticle = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-[#000101]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000101]/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-[#733657] text-2xl font-mystical italic">
              Neysa
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-12">
              {['首页', '文章', '关于'].map((item) => (
                <Link
                  key={item}
                  href={item === '首页' ? '/' : item === '文章' ? '/posts' : '#'}
                  className="text-[#733657] hover:text-[#e8a917] transition-colors duration-300 text-sm tracking-wider"
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Back Button */}
            <Link 
              href="/"
              className="flex items-center text-[#e8a917] hover:text-[#733657] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </Link>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="pt-32 pb-20">
        <article className="container mx-auto px-8 max-w-4xl">
          {/* Article Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            {/* Category */}
            <p className="text-[#e8a917] italic text-lg mb-4">
              {post.category}
            </p>

            {/* Title */}
            <h1 
              className="text-[#733657] text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm mb-8">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#e8a917]" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#e8a917]" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#e8a917]" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#e8a917]" />
                <span>{post.views} 阅读</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-[#733657]/30 text-[#733657] text-xs tracking-wider hover:border-[#e8a917] hover:text-[#e8a917] transition-colors cursor-pointer"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.header>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#733657] to-transparent mb-12" />

          {/* Article Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            {post.contentHtml ? (
              // 渲染 Markdown 转换后的 HTML
              <div 
                className="text-gray-300 leading-relaxed markdown-content"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            ) : (
              // 使用代码高亮组件渲染原始内容
              <div className="text-gray-300 leading-relaxed space-y-6">
                <CodeHighlight content={post.content} />
              </div>
            )}
          </motion.div>

          {/* Article Footer */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#733657] to-transparent mb-12" />

            {/* Navigation */}
            <div className="flex flex-col md:flex-row justify-between gap-8">
              {prevArticle ? (
                <Link 
                  href={`/posts/${prevArticle.slug || prevArticle.id}`}
                  className="flex-1 group"
                >
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一篇
                  </div>
                  <p className="text-[#733657] group-hover:text-[#e8a917] transition-colors font-medium">
                    {prevArticle.title}
                  </p>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextArticle ? (
                <Link 
                  href={`/posts/${nextArticle.slug || nextArticle.id}`}
                  className="flex-1 text-right group"
                >
                  <div className="flex items-center justify-end text-gray-500 text-sm mb-2">
                    下一篇
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                  <p className="text-[#733657] group-hover:text-[#e8a917] transition-colors font-medium">
                    {nextArticle.title}
                  </p>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </motion.footer>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-[#733657] py-4">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between">
            <p className="text-[#e8a917] text-sm">
              Copyright © Neysa's Blog
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">f</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">t</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">in</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Magic Lamp */}
      <MagicLamp />

      {/* Markdown Styles */}
      <style jsx global>{`
        .markdown-content h1 {
          color: #733657;
          font-size: 2.25rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-family: 'Noto Serif SC', serif;
        }
        .markdown-content h2 {
          color: #e8a917;
          font-size: 1.75rem;
          font-weight: bold;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid rgba(115, 54, 87, 0.3);
          padding-bottom: 0.5rem;
          font-family: 'Noto Serif SC', serif;
        }
        .markdown-content h3 {
          color: #d4a84b;
          font-size: 1.35rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-family: 'Noto Serif SC', serif;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.8;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
        }
        .markdown-content code {
          background: rgba(115, 54, 87, 0.2);
          color: #e8a917;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .markdown-content pre {
          background: #0a0a0a;
          border: 1px solid rgba(115, 54, 87, 0.3);
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-content pre code {
          background: transparent;
          padding: 0;
          color: #d4d4d4;
        }
        .markdown-content blockquote {
          border-left: 4px solid #e8a917;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #9ca3af;
          font-style: italic;
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .markdown-content th, .markdown-content td {
          border: 1px solid rgba(115, 54, 87, 0.3);
          padding: 0.75rem;
          text-align: left;
        }
        .markdown-content th {
          background: rgba(115, 54, 87, 0.2);
          color: #e8a917;
        }
        .markdown-content a {
          color: #e8a917;
          text-decoration: underline;
        }
        .markdown-content a:hover {
          color: #733657;
        }
        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(115, 54, 87, 0.3);
          margin: 2rem 0;
        }
        .markdown-content img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
