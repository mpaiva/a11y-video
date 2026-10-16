---
name: demo-video
description: >-
  Make a narrated product walkthrough video of a real ClearCo flow for customer feedback —
  intake interview, capability check, script, demo data, natural-motion screen capture,
  storyboard pick, Kokoro voice, HyperFrames edit, second-by-second film review, final
  renders. Use for "make a demo video", "record a walkthrough for <customer>", "redo the demo
  with the new UI", or a reviewer's notes on a demo cut.
---

# Product demo video

A gated recipe for a 1–3 minute narrated walkthrough of a **real** flow in the local app, shown
to customers to get product feedback. It is not a marketing video. Everything here was learned on
the Tallgrass field-training demo (29 Sep – 1 Oct 2026, five drafts); the `references/` hold the
before/after examples, so read them instead of rediscovering them.

Work files (raw takes, databases, the HyperFrames project, renders) live **outside the repo** in
one demo folder, e.g. `~/Downloads/<demo-slug>/`. Nothing customer-identifying ever goes on
screen or into the repo: the cast is fictional, and customer evidence is paraphrased.

## Setup (before gate 0)

The skill is tested on a Mac. On Windows 11 a whole demo (recording, voice, a cut, film review) was made
on 2026-10-12, with gates 0 and 7 run by a different route (see "Windows path" below). Tell a Windows
requester it is the less-tested path before the intake.

On a Mac run `tools/demo-video/doctor.sh`. On Windows run
`powershell -NoProfile -File tools/demo-video/doctor.ps1` instead. If any row says MISSING, follow
`references/setup.md`: it explains each tool in plain words for a requester who has never used them,
and installs nothing without a yes. Do not start the intake until the script prints "Ready." The
commands for every tool are in `tools/demo-video/README.md` and, for Windows, `references/setup.md`
section 6.

## Models and effort

| Work | Model | Why |
|------|-------|-----|
| This session: script, build, cut, fixes (gates 2, 7, 9, 10) | Opus 5.5, effort high or xhigh | Motion, timing and pacing are judgment calls. If the session runs another model, ask the requester to switch (`/model opus`) before gate 7. In Codex, stop after gate 6 and continue in Claude Code. |
| `storyboarder` (gate 5) | Opus 5.5, high | Taste: three distinct options from real stills. |
| `film-reviewer` (gate 8) | Opus 5.5, xhigh | A review; it must catch one-frame glitches. |
| `explorer` (gate 1) | its own definition | Read-only code search. |
| `reference-breaker` (optional) | Sonnet 5.5, medium | Analysis of a reference video. |
| Capture (gates 3, 4) | Codex, its configured default | Mechanical: app stack, databases, recorded takes. |

Never use Fable or Haiku for any gate.

## The gates

Run them in order. Do not start a gate until the previous gate's exit evidence exists. Nothing
starts before gate 0 is done. The person who asked for the video approves gates 2, 5 and 9;
everything else you decide and note. Later gates cite `BRIEF.md`, never the conversation.

| # | Gate | Owner | Exit evidence |
|---|------|-------|---------------|
| 0 | **Intake interview** | You, with the requester — `references/intake.md` | `BRIEF.md` in the demo folder (from `references/templates/brief.md`) recording every answer, every default applied, the artifacts read (or "none provided" for any the requester did not give), and the open questions. |
| 1 | **Capability check** | `explorer` agent; `docs/gtm/claim-register.md` is binding | A built / partial / not-built table with `file:line` evidence for every beat in the brief, and the list of things the video must not show or say. A stale claim-register row is flagged to the requester, not silently followed or ignored. |
| 2 | **Narrative and voice script** | You, using `references/narration.md` | Scene list plus one voice line per scene (no style tags — Kokoro reads them aloud), every line describing behaviour that ran in the app, every prevalence claim checked against the brief's customer evidence. Requester approves, and picks the narrator's voice by ear from the first line in three voices (Kokoro has no tone directions, so the voice sets the tone; `references/narration.md`). The pick is in `BRIEF.md`. |
| 3 | **Demo data** | You or Codex | One isolated database copy per story state (for example *before* and *after* the worker finishes a course), a manifest of what was seeded, and screenshots proving each state. `references/fixture.md` lists the traps. |
| 4 | **Natural-motion capture** | Codex or you, with `tools/demo-video/rec-lib.mjs` | One continuous take per scene, a `<take>-marks.json` each, freeze detection at −60 and −90 dB, a README with the database used per take. Hand Codex `references/templates/capture-handoff.md`. Spec: `references/capture.md`. |
| 5 | **Storyboard pick** | `storyboarder` agent | `boards.png` with three options (A/B/C) built only from real stills; the requester picks one; then one still per scene of the pick. Use `references/templates/shot-list.md` as its input. |
| 6 | **Voice takes** | `uv run --locked tools/demo-video/voice.py` (Kokoro, runs locally) + `pick-takes.py` | One take per line named `<line-id>-<n>.mp3` (repeat Kokoro takes are almost identical; change the words or punctuation instead); `pick-takes.py --write-edl` has written each line's take into its EDL voice line's `take`, unless a line is pinned; loudness numbers recorded. |
| 7 | **Build and draft render** | You, with the HyperFrames skills (`/hyperframes` first, then `hyperframes-core`) and `tools/demo-video/build.py` (`init` → `stage` → `check` → `build`) | An EDL JSON for the cut whose `rawDir`, `sources`, `stills` and `voiceDir` name every input, `build.py check` green (it fails on any missing media), `npm run check` with no errors (always the project's npm scripts — they run the pinned CLI), a draft from `npm run render -- --quality draft --fps 30 -o ../draft-1.mp4`, `qa.sh` with the freeze rule passing (or each P1 freeze listed), and a transcript that matches the script word for word. Recipes: `references/edit-recipes.md`. |
| 8 | **Film review** | `film-reviewer` agent, plus a customer-reaction review by the persona agent named in the brief (for example `dana`, the fictional L&D lead, or `daneen` / `marissa` for onboarding-admin viewers); skip the persona part when the brief names none | A P0/P1/P2 table with timestamps and evidence frames, checked against `references/review-checklist.md`, and the persona's reaction in its own words. |
| 9 | **Fix and show the draft** | You | Every P0 fixed and re-verified with a 10 fps frame strip around the spot; then the requester watches the draft. One review round per change — fix P0s and clear P1s, then show it. |
| 10 | **Final renders** | You | After the requester approves: a full-quality narrated render, a silent version with the identical picture (`ffmpeg -i narrated.mp4 -an -c:v copy silent.mp4`), and a `WATCH.md` (sources, takes used, QA results). |

### Windows path (gates 0 and 7)

Gates 1–6 and 8–10 are the same on Windows. Gates 0 and 7 swap their tools, and each keeps its exit
evidence:

- **Gate 0:** `doctor.ps1` prints "Ready." (instead of `doctor.sh`).
- **Gate 7:** the cut is `node tools/demo-video/ffmpeg-cut.mjs <scenes.json> <out.mp4>` (instead of
  HyperFrames and `build.py`; the scenes file is described at the top of `ffmpeg-cut.mjs`, with a worked
  example). It writes the draft and `<out>.edl.json`, which lists the scene starts and the narrated holds.
  Exit evidence: `qa.sh <out.mp4> <dir> <out>.edl.json` with the freeze rule passing (or each P1 freeze
  listed), the format row reading `h264`, `High`, `yuv420p` and `aac` with `sample_rate=48000
  channels=2`, and the transcript `qa.sh` writes (faster-whisper `small.en` through `uv` when `whisper-cli`
  is absent) matching the script word for word, a homophone aside. The cut has no phone poses or insets:
  a demo that needs them still needs HyperFrames on a Mac.
- **Gate 10:** the same command without `--draft` for the full-quality render, then the silent copy as above.

Run on Windows on 2026-10-12: `doctor.ps1`, the voice script, the recorder, `ffmpeg-cut.mjs` with `--draft`,
`qa.sh` end to end with its transcript, and film-review rounds. Not run on Windows: HyperFrames, `build.py`,
`pick-takes.py`, and `ffmpeg-cut.mjs` without `--draft`.

## Gate 0 — the intake interview

One round, at most 8 questions: feature, viewer and goal, customer evidence, personas and cast,
workflow, must and must-not show, environment and data, format. `references/intake.md` has the
questions, how to ask them, the defaults and a worked example. Read every artifact the requester
gives before you write `BRIEF.md`.

## How the pieces fit

```
intake ─► capability check ─► script ─► demo data ─► capture ─► storyboard pick
                                                                     │
final renders ◄─ requester approves ◄─ fix P0s ◄─ film review ◄─ draft build ◄─ voice takes
```

- **Codex as the capture crew.** In the Tallgrass demo, Codex owned the app stack and the demo
  databases and recorded the takes; the editing session owned story, voice and cut. Hand Codex a
  self-contained brief (`references/templates/capture-handoff.md`); hand it later fixes as a
  numbered list (`references/templates/fix-list.md`). Put the paste-ready text on the clipboard
  for the requester.
- **When the product changes mid-demo** (a merged UI refresh), re-capture only the takes whose
  screens visibly changed, keep the EDL, and remap in-points from the new marks files.
- **When a human reviewer sends notes**, treat each note as a finding: decide it, change the EDL or
  script, re-render the draft, and say what changed in one line per note. If a note conflicts with
  an earlier instruction from the requester (for example "show the completed course" versus "hide
  completion timestamps"), say so and recommend one.

## Rules that bind every gate

- Show only behaviour that ran in the app. Real UI and real state; crops and slow push-ins are
  fine; painted or mocked UI is not. The only editorial text allowed is a small time-jump caption.
- No end card, no tagline, no question to the viewer, no music unless the brief asks for it.
- Use the product's exact terms. If the UI label is wrong (the Tallgrass builder said "Hire date"
  for a start date), the narration follows the product's real behaviour and the label bug is
  reported, not copied.
- Never cut out a problem the requester would want to know about; report it.
