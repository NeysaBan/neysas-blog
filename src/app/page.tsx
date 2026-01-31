'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MagicLamp } from '@/components/MagicLamp'
import { ArrowRight, Calendar, Clock, Eye } from 'lucide-react'

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

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>(['全部'])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [isLoading, setIsLoading] = useState(true)
  const [showFooter, setShowFooter] = useState(false)

  // 滚动检测 - 只在页面滚动到底部时显示 Footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      
      // 判断是否滚动到底部（允许 50px 的误差）
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
      setShowFooter(isAtBottom)
    }

    window.addEventListener('scroll', handleScroll)
    // 初始检查
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        if (!search) {
          setArticles(data.posts)
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
    if (query.trim()) {
      fetchArticles(undefined, query)
    } else {
      fetchArticles(selectedCategory)
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    fetchArticles(category)
  }

  // 按日期排序文章
  const sortedArticles = [...filteredArticles].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-[#000101]">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000101]/90 backdrop-blur-sm border-b border-[#733657]/20">
        <div className="container mx-auto px-8 py-4">
          <nav className="flex items-center justify-center space-x-12">
            {['首页', '文章', '关于'].map((item) => (
              <Link
                key={item}
                href={item === '首页' ? '/' : item === '文章' ? '/posts' : '#'}
                className="text-[#e8a917] hover:text-[#733657] transition-colors duration-300 text-sm tracking-wider font-medium"
              >
                {item.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section - 网站名称 + 剪影图片 - 占满整个屏幕，完全居中 */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 xl:gap-20">
            {/* 左侧 - 网站名称 */}
            <motion.div 
              className="text-center lg:text-right flex-1 flex flex-col items-center lg:items-end"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 
                id="main-title"
                className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] 2xl:text-[14rem] leading-[0.85]"
                style={{ fontFamily: "'Lavishly Yours', cursive" }}
              >
                <span className="text-[#e8a917]">Neysa's</span>
                <br />
                <span className="text-[#733657]">Blog</span>
              </h1>
              
              {/* 副标题 */}
              <motion.p 
                className="mt-10 md:mt-14 text-gray-400 text-xl md:text-xl max-w-md text-center lg:text-right"
                style={{ fontFamily: "'Beth Ellen', cursive" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                A whole new world of programming ...
              </motion.p>
              
              {/* 装饰线 */}
              <motion.div 
                className="mt-4 md:mt-6 flex items-center justify-center lg:justify-end w-full max-w-sm"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 h-[2px] bg-gradient-to-r from-[#e8a917]/20 to-[#e8a917]"></div>
                  <div className="w-3 h-3 rotate-45 border-2 border-[#733657] flex-shrink-0"></div>
                  <div className="flex-1 h-[2px] bg-gradient-to-l from-[#e8a917]/20 to-[#e8a917]"></div>
                </div>
              </motion.div>
            </motion.div>

            {/* 右侧 - 剪影图片 */}
            <motion.div 
              className="flex-1 flex justify-center lg:justify-start"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                {/* 背景光晕 */}
                <motion.div 
                  className="absolute inset-0 blur-3xl bg-[#e8a917]/10 rounded-full scale-110"
                  animate={{ scale: [1.1, 1.2, 1.1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                {/* 剪影图片 - 响应式缩放 */}
                <Image
                  src="/jasmine.png"
                  alt="Princess"
                  width={579}
                  height={800}
                  className="relative z-10 w-auto h-[280px] sm:h-[320px] md:h-[400px] lg:h-[480px] xl:h-[560px] 2xl:h-[640px] object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 分隔装饰 */}
      <div className="container mx-auto px-8">
        <motion.div 
          className="flex items-center justify-center gap-6 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#733657]/50"></div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#e8a917] rotate-45"></div>
            <span className="text-[#733657] text-sm tracking-[0.3em]" style={{ fontFamily: "'Reem Kufi', sans-serif" }}>
              ARTICLES
            </span>
            <div className="w-2 h-2 bg-[#e8a917] rotate-45"></div>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#733657]/50"></div>
        </motion.div>
      </div>

      {/* 分类筛选 */}
      <div className="container mx-auto px-8 mb-12">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-5 py-2 text-sm tracking-wider transition-all duration-300 border ${
                selectedCategory === category
                  ? 'bg-[#e8a917] text-[#000101] border-[#e8a917]'
                  : 'bg-transparent text-[#733657] border-[#733657]/30 hover:border-[#e8a917] hover:text-[#e8a917]'
              }`}
              style={{ fontFamily: "'Reem Kufi', sans-serif" }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 纯文字卡片式文章列表 - 每行1篇，共3行 */}
      <section className="container mx-auto px-8 pb-16">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {isLoading ? (
            // 加载状态
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="w-8 h-8 border-2 border-[#e8a917] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : sortedArticles.slice(0, 3).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Link href={`/posts/${article.slug || article.id}`}>
                <motion.article 
                  className="group bg-[#0a0a0a]/80 border border-[#733657]/20 hover:border-[#e8a917]/40 transition-all duration-500 h-[220px] flex flex-col justify-between p-8 relative overflow-hidden"
                  whileHover={{ x: 8, borderColor: 'rgba(232, 169, 23, 0.5)' }}
                >
                  {/* 左侧装饰条 */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#e8a917] via-[#733657] to-[#e8a917] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* 背景序号 */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span 
                      className="text-8xl font-bold text-[#733657]/10 group-hover:text-[#e8a917]/15 transition-colors duration-500"
                      style={{ fontFamily: "'Lavishly Yours', cursive" }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* 顶部：分类 + 日期 + 阅读时间 */}
                  <div className="flex items-center gap-6 relative z-10">
                    <span 
                      className="px-4 py-1.5 bg-[#733657]/20 text-[#e8a917] text-xs tracking-wider border border-[#733657]/30"
                      style={{ fontFamily: "'Reem Kufi', sans-serif" }}
                    >
                      {article.category}
                    </span>
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {article.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                  
                  {/* 中间：标题 + 摘要 */}
                  <div className="flex-1 flex flex-col justify-center relative z-10 pr-20">
                    <h3 
                      className="text-xl md:text-2xl text-white group-hover:text-[#e8a917] transition-colors duration-300 mb-3 line-clamp-1"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-2"
                      style={{ fontFamily: "'Amiri', serif" }}
                    >
                      {article.excerpt}
                    </p>
                  </div>
                  
                  {/* 底部：标签 + 浏览量 + 阅读更多 */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-[#733657] text-xs border-b border-[#733657]/30 group-hover:text-[#e8a917] group-hover:border-[#e8a917]/30 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                        <Eye className="w-4 h-4" />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-2 text-[#e8a917] text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        阅读全文
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 无文章提示 */}
        {!isLoading && sortedArticles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">暂无相关文章</p>
          </div>
        )}
        
        {/* 查看更多文章按钮 - 始终显示 */}
        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link 
            href="/posts" 
            className="inline-flex items-center gap-3 px-8 py-3 border border-[#733657]/40 text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-all duration-300 text-sm tracking-wider"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            查看更多文章
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer - 滚动到底部时显示 */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-[#733657] py-4 z-40 transition-all duration-500 ease-out ${
          showFooter 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between">
            <p 
              className="text-[#e8a917] text-sm"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              Copyright © Neysa's Blog
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">G</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">T</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#000101] flex items-center justify-center text-[#e8a917] hover:bg-[#e8a917] hover:text-[#000101] transition-colors">
                <span className="text-xs">In</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Footer 占位，防止内容被遮挡 */}
      <div className="h-16"></div>

      {/* Magic Lamp */}
      <MagicLamp onWish={handleSearch} />
    </div>
  )
}
