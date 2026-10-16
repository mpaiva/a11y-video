# Capture — footage that looks like a person using the app

## The failure to avoid: "scrolling screenshots"

The first Tallgrass cut was built from scripted Playwright input: instant clicks, instant scrolls,
typing that appeared all at once, no cursor travel, long holds. The product owner said it
"didn't feel like a natural video — like scrolling screenshots, and the speed and motion felt
unnatural." Measured: ffmpeg `freezedetect` found the source admin take frozen in **57 stretches
of 1 s or more**, and the cut frozen most of the time (for example 3.6–9.4 s, 24.3–28.7 s,
40.0–43.6 s, 65.6–70.1 s) broken by instant jumps. Static crops and zoom "poses" on top made it
worse. Re-recording with human-paced input fixed it; editing could not.

## Recorder spec

Use `tools/demo-video/rec-lib.mjs` (its `README.md` has the API):

- **Headless Chromium via the CDP screencast**, frames at device resolution, assembled to a
  constant **30 fps** H.264 master (CRF 14).
- **Admin viewport** 1280x720 CSS at device scale **2.5** → 3200x1800 masters. That equals a
  1600x900 window at 125% zoom, so UI text is readable at 1080p without post zooms.
- **Phone viewport** 412x839 CSS at device scale **2** → 824x1678 masters, `isMobile`, touch on,
  a finger indicator instead of a cursor.
- **Cursor:** drawn overlay that follows real mouse events, travelling on minimum-jerk curves,
  0.4–0.85 s per move, with a slight bend.
- **Clicks:** 170–330 ms hover before the press, a soft ring on mousedown.
- **Typing:** 80–155 ms per key with jitter, a little longer after spaces, rare longer pauses.
- **Scrolling:** eased wheel steps at about 60 Hz, never `scrollIntoView` jumps; the cursor parks
  over plain content first, because the wheel scrolls what is under it.
- **Overlay hides only** debug overlays (`DEMO_HIDE_SELECTORS`; default the TanStack Query devtools
  badge). Nothing in the app is altered or painted.
- **One continuous take per scene**, natural 0.3–0.8 s pauses, and a `mark(name)` at every key
  event. Each take writes `<take>.mp4` and `<take>-marks.json` (marks, duration, frames).

## After every take

- Run freeze detection twice (`tools/demo-video/qa.sh` does this):
  - `-60 dB`, d=1.5 s — ffmpeg's default; counts cursor-only motion as frozen.
  - `-90 dB`, d=1.5 s — flags truly static picture.
  No static stretch longer than about 1.5 s mid-take unless the narration points at that screen.
- Check the take for debug badges, test clutter, wrong labels and anything the brief keeps off
  screen before keeping it (the Tallgrass phone script threw an error if any appeared).
- Note which database copy the take used.
- Record every take of the demo into **one capture folder** and set it as the EDL's `rawDir`;
  `sources` and `stills` name files in it. A take reused from an earlier session may be named by
  its absolute path instead.

## Phone: mobile web only

The worker scenes are mobile web in a phone-sized browser — never call it a native app.

- **Chromium with Pixel emulation** is the dependable choice. In Tallgrass it ran end to end:
  sign-in, launching a third-party course player, video, quiz, pass, and the completion syncing back.
- **WebKit (iPhone) drops `Secure` and `__Host-` cookies on plain http**, so an app that sets them
  shows a sign-in loop or a failed launch. Record phone scenes in Chromium unless the stack runs on
  https, and test a real iPhone before telling customers it works there.
- Third-party pages can carry their own banners ("Open in the app") and may have no link back to
  your app. Plan the cut around them.
- Reuse genuine vendor playback footage when the course was already completed — say so in the
  provenance notes; never stage a completion.

## Stills

When a scene needs an unmoving hold (an inset, an outro), record a short still take *and* save a
PNG from the same state, so the edit can switch from video to still without a jump.

## Order, resets and timing

Learned on a second demo (a "Collected info" tab), where four of five film reviews found the same continuity fault.

- **Record scenes in story order**, from a fixture whose first state is the story's start.
- **A reset through the product is not a reset.** Re-saving the original value through an editor records a
  new correction, so the row reads "Corrected by …" from then on. To retake an earlier scene, seed a fresh
  fixture; do not try to undo the change.
- **Anything that must agree on screen comes from the fixture**: a hire's start date in the page header
  and in a table row, a count in a title and in a chip. Check both before recording.
- **Mark after an action as well as before it** (`pencil-done`, `save-done`). A click lands 0.5–1.5 s
  after its mark, and a loaded machine stretches holds, so retime the voice from the marks, never from the plan.
- **Keep a scroll sweep out of the cut when it passes rows that belong to a different story state.** Start
  the scene at the end of the sweep (an in-point), and cut long cursor travel between two narrated actions.

## Handing capture to Codex

Codex can own the app stack, the database copies and the recording. Give it
`templates/capture-handoff.md`, filled in, and ask for the raw takes, marks, stills and a README.
