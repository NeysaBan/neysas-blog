// 内存存储浏览量（部署环境无法使用文件系统）
// 注意：服务器重启后数据会重置
// 生产环境建议使用数据库存储

const viewsCache: Record<string, number> = {}

/**
 * 获取文章的浏览量
 */
export function getPostViews(slug: string): number {
  return viewsCache[slug] || 0
}

/**
 * 增加文章的浏览量
 */
export function incrementPostViews(slug: string): number {
  viewsCache[slug] = (viewsCache[slug] || 0) + 1
  return viewsCache[slug]
}

/**
 * 获取所有文章的浏览量
 */
export function getAllViews(): Record<string, number> {
  return { ...viewsCache }
}
