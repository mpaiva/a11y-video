// Human-paced Playwright capture for demo videos: CDP screencast frames at device resolution, a
// drawn cursor that follows real mouse events, eased cursor travel, jittered typing, wheel
// scrolling, touch taps with a finger indicator. Writes <take>.mp4 (constant 30 fps) and
// <take>-marks.json. See README.md and .claude/skills/demo-video/references/capture.md.
//
// Environment (every value is specific to the app you record; set the ones it needs):
//   DEMO_APP_DIR          directory whose node_modules has @playwright/test
//                         (default: this folder — run `npm install` here)
//   DEMO_ADMIN_URL        the desktop app's web origin (default: http://localhost:3000)
//   DEMO_STORAGE_STATE    a Playwright storageState JSON with a signed-in session (optional)
//   DEMO_LOGIN_PATH       a dev-only sign-in route visited before recording, e.g. /dev/login (optional)
//   DEMO_CONTENT_SELECTOR the page's scrollable content area (default: main, [role=main]; else body)
//   DEMO_HIDE_SELECTORS   comma-separated debug overlays to hide (default: TanStack Query devtools)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const appDir = process.env.DEMO_APP_DIR ?? here
const require = createRequire(path.join(appDir, 'package.json'))
export const { chromium } = require('@playwright/test')

export const ADMIN_URL = process.env.DEMO_ADMIN_URL ?? 'http://localhost:3000'
export const CONTENT_SELECTOR = process.env.DEMO_CONTENT_SELECTOR ?? 'main, [role=main]'
export const HIDE_SELECTORS = (process.env.DEMO_HIDE_SELECTORS ??
  'button[aria-label="Open Tanstack query devtools"], .tsqd-parent-container').split(',').map(s => s.trim()).filter(Boolean)
export const ADMIN_VIEWPORT = { width: 1280, height: 720, deviceScaleFactor: 2.5 } // 3200x1800 masters
export const PHONE_VIEWPORT = { width: 412, height: 839, deviceScaleFactor: 2 }   // 824x1678 masters

export const sleep = ms => new Promise(r => setTimeout(r, ms))
export const rand = (a, b) => a + Math.random() * (b - a)
const minJerk = u => u * u * u * (10 - 15 * u + 6 * u * u)

// Overlay injected into every document: hides debug overlays (HIDE_SELECTORS), draws the cursor at
// the last real mouse position and a soft ring on mousedown (or a finger dot on touch). Nothing in
// the app itself is altered.
export const OVERLAY = `(() => {
  const hideSel = ${JSON.stringify(HIDE_SELECTORS.join(','))}
  const hide = () => { if (hideSel) for (const e of document.querySelectorAll(hideSel)) e.style.display = 'none' }
  new MutationObserver(hide).observe(document, { childList: true, subtree: true })
  const install = () => {
    hide()
    if (document.getElementById('rec-cursor')) return
    const st = document.createElement('style')
    st.textContent = '#rec-cursor{position:fixed;left:-60px;top:-60px;width:21px;height:28px;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.35))}' +
      '#rec-ring{position:fixed;left:-60px;top:-60px;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(221,135,51,.85);opacity:0;z-index:2147483646;pointer-events:none}' +
      '#rec-touch{position:fixed;left:-60px;top:-60px;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(40,40,40,.18);border:2px solid rgba(255,255,255,.7);opacity:0;z-index:2147483646;pointer-events:none}'
    document.head.append(st)
    const c = document.createElement('div'); c.id = 'rec-cursor'
    c.innerHTML = '<svg viewBox="0 0 30 40" width="21" height="28"><path d="M3 2L3 32L10 25L17 38L23 35L16 22L27 21Z" fill="#fff" stroke="#1d2a30" stroke-width="2.2" stroke-linejoin="round"/></svg>'
    const r = document.createElement('div'); r.id = 'rec-ring'
    const t = document.createElement('div'); t.id = 'rec-touch'
    document.body.append(c, r, t)
    const saved = JSON.parse(sessionStorage.getItem('rec-cursor') || 'null')
    if (saved && !window.__recTouch) { c.style.left = (saved.x - 2) + 'px'; c.style.top = (saved.y - 1.4) + 'px' }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install); else install()
  addEventListener('mousemove', e => {
    if (window.__recTouch) return
    const c = document.getElementById('rec-cursor'); if (!c) return
    c.style.left = (e.clientX - 2) + 'px'; c.style.top = (e.clientY - 1.4) + 'px'
    sessionStorage.setItem('rec-cursor', JSON.stringify({ x: e.clientX, y: e.clientY }))
  }, true)
  addEventListener('mousedown', e => {
    if (window.__recTouch) return
    const r = document.getElementById('rec-ring'); if (!r) return
    r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'
    r.animate([{ opacity: .9, transform: 'scale(.55)' }, { opacity: 0, transform: 'scale(1.35)' }], { duration: 520, easing: 'ease-out' })
  }, true)
  addEventListener('touchstart', e => {
    const p = e.touches[0]; const t = document.getElementById('rec-touch'); if (!t || !p) return
    t.style.left = p.clientX + 'px'; t.style.top = p.clientY + 'px'
    t.animate([{ opacity: .95, transform: 'scale(.8)' }, { opacity: 0, transform: 'scale(1.1)' }], { duration: 480, easing: 'ease-out' })
  }, { capture: true, passive: true })
})()`

export class Take {
  // dir: output directory; name: take name (files <name>.mp4, <name>-marks.json, <name>-frames/).
  constructor(page, dir, name, { maxWidth, maxHeight, touch = false, contentSelector = CONTENT_SELECTOR } = {}) {
    Object.assign(this, { page, dir, name, maxWidth, maxHeight, touch, contentSelector })
    this.frames = []; this.offsets = []; this.marks = []; this.x = 0; this.y = 0
    this.frameDir = path.join(dir, name + '-frames')
  }
  async start(x = 0, y = 0) {
    fs.rmSync(this.frameDir, { recursive: true, force: true }); fs.mkdirSync(this.frameDir, { recursive: true })
    this.cdp = await this.page.context().newCDPSession(this.page)
    this.cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const f = path.join(this.frameDir, String(this.frames.length).padStart(6, '0') + '.jpg')
      fs.writeFileSync(f, Buffer.from(data, 'base64'))
      this.frames.push({ f, t: metadata.timestamp })
      this.offsets.push(Date.now() / 1000 - metadata.timestamp)
      this.cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await this.cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: this.maxWidth, maxHeight: this.maxHeight, everyNthFrame: 1 })
    this.startWall = Date.now() / 1000
    if (!this.touch && (x || y)) { await this.page.mouse.move(x, y); this.x = x; this.y = y }
  }
  mark(name) { this.marks.push({ name, wall: Date.now() / 1000 }) }
  async pause(a = 300, b = 800) { await sleep(rand(a, b)) }

  async moveTo(x, y, speed = 1) {
    const dx = x - this.x, dy = y - this.y, dist = Math.hypot(dx, dy)
    if (dist < 2) return
    const dur = Math.min(0.85, Math.max(0.4, 0.34 + dist / 1500)) * 1000 * speed
    const nx = -dy / dist, ny = dx / dist, bend = rand(-0.07, 0.07) * dist
    const sx = this.x, sy = this.y, cx = sx + dx / 2 + nx * bend, cy = sy + dy / 2 + ny * bend
    const t0 = performance.now()
    for (;;) {
      const u = Math.min(1, (performance.now() - t0) / dur), e = minJerk(u)
      const px = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * x
      const py = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * y
      await this.page.mouse.move(px, py)
      if (u >= 1) break
      await sleep(6)
    }
    this.x = x; this.y = y
  }

  // Wheel-scroll the container under the cursor by dy, easing velocity, ~60 Hz small deltas.
  async wheel(dy, ms) {
    const dur = ms ?? Math.min(1100, Math.max(550, Math.abs(dy) * 1.6))
    const t0 = performance.now(); let done = 0
    for (;;) {
      const u = Math.min(1, (performance.now() - t0) / dur), target = dy * minJerk(u)
      const step = Math.round(target - done)
      if (step) { await this.page.mouse.wheel(0, step); done += step }
      if (u >= 1) break
      await sleep(14)
    }
  }

  // Bring a locator comfortably into view by wheel scrolling (never scrollIntoView jumps).
  async reveal(loc, { top = 110, bottomPad = 90, anchor } = {}) {
    await loc.waitFor({ state: 'visible' })
    const vh = this.page.viewportSize().height
    // Controls in dialogs, sheets and drawers sit in fixed layers: only require them on screen.
    if (await loc.evaluate(e => !!e.closest('[role=dialog],[role=menu],[role=listbox]'))) { top = 0; bottomPad = 0 }
    // The content area under the cursor; a page without one counts all of body.
    const content = await this.page.evaluate(sel => document.querySelector(sel) ? sel : 'body', this.contentSelector)
    for (let i = 0; i < 4; i++) {
      const b = await loc.boundingBox(); if (!b) throw Error('no box')
      if (b.y >= top && b.y + b.height <= vh - bottomPad) return b
      const want = b.y + b.height > vh - bottomPad ? b.y + b.height - (vh - bottomPad) + 40 : b.y - top - 20
      if (anchor) await this.moveTo(anchor.x, anchor.y)
      else {
        // Wheel only scrolls what is under the cursor: keep it over the page content, not a
        // sidebar, toast or other fixed layer.
        const over = await this.page.evaluate(({ x, y, content }) => !!document.elementFromPoint(x, y)?.closest(content), { x: this.x, y: this.y, content })
        if (!over) {
          // Park over plain content, never over a control.
          let px = Math.min(1150, Math.max(440, b.x + b.width / 2)), py = Math.round(vh * 0.5)
          for (let k = 0; k < 6; k++) {
            const bad = await this.page.evaluate(({ x, y, content }) => { const e = document.elementFromPoint(x, y); return !e?.closest(content) || !!e.closest('button,a,input,[role=button],[role=combobox],label') }, { x: px, y: py, content })
            if (!bad) break
            px = px + 90 > 1200 ? 460 + k * 40 : px + 90; py += k % 2 ? 40 : -30
          }
          await this.moveTo(px, py)
        }
      }
      await this.wheel(want); await sleep(220)
    }
    return loc.boundingBox()
  }

  async point(loc, opts = {}) {
    const b = await this.reveal(loc, opts)
    const ox = opts.exact ? 0 : rand(-0.12, 0.12) * Math.min(b.width, 160)
    const oy = opts.exact ? 0 : rand(-0.15, 0.15) * Math.min(b.height, 30)
    const tx = opts.at ? b.x + opts.at.dx : b.x + b.width / 2 + ox
    const ty = opts.at ? b.y + opts.at.dy : b.y + b.height / 2 + oy
    await this.moveTo(tx, ty, opts.speed)
    return b
  }
  async click(loc, opts = {}) {
    await this.point(loc, opts)
    await sleep(rand(170, 330))
    await this.page.mouse.down(); await sleep(rand(70, 110)); await this.page.mouse.up()
    await sleep(rand(320, 560))
  }
  async type(text, { base = 80, jitter = 75 } = {}) {
    for (const ch of text) {
      await this.page.keyboard.type(ch)
      let d = base + Math.random() * jitter
      if (ch === ' ') d += 35
      if (Math.random() < 0.05) d += 220
      await sleep(d)
    }
  }
  // Touch: tap with a finger indicator, and native touch scroll gestures.
  async tap(loc) {
    await loc.waitFor({ state: 'visible' })
    const b = await loc.boundingBox()
    await sleep(rand(250, 450))
    await this.page.touchscreen.tap(b.x + b.width / 2 + rand(-6, 6), b.y + b.height / 2 + rand(-3, 3))
    await sleep(rand(350, 600))
  }
  async swipe(dy, speed = 420) {
    const vs = this.page.viewportSize()
    await this.cdp.send('Input.synthesizeScrollGesture', { x: Math.round(vs.width / 2 + rand(-20, 20)), y: Math.round(vs.height * 0.62), yDistance: -Math.round(dy), speed, gestureSourceType: 'touch', preventFling: true })
  }

  async stop(tail = 1200) {
    await sleep(tail)
    this.endWall = Date.now() / 1000
    await this.cdp.send('Page.stopScreencast').catch(() => {})
    await sleep(300)
    return this.finish()
  }

  finish() {
    const off = [...this.offsets].sort((a, b) => a - b)[Math.floor(this.offsets.length / 2)]
    const t0 = this.frames[0].t
    const toT = wall => +(wall - off - t0).toFixed(3)
    const marks = Object.fromEntries(this.marks.map(m => [m.name, toT(m.wall)]))
    const end = toT(this.endWall)
    // Constant 30 fps: every output frame shows the newest captured frame at or before its time.
    const list = [], n = Math.ceil(end * 30)
    let j = 0
    for (let k = 0; k < n; k++) {
      const t = k / 30
      while (j + 1 < this.frames.length && this.frames[j + 1].t - t0 <= t) j++
      list.push(`file '${this.frames[j].f}'`, 'duration 0.0333333')
    }
    list.push(`file '${this.frames[j].f}'`)
    const listFile = path.join(this.dir, this.name + '-frames.txt')
    fs.writeFileSync(listFile, list.join('\n'))
    const master = path.join(this.dir, this.name + '.mp4')
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-vf', 'fps=30,format=yuv420p', '-frames:v', String(n), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-movflags', '+faststart', master])
    const info = { file: master, duration: end, frames: this.frames.length, marks }
    fs.writeFileSync(path.join(this.dir, this.name + '-marks.json'), JSON.stringify(info, null, 2))
    return info
  }
}

// Desktop browser. Signs in one of three ways, first match wins: `storageState` (a Playwright
// storageState JSON, or $DEMO_STORAGE_STATE), `loginPath` (a dev-only route that sets the session
// and redirects away, or $DEMO_LOGIN_PATH), or `signIn` (async page => {…} run in a throwaway
// context). With none, it records signed out. Returns { browser, ctx, page }.
export async function adminBrowser({ viewport = ADMIN_VIEWPORT, adminUrl = ADMIN_URL,
  storageState = process.env.DEMO_STORAGE_STATE, loginPath = process.env.DEMO_LOGIN_PATH, signIn } = {}) {
  const browser = await chromium.launch({ headless: true, args: [`--force-device-scale-factor=${viewport.deviceScaleFactor}`] })
  if (!storageState && (loginPath || signIn)) {
    const auth = await browser.newContext()
    const ap = await auth.newPage()
    if (signIn) await signIn(ap)
    else {
      await ap.goto(adminUrl + loginPath)
      await ap.waitForURL(u => !String(u).includes(loginPath), { timeout: 20000 })
    }
    storageState = await auth.storageState(); await auth.close()
  }
  const ctx = await browser.newContext({ storageState, viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor })
  await ctx.addInitScript({ content: OVERLAY })
  const page = await ctx.newPage(); page.setDefaultTimeout(15000)
  return { browser, ctx, page }
}

// Phone browser: Chromium with mobile emulation and touch (WebKit drops Secure / __Host- cookies
// on plain http — see capture.md). Returns { browser, ctx, page }.
export async function phoneBrowser({ viewport = PHONE_VIEWPORT } = {}) {
  const browser = await chromium.launch({ headless: true, args: [`--force-device-scale-factor=${viewport.deviceScaleFactor}`] })
  const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: true, hasTouch: true })
  await ctx.addInitScript({ content: 'window.__recTouch=true;' + OVERLAY })
  const page = await ctx.newPage(); page.setDefaultTimeout(15000)
  return { browser, ctx, page }
}

export const masterSize = viewport => ({ maxWidth: Math.round(viewport.width * viewport.deviceScaleFactor), maxHeight: Math.round(viewport.height * viewport.deviceScaleFactor) })
