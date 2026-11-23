# Spec: Skyline (equal groups, rows and columns, the start of multiplying; build a city and drive in it)

Status: built on 2026-11-23 (pass 1 of 3: build), playable at `/skyline/` with a tile on the landing page. Every decision below is a
**default for the parent to confirm**. Not yet run on a real iPad. The name is a working name.

A new learning game on the family site, built the same way as Turbo Tally and Rover Code, for the same player (6 to 7, reads numbers
and short words, leans on the recorded voice, alone on an iPad 9). It is a step up: second-grade work that lays the ground for
multiplying. Short mixed Rounds earn Bolts and a Job. Bolts build his City plot by plot and floor by floor; Jobs are drives through it.

Research: `.scratch/skyline/research/second-grade-groups.md` (Common Core 2.OA.C.3, 2.OA.C.4, 2.G.A.2, 2.NBT.A.2, 3.OA.A.1 to A.3; TEKS 2.6A,
2.6B, 2.7A).

## Kinds

Six kinds, three Levels each, with Stretch inside a Level (bigger groups, more rows, a middle gap). Everything is a tap.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Equal Groups** `groups`: buses with people in their windows | start | "Do all the buses have the same number of people?" (Yes/No), "How many buses?", "How many people on each bus?" | "3 buses. 5 on each. How many people?" with the picture, totals to 30 | "4 groups of 5. How many in all?" with no picture (totals to 50); "Which picture shows 4 groups of 5?" (one bus different, a bus short, or one more on each) |
| **Windows** `array`: a building's front, windows in rows | start | "How many rows?", "How many windows in each row?" (up to 5 by 5) | "How many windows?" (to 5 by 10, totals to 50) | "Which adding sentence matches the building?" (`4 + 4 + 4`); the turn-around: "This building has 3 rows of 4. That one has 4 rows of 3. Do they have the same number of windows?" |
| **Odd or Even** `pair`: people pairing up for a ride | Equal Groups L2 | up to 10 people: "Does everyone get a partner?"; then "Is it odd or even?" with the picture | "Is 14 odd or even?" with no picture (1 to 20); "Which number is even?" (one of three) | "Which double makes 14?" (`7 + 7` among `6 + 6`, `8 + 8`); "14 people make two equal teams. How many on each team?" |
| **Count By** `count`: house numbers along a street | Windows L2 | by hundreds to 1,000; by tens from any number past 100 (`137, 147, 157`) | by fives past 100 to 200; a missing number in the middle | by threes and fours, each house showing its group of windows |
| **Share It** `share`: boxes shared fairly between trucks | Equal Groups L2 | share 6 to 12 between 2 trucks: he taps a truck to give it a box, then ✓; "How many on each truck?" | between 3 or 4 trucks | "12 boxes. 3 on each truck. How many trucks?" |
| **Times** `times`: the × sign | Windows L3 and Equal Groups L3 | "Which building shows 3 × 4?", said "3 rows of 4"; "Which one tells about this building?" (`3 × 4` among `3 + 4`, `3 × 5`) | twos, fives and tens as written facts: "3 × 5", said "3 times 5. 3 groups of 5. How many in all?" | threes and fours; the turn-around: "3 × 4 is the same as which?" (`4 × 3`) |

Decisions, against the brief's defaults:

- **Count By starts past Math Bots.** Math Bots' Skip Count (read in `src/math-bots/numbers/problems.ts`) counts by 10s, 5s and 2s to 120,
  with an offset start (3, 13, 23) at its Level 1. So Count By is hundreds to 1,000, tens from any number past 100 (to 200), fives past
  100, then threes and fours. The voice has every number to 200 and the hundreds to 1,000, and nothing Count By says is outside those.
- **Windows Level 1 stays within 5 by 5**, 2.OA.C.4's limit. Level 2 goes to 5 rows of 10 (the brief's totals-to-50 rule).
- **Odd or Even stays within 20** (CCSS) though one older TEKS text goes to 40.
- **"Columns" is never said to him.** Windows Level 1 asks "How many windows in each row?", because a row is the line that goes across
  and that is the one word he needs. The × sign at Level 1 is said "rows of".
- **Share It's dealing** is a tap per box on a truck (no dragging), with ↺ to start again and ✓ when the pile is empty. A truck that gets
  more than another is a miss, taught by dealing them out fairly.
- **Two Meetings**, as Turbo Tally's: before the first Times question, "Here is a new sign. It is a short way to write rows of. 3 rows of
  4", with the building counted "4. 8. 12."; before the first written fact at Level 2, "This sign has a name. We say times. 3 times 4.
  3 groups of 4."

**Rules the tests enforce** (`src/skyline/math/problems.test.ts`, thousands of questions of every kind, Level and Stretch):

- Exactly one choice is right, in every kind (and a × card is never a different fact with the same total).
- Every array is a full rectangle, and rows are the lines that go across (`views.test.ts` checks the drawn windows too). A building of
  3 rows of 4 never appears beside a choice of 4 rows of 3 except in the turn-around question.
- Totals stay at 50 or less, and no group or row is bigger than 10.
- Share It always comes out even.
- Wrong choices are the real mistakes, each named: the two numbers added (always offered when it differs), one group too many or too few,
  the count of groups given for the total; for Count By, counting by ones, jumping twice, the wrong step, stopping where it was.
- The × sign is met before it is asked, is always said "rows of" or "groups of", and the word "times" is said only from Times Level 2
  (`learning.test.ts`, `voice.test.ts`).
- Odd or Even never asks about zero.

**Unlock order, Mastery, placement (as Turbo Tally).** Equal Groups and Windows open at the start; Odd or Even and Share It at Equal
Groups Level 2; Count By at Windows Level 2; Times once both Equal Groups and Windows reach Level 3. 16 of the last 20 right on the first
try, or the last 10 in a row; the first 30 questions of a kind use the quick rule (8 of 10, or 6 in a row). Levels never go down. The
first Rounds are a Tune-Up: three probes each of Equal Groups and Windows at Level 2.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and
always the one right after a miss, is easier and doesn't count. A miss comes back later as a new question with no Mastery credit. Bolts:
one per answer right on the first try, plus one for finishing (shared `boltsFor`). A Round resumes after a reload (shared `place`).

## Teaching a miss

Never a red X. The first miss gets one line and a cue on the picture; the second (or the first when he's missing a lot, or 🔎) the whole
lesson (`math/teach.ts`):

- **Equal Groups and Windows:** the buses or rows light one at a time while the count goes up by that number: "3. 6. 9." On the fuller
  lesson he taps each bus or row himself to count it (a 👆 pulses; after 5 seconds it goes on by itself), then "9 people in all!".
- **Odd or Even:** the people pair off two by two into ride seats. "One is left alone. So it is odd." / "Everyone has a partner. So it is
  even." Doubles: "7 and 7 make 14."
- **Count By:** the house numbers land on a number line, each jump drawn with its +10, and the run is said.
- **Share It:** the boxes are dealt one at a time to each truck, round and round. "Every truck has the same. 4 on each truck." For "how
  many trucks", the trucks fill one at a time and are counted.
- **Times:** the fact turns back into its building, counted row by row ("3 times 4 is a short way to say 3 rows of 4"). The turn-around
  tips the building on its side: "The windows stay the same."

## The reward: the City, the Job and the Districts

**The loop.** A finished Round earns Bolts and one Job (he starts with one, so he sees the reward first). Bolts buy buildings, floors,
land, vehicles, paint, street things and building parts. Jobs open new Districts.

**The City** (`city/`), from above and a little to the south, so every building shows its roof and its front, a row of windows per
floor: his skyline is made of arrays he can count. Streets are a fixed grid: every Block is the same size with a street all round it,
cut into small, wide and large Plots, so every plot faces a street and every Job can be driven. He taps a plot: an empty one shows what he
owns that fits (standing it there is free); a built one can be moved (↔️, then tap another plot of the same size: they swap), swapped
(🔁) or cleared (🧹), and a tower gets ＋🏢 another floor. Nothing is ever taken away. He drags to look round, ➕ ➖ zoom. The City lives by
itself: people walk the pavements (up to 24), cars run the streets (up to 8), and day turns to night every couple of minutes with the
windows lighting up (🌙 / ☀️ switches it). 🚁 Fly over takes a slow helicopter pass across the whole city; 🏙️ shows the **Skyline**, his
buildings side by side from the street at their real heights (the 40 nearest), the tallest tower flying the flag.

**Buildings matter.** The Bus Depot (his from the start) adds bus Jobs; the Taxi Rank, Post Office, Fire Station, Bin Depot, Hospital,
Tram Depot, Sweeper Shed, Ice Cream Parlour and Helipad each add their own Job and its vehicle. Houses, flats and every floor add people;
shops and parks give them somewhere to go.

**The Job** (`job/`, 2D canvas, from above, about a minute). He drives through the city he built. He holds a finger where he wants to go
and the vehicle finds its way there along the streets: it follows the street it's on to the right crossing, turns, and carries on,
rounding each corner by easing toward the next bend (`job/sim.ts`, Math Bots' held-finger pattern, copied). A quick tap sends it to that
spot. This answers the brief's worry that a held finger on right-angle streets would feel stiff: he never steers into a kerb at a corner;
he points at the star and the bus goes there by the streets. The next stop is a big star with its people waiting; off screen, a yellow
arrow at the edge points to it. Reaching a stop brakes the vehicle, the people walk on (or the parcels go), and the count is said as it
goes up in equal groups: "3. 6. 9." There's no clock; kerbs and other cars only bounce him (the other cars wait for him and are nudged
out of his way, so he's never held up), and every Job ends with "Job done!", the total and the Bolts. A helicopter flies straight over
the rooftops.

**Districts.** Six, each a new piece of land with its own look and special buildings: Old Town (start), Downtown (4 Jobs), Riverside (12),
the Harbour (25), the Hill (45) and the Beach (70). Each one's first Block is his the moment it opens.

### Never running out

The three layers the build guide asks for:

1. **The endless layer, made by the game.**
   - **Land without end.** After the Districts' Blocks he can always buy the next Block; the city grows east one column of four Blocks at
     a time, for ever (`grid.ts`). Only the Blocks on screen are drawn (each into its own image, kept until it changes, at most 40 kept);
     far out, Blocks are drawn as plain shapes.
   - **Buildings made from parts** (`gen.ts`). The **fresh street** is four buildings, each made from a seed: a kind (House, Flats, Shop,
     Café, Bakery, Bookshop, Diner, Office, Tower, Hotel, Sweet Shop, Flower Shop, Bike Shop, Studio, Gallery, Cake Shop), a colour, a
     window style, a roof, a trim, a sign and a number of floors. The same four come back after a reload; buying one brings the next. He
     can also design one himself (✏️): walls, roof, windows and sign from the parts he owns, 1 to 6 floors, small or wide, for 15 Bolts.
   - **Jobs made from his own city** (`job/plan.ts`). The 40 named Jobs (below) use his own streets in their District; after them every
     Job is numbered and made from his whole city: stops at his own houses, shops, parks or rooftops depending on the Job, a route that goes
     round rather than back and forth, more stops in a bigger city (4 to 7), and the same route for the same Job after a reload.
   - **The population and its ranks**: Village, Town, City, Big City, Huge City, Mega City, then Super City 1, 2, 3 and on without end
     (one more every 1,500 people).
2. **Things bought again and again.** Another Block of land (20 Bolts, then 5 more each time, flat at 60); another floor on any tower
   (5 Bolts up to 16, flat from the 14th floor, up to 30 floors); another building off the fresh street (16 to 48); another design of his
   own (15).
3. **The fixed catalogue: 306 named things** (`catalog.ts`): 80 buildings (houses, shops, a school, fire station, hospital, library,
   cinema, park, pond, stadium, market, train station, bridge, clock tower, Ferris wheel, roller coaster, castle, lighthouse, aquarium...),
   27 vehicles (12 that come with the building that adds their Job, 15 to buy, each faster, carrying more at each stop, or flying), 30
   paints for his vehicles, 40 street things (trees, lamps, fountains, statues, benches; they stand along his streets by themselves), 50
   building parts (14 roofs, 12 window styles, 12 walls, 12 signs, for the fresh street and his designs), 6 Districts, 40 named Jobs and 33
   trophies (population, Jobs done, tallest tower, land, a badge for each kind of Job, his best Job, all six Districts, things built).
   Kinds that change how the reward plays: every Job building, every vehicle, every District.

**Prices.** Up to 100 in ones, then whole tens up to 400 (Turbo Tally's `PRICE_TENS` pattern; "You need about 140 more Bolts" for a gap that
isn't a whole ten). The dearest is the Stadium at 360. Every District has at least five things at 10 Bolts or less beside its dear ones.
The Goal chip (top) is the cheapest thing for sale he hasn't got, or the one he tried to buy and couldn't afford; its bar fills as he saves.

**Payouts.** A Round pays one Bolt per first-try answer and one for finishing (at most 6). A Job pays 3 Bolts, and 5 the first time he does
a named Job. That's all: no other way to earn Bolts.

### How long it lasts (measured)

`city/economy.test.ts` plays a scripted child who answers everything right first try, does every Job and always buys the cheapest new
thing in the catalogue as soon as he can (the fastest anyone can empty it), then spends on the endless layer:

- **Bolts a Round: 9.24** (6 for a perfect Round, 3 to 5 for its Job), averaged over the first 300 Rounds.
- **Rounds to finish the fixed catalogue: 702** (the 209 things for sale cost 6,395 Bolts; the last named Job is done long before).
  At about 20 Rounds an hour that's about 35 hours of play; the guide's floor is 300 Rounds.
- **Longest gap between new things: 2 Rounds** in the first 100 (the first purchase comes in Round 1). Later, once only the dear things
  are left, up to 40 Rounds between catalogue purchases for that scripted child, but every Round still brings a new Job made from his city,
  and floors, land and the fresh street are always on offer.
- Nothing takes more than 40 Rounds of saving (the Stadium, 360, is 39); six things take more than 15 (Sky Needle 300, Castle 250, Ferris
  Wheel 200, Water Park 160, Roller Coaster 340, Stadium 360).
- After 2,000 Rounds there is still something new every Round (a new Job) and something to buy (land, a floor, the fresh street).

`city/gen.test.ts` makes 5,000 buildings from parts and 3,000 Blocks and checks them, and drives every named Job in eleven cities of every
size (one with eight bare Blocks past the Districts) plus 1,200 numbered Jobs to the end with a scripted finger held on the next stop: every one finishes, in a median 36 seconds (longest
56) for that perfect finger. A child takes longer. In the browser tour (a Round with two deliberate misses, then a Job driven by a
held mouse) a Round took 60 to 100 seconds and the first Job 21 to 35 seconds (the first Job is short: his city is one Block); a Round and
its Job together come to about 2 minutes, so the guide's guess of about 20 Rounds an hour holds.

There's no rival, so the guide's competition balancing doesn't apply. His bests are shown and cheered: most in one Job ("New best!"), his
tallest tower (the flag, "This is your tallest tower!") and his biggest population (trophies and ranks).

## Look

A bright toy city at dusk: warm brick, glass blue, park green and road grey, with yellow lane lines, on a dusk-blue page. Bungee titles,
Nunito reading, 4px black outlines, solid chunky shadows. Everything is drawn in code (`art/draw.ts`): buildings from their parts (floors
of windows, roofs, signs), vehicles, people. The same drawing makes the City, the Skyline and the shop's pictures. Icon: three towers of
different heights at dusk with their windows lit in rows and a flag on the tallest, over a yellow-lined street.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection skyline` (edge-tts), 804 clips (11 MB) in `public/skyline-voice/`, trimmed as
they decode and chained ("3", "rows of", "4"; "It costs", "12", "Bolts."). Every number to 200 and the hundreds to 1,000 are clips. Answer
buttons are never read out; every question, lesson, purchase and Job line is.

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `job/sounds.ts`): a clink per tap, a count tick per group lit, the shared right and wrong
sounds; in the Job a motor (a rotor for the helicopter) that rises with his speed, a ding at each stop, a soft bump.

## Save

`skyline-save`, version 1 (a version it doesn't know reads as a blank save), and `skyline-place` for the screen and the Round in progress.
A Job isn't a place: a reload during one lands in the City, and the Job isn't used until it's finished.

## Open questions for the parent

1. Is "Skyline" the name?
2. Is one Job per Round right? Should a Job pay Bolts at all (3, or 5 the first time for a named Job), or only show the count?
3. The catalogue lasts the fastest possible child about 700 Rounds. Is that too long between the dear things late on (up to 40 Rounds)?
   Prices could come down a little; payouts shouldn't go up.
4. Does he know "column"? The game says "in each row" and never "column".
5. Count By's tens go to 200 and its hundreds to 1,000; does his class count past 200 by tens yet?
6. Times Level 2 and 3 are third-grade facts. If he stalls there, hold him on the pictures longer (the Levels can be slowed) rather than
   drilling facts.
7. Should the City's day and night run by itself (now about 100 seconds of day and 45 of night), or only on the 🌙 button?

## Checked

- `tools/skyline/tour.ts` plays a whole Round (a deliberate miss twice in the first two kinds, so both lessons run, tapping each row
  when the fuller lesson asks), buys the Bench, stands a house on a plot, opens the Skyline and the fly-over, then drives a Job to the
  end with a held finger. Run at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and
  Level 3 (12 runs, all clean: no page errors, no button off screen or under 44px). Across the runs every kind was missed and taught,
  and both × Meetings, the turn-around and Share It's dealing were played.
- `tools/skyline/city-sheet.ts` loads the scripted child's City after n Rounds and screenshots it by day, by night, zoomed out, the
  Skyline, the fly-over and a Job, and counts frames: 60 fps for the City and the Job in Chromium on a Mac (not an iPad).
- `tools/skyline/offline.ts`: on the production build, 804 clips precached, offline a Round starts, its question is said, a miss is
  taught aloud and the Round moves on.

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari/WebKit (the tour takes `TOUR_BROWSER=webkit`, not run).
- The driving feel (the street-following steering, the corner rounding, the camera) is tuned by simulation and screenshots, not by a
  child's hand. It most needs trying on the iPad.
- Frame rate on the iPad 9 is not measured. The City and the Job draw one cached image per Block on screen and cap people (24) and
  cars (8 in the City, 6 in a Job).
- The voice clips were not listened to one by one or checked with speech-to-text (Hook and Ladder's and Turbo Tally's builds did this).
- No Legendary or vault; no tracking of strong and weak facts.
- Building names in the shop are read, not drawn as signs; the fresh street's buildings are named by colour and kind.
