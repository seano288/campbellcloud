# Brief: Big Air (measuring length; build a stunt arena and jump a monster truck)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Big Air. Slug: `big-air`. The name is a working name for the parent to confirm.

## Why this game

Math Bots' Measure It lays wrenches end to end, which is where first grade stops. Second grade moves to real units and real tools: a ruler in inches and centimetres, estimating, saying how much longer one thing is than another, and lengths on a number line (Common Core 2.MD.A.1 to A.4, 2.MD.B.5 and B.6). Nothing on the site teaches this.

A stunt jump is a measurement. The first thing anyone asks is how far it went. Here the skill and the reward are the same subject, which few of the other games manage.

## What he learns

Start the research from 2.MD.A.1 to A.4, 2.MD.B.5, 2.MD.B.6 and 1.MD.A.2, and the matching TEKS Grade 2 measurement strand, the way `.scratch/math-bots/research/first-grade-math.md` did. Read Math Bots' Measure It and Number Chart in the code first, so Level 1 here begins where Measure It Level 3 ends. Read Carrier Deck's story kinds as well, so Length Stories does not repeat them.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Ruler** `ruler`: read a length off a ruler | start | the thing starts at zero; whole inches up to 6 | up to 12 inches, then centimetres up to 20 | the thing does not start at zero (it runs from 2 to 7) |
| **Best Guess** `guess`: estimating, and choosing the unit | start | which is longer in real life: a bus or a bike | "About how long is a truck: 2 feet or 20 feet?" | inches or feet: which would you use for a crayon, and for a ramp |
| **How Much Longer** `longer`: compare two lengths | Ruler L2 | two bars on one ruler, both starting at zero | two jumps given as numbers with their bars (14 feet and 9 feet) | two bars that do not line up at the start |
| **Jump Line** `line`: lengths on a number line from 0 to 100 feet | Ruler L2 | tap where 30 is, on a line marked in tens | tap where 34 lands, with ticks for ones | a hop and then another: a 25-foot jump and 12 feet more |
| **Length Stories** `story`: a spoken story about lengths, with the bars drawn | How Much Longer L2 | putting lengths together: "The ramp is 12 feet. He adds a 6-foot piece." | taking away and comparing, within 100 | the start is the unknown: "He added 8 feet and now it is 30 feet long." |
| **Two Units** `units`: the same thing measured two ways | Best Guess L2 | measured in inches and in centimetres: which number is bigger | "It is 3 feet long. Would it be more inches or fewer?" | the same jump measured with a long unit and a short one: match each number to its unit |

How he answers: Ruler and How Much Longer use a number pad or number wheel (copy Jetway's, don't import it), so he reads the ruler instead of picking from three numbers. The others use three choices or a tap on the line.

Rules the tests must enforce:

- Every ruler is drawn with its zero at the first tick, not at the end of the wood, and the ticks are evenly spaced.
- A Level 1 Ruler question always starts at zero. A Level 3 one never does.
- Wrong choices are the real mistakes: the number at the far end when the thing does not start at zero, counting the ticks instead of the spaces (one too many), and reading the nearer wrong unit.
- Best Guess only uses things whose size nobody would argue about, from a hand-checked table. The two choices differ by at least five times.
- Two Units never asks him to convert. Second grade asks only that a smaller unit gives a bigger number.
- Nothing passes 100, and no answer is below zero.

On-screen inches are not real inches. Say so in the spec. The iPad 9's screen density is known, so a true-size ruler is possible there; leave it out of the first build and list it as an open question.

## Teaching a miss

- **Ruler:** the thing slides to zero, then each inch is counted as a hop along the ruler. "Count the spaces, not the lines."
- **How Much Longer:** the shorter bar is laid on the longer one, and the part left over lights up and is counted.
- **Jump Line:** the line fills from zero, ten at a time and then by ones.
- **Best Guess:** the two things are drawn side by side at the same scale, with a child standing next to them.
- **Length Stories:** the bars are drawn end to end or one above the other, as the story says.
- **Two Units:** both units are laid along the thing, and it is plain that more of the small ones fit.

A second miss gets the fuller lesson: the same question walked through one step at a time, with him tapping to move each step on.

## Currency: Bolts

This is a truck garage, so Bolts fit and it keeps them. It is the only brief in this batch that does. Use `BOLT` from `src/currency/kind.ts` as the vehicle games do.

## Voice

He reads numbers, so number buttons are not read out. The units are spoken and written: inch, inches, foot, feet, centimetre, centimetres. "Foot" and "feet" need care, since one is the plural of the other; record "1 foot" and "2 feet" as their own clips. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the Arena, the Jump and the Tape

He builds a stunt arena and a jump truck, and every jump is measured. Flat 2D, from the side.

- **The loop.** A finished Round earns Bolts and one Jump. Bolts buy truck parts, ramp pieces and things to jump over.
- **The Jump (action, 2D canvas, about 40 seconds).** He holds a pedal to build speed down the run-up, lets the truck fly off the ramp, and tilts it in the air with a finger so it lands on its wheels. Then the tape rolls out along the ground from the ramp's lip to the truck, the feet tick up as it goes, and the distance is spoken.
- **It cannot be failed.** A nose-first landing only bounces the truck back on its wheels. Landing on the buses crunches them and still counts.
- **The tape is not a question.** He is never tested in the reward. The tape shows the same ruler he reads in the Rounds, in feet, starting at zero.
- **The truck.** Body, engine, tires, springs, a booster and paint. A bigger engine gives more speed on the run-up, springs soften a landing, and the booster gives one push in the air.
- **The ramp.** Bought in pieces. A longer or steeper ramp throws him farther, and each piece shows its length in feet.
- **The row.** What he jumps over: cars, then buses, a fire ring, a pool, a row of rival trucks, a parked plane. Clearing a row opens the next.
- **Show off.** The Record Board lists his longest jumps in feet, and "Watch it" replays his best one.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 16 bodies, 60 parts, 30 ramp pieces, 40 things to jump, 40 paints and decals, 24 arena pieces (stands, lights, fireworks, a big screen), drivers, horns and trophies. Economy defaults for the parent to confirm: one Jump per Round, the first one free; the first new part within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Body, Slot, Mod, Goal) and add the new ones (Jump, Tape, Row, Record Board) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **His longest jump.** A personal best has no ceiling, and it is a number in the game's own unit. Cheer every new record and keep the last ten on the board.
- **Shows made on the spot.** After the first rows, a Show is always on offer. Each one is generated from its number: what is in the row, how long it is in feet, the wind, day or night. The same number always gives the same Show, each is a little longer than the last, and a test checks that each can be cleared with a truck he could own by then. Every fifth Show gives a prize that is never sold.
- **The arena keeps growing.** He can always buy another block of seats, and the crowd gets bigger and louder. The price rises gently and then stays flat.
- **Parts with ranks.** Engine, springs and booster can each be tuned again and again, with smaller gains each time.
- **Paint made from parts.** A base colour, a pattern, a decal and a trim, each chosen separately.
- **Competition, if it is built:** a Long Jump contest against rival trucks, tuned by the guide's rules. His own record needs no rival.

## Look

A night arena: dirt brown, floodlight white, a dark crowd with camera flashes, and the truck in loud colours. The tape is yellow with black numbers, like a real one. Icon: a truck in the air over a ruler.

Keep it apart from Monster Truck Money, where the truck is built and shown in a garage. Here the truck is a tool for the jump, and the arena is the thing he builds. The two games do not share a save.

## Risks

- Reading a ruler on a small screen needs big, clear ticks. Lay out the sideways phone first.
- A number pad for answers is new to this kind of question. If it is slow for him, fall back to four choices built from the real mistakes.
- The jump's distance must feel fair. If the same truck gives very different distances for reasons he cannot see, the record stops meaning anything. Keep the physics simple and the same every time.
- Tilting in the air may be hard for small hands. If so, let the truck level itself and make the pedal timing the only skill.
- Feet in the reward and inches on the ruler are different units. That is true to life and is what Two Units teaches, but watch for confusion and report it.
