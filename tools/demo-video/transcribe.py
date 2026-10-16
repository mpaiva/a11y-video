# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "faster-whisper==1.2.1",
#   "av<16",   # faster-whisper 1.2.1 passes metadata_errors to av.open, which PyAV 19 no longer accepts
# ]
# ///
"""Transcribe an audio file with faster-whisper small.en, one line per segment: start end text.

    uv run tools/demo-video/transcribe.py <audio.wav>

The transcript step of qa.sh where whisper-cli is not installed (Windows has no whisper-cpp package). The
model (about 250 MB) downloads on the first run; it runs on this machine and no audio leaves it. The
packages are pinned in the header but not hash-locked, unlike voice.py.
"""
import sys

from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")   # redirected stdout is cp1252 on Windows
if len(sys.argv) != 2:
    sys.exit("usage: uv run tools/demo-video/transcribe.py <audio.wav>")
segments, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(sys.argv[1])
for seg in segments:
    print(f"{seg.start:6.2f} {seg.end:6.2f} {seg.text.strip()}")
