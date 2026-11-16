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
r-controlled ar or er ir ur (31). 81 words have an Apple emoji where the picture is plainly that word: none where he'd name it
something else (a hen is "chicken" too; 🐏 is "sheep", 🚙 "car", 🧢 "hat", 🍳 "egg", 🦷 "tooth", 🏠 "house"; 22 taken out in review).

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
  wherever one is installed, along with the plurals and past tenses it leaves out (firs, for first), and short words, abbreviations
  and names it lacks (stat, url, I've) are on the block list too. Nothing rude can be read in one (`RUDE`). Same-sound spares in
  Chunks never build a real word either.
- **Missing Sound's wrong tiles always say a different sound** (never k for c), so the sound he hears picks one tile; so do Fix It
  Level 3's letters for a missing one.
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

**Bigger rewards, 2026-11-16.** He maxes reward ladders far faster than specs assume (Rover Code in a day), and the standing instruction
is "2x-3x the rewards": more things to earn and more to do with them, never bigger payouts. A Round and a Job pay exactly what they did.
The ladder grew from 109 things (3,359 Bolts) and 36 buildings to **258 things (8,315 Bolts), 72 buildings, 12 road features and 30
treasures** (145 things to earn became 372, 2.6×), and, as the sibling games taught, most of the growth is **new kinds of thing that
change how it plays**: three new ways to knock a building down, a second kind of Job, treasure in the rubble, a dump truck he drives,
districts with their own scenery, road features that work when he drives through them, traffic that drives itself, and horns.

**The loop.** A finished Round earns Bolts and one **Job** (🏗️). A Job is a **demolition** then a **build**; the new building joins his
**Town**. Or, with a Steamroller or Cement Mixer, a **Road Job**: pave the road, and a **road feature** joins his Town's road. Bolts buy
machines and upgrades, which open stronger old buildings to knock down, and so bigger buildings to put up. He starts with one free Job:
a wooden shed for the free Wrecking Ball Crane, then a House, Lemonade Stand or Tree House.

**The Job's card.** "A new Job! An old brick wall!": the old building is named from its material and its shape (six shapes and six
names a material, 24 old buildings: shed, barn, fort, garage, tower, boathouse; school, factory, wall, castle, chimney; car park,
bunker, dam...). It offers the machine he drives (if it is strong enough), then the strongest of each other kind, at most six; under
a dashed line, "Or pave a road!", his road machines.

**The demolition (`job/wreck.ts`, 2D canvas, side view, no physics library).** The old building is a stack of bricks in columns
(wood, brick, concrete or steel: always his strongest machine's power), at most 72 bricks. A brick knocked loose tumbles (gravity, a
bounce, a slide to rest on the rubble) and everything above it in its column falls too. He picks which machine (any strong enough).
Six ways, each its own play:
- **Swing** (Wrecking Ball Crane, Mega Wrecker): drag the ball back and let go; a tap swings it for him. Between swings the crane creeps
  up until the ball hangs just short of the building, so even a small pull reaches.
- **Push** (Skid Steer, Bulldozer, Monster Dozer): hold ▶ (or anywhere on the picture) to drive in; it rams, bounces back and rams again,
  and pushes the rubble along.
- **Bite** (Mini Digger, Excavator, Demolition Robot, Giant Excavator): tap the building; it drives close enough and bites there (a
  clumsy tap bites the nearest brick).
- **Hammer** (Jackhammer, Rock Breaker), new: it drives up to the building by itself; every tap on the 🔨 (or anywhere on the picture)
  is one hit on the bottom brick of the front column, which cracks (drawn) and after two to four hits comes out, so the column above
  falls. Holding the 🔨 hits six times a second. About 20 to 25 taps a building; the machine shakes and dust flies at the bit.
- **Blast** (Dynamite Truck, Mega Blaster), new: tap the building to stick up to three red sticks on it (each on the brick nearest the
  tap; a fourth says "Press the plunger!"), then press the big red **plunger** (its handle goes down): "Stand back!", the fuses fizz
  and they go off together, knocking loose everything round each stick. The plunger with no sticks on puts three on for him. One or
  two blasts a building. With Confetti Bombs the Mega Blaster's blasts are confetti.
- **Magnet** (Magnet Crane, Super Magnet), new: tap a column; the crane's boom swings over it, the magnet goes down onto its top
  ("Clang!"), lifts the top four bricks off (more with Big or Giant Magnet), swings them over and drops them in a pile beside the
  building. A tap while it's busy is queued. Best for steel; about 15 to 30 lifts a building.

Every hit knocks at least one brick loose; once only about an eighth still stand, the rest crumble (anything on the magnet drops).
Three Bolts hide in the bricks and all come out.

**Treasure in the rubble**, new. Every other Job (an odd number of Jobs done) hides a **treasure chest** in a brick low in the middle;
when that brick comes loose the chest pops out ("A treasure chest!"), and it always comes out by the end. When the lot is clear a card
shows the chest: he taps it open and it's one of 30 treasures (Old Coin, Dino Bone, Treasure Map, Time Capsule, Gold Crown... Toy
Robot), said aloud: "You found... a Time Capsule". 🚚 goes on once the name has been said. Like the Bolts, it is kept only when the
Job is done (leave halfway and the same treasure is still to find). They sit on his **Treasure shelf**, the 💎 tab in the Yard: found
ones with their name, the rest ❓ ("Find it under an old building!"), and "12 out of 30 treasures found!".

**The dump truck**, new. With his own Dump Truck he drives it: hold ▶ (or anywhere) and it drives in, stops at the pile to load by
itself, and drives off as he holds; if he waits five seconds it drives itself ("Drive the dump truck!"). Without one, a dump truck
hauls it away by itself as before.

**The build (`job/build.ts`).** He picks one of two or three buildings (each name read as its card lights), then the crane lowers its
pieces one at a time (2 to 6 pieces): the hook follows his finger; letting go drops the piece, which slides over as it falls and lands
square on the one below, however sloppy the drop. "You built the Fire Station!", +3 Bolts, and off to the Town.

**A Road Job (`job/road.ts`)**, new: the second kind of Job. Picking the **Steamroller** or the **Cement Mixer** on the Job's card
("Pave the road!") puts an old cracked road in front of the lot with six gravel bumps (Steamroller: "Hold the arrow to roll the bumps
flat!") or six holes (Cement Mixer, which pours concrete from its chute: "Hold the arrow to fill the holes!"). He holds ▶ (or anywhere)
to drive; let go and it rolls on a little, so taps work too; ◀ backs up, and a bump or hole is fixed whichever way he passes it
("Flat!", "Filled!"). Then a line painter paints the middle line by itself ("Now the lines!"), and he picks one of up to three **road
features** ("What goes on the road?"). +3 Bolts, as any Job. With every feature built, or no place left on his roads, the road is
"Just for fun!" and pays the same.

**Road features** (12, free from Road Jobs): Car Wash, Jump Ramp, Speed Bumps, Tunnel, Mud Puddle, Loop the Loop, Bubble Arch, Confetti
Gate, Sprinklers, Rainbow Arch, Turbo Pad, Firework Pad. Each street has three places on its road (in front of its second, fourth and
sixth lots) and features fill them in the order he builds them. In the Town, **driving through one works it**: the Car Wash bubbles,
the Jump Ramp throws his machine into the air, the Speed Bumps bounce it, the Tunnel swallows it, the Loop the Loop takes it right
round, the Turbo Pad makes it go more than twice as fast for three seconds, the Firework Pad lights the sky, and the rest splash,
bubble, spray, sparkle or rain confetti; each has its own sound and a line ("Wheee!", "Squeaky clean!", "Round and round!", "Zoom!").
Tapping one sets it off and says its name. Driving out and back in sets it off again.

**The Town (`town/TownScreen.tsx`)**: his streets from the side, every building on its lot, gold ones twinkling, decorations along the
pavement and in the sky, his road features, and his **traffic**. He drives any of his machines (hold ◀ ▶), honks (📯, with his horn),
and taps a building to hear its name. Tapping a decoration makes it hop and say its name (the Rocket takes off and comes back, the
Fireworks go off); tapping a car honks it and says its name. The owned streets stand in the shop's order, then the cheapest street he
hasn't got, fenced off with its price. With no empty lot left, a Job makes one of his buildings **gold** instead (he picks which), so a
Job always adds something; with everything gold, a build is "Just for fun!".

**Districts**, new: six of the twelve streets have their own scenery behind the lots: **Farm Lane** (green hills, a fence, a cow, a
sheep, a pig and a hen), the **Fairground** (pink sky, bunting, a turning big wheel), **Beach Road** (the sea with moving waves, a
sailboat, sand), **Airport Way** (a control tower, a windsock, a plane taking off every few seconds), **Snowy Peak** (snowy
mountains, falling snow, white ground) and **Dino Valley** (a smoking volcano, palm trees, a dinosaur). The Yard's street tiles show
each one's sky and ground and its sign (🐄 🎡 🏖️ ✈️ 🏔️ 🦕).

**Traffic**, new (17): vehicles that drive up and down the Town's road on their own once bought, each at its own speed (the Racing
Snail crawls; the Race Car flies): Bicycle, Skateboard, Scooter, Red Car, Taxi, Blue Car, Motorbike, Camper Van, Pickup Truck, Trolley
Bus, Delivery Truck, Tractor, Big Rig, Race Car, Fire Engine, Racing Snail, Running T-Rex. Emoji, turned to face the way they drive.

**Horns**, new (12): what every machine honks with, in the Town and when a Job starts. Honk Honk (the old honk, free) says "Honk honk!";
the rest just play, made in code (`horns.ts`): Little Beep, Clown Horn, Duck Quack, Train Horn, Siren, Ice Cream Tune, Cow Moo, Robot
Beeps, Trumpet, Dino Roar, Space Laser. Trying one in the Yard plays it.

**The Yard (`yard/YardScreen.tsx`)**: nine tabs: Machines, Upgrades (for the machine he's driving), Paint, Driver, Horns, Streets,
Decorations, Traffic and Treasures. On a phone the tabs wrap to a second row; the tray scrolls; tiles are cheapest first. As in the
other games, a thing he hasn't got goes on his machine to try (a horn plays; traffic says "It drives around your Town!"), with Buy
beside it; one he can't afford becomes his Goal. The Goal is the next street when the Town is full, else the cheapest thing that opens
a stronger Job, else the cheapest thing left that isn't a paint.

**The catalogue (`yard/shop.ts`), every price at most 100, 258 things, 8,315 Bolts in all** (was 109 things, 3,359 Bolts). Every table
is a plain list; no existing row's id or price changed.

| | What | Before | Now | Bolts |
|---|---|---|---|---|
| Machines | the first ten, and Mini Digger 6 (bite, 1), Jackhammer 18 (hammer, 1), Steamroller 25 (paves), Cement Mixer 38 (paves), Dynamite Truck 45 (blast, 2), Magnet Crane 55 (magnet, 3), Rock Breaker 66 (hammer, 3), Super Magnet 86 (magnet, 4), Mega Blaster 96 (blast, 4) | 10 | 19 | 930 |
| Upgrades | three or four a machine: one more for each of the first ten (Rocket Tracks, Giant Bucket, Smoke Stack, Turbo Tracks, Checkered Flag, Spotlight, Jet Pack, Spinning Saw, Flame Pipes, Turbo Swing, Gold Bucket) and three or four for each new one (Sharp Bit, Diamond Bit, Turbo Hammer, More TNT, Mega TNT, Fast Fuse, Danger Flag, Big Magnet, Super Coil, Wide Drum, Smiley Face, Candy Swirl, Confetti Bombs...) | 26 | 66 | 2,472 |
| Paints | 24 more: 14 colours (Mint Green 5 to Sapphire 12) and 10 patterns, four of them new (Cow and Leopard Spots, Zigzag and Bumblebee, Hearts, Ocean Waves; Galaxy, Lava Flames, Gold Checkers, Candy Stripes) | 24 | 48 | 548 |
| Drivers | 17 more, Bunny 6 to Dragon 90 | 13 | 30 | 1,010 |
| Streets | the six districts: Farm Lane 40, Fairground 55, Beach Road 65, Airport Way 75, Snowy Peak 85, Dino Valley 100 | 6 | 12 | 685 |
| Decorations | 24 more, Sunflowers 5 to Rocket 95; nine fly in the sky (Birds, Parachute, Moon, Airplane, Flying Dragon...) | 30 | 54 | 1,724 |
| Traffic | new tab | 0 | 17 | 530 |
| Horns | new tab; Honk Honk free | 0 | 12 | 416 |
| Buildings (free from Jobs) | 9 more of each material: Farmhouse, Chicken Coop, Windmill, Beach Hut, Surf Shop, Flower Shop, Igloo, Hot Dog Stand, Popcorn Stand; Silo, Bowling Alley, Ice Rink, Barber Shop, Music Shop, Bank, Vet, Gym, Donut Shop; Funhouse, Big Top, Planetarium, Zoo, Science Lab, Ski Jump, Greenhouse, Boathouse, City Hall; Hangar, Airport Terminal, Glass Pyramid, Volcano Lab, Dino Dome, Space Hotel, Ice Palace, Mega Mall, Giant Wheel (nine new looks: windmill, igloo, silo, funhouse, big top, ski jump, hangar, pyramid, big wheel) | 36 | 72 | |
| Road features (free from Road Jobs) | above | 0 | 12 | |
| Treasures (found in Jobs) | above | 0 | 30 | |

**Economy defaults, for the parent to confirm.**
- One Job per finished Round; one free Job to start. Jobs don't expire.
- A Job pays 3 Bolts (found in the rubble), only when the building is up (or the road done). Leaving halfway (🏠 twice) costs and pays
  nothing; a reload during a Job lands at the Yard with the Job still there. A Round pays at most 6, so a Round and its Job at most 9.
  Unchanged by the bigger ladder.
- 72 lots with all twelve streets, so the 72 buildings fill the Town; 36 places on the roads for 12 features.
- 8,315 Bolts is roughly 920 Round-and-Jobs at full pay (3,359 was 370). A treasure every other Job means all 30 after 60 Jobs.

## Look

Hi-vis yellow, asphalt grey and hazard stripes in the family look: Bungee titles, Nunito for the game's words, Andika for every letter he
spells, 4px black outlines, solid drop shadows that press in. Machines and buildings are drawn in code (`art/machines.ts`,
`art/buildings.ts`) as SVG strings shared by the Yard, the Job's canvas (cached as bitmaps) and the Town. Icon: a big wrecking ball on
its chain from a crane's boom, smashing into a wall of big letter tiles (c a t, u p) with a white bang, two tiles flying, on a hi-vis
yellow sunburst with a hazard band, like the sibling icons. Home's Play tile is a building site: the crane's lattice boom runs in along
the top and the green ▶ is the wrecking ball hanging from it, beside the letter-tile wall and the fence; the Yard tile is his machine,
the Town tile his newest buildings, and My Levels a site board with a hazard-striped top and chunky amber Level bars. Titles have no
orange in their shadow (orange means "being read aloud"). A question's card wears hazard tape along its top, and its sound boxes and
tiles grow with the screen (sized by how many letters the word has, so a long word still fits). The Yard names the open tab with how
many of it he has, marks what he owns with a ✓ and what he can buy now with a yellow frame and price.

## Voice

Aria at -8% (`tools/make_voice.py --collection word-wreckers`, edge-tts): **1,165 clips, about 16 MB** in `public/word-wreckers-voice/`
(876 and 11 MB before the bigger rewards: 290 new clips, every new name and line; the "Town" tab's clip went with the tab).
Every list word is recorded alone, and again slowly: a phrase "Slowly: cat" is recorded as "cat" at -40%. Questions are chained ("Build
the word", "snail"); prices from number clips. The 109 pick phrases are whole clips. What this game says its own way lives in
`COLLECTION_SPEECH` in `make_voice.py`, which touches no other game's clips:
- the slow rate, -40%: every word clip and its slow one were transcribed with Whisper (small.en and large-v3-turbo) at -8%, -25%, -30%,
  -35%, -40% and -45%; -45% turned nut into "not", pot into "hot", lake into "late" and park into "hark", and -40% was the slowest rate
  that didn't;
- "cat" and "grab" (and their slow ones) in Jenny's voice: Aria says a lone "cat" as "Kate" however it's written ("cat!", "Cat.",
  "kat", "cæt", with any pitch), and a lone "grab" as "crab", another word on the list; Jenny says both plainly at both rates.

Dino Dig can share the word clips later by selecting them with `--index-only`, but only for the same collection settings: its own
collection name would hash "cat", "grab" and the slow words without these overrides.

## Save

`word-wreckers-save`, version 1 (a version it doesn't know reads as a blank save), and `word-wreckers-place` for the screen and the Round
in progress. The bigger rewards kept version 1: they only added shop rows (no id or price changed) and three Yard fields (`horn`,
`roads`, `treasures`), which a save without them reads as the free horn, an empty road and no treasures, keeping every owned item,
every building in his Town, his Bolts and his Jobs (`game.test.ts` decodes a save holding all 109 first-version items and all 36
buildings and checks each survives, and survives saving again). A version bump would have needed a migration and gained nothing.
One risk is not covered: if an iPad runs the old cached build once after the update and he buys something there, the old build drops
the new fields and any new item from the save when it writes.

## Open questions for the parent

1. The words: are any of the 201 ones his class wouldn't use, or said differently at home (cot/caught, pen/pin, the a in "can")?
2. Every word clip, and its slow one, needs listening to on the iPad (the words least sure of are in the report).
3. Is "Which Looks Right" with near-misses like "snale" a good idea for a first grader, or does seeing wrong spellings confuse him?
4. Should Fix It Level 3 (missing or extra letter) come later than it does?
5. Is 8,315 Bolts the right size (was 3,359), and should a Job pay Bolts at all?
6. Should the Town's buildings do something when tapped (lights on, a sound), beyond saying their name? (Decorations, cars and road
   features now do.)
8. Are dynamite and a treasure every other Job right for him? Is the magnet too slow on steel (about 15 to 30 lifts)?
9. Do the traffic emoji face the way they drive on the iPad? They're turned by a guess at Apple's art (Chromium shows Noto's).
7. Is 8 first-try answers between Patterns the right pace?

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari/WebKit. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390
  (`tools/word-wreckers/tour.ts`, played by real touch events through the DevTools protocol), on a new save and on saves with every kind
  open at Level 2 and at Level 3, and offline on the production build (`tools/word-wreckers/offline.ts`). The Level 2 and 3 saves also
  play a Job with the Jackhammer, the Dynamite Truck (sticks and plunger), the Steamroller, the Magnet Crane and the Cement Mixer, open
  a treasure chest, drive the dump truck, open every Yard tab and buy a horn, and in the Town drive through road features and tap a car
  and a decoration, all by touch. The horn sounds and the Town's effects have not been heard or seen on a real iPad.
- The voice clips have not been listened to by a person. Every word clip and slow clip was transcribed by speech-to-text (above); all
  first 876 decode, none is silent or clipped, and the game's trimming keeps all but 0.15% of any clip's energy. Words most worth a listen on
  the iPad: cat and grab (Jenny's voice among Aria's); long, kite, doll, mop and moth (the large model, hearing each clip alone, wrote
  lung, Kate, dull, map and math, though it does the same for doll, kite, mop and moth in other voices); and, slow, lunch, puff, shop,
  tub, hut, sock, cute and cube (one model or the other heard lunge, path, sharp, tab, hot, suck, hued and hub).
- Frame rate: 60 fps unthrottled in headless Chromium; under 4× CPU throttling the game's own work per frame stays under about 1 ms but
  headless software compositing drops to about 30 fps. A full Town (72 buildings, 12 road features, 17 cars, 54 decorations, at 2×
  pixels) holds 60 fps unthrottled and a median of 60 fps (p95 30) at 4× throttling. Real GPU speed on the iPad 9 is not measured.
- The 290 new clips (names, lines, the 24 old-building names) have not been listened to; the game's name for each comes from the shop.
- No Trophies, no per-word strength (strength is per Pattern), no isolated speech sounds (by design), no sharing of clips with Dino Dig
  yet, no interior or "visit" for a Town building.
