Capture a set of raw takes for the <demo name> walkthrough. Capture only — do not edit the video;
the editor rebuilds the cut from your takes.

WHAT EXISTS
- Brief and script: `<demo folder>/BRIEF.md` (scenes and voice lines).
- Recorder: `tools/demo-video/rec-lib.mjs` in the employee-events repo (usage in
  `tools/demo-video/README.md`). Match its conventions exactly: headless Chromium via the CDP
  screencast at 30 fps; a visible cursor on eased paths (0.4–0.85 s per move); 170–330 ms hover
  before each click with a soft ring; typing at 80–155 ms per key with jitter; smooth wheel
  scrolling, never scrollIntoView jumps; phone 412x839 at DPR 2; admin 1280x720 at DPR 2.5; only the
  TanStack devtools badge hidden.
- App checkout: `<path>` at `<commit or "origin/main at or after <sha>">`. Re-apply any local
  label patch the brief names (`<patch>`); do not commit or push.

SET UP
1. Isolated Postgres on `<host:port>` only. Leave existing databases untouched. Make one copy per
   story state and run any new migrations on the copies:
   - `<db_before>`: <state, e.g. worker at 1 of 3, second course assigned and due Oct 4>
   - `<db_after>`: <state, e.g. 2 of 3, caught up, more training arrives Oct 4>
2. Point the app at one copy at a time. Prove the port → database mapping before every take.

TAKES (one continuous take each, natural motion, a marks JSON for every key event)
Phone, `<db_before>`:
- P1 <sign-in → …>. Mark every step.
- P2 <launch: open the course, tap Start; stop when the provider tab opens>.
- P3 still source: a clean, unmoving view of <state>, plus a PNG.
Phone, `<db_after>`:
- P4 <after state>. Do NOT open anything that shows <conflicting detail, e.g. completion timestamps>.
- P5 outro still source: a clean, unmoving view of <final state>, plus a PNG. Hide only <x>; keep
  <y> — they carry the closing line.
Admin: <list each admin take and its beats>. If a screen visibly changed since the last capture,
re-record that take and say why; otherwise reuse `<old take>`.

RULES
- Isolated database copies only. No production, no vendor sandbox setting changes, no restarts of
  shared tunnels or proxies.
- No product code changes beyond the named label patch.
- No debug badges, no test clutter, no "Hired …" labels on screen.
- Every state shown is real UI output. Nothing painted or mocked; no synthesized completions.
- Code sends are limited to 5 per hour per link — plan the sign-in takes.
- If the new UI cannot show a beat from the script, stop and report it. Do not work around it.

DELIVER to `<demo folder>/raw/`:
- each take as an MP4, `<take>-marks.json` (written by the recorder: marks, duration, frames), a
  freezedetect report at −60 dB and −90 dB with d=1.5, one PNG per still source
- `README.md`: every take, the database it used, the app commit, patch status, migrations applied,
  and the state of the databases after capture

Report under 300 words: takes with lengths and key marks, which admin takes changed, anything you
could not capture.
