// List every example report: examples/index.html for the GitHub Pages site, and examples/README.md for
// someone browsing the repository on GitHub.
//
//   node tools/a11y-demo/examples-index.mjs [examples-dir]
//
// An example is any folder under examples/ with a report.json and the report report.mjs built beside it
// (index.html, README.md, the videos and their stills). Its title and description come from report.json,
// so a new example is listed by building its report and running this again. Each entry shows a still
// from the video of its first finding, how many videos and minutes it has, and its findings by status.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..', '..', 'examples'))
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// Text from report.json may hold inline HTML; the list shows it as plain text.
const plain = s => String(s ?? '').replace(/<[^>]+>/g, '')

// The repository's page on GitHub, for links to each example's files. Read from the origin remote.
let repo = ''
try {
  repo = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()
    .replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')
} catch { /* no remote: no source links */ }
const repoRoot = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()

const found = []
// A folder before the examples inside it (menu-stall, then menu-stall/duo).
const walk = dir => {
  if (fs.existsSync(path.join(dir, 'report.json'))) found.push(dir)
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) walk(path.join(dir, e.name))
  }
}
walk(root)
if (!found.length) throw new Error(`No report.json under ${root}.`)

const seconds = file => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
  { encoding: 'utf8' }).trim())
const STATUS = { fixed: 'fixed', open: 'open', 'in-review': 'fix in review', 'not-the-page': 'not the page' }

const examples = found.map(dir => {
  const r = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8'))
  const rel = path.relative(root, dir)
  for (const f of ['index.html', 'README.md']) {
    if (!fs.existsSync(path.join(dir, f))) throw new Error(`${rel}/${f} is missing: build the report with report.mjs first.`)
  }
  const videos = [...r.videos, ...(r.recommendationsVideo ? [r.recommendationsVideo] : [])]
  const total = videos.reduce((sum, v) => sum + seconds(path.join(dir, `${v.stem}.mp4`)), 0)
  const findings = r.brief?.findings ?? []
  const counts = {}
  for (const f of findings) counts[f.status] = (counts[f.status] ?? 0) + 1
  const shown = videos.find(v => v.id === findings[0]?.video) ?? videos[0]
  return {
    rel, title: r.title, description: plain(r.description ?? r.lede), videos: videos.length,
    minutes: Math.round(total / 60), findings: findings.length, counts,
    // Only the criteria a finding failed: a finding's "criterion" can also be a note ("WCAG 2.4.4 Link
    // Purpose is met; a listening cost", "VoiceOver in Safari").
    criteria: [...new Set(findings.filter(f => f.status !== 'not-the-page').map(f => f.criterion)
      .filter(c => /^WCAG \d+\.\d+\.\d+ [^;]+$/.test(c ?? '') && !/ is met$/.test(c)))],
    still: fs.existsSync(path.join(dir, `${shown.stem}.jpg`)) ? `${rel}/${shown.stem}.jpg` : null,
    stillOf: plain(shown.title),
    source: repo ? `${repo}/tree/main/${path.relative(repoRoot, dir)}` : null,
  }
})

const statusLine = e => Object.entries(e.counts).map(([s, n]) => `${n} ${STATUS[s] ?? s}`).join(', ')

const cards = examples.map(e => `
      <li class="card">
        ${e.still ? `<img src="${esc(e.still)}" alt="" loading="lazy">` : ''}
        <div class="body">
          <h3><a href="${esc(e.rel)}/">${esc(e.title)}</a></h3>
          <p>${esc(e.description)}</p>
          <p class="facts">${e.videos} videos, about ${e.minutes} minutes, captioned, with transcripts.
            ${e.findings} findings: ${esc(statusLine(e))}.</p>
          ${e.criteria.length ? `<p class="facts">Criteria: ${e.criteria.map(esc).join(' · ')}</p>` : ''}
          <p class="links"><a href="${esc(e.rel)}/">Read the report and watch the videos</a>${e.source ? ` · <a href="${esc(e.source)}">Scenes, lines and films on GitHub</a>` : ''}</p>
        </div>
      </li>`).join('')

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Examples · a11y-video</title>
<meta name="description" content="Worked examples of the a11y-demo skill: screen-reader tests filmed with the real VoiceOver, each with its report, videos, captions and transcripts.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@600;700&family=Public+Sans:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="../">a11y-video</a></li>
      <li><span aria-current="page">Examples</span></li>
    </ol>
  </nav>
  <main id="main">
    <h1>Examples</h1>
    <p class="lede">Each example is a first-pass accessibility test made with the a11y-demo skill: real VoiceOver in
      Safari, filmed and narrated, with every barrier named by its WCAG criterion, fixed, and heard again. Each one
      is a report you can read, with its videos, captions and transcripts.</p>
    <h2>All examples</h2>
    <ul class="cards">${cards}
    </ul>
    <h2>Make your own</h2>
    <p>Each example's folder holds the files that made it: the scene files the runner plays, the narrator's lines,
      and the film files that cut the videos. Copy one into a work folder and rewrite it for your page; the
      <a href="../#use-it">instructions on the home page</a> cover the setup.</p>
  </main>
  <footer>
    <p>This list is built by <code>tools/a11y-demo/examples-index.mjs</code> from each example's <code>report.json</code>.</p>
  </footer>
</div>
</body>
</html>
`
fs.writeFileSync(path.join(root, 'index.html'), page)

const readme = `# Examples

Each example is a first-pass accessibility test made with the a11y-demo skill: real VoiceOver in Safari,
filmed and narrated, with every barrier named by its WCAG criterion, fixed, and heard again. Open a folder:
its README is the report, with the videos. The same reports, with the videos playing in the page, are on
the project's GitHub Pages site.

${examples.map(e => `## [${e.title}](${e.rel}/)

${e.still ? `[![Still from the video: ${e.stillOf.replace(/[[\]]/g, '')}.](${e.still})](${e.rel}/)\n\n` : ''}${e.description}

${e.videos} videos, about ${e.minutes} minutes, captioned, with transcripts. ${e.findings} findings: ${statusLine(e)}.${e.criteria.length ? `\n\nCriteria: ${e.criteria.join(' · ')}` : ''}
`).join('\n')}
---

Built by \`tools/a11y-demo/examples-index.mjs\` from each example's \`report.json\`.
`
fs.writeFileSync(path.join(root, 'README.md'), readme)
console.log(`${path.join(root, 'index.html')} and README.md: ${examples.map(e => e.rel).join(', ')}`)
