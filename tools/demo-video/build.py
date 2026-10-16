"""Stage, check and build a HyperFrames demo walkthrough from one EDL JSON.

    python3 build.py init  <project-dir>                          # scaffold package.json + hyperframes.json
    python3 build.py stage <edl.json> --project <project-dir> [--raw <dir>] [--voice-dir <dir>]
    python3 build.py check <edl.json> --project <project-dir>     # fails on any missing media file
    python3 build.py build <edl.json> --project <project-dir>     # write index.html + edit.json

Order for a new cut: init → voice.py → pick-takes.py --write-edl → stage → check → build →
`npm run check` → `npm run render -- --quality draft --fps 30 -o ../draft-1.mp4` (in the project).

EDL shape (worked example: examples/tallgrass-field-training/edl.json):
  title, canvas {width, height, background}, duration, fadeOut {at}
  rawDir      the capture folder; `sources` and `stills` paths are relative to it unless absolute.
              Relative rawDir/voiceDir resolve against the EDL file's folder; `~` is expanded.
              --raw / --voice-dir override them.
  voiceDir    where voice.py wrote the takes; `stage` copies each line's picked `take` from it
  sources     {"<asset path>": "<file in rawDir, or an absolute path>"}   copied by `stage`
  stills      {"<asset path>": {"from": "<file in rawDir, or absolute>", "at": <seconds> | "end"}}
              frames extracted by `stage` with ffmpeg ("end" = the take's last frame)
  font        asset path for the caption font; `stage` copies Public Sans from
              $DEMO_APP_DIR/packages/ui/node_modules/@fontsource/public-sans and fails if it is
              not there (run `pnpm install` in events/onboarding, or point DEMO_APP_DIR at a
              checkout that has node_modules). Omit `font` to use the system sans-serif.
  roomTone    {src, gain}; `stage` generates src with ffmpeg if it is missing
  phone       {left, top, width, height, radius}   the full phone pose
  desktop[]   {id, src | still, start, duration, mediaStart?, hold?, note?}   inside #cam
  phoneClips[] {id, src | still, start, duration, mediaStart?, hold?, note?}  inside #rig
  phoneBackgrounds[] {id, start, duration, fadeIn?}
  holds[]     {start, end, why}   intentional narrated holds (stills and hold:true clips count too)
  caption     {text, start, duration, left, top}
  voice       {dir, targetLufs, lines[]: {id, line, take, start, cut?}}
              `line` is the voice.py line id; `take` (e.g. "caleb-intro-2") is filled in by
              `pick-takes.py --write-edl`
  motion      {rig[], cam[]}: steps {at, set:{…}} or {at, to:{…}, duration, ease}
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
HYPERFRAMES_VERSION = '0.8.96'   # pinned by `init`; `npm run upgrade` in the project moves it
FONT_REL = 'packages/ui/node_modules/@fontsource/public-sans/files/public-sans-latin-400-normal.woff2'
# Band-limited pink noise at about -60 dBFS RMS (peak about -47 dBFS); the EDL gain lifts it.
ROOM_TONE_FILTER = 'highpass=f=90,lowpass=f=2500,volume=-38.5dB'


def fail(msg):
    sys.exit(f'build.py: {msg}')


def load_edl(path):
    edl = json.loads(Path(path).read_text())
    edl['_base'] = Path(path).expanduser().resolve().parent
    return edl


def resolve_dir(edl, key, override):
    """rawDir / voiceDir: a flag wins; else the EDL field, relative to the EDL file's folder."""
    value = override or edl.get(key)
    if not value:
        return None
    p = Path(value).expanduser()
    return p if p.is_absolute() else edl['_base'] / p


def resolve_file(base, value):
    p = Path(value).expanduser()
    if p.is_absolute():
        return p
    if base is None:
        fail(f'"{value}" is relative but the EDL has no rawDir (and no --raw was given)')
    return base / p


# ── structure ────────────────────────────────────────────────────────────────

def validate(edl):
    for key in ('canvas', 'duration', 'phone', 'desktop', 'phoneClips', 'voice'):
        if key not in edl:
            fail(f'EDL is missing "{key}"')
    total = edl['duration']
    seen = set()
    for group in ('desktop', 'phoneClips', 'phoneBackgrounds'):
        for clip in edl.get(group, []):
            cid = clip.get('id')
            if not cid or cid in seen:
                fail(f'{group}: missing or duplicate id {cid!r}')
            seen.add(cid)
            if group != 'phoneBackgrounds' and bool(clip.get('src')) == bool(clip.get('still')):
                fail(f'{cid}: give exactly one of "src" (video) or "still" (image)')
            end = clip['start'] + clip['duration']
            if clip['duration'] <= 0 or end > total + 1e-6:
                fail(f'{cid}: window {clip["start"]}–{end:.3f} is empty or runs past duration {total}')
    for line in edl['voice']['lines']:
        if line['id'] in seen:
            fail(f'voice line id {line["id"]!r} collides with a clip id')
        seen.add(line['id'])
        if not line.get('take'):
            fail(f'voice line {line["id"]}: no "take" — run pick-takes.py --write-edl')
    for lane in ('rig', 'cam'):
        for step in edl.get('motion', {}).get(lane, []):
            if ('set' in step) == ('to' in step):
                fail(f'motion.{lane} step at {step.get("at")} needs exactly one of "set" or "to"')
    return total


def media_paths(edl):
    """Every file the composition loads, relative to the project directory."""
    paths = []
    for group in ('desktop', 'phoneClips'):
        for clip in edl.get(group, []):
            paths.append(clip.get('src') or clip['still'])
    vdir = edl['voice'].get('dir', 'assets/voice')
    paths += [f'{vdir}/{line["take"]}.mp3' for line in edl['voice']['lines'] if line.get('take')]
    if edl.get('roomTone'):
        paths.append(edl['roomTone']['src'])
    return list(dict.fromkeys(paths))


def font_source():
    app = Path(os.environ.get('DEMO_APP_DIR', HERE.parent.parent / 'events/onboarding')).expanduser()
    return app / FONT_REL


FONT_FIX = ('run `pnpm install` in events/onboarding, or set DEMO_APP_DIR to an events/onboarding '
            'checkout that has node_modules')


# ── init ─────────────────────────────────────────────────────────────────────

def cmd_init(project):
    project.mkdir(parents=True, exist_ok=True)
    pin = f'npx --yes hyperframes@{HYPERFRAMES_VERSION}'
    # Always run HyperFrames through these scripts: a bare `npx hyperframes` may resolve a cached,
    # older CLI than the project's pin. `npm run upgrade` moves the pin in this file.
    (project / 'package.json').write_text(json.dumps({
        'name': project.name or 'walkthrough', 'private': True, 'type': 'module',
        'scripts': {'check': f'{pin} check', 'render': f'{pin} render', 'snapshot': f'{pin} snapshot',
                    'preview': f'{pin} preview',
                    'upgrade': 'npx --yes hyperframes@latest upgrade --project .'}}, indent=2) + '\n')
    (project / 'hyperframes.json').write_text(json.dumps({
        '$schema': 'https://hyperframes.heygen.com/schema/hyperframes.json',
        'registry': 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry',
        'paths': {'blocks': 'compositions', 'components': 'compositions/components', 'assets': 'assets'},
        'media': {'autoProxy': True}}, indent=2) + '\n')
    for sub in ('assets/recordings', 'assets/stills', 'assets/voice', 'assets/fonts'):
        (project / sub).mkdir(parents=True, exist_ok=True)
    print(f'scaffolded {project} (hyperframes {HYPERFRAMES_VERSION}). Next, in that folder:\n'
          '  npm run upgrade   # move the pin to the current release\n'
          '  npm run check     # always use the npm scripts: they run the pinned CLI')


# ── stage ────────────────────────────────────────────────────────────────────

def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def cmd_stage(edl, raw, voice_dir, project):
    if raw is not None and not raw.is_dir():
        fail(f'rawDir {raw} not found')
    font = edl.get('font')
    if font and not (project / font).exists() and not font_source().exists():
        fail(f'font source {font_source()} not found — {FONT_FIX}')
    unpicked = [line['id'] for line in edl['voice']['lines'] if not line.get('take')]
    if unpicked:
        fail(f'voice lines without a take: {", ".join(unpicked)} — run pick-takes.py --write-edl first')
    staged = 0
    for dest, src in edl.get('sources', {}).items():
        s = resolve_file(raw, src)
        if not s.exists():
            fail(f'source {s} for {dest} not found')
        d = project / dest
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, d)
        staged += 1
    for dest, spec in edl.get('stills', {}).items():
        s = resolve_file(raw, spec['from'])
        if not s.exists():
            fail(f'still source {s} for {dest} not found')
        d = project / dest
        d.parent.mkdir(parents=True, exist_ok=True)
        if spec['at'] == 'end':
            ffmpeg('-sseof', '-0.05', '-i', str(s), '-frames:v', '1', str(d))
        else:
            ffmpeg('-ss', str(spec['at']), '-i', str(s), '-frames:v', '1', str(d))
        staged += 1
    vdir = project / edl['voice'].get('dir', 'assets/voice')
    vdir.mkdir(parents=True, exist_ok=True)
    for line in edl['voice']['lines']:
        name = f'{line["take"]}.mp3'
        if voice_dir is None:
            if (vdir / name).exists():
                continue
            fail(f'{vdir / name} is missing and the EDL has no voiceDir (and no --voice-dir was given)')
        src = voice_dir / name
        if not src.exists():
            fail(f'voice take {src} not found')
        # A regenerated take keeps its file name, so always refresh from the source folder.
        if (vdir / name).exists() and src.resolve() == (vdir / name).resolve():
            continue
        shutil.copy2(src, vdir / name)
        staged += 1
    if font and not (project / font).exists():
        (project / font).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(font_source(), project / font)
        staged += 1
    room = edl.get('roomTone')
    if room and not (project / room['src']).exists():
        d = project / room['src']
        d.parent.mkdir(parents=True, exist_ok=True)
        ffmpeg('-f', 'lavfi', '-i', f'anoisesrc=color=pink:amplitude=1:duration={edl["duration"] + 2}:sample_rate=48000:seed=7',
               '-af', ROOM_TONE_FILTER, '-ac', '2', str(d))
        staged += 1
    print(f'staged {staged} file(s) into {project}')


# ── check ────────────────────────────────────────────────────────────────────

def cmd_check(edl, project):
    total = validate(edl)
    files = media_paths(edl) + ([edl['font']] if edl.get('font') else [])
    missing = [p for p in files if not (project / p).exists()]
    if missing:
        fail('missing media in ' + str(project) + ':\n  ' + '\n  '.join(missing) +
             '\nRun `build.py stage` (takes, stills, voice takes, font, room tone).')
    print(f'EDL OK: {len(edl["desktop"])} desktop, {len(edl["phoneClips"])} phone, '
          f'{len(edl["voice"]["lines"])} voice lines, {total} s; all {len(files)} media files present')


# ── build ────────────────────────────────────────────────────────────────────

def ffprobe_duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                          '-of', 'default=nw=1:nk=1', str(path)], text=True))


def lufs(path):
    out = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    lines = [l for l in out.splitlines() if l.strip().startswith('I:')]
    if not lines:
        fail(f'could not measure loudness of {path}')
    return float(lines[-1].split()[1])


def js_value(v):
    return json.dumps(v, separators=(',', ':'))


def steps_js(selector, steps):
    out = []
    for s in steps:
        if 'set' in s:
            out.append(f'tl.set({js_value(selector)},{js_value(s["set"])},{s["at"]});')
        else:
            props = dict(s['to'], duration=s.get('duration', 0.6), ease=s.get('ease', 'power2.inOut'))
            out.append(f'tl.to({js_value(selector)},{js_value(props)},{s["at"]});')
    return '\n'.join(out)


def media_tag(clip, cls, track):
    common = f'id="{clip["id"]}" class="clip {cls}" data-start="{clip["start"]}" data-duration="{clip["duration"]}" data-track-index="{track}"'
    if clip.get('still'):
        return f'<img {common} src="{clip["still"]}">'
    return (f'<video {common} src="{clip["src"]}" data-media-start="{clip.get("mediaStart", 0)}" '
            f'muted playsinline></video>')


def cmd_build(edl, project):
    cmd_check(edl, project)
    total = edl['duration']
    c, ph = edl['canvas'], edl['phone']
    bg = c.get('background', '#ecebe8')
    cap = edl.get('caption')
    fade_at = edl.get('fadeOut', {}).get('at')
    font = edl.get('font')
    font_face = f'@font-face{{font-family:DemoSans;src:url({font})}}\n' if font else ''
    style = f'''{font_face}html,body{{margin:0;width:100%;height:100%;overflow:hidden;background:{bg}}}
#root{{position:relative;width:100%;height:100%;overflow:hidden;background:{bg}}}
#cam{{position:absolute;inset:0}}
.desktop{{position:absolute;left:0;top:0;width:{c["width"]}px;height:{c["height"]}px;object-fit:cover}}
.bg{{position:absolute;inset:0;background:{bg}}}
#rig{{position:absolute;left:{ph["left"]}px;top:{ph["top"]}px;width:{ph["width"]}px;height:{ph["height"]}px;border-radius:{ph.get("radius", 28)}px;overflow:hidden;background:#f7f7f7;box-shadow:0 28px 70px rgba(20,20,20,.16),0 3px 10px rgba(20,20,20,.08)}}
.phone{{position:absolute;left:0;top:0;width:{ph["width"]}px;height:auto}}
#caption{{position:absolute;left:{(cap or {}).get("left", 1270)}px;top:{(cap or {}).get("top", 520)}px;width:420px;font:400 30px/1.3 {"DemoSans," if font_face else ""}sans-serif;color:#3d3c3a}}
#caption span{{opacity:0}}
#fade{{position:absolute;inset:0;background:#000;opacity:0}}'''

    h = ['<!doctype html><html><head><meta charset="utf-8">',
         '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>',
         f'<style>{style}</style></head><body>',
         f'<div id="root" data-composition-id="main" data-width="{c["width"]}" data-height="{c["height"]}" data-duration="{total}">',
         '<div id="cam">']
    for i, clip in enumerate(edl['desktop']):
        h.append(media_tag(clip, 'desktop', 2 if clip.get('still') else i % 2))
    h.append('</div>')
    for b in edl.get('phoneBackgrounds', []):
        h.append(f'<div id="{b["id"]}" class="clip bg" data-start="{b["start"]}" data-duration="{b["duration"]}" data-track-index="3"></div>')
    h.append('<div id="rig" data-layout-allow-overflow="true">')
    for i, clip in enumerate(edl['phoneClips']):
        h.append(media_tag(clip, 'phone', 6 if clip.get('still') else 4 + i % 2))
    h.append('</div>')
    if cap:
        h.append(f'<div id="caption" class="clip" data-start="{cap["start"]}" data-duration="{cap["duration"]}" '
                 f'data-track-index="7"><span>{cap["text"]}</span></div>')
    if fade_at is not None:
        h.append(f'<div id="fade" class="clip" data-start="{fade_at}" data-duration="{round(total - fade_at, 3)}" data-track-index="8"></div>')

    voice = edl['voice']
    vdir = voice.get('dir', 'assets/voice')
    target = voice.get('targetLufs', -20.2)
    voices = []
    for line in voice['lines']:
        rel = f'{vdir}/{line["take"]}.mp3'
        path = project / rel
        d = line.get('cut') or round(ffprobe_duration(path), 3)
        if line['start'] + d > total + 1e-6:
            fail(f'voice line {line["id"]} ({line["take"]}) ends at {line["start"] + d:.2f} s, past duration {total} — '
                 'start it earlier, extend the EDL duration, or give it a "cut" that ends in a silence')
        vol = round(10 ** ((target - lufs(path)) / 20), 3)
        voices.append(dict(id=line['id'], src=rel, start=line['start'], duration=d,
                           end=round(line['start'] + d, 3), volume=vol))
        h.append(f'<audio id="{line["id"]}" src="{rel}" data-start="{line["start"]}" data-duration="{d}" '
                 f'data-volume="{vol}" data-track-index="9"></audio>')
    room = edl.get('roomTone')
    if room:
        end_level = fade_at if fade_at is not None else total
        auto = json.dumps({'version': 1, 'lanes': [{'target': 'volume', 'points': [
            {'t': 0, 'v': 0}, {'t': .3, 'v': room.get('gain', 2.5)}, {'t': end_level, 'v': room.get('gain', 2.5)},
            {'t': total, 'v': 0}]}]}, separators=(',', ':'))
        h.append(f'<audio id="room-tone" src="{room["src"]}" data-start="0" data-duration="{total}" '
                 f'data-track-index="10" data-automation=\'{auto}\'></audio>')

    js = ['const tl=gsap.timeline({paused:true});',
          'tl.set("#rig",{opacity:1,x:0,y:0,scale:1,transformOrigin:"0 0"},0);',
          'tl.set("#cam",{scale:1,x:0,y:0},0);',
          steps_js('#rig', edl.get('motion', {}).get('rig', [])),
          steps_js('#cam', edl.get('motion', {}).get('cam', []))]
    for b in edl.get('phoneBackgrounds', []):
        if b.get('fadeIn'):
            js.append(f'tl.set("#{b["id"]}",{{opacity:0}},0).to("#{b["id"]}",{{opacity:1,duration:{b["fadeIn"]},ease:"power2.inOut"}},{b["start"]});')
    if cap:
        js.append(f'tl.to("#caption span",{{opacity:1,duration:.3}},{cap["start"]})'
                  f'.to("#caption span",{{opacity:0,duration:.3}},{round(cap["start"] + cap["duration"] - 0.3, 3)});')
    if fade_at is not None:
        js.append(f'tl.to("#fade",{{opacity:1,duration:{round(total - fade_at, 3)},ease:"none"}},{fade_at});')
    js.append('window.__timelines["main"]=tl;')
    h.append('</div><script>' + '\n'.join(js) + '</script></body></html>')

    (project / 'index.html').write_text('\n'.join(h))
    edit = {k: v for k, v in edl.items() if k != '_base'}
    (project / 'edit.json').write_text(json.dumps(dict(edit, voices=voices), indent=1))
    for v in voices:
        print(f"{v['id']:16} {v['start']:7.2f} → {v['end']:7.2f}  vol {v['volume']:<6} {v['src']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('init', help='scaffold package.json + hyperframes.json')
    p.add_argument('project')
    for name, help_ in (('stage', 'copy takes, extract stills, write font and room tone'),
                        ('check', 'validate the EDL and fail on missing media'),
                        ('build', 'write index.html + edit.json')):
        p = sub.add_parser(name, help=help_)
        p.add_argument('edl')
        p.add_argument('--project', required=True)
        if name == 'stage':
            p.add_argument('--raw', help='capture folder (overrides the EDL rawDir)')
            p.add_argument('--voice-dir', help='folder of voice takes (overrides the EDL voiceDir)')
    args = ap.parse_args()
    if args.cmd == 'init':
        cmd_init(Path(args.project).expanduser())
        return
    edl, project = load_edl(args.edl), Path(args.project).expanduser()
    if args.cmd == 'stage':
        cmd_stage(edl, resolve_dir(edl, 'rawDir', args.raw), resolve_dir(edl, 'voiceDir', args.voice_dir), project)
    elif args.cmd == 'check':
        cmd_check(edl, project)
    else:
        cmd_build(edl, project)


if __name__ == '__main__':
    main()
