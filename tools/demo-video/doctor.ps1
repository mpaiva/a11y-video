# Windows counterpart of doctor.sh: checks that this machine can make a demo video and prints how to install
# anything missing. It changes nothing. Run it from the repo root:
#
#   powershell -NoProfile -File tools/demo-video/doctor.ps1
#
# Exit 0 and "Ready." when every row is OK; exit 1 otherwise. This is gate 0's readiness evidence on Windows
# (references/setup.md, section 6). It checks what the Windows path uses: node, uv, ffmpeg, Git Bash (for qa.sh), eSpeak
# NG, the Playwright Chromium the recorder drives, and the Kokoro model. HyperFrames and whisper.cpp are not used there.
$ErrorActionPreference = 'Stop'
$script:missing = 0

function Row($state, $tool, $why, $install) {
  if ($state -eq 'OK') { '{0,-8} {1,-22} {2}' -f 'OK', $tool, $why }
  else { '{0,-8} {1,-22} {2}   install: {3}' -f 'MISSING', $tool, $why, $install; $script:missing++ }
}
function Has($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

# winget puts ffmpeg in a Links folder that only new shells see; look there too.
$links = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
$linksAdded = $false
if ((Test-Path $links) -and ($env:PATH -notlike "*$links*")) { $env:PATH = "$env:PATH;$links"; $linksAdded = $true }

if (Has 'winget') { Row OK 'winget' 'installs the other tools' '' }
else { Row MISSING 'winget' 'installs the other tools' 'App Installer from the Microsoft Store' }

if (Has 'node') {
  $v = [int](((node --version) -replace '^v', '').Split('.')[0])
  if ($v -ge 20) { Row OK 'node' "runs the screen recorder (v$v)" '' }
  else { Row MISSING 'node' 'v20 or newer runs the screen recorder' 'winget install --id OpenJS.NodeJS.LTS -e' }
} else { Row MISSING 'node' 'runs the screen recorder and the cut (v20+)' 'winget install --id OpenJS.NodeJS.LTS -e' }

if (Has 'uv') { Row OK 'uv' 'runs the voice script and the take picker' '' }
else { Row MISSING 'uv' 'runs the voice script and the take picker' 'winget install --id astral-sh.uv -e' }

if ((Has 'ffmpeg') -and (Has 'ffprobe')) { Row OK 'ffmpeg, ffprobe' 'cuts, measures and checks video and audio' '' }
else { Row MISSING 'ffmpeg, ffprobe' 'cuts, measures and checks video and audio' 'winget install --id Gyan.FFmpeg -e   (then open a new shell, or add the WinGet Links folder to PATH)' }

# qa.sh runs under Git Bash. WSL's bash.exe in System32 is not it, so look for Git for Windows' own bash.
$gitBash = @('C:\Program Files\Git\bin\bash.exe', 'C:\Program Files (x86)\Git\bin\bash.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
$onPath = Get-Command bash -ErrorAction SilentlyContinue | Where-Object { $_.Source -notmatch '\\Windows\\System32\\' } | Select-Object -First 1
if ($gitBash -or $onPath) { Row OK 'Git Bash' 'runs qa.sh, the review gate (gate 7 exit evidence)' '' }
else { Row MISSING 'Git Bash' 'runs qa.sh, the review gate (gate 7 exit evidence)' 'winget install --id Git.Git -e' }

$espeak = (Has 'espeak-ng') -or (Test-Path 'C:\Program Files\eSpeak NG\espeak-ng.exe')
if ($espeak) { Row OK 'eSpeak NG' "the voice model's pronunciation fallback" '' }
else { Row MISSING 'eSpeak NG' "the voice model's pronunciation fallback" 'winget install --id eSpeak-NG.eSpeak-NG -e' }

$pwRoot = if ($env:PLAYWRIGHT_BROWSERS_PATH) { $env:PLAYWRIGHT_BROWSERS_PATH } else { Join-Path $env:LOCALAPPDATA 'ms-playwright' }
$pw = Get-ChildItem $pwRoot -Directory -Filter 'chromium*' -ErrorAction SilentlyContinue
if ($pw) { Row OK 'Playwright Chromium' 'the browser the recorder drives' '' }
else { Row MISSING 'Playwright Chromium' 'the browser the recorder drives' 'in a scratch folder: npm install @playwright/test, then npx playwright install chromium' }

$hf = if ($env:HF_HOME) { Join-Path $env:HF_HOME 'hub' } else { Join-Path $env:USERPROFILE '.cache\huggingface\hub' }
if (Test-Path (Join-Path $hf 'models--hexgrad--Kokoro-82M')) { Row OK 'Kokoro model' 'the narrator voice (cached)' '' }
else { Row MISSING 'Kokoro model' 'the narrator voice (about 1 GB, downloaded by the first voice.py run)' 'uv run --locked tools/demo-video/voice.py <lines.json> --project <dir>' }

''
if ($linksAdded) { "Note: the WinGet Links folder ($links) was not on this shell's PATH. Add it to your PATH (or open a new shell) before running the other tools." }
if ($script:missing -eq 0) { 'Ready.'; exit 0 }
"$($script:missing) item(s) missing. Install them one at a time, with the requester's yes, then run this again."
exit 1
