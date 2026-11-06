# Spec: Math Bots (first-grade math, robot-combat reward)

Status: live with a tile on the landing page, all thirteen kinds in. The reward was rebuilt on 2026-11-05 after his first week: see **The reward, rebuilt**, which replaces the old Workshop, 3D fight and asset sections. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Chop Chop and Sight Squad, for the same player (6 to 7, reads
numbers and short words, leans on recorded voice, alone on an iPad). Short mixed Rounds earn Bolts, spent on his robot, which
fights a ladder of computer-controlled rivals with him driving.

Research: `research/first-grade-math.md` holds the teaching detail for every kind and is the reference for wording, wrong
answers and misses. Where it differs from this spec, this spec wins.

## Decisions (the parent, 2026-11-04)

- **Skip counting is in**, as a full first-release kind. Count back is not added.
- **No parent setting.** Placement is by the first three Rounds alone.
- **Standards:** Common Core Grade 1, plus skip counting by 2, 5 and 10 (from Texas TEKS).
- **Reward look:** was three.js and Rapier (`prototypes/p7-combined/`). Replaced 2026-11-05 by a flat 2D fight: see below.

Defaults taken from the research's open questions, none confirmed yet: no timed "Pit Stop"; a replayed miss uses new numbers and
earns no Mastery credit, in this game only; Bolts use the shared currency. The offline budget stays about 50 MB; the game now
precaches about 12 MB. How much fight per Round is a default below, for the parent to confirm.

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

## The reward, rebuilt (2026-11-05)

The parent's report: his son finds it less fun. He wants to build the robot from different parts and control it in the fight, and the 3D is too realistic and too heavy. So the 3D fight is gone (three.js, Rapier, 16 MB of textures) and TORQUE no longer always wins.

**The loop.** A finished Round earns Bolts and one fight. Bolts buy parts. Fights win Bolts and a prize part nothing else gives. Better parts beat tougher rivals. Fights no longer cost Bolts, because that made him choose between the two things he wanted.

**Building (`bot/`, `RewardScreen.tsx`).** Body, Wheels, up to four Mounts (front, right, back, left), Paint and Face. Bigger Bodies have more Mounts. Any part goes on any Mount, as many copies as he likes, and weight is the balance: heavy parts cost speed. A part he doesn't own goes on the robot to try, with Power and three bars showing what it would change, and Buy beside it. Power is the sum of what's fitted.

**What parts do (`fight/sim.ts`).** Touch weapons (saws, spinners, spikes, bumpers) work on contact. The 💥 button fires hammers, flippers, claws and prods, or doubles touch weapons for a moment. A shield guards only the side it's on. Spike plates hurt whoever hits them. Boosters add speed, the Magnet pulls in Bolts, the Repair Bot heals.

**The fight (`fight/`).** Top-down, canvas 2D, one square arena so a thumb never covers it. A fixed steering disc left, 💥 and 💨 right (keys on a computer). He presses the disc on the side he wants to go; sliding works too, but no drag is needed. Controls stay out of a band above the bottom edge and away from the sides, because a swipe that starts at an edge belongs to iPadOS and a page can't stop it (2026-11-05, after the old floating stick kept opening the Dock and app switcher). The 💥 button also doubles a Rubber Bumper, so it does something on the starter robot. Four arenas: plain, moving floor saws, fire vents and wall spikes, a pit. Ninety seconds at most. Bolts appear on the floor to collect, and a repair box appears once when he's low. A small aim assist turns his nearest weapon toward a rival he's nearly facing. Word rule as before: knocked out, stopped, sent spinning. Original bots only; say "robot combat", never the trademark.

**The League (`league/`).** Twelve rivals in a row, built from the same parts, each with an exclusive prize: Rusty, Anvil, Pancake, Brick, Whirly, Zip, Pincer, Prickles, Boulder, Shocker, Fang, King Gear. Three stars on King Gear wins the Gold Crown. Any beaten rival can be fought again.

**Economy defaults, for the parent to confirm.**

- He starts with one free fight. A win uses a fight. A loss leaves one more go on that fight, so a first loss always has a rematch.
- First win pays the rival's Bolts (5 to 20) and its prize; each new star 3 more; a rematch win 2; a loss 1; plus what he picked up (at most 8).
- Stars: 1 for a win, 2 with 35% health left, 3 with 70%. A win on time is 1.
- Each loss takes 20% off that rival's health (at most 60%), 15% off its hits (at most half) and 3% off its speed, until he wins.
- Parts cost 3 to 200 Bolts, and a Round pays at most 6.
- Leaving a fight costs nothing and pays nothing.
- A save from the look-only Workshop: Mods refunded as Bolts at their price, Legendaries kept, two fights to start. Save version stays 2.

**Legendaries** stay in the Balance Lock (`workshop/BalanceLock.tsx`, `workshop/lock.ts`), and are never bought or the Goal: Rainbow Paint, Lightning Drum, Dragon Armour, Comet Wheels. Each now waits on the dearest part of its sort (Ocean Fade, Mega Spinner, Gold Shield, Hover Pads) and, except the paint, is a real fight part. Solving one changes no Level, Mastery or Strength.

**Difficulty is measured, not guessed, but only against a script.** `fight/soak.test.ts` plays each rival with a clumsy simulated child and a plausible build for that point: rivals fall to a reasonable build, fights average under 75 seconds, the first rival is a sure thing, and the starter can't beat rivals from Pincer on. A real six-year-old may do better or worse, so `RIVALS` in `league/rivals.ts` is the place to tune. The first report was that the opening fights were too hard, so on 2026-11-05 the first six rivals were softened and the Rubber Bumper raised from 2 to 7 damage, and the soak gained a much clumsier `firstDay` driver, who must beat the first three with the starter.

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
- **Answer buttons are never read out** (the parent's call, 2026-11-05: he reads numbers, and hearing all of them only held him up). Weigh-In cards and the Balance Lock's choices stay silent too.
- **Quick Look** stays up 3 seconds after "How many?" has been said, not 2 from the moment it appears, and tapping the cover shows it again as often as he likes. This replaces the research's one 👀 peek: reading the choices aloud had used up the whole look before he could answer.
- **Everything is tap-only.** No drag exists, so nothing depends on one.
- **Voice:** Aria, chained. Clips carry about 1.2 seconds of silence, so Math Bots trims each as it decodes (`numbers/trim.ts`), under the level of a soft consonant so "five" keeps its F. Every piece of a line loads before the first plays, so a chain doesn't stall halfway. The stretched "Niiiine" clips were not made: the voice can't be told to stretch a number.

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
