"""Record every phrase the game says with a natural neural voice, one clip per phrase.

  python3 -m venv .venv && .venv/bin/pip install edge-tts
  .venv/bin/python tools/make_voice.py --collection money --out public/voice --index src/voice/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection time-flies --out public/time-flies-voice --index src/time-flies/voice.gen.ts

Select phrases through tools/phrases.ts and write recordings and a typed index to explicit locations.
Only missing clips are recorded. Cleanup touches only the selected directory, whose .voice-collection
must match the collection. --index-only selects existing shared recordings without recording or cleanup.
"""
import argparse, asyncio, hashlib, json, re, subprocess
from pathlib import Path

VOICE = 'en-US-AvaNeural'
RATE = '-8%'
ROOT = Path(__file__).resolve().parent.parent


def speakable(s):
    for a, b in [('$1 Bill', 'one dollar bill'), ('$5 Bill', 'five dollar bill'), ('$1', 'one dollar'), ('$5', 'five dollars'),
                 ('VROOM', 'Vroom'), ('Truck-tastic', 'Truck tastic'),
                 # Time Flies: aircraft names said the way pilots say them
                 ('F/A-18', 'F A 18'), ('F-117', 'F one seventeen'), ('Lightning II', 'Lightning Two'), ('SR-71', 'S R 71'),
                 ('F4U', 'F 4 U')]:
        s = s.replace(a, b)
    return re.sub(r'(\d+)¢', lambda m: 'one cent' if m[1] == '1' else f'{m[1]} cents', s)


def clip_id(text):
    # a change of voice, rate or spoken text makes a new clip
    return hashlib.sha1(f'{VOICE}|{RATE}|{speakable(text)}'.encode()).hexdigest()[:12]


async def record(text, out, sem):
    import edge_tts
    async with sem:
        for attempt in range(3):
            try:
                return await edge_tts.Communicate(speakable(text), VOICE, rate=RATE).save(str(out))
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(2)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--collection', required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--index', type=Path, required=True)
    parser.add_argument('--index-only', action='store_true')
    args = parser.parse_args()
    clips, index = args.out.resolve(), args.index.resolve()
    phrases = json.loads(subprocess.run(['npx', 'tsx', 'tools/phrases.ts', '--collection', args.collection], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    files = {p: f'{clip_id(p)}.mp3' for p in phrases}
    todo = [p for p, f in files.items() if not (clips / f).is_file()]
    stale = []
    if args.index_only:
        if todo:
            raise ValueError(f'Missing selected recordings in {clips}: {todo}')
    else:
        owner = clips / '.voice-collection'
        if owner.exists():
            if owner.read_text().strip() != args.collection:
                raise ValueError(f'{clips} belongs to another voice collection')
        elif clips.exists() and any(clips.iterdir()):
            raise ValueError(f'{clips} has no collection owner; select an empty output directory')
        clips.mkdir(parents=True, exist_ok=True)
        owner.write_text(args.collection + '\n')
        sem = asyncio.Semaphore(8)
        await asyncio.gather(*(record(p, clips / files[p], sem) for p in todo))
        keep = set(files.values())
        stale = [f for f in clips.glob('*.mp3') if f.name not in keep]
        for f in stale:
            f.unlink()
    body = ''.join(f'  {json.dumps(p, ensure_ascii=False)}: {json.dumps(f)},\n' for p, f in files.items())
    header = ''.join(line + '\n' for line in index.read_text().splitlines() if line.startswith('//')) if index.exists() else ''
    index.write_text(header + f'export const CLIPS = {{\n{body}}} as const;\n')
    print(f'{len(phrases)} phrases: recorded {len(todo)}, removed {len(stale)} stale clips, with {VOICE}')

asyncio.run(main())
