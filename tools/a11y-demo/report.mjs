// Build the report of an accessibility test: a plain-language brief, the videos along the way, and
// recommendations for testing with people with disabilities.
//
//   node tools/a11y-demo/report.mjs <report.json> <out.html>
//
// The videos, their .vtt captions and .transcript.txt files sit next to <out.html>, as compose.mjs
// writes them; their lengths and transcripts are read from those files.
//
// It also writes README.md beside <out.html>: the same report for GitHub, which shows a folder's README
// under its file list. GitHub strips a <video> whose source is a file in the repository (only videos
// uploaded through its web editor play inline), so each video there is a still, <stem>.jpg, taken from
// the video and linked to the .mp4, with its captions file and its transcript.
//
// report.json (worked example: examples/menu-stall/report.json, from the repository's root):
//   { "title": "...", "lede": "...", "lang": "en",
//     "breadcrumbs": [{ "name": "Site", "href": "https://..." }, ...],      optional
//     "notes": [{ "label": "What these videos are.", "text": "..." }, ...],  what the test is and isn't
//     "brief": { "summary": ["paragraph", ...],
//                "findings": [{ "title", "status": "fixed" | "open" | "in-review" | "not-the-page",
//                               "criterion": "WCAG 4.1.2 Name, Role, Value", "plain": "...",
//                               "fix": "...", "video": "<video id>" }] },
//     "steps": [{ "title", "goal", "video": "<video id>" | null }],
//     "videos": [{ "id", "stem", "title", "about", "finding" }],
//     "recommendations": [{ "area", "why", "who" }],
//     "recommendationsVideo": { "id", "stem", "title", "about" },          optional, shown in that section
//     "footer": "..." }
//   Text may hold inline HTML (links, <strong>); it is the author's, not the viewer's.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [reportPath, out] = process.argv.slice(2)
if (!reportPath || !out) {
  console.error('usage: node report.mjs <report.json> <out.html>')
  process.exit(2)
}
const r = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const dir = path.dirname(path.resolve(out))
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const length = stem => {
  const s = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
    path.join(dir, `${stem}.mp4`)], { encoding: 'utf8' }).trim())
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
}
const transcript = stem => fs.readFileSync(path.join(dir, `${stem}.transcript.txt`), 'utf8').split('\n')
  .map(line => line.match(/^\[([\d.]+)\] ([A-Z][A-Za-z]+): (.*)$/))
  .filter(Boolean)
  .map(([, t, who, text]) => `<li><span class="time">${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</span> <span class="who">${who}</span> ${esc(text)}</li>`)
  .join('\n')

for (const v of [...r.videos, ...(r.recommendationsVideo ? [r.recommendationsVideo] : [])]) {
  for (const ext of ['.mp4', '.vtt', '.transcript.txt']) {
    if (!fs.existsSync(path.join(dir, v.stem + ext))) throw new Error(`Missing ${v.stem}${ext} next to ${out}.`)
  }
}
const ids = new Set(r.videos.map(v => v.id))
for (const ref of [...(r.brief?.findings ?? []), ...(r.steps ?? [])].map(x => x.video).filter(Boolean)) {
  if (!ids.has(ref)) throw new Error(`"${ref}" is linked but is not a video id.`)
}
if (!r.recommendations?.length) throw new Error('A report ends with recommendations for testing with people with disabilities: add "recommendations".')

const STATUS = { fixed: 'Fixed', open: 'Open', 'in-review': 'Fix in review', 'not-the-page': 'Not the page' }
const findings = (r.brief?.findings ?? []).map(f => `
      <li class="finding-item">
        <p class="finding-head"><span class="status status-${esc(f.status)}">${STATUS[f.status] ?? esc(f.status)}</span> <strong>${f.title}</strong></p>
        <p>${f.plain}</p>
        ${f.fix ? `<p class="fix">${f.fix}</p>` : ''}
        <p class="meta">${f.criterion ? `${esc(f.criterion)} · ` : ''}${f.video ? `<a href="#${esc(f.video)}">Watch it</a>` : ''}</p>
      </li>`).join('')

const steps = (r.steps ?? []).map(s => `
      <li><strong>${s.title}.</strong> <span class="goal">Goal: ${s.goal}</span> <span class="status-line">${s.video ? `<a href="#${esc(s.video)}">Video</a>` : 'Not filmed.'}</span></li>`).join('')

const videoSection = (v, heading = 'h3') => {
  const len = length(v.stem)
  return `
  <section class="video" aria-labelledby="${esc(v.id)}">
    <${heading} id="${esc(v.id)}">${v.title}</${heading}>
    <video controls preload="metadata" playsinline aria-describedby="${esc(v.id)}-about">
      <source src="${esc(v.stem)}.mp4" type="video/mp4">
      <track kind="captions" src="${esc(v.stem)}.vtt" srclang="${esc(r.lang ?? 'en')}" label="English">
      <p>Your browser can’t play this video. <a href="${esc(v.stem)}.mp4">Download it (${len})</a>.</p>
    </video>
    <p class="meta">${len} · captions on screen, and as a track · <a href="${esc(v.stem)}.vtt">captions file</a> · <a href="${esc(v.stem)}.transcript.txt">transcript as text</a></p>
    <div id="${esc(v.id)}-about">
      <p>${v.about}</p>
      ${v.finding ? `<p class="finding"><strong>Finding.</strong> ${v.finding}</p>` : ''}
    </div>
    <details>
      <summary>Transcript</summary>
      <ol class="transcript">
${transcript(v.stem)}
      </ol>
    </details>
  </section>`
}
const videos = r.videos.map(v => videoSection(v)).join('')
// The recommendations can have a video of their own, shown at the top of their section.
const recVideo = r.recommendationsVideo ? videoSection(r.recommendationsVideo) : ''

const recommendations = r.recommendations.map(x => `
      <li><strong>${x.area}.</strong> ${x.why}${x.who ? ` <span class="who-line">Who: ${x.who}</span>` : ''}</li>`).join('')

const crumbs = r.breadcrumbs?.length ? `
  <nav class="crumbs" aria-label="Breadcrumb">
    <ol>
      ${r.breadcrumbs.map(b => `<li><a href="${esc(b.href)}">${esc(b.name)}</a></li>`).join('\n      ')}
      <li><span aria-current="page">${esc(r.short ?? r.title)}</span></li>
    </ol>
  </nav>` : ''

const page = `<!doctype html>
<html lang="${esc(r.lang ?? 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(r.title)}</title>
<meta name="description" content="${esc(r.description ?? r.title)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@600;700&family=Public+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: light dark;
    --page: light-dark(#f7f7f7, #1a1a1a); --raised: light-dark(#ffffff, #242322);
    --text: light-dark(#1a1a1a, #ececec); --text-2: light-dark(#373636, #cecdcd);
    --link: light-dark(#0760c6, #93c0fa); --line: light-dark(#dddbdb, #3d3c3b); --focus: light-dark(#0974eb, #9fc8fa);
    --ok: light-dark(#14662f, #8fd6a4); --open: light-dark(#8a3b00, #f2b483); --review: light-dark(#5a3a99, #c7b2f2);
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--page); color: var(--text); font: 1.0625rem/1.6 "Public Sans", system-ui, sans-serif; }
  .wrap { max-width: 48rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  .skip { position: absolute; left: -999px; }
  .skip:focus { left: 1rem; top: 1rem; background: var(--raised); padding: .5rem 1rem; z-index: 1; }
  a { color: var(--link); text-underline-offset: .15em; }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 2px; }
  nav.crumbs { font-size: .9375rem; color: var(--text-2); margin-bottom: 2rem; }
  nav.crumbs ol { list-style: none; padding: 0; margin: 0; display: flex; gap: .5rem; flex-wrap: wrap; }
  nav.crumbs li + li::before { content: "/"; margin-right: .5rem; }
  h1, h2, h3 { font-family: "Atkinson Hyperlegible Next", "Public Sans", system-ui, sans-serif; line-height: 1.2; }
  h1 { font-size: clamp(1.625rem, 1.29rem + 1.67vw, 2.75rem); margin: 0 0 1rem; }
  h2 { font-size: clamp(1.375rem, 1.19rem + .93vw, 2rem); margin: 3rem 0 1rem; }
  h3 { font-size: 1.375rem; margin: 2.5rem 0 1rem; }
  .lede { font-size: 1.1875rem; }
  .note { background: var(--raised); border: 1px solid var(--line); border-radius: .5rem; padding: 1rem 1.25rem; }
  .note p { margin: .5rem 0; }
  ol.findings, ol.recs { padding-left: 0; list-style: none; }
  .finding-item, ol.recs li { background: var(--raised); border: 1px solid var(--line); border-radius: .5rem; padding: .75rem 1.25rem; margin: .75rem 0; }
  .finding-item p { margin: .4rem 0; }
  .finding-head { font-size: 1.0625rem; }
  .status { display: inline-block; font-size: .8125rem; font-weight: 600; letter-spacing: .02em; padding: .1rem .5rem; border: 1.5px solid currentColor; border-radius: 999px; margin-right: .35rem; }
  .status-fixed { color: var(--ok); } .status-open { color: var(--open); } .status-in-review { color: var(--review); } .status-not-the-page { color: var(--text-2); }
  .fix { color: var(--text-2); }
  ol.steps { padding-left: 1.5rem; } ol.steps li { margin: .75rem 0; }
  .goal, .status-line, .who-line { display: block; color: var(--text-2); }
  .video { border-top: 1px solid var(--line); }
  video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; background: #000; border-radius: .5rem; }
  .meta { font-size: .9375rem; color: var(--text-2); margin: .5rem 0 1rem; }
  .finding { border-left: 4px solid var(--line); padding-left: 1rem; }
  details { margin-top: 1rem; } summary { cursor: pointer; font-weight: 600; color: var(--link); }
  ol.transcript { list-style: none; padding: 0; font-size: .9375rem; } ol.transcript li { margin: .5rem 0; }
  .time { font-variant-numeric: tabular-nums; color: var(--text-2); margin-right: .25rem; }
  .who { font-weight: 600; margin-right: .25rem; }
  footer { margin-top: 4rem; color: var(--text-2); font-size: .9375rem; }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">${crumbs}
  <main id="main">
    <h1>${esc(r.title)}</h1>
    <p class="lede">${r.lede}</p>

    <h2 id="brief">The brief</h2>
    ${(r.brief?.summary ?? []).map(p => `<p>${p}</p>`).join('\n    ')}
    <ol class="findings">${findings}
    </ol>

    <div class="note">
      ${(r.notes ?? []).map(n => `<p><strong>${n.label}</strong> ${n.text}</p>`).join('\n      ')}
    </div>

    <h2 id="steps">How it was tested</h2>
    <ol class="steps">${steps}
    </ol>

    <h2 id="videos">The videos</h2>${videos}

    <h2 id="recommendations">Recommendations: test with people with disabilities</h2>
    <p>${r.recommendationsIntro ?? 'This was a first pass. It shows whether things work as built, not whether they help the people they are for. These need people with disabilities, using their own devices and settings:'}</p>
    ${recVideo}
    <ol class="recs">${recommendations}
    </ol>
  </main>

  <footer>
    <p>${r.footer ?? ''}</p>
  </footer>
</div>
</body>
</html>
`
fs.writeFileSync(out, page)

// The README. Text from report.json keeps its inline HTML (links, <strong>), which GitHub renders.
// Transcript lines are the video's own words, so markdown's characters in them are escaped.
const md = s => String(s).replace(/[\\`*_[\]<>|]/g, c => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : `\\${c}`))
// A still from 40% of the way in: past the introductions, on the page being tested.
const still = v => {
  const file = path.join(dir, `${v.stem}.jpg`)
  const at = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
    path.join(dir, `${v.stem}.mp4`)], { encoding: 'utf8' }).trim()) * 0.4
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', at.toFixed(2), '-i', path.join(dir, `${v.stem}.mp4`), '-frames:v', '1',
    '-vf', 'scale=1280:-2', '-q:v', '4', file])
  return `${v.stem}.jpg`
}
const mdTranscript = stem => fs.readFileSync(path.join(dir, `${stem}.transcript.txt`), 'utf8').split('\n')
  .map(line => line.match(/^\[([\d.]+)\] ([A-Z][A-Za-z]+): (.*)$/))
  .filter(Boolean)
  .map(([, t, who, text]) => `- ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} **${who}:** ${md(text)}`)
  .join('\n')
const mdVideo = (v, heading = '###') => {
  const len = length(v.stem)
  return `<a id="${v.id}"></a>

${heading} ${v.title}

[![Still from the video: ${md(v.title).replace(/\]/g, '')}. Opens the video, ${len}.](${still(v)})](${v.stem}.mp4)

[Watch the video](${v.stem}.mp4) (${len}, captions on screen and as a track) · [captions file](${v.stem}.vtt) · [transcript as text](${v.stem}.transcript.txt)

${v.about}
${v.finding ? `\n**Finding.** ${v.finding}\n` : ''}
<details>
<summary>Transcript</summary>

${mdTranscript(v.stem)}

</details>
`
}
const readme = `# ${r.title}

${r.lede}

Each still opens its video. To watch them in the page, with captions you can turn on and off, download this folder and open [index.html](index.html) in a browser.

## The brief

${(r.brief?.summary ?? []).join('\n\n')}

${(r.brief?.findings ?? []).map(f => `- **${STATUS[f.status] ?? f.status}: ${f.title}.** ${f.plain}${f.fix ? `<br>${f.fix}` : ''}<br>${f.criterion ? `${f.criterion}` : ''}${f.video ? `${f.criterion ? ' · ' : ''}[Watch it](#${f.video})` : ''}`).join('\n')}

${(r.notes ?? []).map(n => `> **${n.label}** ${n.text}`).join('\n>\n')}

## How it was tested

${(r.steps ?? []).map((s, i) => `${i + 1}. **${s.title}.** Goal: ${s.goal} ${s.video ? `[Video](#${s.video})` : 'Not filmed.'}`).join('\n')}

## The videos

${r.videos.map(v => mdVideo(v)).join('\n')}
## Recommendations: test with people with disabilities

${r.recommendationsIntro ?? 'This was a first pass. It shows whether things work as built, not whether they help the people they are for. These need people with disabilities, using their own devices and settings:'}

${r.recommendationsVideo ? mdVideo(r.recommendationsVideo) : ''}
${r.recommendations.map(x => `- **${x.area}.** ${x.why}${x.who ? `<br>Who: ${x.who}` : ''}`).join('\n')}

---

${r.footer ?? ''}
`
fs.writeFileSync(path.join(dir, 'README.md'), readme)
console.log(`${out}: ${r.videos.length} videos, ${(r.brief?.findings ?? []).length} findings, ${r.recommendations.length} recommendations, and README.md`)
