'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, FolderOpen, RefreshCw, Eye, Calendar, Tag, Plus } from 'lucide-react'

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
}

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const fetchPosts = async (category?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== '全部') {
        params.set('category', category)
      }
      
      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPosts(data.posts)
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    fetchPosts(category)
  }

  const handleRefresh = () => {
    fetchPosts(selectedCategory)
  }

  return (
    <div className="min-h-screen bg-[#000101] text-white">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#733657]/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-[#733657] hover:text-[#e8a917] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                返回首页
              </Link>
              <h1 
                className="text-2xl text-[#e8a917]"
                style={{ fontFamily: "'Lavishly Yours', cursive" }}
              >
                文章管理
              </h1>
            </div>
            
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#733657]/20 hover:bg-[#733657]/40 border border-[#733657]/30 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-[#733657]/20 p-6 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#e8a917]/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#e8a917]" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">文章总数</p>
                <p className="text-2xl font-bold text-white">{posts.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0a0a0a] border border-[#733657]/20 p-6 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#733657]/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-[#733657]" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">分类数量</p>
                <p className="text-2xl font-bold text-white">{categories.length - 1}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a0a0a] border border-[#733657]/20 p-6 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">总阅读量</p>
                <p className="text-2xl font-bold text-white">
                  {posts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 text-sm rounded transition-all ${
                selectedCategory === category
                  ? 'bg-[#e8a917] text-[#000101]'
                  : 'bg-[#0a0a0a] border border-[#733657]/30 text-gray-400 hover:border-[#e8a917] hover:text-[#e8a917]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 使用说明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-[#733657]/10 to-[#e8a917]/10 border border-[#733657]/20 rounded-lg p-6 mb-8"
        >
          <h3 className="text-[#e8a917] font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            如何发布新文章
          </h3>
          <div className="text-gray-400 text-sm space-y-2">
            <p>1. 在 <code className="bg-[#000101] px-2 py-1 rounded text-[#e8a917]">content/posts/</code> 目录下创建 <code className="bg-[#000101] px-2 py-1 rounded text-[#e8a917]">.md</code> 文件</p>
            <p>2. 在文件顶部添加 Front Matter（包含标题、日期、分类等元数据）</p>
            <p>3. 使用 Markdown 语法编写文章内容</p>
            <p>4. 保存文件后点击"刷新"按钮即可看到新文章</p>
          </div>
          <div className="mt-4 p-4 bg-[#000101] rounded text-xs font-mono text-gray-400">
            <pre>{`---
title: "文章标题"
date: "2025-01-31"
author: "作者名"
category: "技术学习笔记"
tags:
  - 标签1
  - 标签2
excerpt: "文章摘要"
readTime: "5分钟"
---

# 正文内容

使用 Markdown 语法编写...`}</pre>
          </div>
        </motion.div>

        {/* 文章列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#e8a917] animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">暂无文章</p>
            <p className="text-gray-600 text-sm mt-2">
              在 content/posts/ 目录下创建 .md 文件开始写作
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0a0a0a] border border-[#733657]/20 hover:border-[#e8a917]/40 rounded-lg p-6 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-[#733657]/20 text-[#e8a917] text-xs rounded">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-lg text-white mb-2 hover:text-[#e8a917] transition-colors">
                      <Link href={`/posts/${post.slug || post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-gray-600" />
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-[#733657] hover:text-[#e8a917] transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Eye className="w-4 h-4" />
                      {post.views}
                    </div>
                    <p className="text-gray-600 text-xs mt-1">{post.author}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
