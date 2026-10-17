// Build the narrated film of an accessibility test from run-scene.mjs takes.
//
//   node tools/a11y-demo/compose.mjs <film.json> <out.mp4> [--draft]
//
// Each scene: Safari's window (a keyboard-only scene: its key presses captioned KEYBOARD), VoiceOver's own speech, the narrator's lines in the pauses the take left for
// them, and a caption bar for both voices (VOICEOVER phrase by phrase, NARRATOR in timed cues). Scenes are joined with a short fade through the
// background, with an English captions track inside the MP4. Also writes <out>.vtt (the same captions), <out>.transcript.txt and
// <out>.edl.json (scene starts and narrated holds, the shape qa.sh reads).
//
// film.json (worked example: examples/menu-stall/film.json). Paths are relative to the film file.
//   { "takesDir": "takes", "voiceDir": "video/assets/voice", "lines": "voice-lines.json",
//     "captionBar": true,     the open captions under the picture, both voices (default on; keep it on)
//     "voGainDb": 6,          lift on VoiceOver's track, to sit level with the narrator
//     "scenes": [ { "id": "before" }, { "id": "after" } ] }
//   A scene can also swap narrator lines into the take's pauses, to cut a second video from one take:
//     { "id": "before", "sayAs": { "b-intro": "v3-open" } }   (compose refuses a line too long for its pause)
//
// Sync. The marks are timed from when the recorders were launched, and each recorder starts a little late.
// So the marks are lined up with VoiceOver's actual speech: every VoiceOver step is matched to the nearest
// onset of sound on its audio track, and the median difference shifts all of that scene's marks.
//
// The caption bar is drawn as HTML in Playwright's Chromium (Homebrew's ffmpeg has no text rendering), in
// Public Sans from demo-video's tools, and laid over the picture with ffmpeg's overlay filter.
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const args = process.argv.slice(2)
const [filmPath, out] = args.filter(a => !a.startsWith('--'))
const draft = args.includes('--draft')
if (!filmPath || !out) {
  console.error('usage: node compose.mjs <film.json> <out.mp4> [--draft]')
  process.exit(2)
}
const film = JSON.parse(fs.readFileSync(filmPath, 'utf8'))
const base = path.dirname(path.resolve(filmPath))
const rel = p => (path.isAbsolute(p) ? p : path.join(base, p))
const takesDir = rel(film.takesDir ?? 'takes')
const voiceDir = rel(film.voiceDir ?? 'video/assets/voice')
// Narrator lines for the captions and transcript, with Kokoro's pronunciation overrides shown as the
// words they spell: "[Paiva](/pˈaɪvə/)" captions as "Paiva".
// Numbers written as words for the voice ("four point one point two") are captioned as figures ("4.1.2"),
// which is how a reader looks a criterion up.
const DIGIT = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 }
const figures = text => text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)((?: point (?:zero|one|two|three|four|five|six|seven|eight|nine))+)\b/gi,
  (_, head, tail) => [head, ...tail.trim().split(/ point /i).filter(Boolean)].map(w => DIGIT[w.replace(/^point /i, '').toLowerCase()]).join('.'))
const lineText = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(rel(film.lines ?? 'voice-lines.json'), 'utf8')).lines)
  .map(([id, text]) => [id, figures(text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'))]))
const work = `${out}.work`
fs.mkdirSync(work, { recursive: true })

// Canvas: 1920x1080. Safari's 1440x900 window, scaled to 1536x960, sits above an 84 px caption bar.
// Canvas: 1920x1080. The take (Safari, with VoiceOver's caption panel beside or below it when the scene
// placed one) is fitted inside it, above an 84 px caption bar that captions both voices.
const W = 1920, H = 1080, BAR = { y: 984, h: 84 }, EDGE = 12
const withBar = film.captionBar ?? true
if (!withBar) console.warn('captionBar is off: this film has no open captions, only the track and the .vtt. Every a11y-demo video should have all three.')
// VoiceOver comes off BlackHole about 7 dB under a Kokoro line; lift it level with the narrator.
const VO_GAIN = film.voGainDb ?? 6
const dims = file => sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).trim().split(',').map(Number)
/** The take scaled to fit the picture area, centred, keeping its shape. Even sizes for the encoder. */
function fitPicture([vw, vh]) {
  const area = { w: W - 2 * EDGE, h: (withBar ? BAR.y : H) - 2 * EDGE }
  const k = Math.min(area.w / vw, area.h / vh)
  const w = 2 * Math.floor((vw * k) / 2), h = 2 * Math.floor((vh * k) / 2)
  return { w, h, x: Math.round((W - w) / 2), y: EDGE + Math.round((area.h - h) / 2) }
}
const FADE = 0.4
const sh = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 << 20 })
const ff = a => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: ['ignore', 'inherit', 'inherit'] })
const duration = file => Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim())
const hasAudio = file => sh('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file]).trim() !== ''

/** Onsets of sound (ends of silences) on an audio file, in its own seconds. */
function onsets(file) {
  // The report goes to stderr, which execFileSync does not return.
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-45dB:d=0.25', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 64 << 20 }).stderr
  const found = [...log.matchAll(/silence_end: ([\d.]+)/g)].map(m => Number(m[1]))
  const leadsWithSound = !/silence_start: 0(\.0+)?\b/.test(log)
  return leadsWithSound ? [0, ...found] : found
}

/**
 * Shift that lines a keyboard take's marks up with its picture: the frame where the sync flash (made at
 * marks.sync) appears is the biggest jump in brightness in the take's opening seconds.
 */
function flashOffset(mov, sync, sync2) {
  if (typeof sync !== 'number') throw new Error(`${mov}: a keyboard take needs its sync mark; re-shoot it.`)
  const until = (sync2 ?? sync) + 4
  const log = spawnSync('ffmpeg', ['-hide_banner', '-t', String(until), '-i', mov, '-vf', 'scale=160:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 64 << 20 }).stderr
  const frames = [...log.matchAll(/pts_time:([\d.]+)[\s\S]*?lavfi\.signalstats\.YAVG=([\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])])
  // The first frame that jumps in brightness by 30 or more: the start of a flash.
  const hit = frames.find((f, i) => i > 0 && f[1] - frames[i - 1][1] >= 30 || i > 0 && frames[i - 1][1] - f[1] >= 30)
  if (!hit) {
    // Measured: screencapture films within about 0.1 s of starting. Close enough for key captions; say so.
    console.warn(`${mov}: no sync flash reached the video; lining the marks up by screencapture's measured start lag (0.1 s).`)
    return { offset: -0.1, matched: 0 }
  }
  // Which flash was it? The one whose mark is nearest, counting the measured lag.
  const marks = [sync, sync2].filter(x => typeof x === 'number')
  const mark = marks.reduce((a, b) => (Math.abs(b - hit[0]) < Math.abs(a - hit[0]) ? b : a))
  return { offset: hit[0] - mark, matched: 1 }
}

/** Shift that lines the marks up with the speech: the median of each VoiceOver step to its nearest onset. */
function offsetFor(marks, sound) {
  const near = marks.steps.filter(s => s.type === 'vo' && s.phrase)
    .map(s => {
      const best = sound.reduce((a, b) => (Math.abs(b - s.at) < Math.abs(a - s.at) ? b : a), Infinity)
      return Math.abs(best - s.at) < 3 ? best - s.at : null
    })
    .filter(d => d !== null)
    .sort((a, b) => a - b)
  // One match is enough for a scene with one phrase (an overview); none means the track is silent.
  if (near.length < 1) throw new Error(`Scene ${marks.scene}: no VoiceOver phrase matched speech, so the marks can't be lined up. Is the audio silent?`)
  return { offset: near[Math.floor(near.length / 2)], matched: near.length }
}

// Caption bars, drawn once each in Chromium.
const toolsDir = process.env.DEMO_APP_DIR ?? path.join(import.meta.dirname, '..', 'demo-video')
const requireTools = createRequire(path.join(toolsDir, 'package.json'))
const fontDir = path.join(toolsDir, 'node_modules', '@fontsource', 'public-sans', 'files')
// Embedded, because a page made with setContent may not load file:// fonts and falls back to a serif.
const font = weight => fs.readFileSync(path.join(fontDir, `public-sans-latin-${weight}-normal.woff2`)).toString('base64')
/**
 * A narrator line as caption cues: sentences, then clauses, at most about 84 characters (two lines of the
 * bar), each timed in proportion to its length within the take. Kokoro's pace is steady enough for that
 * to land within a fraction of a second.
 */
function cues(text, from, to) {
  const MAX = 84
  const split = t => {
    if (t.length <= MAX) return [t]
    for (const re of [/(?<=[.?!…])\s+/, /(?<=[,:;—])\s+/]) {
      const parts = t.split(re)
      if (parts.length > 1) {
        const out = []
        for (const part of parts) {
          if (out.length && (out[out.length - 1] + ' ' + part).length <= MAX) out[out.length - 1] += ' ' + part
          else out.push(part)
        }
        if (out.length > 1) return out.flatMap(split)
      }
    }
    const mid = t.lastIndexOf(' ', Math.floor(t.length / 2)) // no punctuation to split at: halve it
    return mid > 0 ? [...split(t.slice(0, mid)), ...split(t.slice(mid + 1))] : [t]
  }
  const parts = split(text.trim())
  const total = parts.reduce((n, p) => n + p.length, 0)
  let at = from
  return parts.map(p => {
    const span = ((to - from) * p.length) / total
    const cue = { from: at, to: at + span, text: p }
    at += span
    return cue
  })
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
async function drawBars(items) {
  const { chromium } = requireTools('@playwright/test')
  // The installed Google Chrome when there is one: Playwright's own browser has to match its version
  // exactly, and a mismatch stops the build for want of a download. It only draws text here.
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const page = await browser.newPage({ viewport: { width: W, height: BAR.h }, deviceScaleFactor: 1 })
  const files = []
  for (const [i, { who, text }] of items.entries()) {
    await page.setContent(`<!doctype html><style>
      @font-face { font-family: P; src: url(data:font/woff2;base64,${font(400)}); font-weight: 400 }
      @font-face { font-family: P; src: url(data:font/woff2;base64,${font(600)}); font-weight: 600 }
      html, body { margin: 0; background: transparent }
      .bar { box-sizing: border-box; width: ${W}px; height: ${BAR.h}px; padding: 0 120px;
        display: flex; align-items: center; gap: 20px; font-family: P; color: #f4f4f2 }
      .who { flex: none; font-weight: 600; font-size: 22px; letter-spacing: .04em; padding: 6px 12px;
        border: 2px solid #f4f4f2; border-radius: 6px }
      .said { font-size: 30px; line-height: 1.25; overflow: hidden; display: -webkit-box;
        -webkit-line-clamp: 2; -webkit-box-orient: vertical }
    </style><div class="bar"><span class="who">${who}</span><span class="said">${esc(text)}</span></div>`)
    await page.evaluate(() => document.fonts.ready)
    const file = path.join(work, `bar-${String(i).padStart(3, '0')}.png`)
    await page.screenshot({ path: file, omitBackground: true })
    files.push(file)
  }
  await browser.close()
  return files
}

const vtt = []
const transcript = []
// The shape qa.sh reads: scene starts under "desktop", narrated holds under "holds".
const edl = { desktop: [], holds: [] }
const parts = []
let filmT = 0

for (const scene of film.scenes) {
  const { id } = scene
  const marks = JSON.parse(fs.readFileSync(path.join(takesDir, `${id}-marks.json`), 'utf8'))
  const mov = path.join(takesDir, `${id}.mov`)
  // Sound: the picture's own audio track when it has one (locked to the picture), else the BlackHole file.
  // A keyboard-only take has no VoiceOver audio: it is lined up by the flash it made in its lead-in.
  const keyboard = marks.mode === 'keyboard'
  const inFile = keyboard || hasAudio(mov)
  const audio = keyboard ? null : inFile ? mov : path.join(takesDir, `${id}-vo.wav`)
  const { offset, matched } = keyboard ? flashOffset(mov, marks.sync, marks.sync2) : offsetFor(marks, onsets(audio))
  // With sound from a separate file, the picture's own start lag is not measured: the two can be a
  // fraction of a second apart, which shows as the VoiceOver cursor moving early or late. Say so.
  const first = Math.max(0, Math.min(...marks.steps.map(s => s.at)) + offset - 0.6)
  // Hold after the last moment before the fade: one second ended a video mid-thought.
  const last = Math.max(...marks.steps.map(s => s.end ?? s.at)) + offset + (scene.tail ?? film.tail ?? 2.0)
  // screencapture writes a frame only when the screen changes, so a take whose screen goes still (motion
  // paused, say) ends early. The screen showed that last frame until the take ended: hold it.
  const movLength = duration(mov)
  const dur = last - first
  const hold = Math.max(0, last - movLength)
  console.log(`${id}: marks shifted ${offset.toFixed(2)} s (${keyboard ? 'by its sync flash' : `${matched} phrases matched`}), ${dur.toFixed(1)} s${hold > 0 ? `, last frame held ${hold.toFixed(1)} s (the screen went still)` : ''}${inFile ? '' : ' (audio from a separate file: check lip-sync of the cursor)'}`)

  // What appears and is heard, on this scene's clock (0 = the scene's first frame).
  const local = at => at + offset - first
  // A step may expect words after its phrase (a live region's announcement), which the phrase log
  // leaves out. Caption them only if a transcript of that step's own audio has them.
  for (const s of marks.steps.filter(s => s.type === 'vo' && s.expect)) {
    const from = Math.max(0, s.at + offset - 0.3), to = s.end + offset + 2.5
    const clip = path.join(work, `${id}-expect-${Math.round(s.at * 10)}.wav`)
    ff(['-ss', String(from), '-to', String(to), '-i', audio, '-af', 'loudnorm=I=-18', '-ar', '16000', '-ac', '1', clip])
    const model = process.env.WHISPER_MODEL ?? path.join(process.env.HOME, '.cache/hyperframes/whisper/models/ggml-small.en.bin')
    const heardText = spawnSync('whisper-cli', ['-m', model, '-f', clip, '-nt'], { encoding: 'utf8' }).stdout ?? ''
    const words = t => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2)
    const want = words(s.expect), got = new Set(words(heardText))
    const found = want.filter(w => got.has(w)).length / want.length
    if (found < 0.8) throw new Error(`Scene ${id}: VoiceOver was expected to say "${s.expect}" after "${s.phrase}", but the transcript of that moment is "${heardText.trim()}". Not captioning it.`)
    console.log(`${id}: heard the expected "${s.expect}" (${Math.round(found * 100)}% of its words)`)
    s.phrase = `${s.phrase.replace(/[.,]?$/, ',')} ${s.expect}`
  }
  const vos = marks.steps.filter(s => (s.type === 'vo' || s.type === 'key') && (s.phrase || s.tool))
  // A scene may swap a narrator line for another in the same pause ("sayAs": {"b-intro": "v3-open"}), to
  // cut a second video from one take. The new line must fit the pause the take left for the old one.
  const swap = scene.sayAs ?? {}
  const says = marks.steps.filter(s => s.type === 'say').map(s => {
    if (!swap[s.id]) return s
    const id = swap[s.id], take = 1
    const len = duration(path.join(voiceDir, `${id}-${take}.mp3`))
    const next = marks.steps.map(x => x.at).filter(a => a > s.at + 0.01).sort((a, b) => a - b)[0] ?? Infinity
    if (s.at + len > next - 0.2) throw new Error(`Scene ${scene.id}: "${id}" is ${len.toFixed(2)} s, longer than the ${(next - 0.2 - s.at).toFixed(2)} s pause "${s.id}" left. Shorten it, or re-shoot the scene.`)
    return { ...s, id, take, end: s.at + len }
  })
  const events = marks.steps.map(s => local(s.at)).sort((a, b) => a - b)
  // Captions for both voices, labelled by who is speaking. They never overlap: the take leaves the narrator
  // its own pauses.
  const captions = [
    ...vos.map(s => {
      const from = local(s.at)
      const next = events.find(e => e > from + 0.05) ?? dur
      // A key press is captioned as the key and what it reached: "Tab → link, Skip to content".
      return { who: s.type === 'key' ? 'KEYBOARD' : 'VOICEOVER', from, to: Math.min(Math.max(next, from + 1.5), from + 6, dur),
        text: s.tool ? s.key : s.type === 'key' ? `${s.key} → ${s.phrase}` : s.phrase }
    }),
    ...says.flatMap(s => cues(lineText[s.id] ?? s.id, local(s.at), local(s.end)).map(c => ({ who: 'NARRATOR', ...c }))),
  ].sort((x, y) => x.from - y.from)
  const bars = withBar ? await drawBars(captions) : []
  const PIC = fitPicture(dims(mov))

  // Picture: the take scaled onto the canvas, then each caption bar for its span.
  const inputs = ['-ss', String(first), '-t', String(dur), '-i', mov]
  bars.forEach(b => inputs.push('-i', b))
  const audioIn = inputs.filter(a => a === '-i').length   // index of the next input, VoiceOver's audio
  if (keyboard) inputs.push('-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo')   // a silent bed for the narrator
  else inputs.push('-ss', String(first), '-t', String(dur), '-i', audio)
  says.forEach(s => inputs.push('-i', path.join(voiceDir, `${s.id}-${s.take}.mp3`)))
  let v = `[0:v]${hold > 0 ? `tpad=stop_mode=clone:stop_duration=${(hold + 0.5).toFixed(3)},` : ''}scale=${PIC.w}:${PIC.h}:flags=lanczos,format=rgba,pad=${W}:${H}:${PIC.x}:${PIC.y}:color=0x1b1b1f[c0]`
  bars.forEach((_, i) => {
    const c = captions[i]
    v += `;[c${i}][${i + 1}:v]overlay=0:${BAR.y}:enable='between(t,${c.from.toFixed(3)},${c.to.toFixed(3)})'[c${i + 1}]`
  })
  v += `;[c${bars.length}]fade=in:0:d=${FADE},fade=out:st=${(dur - FADE).toFixed(3)}:d=${FADE},format=yuv420p[v]`
  // Sound: VoiceOver's track, plus each narrator line at its gap.
  let a = `[${audioIn}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${keyboard ? 0 : VO_GAIN}dB[vo]`
  says.forEach((s, i) => {
    const ms = Math.max(0, Math.round(local(s.at) * 1000))
    a += `;[${audioIn + 1 + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[n${i}]`
  })
  a += `;[vo]${says.map((_, i) => `[n${i}]`).join('')}amix=inputs=${says.length + 1}:normalize=0:duration=first,afade=in:d=${FADE},afade=out:st=${(dur - FADE).toFixed(3)}:d=${FADE}[a]`
  const part = path.join(work, `${id}.mp4`)
  ff([...inputs, '-filter_complex', `${v};${a}`, '-map', '[v]', '-map', '[a]', '-t', dur.toFixed(3), '-r', '30',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', draft ? 'veryfast' : 'slow', '-crf', draft ? '26' : '18',
    '-c:a', 'aac', '-b:a', '192k', part])
  parts.push(part)

  edl.desktop.push({ id, start: filmT, duration: dur })
  // Stillness on purpose: the hold after the last moment, and a screen that went still (motion paused).
  const tailStart = Math.max(...marks.steps.map(s => s.end ?? s.at)) + offset - first
  edl.holds.push({ start: filmT + tailStart, end: filmT + dur, why: 'end hold before the fade' })
  if (hold > 0) edl.holds.push({ start: filmT + (movLength - first), end: filmT + dur, why: 'the screen went still (last frame held)' })
  for (const s of says) {
    const from = filmT + local(s.at), to = filmT + local(s.end)
    edl.holds.push({ start: from, end: to, why: `narrated: ${s.id}` })
    transcript.push(`[${from.toFixed(1)}] Narrator: ${lineText[s.id] ?? s.id}`)
  }
  for (const c of captions) {
    const who = { VOICEOVER: 'VoiceOver', KEYBOARD: 'Keyboard', NARRATOR: 'Narrator' }[c.who]
    vtt.push({ from: filmT + c.from, to: filmT + c.to, text: `${who}: ${c.text}` })
    if (who !== 'Narrator') transcript.push(`[${(filmT + c.from).toFixed(1)}] ${who}: ${c.text}`)
  }
  filmT += dur
}

// The captions, as a sidecar and as a track inside the MP4, so a player offers them even when the .vtt is
// left behind.
const stamp = s => new Date(s * 1000).toISOString().slice(11, 23)
vtt.sort((x, y) => x.from - y.from)
const vttFile = `${out.replace(/\.mp4$/, '')}.vtt`
fs.writeFileSync(vttFile, `WEBVTT\n\n${vtt.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join('\n')}`)

// Join the scenes, bring the whole mix to -16 LUFS, and add the captions track (English).
const list = path.join(work, 'parts.txt')
fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'))
ff(['-f', 'concat', '-safe', '0', '-i', list, '-i', vttFile, '-map', '0:v', '-map', '0:a', '-map', '1:s',
  '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
  '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-metadata:s:s:0', 'title=English captions',
  '-movflags', '+faststart', out])

transcript.sort((x, y) => parseFloat(x.slice(1)) - parseFloat(y.slice(1)))
fs.writeFileSync(`${out.replace(/\.mp4$/, '')}.transcript.txt`, transcript.join('\n') + '\n')
fs.writeFileSync(`${out}.edl.json`, JSON.stringify(edl, null, 2))
console.log(`${out}: ${filmT.toFixed(1)} s, ${film.scenes.length} scenes`)
