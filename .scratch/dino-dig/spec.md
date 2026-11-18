# Spec: Dino Dig (phonics: sounding words out, a fossil dig, a dinosaur museum)

Status: built on 2026-11-17 from `brief.md` (pass 1 of 3: build), playable at `/dino-dig/` with a tile on the landing page (Learning
Games, after Word Wreckers). Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad. The bug pass and
the visual design pass follow; the look is the family look, not yet designed.

A new learning game on the family site, built the same way as Word Wreckers and Rover Code (`src/word-wreckers/`, `src/rover-code/`),
for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). He reads words he has not
memorised by sounding them out (Common Core RF.1.2, RF.1.3): the reading half of the phonics Word Wreckers spells. Short mixed Rounds
earn Bolts and a Dig; Digs find bones; whole skeletons come alive and he plays as them.

## The words (shared with Word Wreckers)

- **The list** is `src/dino-dig/words/list.ts`, **unchanged**: Word Wreckers imports it and its clips are keyed to it, so nothing was
  added to it. 201 phonetically regular words in six Patterns (short-vowel CVC 43, digraphs 28, blends 35, magic e 32, vowel teams 32,
  r-controlled 31), each written as its sound boxes (`'sh.i.p'`, `'c.a_e.k'`). Homophones and words said two ways are left out there.
- **Pictures** (`words/pictures.ts`, Dino Dig only): the list's own picture table minus four that a child reading might name another way
  (🌫️ fog, 🥫 can, 🛖 hut, ⛈️ storm) plus four it doesn't have (5️⃣ five, 9️⃣ nine, 3️⃣ three, 🪽 wing): 81 pictured words. Read It and
  Read and Find use only these. **Look-alike groups** are never offered together: 🐤 🐦 🦆, ⛵ 🚢, 🐑 🐐, 🍃 🪴 🌳, 🐟 🦈 🦐, 🪨 🧱, ✋ 👏,
  🚗 🚚 🚌, ⛸️ 🛷, 👕 👗, the four numbers, ❄️ ⭐.
- **Silly words** (`words/silly.ts`, Dino Dig only): 672 made-up words, each built from its Pattern's letters (a consonant or blend, the
  Pattern's vowel, a consonant; never a soft c or g, never ending in letters English words don't end in): cvc 35 (vob, yig), digraph 69
  (shib, vock), blend 236 (blig, zomp), magic e 87 (fube, blike), vowel team 65 (treeb, voak), r-controlled 180 (zorp, nirg). Each is not
  in macOS's dictionary or names list, nor in the US and UK Hunspell dictionaries, nor in a list of modern words, slang and short names
  they lack; nothing rude can be read in it; and no other spelling of its sounds is a common word (fone for phone, slaid for slayed).
  The test (`words/words.test.ts`) re-checks all of it wherever those dictionaries are installed, and caught 9 more while building
  (yump/yomp, lirp/larp...). Hand-removed: pog, fap, larp, womp, vom, vin and others a parent would wince at. The review pass (2 of 3)
  read all 711 and took out 39: real words in a vowel team's clothes (caik is cake, faik fake, faim fame, fraim frame, grait grate,
  baib babe, vaip vape, foak and foke folk, greeb grebe...; the test now tries a team said as a magic e), slang (bish, trib, virg, parm,
  marg, spag, crit, nong, purp, jort, wub, fark), foods (larb, blin), names (Zurg, porg, Stig, Yash, Ying, Nin, Garp), drit, and yunt and
  zunt (they rhyme with a rude word).
- **One sound apart** (`words/pairs.ts`): same number of sounds, one box different, and a different sound there (cat / coat yes; c / k
  never). 120 of the 201 words have such a neighbour on the list.
- **Heard alike**: pairs Hear It never offers together: pen / pin (one sound in much of the South), and pairs speech-to-text heard as each
  other (shop / sharp, mop / map, hut / hat).

## Kinds

Five kinds, three Levels each, as the brief proposed. Opening: Read It and Hear It at the start; Sound Swap at Hear It Level 2; Real or
Silly at Read It Level 2; Read and Find once both Read It and Hear It reach Level 2.

| Kind | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Read It** `read`: a word is shown, never said; tap its picture | 2 pictures; the other word shares no sound and no vowel | 3 pictures, none one sound apart | 3 pictures, at least one one sound apart (cat / bat / hat), the other the closest-looking |
| **Hear It** `hear`: hear a word (🔊 and the ear say it again, no penalty); tap the written word | 2 words, very different | 3 words, none one sound apart | 3 words, at least one one sound apart (shed / shell / bed) |
| **Sound Swap** `swap`: "This says *cat*. Make it say *cot*." Tap the sound to change, then the new one | the sound to change glows; one letter for one sound, 3 tiles | he finds it; 4 tiles | the change is two letters for one sound (ship → sheep, kick → kid, cut → cute) |
| **Real or Silly** `real`: two words; tap the real one | a silly word with nothing in common (hat / zomp) | a silly word of the same Pattern (shark / zorp) | a silly word one letter off it (farm / darm, ship / shib) |
| **Read and Find** `sentence`: read a short sentence; tap the picture | 3 words: "A big pig." | 4 or 5: "I see a fox." "A fox in a box." "A cat and a dog." | 3 pictures, each one word off the sentence: big / little, on / in, or a thing swapped (one sound apart first) |

Read and Find's pictures are built from emoji: one thing (big, little, or as it is), two side by side, one sitting on another, or one
in another (peeking out over its front: the container is drawn twice, the front copy clipped to its lower half), sized by the card so
the thing in a jar can be told apart. Level 3 offers "in a" against "on a" only for a box, a car and a truck (`IN_OR_ON`): a cat in bed
is on it too, and a fox on a boat (or a bus, a ship) is in it. Sentences use met words
plus the first Sight Squad words (a, I, see, big, little, and, on, in).

**The rules the tests enforce** (`reading/problems.test.ts`, every kind × Level × each of the six stages through the Patterns × every word
it can ask × 2 seeds: 12,000 questions):

- A question only uses words from Patterns he has met: the word, every choice, Sound Swap's other word, every word of every sentence
  offered, and the silly word's Pattern.
- **Exactly one right answer**: every choice (and for Sound Swap every box and tile) is tried, and one is right.
- Words heard alike are never offered together in Hear It, and Sound Swap never asks him to turn one into the other ("This says pen.
  Make it say pin.").
- Read It and Read and Find use only pictured words, never two look-alikes.
- Each Level's shape (counts, very different / one sound apart / one word off; Sound Swap's single-letter or two-letter change; Real or
  Silly's nothing-in-common, same-Pattern and one-letter-off; Read and Find's very different things at Level 1 and nothing one sound
  apart at Level 2; in / on only where they plainly differ).
- Sound Swap's tiles each say a different sound from the right one and the old one (never k for c), vowels for vowels.
- Every kind can be asked at every Level from 25 or more words once every Pattern is met; a kind with nothing to ask at a Level yet
  (Sound Swap Level 3 before digraphs) sits out.

**Patterns are met before they are asked** (as Word Wreckers): the first problem of his first Round meets short vowels ("Words are made of
sounds. Each sound gets a box.", then cat, pig and dog in their boxes, each said slowly as its boxes light, the Pattern's sounds marked
green). The next Pattern comes after 8 more first-try answers and waits while any Pattern he has met is shaky (strength under 2). Meeting
counts as one of the Round's five; the question after it asks a word from the new Pattern. Strength 0 to 5: up one on a first-try answer,
down one with help, down two on a miss; weak and new Patterns' words come up more often.

**Mastery (as Math Bots, Rover Code, Word Wreckers).** 16 of the last 20 right first try, or 10 in a row; the quick rule (8 of 10, or 6 in a
row) for a kind's first 30 questions at his Level. Never down. A star at Level 3. No Tune-Up.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and
always the one after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back later as a fresh
question of the same kind and Level, no Mastery credit. Bolts: one per first-try answer plus one for finishing (shared `boltsFor`).
A Round resumes after a reload (`dino-dig-place`).

## Teaching a miss

Never a red X: a wrong choice greys and wobbles sideways. The lesson plays in a green panel above the choices, on sound boxes (one box per
sound: sh is one box, a magic e has its own small box linked to its vowel's in purple).

- **First miss**: "Listen." The right word's boxes light one at a time while it's said slowly (the "Slowly:" clips, -40%), then it's said
  normally; the right choice glows and he taps it.
- **One sound apart** (Read It, Hear It, Sound Swap's wrong sound): the two words stacked, the box that differs marked, each lit and said
  in turn: "ship. shop."
- **Sound Swap**: a wrong sound shows *cat* over *cot* the same way, then "This is the sound to change." and it glows; a wrong tile sweeps
  the new word and the right tile glows.
- **Real or Silly**: the real word swept, "This one is a real word.", and it glows. The silly word is never said.
- **Read and Find**: the sentence is read to him a piece at a time ("A fox", "in a", "box"), each piece's words lit; if his picture was one
  word off, that word lights and is said ("in"); the right picture glows.
- **Second miss** (or the first when he's been missing a lot, or 🔎, which counts as help): the Pattern's introduction again with this
  word: its line ("Two letters can make one sound. They share one box."), the word in its boxes with that Pattern's sounds marked, the
  slow sweep; then the first lesson's ending.
- **The game never plays a lone speech sound** (below).

## The voice test

Recorded with `tools/make_voice.py`'s settings for Dino Dig, Aria (`en-US-AriaNeural`) at -8%, and transcribed back with faster-whisper
(small.en for all 417 test clips, large-v3-turbo on the doubtful ones; durations with macOS `afinfo`, there being no ffprobe):

- **Every list word alone, and slowly (-40%).** small.en heard 8 of 201 normal-rate words wrong (cat → Kate, bat → that, chin → Qin, duck
  → DAC, puff → path, brick → Prick, cube → HUBE, grape → crepe) and 12 slow ones (hut → hot, tub → tab, shop → sharp, sock → suck,
  luck → lack, cute → Hute...). The doubtful ones were re-recorded four ways (plain, with a full stop, "A word", Jenny's voice) at both
  rates and run through both models. large-v3-turbo heard Aria's bat, cube, cute, grape, hut and luck correctly at both rates (small.en is
  noisy on single words), but puff as "path" (both rates, both models) and slow duck as "deck".
- **Fixes, in `COLLECTION_SPEECH['dino-dig']` in `make_voice.py`** (only this collection's clips): "cat" and "grab" in Jenny's voice as
  Word Wreckers found; **"puff" and "duck" in Jenny's voice** (she says both cleanly to both models); **"shop", "sock" and "tub" slowed to
  -20% instead of -40%** (at -40% their vowel stretched into "sharp", "suck", "tab"; at -20% small.en heard all three right). This needed
  one new option there, `slow_for`, a per-word slow rate; no other collection uses it, so no other game's clips changed (Word Wreckers'
  index re-checks with no new or missing clips).
- **The review pass (2 of 3) checked every clip again**: all 879 are real audio (none empty; every slow word longer than its normal one;
  spoken lengths 0.4 to 1.2 s for words and numbers, in line with their text for the rest), transcribed with small.en (every word,
  slow word and number, and all 373 other lines) and large-v3-turbo (the doubtful words both ways, the twelve dinosaur names). Fixed:
  slow "tub" still came back "tab" at -20% (now -15%), slow "lunch" as "lunge" (now -25%), slow "brick" as "break" (now -30%), "Dig
  here!" as "Take care." (said as "Dig, here!"), and "Play more Hear It to open this!" lost its "Hear It" (said with commas round it).
  The hat "Bow" is now "Hair Bow" (alone it can be said like "take a bow"). Left for the parent's ear: large-v3-turbo hears Aria's
  "moth" as "math" and "mop" as "map" in every voice and speed tried (small.en hears both right; mop / map are never offered together
  in Hear It or Sound Swap), small.en hears bat as "that", cube as "hub", grape as "crepe" and slow hut, luck, pot, cute and beak as
  hot, lack, hot, hute and beek (large-v3-turbo hears all of them right).
- **Isolated sounds are not usable**, as the brief assumed: "a", "aah.", "æ" all came back as the letter name "A"; "t", "t.", "/t/" as "T";
  "tuh" as "tā"; "mmm" as "Ennem". Only /sh/ came out as a sound ("sh", "Shh."). So the game never plays a lone sound; it lights the boxes
  while the whole word is said slowly, then normally, and teaches by contrast between whole words. *Open question*: /sh/ alone may be
  usable; nothing is built on it.

## The reward: the Dig, the Museum, the Alive run, the Shop

**The loop.** A finished Round earns Bolts and one **Dig** (he starts with one free). A Dig finds one or two **bones** of the first
dinosaur at its site still missing some (two on the first Dig and every other one after), two Bolts hidden in the dirt, and on every
other Dig a **fossil**. Bones snap onto the dinosaur's skeleton in the **Museum**; a whole skeleton is **brought to life** and he plays as
it (the **Alive run**), and plays any living one again whenever he likes. Bolts buy **tools** (each opens a deeper **dig site** with bigger
dinosaurs), **gadgets** that change the Dig, **looks** for living dinosaurs, **gear** that changes the run, **lands** for the run, and things
for the Museum hall.

**The Dig (`dig/dig.ts` world, `dig/DigScreen.tsx` screen; 2D canvas).** A card: "A new Dig! Sandy Creek", the open sites to choose from
(a locked one says which tool opens it), and Dig!. Then a patch of ground (1000 × 640 world units) with the sky above it on a tall screen:
- **Rub the dirt away**: his finger's stroke stamps along its path a third of the tool's radius apart; each stamp takes about a quarter of
  the dirt under it (a cell in the middle of a stroke is clear in one pass). The dirt is a 50 × 32 grid of how much is left, and the
  screen erases its dirt picture with the same stamps (destination-out sprites on a 500 × 320 canvas drawn scaled up), so what he sees
  cleared is what counts. Cleared ground is pale rock with cracks.
- **Rocks** (2 to 4, harder deeper: 3 to 13 hits, a tool hits for 1 to 9): the first sit on the bones; dirt under a rock can't be rubbed
  and a bone under one stays put until it cracks. Every tap cracks it (drawn) and the last smashes it.
- **A bone comes loose** when 55% of the dirt over it is gone ("A bone! Drag it to the crate!"); its last dirt falls away. He **drags it
  to the crate**; let go anywhere else it stays loose where he put it; let go most of the way there (or tap it three times) and it flies in.
  Bolts and the fossil fly up by themselves when uncovered.
- **Help**: after 7 seconds without progress a 👇 points at the next bone ("Dig here!"); after 18 the dirt over it falls away by itself
  and a rock on it crumbles. A bone left loose gets the 👇 too ("Drag it to the crate!"), and after 18 seconds it flies to the crate by
  itself, so a child who never drags still finishes. A scripted child always finishes (`dig/dig.test.ts`: every site × every tool, a
  child who only rubs anywhere and taps, one who stops, and one who does nothing at all).
- **Gadgets**: Headlamp (a light at his finger), Bone Finder (bones show faintly through the dirt), Bolt Finder (the same for Bolts),
  Leaf Blower (💨, three a Dig: blows a band of dirt off), Bone Magnet (loose bones fly to the crate), Water Hose (🚿, two a Dig: a much
  wider stroke for six seconds), Dynamite (🧨, once: every rock), Dig Dog (a 🐕 digs at the next bone), Rock Drone (cracks rocks), Dig Robot
  (rubs anywhere by itself). Each is on once bought; the shop switches it off and on.
- **Done**: "Every bone is in the crate! You found the leg bones, the ribs. You earned 2 Bolts." and 🏛️ Museum!. The Dig is used and paid
  only now; leaving halfway (🏠 twice) costs and pays nothing.

**Dig sites and dinosaurs** (`museum/dinos.ts`): twelve, small to huge, two a site, each 4 to 6 bones found in order, skull last (62 bones):

| Site | Tool | Dinosaurs (bones) | How it plays when alive |
|---|---|---|---|
| Sandy Creek | Brush (free) | Compsognathus (4), Velociraptor (5) | fast, double jump; fastest |
| Fern Gully | Trowel 10 | Pteranodon (4), Pachycephalosaurus (5) | flies (hold ⬆); headbutts rocks |
| Red Rock Canyon | Shovel 30 | Stegosaurus (6), Parasaurolophus (5) | smashes rocks; honk shakes fruit down |
| The Badlands | Pickaxe 45 | Triceratops (5), Ankylosaurus (5) | smash rocks |
| Volcano Ridge | Jackhammer 60 | Allosaurus (5), Spinosaurus (6) | big jump; swims fast |
| Frozen Cliffs | Digger 100 | Tyrannosaurus rex (6), Brachiosaurus (6) | smashes rocks, roar shakes trees; reaches high leaves |

**The dinosaurs are drawn in code** (`art/dino.ts`) from one rig of numbers each (body, neck, head shape, tail, legs, plates, frill and
horns, sail, club, wings, crest): as a skeleton on an iron stand (found bones bone-white, missing ones dashed outlines) for the Museum, and
with skin (its colours or his, markings clipped inside its outline, a hat, a walk cycle, an open jaw for a roar) for the hall and the run.

**The Museum (`museum/MuseumScreen.tsx`)**: the hall (his living dinosaurs walking up and down; tap one and it roars and is named; the
things he bought for the hall, which hop and say their name when tapped), Dig! (with how many) and Shop, a plinth per dinosaur (its
skeleton so far, its name, 🦴 found/total or 🔒 and the tool it needs; ✨ Alive! on a whole one, ▶ on a living one), and the fossil shelf.
After a Dig the new bones snap on one at a time, and it says how many of how many, or "The skeleton is done! Bring it to life!".

**Alive (`run/run.ts`, `run/RunScreen.tsx`)**: the first time, the skeleton grows its skin among sparkles ("It is alive!" and its line,
"T. rex! The king of the dinosaurs!"). Then a side view across his chosen Land (4,200 units, about 15 to 40 seconds): hold anywhere or ▶
to walk, tap or ⬆ to jump, 🦖 to roar (its roar sound). Snacks low, high (only the long neck, or a good jump) and in the air; rocks (a big
dinosaur smashes through, a small one jumps or bumps); the Land's own thing in the way (a log, a crab, a cactus...); ponds (the
Spinosaurus swims fast, others wade slowly); trees that a T. rex or Parasaurolophus roar shakes fruit out of. **It can't be failed**:
a bump wobbles him back, and anything bumped three times moves out of the way, so holding walk alone always reaches the nest
(`run/run.test.ts`: every dinosaur × every land, with and without gear, walking and jumping or walking only). "You made it! 🍃 × 22".
It pays nothing and costs nothing.

**The Shop (`shop/ShopScreen.tsx`, `shop/shop.ts`)**: nine tabs, cheapest first. Tapping a thing he hasn't got tries it (a look goes on the
dinosaur in the picture, a roar plays) and says its name and price ("It costs 12 Bolts."), with Buy when he can afford it; otherwise "You
need 4 more Bolts." and it becomes his Goal (shown as a chip). Looks are for one living dinosaur at a time, chosen from a row of them.

| Tab | Things (free one) | For sale | Prices | Total |
|---|---|---|---|---|
| Tools | Brush; Trowel, Shovel, Pickaxe, Jackhammer, Digger | 5 | 10 to 100 | 245 |
| Gadgets | above | 10 | 12 to 70 | 320 |
| Colors | Natural; 17 from Red to Rainbow | 17 | 3 to 40 | 149 |
| Markings | none; Spots, Stripes, Scales, Polka Dots, Zigzag, Hearts, Stars, Tiger, Leopard, Camo, Flames, Galaxy, Glow Stripes | 13 | 8 to 60 | 282 |
| Hats | none; Cap, Hair Bow, Sunglasses, Flower, Sun Hat, Smart Hat, Headphones, Goggles, Hard Hat, Top Hat, Army Helmet, Crown | 12 | 6 to 50 | 227 |
| Roars | Big Roar; Squeak, Chirp, Honk, Growl, Trumpet, Thunder, Robot, Dragon, Siren, Space Laser, Mega Roar (made in code, `sounds.ts`) | 11 | 5 to 60 | 258 |
| Gear | Sparkle Feet, Rainbow Trail, Confetti Roar, Snack Magnet, Super Jump, Turbo Run, Big Stomp, Glider Cape | 8 | 12 to 75 | 317 |
| Lands | Fern Forest; Sunny Beach, Swamp, Desert, Snowy Hills, Volcano, Night Jungle, Candy Land | 7 | 20 to 100 | 400 |
| Museum | Ferns, Bench, Balloons, Palm Tree, Banners, Egg Nest, Visitors, Big Clock, Spotlights, Fountain, Volcano Model, Meteor, Gift Shop, Disco Ball, Robot Guide, Skylight, Rocket, Rainbow Arch | 18 | 5 to 80 | 541 |

**Things to earn: 151** (101 bought for 2,739 Bolts, 12 dinosaurs, 30 fossils, 5 dig sites opened), plus 62 bones. 30 of the bought things
change how the Dig or the run plays (tools, gadgets, gear, lands). No price is over 100.

**Economy defaults, for the parent to confirm.**
- One Dig per finished Round, one free Dig to start; Digs don't expire.
- A Dig finds one or two bones (alternating), pays 2 Bolts (found in the dirt), and a fossil every other Dig.
- The first dinosaur (Compsognathus, 4 bones) is whole after 3 Digs: the free one and two Rounds' (the brief asked for about three).
- All 62 bones take 45 Digs (buying each tool as soon as it can); all 30 fossils come with the 60th Dig. A Round and its Dig pay at most 8 Bolts, so the whole shop is
  roughly 340 Rounds; tools alone (245) about 31.
- The tools cost 10, 30, 45, 60 and 100 (the brief's 10, 30, 60, 100 with a Pickaxe between).

## Look (pass 1)

The family look in warm sandstone, bone white, fern green and dirt brown: Bungee titles, Nunito for the game's words, Andika for every
word he reads (lowercase, a sentence's first word capitalised), 4px black outlines and solid drop shadows that press in. Home: Play is a
dig site (sky, ferns, strata, a bone and a letter tile, the green ▶), the Museum tile shows his newest dinosaur (alive, or the skeleton so
far), Dig (with the count) and Shop, and My Levels. Icon (`icon.ts`): a T. rex skull half out of layered dirt, teeth and all, with a
lowercase "a" tile beside it, on sandstone rays. Signals stay the family's: green Go and right, yellow look here (a glowing answer, the
sound to change), orange being read aloud (a lit box or sentence word).

## Save

`dino-dig-save`, version 1 (an unknown version reads as a blank save), and `dino-dig-place` for the screen and the Round in progress.
`readMuseum` trusts nothing: no dinosaur keeps more bones than it has, only a whole skeleton is alive, nothing he doesn't own is worn,
and unknown ids are dropped. A Dig or a run isn't a place: a reload during one lands in the Museum with the Dig still there.

## Open questions for the parent

1. Every word clip needs a listen on the iPad, especially the least sure: moth and mop (normal and slow; a model hears "math", "map"),
   tub (normal, and slow at -15%), the Jenny ones (cat, grab, puff, duck) among Aria's, the slower-than-usual slow clips (shop, sock at
   -20%, lunch -25%, brick -30%), bat, cube, grape, cute, and slow hut, luck, pot, beak; then "Dig here!", "Hair Bow" and the dinosaur
   names. The 2 the voice says as "to" is right for a number.
2. The pictures need a look on the iPad (Apple's emoji): especially 🪽 wing, 📌 pin, 🪵 log, 🍃 leaf, 🎨 paint, 🛝 slide, ⛓️ chain, 🧠 brain,
   and the composed Read and Find scenes (is "in" readable when one emoji peeks out of another?).
3. Should Read It Level 3 have more one-sound-apart pictures? Only 29 pictured words have a pictured neighbour; the other choice is the
   closest-looking word. More pictured words would need words added to the shared list (and Word Wreckers' clips).
4. Are silly words (vob, zorp) right for him, or do they confuse him the way wrong spellings might?
5. Are 8 first-try answers between Patterns the right pace (as Word Wreckers)?
6. Is 2,739 Bolts of shop right (Word Wreckers has 8,315)? More things can be added without raising payouts.
7. Should the run pay anything, or stay just for fun?
8. /sh/ was the one isolated sound that came out as a sound. Nothing uses it.

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari/WebKit. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 by the tour
  (`tools/dino-dig/tour.ts`, real touch events through the DevTools protocol), on a new save and on saves with every kind open at Level 2
  and at Level 3.
- The voice clips have not been listened to by a person; only speech-to-text checked them (above), and only the words, not the 600
  other lines.
- The Dig's frame rate on the iPad 9 is not measured. In headless Chromium (1080×810 at 2× pixels, rubbing continuously, with the Dig
  Dog, Robot, Drone and Headlamp on) the Dig's own work is 0.3 ms a frame (1.1 ms at 4× CPU throttling). At first the canvas ran at the
  full 2× and Chromium's software compositing managed only 20 fps, so the Dig canvas is capped at 1.25 device pixels per CSS pixel (the
  dirt is a half-resolution layer anyway) and the run and the Museum hall at 1.5: the Dig then holds a median of 60 fps (p95 30), 15 fps at
  4× throttling, where software compositing is the limit. Real GPU speed on the iPad 9 is the thing to check.
- Visual design is pass 3's: the run's tall portrait sky, the hall, the plinths and the shop are functional, not designed.
- No Trophies, no per-word strength (per Pattern, as Word Wreckers), no isolated speech sounds (by design), no sharing of clips with
  Word Wreckers (each game records its own).
