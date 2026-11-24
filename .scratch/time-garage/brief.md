# Brief: Time Garage (long ago and now, order and timelines; restore and drive vehicles from every age)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Time Garage. Slug: `time-garage`. The name is a working name for the parent to confirm.

## Why this game

The site has no history. In first and second grade the history strand is not dates and kings. It is the idea of time passing: telling long ago from now, putting things in order, reading a timeline, and seeing how an invention changed the way people live (the TEKS Grade 2 history strand and the C3 Framework's K-2 history indicators).

He loves vehicles, and vehicles are a timeline he already half knows: the wagon came before the train, the train before the car, the car before the jet. A museum of machines he restores himself gives history a reason.

## What makes this game different

Like Wild Rescue, this game asks about facts, so it runs on a curated table that must be true. Here every row also has a date. Copy the shape of `src/wild-rescue/facts/`.

## What he learns

Start the research from the TEKS Grade 2 history strand and the C3 Framework's K-2 history indicators (D2.His), and confirm the exact standard numbers there rather than from memory. Read Time Flies' days and months kinds in the code first, so Time Words does not repeat the calendar it already teaches.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Then or Now** `then`: telling long ago from today | start | two pictures: which is from long ago (a candle and a lamp, a horse cart and a car) | sort four onto two shelves, Long Ago and Now | match the old thing to what does its job today |
| **In Order** `order`: oldest to newest | start | a life in three pictures: baby, child, grown-up | three vehicles far apart in time: wagon, steam train, jet | four of one family: a penny-farthing, an old bicycle, a mountain bike, an electric bike |
| **Time Words** `words`: the words for when | Then or Now L2 | yesterday, today and tomorrow, on a strip of three days | past, present and future: sort three sentences | long ago, last year, next year; before and after |
| **Timeline** `line`: reading a line of time | In Order L2 | a line of his own day or year: what came first, what came after lunch | a line marked 1800, 1900 and 2000: which came first, the train or the plane | place a new vehicle on the line: before 1900, or after |
| **What Changed** `change`: what an invention did | Timeline L2 | before planes, how did people cross the sea | what did this let people do: the telephone, the light bulb, the train | same and different: a school long ago and a school now |
| **Famous Firsts** `first`: people and machines that came first | What Changed L2 | who or what is this, from two choices | match the first to its picture | which came first, of two firsts |

Build the content as tables in `src/time-garage/history/`, free of game code: vehicles and inventions with their year, their era, what they replaced and what they made possible, and one true "did you know" line each.

Rules the tests must enforce:

- A question can only offer what the table says is plainly right or plainly wrong.
- **In Order and Timeline only compare things at least thirty years apart** at Levels 1 and 2, and at least fifteen at Level 3. He is learning order, not dates.
- He is never asked to read or recall a year. Years are marked on the line in hundreds and spoken by the voice. Four-digit numbers are past what Jetway teaches.
- Then or Now uses only pairs nobody would argue about. Nothing that is still in common use (a bicycle, a sailing boat, a steam train on a holiday line) is called "long ago" without its modern partner beside it.
- Famous Firsts uses the claim a school book would make, worded so it is true: "the first powered aeroplane flight", "the first people on the Moon". Where a first is disputed (the first car, the first steam engine), say "one of the first" or leave it out.
- What Changed never says the old way was bad or that people long ago were less clever.
- A fact is not asked again until at least twenty others have been.

## Teaching a miss

- **Then or Now:** the old thing and the new one are shown doing the same job, side by side. "Long ago, people lit a candle. Now we switch on a lamp."
- **In Order:** the pictures slide onto a line one at a time, oldest first, with "first", "then" and "now" said.
- **Time Words:** the strip of days lights up as each word is said, with a marker on today.
- **Timeline:** the line is walked from left to right, and each thing lights as the walk passes it.
- **What Changed:** a short scene before and a short scene after.
- **Famous Firsts:** the moment itself is shown with its line and its year spoken.

A second miss gets the fuller lesson: the whole line shown with everything he has met so far on it, and the question's things lit.

## Currency: Gears

Every machine in the Garage turns on gears, and so does a clock. He earns Gears and spends them on tools, museum halls and the parts a restoration needs.

- One Gear, many Gears. Add `GEAR` to `src/currency/kind.ts`.
- The icon is a brass gear wheel with eight square teeth and a round hole in the middle. It must not look like the Bolt, which is a yellow hexagon with a round centre. Give it teeth you can count, a darker brass and a wider hole.
- When a Round ends, the Gears roll in along the floor and drop onto the pile, each with a click like a ratchet.
- Gears are never money. Visitors do not pay to come in, and no vehicle has a price in dollars.

## Voice

Every question is spoken. Answer pictures are not read out. New clips: the kind names, the time words, the names of the vehicles and inventions, one "did you know" line each, and the years. A year is recorded whole as people say it ("nineteen oh three", "eighteen twenty-nine"), one clip for each year the table uses, since chaining number clips would give "one thousand nine hundred and three". The currency lines are recorded with "Gears" (see the build guide's "Currency").

## The reward: the Garage, the Restoration and the Drive

He finds old machines, restores them with his hands, drives them and puts them in his museum. Flat 2D.

- **The loop.** A finished Round earns Gears and one Drive. Gears buy tools, halls for the museum and the next find. Each new vehicle is found, restored and then driven.
- **The Find.** A vehicle turns up under a dust sheet in a barn, a boat shed or a hangar. He pulls the sheet off.
- **The Restoration (hands on, about 30 seconds).** He rubs the rust off with a finger, fits the missing parts into their outlines, pumps the tires or fills the boiler, and picks the paint. It cannot be done wrong.
- **The Drive (action, 2D canvas, from the side, about 45 seconds).** He takes it out in its own time and place: a wagon on a dirt track, a steam engine past a water tower, an early car on a cobbled street, a biplane over fields, a hovercraft over waves, a buggy on the Moon. He holds to go, and each machine has one thing of its own to work: the whistle, the crank handle, the sails, the horn.
- **It cannot be failed.** Bumps only jolt it. An old engine may cough and stall, and one tap starts it again.
- **The Garage.** A museum with a hall for each era and each kind: wheels, rails, water, air and space. Every vehicle sits on a stand with its name and its year.
- **The Time Wall.** One long timeline down the main hall. Each restored vehicle takes its place on it, so the wall fills in as he plays. This is the game's subject in the reward, and he is not tested on it.
- **Show off.** "Open day": visitors walk the halls and stop at his machines. Tap one and its "did you know" line is said.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 120 real vehicles across land, rail, water, air and space, 30 tools, 30 paints, 30 pieces for the museum (stands, ropes, lights, signs, a cafe, a gift shop), 24 places to drive, and badges, hats and goggles for the driver. Economy defaults for the parent to confirm: one Drive per Round, the first vehicle free; a new vehicle within two Rounds through the first hour; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Body, Slot, Goal) and add the new ones (Gear, Find, Restoration, Drive, Hall, Time Wall) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Barn Finds, made on the spot.** After the real vehicles, a Barn Find is always on offer. Each is generated from its number: an era, a kind, a body, wheels or wings, a funnel or a tail, and its colours. It is marked plainly as a made-up machine "in the style of" its era, and it goes in its own hall, never on the Time Wall, so nothing invented is taught as history. The same number always gives the same Find, and every fifth one has a part no other has.
- **Drives made on the spot.** After the first places, each Drive's road is generated from its number: the ground, the hills, the weather and what he passes. A test checks that every one can be finished.
- **The museum has no last hall.** He can always buy another, with more stands. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **Vehicles keep their shine.** Each one can be polished and tuned again and again, earning a new plaque (bronze, silver, gold and on) with each few Drives.
- **The visitor counter.** Every Drive brings visitors, with a new museum rank at each milestone and no last one.
- **Competition, if it is built:** an Old Timers' Rally between machines of the same era, tuned by the guide's rules. His own best time on each Drive needs no rival.

## Look

A big old workshop: brick, oiled wood, brass and green enamel, with sun coming through high windows onto dust. Each era has its own colours on the Drive, from brown and cream for the oldest to bright primary colours for now. Icon: a brass gear with a small old car inside it.

Keep it apart from Time Flies, which teaches the clock and the calendar. That game is about what time it is. This one is about how long ago.

## Risks

- A wrong date or a wrong "first" taught to a six-year-old is worse than a missing one. Every row needs a source and a second read. When unsure, leave it out and list it in the report.
- Drawing 120 vehicles in code so that each can be told from the next is the biggest job in this game. Build them from shared parts (wheels, cabs, funnels, wings) and draw twenty first to judge whether they read at a glance.
- "Long ago" means little to a six-year-old, and a hundred years and a thousand feel alike. Anchor the line with people he knows: when he was born, when his parents were small, when his grandparents were small.
- The made-up Barn Finds could blur what is real. Keep them in their own hall with a clear mark, and report how that worked.
- The Restoration could become a chore by the fiftieth vehicle. Vary the steps by kind of machine and keep it under 30 seconds.
- The year clips add to the precache. Report the count and the size against the site's budget of about 50 MB.
