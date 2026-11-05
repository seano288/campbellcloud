# Spec: Math Bots (first-grade math, robot-combat reward)

Status: first playable stage live and unlisted (e05942d, 2026-11-04); the Workshop is still a placeholder, fight not integrated yet.

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
earns no Mastery credit, in this game only; Bolts use the shared currency. The offline budget (about 50 MB) and how much fight
per Round are still open.

## Kinds

Three Levels each, using Stretch inside a Level for number size.

**First release (9):** Make Ten `ten`, Count On `on`, Bot Stories `story`, Facts `facts`, Tens and Ones `tens`, Skip Count `skip`,
Missing Part `part`, Weigh-In `scale`, Over Ten `over`.

**Next (4):** Number Chart `chart`, Big Jumps `jump`, Measure It `measure`, Shapes `shape`.

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

## Unlock order

As `research` 5.1, plus Skip Count, which opens at Count On Level 2 (extends counting) and which placement can reach only through Count On.

| Kind | Opens |
|---|---|
| Make Ten, Count On, Bot Stories | At the start |
| Facts, Tens and Ones | Make Ten L2 |
| Missing Part, Skip Count | Count On L2 |
| Weigh-In | Missing Part L2 |
| Over Ten | Make Ten L3 and Tens and Ones L2 |

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

## Not yet generated

The Bot Stories Scoreboard (needs its chart screen) and per-fact Strength for Facts (`makeFacts` takes the pool it should draw from,
so the learning layer can add this). Both belong with the learning layer.

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

