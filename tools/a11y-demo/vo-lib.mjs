// VoiceOver in Safari, driven by Guidepup, for filming an accessibility test.
//
// Carried over from the voiceover-test recorder (mpaiva/jupiter), with every guard its first runs taught it:
// keyboard focus left in Safari's toolbar after a scripted load, a Shift key held over from a VO-Shift
// command (which turns Tab into Shift-Tab), VoiceOver Utility taking the cursor, spoken hints recorded as the
// page's words, and another app coming to the front mid-take.
//
// Needs the one-time setup in .claude/skills/a11y-demo/references/setup.md. Nothing here changes a macOS
// setting: Guidepup applies VoiceOver settings to its own portable copy of the preferences for the length of
// a run, and restores the person's own on stop.
import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const require = createRequire(path.join(process.env.A11Y_DEMO_DIR ?? import.meta.dirname, 'package.json'))
const { voiceOver } = require('@guidepup/guidepup')
export { voiceOver, sleep }

const here = import.meta.dirname

/**
 * The displays, in the order macOS lists them (1 is the main one, with the menu bar's Apple menu), each as
 * global points from the main display's top-left corner. screencapture's -R takes these coordinates and
 * ignores -D, so a take on another display is just a rectangle with, say, a negative x.
 */
export function displays() {
  const json = execFileSync('osascript', ['-l', 'JavaScript', '-e', `ObjC.import("AppKit");
    const s = $.NSScreen.screens, top = s.objectAtIndex(0).frame.size.height, out = [];
    for (let i = 0; i < s.count; i++) { const sc = s.objectAtIndex(i), f = sc.frame;
      out.push({ index: i + 1, name: sc.localizedName.js, x: f.origin.x, y: top - (f.origin.y + f.size.height),
        w: f.size.width, h: f.size.height, scale: sc.backingScaleFactor }) }
    JSON.stringify(out)`], { encoding: 'utf8' })
  return JSON.parse(json)
}

/** mac/vo-panel.swift, built on first use. */
function panelTool(...args) {
  const bin = path.join(here, '.bin', 'vo-panel')
  if (!fs.existsSync(bin)) {
    fs.mkdirSync(path.dirname(bin), { recursive: true })
    execFileSync('swiftc', ['-O', '-o', bin, path.join(here, 'mac', 'vo-panel.swift')], { stdio: 'inherit' })
  }
  return execFileSync(bin, args, { encoding: 'utf8' }).trim()
}

/** VoiceOver's caption panel, {x, y, w, h} in global points, or null when it isn't showing. */
export function findPanel() {
  const line = panelTool('find').split('\n')[0]
  return line ? JSON.parse(line) : null
}

/**
 * Where everything goes for a take on `display` (1 = main), with VoiceOver's caption panel to the
 * "right" of Safari, "below" it, or "none". Safari keeps a 16:10 window, as large as fits up to
 * 1440x900. Returns {safari, panel, film}: rectangles [x, y, w, h] in global points (panel is null
 * for "none"); film is the rectangle recorded, Safari and the panel together.
 */
export function layout({ display = 1, panel = 'right', panelSize = { w: 600, h: 110 } } = {}) {
  const all = displays()
  const d = all[display - 1]
  if (!d) throw new Error(`There is no display ${display}. Displays: ${all.map(x => `${x.index} ${x.name} (${x.w}x${x.h})`).join(', ')}`)
  const margin = 24, gap = 16, top = d.y + 40   // below the menu bar
  const room = { w: d.w - 2 * margin, h: d.h - 40 - margin }
  const fit = (w, h) => {
    const width = Math.floor(Math.min(1440, w, h * 1.6))
    return [width, Math.floor(width / 1.6)]
  }
  if (panel === 'right') {
    const [w, h] = fit(room.w - gap - panelSize.w, room.h)
    const safari = [d.x + margin, top, w, h]
    const p = [safari[0] + w + gap, top + Math.round((h - panelSize.h) / 2), panelSize.w, panelSize.h]
    return { safari, panel: p, film: [safari[0], top, w + gap + panelSize.w, h] }
  }
  if (panel === 'below') {
    const [w, h] = fit(room.w, room.h - gap - panelSize.h)
    const safari = [d.x + margin, top, w, h]
    const p = [safari[0] + Math.round((w - panelSize.w) / 2), top + h + gap, panelSize.w, panelSize.h]
    return { safari, panel: p, film: [safari[0], top, w, h + gap + panelSize.h] }
  }
  const [w, h] = fit(room.w, room.h)
  return { safari: [d.x + margin, top, w, h], panel: null, film: [d.x + margin, top, w, h] }
}

/**
 * Drag VoiceOver's caption panel to the top-left corner [x, y], then park the pointer outside `film`
 * so it can't hover anything in the take. Throws when the panel isn't showing or won't move there.
 */
export async function placePanel([x, y], film) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const p = findPanel()
    if (!p) throw new Error('VoiceOver shows no caption panel to place (VO-Command-F10 toggles it).')
    if (Math.abs(p.x - x) <= 4 && Math.abs(p.y - y) <= 4) break
    // Grab it near its top edge, clear of the text; aim so that corner lands on [x, y].
    const grab = { x: p.x + 20, y: p.y + 8 }
    panelTool('drag', String(grab.x), String(grab.y), String(x + 20), String(y + 8))
    await sleep(400)
    if (attempt === 1) {
      const q = findPanel()
      if (!q || Math.abs(q.x - x) > 4 || Math.abs(q.y - y) > 4) throw new Error(`The caption panel would not move to ${x}, ${y} (it is at ${q?.x}, ${q?.y}).`)
    }
  }
  const [fx, fy, fw, fh] = film
  panelTool('move', String(fx + fw + 40), String(fy + fh + 40))
}

/**
 * VoiceOver settings for a take, applied by Guidepup to its own preference set for that take only (the
 * person's own VoiceOver is untouched). Guidepup's set is tuned for automation, not for an audience:
 *   SCRShouldOutputVOInstructions   hints ("You are currently on a link. To click this link…"): off.
 *                                   They describe VoiceOver, not the page. hush() stays as a backup.
 *   …SCRRateAsPercent               speech rate: 50, down from Guidepup's 90, which a viewer (and the
 *                                   transcript check) cannot follow.
 *   SCRConfigurationCursorTrackingMToVO   the mouse pointer following VoiceOver's cursor: off. On, the
 *                                   pointer jumps onto every button VoiceOver reaches, is filmed, and its
 *                                   hover brings up tooltips no keyboard user would see.
 * Found by reading Guidepup's set, not documented by Apple. A11Y_DEMO_VO_SETTINGS (JSON) adds or overrides.
 */
export const VO_SETTINGS = {
  SCRShouldOutputVOInstructions: false,
  SCRCategories_SCRCategorySystemWide_SCRSpeechLanguages_default_SCRSpeechComponentSettings_SCRRateAsPercent: 50,
  SCRConfigurationCursorTrackingMToVO: false,
  ...JSON.parse(process.env.A11Y_DEMO_VO_SETTINGS ?? '{}'),
}

export function osa(script) {
  return execFileSync('osascript', ['-e', script], { encoding: 'utf8' }).trim()
}

export function tryOsa(script) {
  try {
    return osa(script)
  } catch {
    return ''
  }
}

/** JavaScript in Safari's page. Needs Safari › Settings › Developer › "Allow JavaScript from Apple Events". */
export function js(code) {
  try {
    return osa(`tell application "Safari" to do JavaScript ${JSON.stringify(code)} in front document`)
  } catch (cause) {
    throw new Error('Safari would not run JavaScript from Apple Events (setup.md, Safari settings).', { cause })
  }
}

/** Keys go to whatever app is in front; anything else in front means the rest of the take is wrong. */
export function frontmostSafari(where) {
  const front = osa('tell application "System Events" to get name of first application process whose frontmost is true')
  if (front !== 'Safari') throw new Error(`${front} came in front of Safari ${where}. The take is not usable.`)
}

/** A command like VO-Shift-Home can leave Shift held, and a held Shift turns Tab into Shift-Tab. */
export function releaseModifiers() {
  tryOsa('tell application "System Events" to key up {shift, control, option, command}')
}

/** VoiceOver's spoken hints, in case they are on: they describe VoiceOver, not the page. */
const HINT = /(^|[.?!]?\s+)(You are currently|To (click|exit|enter|display|select|interact|begin|stop|expand|collapse|choose|open)\b)[\s\S]*$/

/** What VoiceOver said for the last command, without hints; silence is polled for up to three seconds. */
export async function heard() {
  for (let waited = 0; ; waited += 250) {
    const phrase = (await voiceOver.lastSpokenPhrase()).trim().replace(HINT, '').trim()
    if (phrase || waited >= 3000) return phrase
    await sleep(250)
  }
}

/** VoiceOver Utility's window pulls the cursor away from the page. It holds no unsaved work. */
export function closeVoiceOverUtility() {
  try {
    execFileSync('pgrep', ['-x', 'VoiceOver Utility'])
  } catch {
    return false
  }
  tryOsa('tell application "VoiceOver Utility" to quit')
  return true
}

/** Safari to the front, its window at `frame` ([x, y, w, h] in global points, from layout()). */
export function placeSafari(frame) {
  const [x, y, w, h] = frame
  osa(`tell application "Safari"
    activate
    if (count of windows) is 0 then make new document
    set bounds of front window to {${x}, ${y}, ${x + w}, ${y + h}}
  end tell`)
}

/**
 * Load a page fresh and put keyboard focus inside it. A blank page first stops Safari restoring scroll and
 * focus; focusing the body afterwards gets focus (and VoiceOver's cursor, which follows it) out of the
 * toolbar, where a scripted load often leaves it.
 */
export async function load(url) {
  osa('tell application "Safari" to set URL of front document to "about:blank"')
  await sleep(500)
  osa(`tell application "Safari" to set URL of front document to ${JSON.stringify(url)}`)
  for (let i = 0; ; i++) {
    await sleep(250)
    if (js('document.readyState') === 'complete') break
    if (i > 80) throw new Error(`${url} did not finish loading in 20 seconds.`)
  }
  js(`(() => { const b = document.body; b.setAttribute("tabindex", "-1");
    b.focus({ preventScroll: true }); b.removeAttribute("tabindex"); })()`)
  releaseModifiers()
  await sleep(1200)
}

/**
 * Put VoiceOver on the first focusable thing in the page, the way a tester starts a read-through: focus it,
 * bring the cursor to the focus (VO-Shift-F4), and step in once if the cursor is on the page as a whole.
 */
export async function toStart() {
  const kc = voiceOver.keyboardCommands
  js(`document.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus({ preventScroll: true })`)
  await sleep(800)
  await voiceOver.perform(kc.moveCursorToKeyboardFocus)
  releaseModifiers()
  await sleep(400)
  if (/web content/i.test(await heard())) {
    await voiceOver.interact()
    releaseModifiers()
    await sleep(400)
  }
}

/**
 * Jump to one control, as a tester tabbing straight to it would: focus it, then VoiceOver to the focus.
 * Caution, found by a jupiter session: after VO-Shift-F4 the page no longer holds keyboard focus as far as
 * VoiceOver is concerned, and it ignores focus moves the page makes afterwards (a dialog focusing its
 * heading). When a step depends on the page moving focus, reach the control with Tab instead.
 */
export async function focusOn(selector) {
  const found = js(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return "none";
    e.focus({ preventScroll: false }); return "ok" })()`)
  if (found !== 'ok') throw new Error(`Nothing on the page matches ${selector}.`)
  await sleep(500)
  await voiceOver.perform(voiceOver.keyboardCommands.moveCursorToKeyboardFocus, { capture: true })
  releaseModifiers()
}

/**
 * The commands a scene can use, by name, given their step ("focus" takes "selector"). Each returns as soon
 * as VoiceOver starts to answer; the take then waits for it to finish with capture.quiet(), which listens to
 * the audio, and stops any hint with hush().
 */
export function commands() {
  // Guidepup hands out its keyboard commands only while VoiceOver runs, so look them up on use.
  const kc = () => voiceOver.keyboardCommands
  const begin = { capture: 'initial' }
  const shift = async fn => {
    await fn()
    releaseModifiers()
  }
  return {
    next: () => voiceOver.next(begin),
    previous: () => voiceOver.previous(begin),
    heading: () => voiceOver.perform(kc().findNextHeading, begin),
    landmark: () => voiceOver.nextLandmark(begin),
    link: () => voiceOver.nextLink(begin),
    tab: async () => {
      releaseModifiers()
      await voiceOver.press('Tab', begin)
    },
    shiftTab: () => shift(() => voiceOver.press('Shift+Tab', begin)),
    describe: () => voiceOver.perform(kc().describeItem, begin),
    activate: () => voiceOver.act(begin),
    interact: () => shift(() => voiceOver.interact(begin)),
    stopInteracting: () => shift(() => voiceOver.stopInteracting(begin)),
    escape: () => voiceOver.press('Escape', begin),
    // Inside a control (a dropdown's menu, a radio group): the keys a person would press.
    down: () => voiceOver.press('ArrowDown', begin),
    up: () => voiceOver.press('ArrowUp', begin),
    enter: () => voiceOver.press('Enter', begin),
    toStart,
    focus: step => focusOn(step.selector),
  }
}

/**
 * Keys for a keyboard-only scene (no VoiceOver), sent to the front app with System Events. Each returns
 * the key's name for the caption.
 */
export function keyCommands() {
  const press = (code, name, mods = '') => async () => {
    releaseModifiers()
    osa(`tell application "System Events" to key code ${code}${mods ? ` using {${mods}}` : ''}`)
    releaseModifiers()
    await sleep(350)
    return name
  }
  return {
    tab: press(48, 'Tab'),
    shiftTab: press(48, 'Shift-Tab', 'shift down'),
    enter: press(36, 'Return'),
    space: press(49, 'Space'),
    escape: press(53, 'Escape'),
    down: press(125, 'Down arrow'),
    up: press(126, 'Up arrow'),
    left: press(123, 'Left arrow'),
    right: press(124, 'Right arrow'),
    // No key: read what has focus now, after a step that couldn't (typing into a dropdown).
    look: async () => 'Focus is on',
    // For a browser tool such as the Web Inspector, outside the page: a key chord, typing, and a click at a
    // point in Safari's window. Each is captioned with its label, not with the page's focus.
    chord: async step => {
      releaseModifiers()
      osa(`tell application "System Events" to key code ${step.code}${step.mods ? ` using {${step.mods}}` : ''}`)
      releaseModifiers()
      await sleep(700)
      return step.label
    },
    type: async step => {
      // keystroke types the text as written; quotes are escaped for AppleScript.
      osa(`tell application "System Events" to keystroke ${JSON.stringify(step.text)}`)
      await sleep(300)
      if (step.enter !== false) osa('tell application "System Events" to key code 36')
      await sleep(900)
      return `Typed ${step.text}`
    },
    click: async step => {
      // A point in Safari's window, in points from its top-left corner (step.window, set by run-scene).
      const [wx, wy] = step.window
      const at = [String(wx + step.x), String(wy + step.y)]
      execFileSync(path.join(here, '.bin', 'vo-panel'), ['move', ...at])
      await sleep(300)
      execFileSync(path.join(here, '.bin', 'vo-panel'), ['drag', ...at, ...at])   // press and release in place
      await sleep(700)
      return step.label
    },
  }
}

/**
 * What has keyboard focus, as a tester would say it: role, name, state ("button, Set for you,
 * collapsed"), and whether the browser draws a focus indicator (:focus-visible). Read from the page.
 */
export function describeFocus() {
  return JSON.parse(js(`(() => {
    const e = document.activeElement
    if (!e || e === document.body) return JSON.stringify({ text: 'the page itself', visible: false, body: true })
    const tag = e.tagName.toLowerCase()
    const role = e.getAttribute('role') || ({ a: 'link', button: 'button', select: 'pop-up button', input: e.type === 'checkbox' ? 'checkbox' : 'text field',
      textarea: 'text field', summary: 'disclosure', main: 'main', h1: 'heading', h2: 'heading' })[tag] || tag
    const label = e.getAttribute('aria-labelledby')?.split(' ').map(id => document.getElementById(id)?.textContent).join(' ')
    let name = (e.getAttribute('aria-label') || label || (tag === 'select' ? '' : e.textContent) || e.getAttribute('title') || e.getAttribute('alt') || '').replace(/\\s+/g, ' ').trim()
    if (tag === 'main') name = ''
    const state = [e.getAttribute('aria-expanded') === 'true' ? 'expanded' : e.getAttribute('aria-expanded') === 'false' ? 'collapsed' : '',
      e.getAttribute('aria-pressed') === 'true' ? 'pressed' : '', tag === 'select' ? e.options[e.selectedIndex]?.text : ''].filter(Boolean).join(', ')
    const parts = [role, tag === 'select' ? e.getAttribute('aria-label') : name.slice(0, 90), state].filter(Boolean)
    return JSON.stringify({ text: parts.join(', '), visible: e.matches(':focus-visible') })
  })()`))
}

/**
 * Flash the page for half a second (white on a dark page, black on a light one), so compose can find a known
 * moment in a take with no VoiceOver audio to line it up by. Done in the lead-in, which compose cuts.
 */
export function syncFlash() {
  // Written without regex escapes: this source sits in a template literal, where a backslash is eaten.
  const done = js(`(() => { const d = document.createElement('div');
    const bg = getComputedStyle(document.documentElement).backgroundColor.replace(/[^0-9,]/g, '').split(',').map(Number);
    const dark = bg.length < 3 || (bg[0] * 0.299 + bg[1] * 0.587 + bg[2] * 0.114) < 128;
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:' + (dark ? '#fff' : '#000');
    document.documentElement.appendChild(d); setTimeout(() => d.remove(), 500); return 'flashed' })()`)
  if (done !== 'flashed') throw new Error(`The sync flash did not run in the page (Safari returned "${done}").`)
}

/**
 * Stop VoiceOver speaking: Control, its own "stop speech" key. Pressed once a phrase has ended, it cancels
 * the hint VoiceOver would speak after its delay ("You are currently on a link…"). Hints can't be turned
 * off for the take itself: Guidepup runs VoiceOver on its own preference set, mounted fresh each time.
 */
export function hush() {
  tryOsa('tell application "System Events" to key code 59')
}

/** The Mac's sound output device. VoiceOver speaks through it, so for a take it has to be BlackHole. */
export function outputDevice() {
  const report = execFileSync('system_profiler', ['SPAudioDataType'], { encoding: 'utf8' })
  let device = ''
  for (const line of report.split('\n')) {
    const name = line.match(/^ {8}(\S.*):$/)
    if (name) device = name[1]
    if (/Default Output Device: Yes/.test(line)) return device
  }
  return ''
}

/**
 * Start filming Safari's window: the picture with screencapture, VoiceOver's speech from BlackHole with
 * ffmpeg. ffmpeg also listens as it records (silencedetect, -50 dB for 0.4 s), so the take knows when
 * VoiceOver has finished a phrase: quiet() waits for that.
 */
export function startCapture({ video, audio, film, audioDevice = process.env.A11Y_DEMO_AUDIO_DEVICE ?? 'BlackHole 2ch' }) {
  // An old take of the same name is removed first: screencapture once left one in place and wrote
  // nothing, and compose then cut the old picture to the new marks.
  fs.rmSync(video, { force: true })
  const started = Date.now()
  const wrote = () => {
    if (!fs.existsSync(video) || fs.statSync(video).size < 100000 || fs.statSync(video).mtimeMs < started) {
      throw new Error(`screencapture wrote no new video to ${video}. Is Screen Recording allowed for this app?`)
    }
  }
  // No audio (a keyboard-only scene): the picture alone.
  if (!audio) {
    const picture = spawn('screencapture', ['-v', '-x', '-R', film.map(Math.round).join(','), video], { stdio: 'ignore' })
    return { startedAt: Date.now(), async quiet() { return false }, async stop() { picture.kill('SIGINT'); await new Promise(r => (picture.exitCode !== null ? r() : picture.once('exit', r))); wrote() } }
  }
  const out = outputDevice()
  if (!out.includes(audioDevice)) {
    throw new Error(`The Mac's sound output is "${out}". Set it to ${audioDevice} for the take (System Settings › Sound › Output), or VoiceOver isn't recorded.`)
  }
  // -R in global points; screencapture ignores -D when -R is given (checked: -D 2 -R 10,10 films display 1).
  const picture = spawn('screencapture', ['-v', '-x', '-R', film.map(Math.round).join(','), video], { stdio: 'ignore' })
  const sound = spawn('ffmpeg', ['-hide_banner', '-nostats', '-loglevel', 'info', '-y', '-f', 'avfoundation', '-i', `:${audioDevice}`,
    // aresample=async: the device sends no buffers while nothing plays into it, so without this every
    // silence shrinks and VoiceOver drifts earlier through the take. It rebuilds them from the timestamps.
    '-filter_complex', '[0:a]aresample=async=1:first_pts=0,asplit=2[rec][ear];[ear]silencedetect=noise=-50dB:d=0.4,anullsink',
    '-map', '[rec]', '-ac', '2', '-ar', '48000', audio], { stdio: ['pipe', 'ignore', 'pipe'] })
  // When speech last started and stopped, by the clock here (the detector's own timestamps are the device's).
  const ear = { speaking: false, spokeAt: 0, quietAt: 0 }
  let soundError = ''
  let buffer = ''
  sound.stderr.on('data', d => {
    buffer += d
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop()
    for (const line of lines) {
      if (line.includes('silence_end')) Object.assign(ear, { speaking: true, spokeAt: Date.now() })
      else if (line.includes('silence_start')) Object.assign(ear, { speaking: false, quietAt: Date.now() - 400 })
      else if (/error|failed|denied/i.test(line)) soundError += `${line}\n`
    }
  })
  return {
    startedAt: Date.now(),
    /** Wait until VoiceOver, having spoken since `since` (ms), has been quiet; or 3 s of nothing at all. */
    async quiet(since) {
      for (;;) {
        if (ear.spokeAt >= since - 300 && !ear.speaking && ear.quietAt > ear.spokeAt) return true
        if (ear.spokeAt < since - 300 && !ear.speaking && Date.now() - since > 3000) return false
        await sleep(50)
      }
    },
    async stop() {
      picture.kill('SIGINT')
      sound.stdin.write('q')
      sound.stdin.end()
      await Promise.all([picture, sound].map(p => new Promise(resolve => (p.exitCode !== null ? resolve() : p.once('exit', resolve)))))
      wrote()
      if (soundError.trim()) throw new Error(`Recording VoiceOver's audio from "${audioDevice}" failed: ${soundError.trim()}`)
    },
  }
}
