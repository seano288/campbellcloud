# Spec: Big Air (measuring length; build a stunt arena and jump a monster truck)

Status: built on 2026-11-25 (pass 1 of 3: build), playable at `/big-air/` with a tile in **Learning Games** on the landing page, after
Globe Hopper. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is still a
working name.

A new learning game on the family site, built the same way as Globe Hopper and Jetway (`src/globe-hopper/`, `src/jetway/`) for the same
player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9), in the fourth batch. Short mixed Rounds
about measuring length earn Bolts and one Jump. Bolts buy truck parts, ramp pieces, Rows to jump over, paint and arena pieces. Each Jump is
measured with a yellow tape, so the skill and the reward are the same subject.

## What he learns, and where it comes from

Legend: **[S]** search result or summary read this session (cpalms.org, cde.ca.gov, doe.sd.gov unpackings, illustrativemathematics.org,
shmoop's TEKS Chapter 111, the Eureka TEKS Grade 2 Module 2 sample, lead4ward), **[M]** from memory, not re-checked.

| Standard | What it asks | Where it is in Big Air |
|---|---|---|
| CCSS 1.MD.A.2 | Length as a whole number of units laid end to end, no gaps or overlaps [M] | Where it starts: Math Bots' **Measure It** (below) |
| CCSS 2.MD.A.1 | Measure length by selecting and using tools such as rulers, yardsticks, meter sticks and measuring tapes [S] | **Ruler** (all Levels), the **Tape** in the reward |
| CCSS 2.MD.A.2 | Measure the same length twice with different units; describe how the measurements relate to the size of the unit [S] | **Two Units** |
| CCSS 2.MD.A.3 | Estimate lengths in inches, feet, centimetres and metres [S] | **Best Guess** (inches, feet and some centimetres; metres left out, below) |
| CCSS 2.MD.A.4 | Measure how much longer one object is than another, in a standard unit [S] | **How Much Longer** |
| CCSS 2.MD.B.5 | Add and subtract within 100 for word problems about lengths in the same unit, with drawings such as rulers and equations with a symbol for the unknown [S]; comparison wording is not always "more means add" (Achieve the Core) [S] | **Length Stories**, the bars drawn as the story says |
| CCSS 2.MD.B.6 | Whole numbers as lengths from 0 on a number line with equally spaced points; sums and differences within 100 on it [S]; "a number line works like a ruler" (SD unpacking) [S] | **Jump Line** (the same yellow tape as the reward) |
| TEKS 2.9(A), (D) | Find length with concrete models of standard units; length to the nearest marked unit with rulers, yardsticks, metre sticks or measuring tapes [S] | **Ruler** |
| TEKS 2.9(B) | The inverse relationship between the size of the unit and the number of units needed [S] | **Two Units** (the smaller unit gives the bigger number) |
| TEKS 2.9(C) | Whole numbers as distances from any given location on a number line [S] | **Jump Line** Level 2 (a stretch from 30 to 40) and Level 3 (a hop from where the first one landed) |
| TEKS 2.9(E) | Solve problems involving length, including estimating [S] | **Best Guess**, **Length Stories** |

**Findings that shaped the kinds (defaults):**

- **Where it starts.** Read in the code (`src/math-bots/numbers/problems.ts`, Measure It): Level 1 orders bars and compares two with a rope,
  Level 2 lays wrenches end to end (to 12), Level 3 picks the row laid right (no gaps, no overlaps) and asks whether big or small wrenches
  take fewer. So Big Air's Ruler Level 1 is the first standard tool: a ruler, zero at the first tick, whole inches up to 6. Number Chart
  (to 120) means numbers to 100 are familiar; Jump Line asks them as distances on a line, which is new.
- **Not Carrier Deck's stories.** Carrier Deck's Deck Log, Which Sum, How Many More and Two Steps are story problems about counts (jets,
  crates) with wheels and sentences. Length Stories are only about lengths in feet, with bars as the drawing (2.MD.B.5's "drawings of
  rulers"), three choices, and the start unknown at Level 3; How Many More's opposite-language compare appears here as "shorter than" and
  "longer than" stories at Level 2, both ways round.
- **Metres and yards are left out.** 2.MD.A.3 names metres; the brief's units are inches, feet and centimetres, and a metre has no
  everyday picture for him yet. Open question.
- **Two Units never converts.** Second grade asks only that a smaller unit gives a bigger number (2.MD.A.2, TEKS 2.9(B)). The numbers are
  shown (6 feet and 72 inches) but he is only asked which goes with which unit, which is bigger, or "more or fewer".
- **Number pad, not four choices.** The brief's risk: a pad may be slow. The pad was kept: ten big keys, two rows of five on a phone and a
  block beside the ruler sideways, so most answers are two taps and ✓. On the tour it was not slow. The fallback (four choices from the real
  mistakes) is not built; every question still carries its real mistakes (`traps`), so the fallback would be small.

## Kinds

Six kinds, three Levels each, with Stretch inside a Level. Ruler and How Much Longer are answered on a **number pad** (copied from Jetway's
idea of building the number, not imported); Jump Line Levels 1 and 2 by a **tap on the tape**; the rest by two or three choices. Numbers
on buttons and the pad are not read out (he reads numbers); units are spoken and written.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Ruler** `ruler` | start | from zero, whole inches up to 6 (2 to 4 at Stretch 0) on a 0 to 8 ruler | inches up to 12; from Stretch 1, centimetres up to 20; at Stretch 2 a two-sided ruler (inches one edge, centimetres the other) | the thing does not start at zero (it runs from 1–5 to up to 12 in, or 1–8 to up to 20 cm); two-sided at Stretch 2 |
| **Best Guess** `guess` | start | which is longer in real life: a small thing and a big one, drawn the same size | "About how long is a pickup truck: 2 feet or 20 feet?" (big things at Stretch 0; small things in inches from Stretch 1; some centimetres at Stretch 2) | "Would you measure a crayon in inches or in feet?" |
| **How Much Longer** `longer` | Ruler L2 | two bars on one inch ruler, both from zero | two jumps as numbers with their bars (within 20, then to 60 without borrowing, then any to 99) | two bars that do not line up at the start (inches or centimetres); reading the ends is always wrong |
| **Jump Line** `line` | Ruler L2 | tap where 30 feet is on a 0 to 100 tape ticked in tens (labels every 20, then 0/50/100, then only 0 and 100) | tap where 34 lands on a stretch from 30 to 40 ticked in ones | a 25-foot jump and 12 feet more: where does it land? (whole tens, then no carrying, then carrying; three choices) |
| **Length Stories** `story` | How Much Longer L2 | putting together: "The ramp is 12 feet long. He adds a piece 6 feet long." / two rows end to end | taking away and comparing: cut off, how much shorter, "shorter than", "longer than" (which adds) | the start unknown: "He added 8 feet to the ramp. Now it is 30 feet long. How long was it before?" (and cut off) |
| **Two Units** `units` | Best Guess L2 | a toy on a ruler in inches and centimetres (2/5, 4/10, 6/15, 8/20): which number is bigger, or smaller | "It is 3 feet long. Would it be more inches or fewer inches?" (feet and inches at Stretch 0, centimetres after; more and fewer half each) | the same jump in feet and inches (or a toy in inches and centimetres): which number is the feet? |

### Rules the tests enforce (`questions/problems.test.ts`, 600 to 2,000 generated questions of each kind and Level)

- Every question has exactly one right answer, its choices are unique and hold it once, and nothing passes 100 or is below zero.
- **Every ruler is drawn with its zero at the first tick, not at the end of the wood, and the ticks are evenly spaced** (both edges of a
  two-sided ruler, which share the zero). A thing always lies from tick to tick: second grade measures to the nearest whole unit.
- **A Level 1 Ruler question always starts at zero; a Level 3 one never does.**
- **Wrong answers are the real mistakes**: the number at the far end when the thing does not start at zero, counting the ticks instead of
  the spaces (one too many), reading the other edge of a two-sided ruler, the long bar's own length, the two added, the ends compared
  instead of the lengths, a ten off, the tens or the ones forgotten in a hop. Jump Line hops offer only real mistakes as wrong choices.
- **Best Guess uses only the hand-checked table** (`questions/things.ts`: 12 small things under a foot, 10 big things at least four feet,
  each about-length within 25% of its real length), and its two choices are always at least five times apart.
- **Two Units never asks him to convert**: every answer is a unit, more/fewer, or one of the two numbers on the screen; the smaller unit
  always gives the bigger number; "more" and "fewer" are each asked 30–70% of the time.
- A story's answer is never a number the story says, the bars add up, and what is said is what is shown.

**Mastery, placement and Rounds (as Globe Hopper).** 16 of the last 20 right first try, or the last 10 in a row; the first 30 questions of
a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three probes each of
Ruler and Best Guess at Level 2. Rounds are five answers, mixed, never the same kind twice running while there's another; about one in
three (and always the one after a miss) is easier and doesn't count; a miss comes back later as a new question with no Mastery credit.

**Meetings**, each before the first question that needs it, shown and said, then Go: the ruler ("This is a ruler. Each space is one inch.
Start at zero. Count the spaces." with a crayon and three hops), the centimetre (beside the inch on a two-sided ruler), and the foot
("Twelve inches make a foot. Jumps are measured in feet."). As in Globe Hopper, a Meeting takes one of the Round's five places.

## Teaching a miss

Never a red X. The first miss gets one line about the mistake he made, the picture moves to show it, and "Try again!". The second miss (or
the first when he has been missing a lot, or 🔎) gets the fuller lesson, one step at a time, with the big arrow to move it on, ending with
the right answer glowing (`questions/teach.ts`).

- **Ruler:** "That is the number at the end." / "Count the spaces, not the lines." / "Read the inch side." The thing slides to zero, then
  each unit is counted as a hop along the ruler ("1, 2, 3 ... It is 7 inches long.").
- **How Much Longer:** "That is how long the long one is." / "Don't add them. Find the difference." / "They do not start at the same
  place." The short bar is laid on the long one, and the part left over lights up and is counted (for jumps, by tens then ones).
- **Jump Line:** the tape fills from zero, ten at a time ("10, 20, 30"), then by ones; a hop fills by tens then ones.
- **Best Guess:** the things are drawn side by side at the same scale with a child standing next to them, and "a school bus is about 40
  feet long."
- **Length Stories:** the bars end to end or one above the other, as the story says, then the number sentence ("30 feet take away 8 feet
  is 22 feet").
- **Two Units:** both units laid along the thing (inches above, centimetres below, counted), "A centimetre is smaller than an inch. More of
  them fit. The smaller unit gives the bigger number."

**On-screen inches are not real inches.** Every ruler is drawn to fill the space it has (on an iPad 9 upright an "inch" is about 57 points,
on a sideways phone about 40, on an upright phone about 26), and the tour fails if a unit is under 16 pixels. A true-size ruler is possible
on the iPad 9 (its density is known) and is left out of this build: see Open questions.

## The reward: the Arena, the Jump and the Tape

**The loop.** A finished Round earns Bolts and one Jump. Bolts buy truck parts, ramp pieces, Rows, paint, arena pieces, drivers and horns.
The first Jump is free, so he sees the reward before his first purchase. A Jump is used, and paid, only at its end; leaving halfway costs
nothing. A reload during a Jump lands at the Arena.

**The Jump** (`jump/sim.ts`, flat 2D canvas, about 12 to 25 seconds plus the results):
1. The card: his truck, what the Jump goes over and its length in feet, any wind, the Show Cup if this Show gives one. "Next up: Two Cars.
   It is 29 feet long. Tap Jump!"
2. Three lights and GO.
3. The run-up: he holds the big pedal (bottom right, above the floor), or just holds a finger anywhere on the picture. Speed builds quickly at first, then more slowly, toward the
   engine's top speed. Off the pedal the truck rolls on at a crawl, so even doing nothing reaches the ramp.
4. The air: off the kicker at its angle. Holding a finger left of the truck lifts the nose, right of it dips it; with no finger the nose
   droops slowly by itself. A booster (if he has one) gives one push when he taps Boost; sooner is farther.
5. The landing: within the springs' window of level is a **clean landing** (+1 Bolt). Nose first or tail first only bounces it back onto
   its wheels. Landing on the Row crunches it, and still counts.
6. **The Tape**: the camera pulls back so the whole tape fits; it rolls out yellow with black numbers from the lip (zero) to the back
   wheels, the feet ticking up, and the distance is said ("34 feet"; past 100, "one hundred" and "34 feet").
7. Results: Bolts, a new record, the Row or Show cleared, trophies, a Show Cup, a new rank.

**Fair and deterministic.** Fixed steps of 1/60 s and nothing random: the same truck, ramp, Row and inputs always give the same distance.
The tilt only decides whether the landing is clean, never the distance, so the record never depends on something he can't see. "Watch
it" replays his best jump from its recorded inputs (stored as runs of pedal/tilt/boost changes) and goes the same distance to the foot
(tested in `jump/sim.test.ts` with random hands, and checked in the browser tour).

**It cannot be failed.** Falling short of a Row is not losing: the same Row (or Show) waits for the next Jump with a **mercy wind**
(`mercyWind` in `jump/sim.ts`, worked out once as the truck leaves the lip), and a head wind drops once he has fallen short. Every Jump
pays. The wind is up to 45% of his speed through the air (booster included) for each try he has fallen short, but **only as much as
carries him 2 feet past the end of the Row, never farther**, so a helped jump never sets a record the truck didn't earn. After two
tries short it always carries a child who touched the pedal at all; after five, anyone. Nobody is stuck on a Row or Show for ever: the
child who does nothing clears it at the sixth try at the latest, the clumsy child by the third (pass 2; before, the wind stopped
growing after 8 tries and multiplied the whole jump, so doing nothing never cleared 15 of the 40 Rows or most Shows, and a helped jump
could land far past the Row and take the record).

**The Arena** (`arena/`), tabs by price, a dear thing always beside cheap ones, the Goal bar filling toward what he's saving for, his
crowd count and record on the view:
- **Truck**: 16 bodies (Mud Truck to Titan Truck; each tilts at its own speed in the air), engines (top speed 40 to 88 ft/s), tires (how
  soon speed builds), springs (the clean-landing window, 10° to 32°), boosters (a push of 6 to 25 ft/s), exhausts, roof lights, flags,
  10 drivers and 10 horns.
- **Paint**: 22 colours, 10 patterns, 16 decals and 8 trims, chosen apart (28,160 paint jobs on 16 bodies).
- **Ramp**: 10 run-ups (40 to 130 ft), 10 kickers (18° and 3 ft to 35° and 9 ft), 10 landing ramps (each widens the clean window); every
  piece shows its length in feet.
- **Rows**: 40 hand-made Rows to jump over, from Three Cones (14 ft) and Hay Bales up through cars, buses, a fire ring, a pool, rival
  trucks, a parked plane, to the Grand Finale (107 ft). Each opens in the shop when the one before is cleared, and must be bought (2 to 99
  Bolts) to set it up. Things in a Row are their real lengths (a car 15 ft, a school bus 38, a plane 70).
- **Arena**: 24 pieces (Flag Row, Start Lights, Windsock, Camera Crew, Speed Board, Floodlights, Fireworks, Confetti Cannons, Big
  Screen, Blimp ...); Floodlights draw beams, Fireworks fire on a record, Confetti Cannons on a clear, the Speed Board shows his speed,
  the Windsock shows a Show's wind, Camera Crew adds flashes. And **More Seats** without end.
- **Tune**: Tune the Engine, the Springs, the Booster, without end.
- **Records**: the **Record Board** (his ten longest jumps), "Watch it", distance trophies (20 to 200 ft), Show Cups and his rank.

### Rewards that never run out

1. **The endless layer, made by the game.**
   - **His longest jump.** A number in feet with no ceiling, cheered and paid when beaten; the Record Board keeps his ten longest.
   - **Shows** (`arena/shows.ts`), once the first three Rows are cleared; Rows and Shows take turns while there are Rows left, then every
     Jump is a Show. Show n is generated from its number: what is in its row, its length in feet, the wind (-3 to +4 ft/s) and night or
     not; the same every time. Its length follows a table measured from the economy run (17 ft at Show 1, 38 at 100, 59 at 200, 108 at 400,
     236 at 800, 302 at 2,500), then grows by 9 ft each time the Show number doubles, without end; it never gets shorter. Every fifth Show
     gives a numbered **Show Cup** (a glyph and two colours from its number), never sold. `arena/gen.test.ts` makes 3,000 Shows twice and
     checks each fits its things, and that every one can be cleared with the truck a cheapest-first child owns when he reaches it.
   - **Ranks** by Jumps (Rookie, Hopper 3, Flyer 8, Jumper 15, Stunt Driver 25, Daredevil 40, Air Ace 60, Big Air Star 85, Sky King 120,
     Legend 160), then Legend 2, 3 ... every 40 Jumps without end.
   - **Trucks from parts**: 16 bodies × 10 × 10 × 8 × 8 × 8 × 8 × 8 parts × 28,160 paints × 10 drivers × 10 horns.
2. **Things bought again and again**, price rising gently then flat: More Seats (12 to 60; the crowd grows by 150 and is counted on the
   board and drawn denser), Tune the Engine (30 to 60), Tune the Springs (20 to 60), Tune the Booster (25 to 60). Each tune adds a little
   less than the last (2.4 ft/s, then 2.4/1.25, 2.4/1.5 ... for the engine), a sum that keeps growing slowly, so the record always has
   somewhere to go and never runs away from the Shows.
3. **The fixed catalogue**: 228 things for sale (including 39 Rows to buy), 10 ranks and 12 distance trophies: **250 named things**.

**Measured** (`arena/economy.test.ts`, the scripted child of the build guide: every answer right first try, every Jump taken by the skilled
child, the cheapest new thing bought as soon as he can, his strongest parts fitted):

| | |
|---|---|
| Bolts a Round (Round and Jump, first 300 Rounds) | **9.81** (the Jump 3.81; checked in the browser: a Round pays 1 for each answer right at the first try and 1 for finishing, a Jump 2 +1 clean +1 record +1 cleared) |
| Rounds to buy the whole fixed catalogue | **1,137** (about 57 hours at 20 Rounds an hour); the 40 Rows cleared by about Round 730 |
| Longest gap between purchases, first 100 Rounds | **3** (first 300: 6; first 1,000: 22). Counting a Show cleared, a Show Cup or a record as something new, never more than 2 Rounds without one at any point |
| First purchase | Round 1 |
| Dearest things, in Rounds of saving | Titan Truck 36.7, Mega Engine 30.6, Golden Truck 28.5, Moon Kicker 26.5, Mega Booster 24.5, Sky Run-Up 22.4, Jet Engine 20.4, Dragon Truck 18.3; everything else 15 or less |
| After 2,000 Rounds | something new every Round: every Jump is a Show he hasn't cleared, and seats and tunes to buy; 1,642 Shows cleared, record 394 ft |

**Economy defaults, for the parent to confirm.**
- One Jump per Round; the first Jump free; Jumps don't expire.
- A Jump pays 2 Bolts, +1 for a clean landing, +1 for a new record, +1 for clearing a Row or Show. At most 5; a Round and its Jump at most
  11, under Turbo Tally's ceiling of 15. No other way to earn Bolts.
- Prices up to 100 in ones, then whole tens to 400 (the dearest is 360), using the whole-ten clips (`PRICE_TENS`, as Turbo Tally) and "You
  need about 140 more Bolts." for a gap that isn't a whole ten.
- The dearest things are bodies, engines, tires, springs, boosters, kickers, run-ups and the Big Screen; a paint is never dear (26 at most).

### Competition: no rival (default)

**No Long Jump contest was built.** His own record is the competition: it never needs balancing, has no ceiling and is cheered every time.
The Shows give him something to beat that is not himself, and they are tuned by the guide's "Competition" rules anyway, measured in
`arena/gen.test.ts` against each Show with the truck the cheapest-first child owns when he reaches it (1,642 Shows reached in 2,100 Rounds; the rates below are from every Show up to 60, then every third, 587 in all; a separate check runs the skilled and clumsy children on every Show up to 200 and every seventh up to 3,000, and the child who does nothing on every Show up to 100 and every 13th to 3,000). Measured again in pass 2 after the mercy wind changed:

| Child | Shows: first try | Shows: clears within | Rows (the truck he has then): first try | Rows: clears within |
|---|---|---|---|---|
| Skilled (holds the pedal all the way, boosts at once, lands level) | **72%** (Shows past 400: 83%) | 2 tries, every Show | 95% | 2 tries |
| Clumsy (lets go of the pedal for a stretch, boosts late, dips the nose early) | 0% | 3 tries, every Show (85% at the second) | 0% | 3 tries (95% at the second) |
| Holds the pedal only at the start, or taps it on and off | 0% | 3 tries | 0% | 3 tries |
| Does nothing | 0% | 6 tries (4 to 6; never within 3) | 0% | 6 tries (Row 1 at the fourth) |

With the **dearest build** (everything bought, no tunes) against the same Shows: skilled 54% at the first try, clumsy 45%, doing nothing
22% (mostly early Shows he'd never meet with that truck); everything within 3 tries, doing nothing within 6. With the **starter truck**
(nothing bought): Shows 1 to 60, skilled 13% at the first try, every one within 3; every Row within 3 for anyone who touches the pedal.
The hand-made Rows are easier than the Shows (95% at the first try for the skilled child, because the cheapest-first child has outgrown
each one by the time he buys it); the Shows are the contest.

The mercy wind is the guide's mercy step. A rival contest could be added later on the same sim (a rival is a scripted child with a
truck); open question.

## Look

A night arena: deep navy sky with stars, floodlight beams (with the Floodlights), a dark crowd of coloured dots with camera flashes, dirt
brown, and the truck in loud colours. The tape and the Home ruler are yellow with black numbers. The question card stays white so the
ruler reads clearly. Icon: a red truck in the air, nose up, over a yellow ruler, on a night sky with two floodlight beams and a dirt floor.
Kept apart from Monster Truck Money (a garage, money): here the truck is a tool for the jump and the arena is what he builds; the two games
do not share a save. The family look: Bungee titles, Nunito reading, 4px black outlines, chunky shadows.

## Voice

Aria at -8% (`tools/make_voice.py --collection big-air`), **830 clips, 12 MB on disk** (`public/big-air-voice/`; 938 and 14 MB in pass
1, before pass 2 removed 109 clips the game could never say: inches and centimetres past 40 that aren't a whole five, "You earned 7 to 12
Bolts", and six unused lines). Every length is said with its unit as **one clip** ("1 foot", "2 feet", "1 inch", "7 inches", "15
centimetres"): feet from 1 to 100, inches and centimetres from 1 to 40 and the whole fives to 100 (`saysLength`; `game.test.ts` checks
every length a question or lesson can say has one), so "foot" and "feet" are never chained wrong; distances past 100 are "one hundred" +
"34 feet". Numbers on the pad and buttons are not read out. Thing names are said with their article ("a school bus"). Prices past 100 are
whole tens. How to tilt ("Hold left or right of the truck to tilt it!") is said on the card before his first five Jumps. A trophy is "You
won a trophy for" + "50 feet" (pass 1 said "You won the 50 feet trophy!").

Pass 2 listened by machine: every clip's spoken length fits its text (0.5 to 3.7 seconds of speech, 0.18 to 0.86 seconds a syllable),
and every clip was transcribed back with a speech recogniser (faster-whisper small.en); the ones it heard differently are in Not done.

## Save

`big-air-save` (version 1) holds learning, Bolts and the Arena (owned, repeats, truck, ramp, goal, Jumps, Rows and Shows cleared, mercy
tries for the Row and the Show, the Record Board and the best jump's setup and inputs). `big-air-place` holds the screen and the Round in
progress. An unknown version reads as a blank save; anything it can't read comes back fresh.

## Defaults for the parent to confirm

- The name, Big Air.
- The six kinds, their Levels and unlock order above; metres and yards left out.
- A number pad for Ruler and How Much Longer (not four choices).
- Centimetres spelled the British way on screen and said by the voice ("centimetres"), as the brief writes them.
- The economy above (one Jump per Round, payouts, prices), Rows bought and then cleared one Jump at a time, Shows taking turns with Rows.
- The mercy wind (up to 45% more tail wind each try short, only enough to carry him 2 feet past the Row; sure after two tries for a child
  who touched the pedal, after five for anyone; head wind dropped) and no rival contest.
- The tilt only decides a clean landing (+1 Bolt), never the distance.

## Open questions

- **A true-size ruler on the iPad 9.** Its screen density is known, so a ruler could be drawn in real inches there. Left out: on a phone the
  same question would need a different drawing, and a real 12-inch ruler does not fit an iPad upright. Worth it for Ruler Level 1?
- Should Best Guess add metres (2.MD.A.3) and yards (some states)?
- Feet in the reward and inches on the ruler are different units. That is true to life and is what Two Units teaches; watch for confusion.
- Should a Meeting take one of the Round's five places (as Globe Hopper's do), or come on top?
- A Long Jump contest against rival trucks, now that the sim and the scripted children exist?
- The child who does nothing clears a Row or Show at the sixth try at the latest (pass 2 made the wind sure; before, he never could). Is
  six right, or should it be sooner?
- The hand-made Rows are cleared at the first try 95% of the time by a skilled child; should they be a little longer?

## Verified

- `npm run typecheck` and `npm run typecheck:pairings`: pass.
- `npm test`: 186 files, 2,615 tests; passed in full once. On other runs one or two tests in other games (Hook and Ladder's "every vehicle
  finishes every Call", Jetway's airport layout) went just over their 5-second limit while the machine's load average was about 16 on 8
  cores from other work; they pass when run alone, and the suite without Big Air passes. Big Air's 6 files (74 tests) pass every time.
- `npm run build:site`: passes; `dist-site` has **828 files**, **no `.mp3`**; Big Air's 938 clips are in 16 packs (`voice/<0-f>-<hash>.bin`),
  13 MB for the whole game folder.
- `tools/big-air/offline.ts` on the production build: 30 files precached, every one of the 16 voice packs (938 clips); offline, a Round
  starts with the ruler Meeting, its voice plays, the first answer counts, and a reload mid-Round comes back to it.
- `npm run check:offline` (after `npm run build` and `npm run build:pairings`): 7 of 7 journeys pass.
- `tools/big-air/tour.ts` at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and
  Level 3 (12 runs): a Round with two deliberate misses in each kind met (the fuller lesson tapped through to its end), a purchase, every
  Arena tab, a Jump (pedal held, Boost tapped) through the tape to its results, and "Watch it" checked to go the same distance as the best
  jump. Across the runs every kind was missed twice at least once. All 12 pass with no problems after two fixes: a centimetre ruler on an
  upright phone measured 15.9 pixels a unit (the floor is 16; centimetre rulers now run only a little past the thing, and the card's side
  margins are narrower on a phone), and the tour's earlier screenshots led to fixes made in this pass (night sky, tape framing, pedal
  hidden after the lip, the Arena truck clipped sideways, the Best Guess lesson's labels). A Round took about 65 to 100 seconds in the
  tour (it waits for every line to be said) and a Jump about 11 seconds plus its results, so 20 Rounds an hour is about right.

### Pass 2 (bug and sound review)

Fixed:
- **A child could be stuck on a Row or Show for ever.** The mercy wind stopped growing after 8 tries, so a child who did nothing (or let
  go of the pedal early) never cleared 15 of the 40 Rows or most Shows with the truck he'd own; the clumsy child needed 4 tries on some
  Rows. Now it is sure after two tries for anyone who touched the pedal and after five for anyone (`mercyWind`), tested for every truck,
  child and row length to 420 ft (`jump/sim.test.ts`) and for every Row and sampled Shows (`arena/gen.test.ts`).
- **The mercy wind inflated records.** It multiplied the whole flight, so a helped jump could land far past the Row and take the record
  (the economy child's record after 2,100 Rounds fell from 424 ft to 394 ft once fixed). It now only carries him 2 feet past the Row.
- The number pad wrote "1 inches" (and "1 centimetres") when he typed 1, a real answer in Ruler Level 1 and How Much Longer.
- "You won the 20 feet trophy!" is now "You won a trophy for" + "20 feet".
- How to tilt was never said aloud (the clip was recorded and unused); the card says it before his first five Jumps.
- A Show could list the same thing twice ("4× 🦖 3× 🦖"); now one run of it.
- A numbered Legend past 100 had no clip (only after 4,000 Jumps); the number is left off there.
- 109 clips the game could never say were removed (938 → 830, 14 MB → 12 MB; the built game 13 MB → 11 MB).
- Pointer capture on the pedal and the canvas can throw on iPad Safari if the pointer has already gone; now caught.

Checked:
- `tools/big-air/kinds.ts` (new): every kind at every Level, one kind practised at a time, at all four sizes (72 Rounds): answered right,
  missed once then right, missed twice with the step-by-step lesson tapped through, then right; every question takes taps again after
  each miss; every Round paid exactly 1 a first-try answer + 1; the pad ignores ✓ with nothing typed, drops a leading zero, stops at two
  digits, erases; every voice pack fetched once, none failed, no console errors, no two clips at once. Also: a reload in a Round comes
  back to it with its answers; a reload in a Jump lands at the Arena with nothing used or paid; a Jump with no input ends in 11 seconds,
  is measured (7 ft), pays 2 and returns; two Jumps mashed (every control, random taps, the leave button) end and pay normally; and the
  same jump goes the same distance at 20, 60 and 144 frames a second (8 ft with no input, 19 ft with the pedal held).
- `tools/big-air/tour.ts`, all 12 runs (4 sizes × new, Level 2, Level 3): pass. The tour read each question before it was on screen (the
  star fills as he answers, before the next question comes), so it sometimes answered the next question with the last one's answer and
  then crashed; it now reads the question once it takes taps.
- `npm run typecheck`, `typecheck:pairings`, `build:site` (828 files, no `.mp3`, Big Air 11 MB in 16 packs), `tools/big-air/offline.ts`
  (16 packs, 830 clips precached; a Round speaks offline and comes back after a reload) and `check:offline` (7 of 7): pass. `npm test`:
  2,616 of 2,620 with four browsers running; the four were Hook and Ladder's Call tests and one Globe Hopper test over their 5-second
  limit under that load, and both files pass when run alone; Big Air's 79 tests pass.
- A paused audio context (the Math Bots bug) wakes on the next tap, on the second question and after a miss, and the voice goes on.
- A save with every fixed thing owned and 5,000 Bolts: More Seats and three tunes on sale at 60, Show 701 (204 ft) waiting, the Goal bar,
  rank progress to Legend 28; a tune bought and the Jump played to its results.
- Every clip decoded and its speech measured (0.5 to 3.7 seconds, 0.18 to 0.86 seconds a syllable: none empty, clipped or padded), and
  transcribed back with faster-whisper (small.en, then large-v3-turbo for the 40 it heard differently).

## Not done (pass 1)

- **No real iPad or Safari testing.** Most needs checking there: holding the pedal with one thumb (pointer capture), tilting with a
  finger left or right of the truck while the other hand is free for Boost, the Jump's frame rate with a big crowd and a long Row, the
  ruler's readability on an upright phone (the cm ruler's numbers are small there), and the voice's timing on iPad Safari.
- **The voice was not listened to by a person.** Pass 2's speech recogniser heard almost every clip as written. Both models heard these
  differently, so they most need an ear: "Hill Run-Up" (heard "He'll run up"), "Big Eyes Decal" (garbled), "Hay Bales" ("He bails"),
  "Put them end to end." ("Put the men to end"), and "You opened Jump Line!" / "You opened Two Units!" (both heard "You open", the
  "-ed" lost before the name). Also worth a listen: "1 centimetre", the chained "one hundred" + "34 feet", "Rows" (a tab name, heard
  "Rose").
- The tape ends where the truck touched down (a red marker); the truck rolls on a little past it, so the tape stops short of the truck.
- On a sideways phone the pedal is 24 px from the right edge (60 px above the bottom): inside the floor, close to the side.
- The four-choice fallback for the number pad is not built.
- The truck is drawn simply (shapes, not art); bodies differ mostly by outline and extras; the obstacles are simple shapes.
- Arena pieces are drawn as emoji along the stands; most are looks only.
