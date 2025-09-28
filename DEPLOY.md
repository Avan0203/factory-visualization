# 🚀 部署到GitHub Pages

## 📋 部署方式

### 方式一：自动部署（推荐）

1. **启用GitHub Pages**：
   - 进入你的GitHub仓库
   - 点击 `Settings` → `Pages`
   - 在 `Source` 选择 `GitHub Actions`

2. **推送代码**：

   ```bash
   git add .
   git commit -m "feat: 添加GitHub Pages部署配置"
   git push origin main
   ```

3. **自动构建**：
   - GitHub Actions会自动构建项目
   - 构建完成后会自动部署到GitHub Pages
   - 访问地址：`https://你的用户名.github.io/factory-visualization/`

### 方式二：手动部署

1. **构建项目**：

   ```bash
   pnpm build:prod
   ```

2. **部署到gh-pages分支**：

   ```bash
   # 安装gh-pages工具
   npm install -g gh-pages
   
   # 部署到GitHub Pages
   gh-pages -d dist
   ```

3. **设置GitHub Pages**：
   - 进入仓库 `Settings` → `Pages`
   - 选择 `Deploy from a branch`
   - 选择 `gh-pages` 分支
   - 点击 `Save`

## 🔧 本地预览

```bash
# 开发模式
pnpm dev

# 构建并预览
pnpm build
pnpm preview

# 或使用部署脚本
pnpm deploy
```

## 📁 项目结构

```
factory-visualization/
├── .github/workflows/    # GitHub Actions配置
├── src/                  # 源代码
├── dist/                 # 构建输出（自动生成）
├── deploy.sh            # 部署脚本
└── vite.config.js       # Vite配置
```

## ⚙️ 配置说明

### Vite配置优化

- ✅ 自动设置base路径
- ✅ 代码分包优化
- ✅ 资源压缩
- ✅ 构建优化

### GitHub Actions配置

- ✅ 自动构建
- ✅ 自动部署
- ✅ 环境变量配置

## 🌐 访问地址

部署成功后，你的应用将在以下地址可用：

- **GitHub Pages**: `https://你的用户名.github.io/factory-visualization/`
- **本地预览**: `http://localhost:4173`

## 🐛 常见问题

### 1. 构建失败

```bash
# 清理缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build:prod
```

### 2. 路由404问题

确保vite.config.js中的base路径正确：

```javascript
base: process.env.NODE_ENV === 'production' ? '/factory-visualization/' : './'
```

### 3. 静态资源加载失败

检查所有资源路径是否使用相对路径，避免绝对路径。

## 📞 技术支持

如果遇到部署问题，请检查：

1. GitHub仓库是否公开
2. GitHub Pages是否已启用
3. Actions是否有权限
4. 构建日志是否有错误
