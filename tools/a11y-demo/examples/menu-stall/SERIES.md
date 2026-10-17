# Series: testing a page with VoiceOver, step by step

One overview, then one short video per step of the testing sequence (a11y-demo
`references/specialist.md`), then the fix and re-test. All on the home page of
mpaiva.com: the build before the "Set for you" fix (mpaiva/jupiter `31df294`,
port 4601) and after it (`0249bbb`, port 4602). Same narrator (af_heart), same
layout (display 2, VoiceOver's panel below Safari, VOICEOVER caption bar).

Each video stands on its own: it opens by saying which step it is and what that
step is for, and ends on the last real moment, with no recap or end card. 1–2
minutes each; the overview about one.

| # | Video | What's on screen | What it shows | Status |
|---|-------|------------------|---------------|--------|
| 0 | **Overview** | The home page in Safari, VoiceOver on, VoiceOver naming the page | The goal of the test, the six steps in a sentence each, what the series covers, the two builds | **Draft 1** (0:56, captioned): `series/v0-draft-1.mp4`. VO-F3 named the skip link, not the page title (its cursor was already on the link); no line claims the title |
| 1 | **Inspect the structure** | Safari's Web Inspector: the elements and the accessibility tree; the site's own axe gate | The intended structure: headings, landmarks, the Set for you disclosure. The closed panel's four selects are in the DOM, hidden, before any screen reader is used | **Draft 1** (1:07, captioned): `series/v1-draft-1.mp4`. Safari's Web Inspector driven by key chords and typed Console commands (no clicks): the button's aria-expanded and aria-controls, then the hidden panel with its four selects ([true, 4]) |
| 2 | **Keyboard only** | Safari, VoiceOver off, the focus ring | Tab order through the header, focus visible, Set for you opens with Enter and closes with Escape, focus goes back to the button | **Draft 1** (1:08, captioned): `series/v2-draft-1.mp4`. Keyboard-only mode (real keys, VoiceOver off, KEYBOARD captions read from the page's focus, synced by a flash). Skip link works; focus order and ring hold (2.4.7); Escape returns focus (2.1.1) |
| 3 | **The reading pass** | The before build, VO-Right from the top | The header item by item, then the stall: "menu", four presses (WCAG 4.1.2) | **Draft 2** (1:50, captioned): `series/v3-draft-2.mp4`, the before take with the opener v3-open. Opens on about 5 s of quiet before VoiceOver's first phrase: review it |
| 4 | **Structural navigation** | The before build: headings, landmarks, links (VO-Command-H, landmarks, VO-Command-L) | Heading outline and landmark names hold (1.3.1, 2.4.6); the drawing strip's links read each title twice (fixed in the after build) | **Draft 1** (2:06, captioned): `series/v4-draft-1.mp4`. Headings (1.3.1 holds), named landmarks, doubled strip links (2.4.4 met, slow). VoiceOver says "Last link" once, its own stumble; captioned, not narrated |
| 5 | **The control** | Set for you, closely: name, role, state, opening, its selects, Escape | Name, role and state announced (4.1.2); the selects named; where focus goes on Escape | **Draft 1** (1:19, captioned): `series/v5-draft-1.mp4`. Name, role, state (4.1.2), expanded announced, each dropdown named with its value, Escape back to the button |
| 6 | **A real task** | "Turn the drawings off" with VoiceOver: open Set for you, change Drawings to "not at all", find out whether it worked | Whether the change is confirmed to a listener (4.1.3 Status Messages if nothing is announced) | **Draft 2** (3:18, captioned): `series/v6-draft-2.mp4`. The task on the before build (4.1.3 problem), then a re-test on the fixed build (jupiter 1ad6053, live from 418097f): the change is announced, 4.1.3 holds. Over the 1–2 minute target: tighten at review |
| 7 | **Fix and re-test** | The after build: a jump to Set for you, then the same VO-Right that stalled in video 3 | The stall gone: Set for you, then straight to Pause motion (4.1.2 holds) | **Draft 2** (1:09, captioned): `series/v7-draft-2.mp4`, the after take with the opener v7-open |

## What changes from draft 4

- The goal and the six steps move from video 3's opening into video 0, which
  fixes draft 4's length: video 3 starts at "The first thing it reaches is a
  skip link".
- Draft 4's single film splits into video 3 (the "before" take) and video 7 (the
  "after" take). Both can be cut from the takes already shot, with only their
  opening lines re-voiced.

## To build before videos 1 and 2

- **Keyboard-only scenes** (video 2): a scene option `"voiceover": false`, with
  keys sent to Safari (Tab, Shift-Tab, Enter, Space, Escape, arrows) and the
  focus ring filmed. No VoiceOver audio, so the caption bar names the key pressed
  and what got focus, read from the page, not invented.
- **A Web Inspector scene** (video 1): Safari with its Web Inspector docked, the
  Elements and Accessibility panels, driven by keyboard shortcuts where they
  exist. Less scriptable than the rest; it may need a person at the controls
  with the runner only recording and placing the narrator's pauses.

## Order of work

1. ~~Video 3 and video 7 from existing takes~~ (draft 1 of each, October 16).
2. ~~Video 0~~ (draft 1).
3. ~~Videos 4 and 5~~ (draft 1 of each, after a finding check of each: `checks/`).
4. ~~Video 6~~ (draft 1, after a two-part finding check).
5. ~~Keyboard-only mode, then video 2~~ (draft 1).
6. ~~Web Inspector capture, then video 1~~ (draft 1). The series has all eight.

## Captions

Every video ships captioned three ways, for both voices: open captions in the bar
(VOICEOVER and NARRATOR), an English captions track inside the MP4, and a `.vtt`
beside it, with the transcript. Drafts made before October 16's caption change
(draft-1 to draft-4, test-after, v3/v7 draft 1) captioned only VoiceOver on
screen; they are superseded and should not be shared.
