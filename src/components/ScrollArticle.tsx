'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Tag, User, Eye } from 'lucide-react'
import { CodeHighlight } from './CodeHighlight'

interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  tags: string[]
  views: number
  category: string
}

interface ScrollArticleProps {
  article: Article
  isPreview?: boolean
}

export function ScrollArticle({ article, isPreview = false }: ScrollArticleProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.article
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="scroll-paper p-8 mb-8 relative overflow-hidden"
    >
      {/* 装饰性边框 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-jasmine-400 opacity-60" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-jasmine-400 opacity-60" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-jasmine-400 opacity-60" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-jasmine-400 opacity-60" />

      {/* 古老纹理背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fde047' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10">
        {/* 文章头部 */}
        <motion.header variants={itemVariants} className="mb-6">
          <motion.h1 
            className="text-3xl md:text-4xl font-chinese font-bold text-jasmine-300 mb-4 leading-tight"
            whileHover={{ scale: 1.02 }}
          >
            {article.title}
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-gray-300 text-lg leading-relaxed mb-6"
          >
            {article.excerpt}
          </motion.p>

          {/* 文章元信息 */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-jasmine-400" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-jasmine-400" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-jasmine-400" />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-jasmine-400" />
              <span>{article.views} 次阅读</span>
            </div>
          </motion.div>

          {/* 标签 */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-2 mt-4"
          >
            {article.tags.map((tag, index) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-jasmine-500/20 to-desert-500/20 border border-jasmine-400/30 rounded-full text-jasmine-300 text-xs font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.header>

        {/* 分隔线 */}
        <motion.div 
          variants={itemVariants}
          className="w-full h-px bg-gradient-to-r from-transparent via-jasmine-400 to-transparent mb-8"
        />

        {/* 文章内容 */}
        <motion.div 
          variants={itemVariants}
          className="prose prose-lg prose-invert max-w-none"
        >
          {isPreview ? (
            <div className="text-gray-300 leading-relaxed">
              {article.content.substring(0, 300)}...
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-2 text-jasmine-400 hover:text-jasmine-300 font-medium underline"
              >
                阅读全文
              </motion.button>
            </div>
          ) : (
            <div className="text-gray-300 leading-relaxed space-y-6">
              <CodeHighlight content={article.content} />
            </div>
          )}
        </motion.div>

        {/* 底部装饰 */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex justify-center"
        >
          <div className="flex items-center gap-2 text-jasmine-400 opacity-60">
            <div className="w-2 h-2 bg-jasmine-400 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-jasmine-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 bg-jasmine-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </motion.div>
      </div>
    </motion.article>
  )
}