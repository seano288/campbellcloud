"""PROTOTYPE: record every phrase the app-shell and Garage prototypes say, with the same neural voice
and settings as tools/make_voice.py, and write them into voice.js next to the clips copied from the game.

  python3 -m venv venv && venv/bin/pip install edge-tts
  venv/bin/python make_prototype_voice.py

Only phrases missing from voice.js are recorded. say.js joins money amounts from the
"N dollars" / "N cents" clips, so sentences with an amount are listed here as their pieces.
"""
import asyncio, base64, json, re, tempfile
from pathlib import Path
import edge_tts

VOICE = 'en-US-AvaNeural'  # same as tools/make_voice.py
RATE = '-8%'
OUT = Path(__file__).resolve().parent / 'voice.js'

MONEY = [('Penny', '1¢'), ('Nickel', '5¢'), ('Dime', '10¢'), ('Quarter', '25¢'), ('$1 Bill', '$1'), ('$5 Bill', '$5')]
MODES = ['Learn the Coins', 'Count the Cash', 'Pay the Shop']
SHOP = ['Fuel', 'Snack', 'Car Wash', 'Oil', 'Juice', 'Battery']
BODIES = ['Pickup', 'Big Foot', 'Dragster']
SLOTS = {'Tires': ['Small', 'Chunky', 'Giant', 'Mega Spikes'], 'Paint': ['Plain', 'Blue Blast', 'Fire Fade', 'Rainbow Chrome'],
         'Decals': ['None', 'Stripes', 'Flames', 'Lightning'], 'Lights': ['Basic', 'Fog Lights', 'Roof Bar', 'Glow Under'],
         'Horn': ['Beep', 'Honk', 'Air Horn', 'Roar']}
MODS = [m for mods in SLOTS.values() for m in mods]

PHRASES = [
    # app shell
    "Let's go!", 'Garage!', 'How much money is this?', 'Not quite!', "Let's count together.",
    'Tap some money first!', 'Almost!', 'You need', 'more', 'Too much!', 'Take back', 'It costs',
    'You earned 3 Bolts!', 'You can build something new!', 'Level up!', 'Now you get quarters!', 'Now you get dollar bills!',
    'Look!', 'New money!',
    'Play Learn the Coins to open this!', 'Learn more coins to open this!', 'Count more cash to open this!',
    *[f'You opened {m}!' for m in MODES], *[f'You are a {m} star!' for m in MODES],
    *[f'Buy the {s}!' for s in SHOP],
    *[f'This is a {n}.' for n, _ in MONEY], *[f'It is worth {v}.' for _, v in MONEY],
    # money amounts, joined by say.js
    *[f'{c} cent{"" if c == 1 else "s"}' for c in range(0, 100)], *[f'{d} dollar{"" if d == 1 else "s"}' for d in range(1, 10)],
    # Garage
    *BODIES, *SLOTS, *MODS, *[f'You got {m}!' for m in MODS], *[f'You can get {m}!' for m in MODS],
    *[f'You need {n} more Bolt{"" if n == 1 else "s"}.' for n in range(1, 19)], 'You built everything!',
    # celebrations
    'Wow!', "That's the best one!",
]


def speakable(s):  # as in tools/make_voice.py
    for a, b in [('$1 Bill', 'one dollar bill'), ('$5 Bill', 'five dollar bill'), ('$1', 'one dollar'), ('$5', 'five dollars'),
                 ('VROOM', 'Vroom'), ('Truck-tastic', 'Truck tastic')]:
        s = s.replace(a, b)
    return re.sub(r'(\d+)¢', lambda m: 'one cent' if m[1] == '1' else f'{m[1]} cents', s)


async def record(text, out, sem):
    async with sem:
        await edge_tts.Communicate(speakable(text), VOICE, rate=RATE).save(out)
    return base64.b64encode(Path(out).read_bytes()).decode()


async def main():
    src = OUT.read_text()
    voice = json.loads(re.search(r'window\.VOICE = (\{.*\});', src, re.S)[1])
    todo = [p for p in dict.fromkeys(PHRASES) if p not in voice]
    sem = asyncio.Semaphore(8)
    with tempfile.TemporaryDirectory() as tmp:
        clips = await asyncio.gather(*(record(t, f'{tmp}/{i}.mp3', sem) for i, t in enumerate(todo)))
    voice.update({t: f'data:audio/mpeg;base64,{c}' for t, c in zip(todo, clips)})
    OUT.write_text('// PROTOTYPE voice clips: the game\'s clips plus the prototype phrases (make_prototype_voice.py)\n'
                   f'window.VOICE = {json.dumps(voice, ensure_ascii=False)};\n')
    print(f'Recorded {len(todo)} new clips with {VOICE}; voice.js now has {len(voice)}')

asyncio.run(main())
