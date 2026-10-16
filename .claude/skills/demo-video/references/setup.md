# Setup — before the intake interview

Product managers run this skill too, so assume no video or command-line background. Explain each
step in plain words, ask before you install anything, and install one thing at a time.

**Mac is the tested platform.** `doctor.sh` and every install command in sections 1 and 2 assume macOS
and Homebrew. On Windows 11 a whole demo (recording, voice, a plain-ffmpeg cut, film review) was made on
2026-10-12 with the commands in section 6, which replace `doctor.sh` with `doctor.ps1` and the HyperFrames
build with `ffmpeg-cut.mjs`; HyperFrames, `build.py` and `pick-takes.py` were not run there. On Windows,
tell the requester it is the less-tested path before the intake, ask before every install, and use
section 6. The voice script was also tested alone on Windows 11 on 2026-10-09.

If the first `uv run` stops with `Missing expected target directory for Python minor version
link`, uv's download of Python 3.12 is broken. Run `uv python install --reinstall 3.12`, then run
the same command again.

## 1. Check the machine

Run `tools/demo-video/doctor.sh` from the repo root. It prints one row per tool, with OK or
MISSING, and an install command for each MISSING row. It changes nothing.

For each MISSING row:
1. Tell the requester what the tool is for, in one sentence from the table below.
2. Show the install command and ask for a yes.
3. Run it, then run `doctor.sh` again.

`brew` comes first. Every other install command uses it. The Homebrew installer asks for the
Mac password, so the requester runs it themselves: suggest `! <command>` in Claude Code.

## 2. What each tool does

| Tool | What it does for the video | Install |
|------|----------------------------|---------|
| Homebrew (`brew`) | Installs the other tools on a Mac. | See `doctor.sh` |
| Node.js | Runs the screen recorder and HyperFrames. | `brew install node` |
| Tool packages | Playwright (browser control) and the Public Sans font the video uses. | `npm install` in `tools/demo-video` |
| Chromium (Playwright) | The browser the recorder drives. The cursor moves, clicks and types at human speed. | `npx playwright install chromium` in `tools/demo-video`, after `npm install` (it installs the Chromium that the pinned Playwright expects) |
| HyperFrames | The video editor. A video is a web page with a timeline; HyperFrames renders it to MP4. Its skills teach the agent how to use it. | `npx --yes hyperframes@latest skills`. In Claude Code you can add the plugin instead: `/plugin marketplace add heygen-com/hyperframes`, then `/plugin install hyperframes@hyperframes`. |
| Kokoro | Makes the narrator's voice from the script. It is an open speech model that runs on this Mac, so it needs no key and the script stays on the machine. Voice: `af_heart`. | Nothing to install by hand: `uv` fetches it. The first `voice.py` run downloads Python 3.12 (when it is not installed), the packages and the model (about 1 GB, a few minutes) into uv's and Hugging Face's caches. `doctor.sh` prints the one-line command that does this ahead of time. |
| ffmpeg | Cuts, measures and checks video and audio: loudness, frozen frames, frame strips. | `brew install ffmpeg` |
| whisper-cpp | Writes a transcript of the draft, so the agent can check every spoken word. | `brew install whisper-cpp` and the model `doctor.sh` names |
| Python and uv | Run the builder, the voice script and the take picker. | `brew install python uv` |

## 3. The app

The video shows the real app on a demo database. If the requester has never run the app, follow
the project's own run instructions (its README, a run skill or script) to set up the stack. Then
follow `fixture.md` to make the isolated demo database. Never record against a shared or production
database. Point the recorder at the app with `DEMO_ADMIN_URL` and tell it how to sign in (header of
`tools/demo-video/rec-lib.mjs`).

## 4. The model

Gates 7 and 9 (building the cut and fixing it) need Claude Opus 5.5 at high effort or above.
The motion and timing decisions are where a weaker model fails. Check the session model before
gate 7. If it is not Opus, ask the requester to run `/model opus` and set the effort to high or
xhigh. In Codex, stop after gate 6 and continue gates 7–10 in a Claude Code session on Opus.

## 5. Time

Setup on a new machine is a one-time job. After that, most of the time goes to the requester's
three approvals (script, storyboard, draft), so ask for them early.

## 6. Windows notes (run once, 2026-10-12)

Run `powershell -NoProfile -File tools/demo-video/doctor.ps1` instead of `doctor.sh`. It checks winget,
node, uv, ffmpeg, Git Bash (for `qa.sh`), eSpeak NG, the recorder's Chromium and the Kokoro model, changes nothing, and prints
"Ready." when all are present. Do not run the `brew` commands. Ask before each install, one at a time.

- **Installs (winget):** `winget install --id Gyan.FFmpeg -e` (cuts, measures, checks) and
  `winget install --id eSpeak-NG.eSpeak-NG -e` (the voice model's pronunciation fallback). winget changes
  PATH only for new shells, so in the agent's shell add
  `C:\Users\<you>\AppData\Local\Microsoft\WinGet\Links` to PATH. Without it `voice.py` stops at
  `subprocess` with `FileNotFoundError: [WinError 2]` (it cannot find ffmpeg). `uv` fetches Python 3.12
  itself; the Microsoft Store `python` shortcut is only a stub, so do not use it.
- **No whisper-cpp:** there is no winget package. `qa.sh` falls back to faster-whisper `small.en` through
  `uv run` (the first run downloads the model) and writes `transcript.txt`.
- **Recorder:** in `tools/demo-video` run `npm install` then `npx playwright install chromium` with
  Windows node (if the app itself runs in WSL, keep the two `node_modules` apart), and set `DEMO_ADMIN_URL`
  to the admin origin. Windows Chromium reaches a stack running in WSL through 127.0.0.1. A takes file
  outside the repo imports `rec-lib.mjs` by a `file:///C:/...` URL.
- **Which stack answered:** dev servers often move to another port when the default is taken, and another
  session's stack can answer on the default. Read the port the app's start command printed and check it
  is the one you record.
- **Cut without HyperFrames:** `node tools/demo-video/ffmpeg-cut.mjs <scenes.json> <out.mp4> --draft` trims
  each take, scales it, joins the scenes with 0.3 s dissolves, places each narration take, normalises the
  audio to about -16 LUFS and writes `<out>.edl.json` (scene starts and the narrated holds). It encodes with
  `-pix_fmt yuv420p -profile:v high` and limited range: the recorder's frames are full-range 4:4:4, and
  without that the MP4 is `yuvj444p`, which QuickTime and Safari can refuse to play. The scenes file is
  described at the top of `ffmpeg-cut.mjs`, with a worked example in
  `examples/collected-info-tab/scenes.json`.
- **QA:** run `qa.sh <out.mp4> <dir> <out>.edl.json` under Git Bash with ffmpeg on PATH. The EDL lets the
  freeze rule apply and adds a 10 fps strip around every scene change. On Windows `qa.sh` uses `uv run python`
  where `python3` is only a stub.
