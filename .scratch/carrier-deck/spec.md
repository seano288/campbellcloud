# Spec: Carrier Deck (story problems within 100 and bar graphs; build an aircraft carrier and fly from it)

Status: built on 2026-11-23 (pass 1 of 3: build), playable at `/carrier-deck/` with a tile in **Learning Games** on the landing page, after
Jetway. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is still a
working name.

A new learning game on the family site, built the same way as Jetway (`src/jetway/`, `.scratch/jetway/spec.md`) for the same player (6 to
7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9), in the third batch, which steps up to early
second-grade work. Short mixed Rounds earn Bolts, spent on ship parts, aircraft, paints, flags and Fleet ships. Each Round also earns a
Mission: the catapult, a peaceful job flown with one finger, and a landing on a wire.

## Research: what it teaches, and where it starts

Started from the standards the brief named, in the manner of `.scratch/math-bots/research/first-grade-math.md`. Legend: **[V]** read in a
source this session, **[S]** search result or summary only, **[M]** from memory, not re-checked.

| Standard | What it asks | Where it is in Carrier Deck |
|---|---|---|
| CCSS 2.OA.A.1 | Use addition and subtraction within 100 to solve one- and two-step word problems: adding to, taking from, putting together, taking apart and comparing, with unknowns in all positions, using drawings and equations with a symbol for the unknown [S, cde.ca.gov; NWEA and Hillsborough unpackings] | **Deck Log** (result, change, start unknown), **How Many More** (compare), **Two Steps**, the bar picture and the number sentence in every lesson |
| CCSS Table 1 (problem types) | Add To / Take From (result, change, start unknown), Put Together / Take Apart (total, addend), Compare (difference, bigger, smaller; with "more" and "fewer") [M; the NWEA alignment says grade 2 expects every type, S] | One template or more for each cell: `stories/problems.ts` (`ONE_STEP`, `COMPARE`) |
| Two-step problems | "Identify what needs to be done first and connect an equation to that first step" (Hillsborough); two operations, the same or opposite (NY unpacking) [S] | **Two Steps**: add then add (to 20), add then take away, then any to 100; a Stretch that asks the middle question aloud first |
| CCSS 2.MD.D.10 | Draw a picture graph and a bar graph (with single-unit scale) for up to four categories; solve simple put-together, take-apart and compare problems from a bar graph [S, cde.ca.gov; SD unpacking] | **Mission Board** Level 1 (single-unit scale, read one bar) and the "how many more" and "in all" questions |
| TEKS 2.10(B) | Organize data with up to four categories in pictographs and bar graphs **with intervals of one or more** [S, shmoop, law.cornell.edu] | **Mission Board** Levels 2 and 3 (scales of twos, fives and tens) |
| TEKS 2.10(C), (D) | One-step problems from graphs with intervals of one; draw conclusions from a graph [S] | **Mission Board** "how many more", "in all" |
| TEKS 2.4(C) | Solve one-step and multi-step word problems within 1,000 [S] | **Deck Log**, **Two Steps** (within 100 here) |
| TEKS 2.4(D) | Generate and solve problem situations for a given number sentence [S] | **Which Sum** (the other way round: the number sentence for a given story) |

**Two findings that shaped the kinds (defaults):**

- **Scaled bar graphs are above CCSS grade 2.** 2.MD.D.10 says single-unit scale; scales of 2, 5 and 10 are CCSS 3.MD.B.3 [M], but TEKS
  2.10(B) allows "intervals of one or more". The brief's Levels 2 and 3 (twos, fives, tens, and halfway bars at Level 3) are kept, so
  Mission Board Level 3 is a stretch beyond Common Core grade 2. A short Meeting ("These numbers count by twos.") comes before the first
  scaled graph.
- **No key words.** As Bot Stories found (IES Rec 5, the Math Bots research), a story's words must never give the sum away: about half
  the stories that say "more" need taking away, about half that say "left" or "fewer" need adding. "Left" is used both ways on purpose
  ("How many are left?" and "12 helicopters left the ship").

**Where it starts.** Read in the code (`src/math-bots/numbers/problems.ts`, Bot Stories): its Level 3 asks start-unknown and
opposite-language compare within 20, and three addends. So Carrier Deck's Level 1 starts with two-digit numbers (round tens, then any
without carrying), and the opposite-language compare is its How Many More Level 3. Checked against Jetway's Levels (`src/jetway/sums/
problems.ts`): Jetway carries and borrows a ten within 100 at Level 2 and passes 100 only at Level 3, so **no story here needs a sum past
99 or more than one carried ten**; Deck Log Level 1 and Two Steps Level 2 Stretch 0 never carry at all, and Two Steps Level 1 stays within
20 (Math Bots' range).

## Kinds

Five kinds, three Levels each, with Stretch inside a Level. Which Sum is answered by tapping one of the number sentences (none is read
out: he reads numbers); the others on **two number wheels**, one for each digit, as Big Jumps does (copied, not imported). Every number is
from 2 to 99 (the sentences are plural), so two wheels always answer.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Deck Log** `one`: a one-step story | start | the end asked (`40 jets… 20 take off`): round tens at Stretch 0, then any numbers without carrying | the change asked (`32 on deck. Some land. Now 50.`), with some end-asked adding stories kept so "take away the two numbers" never becomes a rule; carrying from Stretch 1 | the start asked (`Some were on deck. 15 took off. Now 40 are left.`), with change-asked ones kept; numbers to 60 at Stretch 0 |
| **Which Sum** `pick`: tap the number sentence | start | two choices: `38 + 25 = ?` or `38 − 25 = ?` (result and total stories) | three choices, a sentence with a box (`38 + ? = 60`); start-asked stories at Stretch 2 | three choices; the story holds a number that is not needed, of another kind of thing ("6 sailors watched."), and one wrong choice uses it |
| **How Many More** `compare` | Deck Log L2 | "how many more", with two rows drawn (to 30, 60, then 99, no borrowing) | "how many fewer" (and some "more"), rows drawn at Stretch 0 and 1, then not | the tricky ones: "The big ship has 12 more sailors than the small ship. The big ship has 30." (and fewer/bigger, all four ways) |
| **Two Steps** `two` | Which Sum L2 | add, then add again, to 20; at Stretch 0 the middle question is asked aloud and answered first ("First, how many jets are on the deck?") | add then take away, or take away then add; to 50 without carrying at Stretch 0 | to 99, no hint: take away twice, "left the ship… came back", and both ships ("The small ship has 5 fewer. How many on both ships?") |
| **Mission Board** `board`: crates each of four squadrons carried | How Many More L2 | read one bar; the scale goes up in ones (to 6, 8, 10) | "how many more" between two bars; the scale goes up in twos, then fives | "how many in all" for two bars, then three; the scale goes up in twos, then tens, and a bar may end halfway between lines |

**Rules the tests enforce** (`stories/problems.test.ts`, 1,800 generated questions of each kind; `said.test.ts`; `stories/teach.test.ts`):

- Every question has exactly one right answer, never below zero and never over 99; every number shown is from 2 to 99.
- A story's words never give the sum away: of the stories that say "more", the share solved by adding is between 30% and 70%; the same for
  "left" or "fewer"; and every kind with such words has both ways.
- Every number that is needed is said and shown, and only those; only Which Sum Level 3 says one more, and it is always another kind of
  thing (a story about jets has "sailors watched"), never after the question, and always just before a sentence that names the story's
  own thing (pass 2: "5 sailors watched. 71 more left after lunch." and "3 sailors watched. Now there are 82." read as being about the
  sailors).
- The answer is never a number the story says, so echoing one is never right.
- Two Steps are true two-step stories: the middle is never said, it is in the second number sentence, and no single step on two of the
  story's numbers gets the answer.
- Which Sum: exactly one choice fits; the wrong ones use only the story's numbers and are the real mistakes (the other operation, the two
  numbers added, the unneeded number used).
- Mission Board bars end on a marked line at Levels 1 and 2; only at Level 3, and only on a scale of twos or tens, a bar ends halfway.
- Story nouns are jets, helicopters, crates, sailors and boats; no story says kill, shoot, destroy, bomb, gun, enemy or attack.
- What is said is what is shown: every sentence is made of recorded pieces and says the numbers on the card, in order.

**Unlock order, Mastery, placement and Rounds (as Jetway).** 16 of the last 20 right first try, or the last 10 in a row; the first 30
questions of a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three
probes each of Deck Log and Which Sum at Level 2. Rounds are five answers, mixed, never the same kind twice running while there's
another; about one in three (and always the one after a miss) is easier and doesn't count; a miss comes back later as a new question
with no Mastery credit. A Round resumes after a reload. Taps wait until the story has been said once (the brief's risk): while they wait
the answers are dimmed and a tap gives a soft "nope" sound (default, pass 2; "Listen to the whole story first." is recorded but not said,
since it would cut the story off). 🔊 says the story again from the top at any time.

## Teaching a miss

Never a red X. The first miss gets one line about the mistake he made, if it was a real one ("Do more come, or do some go?" for the other
operation; "That number is in the story. What does the story ask?" for an echo; "That is only the first step!"; "Go straight across from
the top of the bar."), then the story acted out, and "Try again!":

- **Deck Log:** the story plays again on the deck, a sentence at a time, lit on the story card as it is said, with counters in rows of
  ten: blue for what was there, orange arriving for what came, faded and leaving for what went, a dashed box for what we don't know yet.
  When the start is the unknown, the action runs backwards ("Go backwards."). It ends with the number sentence in the story's order
  ("Here is the number sentence." `? − 15 = 40`).
- **Which Sum:** each sentence of the story lights the part of the number sentence it stands for.
- **How Many More:** the two rows pair off and the ones without a partner glow: "These have no partner." (as Bot Stories).
- **Two Steps:** the first two sentences acted out, and the first step's number sentence with its answer ("First step. That makes 37.").
- **Mission Board:** a line runs from the top of the bar across to the scale, and the scale is counted by its step ("2, 4, 6… Halfway
  between 8 and 10").

The second miss (or the first when he has been missing a lot, or 🔎) gets the **fuller lesson with the bar picture**, one step at a time,
each waiting on the big arrow: "This bar is all of them." → "These are the two parts." → "This part is missing. Take away to find it."
(or "We want all of them. Add the parts.") → the number sentence and "That makes 28." For compare: "The big one is the long bar. The small
one is the short bar. This is the extra part." Two Steps: "First step… That makes 37. Second step… That makes 52." The answer then glows;
his wheels keep his own number to fix. Tested (`stories/teach.test.ts`): every fuller lesson waits on the arrow and ends with the right
answer glowing; the deck at the end holds the story's whole; the bar picture has exactly one empty part and its sentence finds the answer.

## The reward: the Carrier, the Mission, the Fleet and the Voyage

**The loop.** A finished Round earns Bolts and one Mission (🛫). Bolts buy ship parts, aircraft and the rest. A Mission he has not flown
opens the next and puts its patch on his wall. He starts with one free Mission, so he sees the reward before his first purchase. Flat 2D
canvas, no 3D or physics library, no new dependencies.

**The Carrier (`ship/`, `art/ship.ts`).** From the side on the sea (with his aircraft parked and his Fleet behind), from above (catapult
tracks, wires, lifts, the angled deck, the markings, his aircraft), or cut away (the hangar deck with his aircraft, and the rooms below lit
as he builds them). It starts as a short hull (three sections) with one catapult and two wires. Every part has a fixed place. The screen
has the big **Fly** button (with his Missions and the next Mission's patch), the **Goal** (a bar filling toward what he's saving for),
👀 **Watch**, 🗺️ **Chart**, the ship's name (12, each said, tapped through) and the tray: Ship, Air Wing (tap one to fly it; its number,
1 to 99), Paint, Tails, Flags (hull colour, flag, deck markings), Fleet, Crew. Tapping a thing says its name and price.

**Parts matter** (`ship/ship.ts`, `mission/setup.ts`, tested in `mission/sim.test.ts`):

| Part | What it changes |
|---|---|
| Ship Section 1–8, Another Ship Section | a longer deck; bigger aircraft need it (the Seaplane 1 section, Twin-Rotor and Display Jet 2, Storm-Watch Plane and Tiltrotor 3, Cargo Plane and Water Bomber 4, Radar Plane 5). One he owns but can't fly yet says "This aircraft needs a longer deck!" |
| Catapult 2–4 | another aircraft launches beside him and flies in formation (wingmen) |
| Landing Wire 3, 4 | the landing zone is longer: more room above the wire he aims for (tested: fewer go-rounds for the clumsy child) |
| Deck Lift 1, Hangar Deck, Hangar Bay 1–4, Another Hangar Bay | how many aircraft he can own (3, then +2 for the hangar deck and each bay: all 12 fit); more bays add aircraft to "Watch the deck" |
| Deck Lights | night Missions (the hand-made night ones wait for them; generated night ones are flown at dusk without them) |
| Mirror Lights, Angled Deck | the Angled Deck catches a little past the last wire before he must go round |
| Weather Station | gusts are half as strong |
| Ski Jump | every launch gets a boost |
| Island, Bridge, masts, radars, rooms, boats, anchors… | drawn on the ship (side, top, cutaway); the island and lifts are needed by others |

**The Air Wing.** Twelve aircraft, each drawn in code from the side (`art/aircraft.ts`), each with a paint (30), a tail art (24) and a
number: the Trainer Jet (free), Rescue Helicopter, Weather Drone, Seaplane, Twin-Rotor Helicopter, Storm-Watch Plane, Cargo Plane, Water
Bomber, Radar Plane, Display Jet (coloured smoke), Tiltrotor, Jump Jet. Each Mission's job suits some of them; if he owns one that suits it
and can fly it, it goes ("This aircraft suits the job!"), and the suited aircraft earns a star. Helicopters, the Jump Jet and the
Tiltrotor hover, so they can winch; any other aircraft on a rescue drops a raft kit instead.

**The Mission (`mission/`, about a minute: 37 seconds in the browser tour, 30 to 95 with the scripted children).** On the card: its name
and patch, the place, the job, the aircraft that goes, his best on it, a prize.

1. **The catapult:** he holds the big green button (or a finger anywhere) and the gauge fills; letting go launches. Any launch flies; a
   weak one dips and climbs away. Never pressed, the catapult fires by itself after 7 seconds. A helicopter lifts off the same way.
2. **The job, one finger:** a held finger sets how high he flies. Rings (the Display Jet trails smoke), a whale, dolphins, a turtle or a
   ferry to photograph from low down, lost boats to find from low down, storm clouds to fly into, crates to drop on islands (the **Drop**
   button; or the crate drops itself at the last moment, a little long), or rafts to winch up (the aircraft hovers by itself; holding the
   finger low lowers the winch, and after 4 seconds it lowers itself). Gusts only wobble. Nobody is in danger: the raft waits.
3. **Home:** "Head home!" The carrier has sailed to meet him. "Follow the landing lights down!" With no finger the aircraft drifts onto
   the lights itself, a little high. Crossing the stern, how high he is above the lights' end picks the wire. Too high misses them all:
   "Too high! Go round!", and the third pass lands itself ("The deck crew will bring you in."). "You caught wire 2! Good landing!"

**It cannot be failed** (`mission/sim.ts`, `sim.test.ts`, `ship/gen.test.ts`): three scripted children (doing nothing, clumsy, skilled)
fly every job, with 2 to 4 wires, hovering and not, on short and long decks: every Mission ends on the deck in under 150 seconds, never
below the sea. The skilled child launches at full, gets everything and catches the wire he aims for first time; doing nothing still
launches, does the job well enough and lands first time a wire long.

**The landing's tuning, in one table** (`TUNING` in `mission/sim.ts`, for the iPad 9): `perWire` (22 units of height above the lights'
end per wire: the zone's size), `drift` (14: no finger lands a wire long), `angledSpare` (0.7 wire), the lights' length and top, the
approach speed. Measured with the clumsy child (100 Missions each): go-rounds 42 with two wires, 19 with four, 11 with four and the Angled
Deck; the wire he aimed for 19 to 42% of the time.

**The Voyage and the Chart (`ship/missions.ts`, `ship/ChartScreen.tsx`).** Thirty-six hand-made Missions, six at each of six places
(Home Port, the Islands, the Ice, the Reef, the Storm Sea, the Far Harbor), flown in order, each with a patch; one that needs the Deck
Lights waits (🔒💡) and the next is open meanwhile. The Chart shows the ports reached and two ahead, the Missions at the place he's at (a
flown one can be picked to fly again, with his best landing), his patches, his logbook (rank and jersey stripes) and 33 medals.

**The Fleet.** Eight ships to buy (Tug, Rescue Cutter, Supply Ship, Lighthouse Tender, Research Ship, Fuel Tanker, Hospital Ship,
Icebreaker), then the Yard (below). They sail beside him on the Carrier screen, in the Mission and in "Watch the deck".

**Show off: "Watch the deck" (`watch/`).** His carrier working by itself: his aircraft (up to six, more with more bays) take turns up the
lift, to the catapult, off the bow, away, back onto a wire and down the lift; his Fleet sails behind. Tested: only one on the catapult at
a time, none below the deck except on the lift. Nothing is paid or used.

### Rewards that never run out

The guide's three layers:

1. **The endless layer.** **Radio calls**: after the hand-made Missions, every Mission is generated from its number (seeded, the same on a
   reload): the job (each run of six has every job once, never the same twice running), what it's about, how much to do (4 rising to 9),
   the wind (rising to a ceiling of 0.8: wind only wobbles), the sea, day or night, which aircraft suits it. **Every fifth brings a prize
   never sold**: a patch, then a deck marking, in turn, made from a picture and colours, numbered, without end. **The Voyage never ends**:
   every six Missions reach a new port, each chart generated from its number with its own sea and sky colours, icon and a name from two
   words (240 names before one comes round). **The Yard**: always a new ship, made from parts (6 hulls × 6 deckhouses × 5 masts × 3
   funnels × 12 colours × 12 stripes = 77,760 different ships before one comes round). **The logbook**: every Mission adds 40 to 65
   minutes; ranks Cadet, Deckhand, Flyer, Pilot, Ace, Flight Leader, Wing Leader, Captain, Commodore, Admiral, then Fleet Admiral 1, 2, 3
   … every 40 hours, without end, with a jersey stripe each. Tested (`ship/gen.test.ts`): 3,000 generated Missions, each the same twice,
   flown to the end by the child who does nothing (and every tenth by the clumsy and the skilled child); a unique prize every fifth, none
   for sale; 600 charts; 5,000 Yard ships all different.
2. **Things to buy again and again:** Another Ship Section (60, +5 each, flat at 100; up to 8 more), Another Hangar Bay (50, +5, flat at
   90; up to 8) and the Yard's New Ship (60, +5, flat at 120; without end). They open after Ship Section 8, Hangar Bay 4 and the Tug.
3. **The fixed catalogue: 264 named things.** 195 to buy (61 ship parts, 11 aircraft, 29 paints, 23 tails, 12 hull colours, 19 flags, 17
   deck markings, 8 Fleet ships, 15 crew and deck vehicles; 7,600 Bolts in all), 36 hand-made Missions (each a patch) and 33 medals, plus
   the 6 free starters.

**Measured with the scripted child** (`ship/economy.test.ts`: every answer right first try, every Mission flown with three stars and the
wire he aimed for, the cheapest new thing always bought first):

- **Bolts a Round: 13.0** (a Round's 6 and its Mission's 7) over the first 300 Rounds. No Round and Mission pays more than 13.
- **The fixed catalogue lasts 585 Rounds** (every hand-made Mission flown by Round 235, waiting on the Deck Lights he buys late; every
  medal by Round 721). At the guide's first guess of about 20 Rounds an hour that is about 29 hours; the tour measured a Round with two
  deliberate misses at about 115 seconds and a Mission at about 37, so a perfect child plays nearer 25 to 30 Rounds an hour.
- **The longest gap between new things to buy: 2 Rounds in the first 100** (7 in the first 300, 30 in the first 1,000, while saving for
  the dearest aircraft; a new Mission, patch or port comes every Round all the same). His first purchase is in Round 1.
- After 2,000 Rounds something new is on offer every Round (a new radio call every Mission, the Yard), and no state reads "all done".
- **Pass 2 rechecked these.** The 13.0 is honest: a Round pays `boltsFor` (5 first-try answers + 1), and in the browser a first Mission
  flown well paid 7, flown by doing nothing 4 to 5, mashed 6. A Mission pays only when one was earned by a Round (`settleMission`
  refuses with none left), so Missions can't be farmed; flying a hand-made one again pays at most 6 (no new-Mission 2, a best only once
  beaten). Counting a plain generated radio call as nothing, the scripted child still meets a patch, prize, port, rank, medal or purchase
  at least every 3 Rounds through Round 300 (every 4 to Round 2,000); the longest run without a purchase is 6 Rounds in the first 300.
  With everything fixed owned and 5,000 Bolts (tried in the browser): the Goal is the Yard's next ship (flat at 120), every Mission is a
  new radio call with a prize every fifth, a new port every six, a rank every 40 hours.
- The dearest thing, the Jump Jet (380), is 29 Rounds of saving; seven things take more than 15 (Jump Jet, Tiltrotor, Display Jet, Radar
  Plane, Water Bomber, Angled Deck, Cargo Plane). The fifteen dearest are all aircraft, ship parts and Fleet ships.

**Economy defaults, for the parent to confirm.** One Mission per Round, the first free; Missions don't expire, and one is used only on the
deck at the end (leaving with 🏠 twice costs nothing). A Mission pays 2, plus 1 for two stars or 2 for three, plus 2 for a new Mission,
plus 1 for the wire he aimed for, plus 1 for a new best on a Mission flown before: 2 to 7. Prices up to 100 in ones, then whole tens to
400. Everything is kept; nothing is ever lost.

**Competition.** The Air Show rival is **not built** (optional in the brief; see Not done). His **best landing** is shown on every return
(his best on that Mission, or his count of perfect landings), and "New best!" is cheered and pays a Bolt.

## Look

Sea colours: deep navy water, a grey ship, a dark deck with yellow and white markings, and the deck crew's jersey colours (yellow, green,
red, purple, blue) for buttons and badges, with the family look (Bungee titles, Nunito reading, 4px black outlines, solid drop shadows).
Numbers on the story card are yellow-on-black signs. Everything is drawn in code (the carrier, twelve aircraft, Fleet ships, the Mission's
sea and sky by place, islands and rafts); emoji stand in for small icons. The aircraft on the deck is the one he flies. Play is the
catapult's green light on a flight deck. Icon: the carrier's bow from the side with a yellow jet lifting off it, over navy water. Apart
from Treasure Fleet (a sailing ship and maps) and Jetway (an airport on land): the catapult and the wire make it. This is a first pass;
pass 3 is the design pass.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection carrier-deck`: 747 clips in `public/carrier-deck-voice/` (10.8 MB). Numbers to
100 are a clip each; prices past 100 use whole-ten clips (`PRICE_TENS`, "You need about 140 more Bolts." as Turbo Tally). A story is said
one sentence at a time, each sentence a chain of pieces round its numbers ("40", "jets are on the deck.", "12", "more jets land."), as Bot
Stories does. Before the rest were recorded, one chained story of each shape (end, start and opposite-language compare) was recorded,
trimmed and chained as the game does, and transcribed back with faster-whisper small.en: each was heard word for word. Every item,
aircraft, Mission, call, place, port word, Yard kind, ship name, rank and medal is a clip.

Then every clip but the bare numbers was transcribed back (small.en). 36 of 749 were doubted; about half were only spelling ("Gray",
"1st", "100", "witch some star", "Bae", "purl"). The real ones were fixed: "Hull" came back "hole" or "whole" however it was said (as Deep
Light found), so the hull items are named **Ship Section 1–8** and **<colour> Ship**; "Galley", "Bow Anchor", "Signal Mast" ("masked"),
"Gull" ("go") and "Shore" ("sure") were renamed Kitchen, Front Anchor, Radio Mast, Seagull and Beach; "Foghorn", "Grape Purple" and
"carry than" are said with a breath (`COLLECTION_SPEECH['carrier-deck']` in `tools/make_voice.py`). The 31 re-recorded clips were all heard
as written. Still doubted, and for the parent to hear: "Ferry" (heard "Fairy": likely the merger, not the voice), "Medals" ("Metals"; the
word is never said alone, only in names), "boats sail out." alone (heard right in its chain), "Reef" alone (heard right after "Coral").

**Pass 2** transcribed every clip of one or two words back with small.en (518, which pass 1 skipped for the bare numbers): every number
0 to 100 and every price ten to 400 was heard right. Four were re-recorded so that small.en and base.en both hear them as written:
"Reef" (heard "wreath"; now said "Reef!"), "Fleet Admiral" ("Flee Admiral"; "Fleet Admiral!"), "Angled Deck" ("Angle deck"; with a
breath) and "Checkered Deck" ("Check her deck"; with a breath). The rest it doubted are spellings of the same sound ("Grey/Gray",
"Tail/Tale", "Plain/Plane", "Sea/See", "Tow/Toe", "Bay/Bae", "Pearl/purl", "First/1st", "Hundred/100"). Every clip's speech length fits
its text (single words 0.5 to 0.65 s; the longest line 3.95 s; none silent). In the browser, 53 chained clips over a Round played in order
with no overlap, no clip 404s, and in development a line with no clip is now an error on the console (`voice.tsx`), which found the
Chart saying a generated port's whole name (no clip: silent); it now says its two words, as the Mission's results do.

**Size.** 747 clips, 10.8 MB; the game's own precache is 10.4 MB in 761 entries (Rover Code 7.0, Jetway 9.6, Sight Squad 28.5). Each game
has its own service worker, so this is the figure for the installed game; summed over every game the site's precaches are about 249 MB
(238.6 before Carrier Deck). The clips carry about a second of recorded silence each (trimmed as they play), so re-encoding them trimmed
would roughly halve the voice; not done (no ffmpeg here).

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `mission/sounds.ts`, Jetway's pattern copied): an engine that rises with the catapult (a jet
hisses, a propeller or rotor buzzes), the catapult's whoosh, a ping for each ring or find, the crate's splash, the winch, a gust, the
landing lights' ping, and the hook catching the wire (with a chime for the wire he aimed for), and the crowd at the end.

## Save

`carrier-deck-save`, version 1 (a version it doesn't know reads as a blank save), with `carrier-deck-place` for the screen and the Round
in progress. The ship keeps what he owns (and his prizes), the again-and-again counts, the Yard ships, each aircraft's paint, tail and
number, the aircraft he flies, the hull colour, flag, deck marking and ship name, his Goal, Missions left and flown, each hand-made
Mission's record, the last generated Mission, the picked Mission, his logbook minutes, perfect landings, jobs and medals. Anything that
doesn't read, or names a thing he doesn't own, reads as the fresh value. A reload during a Mission lands on the Carrier with the Mission
unused.

## Open questions for the parent

1. Is "Carrier Deck" the name?
2. Mission Board Levels 2 and 3 use scales of twos, fives and tens (TEKS 2.10(B)); Common Core grade 2 asks only single-unit scales. Keep
   them, or keep Level 3 to ones and twos?
3. Are the two number wheels quick enough on the iPad 9, or should stories answer from three choices (the brief's fallback)?
4. Two Steps Level 1 Stretch 0 asks the middle question aloud and he answers it first. Is that the right help, or should it only be said?
5. Is one Mission per Round right, and are 2 to 7 Bolts a Mission right? (`MISSION_BOLTS` and the rest in `ship/ship.ts`.)
6. The landing: is aiming for the first wire (the second of four) clear enough, and is the wire zone (`TUNING.perWire`) fair on the iPad?
7. Should the Air Show rival (scored beside two or three rival pilots) be added, or is his best landing enough?
8. Hand-made night Missions wait for the Deck Lights (65 Bolts); should the Deck Lights be cheaper so the first place finishes sooner?

## Not done

- **Not run on a real iPad 9, an iPhone or in Safari/WebKit.** Checked in Chromium (Playwright) with `tools/carrier-deck/tour.ts` at
  810×1080, 1080×810, 390×844 and 844×390, each on a new save and on saves with every kind open at Level 2 and at Level 3 (12 runs, the
  portrait Level runs with two Rounds): every kind met, a deliberate first and second miss in each kind met (the fuller lesson walked
  through with the arrow), a purchase, a Mission flown to the wire, the Chart and "Watch the deck"; no layout problems after two fixes
  (the results card on a sideways phone, the bar graph Meeting). Offline with `tools/carrier-deck/offline.ts` on the production build.
  `tools/carrier-deck/looks.ts` screenshots a built-up ship and a drop or winch Mission. What most needs checking on the device: holding the
  catapult button while the iPad's edge gestures are near; the one-finger height control and the wire zone's fairness; the Drop button's
  timing; the story card's size against the wheels; frame time in the Mission and on the Carrier screen with a long, fully built ship.
- **The Air Show rival is not built** (optional in the brief): no rival, no tuning table, no three-children win-rate test. His best
  landing is shown and cheered instead.
- **The voice has not been listened to by a person**; it was transcribed back by speech-to-text (Voice, above).
- Drawn simply; pass 3 is the design pass. Known rough spots: the Carrier's top view draws aircraft as plain silhouettes; the cutaway's rooms are emoji in boxes; the Chart shows only the ports
  reached and two ahead, not a drawn sea chart.
- Another Ship Section and Another Hangar Bay stop at 8 each; past them only the Yard's ships are bought again and again.
- No Tune-Up for How Many More, Two Steps or Mission Board (they start at Level 1 when they open).
