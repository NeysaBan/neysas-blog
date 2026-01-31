#!/bin/bash

echo "🪄 欢迎来到茉莉公主的神秘代码殿堂！"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo "✅ 依赖安装完成！"
    echo ""
fi

echo "🚀 启动开发服务器..."
echo "🌟 请在浏览器中访问: http://localhost:3000"
echo ""
echo "✨ 功能特色:"
echo "   🏛️ 古老卷轴式文章展示"
echo "   🧞‍♀️ 神灯许愿搜索功能"
echo "   🌟 魔法粒子背景效果"
echo "   📜 多语言代码高亮"
echo ""

npm run dev