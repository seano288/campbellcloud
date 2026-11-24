# Spec: Cargo Words (reading long words a syllable at a time; build a container port and work the crane)

Status: built on 2026-11-23 (pass 1 of 3: build), playable at `/cargo-words/` with a tile in **Learning Games** on the landing page,
after Jetway. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is still
a working name.

A new learning game on the family site, built the same way as Jetway (`src/jetway/`, `.scratch/jetway/spec.md`) for the same player (6 to
7, reads short words, leans on the recorded voice, alone on an iPad 9), and the third-batch step up in reading after Dino Dig and Word
Wreckers. Short mixed Rounds earn Bolts, spent on port pieces, cranes and their parts, ships, paints and container looks. Each Round also
earns a Ship to load: he works the crane himself, the containers carry the syllables of the words from his Round, and the loaded ship sails
to a new harbour on the sea chart and brings something back.

## Research: what it teaches, and where it starts

Legend: **[V]** read in a source this session, **[S]** search result or summary only, **[M]** from memory, not re-checked.

| Standard | What it asks | Where it is in Cargo Words |
|---|---|---|
| CCSS RF.1.3d | Every syllable must have a vowel sound: use that to count the syllables in a printed word [S] | **How Many Containers** L3 (a written word, not said, one to four beats) |
| CCSS RF.1.3e | Decode two-syllable words following basic patterns by breaking them into syllables [S] | **Split It**, **Load the Ship**, **Read It** L1–L2 |
| CCSS RF.2.3a–c | Long and short vowels in one-syllable words; spellings of common vowel teams; regularly spelled two-syllable words with long vowels [S, cde.ca.gov] | **Split It** L3 (open syllables: ti-ger), **Read It** L2 (teams and bossy r) |
| CCSS RF.2.3d | Decode words with common prefixes and suffixes [M] | **Add-Ons** |
| CCSS L.2.4b | The meaning of a new word formed when a known prefix is added to a known word (happy/unhappy, tell/retell) [M] | **Add-Ons** L1–L2 (and the lesson: "Un means not.") |
| Six syllable types (structured literacy) | Closed, open, vowel-consonant-e, vowel team, r-controlled, consonant-le [S, readingrockets.org, imse.com] | every kind; the open, consonant-le and final-y types are new here and each has a Meeting |
| TEKS 2.2(B) | Decode multisyllabic words with closed, open, VCe, vowel team, r-controlled and final stable syllables; prefixes un-, re-, dis-; inflections and -er, -est [S, TEA phonics breakouts, grade 2] | as above; dis- is not asked (open question 6) |

**The three checks the brief asked for (read in the code, `src/dino-dig/words/list.ts`, `src/word-wreckers/spelling/words.ts`,
`src/hook-and-ladder/words/endings.ts`):**

- **What he has met.** Dino Dig's six Patterns, all of them: short vowels (cvc), the digraphs sh ch th wh ck ng and doubled ll ss ff,
  blends, the magic e (a_e i_e o_e u_e), the vowel teams ee ea ai ay oa and ow (only as in snow), and the bossy r (ar or er ir ur). Not met
  anywhere: oo, ou, oi, aw, igh, ew, ie, ue, y as a vowel, soft c and g, "all", the long vowels of old/ind/ild. So every syllable here is
  made of those (checked by rule in `words/sounds.ts` and tested), plus three syllable types that are new and each met in a short spoken
  **Meeting** first: the **open** syllable (ti-ger: a vowel at the end says its name), **consonant-le** (tur-tle) and the **final y**
  that says ee (hap-py).
- **Bossy R is already taught in Dino Dig** (its sixth Pattern, `r`, with car, star, horn, bird, girl, burn, fern). So, as the brief says,
  the kind's Level 1 (card or cord) is dropped and the rest move down; a new Level 3 is added (below).
- **Add-Ons does not repeat Hook and Ladder's Endings** (-s, -ed, -ing). Add-Ons has only un- and re- and -ful, -less, -er, -est (tested:
  no Add-Ons word ends in -ed or -ing).

**Breaks.** Every word has one agreed set of break points in the table, written with bars ('rab|bit'; a plus marks the joint of two small
words, 'sun+set'), following a school dictionary's end-of-line breaks (Merriam-Webster's [M]) where they agree with the structured-literacy
rules: two consonants between vowels split between them, a digraph, vowel team or bossy r never splits, one consonant goes with the second
syllable after a long first vowel (ti|ger) and with the first after a short one (cab|in), consonant-le takes the consonant before it
(tur|tle). The rules are a test (`words/words.test.ts`). Words whose break is argued over, or whose sounds break the rules, are left out
and listed (`ARGUED` and `NOT_HERE` in `words/words.ts`; see "Words left out" below). **The breaks were not looked up word by word in a
dictionary this session** (see Not done).

**Unstressed syllables.** An unstressed syllable often says a softer vowel (the "et" in rocket, the "a" in salad). That is how long words
sound; the table keeps such words and the voice says each syllable as it sounds in its word. Where an open syllable is said two ways in
two words (o in open but uh in violin), one side was left out so each syllable has one clip.

## Kinds

Six kinds, three Levels each, with Stretch inside a Level. Defaults:

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **How Many Containers** `count`: how many beats | start | a heard word of one or two beats, with its picture | a heard word of one to three beats (only Dino Dig's sounds at the first Stretch) | a written word that is not said, one to four beats |
| **Load the Ship** `build`: hear a word, load its syllable containers in order | start | two containers, exactly the ones needed (*sun-set*); closed and magic-e syllables first, then teams and bossy r | three containers and one spare from another word (*fan-tas-tic*) | two or three, with a spare that looks or sounds close: two letters swapped, another vowel, b for d, or a bossy r that says another sound (*gar-den* with *gra*) |
| **Split It** `split`: a written two-beat word of up to seven letters; tap where it breaks | How Many Containers L2 | two small words joined, and twin letters (*sun\|set*, *rab\|bit*) | two different letters in the middle (*nap\|kin*, *pic\|nic*, *tur\|tle*) | one letter in the middle, long or short first vowel (*ti\|ger*, *cab\|in*), always said slowly, a syllable at a time |
| **Read It** `read`: a written long word, never said before he answers; tap its picture | Load the Ship L2 | two beats, two pictures, closed and magic-e syllables | two beats, three pictures, with vowel teams and bossy r | three or four beats, three pictures |
| **Bossy R** `r`: ar, or, er, ir, ur inside long words | Load the Ship L2 | hear a two-beat word; fill its r container (*g _ _ den*: ar, or or er). The er sound is offered in one spelling only, the word's own, since er, ir and ur sound alike | read a long bossy-r word; tap its picture | hear a three-beat bossy-r word (two-beat at the first Stretch) and load it, with a spare whose r says another sound (*der* and *dar*) |
| **Add-Ons** `addon`: a container bolted on the front or back | Split It L2 | *un* and *lock* are shown and said; tap the picture of *unlock* (unlock, unhappy, replay, reload) | "Which word means not happy?" three written words (un and re first, then all six) | "Which word is hiding in careful?" (the base and two look-alikes that are not inside it), then -er and -est read and matched to pictures (*the longest ship*, *the darker container*, *the thickest rope*) |

The brief's Bossy R Level 1 (card or cord) is the one dropped. Its old Level 2 and 3 became one Level 2 (reading a long r word) plus the
new Level 1 (fill the r team) and Level 3 (load with an r spare), so the kind is always about r inside a long word.

**Rules the tests enforce** (`reading/problems.test.ts`, 450 generated questions of each kind and Level, across Stretches; `words/words.test.ts`):

- Exactly one choice is right, in every kind (every possible answer, including every order of the containers, is checked).
- Every word has one agreed set of break points that follows the syllable rules; *lemon*, *every*, *family* and *different* are left out.
- Read It never says the word before he answers (the question's lines and 🔎's lesson are checked); its pictures can't be mistaken for each
  other (look-alike groups: no rabbit beside bunny, sunset beside sunrise, telescope beside microscope ...), and other pictures start with
  the same letter where the table has one, so the first letter alone doesn't tell him.
- Every syllable is made only of sounds he has met in Dino Dig or a type met here first; a question that needs a new type waits for its
  Meeting (and a heard Level 1 question never needs one).
- Split It at Level 3 always says the word slowly, a syllable at a time.
- Add-Ons words mean what their parts say (un: not ..., re: ... again, ful: full of, less: without, er: more, est: the most); *uncle*,
  *under*, *until*, *refuse* and *really* never appear as add-on words.
- Words are lowercase, in Andika.
- Nothing rude or frightening on a container or a spare, or inside a word (*sturdy* is out; *goblin*, *bandit*, *dragon*, *spider* and
  *monster* are out). "ass" and "butt" are checked only as whole containers, since grass and butter are fine.

**Unlock order, Mastery, placement and Rounds (as Jetway).** 16 of the last 20 right on the first try, or the last 10 in a row; the first
30 questions of a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up:
three probes each of How Many Containers and Load the Ship at Level 2; three clean probes start that kind at Level 2. Rounds are five
answers, mixed, never the same kind twice running while there's another; about one in three (and always the one after a miss) is easier
and doesn't count; a miss comes back later as a new question with no Mastery credit. A Round resumes after a reload. A Meeting counts as
one of the five (as Jetway's do).

## Teaching a miss

Never a red X. The first miss gets the brief's short lesson on a row of containers, and "Try again!":

- **How Many Containers:** the word said a syllable at a time, a container dropping for each, then the number: "(rab) (bit) Two."
- **Load the Ship:** the containers lift into place one at a time, each said, then the whole word; the first container glows.
- **Split It:** the word comes apart at its break, each half is read, and the reason is said: "Two letters in the middle. Split between
  them." / "Two letters the same in the middle." / "Two small words." / "The l e takes the letter before it." / "The first vowel says its
  name. Split right after it." / "The first vowel is short. Keep the next letter with it." / "Two vowels that each say a sound."
- **Read It:** the word breaks into containers, each lights as it is read, the word is said, and the right picture glows.
- **Bossy R:** the vowel and its r light as one container: "A and r say ar." (er, ir and ur all "say er").
- **Add-Ons:** the add-on unbolts, the base word is read and the meaning said: "lock. Un means not. unlock means not locked."; for
  -er/-est: "Est means the most. This one is the longest."

The second miss (or the first when he's been missing a lot, or 🔎) gets the fuller lesson: "Tap each container to hear it." The next
container pulses; he taps each in turn and it says its syllable; then the word, then the short lesson, and the answer glows. Tested
(`reading/teach.test.ts`, thousands of questions): the fuller lesson waits for exactly one tap per container and every line is recorded.

## The reward: the Port, the Crane, the Ships and the Sea Chart

**The loop.** A finished Round earns Bolts and one **Ship** to load. Bolts buy port pieces, cranes and parts, ships, hull paints, funnel
marks and container looks. Each loaded Ship sails to the next harbour on the sea chart and brings something back. He starts with one free
Ship, so he sees the reward before his first purchase. Flat 2D canvas, no 3D or physics library, no new dependencies.

**The Crane (`crane/`, the action).** Built first with plain boxes (`tools/cargo-words/crane-feel.html`, still there to try on the iPad:
`npx vite tools/cargo-words`), then dressed. From the side: the quay with a row of containers (two high when there are many), the water,
the ship at the quay. He **drags** the trolley along the boom (it follows his finger at the trolley's speed) and **taps to lower** the grab:
a tap on a container sends the crane there and lowers it; the ⬇ Lower button lowers where it is (or where it's heading, if it's still
sliding). Over a container the grab lines up and **locks on by itself**, lifts, and the container says its syllable. Over the ship it lines
up with the nearest stack and sets the container down square. The ship **sits lower** as it fills; when it's full its horn sounds and it
sails. A row on the ship that reads a whole word, left to right, says the word.

It **cannot be failed and has no clock** (`crane/sim.ts`, tested): lowering over the water, an empty spot or a full stack just lifts again;
carrying over the quay it keeps hold (nothing goes back, so every lift is a step on); the swing is a damped pendulum capped well short of the
next stack. A careful scripted child and a clumsy one (random taps, drags and ⬇ presses) both fill every ship shape with every crane. A
middling ship takes the careful child 25 to 90 seconds (the browser tour's 2-container Tug: 22 seconds). If he does nothing for 15 seconds
the voice tells him what to tap.

**The containers' words.** The syllables of the words from his last Round (newest first), whole words only, then table words to fill the
ship exactly (`crane/cargo.ts`, tested), each container's look made from parts he owns (a colour, a stripe and a company mark), seeded so
a reload looks the same.

**The Port (`port/`).** A harbour from the front: the land with its buildings, the yard, rail and gate, and the quay with his cranes and
his ships at their berths. Every piece has a fixed place (`port/plot.ts`; tested: no two places overlap except strips and vehicles).
Pieces matter (`port/port.ts`, tested):

| Piece | What it changes |
|---|---|
| Berths 2–10, Another Berth | each holds one more ship: a ship he buys needs a free berth (the wooden pier holds the Tug) |
| Long Quay, Deep-Water Quay | the Container Ship and the Cruise Liner can berth; the Giant Gantry needs the deep-water quay |
| Crane Rails | the Gantry Crane can stand |
| Lighthouse, Fog Horn, Breakwater | night, foggy and stormy harbours (they wait until it's built) |
| Dry Dock | hull paints |
| Paint Shop | container stripes and company marks |
| Fish Market, Fuel Dock, Ferry Pier, Car Park, Shipyard | the Fishing Boat, Tanker, Ferry (and Liner), Car Carrier, Research Ship and Icebreaker |
| Rail Line, Train Engine, Long Train, Lorry Gate, Lorries, Warehouses, Yard | carry containers away in "Watch it run" |

**Cranes.** Dock Crane (free: ships up to 3 stacks × 2 high), Tall Crane (4 × 2), Gantry Crane (5 × 2), Floating Crane (4 × 3), Giant
Gantry (6 × 3). Slots for every crane: the grab (Single, Twin: lifts a stack of two and sets down what fits), the cable (4 speeds), the
trolley (4 speeds), lights (5 colours), the horn (5 horns) and the crane's paint (10).

**Ships.** Tug (free), Fishing Boat, Feeder Ship, Research Ship, Ferry, Tanker, Icebreaker, Car Carrier, Container Ship, Cruise Liner: each
its own shape and size (2 to 15 containers), a hull paint, a funnel mark and a name he taps through (24 names, each said). A ship he buys
sails next; in the Ships tab he picks which of his sails next, or none (a visitor).

**Harbours and the Sea Chart.** Twenty-four named harbours, sailed to in order, each sending back its own crate (a decoration, a container
colour, a stripe or a company mark, never sold). One that needs a piece waits (🔒 and the piece on the chart; tapping it says what to
build), and the next is sailed to, so he's never stuck (tested). His flag wall, his bests, the tonnage and his Trophies are on the chart.

**Show off: "Watch it run" (`port/WatchScreen.tsx`).** His port working by itself: his ships (up to six, and a visitor) coming in to their
berths one after another while his cranes' trolleys run to and fro, then going out again; the train and the lorries carry containers
away. Nothing is paid or used.

### Rewards that never run out

The guide's three layers:

1. **The endless layer** (`port/sea.ts`, all seeded: the same on a reload). **Visiting ships**: every go without one of his own ships
   loads a ship generated from the go's number: its kind, its length and height (growing a stack about every eight goes and a tier about
   every twenty, as far as his crane reaches, so bigger ships arrive as his cranes get better), its colours, funnel mark and two-word name
   (each word a clip). **The sea chart never ends**: past the 24 named harbours, chart harbours are generated from their number, each with
   a two-word name from clips (216 names, then numbered) and a flag made from parts (12 colours, 8 patterns, 16 symbols) for his flag wall.
   **Every fifth go brings a special crate**: 12 hand-made prizes (Shiny Gold Box, Treasure Chest, Mermaid Statue, Ferris Wheel ...), then
   numbered Lucky Containers made from parts, without end, never sold. **The tonnage counter**: every container loaded adds tonnes (20
   each, a little more with each again-and-again thing, up to 40), with a port rank at each milestone (Wooden Pier, Jetty 200, Little Port
   1,000, Port 3,000, Busy Port 7,000, Big Port 15,000, Mega Port 30,000, then Super Port 1, 2, 3 ... every 20,000, without end).
   **Containers made from parts** (14 colours with the crates, 8 stripes, 13 marks) make the yard different every go. Tested: 3,000 chart
   harbours, 3,000 special crates and 3,000 visitors with every crane, each the same twice; and 3,000 goes in a row, every one loadable to
   the end (the first 50 and every tenth actually played through by a scripted child, careful or clumsy).
2. **Things to buy again and again**: Another Berth (60, +10, flat at 120), Another Yard Block (30, +5, flat at 60), Another Warehouse (50,
   +10, flat at 100), More Rail (25, +5, flat at 50), Another Crane (80, +10, flat at 160). They open after Berth 10, the Container Yard,
   the Warehouse, the Rail Line and the Gantry Crane; each adds a tonne to every container loaded (up to 40) and is drawn up to a few.
3. **The fixed catalogue: 269 things.** 196 to buy (61 port pieces, 12 decorations, 4 cranes, 16 crane parts, 9 crane paints, 9 ships, 30
   hull paints, 24 funnel marks, 12 container colours, 7 stripes, 12 company marks; 7,598 Bolts in all), 24 harbours, their 24 crates and
   25 Trophies, plus the free starters.

**Measured with the scripted child** (`port/economy.test.ts`: every answer right first try, every Ship loaded, the cheapest new thing always
bought first, an again-and-again thing when nothing new is for sale):

- **Bolts a Round: 10.1** (a Round's 6 and its Ship's 4 to 6) over the first 300 Rounds. No Round and Ship pays more than 12, under Turbo
  Tally's 15.
- **The fixed catalogue lasts 742 Rounds** (every named harbour by Round 476, every Trophy by Round 742). At the guide's first guess of
  about 20 Rounds an hour that is about 37 hours; the tour measured a Round with two deliberate misses at 72 seconds and a go at the Crane
  at 22 seconds for the smallest ship, so a perfect child plays nearer 30 Rounds an hour early on, fewer as ships grow.
- **The longest gap between new things: 3 Rounds in the first 100** (7 in the first 300). His first purchase is in Round 1.
- After 2,000 Rounds something new is still on offer every Round (a new harbour and flag every go, a special crate every fifth, the
  again-and-again things), and no state reads "all done".
- The dearest thing, the Giant Gantry (380), is 37.7 Rounds of saving; eight things take more than 15 (Giant Gantry, Cruise Liner,
  Container Ship, Floating Crane, Deep-Water Quay, Twin Grab, Car Carrier; the Gantry Crane at 14.9 is just under). The twelve dearest are
  all cranes, parts, ships and pieces.

**Economy defaults, for the parent to confirm.** One Ship per Round, the first free; Ships don't expire, and one is used only when it sails
(leaving the Crane costs nothing). A Ship pays 2, plus 3 for a named harbour or 2 for a chart harbour, plus 1 for a new best: 4 to 6.
Prices up to 100 in ones, then whole tens to 400. Everything is kept; nothing is ever lost.

**Competition.** **None against a rival**, by the brief, so there is nothing to balance and no three-children win-rate test. His
**personal bests** are kept and cheered when beaten ("Tallest stack! New best!", "Quickest loading! New best!", one Bolt): the tallest
stack he has built on a ship, and his quickest loading of each size of ship (small, middle, big, giant), measured from his first touch to
the last container on. The time is never shown while he loads; there is no clock he can lose to. They are on the Sea Chart.

## Look

Port colours: sea-green water, rust-red and bright-blue containers, safety-yellow cranes and a concrete-grey quay, with the family look
(Bungee titles, Nunito, 4px black outlines, solid drop shadows) and **Andika for every word he reads**. The container is the signature
shape: the same box with ribs and a white plate in the questions (HTML) and on the quay (canvas). Icon: a crane's yellow grab holding one
rust-red container with "rab" on its side, over sea-green water, the boom across the top. Kept apart from Treasure Fleet (a pirate ship)
and Carrier Deck (aircraft at sea): he never steers a ship. Layout rules began as a copy of Jetway's stylesheet, renamed. This is a first
pass: pass 3 is the design pass (the Port's pieces are boxes with emoji; ships are drawn simply).

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection cargo-words`: 1,376 phrases in 1,330 clips in `public/cargo-words-voice/`
(17 MB). Every word on the tables is a clip, and **every syllable is a clip said alone** ("(rab)"), said as it sounds in its word: alone,
the voice reads "ti" as the letters T and I and "py" as P and Y, so each syllable is respelled by rule (`words/said.ts`: an open vowel says
its name, "tie"; consonant-le "tul"; final y "pee"; er/ir/ur "ur"; a closed syllable doubles its last letter where the voice would read
letters, "ell", "ick") and the rules' output is merged into `make_voice.py`'s said_as through `tools/cargo-words/said.ts`.

**Checked with speech-to-text.** Every word and syllable clip (about 610) was transcribed back with faster-whisper small.en. Words: all
heard right except "retell" (heard "retail") and "hopeful" ("helpful"): retell is now in Jenny's voice and hopeful is said "hope-ful", both
then heard right. Syllables: the rule outputs it heard as letters or another word were respelled (`FIXED` in `words/said.ts`: bas "baz",
en, cac "kack", et "it", thir "thuhr", gle "guhl", nal "nul", zle "zuhl", plas "plaz", dile "dial", mer "murr", num "numm" (Aria said
"number"), sal "sal!"). Aria's "(cat)" came out "Kate" (as every reading game found), "(mag)" "Meg", "(buck)" was heard as a swear word
and "(got)" as nothing at all, however written; those four are in Jenny's voice, then heard right. One word was taken out because its
syllable could not be recorded cleanly (*velvet*: "vel" came out "they'll"). Numbers to 100 are a clip each, prices past 100 whole tens
(`PRICE_TENS`, "You need about 140 more Bolts." as Turbo Tally).

Speech-to-text is a weak judge of a lone syllable (it writes "Tie" for "ti", "a" for "uh", "T" for "tee"), so these still need a person to
hear them: **(sal)** (heard "sow"), **(puz)** ("poos"), **(tic)** and **(tick)** ("take"), **(ket)** ("cat"), **(ab)** ("ebb"),
**(fin)** ("thin"), **(met)** ("net"), **(bot)** ("but"), **(hob)** ("hub"), **(nev)** ("nav"), **(fect)** ("fact"), **(pock)**
("POC"), **(thun)** ("fun"), and the four in Jenny's voice beside Aria's (a different voice in the middle of a word).

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `crane/sounds.ts`): the grab's clunk as it locks, the thud of a container set down, a bump
for the water or a full stack, a chime when a row reads a word, and five horns (toot, whistle, big horn, air horn, a tune).

## Save

`cargo-words-save`, version 1 (a version it doesn't know reads as a blank save), with `cargo-words-place` for the screen and the Round in
progress. The save keeps his learning, Bolts, the words of his last Rounds (their syllables go on the next ship), and the port: what he
owns (and his crates and special prizes), how many of each again-and-again thing, each ship's name, paint and mark, his crane and its
paint, lights and horn, the ship he sails next, his Goal, Ships left and goes done, the harbours visited and the next chart harbour, the
tonnes, his bests and his Trophies. Anything that doesn't read, or names a thing he doesn't own, reads as the fresh value. A reload during
a go at the Crane lands in the Port with the Ship unused.

## Open questions for the parent

1. Is "Cargo Words" the name?
2. Is dropping Bossy R's card-or-cord Level right (Dino Dig teaches ar and or), and is "fill the r container" a good new Level 1?
3. Split It Levels 1 and 2 do not say the word (he reads it); Level 3 says it slowly, a syllable at a time, as the brief asks. Should 1
   and 2 say it once at normal speed?
4. The unstressed syllables are said as they sound in their word (rock-"it", oc-"toe"-pus). Is that the way his school says them, or
   would he expect each syllable said "by the rule"?
5. Is one Ship per Round right, and are 4 to 6 Bolts a Ship right (`SHIP_BOLTS` and the rest in `port/port.ts`)?
6. Should Add-Ons also teach dis- (TEKS 2.2) or -ly?
7. Should the Port be drawn from above (the brief's wording) rather than from the front? Pass 1 drew it from the front, matching the
   Crane's side view.
8. The Crane's tap-a-container-to-go-there: does it make the drag pointless? The drag is kept (and the tour tries it), but a child may
   only ever tap.

## Words left out

- **Break argued over** (`ARGUED`): lemon, melon, every, family, different, seven, camel, hamburger, burger, surfer, morning, forest,
  lollipop, kitchen, dirty, shorten, holiday.
- **Sounds that break the rules or aren't met**: carrot, parrot (a not ar), zebra, panda, sofa, banana (final a says uh), tomato, piano,
  lizard, doctor, dollar, water, waffle, monkey, donkey, turkey, cookie, rooster, butterfly, strawberry, blueberry, pickle, castle, pencil,
  circus, bagel, elephant, dolphin, penguin, squirrel, wonderland, sunflower, cinema, armor, starlight, muscle, hammerhead, polish, cherry
  and berry (cher/ber say "chair"/"bear"), taco (ta says tah).
- **One syllable said two ways** (each syllable has one clip): open, even, acorn, maple, total, pony, salamander, armadillo.
- **Not nice or frightening**: goblin, bandit, monster, dragon, spider, turbo, fortress, pimple, sturdy (a rude word inside), peacock,
  bumblebee and hornet (a syllable alone sounds rude).
- **Couldn't be recorded cleanly**: velvet.
- Medal, metal and pedal sound like other words.

## Not done

- **Not run on a real iPad 9, an iPhone or in Safari/WebKit.** Checked in Chromium (Playwright) with `tools/cargo-words/tour.ts` at
  810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and at Level 3 (each a whole Round
  with deliberate first and second misses, a purchase, a go at the Crane to the ship sailing, the Sea Chart and "Watch it run"), plus a
  three-Round run and runs with only Split It open on both phone sizes. The tours found and fixed: ⬇ pressed while the trolley was still
  sliding never lowered; Split It's word stayed hidden under the lesson's containers after a miss; Split It's cuts overlapped on a phone
  (each letter is now at least 44px wide and Split It words are at most 7 letters); the sixth kind and the Add-Ons word buttons sat in
  the bottom band on a sideways phone; the Crane card's Go button too. What most needs checking on the device: the Crane's drag, tap and ⬇ on the iPad 9 (the brief's
  risk: "get it into his hands"), whether a tap-to-go makes the drag pointless, frame time with a full port in "Watch it run", the
  question screens' Andika at phone sizes.
- **The voice has not been listened to by a person.** Every word and syllable clip was transcribed back with faster-whisper small.en; see
  Voice for the syllables it still doubts, which the parent should hear first.
- **Breaks not checked word by word against a dictionary** this session; they follow MW's end-of-line breaks from memory and the
  structured-literacy rules (tested). Worth a pass with a dictionary.
- **The Port is drawn simply** (boxes with emoji, from the front); ships are one hull shape dressed per kind. Pass 3 is the design pass.
- **"Watch it run" letterboxes in portrait** (the port is wide); the design pass should frame it better.
- The again-and-again things only add a tonne per container and a few drawn copies once past their caps (as Jetway's).
- No Tune-Up for Split It, Read It, Bossy R or Add-Ons (they start at Level 1 when they open).
- The question screens are plain (pass 3).
