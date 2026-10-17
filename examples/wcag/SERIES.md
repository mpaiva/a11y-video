# Series: one WCAG success criterion per video

One short video per success criterion: a barrier on a small page built for it, heard with the real
VoiceOver in Safari, named by the reviewer, fixed, and re-tested with the same commands on the fixed
page. Each criterion has its own folder here with a `before/` and an `after/` page (served with
`serve-static.mjs`), the two narrators' lines and the scenes. Same layout across the series: display 2
(the smaller one), VoiceOver's panel below Safari, the tester (af_heart) and the reviewer (am_puck) from
`menu-stall/duo`.

Every video opens with the tester and the reviewer introducing themselves (`t-hello`, `r-hello`, the same
words in each), so each one stands on its own. Then the reviewer names the criterion.

The pages are written for the film: one barrier each, everything else on the page sound, so the take
shows the criterion and nothing else.

| Criterion | Folder | Barrier | Fix | Status |
|-----------|--------|---------|-----|--------|
| 1.1.1 Non-text Content | `1.1.1-non-text-content/` | A bar chart as an `<img>` with no `alt`; VoiceOver reads its file name, "q3-sales.svg image" | `alt` naming the chart type and its three numbers | **Video 1** (2:04, captioned), October 17, 2026 |
| 2.4.4 Link Purpose (In Context) | `2.4.4-link-purpose/` | Three stories, each ending in "Read more"; titles are styled `<div>`s and each link sits alone, so nothing ties a link to its story. VO-Command-L: "Read more, link" three times | Visually hidden text adds the title to each link's name | **Video 1** (1:58, captioned), October 17, 2026 |
| 4.1.2 Name, Role, Value | `4.1.2-name-role-value/` | Two toggle switches built from `<div>`s, operable by mouse and keyboard; VoiceOver's reading pass never reaches them | `<button role="switch" aria-checked>` named by its label with `aria-labelledby` | **Video 1** (2:21, captioned), October 17, 2026: the pilot's draft 3 with the introductions added |

`report.json` is the report of these three (`node tools/a11y-demo/report.mjs report.json <dir>/index.html`, with
the videos beside it as `wcag-1-1-1`, `wcag-2-4-4` and `wcag-4-1-2`). Each criterion's `check-before.json`
and `check-after.json` are its finding check (VoiceOver only, no narration); a film of them with
`"lines": []` composes into a captioned clip of the check. Ports: 4.1.2 on 4611/4612, 1.1.1 on 4621/4622, 2.4.4 on 4631/4632.

Still to plan: the intro video (the skill wants one first), and which criteria follow. Criteria a screen
reader or the keyboard can show come first; visual ones (contrast, reflow) need a capture of their own.

## Running one

```sh
D=~/Downloads/a11y-wcag-series/4.1.2; E=examples/wcag/4.1.2-name-role-value
mkdir -p "$D" && cp $E/*.json "$D/"
node tools/a11y-demo/serve-static.mjs $E/before 4611 &
node tools/a11y-demo/serve-static.mjs $E/after 4612 &
uv run --locked tools/demo-video/voice.py "$D/lines-tester.json" --project "$D/video"
uv run --locked tools/demo-video/voice.py "$D/lines-reviewer.json" --project "$D/video"
node tools/a11y-demo/run-scene.mjs "$D/before.json" "$D/takes"
node tools/a11y-demo/run-scene.mjs "$D/after.json" "$D/takes"
node tools/a11y-demo/compose.mjs "$D/film.json" "$D/draft-1.mp4" --draft
```
