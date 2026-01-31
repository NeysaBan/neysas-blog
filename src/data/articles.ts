// 文章类型接口
export interface Article {
  id: string
  slug?: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  tags: string[]
  views: number
  category: string
  contentHtml?: string
}

// 硬编码的文章数据（作为备用）
export const hardcodedArticles: Article[] = [
  {
    id: '1',
    title: '深入理解分布式系统的一致性算法',
    excerpt: '在分布式系统中，一致性是一个核心问题。本文将深入探讨Raft、PBFT等经典一致性算法的原理与实现。',
    content: `# 深入理解分布式系统的一致性算法

在现代分布式系统中，一致性问题一直是工程师们需要面对的核心挑战。

## Raft算法的魅力

Raft算法是近年来最受欢迎的一致性算法之一，它的设计理念是"可理解性"。

## 总结

分布式系统的一致性算法是现代软件架构的基石。`,
    author: '茉莉公主',
    date: '2024-01-15',
    readTime: '12分钟',
    tags: ['分布式系统', '一致性算法', 'Raft', 'PBFT', '后端架构'],
    views: 1234,
    category: '后端架构设计'
  },
  {
    id: '2',
    title: '红黑树的神秘之美：平衡二叉树的艺术',
    excerpt: '红黑树作为一种自平衡二叉搜索树，在各种数据结构库中都有广泛应用。让我们一起探索它的神秘之美。',
    content: `# 红黑树的神秘之美：平衡二叉树的艺术

红黑树，这个名字听起来就充满了神秘色彩。它是一种自平衡的二叉搜索树。

## 红黑树的五大法则

1. 每个节点要么是红色，要么是黑色
2. 根节点必须是黑色
3. 所有叶子节点都是黑色
4. 红色节点的子节点必须是黑色
5. 从任一节点到其每个叶子的所有路径都包含相同数目的黑色节点`,
    author: '茉莉公主',
    date: '2024-01-10',
    readTime: '15分钟',
    tags: ['数据结构', '红黑树', '算法', '平衡树'],
    views: 987,
    category: '算法与数据结构'
  },
  {
    id: '3',
    title: '开源项目之路：从想法到社区的魔法之旅',
    excerpt: '分享我创建和维护开源项目的心得体会，以及如何建立一个活跃的开源社区。',
    content: `# 开源项目之路：从想法到社区的魔法之旅

开源项目就像是现代编程世界中的魔法咒语，它能够将一个人的想法传播到全世界。

## 第一步：点燃创意的火花

每个伟大的开源项目都始于一个简单的想法。`,
    author: '茉莉公主',
    date: '2024-01-05',
    readTime: '18分钟',
    tags: ['开源项目', 'GitHub', 'Node.js', '社区建设'],
    views: 756,
    category: '开源项目分享'
  }
]

// 默认分类列表
export const defaultCategories = [
  '全部',
  '后端架构设计',
  '算法与数据结构',
  '开源项目分享',
  '技术学习笔记',
  '编程心得感悟'
]

// 导出 categories（用于兼容现有代码）
export const categories = defaultCategories

// 导出 articles（用于兼容现有代码，使用硬编码数据）
export const articles = hardcodedArticles

// 兼容函数
export function getArticleById(id: string): Article | undefined {
  return hardcodedArticles.find(article => article.id === id)
}

export function getArticlesByCategory(category: string): Article[] {
  if (category === '全部') {
    return hardcodedArticles
  }
  return hardcodedArticles.filter(article => article.category === category)
}

export function searchArticles(query: string): Article[] {
  const lowercaseQuery = query.toLowerCase()
  return hardcodedArticles.filter(article => 
    article.title.toLowerCase().includes(lowercaseQuery) ||
    article.excerpt.toLowerCase().includes(lowercaseQuery) ||
    article.content.toLowerCase().includes(lowercaseQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}
