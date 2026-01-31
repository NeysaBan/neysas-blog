'use client'

import { motion } from 'framer-motion'

interface JasmineSilhouetteProps {
  className?: string
  // 允许自定义颜色以适配主题
  primaryColor?: string      // 主剪影颜色
  accentColor?: string       // 点缀色（发带、耳环）
  highlightColor?: string    // 高亮色（嘴唇、耳环装饰）
}

export const JasmineSilhouette = ({ 
  className = '',
  primaryColor = '#1a1f2e',      // 深蓝黑色剪影
  accentColor = '#e8a917',       // 金黄色点缀（与主题色一致）
  highlightColor = '#733657'     // 深紫红色高亮（与主题色一致）
}: JasmineSilhouetteProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <svg
        viewBox="0 0 240 360"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(232,169,23,0.2))' }}
      >
        {/* ===== 极简茉莉公主剪影 - 参考图片风格 ===== */}
        
        {/* 头发主体 - 后部蓬松造型 */}
        <motion.path
          d="M160 45
             C195 45, 220 75, 220 115
             Q222 155, 210 190
             Q200 220, 175 240
             L165 250
             Q150 255, 140 250
             L130 240
             Q110 225, 100 195
             Q88 160, 90 115
             C92 75, 115 45, 160 45"
          fill={primaryColor}
        />
        
        {/* 马尾辫 - 粗大的辫子向下延伸 */}
        <motion.path
          d="M130 235
             Q115 250, 95 280
             Q70 320, 55 355
             Q50 370, 60 375
             Q75 378, 90 365
             Q110 345, 125 310
             Q135 285, 145 260
             Q150 250, 145 245
             Q140 240, 130 235"
          fill={primaryColor}
          animate={{ 
            d: [
              "M130 235 Q115 250, 95 280 Q70 320, 55 355 Q50 370, 60 375 Q75 378, 90 365 Q110 345, 125 310 Q135 285, 145 260 Q150 250, 145 245 Q140 240, 130 235",
              "M130 235 Q113 252, 92 282 Q65 322, 50 358 Q45 373, 55 378 Q70 381, 87 368 Q107 348, 122 313 Q132 288, 143 262 Q148 252, 143 247 Q138 242, 130 235",
              "M130 235 Q115 250, 95 280 Q70 320, 55 355 Q50 370, 60 375 Q75 378, 90 365 Q110 345, 125 310 Q135 285, 145 260 Q150 250, 145 245 Q140 240, 130 235"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* 辫子尾部卷曲 */}
        <motion.path
          d="M60 375
             Q45 380, 35 370
             Q25 355, 35 345
             Q48 338, 55 350
             Q58 362, 60 375"
          fill={primaryColor}
          animate={{ 
            d: [
              "M60 375 Q45 380, 35 370 Q25 355, 35 345 Q48 338, 55 350 Q58 362, 60 375",
              "M55 378 Q40 383, 30 373 Q20 358, 30 348 Q43 341, 50 353 Q53 365, 55 378",
              "M60 375 Q45 380, 35 370 Q25 355, 35 345 Q48 338, 55 350 Q58 362, 60 375"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* 辫子中间的发带装饰 - 使用点缀色 */}
        <motion.ellipse
          cx="120"
          cy="270"
          rx="18"
          ry="8"
          fill={accentColor}
          style={{ filter: 'drop-shadow(0 0 6px rgba(232,169,23,0.5))' }}
        />
        
        {/* 头顶发带 - 使用点缀色 */}
        <motion.path
          d="M115 58
             Q140 50, 175 58
             Q185 62, 182 70
             Q178 78, 165 75
             Q140 68, 120 75
             Q108 78, 105 70
             Q102 62, 115 58"
          fill={accentColor}
          style={{ filter: 'drop-shadow(0 0 6px rgba(232,169,23,0.5))' }}
        />
        
        {/* 发带上的宝石装饰 */}
        <motion.circle 
          cx="145" 
          cy="55" 
          r="12" 
          fill={accentColor}
          style={{ filter: 'drop-shadow(0 0 8px rgba(232,169,23,0.6))' }}
        />
        <motion.circle 
          cx="145" 
          cy="55" 
          r="7" 
          fill="#fff8dc"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* 刘海 - 覆盖额头 */}
        <motion.path
          d="M100 100
             Q95 75, 115 60
             Q140 50, 170 55
             Q195 62, 205 85
             Q210 105, 200 120
             Q185 115, 170 118
             Q150 122, 130 118
             Q110 115, 100 100"
          fill={primaryColor}
        />
        
        {/* 面部轮廓 - 白色/透明（使用负空间） */}
        <motion.path
          d="M130 95
             C165 95, 190 120, 192 155
             Q193 185, 180 210
             Q165 235, 150 240
             Q135 235, 120 215
             Q105 190, 105 160
             C105 125, 115 95, 130 95"
          fill="white"
        />
        
        {/* 侧边头发遮挡 - 左侧 */}
        <motion.path
          d="M100 130
             Q90 115, 95 95
             Q100 80, 115 85
             Q125 100, 115 125
             Q108 145, 100 130"
          fill={primaryColor}
        />
        
        {/* 侧边头发遮挡 - 右侧 */}
        <motion.path
          d="M195 115
             Q210 100, 212 85
             Q210 70, 195 75
             Q180 82, 185 105
             Q190 125, 195 115"
          fill={primaryColor}
        />
        
        {/* 颈部头发/阴影 */}
        <motion.path
          d="M125 225
             Q115 235, 120 250
             Q128 260, 140 255
             Q150 248, 148 235
             Q145 225, 135 220
             Q128 218, 125 225"
          fill={primaryColor}
        />
        
        {/* ===== 面部特征（极简） ===== */}
        
        {/* 嘴唇 - 使用高亮色 */}
        <motion.path
          d="M140 195
             Q148 190, 155 193
             Q162 190, 168 195
             Q160 200, 155 198
             Q150 200, 140 195"
          fill={highlightColor}
        />
        <motion.path
          d="M142 195
             Q155 205, 166 195
             Q158 202, 155 203
             Q152 202, 142 195"
          fill={highlightColor}
          opacity="0.8"
        />
        
        {/* ===== 耳环装饰 - 使用点缀色 ===== */}
        {/* 左耳环 */}
        <motion.g
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: '108px 175px' }}
        >
          <circle cx="108" cy="178" r="5" fill={accentColor} />
          <motion.ellipse 
            cx="108" 
            cy="192" 
            rx="4" 
            ry="8" 
            fill={accentColor}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.g>
        
        {/* 右耳环 */}
        <motion.g
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          style={{ transformOrigin: '188px 165px' }}
        >
          <circle cx="188" cy="168" r="5" fill={accentColor} />
          <motion.ellipse 
            cx="188" 
            cy="182" 
            rx="4" 
            ry="8" 
            fill={accentColor}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </motion.g>
        
      </svg>
    </motion.div>
  )
}
