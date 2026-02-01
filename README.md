# 🪄 茉莉公主的神秘代码殿堂

一个充满魔法与神秘感的程序员博客网站，采用茉莉公主主题设计，展示技术文章、算法探索和开源项目分享。

## ✨ 特色功能

- 🏛️ **古老卷轴式文章展示** - 仿古卷轴的文章阅读体验
- 🧞‍♀️ **神灯许愿搜索** - 独特的搜索交互方式
- 🌟 **魔法粒子效果** - 动态背景粒子动画
- 🎭 **沙漠夜空主题** - 深蓝金色的神秘配色
- 📜 **代码高亮显示** - 支持多种编程语言
- 🏷️ **智能分类标签** - 文章分类和标签系统
- 🔍 **全文搜索功能** - 支持标题、内容、标签搜索
- 📱 **响应式设计** - 完美适配各种设备

## 🛠️ 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS + 自定义CSS
- **动画**: Framer Motion
- **代码高亮**: Prism.js
- **图标**: Lucide React

## 🚀 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 项目结构

\`\`\`
jasmine-blog/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React组件
│   │   ├── Header.tsx      # 头部导航
│   │   ├── MagicLamp.tsx   # 神灯搜索组件
│   │   ├── MagicParticles.tsx # 魔法粒子效果
│   │   ├── ScrollArticle.tsx  # 卷轴文章组件
│   │   └── CodeHighlight.tsx  # 代码高亮组件
│   ├── data/               # 数据文件
│   │   └── articles.ts     # 文章数据
│   └── styles/             # 样式文件
│       └── globals.css     # 全局样式
├── public/                 # 静态资源
├── tailwind.config.js      # Tailwind配置
├── next.config.js          # Next.js配置
└── package.json           # 项目配置
\`\`\`

## 🎨 设计特色

### 色彩方案
- **主色调**: 茉莉花金色 (#fde047)
- **辅助色**: 沙漠紫色 (#d946ef)
- **背景色**: 夜空深蓝 (#0f172a)

### 动画效果
- 浮动动画 (float)
- 发光效果 (glow)
- 闪烁动画 (sparkle)
- 滚动显示 (scroll-reveal)

### 交互设计
- 神灯许愿式搜索
- 悬停缩放效果
- 平滑过渡动画
- 响应式布局

## 📝 内容管理

### 添加新文章

在 \`src/data/articles.ts\` 中添加新的文章对象：

\`\`\`typescript
{
  id: 'unique-id',
  title: '文章标题',
  excerpt: '文章摘要',
  content: '文章内容（支持Markdown）',
  author: '作者',
  date: '2024-01-01',
  readTime: '10分钟',
  tags: ['标签1', '标签2'],
  views: 0,
  category: '分类名称'
}
\`\`\`

### 支持的代码语言

- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- SQL
- Bash
- JSON

## 🌟 功能演示

1. **首页展示** - 展示所有文章的预览
2. **分类筛选** - 按技术分类浏览文章
3. **搜索功能** - 通过神灯许愿或顶部搜索框
4. **文章阅读** - 古老卷轴式的阅读体验
5. **代码高亮** - 美观的代码展示效果

## 🔧 自定义配置

### 修改主题色彩

在 \`tailwind.config.js\` 中修改颜色配置：

\`\`\`javascript
colors: {
  'jasmine': {
    // 自定义茉莉花色彩
  },
  'desert': {
    // 自定义沙漠色彩
  },
  'night': {
    // 自定义夜空色彩
  }
}
\`\`\`

### 添加新的动画

在 \`src/styles/globals.css\` 中添加CSS动画：

\`\`\`css
@keyframes your-animation {
  /* 动画关键帧 */
}
\`\`\`

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

*在这个充满魔法的编程世界里，让我们一起探索技术的奥秘！* ✨