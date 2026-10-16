# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "kokoro==0.9.4",
#   "transformers>=5",   # without it, the cooldown backtracks to transformers 4.12, which needs Rust to build
#   "en-core-web-sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
# ]
# [tool.uv]
# exclude-newer = "2026-10-03T00:00:00Z"   # a 7-day cooldown; voice.py.lock pins every package by hash
# ///
"""Generate Kokoro narration takes for a demo walkthrough.

    uv run --locked tools/demo-video/voice.py <lines.json> --project <dir> [line-id ...]

Writes <dir>/assets/voice/<id>-<n>.mp3 (n = 1..takes) and records them in
<dir>/narration-takes.json. Re-running skips takes that already exist; changing a line's text, or the voice or
speed, starts its takes over; the replaced files move to <dir>/assets/voice/_replaced/.
Kokoro-82M (Apache-2.0) runs on this machine: there is no API key, and no text leaves it. The first run downloads Python 3.12 (when it is not installed), the packages and the model
(about 1 GB) into uv's and Hugging Face's caches; later runs start in seconds.

lines.json (see examples/voice-lines.json; a full film: examples/tallgrass-field-training/voice-lines.json):
  {"voice": "af_heart", "speed": 1, "takes": 1,
   "lines": {"caleb-intro": "So this is Caleb. He's a pipefitter, …", …}}

The voice's first letter is its language (a = American English, b = British English). Kokoro reads a
bracketed tag such as [calm] aloud, so a line with one is refused; the one bracket form it understands is a
pronunciation override, [Percipio](/pɚsˈɪpiˌO/). Repeat takes of a line come out almost identical, so one
take is the default: change the words, the punctuation or the speed to change the delivery.
Wording and pacing rules: .claude/skills/demo-video/references/narration.md.
Then write the picks into the EDL: pick-takes.py --voice-dir <dir>/assets/voice --write-edl edl.json.
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import time
import warnings
from importlib.metadata import version
from pathlib import Path

SAMPLE_RATE = 24000
REPO = 'hexgrad/Kokoro-82M'
REVISION = 'f3ff3571791e39611d31c381e3a41a3af07b4987'   # model weights and voices; doctor.sh reads this line
# A bracket not followed by "(": a style tag, which Kokoro would speak. "[word](/phonemes/)" is allowed.
TAG = re.compile(r'\[[^\]]*\](?!\()')


def pipeline(voice):
    """The Kokoro pipeline and the voice file, both from the pinned REVISION (Kokoro itself reads `main`)."""
    os.environ.setdefault('HF_HUB_VERBOSITY', 'error')   # the model is public: no token needed, no warning
    warnings.filterwarnings('ignore', category=FutureWarning, module='torch')
    warnings.filterwarnings('ignore', message='dropout option adds dropout', category=UserWarning)
    from huggingface_hub import hf_hub_download
    from kokoro import KModel, KPipeline

    def get(name):
        return hf_hub_download(REPO, name, revision=REVISION)
    model = KModel(repo_id=REPO, config=get('config.json'), model=get('kokoro-v1_0.pth')).eval()
    return KPipeline(lang_code=voice[0], repo_id=REPO, model=model), get(f'voices/{voice}.pt')


def tts(pipe, voice_file, cfg, text, out):
    import torch
    audio = [a for _, _, a in pipe(text, voice=voice_file, speed=cfg.get('speed', 1))]
    if not audio:
        sys.exit(f'voice.py: Kokoro made no audio for {out.stem} — is the line empty?')
    pcm = torch.cat(audio).numpy().astype('<f4').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SAMPLE_RATE), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '128k', str(out)], input=pcm, check=True)


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                          '-of', 'default=nw=1:nk=1', str(path)], text=True))


def set_aside(project, take):
    """Move a take that no longer matches its inputs out of the folder pick-takes.py ranks, keeping a copy."""
    old = project / take['file']
    if old.exists():
        stamp = time.strftime('%Y%m%d-%H%M%S', time.localtime(old.stat().st_mtime))
        dest = old.parent / '_replaced' / f'{old.stem}.{stamp}{old.suffix}'
        n = 1
        while dest.exists():
            n += 1
            dest = dest.with_name(f'{old.stem}.{stamp}-{n}{old.suffix}')
        dest.parent.mkdir(exist_ok=True)
        old.replace(dest)
        print(f'moved {old.name} to {dest.relative_to(project)}', flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('lines')
    ap.add_argument('--project', required=True)
    ap.add_argument('ids', nargs='*')
    args = ap.parse_intermixed_args()   # so a line id may follow --project
    cfg = json.loads(Path(args.lines).read_text(encoding='utf-8'))   # Windows would default to cp1252 and garble "…"
    ids = args.ids or list(cfg['lines'])
    unknown = [lid for lid in ids if lid not in cfg['lines']]
    if unknown:
        sys.exit(f'voice.py: no such line in {args.lines}: {", ".join(unknown)}')
    tagged = [f'  {lid}: {", ".join(TAG.findall(cfg["lines"][lid]))}' for lid in ids if TAG.search(cfg['lines'][lid])]
    if tagged:
        sys.exit('voice.py: Kokoro would read these tags aloud — remove them '
                 '(pacing comes from punctuation, see narration.md):\n' + '\n'.join(tagged))
    project = Path(args.project)
    (project / 'assets/voice').mkdir(parents=True, exist_ok=True)
    takes_file = project / 'narration-takes.json'
    takes = json.loads(takes_file.read_text()) if takes_file.exists() else {}
    # Every input of the generation call: a change to any of them invalidates the saved takes.
    engine = ', '.join(f'{pkg} {version(pkg)}' for pkg in ('kokoro', 'misaki', 'torch'))
    inputs = {'engine': engine, 'model': f'{REPO}@{REVISION}', 'voice': cfg['voice'], 'speed': cfg.get('speed', 1)}
    loaded = None   # (pipeline, voice file), loaded on the first take that is needed
    for lid in ids:
        text = cfg['lines'][lid]
        entry = takes.setdefault(lid, {'text': text, 'inputs': inputs, 'takes': []})
        if entry['text'] != text or entry.get('inputs') != inputs:
            # Move the old files too: pick-takes.py ranks every <line-id>-<n>.mp3 in the folder.
            for old in entry['takes']:
                set_aside(project, old)
            entry.update(text=text, inputs=inputs, takes=[])
        for extra in entry['takes'][cfg.get('takes', 1):]:   # `takes` was lowered
            set_aside(project, extra)
        del entry['takes'][cfg.get('takes', 1):]
        # A take file the index does not list (copied in, or the index is missing) is set aside
        # too, so ffmpeg never overwrites it and pick-takes.py never ranks it beside these takes.
        listed = {Path(t['file']).name for t in entry['takes']}
        for f in (project / 'assets/voice').glob(f'{glob.escape(lid)}-*.mp3'):
            if re.fullmatch(rf'{re.escape(lid)}-\d+\.mp3', f.name) and f.name not in listed:
                set_aside(project, {'file': str(f.relative_to(project))})
        while len(entry['takes']) < cfg.get('takes', 1):
            loaded = loaded or pipeline(cfg['voice'])
            n = len(entry['takes']) + 1
            out = project / 'assets/voice' / f'{lid}-{n}.mp3'
            tts(*loaded, cfg, text, out)
            entry['takes'].append({'file': str(out.relative_to(project)), 'duration': round(duration(out), 3)})
            print(lid, n, entry['takes'][-1]['duration'], flush=True)
        takes_file.write_text(json.dumps(takes, indent=2))


if __name__ == '__main__':
    main()
