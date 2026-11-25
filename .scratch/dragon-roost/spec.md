# Spec: Dragon Roost (grammar: kinds of words, irregular forms, contractions and capitals; hatch, raise and fly dragons)

Status: built on 2026-11-25 (pass 1 of 3: the build; pass 2, the bug and sound review, the same day), playable at `/dragon-roost/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Globe Hopper and Sentence Express (`src/globe-hopper/`, `src/sentence-express/`), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn **Flames**, spent at the **Roost** on eggs, nests, tricks and gear. Each Round also earns a **Flight**: he flies his dragon over hills, lakes and castles, lighting beacons with its breath.

## Research

The kinds follow the Language strand the brief names, checked against the standards' text:

- **CCSS L.1.1** (grade 1 conventions): L.1.1b common and proper nouns; L.1.1c singular and plural nouns with matching verbs (*He hops; We hop*); L.1.1e verbs for past, present and future (*Yesterday I walked home; Tomorrow I will walk home*); L.1.1f frequently occurring adjectives; **L.1.2a** capitalize dates and names of people.
- **CCSS L.2.1b** frequently occurring irregular plurals (the standard's own examples: *feet, children, teeth, mice, fish*); **L.2.1d** the past of frequently occurring irregular verbs (*sat, hid, told*); **L.2.2a** capitalize holidays, product names and geographic names; **L.2.2c** an apostrophe to form contractions and frequently occurring possessives.
- **TEKS 2.11(D)** (grade 2: edit drafts using standard English conventions): past tense of irregular verbs; singular, plural, common and proper nouns; **adjectives, including articles**; capitalization of months and days of the week; apostrophes in contractions.

What that settled:

1. **On-screen terms: noun, verb, adjective** (the brief's default). Every set of standards above uses them, and so do the common first-grade programmes. Each is met first with its meaning in a Meeting. Level 1 asks by meaning ("Which word names something?"), the term comes in at Level 2 ("Tap the noun."), and every lesson ends with it ("So it is a noun."). **Not yet asked of the parent** (see Open questions); every line that says a term is in `src/dragon-roost/words/terms.ts` (24 lines), so a change re-records only those.
2. **Articles count as adjectives in Texas** (TEKS 2.11(D)(iv)). So "Tap the adjective" only ever uses a sentence with no *a, the, my, this* or number word (*Dragons have sharp teeth.*), and a test enforces it. Otherwise a child taught TEKS would have two fair answers.
3. **Present, past and future (L.1.1e).** Yesterday Level 3 offers *flew*, *fly* and *will fly*, not the brief's *flies*: "Tomorrow the dragon flies to the lake" is good English (a planned future), so *flies* would be a second right answer. With one dragon or one person, the bare *fly* is wrong after both time words.
4. **Agreement (L.1.1c)** is Verbs Level 3 (*The dragon flies / The dragons fly*), as the brief has it.
5. **Hook and Ladder's Endings** already teaches regular *-s, -ed, -ing* ("No *ran, mice, feet*"), and Sentence Express owns the capital at the start of a sentence and the end marks. Here: Yesterday Level 1 is the one regular *-ed* step the brief asks for (in a sentence that starts *Yesterday*, with *jump, jumps* as the other choices, never *-ing*); everything else is irregular; Big Letters never asks for the first word's capital.

## Kinds

Seven kinds, three Levels each. Everything is a tap. The words and sentences are data in `src/dragon-roost/words/` (no game code): the lexicon (each word with its jobs, its picture, and for a noun whether it is a person, an animal, a place or a thing), 136 sentences with the job of every word, and the kinds' own tables (gap frames, plurals, pasts, squeezed words, the dragons' looks). With the gap frames, the squeeze sentences and the dragons' looks there are **250 different sentences**, each a clip.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Nouns** `noun` | start | which word names something (a noun, a verb, an adjective, all one-job) | tap the noun in a sentence with one noun | person, animal, place or thing |
| **Verbs** `verb` | start | which word is something you do | tap the verb (one doing word, no helper) | the word that fits who does it: *flies / fly* |
| **Adjectives** `adj` | Nouns L2 | which word tells what something is like | tap the adjective (no articles or numbers) | two dragons, an arrow on one: which sentence tells about it |
| **More Than One** `plural` | Nouns L2 | which word means more than one *mouse* | *foot* or *feet* from the words round the gap | *sheep, deer* mixed in, against the made-up *sheeps, mouses* |
| **Yesterday** `past` | Verbs L2 | *jumped / jump / jumps* after "Yesterday" | the 18 that change: *ran, flew, ate, saw, went, came, sat, hid, told, dug, swam, rode, made, found, slept, grew, blew, drove* | yesterday or tomorrow: *flew / fly / will fly* |
| **Squeeze** `squeeze` | Verbs L2 | which two words made *don't* (9: don't, can't, isn't, I'm, it's, didn't, wasn't, aren't, hasn't) | the short way to say *is not*; or tap the gap where the apostrophe goes | *won't, I'll, we're, they're, he's, she's* in a sentence |
| **Big Letters** `capital` | Adjectives L2 | a name to fix (*I hug sam.*) | a day or a month | two to fix, one a place (*We fly to rome on friday.*) |

**Rules the tests enforce** (`words/words.test.ts`, `questions/problems.test.ts`):

- **Every word is one he can read**: on Sight Squad's, Dino Dig's (and so Word Wreckers'), or Cargo Words' lists, or one of those with a plain *-s, -es, -ed, -ing*, or one of this game's own words (`words/allowed.ts`, 94 of them): the dragon words (*dragon, egg, roost, flame*, and the dragon's doing words *roar, glide, flap, loop, dive*, met in the Nouns and Verbs Meetings), the time words, and the forms the kinds exist to teach (*mice, feet, ate, hid, don't*, the names, days, months and eight places). Checked over the tables and over 8,400 generated questions.
- **A word has one job wherever it is asked alone.** The lexicon marks every word with all its jobs; only one-job words are Level 1 choices. The brief's examples (*fly, play, run, jump, water, park, orange, cold*) and 82 more (90 in all, *pretend* and *baby* added in pass 2: "a pretend castle", "a baby dragon") that a first grader would use the other way (*kick, hug, rock, nest, roost, flame*, every colour) are listed in `TWO_JOBS`, and a test fails if one is ever a choice. In a sentence a two-job word is marked where it stands (`The dragon can fly:v.`), and a test fails if one is left unmarked.
- **Exactly one choice is right**: every generated question, every kind and Level, has one right answer among what can be tapped. "Tap the noun" has exactly one noun (a name counts) and no *I, he, she, it, we, they* or *you* (pass 2: a child told "a noun names a person" could fairly tap *She* in *She went up the hill.*; those sentences are asked for their verb only, and 18 pronoun-free ones were added); "Tap the verb" one doing word and no helper (*is, can, will*); "Tap the adjective" one describing word and no article.
- **Only forms nobody disputes**: no *fishes, persons, dreamt/dreamed, dove/dived, lit/lighted, hung/hanged, shone, snuck, got* anywhere. *Fish* is met in the Meeting but never asked against a made-up form (that would have to be *fishes*).
- **Squeeze never asks *its/it's* or *your/you're*** (and never shows *were* or *his*, the sound-alikes of *we're* and *he's*).
- **Big Letters never repeats Sentence Express**: the first word is always right already; the only capitals to find are names, days, months and places.
- **A word or sentence is not asked again until at least twenty others have been**: the last 40 topics are kept in the save, and a Round avoids the last 20; if a kind has nothing fresh at its Level, another kind is asked instead. Tested over 200 Rounds at every Level and with only Nouns and Verbs open.
- Lowercase and Andika everywhere he reads, with capitals where a sentence, a name or *I* needs one.

**Mastery (as Math Bots).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30 questions of a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. No Tune-Up: the quick rule places him (as Sentence Express). About one in three questions, and always the one after a miss, is easier and doesn't count. A miss comes back later as a fresh question of the same kind and Level, with no credit.

**Meetings.** Before a kind's first question, a short spoken Meeting, then Next: Nouns (*A noun names a person, an animal, a place or a thing*, then king, dog, hill, cake with their pictures, then the dragon words, "They are nouns too!"); Verbs (the meaning, then the dragon flies, roars, glides, flaps, loops and dives as each is said); Adjectives (the dragon grows, shrinks, turns green, smiles, gets muddy); More Than One (*One mouse, two mice* with the mice multiplying; *One sheep, two sheep*, "Some words stay the same"); Yesterday (the calendar flips back; *Today I run. Yesterday I ran.*); Squeeze (*do not* slides into *don't*, the *o* falls out, the apostrophe lands); Big Letters (*Sam, Monday, May, Spain*, each first letter growing, then "Names, days, months and places start with a big letter."). Nouns is met before anything else, so the dragon words are always met before a sentence uses them. A Meeting is one of the Round's five answers (as in Globe Hopper and Math Bots).

## Teaching a miss

Never a red X. The first miss's lesson plays on the question and is said; a second miss (or 🔎) adds the fuller one, the rule in one sentence and two more examples, before the question comes back (`questions/teach.ts`).

- **Nouns:** the tapped word is said with its own job if it has one ("Grow. It is something you do."), then the right word's picture appears: "Dog. It names something. So it is a noun." Sort: "Snail. It is an animal." Fuller: the meaning, then *king* and *dog* with their pictures.
- **Verbs:** the dragon does it ("Fly. It is something you do. So it is a verb."); agreement: the sentence whole, then "One dragon flies. Two dragons fly." Fuller adds "When one does it, the word ends in s."
- **Adjectives:** the dragon changes as the word is said: it grows (*big*), shrinks (*tiny*), turns red, frowns (*unhappy*), gets muddy, its wings grow (*long*). Level 3: "This one tells about it." and the right sentence.
- **More Than One:** one picture becomes two, and the word changes with them, its changed letters lit: "One mouse, two mice."
- **Yesterday:** the calendar page flips back a day and the doing word changes as it lands; "Yesterday means it has happened." (or "Tomorrow means it will happen."), and for the ones that change, "Today I run. Yesterday I ran."
- **Squeeze:** the two words slide together, the letters that drop out fall away, the apostrophe lands: "Do not. Don't. The apostrophe goes where the letters came out." (*won't*: "Will not squeezes into won't.")
- **Big Letters:** each name glows and its first letter grows: "Sam is a name. Names start with a big letter." A word that already has its capital: "It already has a big letter."

## The reward: the Roost, the Eggs and the Flight

The brief's first risk was that dragons may not hold him the way vehicles do, so a hatched, flying dragon comes at once: he starts with a dragon egg already hatching. The first time he opens the Roost or flies, it cracks, he names his dragon, and his first Flight is free. His first egg costs 6 Flames (within two Rounds) and hatches three Rounds after.

**The loop.** A finished Round earns Flames (one per answer right first try, one for finishing: the shared `boltsFor`), one Flight, and warms every egg in a nest by one step. Flames buy eggs, nests, tricks, gear, colours and toys. A Flight pays the Flames he catches (three float on every Flight), one more for lighting every beacon of a new Flight, and one for a new best on one he flies again: at most 4.

**Eggs and dragons.** An egg needs a free nest and hatches after a set number of Rounds (3 for the first, up to 8 for the rarest; the Hot Spring and Big Hearth each take one off, never below 2), so hatching can't be bought out early. He taps a warm egg; it wobbles, cracks, and he names the dragon from two rows of six words, one describing word and one noun (*Tiny Comet, Jolly Pumpkin*), from the game's own tables and said as he taps (he isn't tested on them). Each dragon is put together from parts: body (6), head (5), horns (9), wings (8), tail (6), colour (24), accent (24), pattern (9) and breath (fire, frost, sparks, bubbles, rainbow). The breath changes how the Flight plays: frost reaches further, sparks furthest but narrow, bubbles spread widest, rainbow both. A dragon grows as he flies it: hatchling, young (3 Flights), great (8), then a new **mark** every 4 Flights (a stripe, a horn ring, a star on its wing), with no last one.

**The Flight (`flight/`, 2D canvas, about a minute).** From the side, a mountain sky at dawn (or night), over rolling land with lakes, castles, towers and peaks. The dragon flies right by itself. A held finger anywhere sets its height; holding **Breathe** sends its breath ahead, which lights the beacons (stone bowls on the land, on castles, or on posts) and pops clouds; flying through a cloud pops it too. Trick buttons do their tricks. A racing bird turns up from the third Flight; only a speed trick can beat it. It cannot be failed: land, castles and peaks bounce the dragon up and over ("Boing!"), and every Flight ends at its far end. At the end: beacons lit out of how many, clouds, birds, Flames, "New best!", the dragon growing or a new mark, a new rider rank or trophy. A Flight is only used at its end, so leaving halfway (🏠 twice) costs nothing.

**Tricks.** 30 doing words (Flap is free; Hop, Spin, Zoom, Roar, Loop, Dive, Glide … Flip, Whirl, Blast), each with one of six effects and a strength: a burst of speed (Zoom, Dash, Soar, Zip, Blast), a ring that pops clouds and catches Flames round it (Spin, Loop, Twirl, Tumble, Swirl, Flip), a roar that lights beacons far ahead (Roar, Puff, Sneeze, Sparkle), a magnet that pulls Flames and clouds in (Dive, Swoop, Splash, Shake, Whirl), a slow glide with a longer breath (Glide, Hover, Flutter, Wave), a hop up (Flap, Hop, Wiggle, Bounce, Dance, Skip). Two buttons to start; the Trick Belt, Big Trick Belt and Super Trick Belt give 3, 4 and 5.

**The Roost.** A mountain with ledges, his nests and eggs, his dragons (as many as his perches let it draw, at most ten: the iPad 9 limit is on what is drawn, not what he owns), the pieces he has bought, and the hearth at the bottom, burning brighter the more Flames he has and never out. Tabs: Roost, Eggs (each nest and its warmth; tap a warm one to hatch it), Dragons (tap one to fly it), Tricks (tap to put on or take off a button), Gear, Colours, Toys, Places (fly one again to beat his best) and Trophies. Tapping a thing says its name, what it does and its price; Buy when he can, else it becomes his Goal, with a bar filling toward it.

**Visit the roost.** Every dragon he has, wandering a meadow with his toys, twelve at a time (◀ ▶ for the rest). Tap one and its name is said and it spins; with Feed on (once he has a treat) it gets a treat: "Yum!".

**Not built: the Dragon Race** (the brief's optional competition). His personal best on each Flight is kept and cheered ("New best!", one Flame) and needs no rival. See Not done.

### The catalogue (251 named things)

| | Count | Flames | What it changes |
|---|---|---|---|
| Eggs | 40 named dragons | 6 to 180 | a new dragon, its breath (5 kinds), its look; Wild Eggs after |
| Tricks | 30 (1 free) | 5 to 100 | a Flight button: speed, ring, roar, magnet, glide, hop |
| Roost pieces | 40 (1 free) | 5 to 120 | 6 nests (each holds an egg), Hot Spring and Big Hearth (eggs hatch a Round sooner), 6 perches (another dragon drawn), Lookout (an arrow over each beacon), Weather Vane (no wind), Lanterns, and 23 to look at |
| Gear | 30 | 6 to 170 | 7 saddles (climb, speed), 3 magnets (reach for Flames), 3 breath pieces (breath reach), 3 trick belts, 8 hats, goggles, bell, scarf, cape, backpack |
| Colours | 30 (2 free) | 4 to 32 | breath colours and trails |
| Toys and treats | 30 | 3 to 45 | toys on the meadow; treats to feed in Visit |
| Places | 24 | earned | one new place a Flight |
| Trophies | 20 | earned | beacons, clouds, birds, dragons, growth, places |
| Rider ranks | 11 | earned | by Flights flown |

**Again and again:** a **New Ledge** (40, rising by 10 to a flat 120: another nest and another perch, the roost has no top) and, once he has twenty of the forty named eggs, a **Wild Egg** (40, rising by 2 to a flat 60). Pass 2 opened Wild Eggs at twenty rather than forty: waiting for all forty left the last 300 Rounds of the catalogue with nothing under 140 for sale but a New Ledge, and gaps of up to 19 Rounds between purchases.

**The endless layer**, made from a number and the same after a reload:

- **Wild Eggs** (`roost/dragons.ts`): every one a dragon generated from its number; rarer parts (the rainbow breath, the bigger horns and wings) turn up more the further he has got, and every fifth has a part no bought egg has (crystal horns, rainbow wings, a starry back).
- **Generated Flights** (`flight/course.ts`): after the 24 places, each Flight's land, lakes, castles, weather, day or night, beacons, clouds and Flames come from its number; a little longer and fuller each time (1,000 to 1,500 units, 6 to 10 beacons), holding from Flight 121. `flight/sim.test.ts` flies 3,000 of them with a child who does nothing (finishes every one, never in the land, under 85 seconds), a clumsy child (every tenth) and a skilled child (lights every beacon of every one).
- **Marks**: a dragon earns a new one every 4 Flights after it is great, without end.
- **Dragon Legend 1, 2, 3 …**, a rank every 40 Flights after Dragon Master.

### How long it lasts (measured)

`roost/economy.test.ts`, the scripted child of the build guide: every answer right first try, every Flight flown by the skilled child (paid exactly what the game pays), every warm egg hatched and named at once, always the cheapest new thing bought.

- **Flames a Round: 8.2** (6 from the Round, about 2.2 from its Flight). At most 10 in one Round and Flight.
- **Rounds to finish the fixed catalogue: 884** (the 196 things for sale cost 7,780 Flames; eggs also wait on nests and Rounds). At about 20 Rounds an hour that is about 44 hours.
- **Longest gap between purchases: 3 Rounds in the first 100**, 5 in the first 300, 19 in the first 1,000 for this child, who saves for the whole catalogue before a single Wild Egg. A second scripted child who also takes a Wild Egg whenever it is the cheapest new thing (they open at twenty named eggs, pass 2) is **never more than 8 Rounds** from a purchase in 2,000 Rounds, has 255 dragons by then, and leaves the dearest named things for later. Both are in `roost/economy.test.ts`, with a test that something new other than a New Ledge is never more than 8 Rounds of saving away.
- After 2,000 Rounds there is still something new every Round (a Flight he hasn't flown, a ledge or a wild egg to buy, an egg to hatch), and he has 218 dragons.
- The dearest thing (the Golden Egg, 180) is 22 Rounds of saving; seven things are over 15 (Golden, Rainbow, Galaxy and Aurora Eggs, the Super Trick Belt, the Gold Saddle, Mighty Breath). Every one of the 20 dearest changes what he can do (an egg's new breath, a saddle, breath reach, a magnet, a belt, a roost piece that does something); no paint is near the top.
- A Round with its lessons and Meetings took 96 to 99 seconds in the browser tour, a Flight about 51.

## Look

A mountain at dawn: warm rock, pink and gold sky, deep green valleys. Dragons are drawn in code (`art/dragon.ts`), round and friendly, one bright colour with a pale belly, big shiny eyes and a smile, never frightening; the same drawing is the lesson's dragon, the Roost's, the Flight's and Visit's. Words in questions are on stone tablets in Andika. The family look: Bungee titles, Nunito, 4px black outlines, chunky drop shadows. Icon: a green dragon's head peeking out of a cracked speckled egg, a small flame above it, on a dawn sunburst. Respects Reduce Motion.

## Currency: Flames

`FLAME` in `src/currency/kind.ts` (one Flame, many Flames), a small friendly flame (orange outside, yellow inside, dark red outline) in `src/ui/currency.tsx`, exported from `branding.ts` as `CUR`. At the end of a Round his dragon flies in and puffs the Flames onto the pile one by one with a soft whoosh. The Roost's hearth burns brighter with more and never goes out. A test fails if "Bolt" appears in any phrase or any of the game's files (outside the shared rule's name `boltsFor`).

## Voice

Aria at -8%, `tools/make_voice.py --collection dragon-roost`: **1,275 clips, 13.1 MiB** (`public/dragon-roost-voice/`), packed by the build into 16 files; the game's precache is 13.8 MiB. Pass 2 cut 159 clips nothing plays (words never said alone, unused lines, whole tens above 200, the ten sentences only "Tap the noun" asked) and trimmed every clip's silent tail with `tools/dragon-roost/trim-voice.ts` (whole MP3 frames dropped from the end, no re-encoding; what the game keeps decodes bit for bit the same). Run it again after `make_voice.py` records new clips. `questions/teach.test.ts` runs every lesson and checks every word it says has a clip. Every word and sentence in the tables is a clip; numbers to 100 and whole tens to 400 are chained into prices; a frame's gap is read "blank" (`tools/dragon-roost/said.ts` feeds `said_as`). Answer buttons are never read out; questions, lessons, Meetings and the reward are.

Checked with speech-to-text (faster-whisper small.en) on all 719 clips of one or two words. 45 came back different. Most are homophones written another way and said right (*ate/eight, blew/blue, rode/road, flew/flue, they're/there, we're/weir, to/two, by/bye, for/four, are/R, can not/cannot*) or compounds run together (*Pine Wood/Pinewood, Ten Beacons/10 beacons*). The real slips are fixed in `make_voice.py`'s `dragon-roost` entry: *ticket, Gear, Boing!, Bow* (the ribbon, said "beau"), *Big Magnet, Big Cake, Smart Hat, Flame Rider* by rewriting, and *goose, market, slept, won't, duck, Dot, into, Perch* in Jenny's voice (Aria's still came out "deuce", "Mark it", "Slapped", "want", "dack", nothing, "until" and "Purge" however they were written). After the fix every one is heard right except *Dot* (no text from the model in either voice; a bare name it can't spell) and *into* ("in 2", the same sound). Pass 2 ran small.en again over all 913 clips of up to three words and over the 31 new ones: *hopeful* came back "helpful" (now said "Hopeful!"), "You opened Squeeze!" as "You open Squeeze" (now "You opened, Squeeze!"), "Jill can hop!" as "Jail can hop" (now "Sam can hop!"), and *Dot* still as nothing, so the name is Meg now ("dot" is also an everyday word, which made "Here is dot." a muddled Big Letters question). Not listened to by a person.

## Save

`dragon-roost-save`, version 1 (an unknown version reads as a blank save), and `dragon-roost-place` for the screen and the Round in progress. A reload during a Flight lands at the Roost.

## Open questions for the parent

1. **Which words does his class use for the kinds of word?** The default is noun, verb and adjective, each met first with its meaning. If his class says "naming word", "doing word" and "describing word" (or something else), only `words/terms.ts` changes and 24 lines are re-recorded.
2. Does his class count *a* and *the* as adjectives (Texas does)? Either way the game never asks a sentence that has them, but the lesson could say so.
3. *Can not* or *cannot*? The game shows *can not* (the brief's spelling); most dictionaries prefer *cannot*.
4. Is one Flight per Round right, and should Flights pay Flames at all (at most 4)?
5. Is the first egg in six Flames and three Rounds quick enough, and are eight Rounds for the rarest eggs too long?
6. Should he be able to fly a Flight without having earned one (for fun, paying nothing)? Now he needs one.
7. Should the Dragon Race be built (see Not done)?
8. "Dragon Roost" is the brief's working name.

## Not done

- **The Dragon Race** (optional in the brief): no rival, so no win rates. His best on each Flight is kept and cheered.
- Not run on a real iPad or in Safari. Most worth checking there: two fingers at once in the Flight (one steering, one on Breathe), the Flight's frame rate with rain or snow and a long trail, the Roost and Visit canvases with ten dragons, and the voice chained into lines.
- The near wing of the bat-winged dragons reads as a dark shape at small sizes; the design pass should look at the dragon drawing, the Roost mountain and the Flight's scenery.
- Feeding is only in Visit, and does nothing but please.
- Possessives (the other half of L.2.2c) are not asked.
