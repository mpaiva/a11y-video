// Serve a built static site on localhost, for filming two builds side by side (before and after a fix).
//
//   node tools/a11y-demo/serve-static.mjs <dir> <port>
//
// Resolves clean URLs the way static hosts do: /work/ccds tries work/ccds, work/ccds.html, then
// work/ccds/index.html. Localhost only; no caching, so a rebuilt site shows on the next load.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const [dir, port] = process.argv.slice(2)
if (!dir || !port) {
  console.error('usage: node serve-static.mjs <dir> <port>')
  process.exit(2)
}
const root = path.resolve(dir)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.vtt': 'text/vtt; charset=utf-8', '.mp3': 'audio/mpeg' }

http.createServer((req, res) => {
  const want = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = [want, `${want}.html`, path.join(want, 'index.html')]
    .map(p => path.join(root, p))
    .find(p => p.startsWith(root) && fs.existsSync(p) && fs.statSync(p).isFile())
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
    return
  }
  const type = types[path.extname(file)] ?? 'application/octet-stream'
  const size = fs.statSync(file).size
  // Byte ranges: Safari won't play a video without them, and every browser uses them to seek.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2])
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (start > end || start >= size) {
      res.writeHead(416, { 'content-range': `bytes */${size}` }).end()
      return
    }
    res.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`,
      'accept-ranges': 'bytes', 'cache-control': 'no-store' })
    fs.createReadStream(file, { start, end }).pipe(res)
    return
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}).listen(Number(port), '127.0.0.1', () => console.log(`${root} on http://localhost:${port}/`))
