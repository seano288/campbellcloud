# Spec: Word Wreckers (spelling by sound, a yard of construction machines and a town)

Status: built on 2026-11-16 from `brief.md`, playable at `/word-wreckers/` with a tile on the landing page (Learning Games). Every
decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Treasure Fleet and Wild Rescue (`src/treasure-fleet/`,
`src/wild-rescue/`), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). He
hears a word and builds it from its sounds (Common Core L.1.2d, L.1.2e, RF.1.2): the other half of phonics from Dino Dig's reading.
Short mixed Rounds earn Bolts and a Job; a Job is knocking an old building down with one of his machines and putting a new one up with
the crane, and it joins his Town.

## The word list (shared with Dino Dig)

`src/dino-dig/words/list.ts`: **201 phonetically regular words**, plain data with no game code, so Dino Dig can share it. Each word is
written as its sounds, one per box (`'sh.i.p'`, `'c.a_e.k'`), and tagged with the latest **Pattern** it uses: short-vowel CVC (43),
digraphs sh ch th wh ck ng and doubled ll ss ff (28), blends (35), magic e (32), vowel teams ee ea ai ay oa ow-as-in-snow (32),
r-controlled ar or er ir ur (31). 103 words have an Apple emoji where the picture is plainly that word (no hen: it's "chicken" too).

Left out on purpose, with the lists kept in the file: words that sound like another word spelled differently (`HOMOPHONES`: sun/son,
tail/tale, road/rode, bell/belle, turn/tern...), words said two ways or with a vowel not taught (`NOT_REGULAR`: wind, read, cow, head,
rice...), and the sight words Sight Squad owns.

## Kinds

Five kinds, three Levels each. The word is said as the question appears and is never shown until he has built it; 🔊, or tapping the
picture (or the 👂 when a word has none), says it again as often as he likes, with no penalty.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Build It** `build`: tap letter tiles into the sound boxes | start | exactly its letters | one spare (two at full Stretch) that doesn't look or sound like its letters | two or three spares that look or sound like its letters (b/d, c/k, e/i, m/n) |
| **Missing Sound** `gap`: the word's boxes with one empty; pick its tile | start | the first sound | the last sound | the vowel sound (a short vowel, a_e, ee, ar...) |
| **Chunks** `chunk`: build it from sound chunks (sh, ck, ee, a_e) | Build It L2 | two chunks: onset and rime (sh + ip, tr + ain) | each sound a chunk, one spare (two at full Stretch) | spares that say the same sound another way (ai / ay / a_e, ee / ea, er / ir / ur, c / k) |
| **Fix It** `fix`: a wrong spelling of the word he hears; tap the mistake, then pick the right tile | Missing Sound L2 | the mistake glows | he finds it | a missing letter (tap the ⌃ where it goes) or an extra one (tap it) |
| **Which Looks Right** `pick`: tap the right spelling | Chunks L2 | two | three | three, each in a short phrase ("a slow snail" / "a slow snale" / "a slow snayl") |

Fix It, Levels 1 and 2: the mistake is one sound spelled wrong: first one that sounds wrong (pog for pig), then at Stretch one that
sounds right (snale, milc, berd). Fix It Level 3 keeps to spellings of six letters or fewer, so a ⌃ for every gap fits a phone.

**The rules the tests enforce** (`spelling/words.test.ts`, `spelling/problems.test.ts`, every kind × Level × Stretch × every word it
can ask × several seeds, about 12,000 questions):

- **Exactly one right answer**: the word spelled the usual way. Build It and Chunks accept only that sequence; the tests search every
  way the tiles could spell the word and find just one (they caught c + k spelling "thick" beside a ck chunk, now never offered).
- **A sound with several spellings** only comes up once its Pattern is met (a word is only asked when every Pattern in it is met), and
  **no wrong spelling is ever a real word**: every wrong spelling the game can make was checked against macOS's dictionary (which is
  generous: it has kat, seel and kyte) and the hits are a block list, `spelling/real.ts`; the test re-checks against the dictionary
  wherever one is installed. Nothing rude can be read in one (`RUDE`). Same-sound spares in Chunks never build a real word either.
- **Missing Sound's wrong tiles always say a different sound** (never k for c), so the sound he hears picks one tile.
- **Homophones are left out** of the list (above), so a word he hears has one spelling.
- **Tiles are lowercase Andika and never rotated or mirrored**: they only slide (a test reads the stylesheet).
- **Hearing the word again has no penalty**: the browser tour taps 🔊 three times and the picture before answering, and checks the
  answer still earns a full star.

**Unlock order.** Build It and Missing Sound at the start; Chunks at Build It Level 2, Fix It at Missing Sound Level 2, Which Looks
Right at Chunks Level 2. A kind with nothing to ask yet (Chunks before he has met two-letter sounds) sits out.

**Patterns are met before they are asked**, as Sight Squad's words are: the first problem of his first Round meets short vowels ("Words
are made of sounds. Each sound gets a box." then cat, pig and bug in their boxes, each said slowly as its boxes light). The next Pattern
comes after 8 more answers right on the first try, and waits while any Pattern he has met is shaky (strength under 2). Meeting one is one
of the Round's five, and the question after it asks a word from the new Pattern. Each Pattern's strength (0 to 5) goes up one on a
first-try answer, down one with help, down two on a miss; words from weak and new Patterns come up more often.

**Mastery (as Math Bots, Rover Code, Treasure Fleet, Wild Rescue).** 16 of the last 20 right on the first try, or the last 10 in a row;
the first 30 questions of a kind asked at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. A star at Level
3. No Tune-Up: the quick rule places him.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three,
and always the one right after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back
later as a fresh question of the same kind and Level about another word, with no Mastery credit. The same word is rarely asked twice
in a Round. Bolts: one per first-try answer plus one for finishing (shared `boltsFor`). A Round resumes after a reload.

## Teaching a miss

Never a red X. A wrong tile wobbles sideways and goes back to the rack (or fades, for a spelling card).

- **First miss**: "Listen." The word's sound boxes light one at a time while it is said slowly, then it is said at its usual speed.
  Build It and Chunks: the right tile drops into the next box (or glows, if it's the last, so he finishes it himself). Missing Sound: the
  right tile drops into the empty box, lifts back out, and glows. Fix It and Which Looks Right: the right word appears in its boxes
  under the wrong spelling and lights the same way; Fix It then shows the mistake ("Here is the mistake.", "A letter is missing
  here.", "This one is extra."). In Chunks a chunk is one tile in one box, so he sees two letters make one sound.
- **Second miss** (or the first when he's been missing a lot, or 🔎, which counts as help): "Watch me build it." The whole word goes into
  its boxes box by box, is said, and is cleared: "Now you build it!"
- The voice never says a lone sound or a misspelling. Fix It says the word he should see ("This should say… snail") and shows the wrong
  spelling.

## The reward: the Yard, the Job and the Town

**The loop.** A finished Round earns Bolts and one **Job** (🏗️). A Job is a **demolition** then a **build**; the new building joins his
**Town**. Bolts buy machines and upgrades, which open stronger old buildings to knock down, and so bigger buildings to put up. He starts
with one free Job: a wooden shed for the free Wrecking Ball Crane, then a House, Lemonade Stand or Tree House.

**The demolition (`job/wreck.ts`, 2D canvas, side view, no physics library).** The old building is a stack of bricks in columns
(wood, brick, concrete or steel: always his strongest machine's power), at most 72 bricks. A brick knocked loose tumbles (gravity, a
bounce, a slide to rest on the rubble) and everything above it in its column falls too. He picks which machine (any strong enough):
- **Swing** (Wrecking Ball Crane, Mega Wrecker): drag the ball back and let go; a tap swings it for him. Between swings the crane creeps
  up until the ball hangs just short of the building, so even a small pull reaches.
- **Push** (Skid Steer, Bulldozer, Monster Dozer): hold ▶ (or anywhere on the picture) to drive in; it rams, bounces back and rams again,
  and pushes the rubble along.
- **Bite** (Excavator, Demolition Robot, Giant Excavator): tap the building; it drives close enough and bites there (a clumsy tap
  bites the nearest brick).
Every hit knocks at least one brick loose; once only about an eighth still stand, the rest crumble. Three Bolts hide in the bricks and
all come out. Then the dump truck (his own paint once he owns one) hauls the rubble away. Nothing can be failed.

**The build (`job/build.ts`).** He picks one of two or three buildings (each name read as its card lights), then the crane lowers its
pieces one at a time (2 to 6 pieces): the hook follows his finger; letting go drops the piece, which slides over as it falls and lands
square on the one below, however sloppy the drop. "You built the Fire Station!", +3 Bolts, and off to the Town.

**The Town (`town/TownScreen.tsx`)**: his streets from the side, every building on its lot, gold ones twinkling, decorations along the
pavement and in the sky. He drives any of his machines (hold ◀ ▶), honks (📯), and taps a building to hear its name. The next street
stands fenced off with its price. With no empty lot left, a Job makes one of his buildings **gold** instead (he picks which), so a Job
always adds something; with everything gold, a build is "Just for fun!".

**The Yard (`yard/YardScreen.tsx`)**: tabs for Machines, Upgrades (for the machine he's driving), Paint, Driver and Town (streets and
decorations). As in the other games, a thing he hasn't got goes on his machine to try, with Buy beside it; one he can't afford becomes
his Goal. The Goal is the next street when the Town is full, else the cheapest thing that opens a stronger Job, else the cheapest thing
left that isn't a paint.

**The catalogue (`yard/shop.ts`), every price at most 100, 109 things, 3,359 Bolts in all.** Every table is a plain list, so the next
pass can add rows.

| | What | Bolts |
|---|---|---|
| Machines (10) | Wrecking Ball Crane (free, power 1), Skid Steer 10 (1), Bulldozer 15 (2), Excavator 30 (2), Dump Truck 40 (hauls), Tower Crane 60 (opens the tallest buildings), Demolition Robot 70 (3), Monster Dozer 80 (4), Mega Wrecker 90 (4), Giant Excavator 100 (4) | 495 |
| Upgrades (26) | two to four a machine: power (Big Ball 10, Steel Ball 28, Spiky Ball 55, Big Bucket, Wide Blade, Ripper Teeth, Rock Claw, Power Claw), bigger hits (Long Boom, Long Arm, Shark Teeth, Lightning Ball, Diamond Teeth), speed (Turbo Wheels, Big Tracks, Big Bed, Fast Hook, Rocket Boost, Turbo Engine) and looks (Air Horn, Giant Wheels, Night Lights, Tall Mast, Laser Eyes, Rainbow Chain) | 987 |
| Paints (24) | Hi-Vis Yellow free; 4 to 24 (Hazard Stripes, Racing Flames, Lightning Bolts, Rainbow...); each machine wears its own | 253 |
| Drivers (13) | Hard Hat free; Puppy 5 to Unicorn 95, an emoji in every cab | 449 |
| Streets (6) | Main Street free; Park Lane 20, River Road 35, Hill Street 50, Harbor Way 70, Rocket Row 90; 6 lots each, 36 in all | 265 |
| Decorations (30) | Trees 4 to Fireworks 100 | 910 |
| Buildings (36, free from Jobs) | wood: House, Lemonade Stand, Tree House, Barn, Ice Cream Shop, Cabin, Pet Shop, Bakery; brick: Fire Station, Police Station, School, Library, Toy Shop, Pizza Place, Post Office, Diner, Candy Store, Bike Shop; concrete: Hospital, Museum, Train Station, Water Tower, Lighthouse, Castle, Aquarium, Clock Tower, Movie Theater, Bridge; steel (needs the Tower Crane): Skyscraper, Stadium, Rocket Pad, Airport Tower, TV Tower, Robot Factory, Hotel, Space Center | |

**Economy defaults, for the parent to confirm.**
- One Job per finished Round; one free Job to start. Jobs don't expire.
- A Job pays 3 Bolts (found in the rubble), only when the building is up. Leaving halfway (🏠 twice) costs and pays nothing; a reload
  during a Job lands at the Yard with the Job still there. A Round pays at most 6, so a Round and its Job at most 9.
- The brief's machine prices (15, 30, 50, 80, 120) became 10 to 100 (the voice only says numbers to 100), with four more machines.
- The brief's "about 20 buildings before the Town is full" became 6 free lots on Main Street and 36 with every street bought; the
  free crane reaches steel with three upgrades (93 Bolts), so the Town fills without having to buy every machine.
- 3,359 Bolts is roughly 370 Round-and-Jobs at full pay. Wild Rescue's is 4,147.

## Look

Hi-vis yellow, asphalt grey and hazard stripes in the family look: Bungee titles, Nunito for the game's words, Andika for every letter he
spells, 4px black outlines, solid drop shadows that press in. Machines and buildings are drawn in code (`art/machines.ts`,
`art/buildings.ts`) as SVG strings shared by the Yard, the Job's canvas (cached as bitmaps) and the Town. Icon: a wrecking ball on its
chain swinging into a wall of letter tiles, tiles flying, on hi-vis yellow with a hazard band. Home's Play tile is a building site with
the crane, the letter-tile wall and the fence; the Yard tile is his machine, the Town tile his newest buildings.

## Voice

Aria at -8% (`tools/make_voice.py --collection word-wreckers`, edge-tts): **882 clips, about 13 MB** in `public/word-wreckers-voice/`.
Every list word is recorded alone, and again slowly: a phrase "Slowly: cat" is recorded as "cat" at -45% (a small addition at the end
of `make_voice.py`). Questions are chained ("Build the word", "snail"); prices from number clips. The 109 pick phrases are whole
clips. Dino Dig can share the word clips later by selecting them with `--index-only`; nothing was shared now because Dino Dig hasn't
recorded any.

## Save

`word-wreckers-save`, version 1 (a version it doesn't know reads as a blank save), and `word-wreckers-place` for the screen and the Round
in progress.

## Open questions for the parent

1. The words: are any of the 201 ones his class wouldn't use, or said differently at home (cot/caught, pen/pin, the a in "can")?
2. Every word clip, and its slow one, needs listening to on the iPad (the words least sure of are in the report).
3. Is "Which Looks Right" with near-misses like "snale" a good idea for a first grader, or does seeing wrong spellings confuse him?
4. Should Fix It Level 3 (missing or extra letter) come later than it does?
5. Is 3,359 Bolts the right size, and should a Job pay Bolts at all?
6. Should the Town's buildings do something when tapped (lights on, a sound), beyond saying their name?
7. Is 8 first-try answers between Patterns the right pace?

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari/WebKit. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390
  (`tools/word-wreckers/tour.ts`, played by real touch events through the DevTools protocol), on a new save and on saves with every kind
  open at Level 2 and at Level 3, and offline on the production build (`tools/word-wreckers/offline.ts`).
- The voice clips were recorded but not listened to: there is no way to play audio here. Their lengths are all alike (1.6 to 1.9 s,
  slow 2.6 to 3.1 s), which rules out a spelled-out or doubled word, but not a wrong vowel.
- Frame rate: 60 fps unthrottled in headless Chromium; under 4× CPU throttling the game's own work per frame stays under about 1 ms but
  headless software compositing drops to about 30 fps. Real GPU speed on the iPad 9 is not measured.
- No Trophies, no per-word strength (strength is per Pattern), no isolated speech sounds (by design), no sharing of clips with Dino Dig
  yet, no interior or "visit" for a Town building.
