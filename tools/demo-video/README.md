# Demo video tools

Scripts behind the `demo-video` skill (`.claude/skills/demo-video/SKILL.md`). They work with any web
app you can run locally, on a demo folder **outside the repo** — raw takes, voice takes and the
HyperFrames project never get committed.

One-time setup in this folder: `npm install` (Playwright and the Public Sans font, pinned in
`package.json`), then `npx playwright install chromium`.

| Tool | Gate | What it does |
|------|------|--------------|
| `doctor.sh` | Setup | Checks every tool the run needs and prints the install command for each missing one. Installs nothing. `references/setup.md` explains each tool in plain words. |
| `doctor.ps1` | Setup | The Windows counterpart of `doctor.sh`: checks winget, node, uv, ffmpeg, Git Bash, eSpeak NG, the recorder's Chromium and the Kokoro model, prints the install command for each missing one, and "Ready." when all are present. Installs nothing. |
| `ffmpeg-cut.mjs` | Build | The Windows path for gate 7 (works anywhere ffmpeg and node do): cuts raw takes and narration clips into a full-frame walkthrough from a `scenes.json`, and writes `<out>.edl.json` (scene starts, narrated holds) for `qa.sh`. No HyperFrames or Python. Worked example: `examples/collected-info-tab/scenes.json`. |
| `rec-lib.mjs` | Capture | Human-paced Playwright recorder: eased cursor, hover-then-click, jittered typing, wheel scrolling, touch taps; CDP screencast at device resolution → constant 30 fps master + marks JSON. |
| `takes.example.mjs` | Capture | Worked example of a phone take and an admin take (Tallgrass, an example product). Copy it and replace the routes and selectors with your app's. |
| `voice.py` | Voice | Kokoro-82M takes per line (default 1), generated on this machine, as `<project>/assets/voice/<line-id>-<n>.mp3`. Run it with `uv run --locked`: its header pins Python 3.12, `voice.py.lock` pins every package by hash, and the script pins the model revision. A take whose inputs changed moves to `assets/voice/_replaced/`. Refuses a line with a `[tag]`, which Kokoro would speak. To change a package, edit the header, set `exclude-newer` to 7 days before today, and run `uv lock --script tools/demo-video/voice.py`. |
| `pick-takes.py` | Voice | Groups any folder of `<line-id>-<n>.mp3` takes, ranks each line's takes by pitch variation (calmest first) with duration and LUFS, and with `--write-edl` writes the picks into the EDL ("N lines, M takes changed, K pinned"). |
| `build.py` | Build | `init` (scaffold; npm scripts pinned to one HyperFrames version) · `stage` (copy `sources` from `rawDir`, extract `stills`, copy picked takes from `voiceDir`, copy the font, generate room tone) · `check` (fails on any missing media) · `build` (EDL → `index.html` + `edit.json`). |
| `transcribe.py` | Review | Transcribes an audio file with faster-whisper `small.en` (CPU, one line per segment). `qa.sh` uses it where `whisper-cli` is absent, as on Windows. Run it with `uv run`; the model downloads on the first run. |
| `qa.sh` | Review | Format, decode check, freezedetect at −60/−90 dB with the freeze rule (exit 1 on a P1 freeze), 1 fps contact sheets, 10 fps strips around every cut, transcript. Runs under Git Bash on Windows (python through `uv run`, transcript through faster-whisper when `whisper-cli` is absent). |
| `examples/tallgrass-field-training/` | All | A real EDL and voice-line file from the Tallgrass demo (fictional cast, example product). Its `rawDir`, `voiceDir` and two absolute sources point at capture folders that exist only on the machine that made it. |
| `examples/voice-lines.json` | Voice | A two-line starter lines file; `doctor.sh` uses it to fetch the Kokoro model ahead of time. |

## Typical run

```sh
DEMO=~/Downloads/my-demo            # the demo folder (outside the repo)
T=tools/demo-video                  # run from the repo root

# 0. Check the machine (exit 0 = ready)
$T/doctor.sh

# 1. Capture into $DEMO/raw (app stack on the isolated demo database; see the skill's fixture.md).
#    Copy takes.example.mjs to $DEMO/takes.mjs, rewrite it for your app, then:
export DEMO_ADMIN_URL=http://localhost:3000 DEMO_STORAGE_STATE=$DEMO/auth.json
node $DEMO/takes.mjs admin-build "$DEMO/raw"

# 2. Project scaffolding (once). Always use the npm scripts: they run the pinned CLI.
python3 $T/build.py init "$DEMO/video"
(cd "$DEMO/video" && npm run upgrade && npm run check)

# 3. Voice takes, then each line's take into the EDL
#    ($DEMO/edl.json: start from the worked example; set "rawDir": "raw" and
#     "voiceDir": "video/assets/voice" — relative to the EDL file's folder)
uv run --locked $T/voice.py "$DEMO/voice-lines.json" --project "$DEMO/video"
uv run --with numpy python $T/pick-takes.py --voice-dir "$DEMO/video/assets/voice" --write-edl "$DEMO/edl.json"

# 4. Stage, check, build
python3 $T/build.py stage "$DEMO/edl.json" --project "$DEMO/video"
python3 $T/build.py check "$DEMO/edl.json" --project "$DEMO/video"
python3 $T/build.py build "$DEMO/edl.json" --project "$DEMO/video"

# 5. Draft and QA (qa.sh exit 1 = a P1 freeze not marked as a hold in the EDL)
(cd "$DEMO/video" && npm run check && npm run render -- --quality draft --fps 30 -o ../draft-1.mp4)
$T/qa.sh "$DEMO/draft-1.mp4" "$DEMO/qa/draft-1" "$DEMO/edl.json"

# 6. Final (after the requester approves the draft)
(cd "$DEMO/video" && npm run render -- --fps 30 -o ../final-narrated.mp4)
ffmpeg -i "$DEMO/final-narrated.mp4" -an -c:v copy "$DEMO/final-silent.mp4"
```

On Windows, steps 0, 2, 4 and 5 change (the recorder in step 1 and the voice in step 3 are the same; see
`references/setup.md`, section 6). Run from the repo root, with ffmpeg on PATH and a Git Bash for `qa.sh`:

```sh
powershell -NoProfile -File tools/demo-video/doctor.ps1                       # 0. Ready.
node tools/demo-video/ffmpeg-cut.mjs "$DEMO/scenes.json" "$DEMO/draft-1.mp4" --draft   # 2, 4, 5: cut, no HyperFrames
tools/demo-video/qa.sh "$DEMO/draft-1.mp4" "$DEMO/qa/draft-1" "$DEMO/draft-1.edl.json"  # QA with the emitted EDL
node tools/demo-video/ffmpeg-cut.mjs "$DEMO/scenes.json" "$DEMO/final-narrated.mp4"     # 6. final, then the silent copy as above
```

## Configuration

| Variable | Default | Used by |
|----------|---------|---------|
| `DEMO_APP_DIR` | this folder (`tools/demo-video`) | `rec-lib.mjs` (finds `@playwright/test`) and `build.py stage` (finds `@fontsource/public-sans`). Both need `node_modules`: run `npm install` here, or point this at another folder whose `node_modules` has them. `stage` stops with this advice when the font is missing. |
| `DEMO_ADMIN_URL` | `http://localhost:3000` | `rec-lib.mjs`: the desktop app's origin |
| `DEMO_STORAGE_STATE` | — | `rec-lib.mjs`: a Playwright `storageState` JSON with a signed-in session (save one with `npx playwright codegen --save-storage=auth.json <url>`) |
| `DEMO_LOGIN_PATH` | — | `rec-lib.mjs`: a dev-only route that signs in and redirects; used when no storage state is set. Or pass `signIn: async page => …` to `adminBrowser()` |
| `DEMO_CONTENT_SELECTOR` | `main, [role=main]` (else `body`) | `rec-lib.mjs`: the scrolling content area the cursor parks over before wheel scrolls |
| `DEMO_HIDE_SELECTORS` | TanStack Query devtools badge | `rec-lib.mjs`: comma-separated debug overlays hidden in every take |
| `PORTAL_LINK`, `PORTAL_CODE` | — | `takes.example.mjs` phone take (the example app's sign-in link and dev code) |
| `HF_HOME` / `HF_HUB_CACHE` | `~/.cache/huggingface/hub` | `voice.py` (where the Kokoro model is cached) and `doctor.sh` (checks it is there; `doctor.ps1` reads `HF_HOME` only) |
| `WHISPER_MODEL` | `~/.cache/hyperframes/whisper/models/ggml-small.en.bin` | `qa.sh` |

Voice, speed and takes per line live in the lines JSON; canvas, phone pose,
`rawDir`, `voiceDir`, media sources, stills, clips, holds, motion and loudness target live in the
EDL (the docstring at the top of `build.py` lists every field). `stage --raw` / `--voice-dir` override
the EDL's folders. Nothing here holds a secret.

## Provenance

Generalized from the Tallgrass field-training demo (an example product, fictional cast): the
recorder from the Codex capture sessions, the builder from the final edit. Media, databases and
customer material from that work stay outside the repo.
