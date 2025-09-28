#!/bin/bash

# 工厂可视化系统 - 部署脚本
# 用于构建和部署到GitHub Pages

echo "🚀 开始构建工厂可视化系统..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf dist

# 构建项目
echo "🔨 构建项目..."
NODE_ENV=production pnpm build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于: ./dist"
    echo ""
    echo "🌐 部署到GitHub Pages:"
    echo "1. 将dist目录的内容推送到gh-pages分支"
    echo "2. 或者在GitHub仓库设置中启用GitHub Pages"
    echo "3. 访问: https://你的用户名.github.io/factory-visualization/"
    echo ""
    echo "📋 本地预览:"
    echo "运行: pnpm preview"
else
    echo "❌ 构建失败！"
    exit 1
fi
