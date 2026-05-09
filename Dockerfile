# syntax=docker/dockerfile:1
# 多阶段：builder 同时构建前端 + 后端；最终镜像二选一 target
#   docker build --target backend-runner -t factory-backend .
#   docker build --target frontend-runner -t factory-frontend .
# 日常用 docker compose up -d --build 即可

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.2 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/front/package.json ./packages/front/

RUN pnpm install --frozen-lockfile --filter backend --filter front

COPY packages/backend ./packages/backend
COPY packages/front ./packages/front

# 前端构建为「与页面同源」请求 /api，由 nginx 反代到 backend
ENV VITE_USE_SAME_ORIGIN=true
RUN pnpm --filter backend build \
  && pnpm --filter front build:docker \
  && pnpm --filter backend deploy --prod --legacy /deploy

FROM node:20-bookworm-slim AS backend-runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /deploy/ ./
RUN chown -R node:node /app

EXPOSE 3500
USER node
CMD ["node", "dist/app.js"]

FROM nginx:1.27-alpine AS frontend-runner
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/front/dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
