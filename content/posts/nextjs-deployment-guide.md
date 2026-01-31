---
title: "Next.js 部署指南：从开发到生产"
date: "2025-01-25"
author: "茉莉公主"
category: "后端架构设计"
tags:
  - Next.js
  - 部署
  - DevOps
  - Vercel
excerpt: "详细介绍 Next.js 应用的各种部署方式，包括 Vercel、Docker 和自托管方案。"
readTime: "15分钟"
---

# Next.js 部署指南：从开发到生产

Next.js 是一个强大的 React 框架，它提供了多种部署选项。本文将详细介绍各种部署方式。

## 部署前的准备

在部署之前，确保你的项目已经完成以下检查：

```bash
# 1. 运行构建检查
npm run build

# 2. 本地预览生产版本
npm run start

# 3. 运行类型检查
npx tsc --noEmit

# 4. 运行 lint 检查
npm run lint
```

## 方式一：Vercel 部署（推荐）

Vercel 是 Next.js 的官方部署平台，提供最佳的性能和开发体验。

### 步骤

1. 访问 [vercel.com](https://vercel.com)
2. 连接 GitHub 仓库
3. 选择项目并点击部署
4. 等待构建完成

```bash
# 或使用 Vercel CLI
npm i -g vercel
vercel
```

## 方式二：Docker 部署

使用 Docker 可以在任何支持容器的平台上部署。

### Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 构建和运行

```bash
# 构建镜像
docker build -t my-nextjs-app .

# 运行容器
docker run -p 3000:3000 my-nextjs-app
```

## 方式三：静态导出

如果你的应用不需要服务端功能，可以导出为静态文件：

```javascript
// next.config.js
module.exports = {
  output: 'export',
}
```

```bash
# 构建静态文件
npm run build

# 文件将输出到 out 目录
```

## 环境变量配置

```bash
# .env.local (本地开发)
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=dev_key_123

# .env.production (生产环境)
DATABASE_URL=postgresql://production:5432/mydb
API_KEY=prod_key_456
```

## 性能优化检查清单

| 检查项 | 状态 |
|-------|------|
| 图片优化（next/image） | ✅ |
| 代码分割 | ✅ |
| 缓存策略 | ✅ |
| CDN 配置 | ✅ |
| 压缩启用 | ✅ |

## 监控和日志

部署后别忘了设置监控：

```typescript
// 错误追踪示例
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## 总结

选择合适的部署方式取决于你的需求：

- **Vercel**：最简单，适合大多数项目
- **Docker**：灵活，适合自托管
- **静态导出**：适合纯静态站点

> 🚀 **提示**：始终在生产环境前进行充分的测试！
