// Film one scene of an accessibility test: real VoiceOver in Safari, the narrator's pauses built in.
//
//   node tools/a11y-demo/run-scene.mjs <scene.json> <out-dir>
//
// Writes <out-dir>/<id>.mov (Safari's window only), <id>-vo.wav (VoiceOver's speech, from BlackHole) and
// <id>-marks.json (every step: when it started and ended, and what VoiceOver said). compose.mjs builds the
// film from those.
//
// The narration is generated before the take (voice.py), so the length of every line is known. A `say` step
// waits for exactly that long and does nothing, so the narrator is never heard over VoiceOver; compose.mjs
// lays the line into that gap.
//
// scene.json (worked example: examples/menu-stall/before.json). Paths are relative to the scene file.
//   { "id": "before", "url": "http://localhost:4601/", "voiceDir": "../video/assets/voice",
//     "display": 1,          which display to film (1 = main; A11Y_DEMO_DISPLAY overrides; vo-lib displays())
//     "panel": "right",      VoiceOver's caption panel beside Safari: "right", "below" or "none"
//     "keepStorage": false,  the page's localStorage and sessionStorage are cleared before each take
//     "hush": true,          Control after each step, to stop hints; false for a scene listening for a
//                            live region's announcement, which Control would also cancel
//     "steps": [
//       { "say": "b-intro" },                    narrator line b-intro (its take 1); the take waits it out
//       { "say": "b-header", "take": 2 },        a different take of the line
//       { "do": "toStart" },                     VoiceOver to the first control in the page
//       { "do": "next", "times": 6, "gap": 0.6 },  VO-Right six times, 0.6 s after each phrase ends
//       { "do": "activate" },                    VO-Space on the current item
//       { "wait": 1.5 } ] }                      a silent beat
//   Commands: next, previous, heading, landmark, link, tab, shiftTab, describe, activate, interact,
//   stopInteracting, escape, down, up, enter, toStart, and focus with a "selector" (vo-lib.mjs). "gap" defaults to the scene's "gap", else 0.5 s;
//   "lead" (default 0.4 s) is the silence after each narrator line before the next step.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import * as vo from './vo-lib.mjs'

const [scenePath, outDir] = process.argv.slice(2)
if (!scenePath || !outDir) {
  console.error('usage: node run-scene.mjs <scene.json> <out-dir>')
  process.exit(2)
}
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'))
const base = path.dirname(path.resolve(scenePath))
const rel = p => (path.isAbsolute(p) ? p : path.join(base, p))
const voiceDir = rel(scene.voiceDir ?? 'voice')
const GAP = scene.gap ?? 0.5
const LEAD = scene.lead ?? 0.4
if (process.platform !== 'darwin') throw new Error('VoiceOver runs on macOS only.')
if (!scene.id || !scene.url || !Array.isArray(scene.steps)) throw new Error('A scene needs "id", "url" and "steps".')

const duration = file =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim())

// Check every narrator take exists before VoiceOver starts: a missing one found mid-take wastes the take.
const lines = {}
for (const step of scene.steps.filter(s => s.say)) {
  const file = path.join(voiceDir, `${step.say}-${step.take ?? 1}.mp3`)
  if (!fs.existsSync(file)) throw new Error(`No narrator take ${file}. Run voice.py for the scene's lines first.`)
  lines[file] = duration(file)
}
const run = vo.commands()
for (const step of scene.steps.filter(s => s.do)) {
  if (!run[step.do]) throw new Error(`Unknown command "${step.do}". Known: ${Object.keys(run).join(', ')}`)
  if (step.do === 'focus' && !step.selector) throw new Error('A "focus" step needs a "selector".')
}

fs.mkdirSync(outDir, { recursive: true })
const out = name => path.join(outDir, `${scene.id}${name}`)
const marks = { scene: scene.id, url: scene.url, recordedAt: new Date().toISOString(), voSettings: vo.VO_SETTINGS, steps: [] }

if (vo.closeVoiceOverUtility()) console.log('Closed VoiceOver Utility, which takes VoiceOver\'s cursor away from the page.')
await vo.voiceOver.start({ settings: vo.VO_SETTINGS })
// Where it all goes: the display to film, and VoiceOver's caption panel beside Safari. The panel's size
// is measured, so the layout leaves exactly its room.
const display = Number(process.env.A11Y_DEMO_DISPLAY ?? scene.display ?? 1)
const panelMode = scene.panel ?? 'right'
const shown = panelMode === 'none' ? null : vo.findPanel()
if (panelMode !== 'none' && !shown) throw new Error('VoiceOver shows no caption panel (VO-Command-F10 toggles it), or set "panel": "none".')
const place = vo.layout({ display, panel: panelMode, panelSize: shown ?? undefined })
marks.layout = { display, panel: panelMode, ...place }
vo.placeSafari(place.safari)
let capture
try {
  await vo.load(scene.url)
  // A take starts from the page's defaults: settings a person (or an earlier take) saved in the page's
  // storage would change what is filmed, silently. "keepStorage": true keeps them.
  if (!scene.keepStorage) {
    vo.js('localStorage.clear(); sessionStorage.clear()')
    await vo.load(scene.url)
  }
  if (place.panel) await vo.placePanel(place.panel, place.film)
  // Dragging the panel takes key-window status from Safari, and a scripted focus in a window that isn't
  // key doesn't reach VoiceOver. Bring Safari back and focus the page again.
  vo.osa('tell application "Safari" to activate')
  vo.js(`(() => { const b = document.body; b.setAttribute("tabindex", "-1");
    b.focus({ preventScroll: true }); b.removeAttribute("tabindex"); })()`)
  await vo.sleep(800)
  vo.frontmostSafari('before the take')
  capture = vo.startCapture({ video: out('.mov'), audio: out('-vo.wav'), film: place.film })
  // Starting a screen recording makes VoiceOver say "System has new window". Let it, in a lead-in that
  // compose cuts, then silence VoiceOver before the first step.
  // (VO-F3 here, to leave the page's name on the panel instead, left VoiceOver's cursor on the page as a
  // whole: the next jump to a control said nothing. So the panel keeps "System has new window" until
  // the first step speaks.)
  await vo.sleep(3000)
  vo.hush()
  await vo.sleep(400)
  const t = () => (Date.now() - capture.startedAt) / 1000

  for (const step of scene.steps) {
    if (step.say) {
      const file = path.join(voiceDir, `${step.say}-${step.take ?? 1}.mp3`)
      const at = t()
      await vo.sleep((lines[file] + (step.lead ?? LEAD)) * 1000)
      marks.steps.push({ type: 'say', id: step.say, take: step.take ?? 1, at, end: at + lines[file] })
    } else if (step.wait) {
      await vo.sleep(step.wait * 1000)
    } else {
      for (let i = 0; i < (step.times ?? 1); i++) {
        vo.frontmostSafari(`during "${step.do}" in scene ${scene.id}`)
        const at = t()
        const since = Date.now()
        await run[step.do](step)
        // Wait for VoiceOver to finish, by ear, then stop the hint it would speak after its delay.
        const spoke = await capture.quiet(since)
        let phrase = step.do === 'toStart' ? '' : await vo.heard()
        // Control stops VoiceOver's speech, which also cancels a live region's announcement queued
        // after the phrase. "hush": false keeps it, for a scene that listens for one.
        if (scene.hush !== false) vo.hush()
        // Guidepup reports nothing new when VoiceOver says the same thing again (a stall: "menu",
        // "menu", "menu"), though it was heard. Then take the item under VoiceOver's cursor, and say so.
        let from = 'spoken'
        if (!phrase && spoke && step.do !== 'toStart') {
          phrase = (await vo.voiceOver.itemText()).trim()
          from = 'itemText'
        }
        marks.steps.push({ type: 'vo', do: step.do, at, end: t(), phrase, ...(from === 'itemText' ? { phraseFrom: from } : {}) })
        if (/^VoiceOver off$/i.test(phrase)) throw new Error(`VoiceOver was turned off during scene ${scene.id}.`)
        await vo.sleep((step.gap ?? GAP) * 1000)
      }
    }
  }
  await vo.sleep(1000)
} finally {
  if (capture) await capture.stop()
  await vo.voiceOver.stop().catch(() => undefined)
  fs.writeFileSync(out('-marks.json'), JSON.stringify(marks, null, 2))
}
const said = marks.steps.filter(s => s.type === 'vo' && s.phrase)
console.log(`${scene.id}: ${marks.steps.length} steps, ${said.length} VoiceOver phrases, ${out('.mov')}`)
for (const s of said) console.log(`  ${s.at.toFixed(1)}s  ${s.do.padEnd(9)} ${s.phrase.slice(0, 90)}`)
