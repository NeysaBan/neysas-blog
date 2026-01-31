'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MagicLampProps {
  onWish?: (wish: string) => void
}

export function MagicLamp({ onWish }: MagicLampProps) {
  const [isRubbing, setIsRubbing] = useState(false)
  const [showWishForm, setShowWishForm] = useState(false)
  const [wish, setWish] = useState('')

  const handleRub = () => {
    setIsRubbing(true)
    setTimeout(() => {
      setIsRubbing(false)
      setShowWishForm(true)
    }, 2000)
  }

  const handleWish = () => {
    if (wish.trim()) {
      onWish?.(wish)
      setWish('')
      setShowWishForm(false)
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05, rotate: 18 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRub}
        style={{ 
          filter: 'drop-shadow(0 8px 20px rgba(232, 169, 23, 0.4))',
          transform: 'rotate(15deg)',
          transformOrigin: 'center bottom'
        }}
        initial={{ rotate: 15 }}
        animate={{ rotate: 15 }}
      >
        {/* 阿拉丁神灯 SVG - 电影版经典造型 - 倾斜增加动态感 */}
        <motion.svg
          viewBox="0 0 180 100"
          className="w-36 h-20 md:w-44 md:h-24"
          animate={isRubbing ? { 
            rotate: [0, -8, 8, -8, 8, -5, 5, 0],
            scale: [1, 1.05, 1, 1.05, 1, 1.02, 1]
          } : {}}
          transition={{ duration: 0.6, repeat: isRubbing ? 3 : 0 }}
        >
          <defs>
            {/* 主体金色渐变 - 做旧黄铜质感 */}
            <linearGradient id="lampBodyGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B6914" />
              <stop offset="15%" stopColor="#B8860B" />
              <stop offset="30%" stopColor="#DAA520" />
              <stop offset="45%" stopColor="#CD853F" />
              <stop offset="60%" stopColor="#B8860B" />
              <stop offset="75%" stopColor="#8B6914" />
              <stop offset="100%" stopColor="#654321" />
            </linearGradient>
            
            {/* 高光渐变 */}
            <linearGradient id="lampHighlightGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#DAA520" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B6914" stopOpacity="0" />
            </linearGradient>
            
            {/* 壶嘴渐变 */}
            <linearGradient id="spoutGold" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#B8860B" />
              <stop offset="30%" stopColor="#DAA520" />
              <stop offset="50%" stopColor="#CD853F" />
              <stop offset="70%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            
            {/* 把手渐变 */}
            <linearGradient id="handleGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#654321" />
              <stop offset="30%" stopColor="#8B6914" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="70%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#654321" />
            </linearGradient>
            
            {/* 底座渐变 */}
            <linearGradient id="baseGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B8860B" />
              <stop offset="50%" stopColor="#8B6914" />
              <stop offset="100%" stopColor="#654321" />
            </linearGradient>
            
            {/* 紫色光晕 - 魔法效果 */}
            <radialGradient id="magicGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9370DB" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#6B5CE7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4B0082" stopOpacity="0" />
            </radialGradient>
            
            {/* 金属纹理图案 */}
            <pattern id="brassTexture" patternUnits="userSpaceOnUse" width="6" height="6">
              <rect width="6" height="6" fill="transparent"/>
              <circle cx="1" cy="1" r="0.5" fill="#654321" opacity="0.15"/>
              <circle cx="4" cy="4" r="0.4" fill="#FFD700" opacity="0.1"/>
              <circle cx="2" cy="5" r="0.3" fill="#654321" opacity="0.1"/>
            </pattern>
            
            {/* 发光滤镜 */}
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* 魔法光晕背景 */}
          <ellipse 
            cx="90" cy="65" rx="60" ry="30" 
            fill="url(#magicGlow)"
            opacity="0.4"
          />
          
          {/* 底座支架 */}
          <ellipse 
            cx="90" cy="88" rx="22" ry="8" 
            fill="url(#baseGold)"
          />
          <ellipse 
            cx="90" cy="86" rx="18" ry="5" 
            fill="#DAA520"
            opacity="0.3"
          />
          
          {/* 底座柱子 */}
          <path
            d="M 78 88 Q 80 82, 82 78 L 98 78 Q 100 82, 102 88 Z"
            fill="url(#lampBodyGold)"
          />
          <path
            d="M 80 86 Q 82 82, 84 80 L 88 80 Q 86 82, 85 86 Z"
            fill="#FFD700"
            opacity="0.3"
          />
          
          {/* 神灯主体 - 扁平椭圆形 */}
          <ellipse 
            cx="90" cy="60" rx="45" ry="22" 
            fill="url(#lampBodyGold)"
          />
          {/* 主体纹理 */}
          <ellipse 
            cx="90" cy="60" rx="45" ry="22" 
            fill="url(#brassTexture)"
          />
          
          {/* 主体顶部高光 */}
          <ellipse 
            cx="80" cy="50" rx="25" ry="10" 
            fill="url(#lampHighlightGold)"
            opacity="0.6"
          />
          
          {/* 主体底部阴影 */}
          <ellipse 
            cx="90" cy="72" rx="35" ry="8" 
            fill="#654321"
            opacity="0.4"
          />
          
          {/* 主体装饰纹 - 雕花边缘 */}
          <ellipse 
            cx="90" cy="60" rx="42" ry="18" 
            fill="none"
            stroke="#8B6914"
            strokeWidth="1"
            opacity="0.5"
          />
          <ellipse 
            cx="90" cy="60" rx="38" ry="15" 
            fill="none"
            stroke="#FFD700"
            strokeWidth="0.5"
            opacity="0.3"
          />
          
          {/* 壶嘴 - 细长弯曲 */}
          <path
            d="M 45 55
               Q 35 52, 25 45
               Q 15 38, 8 28
               Q 5 22, 3 18
               Q 2 15, 5 14
               Q 8 14, 10 18
               Q 15 25, 22 32
               Q 32 42, 45 50
               Z"
            fill="url(#spoutGold)"
          />
          {/* 壶嘴高光 */}
          <path
            d="M 42 52
               Q 34 50, 26 44
               Q 18 38, 12 30
               Q 8 24, 6 20
               Q 10 22, 15 28
               Q 22 36, 30 44
               Q 36 48, 42 52
               Z"
            fill="#FFD700"
            opacity="0.35"
          />
          {/* 壶嘴边缘装饰 */}
          <path
            d="M 44 48 Q 36 44, 28 38 Q 20 32, 14 24"
            fill="none"
            stroke="#654321"
            strokeWidth="0.8"
            opacity="0.4"
          />
          {/* 壶嘴开口 */}
          <ellipse 
            cx="4" cy="16" rx="3" ry="2" 
            fill="#2d1810"
            transform="rotate(-50 4 16)"
          />
          {/* 壶嘴开口内部 */}
          <ellipse 
            cx="5" cy="16.5" rx="2" ry="1.2" 
            fill="#1a0f0a"
            transform="rotate(-50 5 16.5)"
          />
          
          {/* 把手 - 优雅的 C 形 */}
          <path
            d="M 135 50
               Q 150 45, 160 50
               Q 172 58, 170 72
               Q 168 82, 155 85
               Q 145 86, 135 78"
            fill="none"
            stroke="url(#handleGold)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* 把手高光 */}
          <path
            d="M 138 52
               Q 150 48, 158 52
               Q 167 58, 166 68"
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* 把手阴影 */}
          <path
            d="M 140 55
               Q 152 52, 160 56
               Q 168 62, 167 72
               Q 166 80, 156 82"
            fill="none"
            stroke="#654321"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* 灯盖/顶部圆顶 */}
          <ellipse 
            cx="90" cy="40" rx="18" ry="8" 
            fill="url(#lampBodyGold)"
          />
          <ellipse 
            cx="85" cy="38" rx="10" ry="4" 
            fill="url(#lampHighlightGold)"
            opacity="0.5"
          />
          
          {/* 顶部小尖 */}
          <path
            d="M 90 28 Q 86 34, 90 38 Q 94 34, 90 28 Z"
            fill="url(#lampBodyGold)"
          />
          <ellipse cx="88" cy="32" rx="2" ry="1.5" fill="#FFD700" opacity="0.5"/>
          
          {/* 顶部装饰球 */}
          <circle cx="90" cy="26" r="3" fill="url(#lampBodyGold)"/>
          <circle cx="89" cy="25" r="1" fill="#FFD700" opacity="0.6"/>
          
          {/* 做旧斑点效果 */}
          <circle cx="70" cy="55" r="1.5" fill="#654321" opacity="0.2"/>
          <circle cx="105" cy="62" r="1.2" fill="#654321" opacity="0.15"/>
          <circle cx="85" cy="68" r="1" fill="#654321" opacity="0.18"/>
          <circle cx="95" cy="52" r="0.8" fill="#FFD700" opacity="0.2"/>
          <circle cx="78" cy="48" r="0.6" fill="#FFD700" opacity="0.15"/>
          <circle cx="110" cy="55" r="1" fill="#654321" opacity="0.12"/>
          
          {/* 装饰图案 - 灯身中央 */}
          <path
            d="M 75 60 Q 90 55, 105 60"
            fill="none"
            stroke="#654321"
            strokeWidth="0.8"
            opacity="0.3"
          />
          <path
            d="M 78 65 Q 90 62, 102 65"
            fill="none"
            stroke="#654321"
            strokeWidth="0.6"
            opacity="0.25"
          />
        </motion.svg>

        {/* 发光效果 - 紫色魔法光芒 */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle at 30% 70%, rgba(147, 112, 219, 0.4) 0%, rgba(107, 92, 231, 0.2) 40%, transparent 70%)',
            filter: 'blur(10px)'
          }}
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.5, 0.8, 0.5] 
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* 金色光晕 */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle at 70% 40%, rgba(232, 169, 23, 0.3) 0%, transparent 60%)',
            filter: 'blur(8px)'
          }}
          animate={{ 
            scale: [1, 1.15, 1], 
            opacity: [0.4, 0.6, 0.4] 
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* 魔法烟雾 */}
        <AnimatePresence>
          {isRubbing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-20 left-0"
            >
              {/* 紫色魔法烟雾 - 从壶嘴飘出 */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${15 + i * 4}px`,
                    height: `${15 + i * 4}px`,
                    background: `radial-gradient(circle, ${
                      i % 3 === 0 ? '#9370DB' : i % 3 === 1 ? '#6B5CE7' : '#4ECDC4'
                    } 0%, transparent 70%)`,
                    left: `${-10 + i * 5}px`,
                  }}
                  animate={{
                    y: [-5, -100 - i * 15],
                    x: [0, -30 + (Math.random() - 0.3) * 80],
                    opacity: [0.9, 0],
                    scale: [0.4, 2.5 + i * 0.4],
                    rotate: [0, 200 + i * 40]
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.12,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
              ))}
              {/* 闪烁星星 */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute text-yellow-300"
                  style={{ 
                    left: `${-20 + i * 12}px`,
                    fontSize: `${8 + (i % 3) * 4}px`
                  }}
                  animate={{
                    y: [-10, -120],
                    x: [-20 + (Math.random() - 0.5) * 40, -40 + (Math.random() - 0.5) * 100],
                    opacity: [1, 0],
                    scale: [0.5, 1.5],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: 0.2 + i * 0.15,
                    repeat: Infinity
                  }}
                >
                  ✦
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 提示文字 */}
        <motion.div
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: [0, 1, 0], y: [5, 0, 5] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <span className="text-[#e8a917] text-xs" style={{ fontFamily: "'Amiri', serif" }}>
            ✨ Come whisper to me \n whatever you want...
          </span>
        </motion.div>
      </motion.div>

      {/* 许愿表单 */}
      <AnimatePresence>
        {showWishForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-28 right-0 w-80 p-6 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] border border-[#733657]/50 shadow-2xl rounded-lg"
            style={{ 
              boxShadow: '0 0 30px rgba(147, 112, 219, 0.3), 0 0 60px rgba(232, 169, 23, 0.15)'
            }}
          >
            {/* 装饰边角 */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#e8a917]/60"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#e8a917]/60"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#e8a917]/60"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#e8a917]/60"></div>
            
            <div className="text-center mb-4">
              <motion.h3 
                className="text-[#e8a917] text-lg mb-2"
                style={{ fontFamily: "'Lavishly Yours', cursive" }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ I'm the genie of the lamp ✨
              </motion.h3>
              <p 
                className="text-gray-400 text-sm"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                Say what you wish...
              </p>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder="..."
                className="w-full p-3 bg-[#000101]/50 border border-[#733657]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a917]/60 resize-none rounded transition-colors"
                style={{ fontFamily: "'Amiri', serif" }}
                rows={3}
              />
              
              <div className="flex gap-2">
                <motion.button
                  onClick={handleWish}
                  className="flex-1 bg-gradient-to-r from-[#e8a917] to-[#d49915] text-[#000101] font-semibold py-2.5 px-4 rounded hover:from-[#f0b520] hover:to-[#e8a917] transition-all duration-300"
                  style={{ fontFamily: "'Reem Kufi', sans-serif" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🔍 
                </motion.button>
                <motion.button
                  onClick={() => setShowWishForm(false)}
                  className="px-4 py-2.5 border border-[#733657]/50 text-[#733657] hover:bg-[#733657]/20 hover:text-[#e8a917] transition-colors rounded"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
