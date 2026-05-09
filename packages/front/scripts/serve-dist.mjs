/**
 * 零依赖静态服务：托管 packages/front/dist（生产 base 为 / 时）。
 * 用法：在 packages/front 下执行 pnpm run serve:dist，或任意处 node 本文件并设置 DIST_ROOT。
 */
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(process.env.DIST_ROOT || path.join(__dirname, '..', 'dist'))
const PORT = Number(process.env.PORT) || 4173
const HOST = process.env.HOST || '0.0.0.0'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.hdr': 'image/vnd.radiance',
  '.webp': 'image/webp',
}

function resolveUnderRoot(urlPath) {
  const raw = decodeURIComponent((urlPath || '/').split('?')[0])
  if (raw.includes('\0')) return null
  const rel = raw === '/' || raw === '' ? 'index.html' : raw.replace(/^\//, '')
  if (rel.includes('..')) return null
  const normalized = path.normalize(rel)
  if (normalized.startsWith('..' + path.sep) || normalized === '..') return null
  const rootResolved = path.resolve(ROOT)
  const full = path.resolve(rootResolved, normalized)
  const prefix = rootResolved.endsWith(path.sep) ? rootResolved : rootResolved + path.sep
  if (full !== rootResolved && !full.startsWith(prefix)) return null
  return full
}

async function fileToServe(absPath) {
  try {
    let st = await fs.stat(absPath)
    if (st.isDirectory()) {
      absPath = path.join(absPath, 'index.html')
      st = await fs.stat(absPath)
    }
    if (!st.isFile()) return null
    return absPath
  } catch {
    return null
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url || req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }

  let abs = resolveUnderRoot(new URL(req.url, 'http://127.0.0.1').pathname)
  if (!abs) {
    res.writeHead(400)
    res.end('Bad path')
    return
  }

  let file = await fileToServe(abs)
  if (!file) {
    const ext = path.extname(abs)
    if (!ext || ext === '') {
      file = await fileToServe(path.join(ROOT, 'index.html'))
    }
  }

  if (!file) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const ext = path.extname(file).toLowerCase()
  const body = req.method === 'HEAD' ? null : await fs.readFile(file)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  res.end(body)
})

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `[serve-dist] 端口 ${PORT} 已被占用。请关闭占用该端口的进程，或换端口启动，例如：\n` +
        `  PowerShell: $env:PORT=8080; pnpm run serve:dist\n` +
        `  CMD:        set PORT=8080 && pnpm run serve:dist`,
    )
  } else {
    console.error('[serve-dist]', err)
  }
  process.exit(1)
})

server.listen(PORT, HOST, async () => {
  try {
    await fs.access(path.join(ROOT, 'index.html'))
  } catch {
    console.warn(`[serve-dist] 警告：未找到 ${path.join(ROOT, 'index.html')}，请先在该目录执行构建。`)
  }
  const urlHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST
  console.log(`[serve-dist] dist: ${ROOT}`)
  console.log(`[serve-dist] 打开 http://${urlHost}:${PORT}/`)
})
