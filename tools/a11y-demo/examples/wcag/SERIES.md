# Series: one WCAG success criterion per video

One short video per success criterion: a barrier on a small page built for it, heard with the real
VoiceOver in Safari, named by the reviewer, fixed, and re-tested with the same commands on the fixed
page. Each criterion has its own folder here with a `before/` and an `after/` page (served with
`serve-static.mjs`), the two narrators' lines and the scenes. Same layout across the series: display 2
(the smaller one), VoiceOver's panel below Safari, the tester (af_heart) and the reviewer (am_puck) from
`menu-stall/duo`.

The pages are written for the film: one barrier each, everything else on the page sound, so the take
shows the criterion and nothing else.

| Criterion | Folder | Barrier | Fix | Status |
|-----------|--------|---------|-----|--------|
| 4.1.2 Name, Role, Value | `4.1.2-name-role-value/` | Two toggle switches built from `<div>`s, operable by mouse and keyboard; VoiceOver's reading pass never reaches them | `<button role="switch" aria-checked>` named by its label with `aria-labelledby` | **Pilot, draft 3** (2:03, captioned), October 17, 2026 |

Still to plan: the intro video (the skill wants one first), and which criteria follow. Criteria a screen
reader or the keyboard can show come first; visual ones (contrast, reflow) need a capture of their own.

## Running one

```sh
D=~/Downloads/a11y-wcag-series/4.1.2; E=tools/a11y-demo/examples/wcag/4.1.2-name-role-value
mkdir -p "$D" && cp $E/*.json "$D/"
node tools/a11y-demo/serve-static.mjs $E/before 4611 &
node tools/a11y-demo/serve-static.mjs $E/after 4612 &
uv run --locked tools/demo-video/voice.py "$D/lines-tester.json" --project "$D/video"
uv run --locked tools/demo-video/voice.py "$D/lines-reviewer.json" --project "$D/video"
node tools/a11y-demo/run-scene.mjs "$D/before.json" "$D/takes"
node tools/a11y-demo/run-scene.mjs "$D/after.json" "$D/takes"
node tools/a11y-demo/compose.mjs "$D/film.json" "$D/draft-1.mp4" --draft
```
