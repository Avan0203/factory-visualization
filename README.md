# factory-visualization

Monorepo：`packages/front`（Vue）、`packages/backend`（Express + MySQL）。

**环境**：Node.js 20+、pnpm、MySQL。

---

## 本地开发

```bash
pnpm install
pnpm dev
```

---

## 本地跑通：后端 dist + 前端 dist（前后端通信）

1. **MySQL** 建好库，在 **`packages/backend/.env`** 配置：`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`（可选 `DB_PORT`，默认 3306）。可选 **`PORT`**：HTTP 端口，默认 **3500**。

2. **后端**（必须在 `packages/backend` 目录执行，才能加载同目录 `.env`）：

   ```bash
   cd packages/backend
   pnpm install
   pnpm run build
   pnpm start
   ```

   即编译出 `dist/` 后执行 **`node dist/app.js`**。自检：`http://127.0.0.1:3500/health`（端口随 `PORT` 变）。

   **说明**：运行 dist 时仍依赖 **`node_modules`** 和 **`.env`**，不能只拷 `dist` 文件夹。

3. **前端**：另开终端，`pnpm run build` 再 **`pnpm run serve`**（见下一节）。本机用 `localhost` / `127.0.0.1` 打开页面时，接口默认指向 **`http://localhost:3500`**，与后端默认端口一致。

改 API 地址：在 **`packages/front`** 下构建前设置环境变量 **`VITE_API_BASE_URL`** 或 **`VITE_API_PORT`**，再执行 `pnpm run build`（值会写进前端包，不是运行时改）。

---

## 仅前端静态包（`packages/front/dist`）

**构建**（在仓库根或 `packages/front`）：

```bash
pnpm --filter front build
```

**用 Node 起静态服务**（仅依赖系统 Node，不依赖额外 npm 包；脚本会读 `dist`）：

```bash
cd packages/front
pnpm run serve:dist
```

默认 **`http://127.0.0.1:4173/`**。端口被占用时：`$env:PORT=8080; pnpm run serve:dist`（PowerShell）。

可选环境变量：`PORT`、`HOST`、`DIST_ROOT`（`dist` 的绝对路径；离线部署时把整份 `dist` 拷走，并指向该路径）。

也可用 `pnpm run preview`（需已 `pnpm install`），或把 `dist` 交给 Nginx / IIS 等做站点根目录静态资源。
