# Brief: Turbo Tally (comparing, ordering and graphs; build a race car and race it)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Turbo Tally. Slug: `turbo-tally`. The name is a working name for the parent to confirm.

## Why this game

He asked for it: a game where he builds race cars and then races them. It also fills the one first-grade math strand the site doesn't teach. Math Bots covers adding, taking away, place value, measuring and shapes. Nothing covers comparing two-digit numbers (Common Core 1.NBT.B.3), places in a line (first, second, third), tallies, or reading picture and bar graphs (1.MD.C.4). A race day uses all of them.

## What he learns

Start the research from 1.NBT.B.3, 1.MD.C.4 and 1.OA.A.2, and the matching TEKS Grade 1 data strand, the way `.scratch/math-bots/research/first-grade-math.md` did. Check Math Bots' Weigh-In, Number Chart and Facts first so no kind repeats one of them.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Podium** `place`: cars in a line heading for the finish | start | 3 to 5 cars, "Tap the car in second place" (first to fifth) | up to ten cars; "What place is the green car in?" with three written choices (1st, 2nd, 3rd) | "The red car passes one car. What place is it in now?" and "...is passed by one car" |
| **Faster Car** `more`: two cars, each with a speed number | start | numbers to 20, far apart; tap the faster car | two-digit numbers, different tens, then the same tens | swapped digits (14 and 41); then pick <, > or = to go between them |
| **Tally Board** `tally`: tally marks on a pit board | Podium L2 | read a tally to 10, three number choices | read a tally to 30, bundles of five | make the tally for a number (tap to add marks, then ✓), or pick which tally shows 17 |
| **Race Chart** `chart`: wins for three cars | Faster Car L2 | picture graph: "Which car won the most?" / "the fewest?" | bar graph with numbers up the side: "How many did blue win?" | "How many more did blue win than red?" and "How many races in all?" (totals to 20) |
| **Line Up** `order`: three numbers on three cars | Faster Car L2 | numbers to 20, tap them smallest to biggest | two-digit numbers; biggest to smallest as well | "Which number goes between 38 and 52?" three choices |
| **Three Laps** `three`: three lap scores to add | Race Chart L2 | three numbers, total to 10 | total to 20 | two of the three make a ten (4 + 6 + 3) |

Rules the tests must enforce:

- Exactly one choice is right, in every kind.
- Podium cars are told apart by colour and a symbol on the roof (star, bolt, flame), never by a number: a number on a car would be read as its place. The finish line and the direction of travel are always drawn, and no two cars are level.
- Faster Car never shows equal numbers unless the question is the = one. The < and > signs are met before they are asked (a short spoken introduction: the open side faces the bigger number).
- Race Chart at Level 1 has a clear winner and a clear loser, each by at least two. "How many more" never has an answer of zero. Every graph has exactly three cars.
- Tally Board marks are always in bundles of five with the fifth across.
- Number choices are not sorted with the right one in the middle (see the Math Bots research, section 6.3).
- Drop Three Laps if the check against Math Bots shows it is already taught there.

## Teaching a miss

- **Podium:** the cars count off from the front, each lighting as its place is said: "First, second, third."
- **Faster Car:** both numbers turn into tens rods and ones. "41 has four tens. 14 has one ten. 41 is more." For the signs, the sign opens toward the bigger number.
- **Tally Board:** the bundles are counted by fives, then the loose marks by ones.
- **Race Chart:** the columns are counted. For "how many more", the two columns pair off and the ones left over light up.
- **Line Up:** the numbers drop onto a number line.
- **Three Laps:** the ten is made first, then the third number is added on.

## Voice

He reads numbers, so number buttons are not read out (the parent's call for Math Bots). New clips: the ordinal words first to tenth, the colour and symbol names, and the kind names. Prices stay at 100 or less.

## The reward: the Garage, the Race and the Cups

His feedback on Math Bots decides the shape: he wants to build from different parts, the parts must change what happens, and he does the driving. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Race. Bolts buy parts. A Race against a Cup's rival wins that rival's part and opens the next track.
- **The Garage.** A bare chassis seen from above and from the side. Slots: Body, Engine, Tyres, Wing, Booster, Paint, Rims, Decals, Horn, Boost Flame, and his own race number (free, picked on two wheels like the Door Number in Monster Truck Money). Three bars with a number each: Speed, Grip, Boost. The numbers are real and change as he fits parts, so the Garage quietly practises Faster Car.
- **Parts matter.** The Engine sets top speed. The Wing and Tyres set how fast he can take a corner. Tyres also suit a surface: slicks on tarmac, knobbly on dirt, studded on snow, paddle on sand. The wrong tyre only slides wide; it never stops him. The Booster sets how many boosts he gets per Race.
- **The Race (action, 2D canvas, from above).** Three laps, about a minute, against three computer cars. The car drives forward by itself. A held finger leads it, as in the Math Bots fight (`src/math-bots/fight/` is the pattern to copy, not import). One big Boost button. Hitting a wall or a car only bounces him. Rivals ease off when he is far behind. Every Race ends with a results board that says the places aloud.
- **It cannot be failed.** Every finish is cheered and gives him a go at the next thing. He wins a rival's part by finishing ahead of that one rival, not by coming first. A rival who beats him gets a little slower each time until he wins, as Math Bots' League does.
- **Cups.** Six Cups of four tracks: tarmac, dirt, sand, snow, night city, volcano. Each track is data (a centre line and a width), so more can be added cheaply.
- **Show off.** The trophy shelf, his car on the podium, and a "Watch it go" replay lap.
- **Later, not in the first build:** a track builder where he lays his own circuit from pieces.

Plan for about 160 things to earn from the first build, because he emptied Rover Code's ladder in a day: 12 bodies, 8 engines, 8 tyres, 8 wings, 8 boosters, 24 paints, 12 rims, 20 decals, 10 horns, 10 boost flames, 16 rival parts, 24 tracks and 6 Cup trophies.

Economy defaults for the parent to confirm: one Race per Round, the first Race free; the first new part within two Rounds; no price over 100 Bolts.

Use the glossary's words where they already fit (Body, Slot, Mod, Rung, Goal) and add the new ones (Race, Cup, Rival, Track) to `GLOSSARY.md`.

## Look

Race-day colours: tarmac grey, chequered black and white, signal red and a bright pit-lane yellow. Cars are drawn in code from the fitted parts, and the car in the Garage is the car on the track. Icon: a race car from above crossing a chequered line, with tally marks as its skid.

## Risks

- How the steering feels on the iPad 9. This decides whether the game is fun, and it can only be judged on the device. Build the Race first, with one track and a plain car, and get it into his hands before building the Garage's content.
- Rival pacing. Too fast and he never wins a part; too slow and there is no race. Keep the tuning in one table.
- Podium's pictures. A line of cars must read the same way every time (which end is the front), or the question is ambiguous.
- Three computer cars, skid marks and boost flames at 60 fps on the iPad 9. Cap the particles.
