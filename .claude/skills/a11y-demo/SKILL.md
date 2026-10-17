---
name: a11y-demo
description: >-
  Make a narrated demo video of an accessibility test: a specialist testing a real web page with the
  real VoiceOver in Safari, VoiceOver's own voice on the soundtrack, a caption bar quoting what it
  announced, and a calm Kokoro narrator explaining what the tester is listening for, finds and
  re-tests. Use for "record an accessibility testing demo", "film a VoiceOver test of <page>", "show
  this screen-reader bug and its fix on video", "make a before/after accessibility video", or a
  reviewer's notes on one of these cuts. For a product walkthrough with no screen reader, use
  demo-video instead.
---

# Accessibility test demo

A gated recipe for a 1–3 minute film of an accessibility specialist testing a page with VoiceOver. It
is the `demo-video` skill (`.claude/skills/demo-video/`) with its capture and edit swapped for ones a
screen reader needs, and everything else kept: the brief, the script approval, the voice picked by ear,
the film review and the final renders. Read demo-video's `SKILL.md` and `references/` for those; this
file says only what changes.

What it is for: showing a team, a client or a class how a screen-reader user meets a page, what a
tester listens for, and what a real problem sounds like, ideally the problem, the fix and the re-test.
It is evidence on film, so the same rule binds it as demo-video: **only behaviour that ran.**

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
| 0 | Intake | Ask also: which pages and which builds (a before/after story needs both served), what the tester is meant to find, which steps of the testing sequence the film shows (`references/specialist.md`), and who watches (`references/specialist.md` has the stories that work). Setup is `references/setup.md`, not demo-video's doctor alone. |
| 1 | Capability check | Becomes a **finding check**: run the scene once with no narration (or jupiter's `voiceover-test` recorder) and confirm VoiceOver does what the story claims, quoting the phrase log. A finding that doesn't reproduce is not filmed. |
| 2 | Script | The specialist's narration, per `references/specialist.md`, plus the scene files. Every claim about what VoiceOver says is checked against the finding check's phrase log. The requester approves and picks the voice by ear (demo-video's narration.md). |
| 3 | Demo data | Usually two **builds** instead of databases: the page before and after the fix, each served on its own port (`tools/a11y-demo/serve-static.mjs`). |
| 6 → before 4 | Voice takes | `voice.py` on the lines file, before capture, because the takes set the pauses. |
| 4 | Capture | `node tools/a11y-demo/run-scene.mjs <scene.json> <demo>/takes`, one scene at a time, nobody touching the Mac. Read its printed phrase list straight away: if a line of the script no longer matches what VoiceOver said, fix the script or the scene, re-voice, re-shoot. |
| 5 | Storyboard | Usually skipped: the picture is Safari's window. Keep it when a scene has a choice of crop. |
| 7 | Build | `node tools/a11y-demo/compose.mjs <film.json> <demo>/draft-1.mp4 --draft`, then demo-video's `qa.sh` with `draft-1.mp4.edl.json`. Not HyperFrames: the film is full-frame Safari plus a caption bar, and Homebrew's ffmpeg draws no text, so the bar is drawn in Chromium. |
| 8–10 | Review, fix, final | As demo-video, plus the checks in `references/specialist.md` ("Reviewing the cut"). The final render drops `--draft`. Check every video has its captions track (`ffprobe` shows a `mov_text` stream) and ship `<out>.vtt` and `<out>.transcript.txt` with it. |

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
drafts and finals. `tools/a11y-demo/examples/menu-stall/` is a complete worked example: a real stall on
mpaiva.com, filmed before and after its fix.

## Typical run

```sh
DEMO=~/Downloads/my-a11y-demo; T=tools/a11y-demo
cp $T/examples/menu-stall/*.json "$DEMO/"            # then rewrite the lines and scenes for your page
uv run --locked tools/demo-video/voice.py "$DEMO/voice-lines.json" --project "$DEMO/video"
node $T/run-scene.mjs "$DEMO/before.json" "$DEMO/takes"
node $T/run-scene.mjs "$DEMO/after.json" "$DEMO/takes"
node $T/compose.mjs "$DEMO/film.json" "$DEMO/draft-1.mp4" --draft
tools/demo-video/qa.sh "$DEMO/draft-1.mp4" "$DEMO/qa/draft-1" "$DEMO/draft-1.mp4.edl.json"
```

When a take goes wrong, suspect the run before the page: VoiceOver Utility open, keyboard focus left
in Safari's toolbar, a held Shift key, or another app in front. `vo-lib.mjs` guards against each, and
stops the take with a message when it can't.
