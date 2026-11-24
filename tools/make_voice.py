"""Record every phrase the game says with a natural neural voice, one clip per phrase.

  python3 -m venv .venv && .venv/bin/pip install edge-tts
  .venv/bin/python tools/make_voice.py --collection money --out public/voice --index src/voice/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection time-flies --out public/time-flies-voice --index src/time-flies/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection purrdoku --out public/purrdoku-voice --index src/purrdoku/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection chop-chop --out public/chop-chop-voice --index src/chop-chop/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection sight-squad --out public/sight-squad-voice --index src/sight-squad/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection math-bots --out public/math-bots-voice --index src/math-bots/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection rover-code --out public/rover-code-voice --index src/rover-code/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection treasure-fleet --out public/treasure-fleet-voice --index src/treasure-fleet/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection wild-rescue --out public/wild-rescue-voice --index src/wild-rescue/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection sentence-express --out public/sentence-express-voice --index src/sentence-express/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection word-wreckers --out public/word-wreckers-voice --index src/word-wreckers/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection turbo-tally --out public/turbo-tally-voice --index src/turbo-tally/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection hook-and-ladder --out public/hook-and-ladder-voice --index src/hook-and-ladder/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection dino-dig --out public/dino-dig-voice --index src/dino-dig/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection food-truck --out public/food-truck-voice --index src/food-truck/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection deep-light --out public/deep-light-voice --index src/deep-light/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection sky-writer --out public/sky-writer-voice --index src/sky-writer/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection skyline --out public/skyline-voice --index src/skyline/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection jetway --out public/jetway-voice --index src/jetway/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection carrier-deck --out public/carrier-deck-voice --index src/carrier-deck/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection cargo-words --out public/cargo-words-voice --index src/cargo-words/voice.gen.ts
  .venv/bin/python tools/make_voice.py --collection moon-base-mail --out public/moon-base-mail-voice --index src/moon-base-mail/voice.gen.ts

Select phrases through tools/phrases.ts and write recordings and a typed index to explicit locations.
Only missing clips are recorded. Cleanup touches only the selected directory, whose .voice-collection
must match the collection. --index-only selects existing shared recordings without recording or cleanup.
"""
import argparse, asyncio, hashlib, json, re, subprocess
from pathlib import Path

VOICE = 'en-US-AvaNeural'
RATE = '-8%'
# Purrdoku's sarcastic narrator: a dry British voice, a touch slow so the deadpan lines land
VOICES = {'purrdoku': ('en-GB-RyanNeural', '-5%'),
          # Sight Squad teaches reading, so short vowels must be crisp: Ava blurs them ("did" sounds like "dead", "hat" like "hot")
          'sight-squad': ('en-US-AriaNeural', '-8%'),
          # Math Bots chains numbers into lines: Aria keeps "plus" and "ten" crisp, and teens clearly longer than decades
          'math-bots': ('en-US-AriaNeural', '-8%'),
          # Rover Code chains numbers into lines like Math Bots, and says directions and pattern pieces one clip at a time
          'rover-code': ('en-US-AriaNeural', '-8%'),
          # Treasure Fleet chains directions and grid squares ("Go", "north", "2", "squares."; "Tap", "B.", "2") and says letter names
          'treasure-fleet': ('en-US-AriaNeural', '-8%'),
          # Wild Rescue says the most whole sentences of any game (questions, lessons and a fact for every animal) and reads its answer
          # choices aloud; Aria keeps short animal and habitat words clear
          'wild-rescue': ('en-US-AriaNeural', '-8%'),
          # Sentence Express says every sentence whole and every word alone, so short vowels must be crisp, as in Sight Squad
          'sentence-express': ('en-US-AriaNeural', '-8%'),
          # Word Wreckers says every list word alone (spelling by sound), where Ava blurs short vowels
          'word-wreckers': ('en-US-AriaNeural', '-8%'),
          # Turbo Tally chains numbers, places and Rival names into lines like Math Bots, and says colour words in whole sentences
          'turbo-tally': ('en-US-AriaNeural', '-8%'),
          # Hook and Ladder says every word alone (opposites, compounds, endings), and jump / jumps / jumped / jumping must differ
          'hook-and-ladder': ('en-US-AriaNeural', '-8%'),
          # Dino Dig says every list word alone and slowly (reading by sound), where Ava blurs short vowels
          'dino-dig': ('en-US-AriaNeural', '-8%'),
          # Food Truck chains dollar amounts from number clips ("You have", "8", "dollars.") and says names, foods and things alone
          'food-truck': ('en-US-AriaNeural', '-8%'),
          # Deep Light says whole science sentences and an animal's name and fact, and reads its sentence choices aloud, as Wild Rescue
          'deep-light': ('en-US-AriaNeural', '-8%'),
          # Sky Writer names letters and says short words alone (Write a Word), so short vowels must be crisp, as in the reading games
          'sky-writer': ('en-US-AriaNeural', '-8%'),
          # Skyline chains numbers to 200 (house numbers) and the hundreds to 1,000 into lines ("3", "rows of", "4"), and names every
          # building, vehicle and part in the City alone
          'skyline': ('en-US-AriaNeural', '-8%'),
          # Jetway chains numbers into sums and stories like Math Bots ("38", "people are on the plane."), numbers past 100 as
          # "three hundred" and the rest, and says airport, plane and place names alone
          'jetway': ('en-US-AriaNeural', '-8%'),
          # Carrier Deck chains numbers into story sentences one piece at a time, as Bot Stories does ("40", "jets are on the deck."), and
          # says ship parts, aircraft, Mission and port names alone
          'carrier-deck': ('en-US-AriaNeural', '-8%'),
          # Cargo Words says every long word whole and every syllable alone ("(rab)"), so short vowels must be crisp, as in the reading games
          'cargo-words': ('en-US-AriaNeural', '-8%'),
          # Moon Base Mail says every sentence of every letter whole (the speaker beside it and the lessons), and its questions and
          # short written answers, so short vowels must be crisp, as in the reading games
          'moon-base-mail': ('en-US-AriaNeural', '-8%')}
ROOT = Path(__file__).resolve().parent.parent


# Sight Squad spells words aloud letter by letter: each "Letter X" clip is just the capital letter and a full stop ("R."),
# which the voice names cleanly. Phonetic spellings misfire: "ay" is read as "eye", "eff" as "E F F" and "ar" as "A R".
LETTERS = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')


# Whole phrases the voice mangles when read as written
SAID_AS = {'cat': 'cat!',  # a lone "cat" comes out as "Kate"
           # Math Bots chains these into a number, but alone the voice ends the sentence on them: "ten end", "tenses", "more then"
           'ten and': 'ten, and', 'Ten and': 'Ten, and', 'red wheels and': 'red wheels and,', 'One hundred and': 'One hundred and,',
           'tens is': 'tens, is', 'One more than': 'One more than,', 'Ten more than': 'Ten more than,'}


def speakable(s):
    if s.startswith('Letter ') and s[7:] in LETTERS:
        return s[7:] + '.'
    if s in SAID_AS:
        return SAID_AS[s]
    for a, b in [('$1 Bill', 'one dollar bill'), ('$5 Bill', 'five dollar bill'), ('$1', 'one dollar'), ('$5', 'five dollars'),
                 ('VROOM', 'Vroom'), ('Truck-tastic', 'Truck tastic'),
                 # Time Flies: aircraft names said the way pilots say them
                 ('F/A-18', 'F A 18'), ('F-117', 'F one seventeen'), ('Lightning II', 'Lightning Two'), ('SR-71', 'S R 71'),
                 ('F4U', 'F 4 U'), ('AV-8B', 'A V 8 B'), ('X-29', 'X 29'),
                 # Chop Chop: helicopter names said the way crews say them
                 ('UH-60', 'U H 60'), ('MH-6', 'M H 6'), ('AH-1Z', 'A H 1 Z'), ('UH-1', 'U H 1'), ('AH-64', 'A H 64'),
                 ('Mi-24', 'Mee 24'), ('Mi-26', 'Mee 26'), ('Ka-52', 'Kah 52'), ('CH-47', 'C H 47'), ('CH-53E', 'C H 53 E'),
                 ('RAH-66', 'R A H 66'),
                 # Sight Squad: "Word Hunt Level 2" drops the n ("Word Hut") without a breath before Level
                 (' Hunt Level', ' Hunt, Level'),
                 # Purrdoku: puns said as one word
                 ('Purr-fect', 'Purrfect'), ('Paw-some', 'Pawsome'), ('Meow-velous', 'Meowvelous'), ('Mm-hmm', 'Mm hmm')]:
        s = s.replace(a, b)
    return re.sub(r'(\d+)¢', lambda m: 'one cent' if m[1] == '1' else f'{m[1]} cents', s)


# Lines one game needs said its own way. They apply only to that collection, so the clips other games already have keep their ids.
#   slow:      a phrase starting with the prefix is the rest of it said at a slower rate. Word Wreckers says a word slowly while its
#              sound boxes light: "Slowly: cat" is the word "cat" at that rate.
#   said_as:   like SAID_AS, for this collection only (slow phrases too).
#   voice_for: a word this collection's voice can't say alone, said by another voice (slow phrases too).
#   slow_for:  a word whose slow phrase needs a less slow rate than `slow` (its vowel stretches into another word's).
COLLECTION_SPEECH = {
    'word-wreckers': {
        # the slowest rate that still sounds like the word: at -45% speech-to-text heard nut as "not", pot as "hot", lake as "late"
        'slow': ('Slowly: ', '-40%'),
        # Aria says a lone "cat" as "Kate" however it's written ("cat!", "Cat.", "kat", "cæt"), and a lone "grab" as "crab" (also a word
        # on the list); Jenny says both plainly, fast and slow
        'said_as': {'cat': 'cat'}, 'voice_for': {'cat': 'en-US-JennyNeural', 'grab': 'en-US-JennyNeural'},
    },
    'turbo-tally': {
        # speech-to-text on Aria's clips heard these as "Hong Kong", "Big Rake Horn", "Great Purple", "Make a wing", "Knowing",
        # "Snowball bins", "open-ness" and "Nian"; a breath between the words (or "Neon!") makes each one heard as written
        'said_as': {
            'Honk Horn': 'Honk, Horn', 'You got Honk Horn!': 'You got Honk, Horn!',
            'Big Rig Horn': 'Big Rig, Horn', 'You got Big Rig Horn!': 'You got Big Rig, Horn!',
            'Grape Purple': 'Grape, Purple', 'You got Grape Purple!': 'You got Grape, Purple!',
            'Mega Wing': 'Mega, Wing', 'No Wing': 'No, Wing', 'Snowball Bends': 'Snowball, Bends',
            'Play more Faster Car to open this!': 'Play more Faster Car, to open this!', 'Neon': 'Neon!',
            # added with the four later Cups: names alone, said as names
            'Jojo': 'Jo-Jo!', 'Tiki': 'Tiki!', 'Kong': 'Kong!', 'Nova': 'Nova!', 'Luna': 'Luna!', 'Prism': 'Prism!', 'Orbit': 'Orbit!',
            'Flash': 'Flash!', 'Fudge': 'Fudge!', 'Jelly': 'Jelly!', 'Astro': 'Astro!', 'Cosmo': 'Cosmo!', 'Taffy': 'Taffy!',
            'Moon Cup': 'Moon, Cup', 'You won the Moon Cup!': 'You won the Moon, Cup!',
            'Level': 'Level', 'Win level': 'Win level,', 'Come first to win': 'Come first, to win',
        },
    },
    'hook-and-ladder': {
        # alone, Aria says cat as "Kate", key as "he" and duck as "dack" however they're written (speech-to-text heard each that way);
        # Jenny says all three plainly, and before, bear and grapes too (Aria's came back "the four", "there", "crepes"). A lone "bow"
        # comes out rhyming with cow; the bow in rainbow rhymes with go, which "beau" gets. "owl." keeps its l.
        # cats, keys and ducks are Jenny's too, so Endings' pairs (cat / cats) are one voice: a change of voice between the two choices
        # would tell them apart by the voice, not the ending. (Pass 2 tried Aria with "Cat.", "cat?", "kat", "Key!", "kee", "Bear?",
        # "bair": large-v3-turbo still heard Kate, he and there.)
        'said_as': {'cat': 'cat', 'bow': 'beau', 'owl': 'owl.'},
        # the Grape paint, as grapes: Aria's came back "crepe"
        'voice_for': {w: 'en-US-JennyNeural' for w in ['cat', 'cats', 'key', 'keys', 'duck', 'ducks', 'before', 'bear', 'grapes', 'Grape']},
    },
    # Dino Dig says the same words the same way as Word Wreckers (its own clips, so the two games' folders stay their own): slowly at
    # -40% while the sound boxes light, and "cat" and "grab" in Jenny's voice, which Aria says as "Kate" and "crab". Its own voice test
    # (.scratch/dino-dig/spec.md) also heard Aria's "puff" as "path" and her slow "duck" as "deck", so those are Jenny's too; and her
    # slow "shop", "sock" and "tub" as "sharp", "suck" and "tab", which -20% doesn't do. The review pass's check (both models) still heard
    # slow "tub" as "tab" at -20% (-15% is heard right), and slow "lunch" as "lunge" and "brick" as "break" (-25% and -30% are heard right)
    'dino-dig': {
        'slow': ('Slowly: ', '-40%'),
        # both models heard a plain "Dig here!" as "Take care." and "Play more Hear It to open this!" without its "Hear It"
        'said_as': {'cat': 'cat', 'Dig here!': 'Dig, here!', 'Play more Hear It to open this!': 'Play more, Hear It, to open this!'},
        'voice_for': {'cat': 'en-US-JennyNeural', 'grab': 'en-US-JennyNeural', 'puff': 'en-US-JennyNeural', 'duck': 'en-US-JennyNeural'},
        'slow_for': {'shop': '-20%', 'sock': '-20%', 'tub': '-15%', 'lunch': '-25%', 'brick': '-30%'},
    },
    # Food Truck's kind "Enough?" keeps its question mark on screen, but inside a sentence it would be read as a question
    'food-truck': {
        'said_as': {
            'Play more Enough? to open this!': 'Play more, Enough, to open this!', 'You opened Enough?!': 'You opened Enough!',
            'You are a star at Enough?!': 'You are a star at Enough!',
            'You are a star at Add It Up!': 'You are a star, at Add It Up!',
            # speech-to-text heard these as "to openness" and "added up": a breath around the kind's name keeps it whole
            'Play more Goods and Services to open this!': 'Play more Goods and Services, to open this!',
            'Play more Add It Up to open this!': 'Play more, Add It Up!, to open this!',
            # and "AeroSign"
            'Arrow Sign': 'Arrow, Sign', 'You got Arrow Sign!': 'You got Arrow, Sign!',
            # as Turbo Tally found, a breath keeps "Grape" from becoming "Great"
            'Grape Purple': 'Grape, Purple', 'You got Grape Purple!': 'You got Grape, Purple!',
        },
    },
    # Deep Light: small.en heard the end of this hint run together ("...shake and sound openness"), and both models heard "Deep Hull"
    # end in "hole", "You opened Shadows!" as "You open shadows" and "Barreleye" as "Baralife"; a breath before the word (as Turbo
    # Tally's) or the word split in two keeps each one. ("Abyss Hull" and "Trench Hull" still came out "hole" with a breath, so those
    # Rungs are named Super Hull and Ultra Hull instead; "Mega Hull" came out "Make a hole".)
    'deep-light': {
        'said_as': {
            'Play more Mirrors and Shake and Sound to open this!': 'Play more Mirrors and Shake and Sound, to open this!',
            'Deep Hull': 'Deep, Hull',
            'You opened Shadows!': 'You opened, Shadows!', 'You opened Signals!': 'You opened, Signals!', 'You opened Shake and Sound!': 'You opened, Shake and Sound!',
            'Barreleye Fish': 'Barrel eye Fish',
            # pass 2 review: both whisper models heard "Foghorn" as "Falkhorn"; two words keep the "fog"
            'Foghorn': 'Fog horn',
            'A barreleye fish has a see-through head, and its eyes look up through it.': 'A barrel eye fish has a see-through head, and its eyes look up through it.',
        },
    },
    # Sky Writer says its short-vowel words alone like Dino Dig ("cat" in Jenny's voice: Aria says "Kate"), and its b, d, p and q
    # lessons name a lowercase letter at the start of a sentence, which the voice must say as the letter's name, not as a word
    'sky-writer': {
        'said_as': {'cat': 'cat', 'b starts with the tall line.': 'B, starts with the tall line.', 'd starts with the round part.': 'D, starts with the round part.',
                    'p starts with the long line.': 'P, starts with the long line.', 'q starts with the round part.': 'Q, starts with the round part.',
                    'These letters all start like c.': 'These letters all start like C.',
                    # both speech-to-text models heard Aria's "green dot" as "green knot", and the locked hints lose their kind's name
                    # without a breath round it (as Dino Dig found)
                    'Start at the green dot!': 'Start at the green, dot!',
                    'Play more Trace It to open this!': 'Play more, Trace It, to open this!',
                    'Play more Where to Start to open this!': 'Play more, Where to Start, to open this!',
                    'Play more Trace It and Where to Start to open this!': 'Play more, Trace It, and, Where to Start, to open this!',
                    'Play more Write It to open this!': 'Play more, Write It, to open this!',
                    # pass 2: both models heard "a Where" as "aware", "Tall, Small, Tail" as "small the tail" and "opened Trace It" as
                    # "open trace it" (opened alone, as the other kinds' lines are, they hear right); a lone "Boing!" came back "boy"
                    'You are a Where to Start star!': 'You are a. Where to Start, star!',
                    'You opened Tall, Small, Tail!': 'You opened Tall. Small. Tail!',
                    'You opened Trace It!': 'You opened, Trace It!',
                    'Boing!': 'Boing, boing!'},
        # Aria's "Q." comes back as "Hugh" or "Hue" however it's written (Q! Queue. Cue.); Jenny's is heard as Q by both models
        'voice_for': {'cat': 'en-US-JennyNeural', 'puff': 'en-US-JennyNeural', 'duck': 'en-US-JennyNeural',
                      'Letter Q': 'en-US-JennyNeural', 'q starts with the round part.': 'en-US-JennyNeural'},
    },
    'skyline': {
        # pass 2: both speech-to-text models (small.en and large-v3-turbo) heard these as "Great Purple" (Turbo Tally's fix), "mass",
        # "mark it", "been round", "here run", and dropped the kind's name into the words round it ("you open share it", "a time star")
        'said_as': {
            'Grape Purple': 'Grape, Purple', 'Moss': 'Moss!', 'Market': 'Market!', 'Bin Round': 'Bin, Round', 'Pier Run': 'Pier, Run',
            'You opened Share It!': 'You opened, Share It!', 'You opened Times!': 'You opened, Times!',
            'You are a Times star!': 'You are a, Times, star!', 'You are an Equal Groups star!': 'You are an, Equal Groups, star!',
        },
    },
    # Jetway, pass 2 review: both speech-to-text models (small.en, large-v3-turbo) heard "Kite Hill" as "Tight Hill" (with a comma, or as
    # "Kyte", too; as two sentences it is heard right), "De-Icer Truck" as "Dicer Truck", "You opened Jumbo!" as "You open Jumbo", "You
    # opened Unload!" as "You opened and load", and the Ten Hops and Missing Bags star lines without their s ("a ten hop star"); a breath
    # round the name keeps each one, as Deep Light and Sky Writer found. "Baggage Hall" comes back "Baggage haul" however it is written
    # (the comma fixes small.en only). small.en also heard "The cart holds" as "The card holds", "Arrow Mark" as "Aeromark" (Food Truck's
    # "Arrow Sign" did the same), "Grass Green" as "Grasp Green" and "Shop Row" as one word.
    'jetway': {
        'said_as': {
            'Kite Hill': 'Kite. Hill.', 'Baggage Hall': 'Baggage, Hall', 'De-Icer Truck': 'Dee-icer, Truck',
            'You opened Jumbo!': 'You opened, Jumbo!', 'You opened Unload!': 'You opened, Unload!',
            'You are a Ten Hops star!': 'You are a. Ten Hops, star!', 'You are a Missing Bags star!': 'You are a. Missing Bags, star!',
            'The cart holds': 'The cart, holds', 'Arrow Mark': 'Arrow, Mark', 'Grass Green': 'Grass, Green', 'Shop Row': 'Shop, Row',
        },
    },
    # Carrier Deck, pass 1: faster-whisper small.en heard Aria's "Foghorn" as "Falkhorn" (Deep Light's fix), "Grape" as "crepe" (Turbo
    # Tally's fix, a breath before Purple), and "carry than" alone as "Carrie Van" (with a breath it is heard right in its chain). "Hull"
    # came back "hole" or "whole" however it was said, so the hull items are named Ship Section and <colour> Ship instead, and Galley,
    # Bow Anchor, Signal Mast, Gull and Shore were renamed Kitchen, Front Anchor, Radio Mast, Seagull and Beach (each heard right).
    'carrier-deck': {
        # pass 2: small.en and base.en heard "Reef" alone as "wreath", "Fleet Admiral" as "Flee Admiral", "Angled Deck" as "Angle deck" and
        # "Checkered Deck" as "Checker Deck" / "Check her deck"; each of these is heard right by both
        'said_as': {'Foghorn': 'Fog horn', 'Grape Purple': 'Grape, Purple', 'carry than': 'carry, than',
                    'Reef': 'Reef!', 'Fleet Admiral': 'Fleet Admiral!', 'Angled Deck': 'Angled, Deck', 'Checkered Deck': 'Checkered, Deck'},
    },
    # Cargo Words says every syllable alone, written "(rab)". Alone, the voice reads "ti" as the letters T and I and "py" as P and Y, so
    # each syllable is said as it sounds in its word, respelled by the rules in src/cargo-words/words/said.ts (printed by
    # tools/cargo-words/said.ts and merged into said_as here): "(ti)" is said "tie", "(tle)" "tull", "(ger)" "gur", "(el)" "ell".
    # Speech-to-text (small.en) heard "hopeful" as "helpful"; "hope-ful" keeps its hope. Aria says "(cat)" as "Kate", "(mag)" as "Meg",
    # "(buck)" like a swear word, "(got)" as nothing and "retell" as "retail" however they're written, so their words were taken out
    # (catnap, magnet, magnetic, bucket, forgot, retell) rather than say one syllable of a word in a second voice.
    'cargo-words': {
        'said_from': 'tools/cargo-words/said.ts',
        'said_as': {'hopeful': 'hope-ful'},
    },
}


def load_said_from(collection):
    """A collection can print more said_as entries from a script (Cargo Words' syllables), merged in once."""
    own = COLLECTION_SPEECH.get(collection, {})
    script = own.pop('said_from', None)
    if script:
        extra = json.loads(subprocess.run(['npx', 'tsx', script], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
        own['said_as'] = {**extra, **own.get('said_as', {})}


def spoken(text, voice, rate, collection=None):
    """What the voice reads for a phrase, which voice, and how fast."""
    own = COLLECTION_SPEECH.get(collection, {})
    prefix, slow_rate = own.get('slow', (None, None))
    if prefix and text.startswith(prefix):
        text = text[len(prefix):]
        rate = own.get('slow_for', {}).get(text, slow_rate)
    said = own.get('said_as', {})
    return (said[text] if text in said else speakable(text)), own.get('voice_for', {}).get(text, voice), rate


def clip_id(text, voice, rate, collection=None):
    # a change of voice, rate or spoken text makes a new clip
    said, voice, rate = spoken(text, voice, rate, collection)
    return hashlib.sha1(f'{voice}|{rate}|{said}'.encode()).hexdigest()[:12]


async def record(text, out, voice, rate, sem, collection=None):
    import edge_tts
    said, voice, rate = spoken(text, voice, rate, collection)
    async with sem:
        for attempt in range(3):
            try:
                return await edge_tts.Communicate(said, voice, rate=rate).save(str(out))
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
    voice, rate = VOICES.get(args.collection, (VOICE, RATE))
    load_said_from(args.collection)
    phrases = json.loads(subprocess.run(['npx', 'tsx', 'tools/phrases.ts', '--collection', args.collection], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    files = {p: f'{clip_id(p, voice, rate, args.collection)}.mp3' for p in phrases}
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
        await asyncio.gather(*(record(p, clips / files[p], voice, rate, sem, args.collection) for p in todo))
        keep = set(files.values())
        stale = [f for f in clips.glob('*.mp3') if f.name not in keep]
        for f in stale:
            f.unlink()
    body = ''.join(f'  {json.dumps(p, ensure_ascii=False)}: {json.dumps(f)},\n' for p, f in files.items())
    header = ''.join(line + '\n' for line in index.read_text().splitlines() if line.startswith('//')) if index.exists() else ''
    index.write_text(header + f'export const CLIPS = {{\n{body}}} as const;\n')
    print(f'{len(phrases)} phrases: recorded {len(todo)}, removed {len(stale)} stale clips, with {voice}')

asyncio.run(main())
