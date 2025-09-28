# 🔧 GitHub Actions 故障排除

## 🐛 常见问题及解决方案

### 1. Node.js 设置错误

**错误信息**：

```
Error: Dependencies lock file is not found. Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock
```

**解决方案**：

- ✅ 已修复：使用 `cache: 'npm'` 而不是 `cache: 'pnpm'`
- ✅ 已修复：先安装pnpm，再使用pnpm安装依赖

### 2. pnpm 缓存问题

**错误信息**：

```
pnpm: command not found
```

**解决方案**：

```yaml
- name: Install pnpm
  run: npm install -g pnpm
```

### 3. 构建失败

**可能原因**：

- 依赖版本冲突
- 环境变量未设置
- 路径问题

**解决方案**：

```bash
# 本地测试构建
pnpm build

# 检查依赖
pnpm list

# 清理重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 4. GitHub Pages 404

**可能原因**：

- base路径配置错误
- 路由配置问题
- 静态资源路径错误

**解决方案**：

1. 检查 `vite.config.js` 中的base路径
2. 确保所有资源使用相对路径
3. 检查路由配置

### 5. 权限问题

**错误信息**：

```
Permission denied
```

**解决方案**：

1. 检查仓库设置中的Actions权限
2. 确保Pages权限已启用
3. 检查workflow文件中的permissions配置

## 🔍 调试步骤

### 1. 检查GitHub Actions日志

- 进入仓库 → Actions 标签
- 点击失败的workflow
- 查看详细的错误日志

### 2. 本地测试

```bash
# 测试构建
pnpm build

# 测试预览
pnpm preview

# 检查输出目录
ls -la dist/
```

### 3. 验证配置

```bash
# 检查package.json
cat package.json

# 检查vite配置
cat vite.config.js

# 检查pnpm锁文件
ls -la pnpm-lock.yaml
```

## 📋 完整的GitHub Actions配置

如果遇到问题，可以使用这个经过测试的配置：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install pnpm
      run: npm install -g pnpm
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm build
      env:
        NODE_ENV: production
        
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

## 🚀 快速修复

如果所有方法都失败，可以尝试：

1. **重新创建workflow文件**
2. **使用npm而不是pnpm**
3. **检查仓库权限设置**
4. **联系GitHub支持**

## 📞 获取帮助

如果问题仍然存在：

1. 查看GitHub Actions文档
2. 检查Vite部署指南
3. 在GitHub Issues中搜索类似问题
