# Brief: Plow Patrol (solids, liquids and materials; clear the snow and build a mountain town)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Plow Patrol. Slug: `plow-patrol`. The name is a working name for the parent to confirm.

## Why this game

Second-grade physical science is about stuff: what things are made of, what each material is like, which one suits a job, what heating and cooling do and whether the change can be undone (NGSS 2-PS1-1 to 2-PS1-4). Deep Light touches one property, whether light gets through. Nothing else on the site covers matter.

Snow is the friendliest way in. He already knows that snow melts, that water freezes, that a mitten keeps a hand warm and that a road needs gritting. A snowplow gives him a big machine to drive, and the site has no winter game.

## What he learns

Start the research from NGSS 2-PS1-1 to 2-PS1-4 and K-PS3-1, and the matching TEKS Grade 2 matter strand, and confirm the exact standard numbers there rather than from memory. Record which standard each kind serves. Read Deep Light's kinds in the code first, so What It's Like leaves see-through and shiny to that game.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Solid or Liquid** `state`: what kind of stuff it is | start | sort two: a rock and a glass of milk | sort four, and "Which one takes the shape of its cup?" | gas as well: the air in a balloon, the steam from a kettle |
| **What It's Like** `property`: hard, soft, bendy, stiff, rough, smooth | start | tap the soft one; tap the bendy one | sinks or floats; soaks up water or keeps it out | two things at once: "Tap the one that is hard and smooth." |
| **Right Stuff** `job`: the best material for a job | What It's Like L2 | which would you make a raincoat from: rubber, paper or wool | why: "A window is glass because it is..." | what would go wrong: a paper umbrella, a chocolate kettle |
| **Melt and Freeze** `change`: heating and cooling | Solid or Liquid L2 | what happens to an ice cube in the sun; to water in the freezer | can it change back: ice and water can, a baked cake and burnt toast cannot | warm it or cool it: which do you do to turn this into that |
| **Warm and Cold** `warm`: where things warm up and what keeps heat in | Melt and Freeze L2 | which snowman melts first: the one in the sun or the one in the shade | which keeps your hand warm: a wool mitten or a paper bag | which keeps the ice cube frozen longest: a cooler, a plate or a pan |
| **Pieces** `pieces`: one set of pieces makes many things | Right Stuff L2 | these blocks made a wall; which of these did the same blocks make | which pile of blocks made this fort | which one could these blocks not make |

Build the content as tables in `src/plow-patrol/stuff/`, free of game code: things with what they are made of and their properties, jobs with the property each needs, and changes with whether they can be undone.

Rules the tests must enforce:

- A question can only offer what the table says is plainly right or plainly wrong.
- **Solid or Liquid leaves out everything that is argued about**: sand, salt and sugar (a pile of small solids that pours), toothpaste, jelly, slime, honey, dough, foam, clouds and fire. A rock, a spoon, a brick and ice are solids. Water, milk, juice and oil are liquids.
- Sink or float uses things that always do one or the other: a stone, a coin, a key; a cork, a stick, a rubber duck. No boats, no oranges, no eggs.
- Melt and Freeze keeps to changes with one honest answer. Ice and water, wax, chocolate and butter melt and set again. A baked cake, a fried egg, burnt wood and popped corn do not go back.
- Pieces questions can be checked by counting: the right answer uses every piece once, and each wrong one is short of a piece or has one over, in a way he can see.
- Right Stuff wrong answers fail for the property the question is about, not for some other reason.

## Teaching a miss

Show it happen.

- **Solid or Liquid:** each thing is tipped into a cup. The rock keeps its shape and the milk takes the cup's.
- **What It's Like:** a hand presses, bends or drops it into water, and the word is said as it happens.
- **Right Stuff:** both are tried. The paper raincoat goes soggy and the rubber one sheds the rain.
- **Melt and Freeze:** the change plays, and then the other way if it can go back. For the cake: "You cannot take the eggs back out."
- **Warm and Cold:** both sit side by side while a clock runs, and one melts first.
- **Pieces:** the thing comes apart into its blocks, and the blocks rebuild the answer one at a time.

A second miss gets the fuller lesson: he does it himself with a finger, tipping, pressing or warming, and the voice says what he is seeing.

## Currency: Snowflakes

The whole town is under snow, and clearing it is his job. He earns Snowflakes and spends them at the depot on plows, machines and buildings.

- One Snowflake, many Snowflakes. Add `SNOWFLAKE` to `src/currency/kind.ts`.
- The icon is a six-armed snowflake in pale blue and white with a dark blue outline, bold enough to read at 34px.
- When a Round ends, snowflakes drift down from the top of the screen and settle on the pile one at a time, each with a soft bell.
- Snowflakes are never money, and nobody in the town pays him.
- The word is long. Check that "You need about 140 more Snowflakes" fits its button on a sideways phone, and listen to the clip.

## Voice

Every question is spoken. Answer pictures are not read out. New clips: the kind names, the property words, the materials, the machines and the town's buildings. The currency lines are recorded with "Snowflakes" (see the build guide's "Currency").

## The reward: the Run, the Fleet and the Town

He drives the plows that dig a mountain town out of the snow, and the town grows as its roads open. Flat 2D, from above.

- **The loop.** A finished Round earns Snowflakes and one Run. Snowflakes buy machines, parts and buildings. A Run along a road he has not cleared opens the next one.
- **The Run (action, 2D canvas, from above, about a minute).** He leads the plow with a held finger, as in the Math Bots fight (`src/math-bots/fight/` is the pattern to copy, not import). Snow rolls off the blade to the side, and a clean black road is left behind. Along the way he frees a stuck car, pushes a drift off a bridge, grits an icy bend and reaches the cabin at the end, where the lights come on.
- **It cannot be failed.** Deep drifts only slow the plow. Trees, rocks and parked cars bump it. Nobody is ever in danger.
- **The Fleet.** A pickup with a blade to start, then a road plow, a grit truck, a snow blower, a snowcat that grooms the ski slope, a snowmobile, a tow truck, a rescue sled, a loader and an icebreaker boat for the lake. A wider blade clears a wider stripe, a blower throws snow clear over a wall, and the icebreaker opens Runs across the lake.
- **The Town.** It starts as a depot and one cabin. As roads open, places appear for him to build: houses, a bakery, a school, a ski lift, an ice rink, a lodge, a fire tower, a lighthouse on the lake and a train station.
- **The Square.** He builds snowmen and a snow fort from parts, in the middle of town.
- **Show off.** "Watch the town": snow falling, lights on, his machines out on the roads, skaters on the rink. More buildings mean more going on.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 14 machines, 50 parts (blades, lights, tracks, cabs, horns), 30 paints, 50 buildings and pieces for the town, 24 roads, 40 pieces for snowmen and the fort, flags, drivers and their hats, and trophies. Economy defaults for the parent to confirm: one Run per Round, the first one free; the first new thing within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Body, Slot, Mod, Goal) and add the new ones (Snowflake, Run, Fleet, Town, Square) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **It snows again.** After the fixed roads, a Storm Run is always on offer. Each one is generated from its number: the road's bends, the drifts, what is stuck, the ice, day or night. The same number always gives the same Run, each is a little longer, and a test checks that every one can be finished. Every fifth Storm Run gives a part that is never sold.
- **The town has no last street.** He can always buy another street with new plots on it. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **Snowmen made from parts.** Body, hat, scarf, nose, arms and face are chosen separately, so the Square never has to hold the same one twice.
- **Machines with ranks.** Blade, engine and lights can each be improved again and again, with smaller gains each time.
- **The snow counter.** Every Run adds to the miles of road he has cleared, with a new rank at each milestone and no last one.
- **Competition:** none against a rival. His quickest time on each road is enough.

## Look

Deep blue shadows on white snow, black roads, and warm things against the cold: orange plows, yellow windows, red hats. Snow should look thick enough to push. Icon: an orange plow blade pushing a curl of snow with a snowflake above it.

Keep it apart from Storm Chaser, which is about weather: why it snows and how cold it is. This game is about what things are made of, and the snow is just the stuff he works with.

## Risks

- States of matter have more arguable cases than any other topic on the site. The left-out list above is the start. Every row needs a second read, and when unsure, leave it out and list it in the report.
- Salt melting ice is true and is why roads are gritted, but why it works is far past second grade. Keep gritting in the reward as a thing plows do, and out of the questions unless the research supports a plain version.
- Pieces is the hardest kind to make fair on a small screen. If counting blocks at a glance does not work, cut the kind and say so.
- Clearing snow has to feel good or the Run is a chore. The stripe behind the blade, the sound and the snow rolling off matter more than the route.
- Drawing snow as many moving pieces will be slow on the iPad 9. Draw it as a covering that is wiped away, not as particles.
