'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Menu, X, Star, Moon, Sun } from 'lucide-react'

interface HeaderProps {
  onSearch?: (query: string) => void
  isDark?: boolean
  onThemeToggle?: () => void
}

export function Header({ onSearch, isDark = true, onThemeToggle }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery)
    }
  }

  const menuItems = [
    { name: '首页', href: '/', icon: '🏛️' },
    { name: '技术文章', href: '/posts', icon: '📜' },
    { name: '项目展示', href: '/projects', icon: '⚡' },
    { name: '关于我', href: '/about', icon: '🧙‍♀️' },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative z-40 bg-gradient-to-r from-night-900/90 to-desert-900/90 backdrop-blur-md border-b border-jasmine-400/30"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-br from-jasmine-400 to-jasmine-600 rounded-full flex items-center justify-center"
              >
                <Star className="w-6 h-6 text-night-900" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-jasmine-300 opacity-30"
              />
            </div>
            <div>
              <h1 className="text-xl font-mystical font-bold text-jasmine-300">
                Neysa
              </h1>
              <p className="text-xs text-gray-400">A whole new world</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-2 text-gray-300 hover:text-jasmine-300 transition-colors duration-300 font-medium"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </motion.a>
            ))}
          </nav>

          {/* Search & Theme Toggle */}
          <div className="flex items-center space-x-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索魔法知识..."
                  className="w-48 px-4 py-2 pl-10 bg-night-800/50 border border-jasmine-400/30 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-jasmine-400 focus:border-transparent transition-all duration-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onThemeToggle}
              className="p-2 rounded-full bg-night-800/50 border border-jasmine-400/30 text-jasmine-300 hover:bg-jasmine-400/20 transition-all duration-300"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full bg-night-800/50 border border-jasmine-400/30 text-jasmine-300"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="sm:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索魔法知识..."
                  className="w-full px-4 py-2 pl-10 bg-night-800/50 border border-jasmine-400/30 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-jasmine-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>

            {/* Mobile Navigation */}
            {menuItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 text-gray-300 hover:text-jasmine-300 transition-colors duration-300 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.header>
  )
}