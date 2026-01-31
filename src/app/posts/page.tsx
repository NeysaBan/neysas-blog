'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MagicLamp } from '@/components/MagicLamp'
import { ArrowRight, Calendar, Clock, Search } from 'lucide-react'

// 文章类型接口
interface Article {
  id: string
  slug?: string
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  tags: string[]
  views: number
  category: string
}

export default function PostsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>(['全部'])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 获取文章数据
  const fetchArticles = useCallback(async (category?: string, search?: string) => {
    try {
      const params = new URLSearchParams()
      if (category && category !== '全部') {
        params.set('category', category)
      }
      if (search) {
        params.set('search', search)
      }
      
      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setFilteredArticles(data.posts)
        if (!search && !category) {
          setArticles(data.posts)
          setCategories(data.categories)
        } else if (!search) {
          setCategories(data.categories)
        }
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      fetchArticles(undefined, query)
    } else {
      fetchArticles(selectedCategory)
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSearchQuery('')
    fetchArticles(category)
  }

  const handleReset = () => {
    setSearchQuery('')
    setSelectedCategory('全部')
    fetchArticles()
  }

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
                  className={`transition-colors duration-300 text-sm tracking-wider ${
                    item === '文章' ? 'text-[#e8a917]' : 'text-[#733657] hover:text-[#e8a917]'
                  }`}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Menu Button */}
            <button className="w-12 h-12 rounded-full bg-[#733657] flex items-center justify-center">
              <div className="space-y-1.5">
                <div className="w-5 h-0.5 bg-[#000101]"></div>
                <div className="w-5 h-0.5 bg-[#000101]"></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-8">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-[#733657] text-4xl md:text-5xl font-bold mb-6">
              A whole new world of knowledge
            </h1>
            <p className="text-gray-400 max-w-2xl">
              A collection of insightful articles on various topics
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
          >
            {/* Categories */}
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-2 text-sm transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-[#e8a917] text-[#000101] font-semibold'
                      : 'border border-[#733657]/30 text-[#733657] hover:border-[#e8a917] hover:text-[#e8a917]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索文章..."
                className="w-64 px-4 py-2 pl-10 bg-transparent border border-[#733657]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a917] transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="w-8 h-8 border-2 border-[#e8a917] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <>
              {/* Articles Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article, index) => (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Link href={`/posts/${article.slug || article.id}`}>
                      {/* Card */}
                      <div className="border border-[#733657]/20 p-8 h-full hover:border-[#e8a917] transition-colors duration-300">
                        {/* Category */}
                        <p className="text-[#e8a917] italic text-sm mb-4">
                          {article.category}
                        </p>

                        {/* Title */}
                        <h2 
                          className="text-[#733657] text-xl font-bold mb-4 group-hover:text-[#e8a917] transition-colors line-clamp-2"
                          style={{ fontFamily: "'Noto Serif SC', serif" }}
                        >
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                          {article.excerpt}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-gray-600 text-xs mb-6">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{article.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{article.readTime}</span>
                          </div>
                        </div>

                        {/* Read More */}
                        <div className="flex items-center text-[#e8a917] text-sm group-hover:text-[#733657] transition-colors">
                          阅读全文
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Empty State */}
              {filteredArticles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <p className="text-[#733657] text-xl mb-4">未找到相关文章</p>
                  <button
                    onClick={handleReset}
                    className="text-[#e8a917] hover:underline"
                  >
                    查看所有文章
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
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
      <MagicLamp onWish={handleSearch} />
    </div>
  )
}
