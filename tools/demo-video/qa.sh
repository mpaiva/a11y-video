#!/usr/bin/env bash
# QA a rendered demo video: format, decode check, freeze detection at -60 and -90 dB with the
# freeze rule, 1 fps contact sheets, 10 fps strips within ±0.5 s of every cut, and a transcript.
#
#   tools/demo-video/qa.sh <video.mp4> <out-dir> [edl.json]
#
# Freeze rule (review-checklist.md): a freeze longer than 1.5 s at -90 dB is a P1 unless the EDL
# marks that span as an intentional hold — a still clip, a clip with "hold": true, or a "holds"
# entry (a narrated hold). With an EDL, the freezes print as OK or P1, and the script exits 1 when
# any P1 freeze remains (after writing every other output). Without an EDL, freezes only print.
#
# Transcripts use whisper-cli (brew install whisper-cpp) with $WHISPER_MODEL, default
# ~/.cache/hyperframes/whisper/models/ggml-small.en.bin; without it but with uv (Windows has no
# whisper-cpp package), faster-whisper small.en through `uv run`; without either,
# `npx hyperframes transcribe`. Runs under Git Bash on Windows (ffmpeg on PATH; python3 is only a
# stub there, so the EDL steps use `uv run python`).
set -euo pipefail

video="${1:?usage: qa.sh <video.mp4> <out-dir> [edl.json]}"
out="${2:?usage: qa.sh <video.mp4> <out-dir> [edl.json]}"
edl="${3:-}"
model="${WHISPER_MODEL:-$HOME/.cache/hyperframes/whisper/models/ggml-small.en.bin}"
mkdir -p "$out/strips" "$out/seconds"
freeze_status=0
transcript_status=0
# Python for the EDL steps: python3 where it runs, else uv's (on Windows python3 is a Store stub).
if python3 -c "" > /dev/null 2>&1; then py=(python3)
elif command -v uv > /dev/null; then py=(uv run --no-project python)
else py=(python3); fi

echo "== format"
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,sample_rate,channels -of compact "$video" | tee "$out/format.txt"

echo "== decode check"
if ffmpeg -v error -i "$video" -f null - 2> "$out/decode-errors.txt" && [ ! -s "$out/decode-errors.txt" ]; then
  echo "decode: clean"
else
  echo "decode: ERRORS — see $out/decode-errors.txt"
fi

for level in -60 -90; do
  ffmpeg -v info -i "$video" -an -vf "freezedetect=n=${level}dB:d=1.5" -f null - 2>&1 \
    | grep -oE "freeze_(start|duration): [0-9.]+" | paste - - | awk '{print $2, $4}' > "$out/freeze${level}.txt" || true
done
echo "== freezedetect n=-60dB d=1.5 (counts cursor-only motion as frozen; informational)"
awk '{printf "  %7.2f s  for %5.2f s\n", $1, $2}' "$out/freeze-60.txt"

echo "== freezedetect n=-90dB d=1.5 (truly static picture)"
if [ -n "$edl" ]; then
  total="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video")"
  "${py[@]}" - "$edl" "$out/freeze-90.txt" "$total" <<'PY' || freeze_status=1
import json, sys
edl = json.load(open(sys.argv[1]))
holds = [(c["start"], c["start"] + c["duration"], c["id"]) for g in ("desktop", "phoneClips")
         for c in edl.get(g, []) if c.get("still") or c.get("hold")]
holds += [(h["start"], h["end"], h.get("why", "hold")) for h in edl.get("holds", [])]
holds.sort()
bad = 0
for row in open(sys.argv[2]):
    fields = row.split()
    if not fields:
        continue
    start = float(fields[0])
    # A freeze that runs to the end of the file has no duration line.
    dur = float(fields[1]) if len(fields) > 1 else float(sys.argv[3]) - start
    end = start + dur
    # Seconds of this freeze NOT covered by any intentional hold.
    covered, cursor = 0.0, start
    for hs, he, _ in holds:
        lo, hi = max(hs, cursor), min(he, end)
        if hi > lo:
            covered += hi - lo
            cursor = hi
    uncovered = dur - covered
    if uncovered > 1.5:
        bad += 1
        print(f"  P1   {start:7.2f}–{end:7.2f} s  ({uncovered:4.2f} s not marked as a hold in the EDL)")
    else:
        why = "; ".join(w for hs, he, w in holds if hs < end and he > start)
        print(f"  OK   {start:7.2f}–{end:7.2f} s  hold: {why}")
print(f"freeze rule: {'FAIL — ' + str(bad) + ' P1 freeze(s)' if bad else 'PASS'}")
sys.exit(1 if bad else 0)
PY
else
  awk '{printf "  %7.2f s  for %5.2f s\n", $1, $2}' "$out/freeze-90.txt"
  echo "freeze rule: not applied (no EDL given)"
fi

echo "== 1 fps contact sheets"
ffmpeg -v error -y -i "$video" -vf "fps=1,scale=384:-1" "$out/seconds/s_%03d.jpg"
ffmpeg -v error -y -framerate 1 -i "$out/seconds/s_%03d.jpg" -vf "tile=6x5" "$out/sheet_%02d.jpg"

if [ -n "$edl" ]; then
  echo "== 10 fps strips around every cut"
  "${py[@]}" - "$edl" > "$out/cuts.txt" <<'PY'
import json, sys
edl = json.load(open(sys.argv[1]))
starts = sorted({round(c["start"], 3) for g in ("desktop", "phoneClips") for c in edl.get(g, []) if c["start"] > 0})
print("\n".join(str(s) for s in starts))
PY
  while read -r t; do
    t="${t%$'\r'}"   # Python on Windows writes CRLF
    [ -n "$t" ] || continue
    from=$("${py[@]}" -c "print(max(0, $t - 0.5))" | tr -d '\r')
    ffmpeg -nostdin -v error -y -ss "$from" -t 1.0 -i "$video" -vf "fps=10,scale=320:-1,tile=10x1" -frames:v 1 "$out/strips/cut_${t}.jpg"
  done < "$out/cuts.txt"
  echo "strips: $(wc -l < "$out/cuts.txt" | tr -d ' ') cuts → $out/strips/"
fi

echo "== transcript"
ffmpeg -v error -y -i "$video" -ac 1 -ar 16000 "$out/audio.wav"
if command -v whisper-cli > /dev/null && [ -f "$model" ]; then
  whisper-cli -m "$model" -f "$out/audio.wav" -osrt -of "$out/transcript" > "$out/whisper.log" 2>&1
  echo "transcript: $out/transcript.srt"
elif command -v uv > /dev/null; then
  # With uv but no whisper-cli (Windows): faster-whisper. Without a whisper model file, this also replaces
  # the hyperframes fallback on a Mac that has uv.
  uv run "$(dirname "$0")/transcribe.py" "$out/audio.wav" > "$out/transcript.txt" 2> "$out/whisper.log" || true
  if [ -s "$out/transcript.txt" ]; then echo "transcript: $out/transcript.txt (faster-whisper small.en via uv)"
  else echo "transcript: FAILED — see $out/whisper.log"; transcript_status=1; fi
else
  npx --yes hyperframes transcribe "$out/audio.wav" > "$out/transcript.txt" 2>&1 || true
  echo "transcript: $out/transcript.txt (hyperframes transcribe)"
fi
echo "QA output: $out"
# Exit 1 for a P1 freeze (freeze_status) or a failed transcript (transcript_status).
exit $(( freeze_status | transcript_status ))
