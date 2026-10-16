# Edit recipes — the HyperFrames cut

The cut is one HyperFrames composition generated from an EDL JSON by
`tools/demo-video/build.py`. Load the HyperFrames skills first (`/hyperframes`, then
`hyperframes-core`; `hyperframes-keyframes` for camera moves). The worked example is
`tools/demo-video/examples/tallgrass-field-training/edl.json`. Each recipe below names the EDL
field that implements it.

## From raw takes to a project — the one path

1. `python3 tools/demo-video/build.py init <demo>/video` writes `package.json` (npm scripts that
   run one pinned HyperFrames version) and `hyperframes.json`. Then, in that folder,
   `npm run upgrade` and `npm run check`. **Always use the npm scripts** (`npm run check`,
   `npm run render -- …`, `npm run snapshot -- …`): a bare `npx hyperframes` can run a cached,
   older CLI than the project's pin.
2. Name the media in the EDL:
   - `rawDir`: the capture folder (relative paths resolve against the EDL file's folder; `~` works).
   - `sources`: `{"assets/recordings/rule.mp4": "rule.mp4", …}` — a file in `rawDir`, or an
     absolute path for a take reused from another folder; copied as it is (videos and ready-made
     PNGs such as a capture's still).
   - `stills`: `{"assets/stills/rule-last.png": {"from": "rule.mp4", "at": "end"}}` — one frame
     extracted with ffmpeg (`at` in seconds, or `"end"` for the last frame).
   - `voiceDir`: the folder `voice.py` wrote the takes into.
3. Voice: `voice.py` writes `<line-id>-<n>.mp3` takes. Each EDL voice line names its `line`;
   `pick-takes.py --voice-dir <voiceDir> --write-edl edl.json` writes the calmest `take` into it
   (pin a line with `"pin": true` to keep a hand pick).
4. `python3 tools/demo-video/build.py stage edl.json --project <demo>/video` copies the sources,
   extracts the stills, copies each line's picked take from `voiceDir`, copies Public Sans from
   the repo's `@fontsource/public-sans`, and generates the room tone:
   `ffmpeg -f lavfi -i "anoisesrc=color=pink:amplitude=1:duration=<seconds>:sample_rate=48000:seed=7" -af "highpass=f=90,lowpass=f=2500,volume=-38.5dB" -ac 2 assets/room-tone.wav`
   (band-limited pink noise, about −60 dBFS RMS, peak about −47 dBFS). The font is required when
   the EDL names one: if `stage` cannot find it, it stops and says to run `pnpm install` in
   `events/onboarding` or set `DEMO_APP_DIR` to a checkout that has `node_modules`.
5. `build.py check` fails on any missing media file (font included); `build.py build` writes
   `index.html` and `edit.json`, and refuses a voice line that runs past the duration.

## Layout

- **Canvas** 1920x1080, 30 fps (24 fps makes cursor motion look choppy in screen recordings).
- **Desktop footage** fills the frame (3200x1800 masters scale exactly to 1920x1080). Desktop clips
  and stills sit inside one camera wrapper, `#cam`, so a push-in can span a cut.
- **Phone footage** sits in a "rig": a 492x1000 rounded window (radius 28, soft shadow) centred on
  a neutral background (`#ecebe8`), with each phone clip 492 px wide. Full-frame background clips
  (`phoneBackgrounds`) cover the desktop while the phone is on screen.

## Cutting

- **Cut on action, not on holds.** Start a clip just before the click or the page change it
  shows; end it just after the result settles.
- **Reuse audited in-points.** Map every in-point from the take's marks file (`mark + offset`) and
  note it in the EDL `note`. Re-deriving in-points by eye caused the after-state flash at 11.2 s in
  draft 1.
- **Split a clip around a flash.** A one-frame loading skeleton between the course list and the
  course page was removed by splitting the clip: media 1.2→1.72, then 1.767→ (skipping two frames).
- **End before a blank frame.** Drawers and dialogs blank for 2–3 frames as they close; end the
  clip at the last full frame and start the next one after it (three P0s in draft 3).
- **Hide a scroll under a transition with a still.** When the page starts scrolling while the
  phone grows over it, swap the clip for a PNG of the last unscrolled frame for the transition
  (`desktop` entry with `still`).
- **Hold the real final frame, not a frozen video.** A still of a take's last frame
  (`stills: {"…": {"from": "take.mp4", "at": "end"}}`) covers narration that runs past the take.
- **Mark every intentional hold.** Still clips count as holds automatically. A video clip that is
  meant to sit still (a still take under a push-in) gets `"hold": true`; a span where the picture
  rests while the narration describes it goes in `holds` with a `why`. `qa.sh` treats any other
  freeze over 1.5 s at −90 dB as a P1 (`review-checklist.md`).
- **Skip what viewers do not need.** Adding the courses one by one was cut; the admin part opens on
  the finished three-course program while the narration says "one program, with three Skillsoft
  courses".

## Camera (`motion.cam`, `motion.rig`)

- **Push-ins are motivated and slow:** only when the narration points at small text (the match
  count, Luis's overdue rows, Owen's row, "2 of 3 courses done"), scale 1.08–1.2 over 1.6–3 s with
  `power2.inOut`, and ease back out before the next cut.
- Change `transformOrigin` only while the scale is 1, or the frame jumps.
- **Frame out a spoiler.** The assignment list showed Caleb at "2 of 3" before the story got
  there; a cut straight into scale 1.55 with origin `620px 660px` kept names and start dates and
  pushed the State column off the right edge.
- **Never pan over a frozen frame.** That is the "scrolling screenshots" look. Motion comes from
  the recording.

## The phone inset

The key beat of the Tallgrass cut: the admin types Caleb's start date into the schedule preview,
and Caleb's real portal rises beside it showing "Due October 4, 2026".

- Inset pose relative to the full pose: `x = 150 − 714`, `y = 47`, `scale = 0.837` (412 px wide,
  1:1 with the source pixels, so the text stays readable).
- **Rise:** `set` the inset pose 40 px low just before, then `to` opacity 1 and the final y over
  0.6 s (`power2.out`).
- **Grow:** `to` x 0, y 0, scale 1 over 0.7 s (`power2.inOut`) while the phone background fades in
  over the same 0.7 s; the next phone clip continues from the same page state.
- Reset the rig to `scale 1, transformOrigin "0 0"` while it is hidden, before the next use.

## Captions and endings

- The only editorial text: a small time-jump caption ("A few minutes later", 30 px, `#3d3c3a`,
  0.3 s fades) over the vendor player's last seconds.
- End on the worker's real final state: 0.6 s dissolve to the phone, the closing line, about 1 s
  hold, 0.8 s fade to black. No end card.

## Sound

- One `<audio>` per voice line (`voice.lines`), each with a `data-volume` that normalizes it to
  the target loudness (about −20 LUFS; `build.py` measures it with ffmpeg `ebur128`).
- A quiet room-tone bed under the whole film (`roomTone`, gain about 2.5 on the −60 dBFS file
  `build.py stage` generates), fading in over 0.3 s and out with the picture.
- Trim a take by giving its voice line a `cut` (seconds) that ends in a silence.

## Rendering

- `npm run check` (in the project) must show no errors. One warning is expected for a single-file cut:
  `timeline_track_too_dense` ("Track N has K timed elements in this HTML file"), whose fix text
  suggests splitting the file into sub-compositions — the monolithic-structure warning. Leave it:
  the cut is generated from the EDL, which is the file people edit. Any other warning (for example
  `clip_ends_past_root_duration`) is a real problem.
- Draft: `npm run render -- --quality draft --fps 30 -o ../draft-N.mp4` (about 1 minute for
  2 minutes of video). Final only after the requester approves the draft:
  `npm run render -- --fps 30 -o ../final-narrated.mp4`.
- Silent version: `ffmpeg -i narrated.mp4 -an -c:v copy silent.mp4` (identical picture).
