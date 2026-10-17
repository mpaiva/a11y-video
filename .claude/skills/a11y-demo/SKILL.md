---
name: a11y-demo
description: >-
  A first-pass accessibility test of a web page with the real VoiceOver in Safari, filmed and fixed as
  it goes: an intro that sets out the steps, one short narrated video per step, every violation named
  with its WCAG criterion and why it matters, the code fixed and re-tested on camera right after, and a
  plain-language report with the videos and recommendations for testing with disabled people. Use for
  "test this page with a screen reader", "record an accessibility testing demo", "film a VoiceOver test
  of <page>", "show this screen-reader bug and its fix", "make a before/after accessibility video", or a
  reviewer's notes on one of these. For a product walkthrough with no screen reader, use demo-video.
---

# Accessibility test demo

A gated recipe for testing a page with a screen reader on film, and fixing what it finds. It is the
`demo-video` skill (`.claude/skills/demo-video/`) with its capture and edit swapped for ones a screen
reader needs; the brief, the script approval, the voice picked by ear, the film review and the final
renders are demo-video's. Read its `SKILL.md` and `references/` for those; this file says what changes.

## What a run is, and what it is not

1. **A first pass, before testing with people with disabilities.** A specialist with a screen reader
   finds the barriers that don't need a disabled person to find, so the time spent with disabled
   people goes on what only they can tell you. It never stands in for them, and every output says so.
2. **The goal is to find accessibility issues early and fix them.** A run that finds a problem and
   leaves it is half done: the fix and its re-test are part of the run, not a follow-up.
3. **It always starts with an intro** that says what will be tested, why, and the steps it will take
   (the testing sequence in `references/specialist.md`), so a viewer knows what to expect from every
   video after it.
4. **Every violation is named and explained when it is found:** the WCAG criterion by number and
   name, and why it matters, in one sentence from the side of the person it stops ("If you're
   listening, it sounds like the page has stopped"). `references/specialist.md` has the pattern.
5. **Right after a violation, the code is fixed and the scene re-shot,** so the same video shows
   before and after: the same commands on the fixed build, the criterion holding. See "Fix and
   re-test" below.
6. **The run ends in a report:** a plain-language brief anyone can read in a minute (what was tested,
   what was found, what was fixed, what is still open), with the videos along the way, each with its
   finding, captions and transcript (`tools/a11y-demo/report.mjs`).
7. **The report always ends with recommendations:** the areas that should be tested and validated
   with people with disabilities, and why each one needs them. A screen-reader pass can't say
   whether something helps, only whether it works as built.

It is evidence on film, so demo-video's rule binds it: **only behaviour that ran.**

## Why a different capture

demo-video records Chromium with Playwright. VoiceOver is not meaningfully tested that way: its users
use Safari, and what Safari exposes to VoiceOver is the thing under test. So the capture here is the
real VoiceOver in the real Safari, driven by Guidepup (`tools/a11y-demo/vo-lib.mjs`), with:

- **the picture**: Safari's window only, never the whole screen (anything else open would be filmed),
  on the display the scene names (`"display"`, 1 = main), with VoiceOver's own caption panel dragged
  beside it (`"panel": "right"`, `"below"` or `"none"`) and filmed in the same rectangle. The panel is
  what VoiceOver displayed, not a caption added later; Guidepup forgets where it was, so the runner
  places it at the start of every take;
- **VoiceOver's voice**: recorded from BlackHole, a loopback audio device set as the Mac's output for
  the take, so the film plays exactly what VoiceOver said, at the speed it said it. The runner listens
  as it records: it knows when a phrase has ended, and stops VoiceOver's spoken hint before it starts;
- **the phrase log**: what VoiceOver said at every step, with times, which drives the caption bar and
  is checked against the narration.

## The narrator's pauses are built into the take

The narration is written and voiced **before** the capture (gate 2 and gate 6 move ahead of gate 4).
Each scene is a list of steps (`tools/a11y-demo/run-scene.mjs`): a `say` step waits exactly as long
as its Kokoro take and does nothing, a `do` step presses a VoiceOver command and waits for the whole
phrase. So VoiceOver and the narrator never talk over each other, and the edit lays each narrator line
into the silence its step left. Changing a line's words changes its length: re-voice it and re-shoot
that scene.

## The gates (what changes from demo-video)

| # | Gate | Change |
|---|------|--------|
| 0 | Intake | The first video is always the intro (the steps, the goal, the page and builds). Ask also: which pages and which builds (a before/after story needs both served), what the tester is meant to find, which steps of the testing sequence the film shows (`references/specialist.md`), and who watches (`references/specialist.md` has the stories that work). Setup is `references/setup.md`, not demo-video's doctor alone. |
| 1 | Capability check | Becomes a **finding check**: run the scene once with no narration (or jupiter's `voiceover-test` recorder) and confirm VoiceOver does what the story claims, quoting the phrase log. A finding that doesn't reproduce is not filmed. |
| 2 | Script | The specialist's narration, per `references/specialist.md`, plus the scene files. Every claim about what VoiceOver says is checked against the finding check's phrase log. The requester approves and picks the voice by ear (demo-video's narration.md). |
| 3 | Demo data | Usually two **builds** instead of databases: the page before and after the fix, each served on its own port (`tools/a11y-demo/serve-static.mjs`). |
| 6 → before 4 | Voice takes | `voice.py` on the lines file, before capture, because the takes set the pauses. |
| 4 | Capture | `node tools/a11y-demo/run-scene.mjs <scene.json> <demo>/takes`, one scene at a time, nobody touching the Mac. Read its printed phrase list straight away: if a line of the script no longer matches what VoiceOver said, fix the script or the scene, re-voice, re-shoot. If it stops with "screencapture stopped filming. Redo the take.", the picture ended well before the last VoiceOver or key step did (once at 3 s in a 74 s take): re-shoot the scene, never cut it. |
| 5 | Storyboard | Usually skipped: the picture is Safari's window. Keep it when a scene has a choice of crop. |
| 7 | Build | `node tools/a11y-demo/compose.mjs <film.json> <demo>/draft-1.mp4 --draft`, then demo-video's `qa.sh` with `draft-1.mp4.edl.json`. Not HyperFrames: the film is full-frame Safari plus a caption bar, and Homebrew's ffmpeg draws no text, so the bar is drawn in Chromium. |
| 7b | Fix and re-test | For each violation the run found: fix the code (on a branch of the project, with its own checks passing), build and serve the fixed page, verify by ear that the criterion now holds, then shoot a re-test scene (the same commands on the fixed build) and compose it as the next scene of the same video. A fix that can't be made now is reported as open, with why. |
| 8–10 | Review, fix, final | As demo-video, plus the checks in `references/specialist.md` ("Reviewing the cut"). The final render drops `--draft`. Check every video has its captions track (`ffprobe` shows a `mov_text` stream) and ship `<out>.vtt` and `<out>.transcript.txt` with it. |

## Fix and re-test

When a take shows a violation:

1. **Name it on camera, then and there:** what VoiceOver said, the criterion (number and name), and why
   it matters to the person it stops (`references/specialist.md`, "Saying the finding").
2. **Fix it in the code.** The smallest change that removes the barrier, on a branch of the project,
   with the project's own checks passing. If the project belongs to someone else, or the fix needs a
   decision, stop and ask; never cut the finding instead.
3. **Verify by ear before filming.** Build the fixed page, serve it (`serve-static.mjs`), and run the
   same steps with the runner, listening to the audio, not the phrase log (an announcement at the end
   of an utterance is missing from the log; `"expect"` makes compose check it with a transcript).
4. **Shoot the re-test** with the same commands, and add it as the next scene of the same video, after
   one narrator line on what changed in the code. The narrator says the criterion holds only when the
   take shows it.
5. **Record it in the report:** fixed (with the commit), or open (with why).

## The report

`node tools/a11y-demo/report.mjs <report.json> <out-dir>/index.html` builds the report page from a
small data file (worked example: `examples/menu-stall/report.json`), next to the videos:

- **The brief, first, in plain language:** what was tested and how, then each finding in one or two
  sentences a non-specialist understands, with its status (fixed, open, in review, or "not the page"
  when the cause is the browser or screen reader), the criterion, and a link to the video that shows it.
- **The videos along the way,** in the order of the testing sequence, each with its summary, finding,
  captions (on screen, as a track, as a file) and transcript.
- **Recommendations, last:** the areas to test and validate with people with disabilities, each with
  why a screen-reader pass can't settle it and who should take part.
- **What it is not:** a first pass by one specialist, one screen reader and one browser, not an audit
  and not a conformance claim.

The page meets the bar it reports on: real headings, captions on every video, transcripts, no
autoplay, light and dark, and no axe violations. Check it before sending it.

## Two narrators

A run can be narrated by two voices with jobs, which reads as a team and maps onto the four beats of a
finding: the **tester** (af_heart in the worked example) drives VoiceOver and the keyboard and says what
she hears; the **reviewer** (am_puck) names the guideline, why it matters, and what changed in the code.
The intro introduces both and how they split the work. Give each voice its own lines file (voice.py
takes one voice per file), and in `film.json` list both files under `"lines"` with
`"speakers": {"af_heart": "Tester", "am_puck": "Reviewer"}`: the captions, the track and the transcript
then label each line by role, not by a name. `examples/menu-stall/duo/` is the worked example.

## Rules that change

- **Every video is captioned, three ways, for both voices.** Open captions in the bar under the
  picture, labelled by speaker (VOICEOVER phrase by phrase, NARRATOR in timed cues of a sentence or
  clause); an English captions track inside the MP4, so a player offers them; and the same captions as
  a `.vtt` beside it, for platforms that take a separate file. `compose.mjs` makes all three; ship the
  `.vtt` and the transcript with every video. Captions show criterion numbers as figures ("WCAG 4.1.2")
  though the narrator says them as words.
- **On-screen text is captions and VoiceOver's own panel, nothing else:** no arrows, no callouts, no
  titles.
- **The film is accessible itself.** The narrator describes what matters on screen, so the picture
  needs no separate audio description; if a scene relies on something only seen, say it.
- **Never fake VoiceOver.** No `say` or Kokoro standing in for VoiceOver's speech, no edited phrases,
  no cutting out an awkward silence that is part of the finding. If the take has no VoiceOver audio,
  re-shoot; captions alone are not a substitute for the demo the requester asked for.
- **Quote the code's problem, not a person.** A finding names the component and the behaviour, never
  who wrote it.
- Everything else in demo-video's "Rules that bind every gate" holds: exact product terms, no end
  card, no tagline, no music unless asked, never cut out a problem the requester would want to know.

## Where things go

Work files live outside the repo, in one demo folder (for example `~/Downloads/<demo-slug>/`): the
builds being filmed, `voice-lines.json`, the scene files, `film.json`, `takes/`, `video/assets/voice/`,
drafts and finals. `tools/a11y-demo/examples/menu-stall/` is a complete worked example: a nine-video series testing
mpaiva.com's home page, with its scenes, lines, films, `SERIES.md` plan and `report.json`.

## Typical run

```sh
DEMO=~/Downloads/my-a11y-demo; T=tools/a11y-demo
cp $T/examples/menu-stall/*.json "$DEMO/"            # then rewrite the lines and scenes for your page
uv run --locked tools/demo-video/voice.py "$DEMO/voice-lines.json" --project "$DEMO/video"
node $T/run-scene.mjs "$DEMO/before.json" "$DEMO/takes"
node $T/run-scene.mjs "$DEMO/after.json" "$DEMO/takes"
node $T/compose.mjs "$DEMO/film.json" "$DEMO/draft-1.mp4" --draft
tools/demo-video/qa.sh "$DEMO/draft-1.mp4" "$DEMO/qa/draft-1" "$DEMO/draft-1.mp4.edl.json"
# ...one film per step, the intro first; each violation fixed and re-tested in its own video...
node $T/report.mjs "$DEMO/report.json" "$DEMO/series/index.html"   # brief, videos, recommendations
```

When a take goes wrong, suspect the run before the page: VoiceOver Utility open, keyboard focus left
in Safari's toolbar, a held Shift key, or another app in front. `vo-lib.mjs` guards against each, and
stops the take with a message when it can't.
