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

---

## Docker：构建、改数据库地址、导出 / 导入镜像

### 准备

- 安装 **Docker Desktop**（或等价引擎），Linux 容器模式。
- 仓库根目录需要：`Dockerfile`、`docker-compose.yml`、`docker/`（含 Nginx 配置）、`pnpm-lock.yaml` 等（与仓库一致即可）。

### 修改数据库地址（与其它环境变量）

1. 复制示例：`docker.env.example` → **`docker.env`**（`docker.env` 已加入 `.gitignore`，勿提交含密码文件）。
2. 编辑 **`docker.env`**：
   - **`DB_HOST`**：本机 Windows 上的 MySQL 且后端跑在 Docker 里时，一般用 **`host.docker.internal`**；数据库在局域网其它机器上时，改为该机的 **内网 IP**。
   - **`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`**：与实际 MySQL 一致。**`DB_PASSWORD` 不能为空**（否则会出现 `using password: NO` 被拒）。
   - **`PORT`**：容器内后端端口，默认 **3500**，一般不必改。
3. MySQL 侧：用户需具备从你当前环境连接的权限（如 `bind-address`、防火墙、`GRANT` 的 host 等）。

启动或改完配置后：

```bash
docker compose up -d --build
```

浏览器默认访问 **`http://127.0.0.1:8080/`**（前端经 Nginx，API 同源 `/api`）。若本机 **8080 已被占用**，可先设置端口再启动，例如 PowerShell：

```powershell
$env:FRONT_PUBLISH_PORT = "18080"
docker compose up -d
```

### 导出镜像（一个 tar）

在仓库根、且已 **`docker compose build`** 成功之后：

```bash
pnpm run docker:export
```

默认生成仓库根目录下的 **`factory-stack.tar`**。指定输出路径：

```bash
pnpm run docker:export -- -OutFile D:\backup\factory-stack.tar
```

等价的手动命令（镜像名以 `docker compose config --images` 为准）：

```bash
docker save -o factory-stack.tar factory-visualization-backend factory-visualization-frontend
```

### 导入镜像（另一台机器或本机清空镜像后）

```bash
docker load -i factory-stack.tar
```

将 **`factory-stack.tar`** 换成实际路径。导入后用 **`docker images`** 确认镜像已出现。

**仅 `docker load` 不会带上环境变量**：目标环境仍需自备 **`docker-compose.yml`、`docker.env`**（从 `docker.env.example` 复制并填写现场 **`DB_HOST`** 等），再在仓库根执行：

```bash
docker compose up -d
```

若不在本机构建、只靠 tar + compose 启动，一般**不需要**再执行 `docker compose build`（除非改动了 Dockerfile 需要重建）。
