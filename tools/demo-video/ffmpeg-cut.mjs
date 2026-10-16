// Cut a demo from raw takes with plain ffmpeg: the same job as `build.py` + HyperFrames for a simple
// full-frame walkthrough, with no HyperFrames, Python or Homebrew. It is the Windows path for gate 7
// (references/setup.md, section 6) and works anywhere ffmpeg and node do.
//
//   node ffmpeg-cut.mjs <scenes.json> <out.mp4> [--draft]
//
// Writes <out.mp4> and <out>.edl.json (the scene starts and the narrated holds, in film seconds, in the shape
// qa.sh reads, so `qa.sh <out.mp4> <dir> <out>.edl.json` applies the freeze rule and cuts a 10 fps strip
// around every scene change).
//
// scenes.json (worked example: examples/apd629-collected-info/scenes.json). Paths are relative to the
// scenes file's folder.
//   { "rawDir": "raw", "voiceDir": "video/assets/voice", "crossfade": 0.3,
//     "scenes": [
//       { "id": "s1", "take": "s1.mp4", "ss": 0.3, "cuts": [[7, 9]], "dur": 7.2,
//         "voices": [{ "id": "s1", "at": 1.6 }],
//         "holds": [[0.5, 3.0, "narrated: the tab is open"]] } ] }
//   take    the raw take in rawDir (default "<id>.mp4"); its length is read with ffprobe
//   ss      in-point in seconds: start the scene after an opening sweep or loading flash
//   cuts    [[from, to], ...] take seconds to drop (long cursor travel between two narrated actions)
//   dur     seconds the scene is shown; a take shorter than dur is held on its last frame
//   voices  narration takes placed `at` seconds into the scene. {"id": "s1", "at": 1.6} plays
//           <voiceDir>/s1-1.mp3; add "take": 2 to play s1-2.mp3 (copy the take pick-takes.py or the requester
//           chose). At least one voice is required.
//   holds   [[from, to, why], ...] scene seconds that are an intentional narrated hold
//
// Video: 1920x1080, 30 fps, limited-range yuv420p, h264 High. The recorder's frames are full range, so
// `in_range=pc:out_range=tv` plus `-pix_fmt yuv420p` keep the MP4 playable in QuickTime and Safari.
// Audio: narration mixed, loudnorm to -16 LUFS, 48 kHz stereo, padded to the video length.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [scenesPath, out] = process.argv.slice(2).filter(a => !a.startsWith('--'))
const draft = process.argv.includes('--draft')
if (!scenesPath || !out) {
  console.error('usage: node ffmpeg-cut.mjs <scenes.json> <out.mp4> [--draft]')
  process.exit(2)
}
const cfg = JSON.parse(fs.readFileSync(scenesPath, 'utf8'))
const base = path.dirname(path.resolve(scenesPath))
const rel = p => (path.isAbsolute(p) ? p : path.join(base, p))
const rawDir = rel(cfg.rawDir ?? 'raw')
const voiceDir = rel(cfg.voiceDir ?? 'voice')
const XF = cfg.crossfade ?? 0.3
const scenes = cfg.scenes
if (!Array.isArray(scenes) || scenes.length === 0) throw new Error('scenes.json needs a non-empty "scenes" array')
for (const s of scenes) {
  if (typeof s.id !== 'string' || s.id === '') throw new Error('every scene needs an "id"')
  if (typeof s.dur !== 'number' || !(s.dur > XF)) throw new Error(`scene ${s.id}: "dur" must be a number greater than the crossfade (${XF} s)`)
  for (const v of s.voices ?? []) {
    if (typeof v.id !== 'string' || typeof v.at !== 'number') throw new Error(`scene ${s.id}: each voice needs a string "id" and a numeric "at"`)
  }
}

const probe = file =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim())

const inputs = []
const filters = []
scenes.forEach((s, i) => {
  const file = path.join(rawDir, s.take ?? `${s.id}.mp4`)
  if (!fs.existsSync(file)) throw new Error(`missing take: ${file}`)
  s.takeLen = s.takeLen ?? probe(file)
  inputs.push('-i', file)
  const kept = []
  let from = s.ss ?? 0
  for (const [a, b] of s.cuts ?? []) { kept.push([from, a]); from = b }
  kept.push([from, s.takeLen])
  for (let j = kept.length - 1; j >= 0; j--) if (kept[j][1] <= kept[j][0]) kept.splice(j, 1)
  if (kept.length === 0) throw new Error(`scene ${s.id}: nothing left of the take after ss and cuts`)
  const eff = kept.reduce((x, [a, b]) => x + (b - a), 0)
  const pad = Math.max(0, s.dur - eff)
  const labels = kept.map((_, j) => `[p${i}_${j}]`).join('')
  filters.push(`[${i}:v]scale=1920:1080:flags=lanczos:in_range=pc:out_range=tv,fps=30,format=yuv420p,split=${kept.length}${labels}`)
  kept.forEach(([a, b], j) => filters.push(`[p${i}_${j}]trim=start=${a}:end=${b},setpts=PTS-STARTPTS[q${i}_${j}]`))
  const cat = kept.map((_, j) => `[q${i}_${j}]`).join('')
  filters.push(
    `${cat}concat=n=${kept.length}:v=1:a=0,trim=duration=${Math.min(s.dur, eff)},setpts=PTS-STARTPTS` +
      (pad > 0 ? `,tpad=stop_mode=clone:stop_duration=${pad.toFixed(3)}` : '') + `[v${i}]`,
  )
})
let acc = 0
let label = 'v0'
let start = 0
scenes.forEach(s => { s.start = start; start += s.dur - XF })
for (let i = 1; i < scenes.length; i++) {
  acc += scenes[i - 1].dur - XF
  filters.push(`[${label}][v${i}]xfade=transition=fade:duration=${XF}:offset=${acc.toFixed(3)}[x${i}]`)
  label = `x${i}`
}
const total = scenes.reduce((a, s) => a + s.dur, 0) - XF * (scenes.length - 1)
filters.push(`[${label}]fade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[vout]`)

const clips = scenes.flatMap(s => (s.voices ?? []).map(v => ({ ...v, abs: s.start + v.at })))
if (clips.length === 0) throw new Error('no narration: give at least one scene a voices entry')
clips.forEach((c, i) => {
  const file = path.join(voiceDir, `${c.id}-${c.take ?? 1}.mp3`)
  if (!fs.existsSync(file)) throw new Error(`missing narration take: ${file}`)
  inputs.push('-i', file)
  const ms = Math.round(c.abs * 1000)
  filters.push(`[${scenes.length + i}:a]aresample=48000,adelay=${ms}|${ms}[a${i}]`)
})
filters.push(
  `${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,` +
    `aformat=channel_layouts=stereo,apad=whole_dur=${total.toFixed(3)},atrim=0:${total.toFixed(3)},afade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[aout]`,
)
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
execFileSync('ffmpeg', [
  '-v', 'error', '-y', ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', '[vout]', '-map', '[aout]',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'slow', '-crf', draft ? '23' : '16',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out,
], { stdio: 'inherit' })

const holds = scenes.flatMap(s => (s.holds ?? []).map(([a, b, why]) => ({ start: +(s.start + a).toFixed(3), end: +(s.start + b).toFixed(3), why })))
const edlPath = out.replace(/\.mp4$/i, '') + '.edl.json'
fs.writeFileSync(edlPath, JSON.stringify({ title: path.basename(out), duration: +total.toFixed(3), desktop: scenes.map(s => ({ id: s.id, start: +s.start.toFixed(3), duration: s.dur })), holds }, null, 2))
console.log(`wrote ${out} (${total.toFixed(2)} s) and ${edlPath} (${holds.length} narrated holds)`)
console.log('scene starts:', scenes.map(s => `${s.id}@${s.start.toFixed(2)}`).join(' '))
console.log('clips:', clips.map(c => `${c.id}@${c.abs.toFixed(2)}`).join(' '))
