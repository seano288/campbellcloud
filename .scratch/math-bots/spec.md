# Spec: Math Bots (first-grade math, robot-combat reward)

Status: live with a tile on the landing page. All thirteen kinds, the Workshop, the 3D fight, and Legendaries with the Balance Lock are in (2026-11-05). Not yet run on a real iPad.

A new learning game on the family site, built the same way as Chop Chop and Sight Squad, for the same player (6 to 7, reads
numbers and short words, leans on recorded voice, alone on an iPad). Short mixed Rounds earn Bolts, spent on his robot, which
fights a computer-controlled robot.

Research: `research/first-grade-math.md` holds the teaching detail for every kind and is the reference for wording, wrong
answers and misses. Where it differs from this spec, this spec wins.

## Decisions (the parent, 2026-11-04)

- **Skip counting is in**, as a full first-release kind. Count back is not added.
- **No parent setting.** Placement is by the first three Rounds alone.
- **Standards:** Common Core Grade 1, plus skip counting by 2, 5 and 10 (from Texas TEKS).
- **Reward look:** three.js with P2's renderer, P5's physics and cameras, P3's scanned materials, P1's modelling methods, plus
  real dents. See `prototypes/p7-combined/`.

Defaults taken from the research's open questions, none confirmed yet: no timed "Pit Stop"; a replayed miss uses new numbers and
earns no Mastery credit, in this game only; Bolts use the shared currency. The offline budget stays about 50 MB; the game now
precaches 33 MB. How much fight per Round is a default below, for the parent to confirm.

## Kinds

Three Levels each, using Stretch inside a Level for number size.

**First release (9):** Make Ten `ten`, Count On `on`, Bot Stories `story`, Facts `facts`, Tens and Ones `tens`, Skip Count `skip`,
Missing Part `part`, Weigh-In `scale`, Over Ten `over`.

**Second wave (4), built as `research` 3.9 to 3.12 with the changes below:** Number Chart `chart`, Big Jumps `jump`, Measure It `measure`, Shapes `shape`.

Time, halves and coins stay in the sibling games.

### Skip Count (`skip`)

Not in the research as a kind (it was an optional Stretch on Number Chart), so defined here.

- **Standards:** TEKS Grade 1 skip counting by 2s, 5s, 10s to 120; supports 1.NBT.C.5 and tens as units.
- **Screen:** a number path where each stop is one jump, then plain tokens in groups. Three number choices, because answers pass
  20 and go to 120, past both the strip and the two wheels.
- **Level 1, tens.** Stretch 0: 10, 20, 30, what comes next? Stretch 1: a missing number in the middle, to 120, and groups of ten.
  Stretch 2: off-decade starts (3, 13, 23).
- **Level 2, fives.** To 50, then to 120, with groups of five at Stretch 1.
- **Level 3, twos.** To 20, then 40, then 120, with pairs at Stretch 1.
- **Spoken:** `Count by {step}.` then the sequence, with the blank as a rising "what comes next?". Groups: `{n} groups of {step}. Count by {step}. How many?`
- **Wrong answers:** counted by ones (last + 1), the wrong step, stopped where he was, and the crossing slips: after 100 by tens, 200.
- **Taught:** the path replays each jump with its number said aloud, then the tokens group: "Five, ten, fifteen, twenty. Every jump is five."

### The second wave as built

- **Number Chart.** Level 1 to 30, then 50: `Tap 34.` on the chart, or 17, 18, what comes next. Level 2 crosses tens (29, __) to 120, with 100 to 120 from Stretch 1. Level 3: ten or one more or less, on three choices, the chart fading from Stretch 1 and leaving only his number at Stretch 2.
- **Big Jumps.** Wheels. Level 1 decades, add and take away. Level 2 no carrying (`24 + 3`, `24 + 30`). Level 3 crossing a ten (`28 + 5`), with `46 + 20` from Stretch 1. Rods show at Stretch 0 only. About one in four has the operation on the right. Totals stay under 100, so they fit the wheels.
- **Measure It.** Level 1: longest and shortest, with bars starting in different places from Stretch 1, and the rope at Stretch 2. Level 2: lay wrenches, then ✓; counting a laid row joins from Stretch 1. Level 3: which one is measured right (gaps, overlaps, and a late start at Stretch 2), and from Stretch 1 which takes fewer, or more.
- **Shapes.** Level 1: tap every triangle (or square, and so on) among six tiles. Level 2: which one is not, how many sides, the shape with this many sides all joined. Level 3: fill an outline, two pieces, then up to six.

## Unlock order

As `research` 5.1, plus Skip Count, which opens at Count On Level 2 (extends counting) and which placement can reach only through Count On. A kind opens only when its parents are open as well as at their Levels: Tune-Up can leave Facts at Level 2 and still locked, and Shapes waits for it.

| Kind | Opens |
|---|---|
| Make Ten, Count On, Bot Stories | At the start |
| Facts, Tens and Ones | Make Ten L2 |
| Missing Part, Skip Count | Count On L2 |
| Weigh-In | Missing Part L2 |
| Number Chart | Count On L2, or three clean teens in Tune-Up |
| Measure It | Bot Stories L2 |
| Shapes | Facts L2 |
| Over Ten | Make Ten L3 and Tens and Ones L2 |
| Big Jumps | Tens and Ones L3 and Number Chart L2 |

Rounds pick from a working set of at most 5 unstarred kinds, with starred kinds as about one review question per Round.

## Placement

The first three Rounds ("Tune-Up") look like normal Rounds, about 15 questions, per `research` 5.3 without its parent setting.
Because Levels never go down and there is no setting to correct them, placement stays low and the climb is fast: the first 30
pushed questions of a kind use the faster Mastery rule. Nothing places past Weigh-In L1 or Bot Stories L2. Skip Count always
starts at Level 1, since the climb is quick if he already knows it.

## Changes to shared code

- `OPENS_AFTER` takes several parents, and a new `OPENS_AT` gives the Level (Over Ten needs two).
- A working-set pick replaces uniform `pickNext` for this game.
- A replay can ask for new numbers.

## Reward rules

The fight has no math in it and TORQUE always wins. Word rule: knocked out, stopped, sent spinning; never kill, shoot or destroy.
Math ties in only where it's honest: Weigh-In, a Balance Lock on Legendaries, and bolts and wheels as story nouns with plain
counters on screen. Original bots only; say "robot combat", never the trademark.

The Workshop (`src/math-bots/RewardScreen.tsx`, `workshop/`) shows TORQUE as built, his Bolts, a big Fight button and four Slots.
The fight (`src/math-bots/fight/`) is P7 ported, loaded by dynamic import only when it opens. Upgrades are looks only.

Once a Slot's top Rung is his, its Legendary opens by solving a Balance Lock (`workshop/BalanceLock.tsx`, `workshop/lock.ts`): Rainbow Paint, Lightning Drum, Dragon Armour, Comet Wheels. **Bolts rule, following Sight Squad: a Legendary is never bought with Bolts, the lock costs none, and a Legendary is never the Goal.** Solving it changes no Level, Mastery or Strength.

## Not yet generated

Nothing. Checked in the code on 2026-11-05: the Scoreboard has its generator, screen, teaching and clips (`makeBoard`, `BoardView`), and per-fact Strength is saved, weighted and paced (`stepFact`, `pickFact`, `factsPool`), so this section was out of date. The one real gap was in Facts: `research` 3.3 has the facts that cross ten join once Over Ten reaches Level 2, and no Level held them. They now join Level 3 then (`crossingFacts`).

## Decisions while building the first playable stage (for the parent to confirm)

- **Working set order:** lowest Level first, then unlock order. Ranking by unlock order alone would let a slow Bot Stories Level 3 hold a slot and stop Weigh-In ever opening.
- **Tune-Up shape:** each Round asks one probe from each of the five anchors, so it's 3 Rounds when nothing stops a row. A row with 2 misses is replaced by ordinary questions. A Meeting or replay can push it into a fourth Round. Three clean teens open Tens and Ones even if Make Ten is still Level 1, as the research table says.
- **Probes:** a missed probe still gets the normal teaching on its second miss, because by then the row has stopped.
- **Tens and Ones "Make" is built, not typed.** "Make 67" with an answer on wheels would only copy digits, so he builds it with rods and cubes and taps ✓. The wheels are for "How many tens in 40?" and regrouped mats.
- **Scoreboard rows:** drum, hammer, flipper. It asks at Bot Stories Level 2 from Stretch 1, and Level 3.
- **Level 2 stories:** nearly all are solved by subtracting, so when a Round wants an addition it borrows a Level 1 story type.
- **Story numbers are at least 2.** The templates are plural, so a 1 would say "1 red wheels" or "1 are left".
- **Weigh-In cards** can be tapped once "Tap the true one." ends, while they're still being read, because reading all three takes about 10 seconds.
- **Everything is tap-only.** No drag exists, so nothing depends on one.
- **Voice:** Aria, chained. Clips carry about 1.2 seconds of silence, so Math Bots trims each as it decodes (`numbers/trim.ts`). The stretched "Niiiine" clips were not made: the voice can't be told to stretch a number.

## Workshop and fight defaults (for the parent to confirm)

- **A fight costs 5 Bolts, and the first is free.** About one Round earns one fight.
- **A paid fight stays paid until he sees it end.** Leaving early, a reload or a crash keeps a ticket in the save, and his next Fight tap is free. If 3D can't run he gets the plain outcome and isn't charged. The cost: a child who always leaves just before the end fights for free, which seems fine.
- **Slots and Rungs:** Paint, Drum, Armour, Wheels, three Mods each at 5, 15 and 30 Bolts. Looks only: TORQUE always wins. Tapping one he can afford buys and fits it at once, as in the sibling games.
- **Fights use 190 vetted seeds of 200,** chosen by a soak: TORQUE won all 200, and the 10 left out had no hammer hit, no armour off, or a knockout outside 15 to 24 seconds.
- **The 💥 button** makes TORQUE charge when its drum is ready, about a second later. Kept from P7 so he has something to press.
- **Detail looks after itself.** It starts by device, watches frame times, and steps down through nine rungs, the last four on WebGL2. Below about 26 fps it steps down, and it remembers where it settled. A fight that reaches the knockout without stepping down earns one rung back for the next fight, so a device near a limit may step down every other fight. Below about 6 fps at the bottom he gets the plain outcome, and the next fight starts from the top again.
- **The commentator is the game's voice, Aria.** A separate commentator voice wasn't tried.
- **Offline:** everything is precached, fight included. The service worker fetches it in the background, so play doesn't wait, but Round-only offline use also waits for those downloads to finish on first visit.

## Second wave and Legendary defaults (for the parent to confirm)

- **Save version stays 2.** Everything new is added to the save, and the reader opens what he has earned on any load, so no version check is needed. A bump would be worse: the live build treats a version it doesn't know as a blank save, so rolling this release back would wipe him. Rolling back with version 2 loses only his Legendaries.
- **A child partway through** gets each new kind he has earned the next time the game loads, with its "You opened" line, and it starts at Level 1.
- **Order of the kinds:** Home and the working set go Skip Count, Number Chart, Measure It, Shapes, Weigh-In, Over Ten, Big Jumps. New kinds start at Level 1, so for a while they take working-set places ahead of his Level 2 and 3 kinds.
- **Three clean teens open Number Chart,** as `research` 5.3 says, even before Count On L2. A child who already cleared that row gets it on load.
- **Number Chart runs 1 to 120 in rows ending in tens.** On an iPhone upright a square is about 36 points wide by 48 tall: narrower than the 44 rule, because ten columns have to fit. The rows are taller to make up for it, and the squares touch, so there's no dead space between them.
- **"Twenty-ten" (210) and 1009 are never offered:** the voice stops at 200 and the wheels at 99. The research's other wrong answers are used.
- **Measure It is tap-only, so he can't make a gap himself.** Laying goes end to end, one tap each, with ＋, － and ✓. Gaps and overlaps are taught at Level 3, in pictures to judge. This overrides `research`'s dragged units.
- **A wrench is a unit, but bars are plain bars,** not a bot's arm as `research` 7.2 suggests, because no robot part goes on a question screen. For the same reason an outline is an "outline", not an armour plate.
- **A square is a rectangle, so a rectangle question never shows one,** neither as a right answer nor as a foil. Stretch 0 leaves hexagons out of every form.
- **A four-sided foil is never explained by counting sides:** on square and rectangle questions the line is "Its sides are not all the same long." or "Its corners lean."
- **Outlines are always "Fill the shape.",** never named: "Fill the square." would be wrong about the square piece on some outlines and right on others. A replayed Fill is a different outline.
- **Which takes fewer** also asks which takes more, or "always big" would be right every time.
- **The Balance Lock's level:** his Weigh-In Level, on three number choices. He can afford a top Rung before Weigh-In opens, and then gets the easiest form, one number on the left with counters to count; = only shows once he has met it. Two misses and the lock says the sum and lights the right number. He can close it at any time, and gets a new puzzle.
- **Once all twelve Mods are bought** the Goal chip shows 🔐 and says the next Legendary is in the lock, then 🏆 when all four are his.
- **Legendary looks:** Rainbow Paint (colour bands along the body), Lightning Drum (glowing purple teeth and bands), Dragon Armour (gold scales and fins), Comet Wheels (orange glowing hub and tyre ring). The fins and rings are real 3D parts on TORQUE; the fight's physics doesn't read any of it.

## Fight assets

All CC0, licence status carried over from the prototype's records (checked 2026-11-04). From Poly Haven: Empty Warehouse 01 by Sergej Majboroda (backdrop), Metal Plate 02 and Blue Metal Plate by Rob Tuytel, Rusty Metal Sheet by Amal Kumar, Old Tyre by MP (normal map only). From ambientCG: Scratches001, Scratches002, Smear007. Code: three.js (MIT), Rapier 3D compat (Apache-2.0). In `public/math-bots-fight/`.
