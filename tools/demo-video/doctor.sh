#!/usr/bin/env bash
# Checks that this machine can make a demo video, and prints how to install anything missing.
# Usage: tools/demo-video/doctor.sh            (exit 0 = ready, 1 = something is missing)
# It installs nothing itself: the agent shows the commands and runs them only with the
# requester's yes.
set -u

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="${DEMO_APP_DIR:-$REPO/tools/demo-video}"
WHISPER_MODEL="${WHISPER_MODEL:-$HOME/.cache/hyperframes/whisper/models/ggml-small.en.bin}"
KOKORO_CACHE="${HF_HUB_CACHE:-${HF_HOME:-${XDG_CACHE_HOME:-$HOME/.cache}/huggingface}/hub}/models--hexgrad--Kokoro-82M"
KOKORO_REVISION="$(sed -n "s/^REVISION = '\([0-9a-f]*\)'.*/\1/p" "$REPO/tools/demo-video/voice.py")"
KOKORO_CHECK="${TMPDIR:-/tmp}"; KOKORO_CHECK="${KOKORO_CHECK%/}/kokoro-check"
missing=0

row() { # status, name, what it is for, install hint
  printf '%-8s %-22s %s\n' "$1" "$2" "$3"
  if [ "$1" != "OK" ]; then printf '%-8s %-22s -> %s\n' "" "" "$4"; missing=1; fi
}
has() { command -v "$1" >/dev/null 2>&1; }

echo "Demo video setup check"
echo

if has brew; then row OK brew "installs the other tools" ""
else row MISSING brew "installs the other tools" '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'; fi

if has node && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then
  row OK node "runs the screen recorder and HyperFrames" ""
else row MISSING node "runs the screen recorder and HyperFrames (v20+)" "brew install node"; fi

if has python3; then row OK python3 "runs the builder" ""
else row MISSING python3 "runs the builder" "brew install python"; fi

if has uv; then row OK uv "runs the voice script and the take picker" ""
else row MISSING uv "runs the voice script and the take picker" "brew install uv"; fi

if has ffmpeg && has ffprobe; then row OK ffmpeg "cuts, measures and checks video and audio" ""
else row MISSING ffmpeg "cuts, measures and checks video and audio" "brew install ffmpeg"; fi

if has whisper-cli; then row OK whisper-cli "writes a transcript of the draft" ""
else row MISSING whisper-cli "writes a transcript of the draft" "brew install whisper-cpp"; fi

if [ -f "$WHISPER_MODEL" ]; then row OK whisper-model "speech model for the transcript" ""
else row MISSING whisper-model "speech model for the transcript" \
  "mkdir -p \"$(dirname "$WHISPER_MODEL")\" && curl -L -o \"$WHISPER_MODEL\" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"; fi

FONT="$APP_DIR/node_modules/@fontsource/public-sans/files/public-sans-latin-400-normal.woff2"
if (cd "$APP_DIR" 2>/dev/null && node -e "require.resolve('@playwright/test')" >/dev/null 2>&1) && [ -f "$FONT" ]; then
  row OK tool-packages "Playwright and the Public Sans font ($APP_DIR)" ""
else row MISSING tool-packages "Playwright and the Public Sans font ($APP_DIR)" \
  "(cd \"$APP_DIR\" && npm install)"; fi

if ls "$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright" 2>/dev/null | grep -q '^chromium'; then
  row OK chromium "browser the recorder drives (Playwright's Chromium)" ""
else row MISSING chromium "browser the recorder drives (Playwright's Chromium)" \
  "(cd \"$APP_DIR\" && npm install && npx playwright install chromium)"; fi

if [ -n "$KOKORO_REVISION" ] && [ -f "$KOKORO_CACHE/snapshots/$KOKORO_REVISION/kokoro-v1_0.pth" ]; then row OK kokoro "speech model for the narrator's voice" ""
else row MISSING kokoro "speech model for the narrator's voice (about 1 GB, once)" \
  "uv run --locked \"$REPO/tools/demo-video/voice.py\" \"$REPO/tools/demo-video/examples/voice-lines.json\" --project \"$KOKORO_CHECK\" intro"; fi

if [ -d "$HOME/.claude/skills/hyperframes" ] || [ -d "$HOME/.agents/skills/hyperframes" ] \
  || [ -d "$HOME/.codex/skills/hyperframes" ] || [ -d "$HOME/.claude/plugins/marketplaces/hyperframes" ]; then
  row OK hyperframes-skills "teach the agent the video editor" ""
else row MISSING hyperframes-skills "teach the agent the video editor" "npx --yes hyperframes@latest skills"; fi

echo
if [ "$missing" -eq 0 ]; then echo "Ready."; else echo "Not ready: install the MISSING rows above, then run this again."; fi
exit "$missing"
