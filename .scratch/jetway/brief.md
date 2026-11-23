# Brief: Jetway (two-digit adding and taking away; build an airport and fly from it)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Jetway. Slug: `jetway`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. In math the next step is the centre of second grade: adding and taking away two-digit numbers when a ten has to be carried or borrowed, and numbers past 100 (Common Core 2.NBT.A.1, 2.NBT.A.4, 2.NBT.B.5, 2.NBT.B.8). Math Bots' Big Jumps stops at `28 + 5` and `46 + 20`, with totals under 100. Jetway starts there.

He likes building airports, so the airport is the reward. An airport is also full of honest two-digit numbers: passengers boarding, bags coming off, seats on a jumbo.

## What he learns

Start the research from 2.NBT.A.1 to A.4 and 2.NBT.B.5 to B.9, and the matching TEKS Grade 2 strand, the way `.scratch/math-bots/research/first-grade-math.md` did. Read Math Bots' Big Jumps, Tens and Ones, Number Chart and Over Ten first, in the code as well as the spec, so that Level 1 here begins where their Level 3 ends and no kind repeats one of them.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Boarding** `add`: two groups of passengers board one plane | start | no carrying (`34 + 25`) | carrying a ten (`38 + 25`), totals under 100 | totals past 100 (`67 + 58`) |
| **Jumbo** `hundreds`: seats in blocks of a hundred, rows of ten and single seats | start | read the blocks: 2 hundreds, 4 tens, 3 ones is which number (to 199, then 999) | "Which digit is the tens?" and numbers with a zero (`306`, `340`) | which plane holds more: compare two three-digit numbers, then pick <, > or = |
| **Unload** `take`: bags come off a plane | Boarding L2 | no borrowing (`57 - 23`) | borrowing a ten (`62 - 17`) | from a round number (`80 - 36`, `100 - 36`), then past 100 (`143 - 28`) |
| **Ten Hops** `hop`: jumps along a runway number line | Jumbo L2 | ten more and ten less than any number to 200 (`93 + 10`, `104 - 10`) | a hundred more and less, to 999 | two hops: `47 + 38` as a jump of 30, then of 8; tap where each lands |
| **Missing Bags** `gap`: some bags are on the belt; how many more to fill the cart | Unload L2 | to the next ten (`38 + ? = 40`) | to a later ten (`38 + ? = 60`) | any two numbers (`38 + ? = 65`) |

How he answers: Boarding, Unload and Missing Bags use number wheels, one for each digit, as Big Jumps does (copy the pattern, don't import it), so he builds the answer and cannot pick it by its last digit. Three wheels appear only when the total can pass 100. Jumbo and Ten Hops use three choices or a tap on the line.

Rules the tests must enforce:

- Each Level's sums match its row: a Level 1 sum never carries or borrows, a Level 2 sum always does, and only Level 3 passes 100.
- No answer is below zero, and nothing passes 999.
- Where there are choices, exactly one is right. The wrong ones are the real mistakes: the ten not carried (`38 + 25 = 53`), both columns written down (`513`), the smaller digit taken from the bigger in each column (`62 - 17 = 55`). Number choices are not sorted with the right one in the middle (Math Bots research, section 6.3).
- About one sum in four is written with the answer on the left (`? = 38 + 25`), as Big Jumps does.
- Sums are written across, never stacked in columns. The column method is a third-grade expectation, and the blocks teach the idea better.
- The < and > signs are only asked if he has met them in Turbo Tally or in a short spoken introduction here.

## Teaching a miss

Every lesson uses the same picture: hundreds flats, tens rods and ones, drawn as seat blocks.

- **Boarding:** both numbers become rods and ones. The ones slide together, ten of them snap into a new rod, and the rod moves over to the tens. "Eight and five make thirteen. That is one ten and three ones."
- **Unload:** when there are not enough ones, a rod breaks into ten ones first. "You need to take seven, and there are only two. Break a ten."
- **Jumbo:** the number is built block by block, hundreds first, and each digit lights as its blocks land.
- **Ten Hops:** the hop is drawn on the line and the tens digit ticks up by one while the ones digit stays still.
- **Missing Bags:** the line hops to the next ten, then to the target, and the two hops are added.

A second miss gets the fuller lesson: the same sum walked through one step at a time, with him tapping to move each step on.

## Voice

He reads numbers, so sums and number buttons are not read out (the parent's call for Math Bots). The short story that frames a sum is spoken once: "38 people are on the plane. 25 more get on." New clips: the kind names, the airport's part and plane names, and the words hundred, tens and ones.

Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS` and its "You need about 140 more Bolts" wording). Copy that pattern.

## The reward: the Airport, the Flight and the Routes

He wants to build an airport, so the building is the main reward and the flying shows it off. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Flight. Bolts buy airport pieces and planes. A Flight to a place he has not been opens the next Route.
- **The Airport (from above).** A wide plot that starts as one grass strip and a shed. He buys pieces and they appear in their places: runways (grass, then tarmac, then a long one, then a crossing pair), taxiways, the terminal in stages, gates with jet bridges, the control tower, hangars, the fire station, the fuel farm, radar, a cargo apron, a car park, a hotel, a monorail, runway lights, a de-icing pad, a helipad and a seaplane dock. Pieces go in fixed places, so the layout always works. He chooses the order and the colours.
- **Pieces matter.** A longer runway lets bigger planes use it. Each gate holds one more parked plane. The tower opens night Flights, the de-icing pad opens snowy Routes, the seaplane dock opens island Routes and the cargo apron opens cargo Flights.
- **The fleet.** A two-seater to start, then a crop duster, a floatplane, a helicopter, a turboprop, a regional jet, a cargo plane, a private jet, a jumbo, a double-decker, a water bomber and a supersonic jet. Each has paint, tail art and a name he picks.
- **The Flight (action, 2D canvas, about a minute).** From above, he leads the plane from its gate along the taxiway with a held finger, as in the Math Bots fight (`src/math-bots/fight/` is the pattern to copy, not import). On the runway the view turns to the side: he holds the throttle, and the plane lifts when it is fast enough. A short cruise collects stars among clouds. Then he follows a line of lights down to the runway at the other end.
- **It cannot be failed.** Leaving the taxiway only slows him on the grass. A landing that comes in too high goes round once and then lands itself. Nothing collides.
- **Routes.** Twenty-four places to fly to, each with its own little airport and weather: the beach, the mountains, an island, a snowy town, a desert strip, a big city at night.
- **Show off.** "Watch it run": his airport working by itself, with his own planes landing, taxiing to his gates and leaving again, the fuel truck and the bag carts going about. More pieces mean more traffic. This is the screen he will show people.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 60 airport pieces, 12 planes, 30 paints, 24 tail arts, 24 Routes, ground vehicles, signs and lights, and trophies. Economy defaults for the parent to confirm: one Flight per Round, the first Flight free; the first new piece within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Flight, Route, Gate, Fleet) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Charter Flights, made on the spot.** Once the first Routes are flown, a Charter is always on offer. Each one is generated from its number: how far, what weather, what wind, day or night, and a new little airport at the far end laid out from parts. The same number always gives the same Charter. Each is a little longer or windier than the last, and every fifth one brings back a Charter-only prize (a tail art, a runway light colour, a sign) that is never sold.
- **The airport keeps growing.** After the fixed pieces, he can always buy another concourse on the terminal, another gate, another hangar or another stretch of runway. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **Liveries made from parts.** A plane's paint is a base colour, a stripe pattern, a tail art and a trim colour, each chosen separately, so thirty paints and twenty-four tail arts give thousands of planes. Let him name his airline and put its mark on everything.
- **The passenger counter.** Every Flight adds its passengers to a running total on the terminal's big board, with a new airport rank at each milestone (Airstrip, Airfield, Airport, Hub, and on without end). The numbers are three-digit and then bigger, which is the game's own subject.
- **Competition, if it is built:** an Air Race round pylons against rival pilots, tuned by the guide's rules, plus his own best time on every Route. The airport itself needs no rival.

## Look

Airport colours: tarmac grey, runway white, taxiway yellow, sky blue and a high-visibility orange. Signs look like airport signs: yellow on black, with big numbers. Everything is drawn in code, and the plane at the gate is the plane he flies. Icon: a jet bridge meeting a plane's door, with a plus sign on the tail.

Keep it apart from Time Flies and Sky Writer, which are about one plane he owns. Here the airport is the thing he builds, and the planes are its fleet.

## Risks

- Number wheels for three digits may be slow or fiddly for small hands. Try them on the iPad 9 before settling; the fallback is a number pad.
- The step from Level 1 to Level 2 (carrying and borrowing) is the hardest thing on the site so far. If he stalls, add Stretch inside Level 2 with the blocks left on screen, rather than a new Level.
- "Watch it run" is many moving pieces: planes, trucks and carts. Cap them so it holds 60 fps on the iPad 9.
- The Flight changes view from above to the side. If the change confuses him, keep the whole Flight from the side and make the taxi a short straight roll.
