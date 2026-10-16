"""Rank narration takes (calmest first) and optionally write the picks into the EDL.

    uv run --with numpy python pick-takes.py --voice-dir <project>/assets/voice [line-id ...]
    uv run --with numpy python pick-takes.py --voice-dir <dir> --write-edl edl.json

Takes are grouped by file name, `<line-id>-<n>.mp3` (what voice.py writes) — no other index is
needed, so it works on any folder of takes. For each take it prints the duration, the pitch
variation (standard deviation of the fundamental frequency in semitones — lower is calmer) and the
integrated loudness (LUFS).

--write-edl sets `take` on every EDL voice line whose `line` matches a group, to that group's
calmest take, and keeps an existing `take` only when it is pinned with `"pin": true`. That is the
one way picks reach the build: build.py reads `take` and refuses a line without one. Prefer a
take that fits its shot over a flatter one that does not — pin it — and re-time the shot rather
than speeding up the voice.
"""
import argparse
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path

import numpy as np

SR = 16000
TAKE = re.compile(r'^(?P<line>.+)-(?P<n>\d+)\.mp3$')


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def f0(x):
    frame, hop, out = int(.04 * SR), int(.01 * SR), []
    lo, hi = int(SR / 400), int(SR / 120)
    for i in range(0, len(x) - frame, hop):
        w = x[i:i + frame]
        if np.sqrt((w ** 2).mean()) < 0.02:
            continue
        w = w - w.mean()
        ac = np.correlate(w, w, 'full')[frame - 1:]
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[0] > 0 and ac[k] / ac[0] > 0.45:
            out.append(SR / k)
    return np.array(out)


def lufs(path):
    out = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


def groups(voice_dir):
    found = defaultdict(list)
    for f in sorted(voice_dir.glob('*.mp3')):
        m = TAKE.match(f.name)
        if m:
            found[m['line']].append(f)
        else:
            print(f'skipped {f.name}: not named <line-id>-<n>.mp3')
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--voice-dir', required=True)
    ap.add_argument('--write-edl', help='EDL JSON whose voice lines get the picked takes')
    ap.add_argument('ids', nargs='*', help='only these line ids (default: every group)')
    args = ap.parse_args()
    found = groups(Path(args.voice_dir).expanduser())
    picks = {}
    for line in args.ids or sorted(found):
        if line not in found:
            print(f'{line}: no takes found')
            continue
        rows = []
        for path in found[line]:
            x = load(path)
            pitch = f0(x)
            spread = float(np.std(12 * np.log2(pitch / np.median(pitch)))) if len(pitch) else float('nan')
            rows.append((spread, path.stem, len(x) / SR, lufs(path)))
        rows.sort()
        picks[line] = rows[0][1]
        print(f'{line}  →  {picks[line]}')
        for spread, name, dur, loud in rows:
            print(f'    {name:28} {dur:6.2f} s   pitch σ {spread:4.2f} st   {loud:6.1f} LUFS')
    if args.write_edl:
        path = Path(args.write_edl)
        edl = json.loads(path.read_text())
        lines = edl['voice']['lines']
        changed = pinned = 0
        for entry in lines:
            if entry.get('pin'):
                pinned += 1
                continue
            pick = picks.get(entry.get('line'))
            if pick and entry.get('take') != pick:
                entry['take'] = pick
                entry.pop('cut', None)   # a cut point belongs to the old take
                changed += 1
        path.write_text(json.dumps(edl, indent=2, ensure_ascii=False) + '\n')
        unset = [e['id'] for e in lines if not e.get('take')]
        print(f'{path}: {len(lines)} lines, {changed} takes changed, {pinned} pinned'
              + (f'; still without a take: {", ".join(unset)}' if unset else ''))


if __name__ == '__main__':
    main()
