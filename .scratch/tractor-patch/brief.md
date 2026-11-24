# Brief: Tractor Patch (plants and life cycles; run a farm and drive its machines)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Tractor Patch. Slug: `tractor-patch`. The name is a working name for the parent to confirm.

## Why this game

Wild Rescue teaches animals: where they live, what their parts are for and who their babies are. Plants get one corner of its Alive or Not kind. Second-grade life science is mostly plants: what they need, what each part does, how seeds get about and how living things grow and change (NGSS 2-LS2-1, 2-LS2-2 and 1-LS1-1, with a first look at 3-LS1-1).

A farm puts all of it to work, and a farm has tractors.

## What makes this game different

Like Wild Rescue, this game asks about facts, so it runs on a curated table of facts that must be true and unambiguous. Getting that table right is most of the work. Copy the shape of `src/wild-rescue/facts/`.

## What he learns

Start the research from NGSS 2-LS2-1, 2-LS2-2, 1-LS1-1 and 3-LS1-1 and the matching TEKS Grade 2 organisms strand, and confirm the exact standard numbers there rather than from memory. Read Wild Rescue's Alive or Not and Babies in the code first, so What Plants Need starts past the first and Grow in Order does not repeat the second.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **What Plants Need** `need`: sun, water, air and room | start | tap what a plant needs, among things it does not (a hat, a toy) | two pots: which will grow better, the one by the window or the one in the cupboard | what went wrong: a droopy plant, a pale thin one, a crowded pot |
| **Plant Parts** `part`: root, stem, leaf, flower, fruit, seed | start | tap the part that is named | which part does this job: takes in water, holds it up, catches the sun, makes seeds | which part do we eat: carrot, celery, lettuce, broccoli, apple, peas |
| **Grow in Order** `cycle`: how living things change | What Plants Need L2 | seed, sprout, plant: three pictures to put in order | four stages: a bean plant to its pods; egg, tadpole, froglet, frog; egg, caterpillar, chrysalis, butterfly | what comes next, and what came before |
| **Seeds Travel** `travel`: how seeds and pollen get about | Plant Parts L2 | how does this seed travel: on the wind, on fur, in water, eaten by a bird | match the seed's shape to how it travels: wings, hooks, fluff | bees and flowers: what the bee carries, and what the plant can make because of it |
| **Farm to Table** `food`: where food comes from | Grow in Order L2 | from a plant or from an animal: milk, eggs, bread, apples | where it grows: on a tree, on a vine, under the ground | in order: wheat, flour, bread; and when: planted in spring, picked in autumn |

Build the content as tables in `src/tractor-patch/facts/`, free of game code: plants, parts and their jobs, life cycles, seeds and how they travel, foods and where they come from. Each row has one true "did you know" line, as Wild Rescue's animals have.

Rules the tests must enforce:

- A question can only offer what the table says is plainly right or plainly wrong.
- **Soil is not on the list of needs.** NGSS 2-LS2-1 names sunlight and water, and plants can be grown without soil. Soil appears as where roots hold on and find water, never as a wrong or a right answer to "what does a plant need".
- "Which part do we eat" uses only cases nobody disputes. No potato (a stem that grows underground), no onion, no strawberry, no peanut. A tomato is a fruit to a scientist and a vegetable in a kitchen, so it is left out.
- A life cycle is never asked across two kinds of creature in one question, and the stages shown are far enough apart to tell at a glance.
- Seeds Travel gives each seed one way of travelling, the one it is known for.
- A fact is not asked again until at least twenty others have been.

## Teaching a miss

- **What Plants Need:** time speeds up over both pots, and one grows while the other wilts. "It had no light, so it could not grow."
- **Plant Parts:** the part lights up on a whole plant and does its job: water climbs from the roots, the leaf turns to the sun.
- **Grow in Order:** the life plays from the start, one stage at a time, with "first", "next" and "last" said.
- **Seeds Travel:** the seed goes on its journey: the wind lifts it, or the dog walks off with it on its coat.
- **Farm to Table:** the food is followed back to the field or the barn it came from.

A second miss gets the fuller lesson: the whole plant or the whole life shown from start to end, with him tapping to move each step on.

## Currency: Seeds

A farm starts with seeds, and so does every question in this game. He earns Seeds and spends them at the farm store on fields, machines and animals.

- One Seed, many Seeds. Add `SEED` to `src/currency/kind.ts`.
- The icon is a fat striped sunflower seed, black and cream, standing on its point.
- When a Round ends, the seeds pour out of a paper seed packet onto the pile.
- Seeds are what he pays with, not what he plants. Planting a field costs nothing once he owns the field and has picked its crop, so he never has to hold Seeds back.
- Seeds are never money. The farm store shows no prices in dollars, and the harvest is not sold for cash.

## Voice

Every question is spoken. Answer pictures are not read out. New clips: the kind names, the plant parts, the crops, the machines and one "did you know" line for each row of the facts table. The currency lines are recorded with "Seeds" (see the build guide's "Currency"). Listen to "1 Seed" and "5 Seeds" early, since short words go wrong.

## The reward: the Farm, the Job and the Fair

He builds a farm and drives its machines. Flat 2D, from above.

- **The loop.** A finished Round earns Seeds and one Job. Seeds buy fields, machines, buildings and animals. Every crop on the farm grows one stage each Round.
- **Fields.** He buys a field, picks its crop (corn, wheat, pumpkins, sunflowers, carrots, strawberries, apples in an orchard) and watches it go from bare earth to sprouts to a full crop over several Rounds. Growth is tied to Rounds, so it cannot be bought out early.
- **The Job (action, 2D canvas, from above, about a minute).** One piece of field work, whichever is due: plough, sow, water or harvest. He leads the tractor or the combine with a held finger, as in the Math Bots fight (`src/math-bots/fight/` is the pattern to copy, not import), and the field changes behind it in a satisfying stripe. Then he tips the load into the barn or the truck.
- **It cannot be failed.** Missed patches are finished by a helper at the end. Fences, ponds and hay bales only bump the tractor.
- **Machines.** A small tractor to start, then a plough, a seeder, a sprayer, a big tractor with double wheels, a combine, a baler, a grain truck, a pickup, a quad bike, a digger and a hay loader. Bigger machines cut a wider stripe. Each has paint and a name.
- **The yard.** A barn, a silo, a chicken house, a cow shed, a pond with ducks, a windmill, a greenhouse, a farm shop and a dog that rides in the cab.
- **The Fair.** Every fifth Round is the county fair. His best pumpkin is put on the scale and its weight is said, he parades a tractor and he wins a ribbon whatever happens. His heaviest pumpkin ever is kept on a board in the barn.
- **Show off.** "Watch the farm": everything growing and working by itself.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 30 crops, 30 machines and tools, 40 buildings and pieces for the yard, 30 animals, 40 paints and decals, 20 scarecrows, 30 pieces of fencing and decoration, hats for the dog, and ribbons. Economy defaults for the parent to confirm: one Job per Round, the first one free on a starter field; the first new thing within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Goal) and add the new ones (Seed, Field, Crop, Job, Fair, Ribbon) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **The farm has no fence.** He can always buy the next field. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **The growing never stops.** Because crops grow with Rounds, there is always something that has changed when he comes back, and always a Job due.
- **New kinds of crop, made on the spot.** A harvest sometimes turns up a strange seed. Planted, it grows a new variety put together from parts: its colour, shape, size and pattern (a striped purple pumpkin, a giant blue sunflower). Each is generated from its number, the same every time, and there is no last one.
- **Jobs made on the spot.** After the first fields, each Job's field is generated from its number: its shape, its rocks, ponds and trees, and the weather. A test checks that every one can be finished.
- **The pumpkin record.** His heaviest pumpkin is a personal best with no ceiling, helped a little by each thing he adds to the pumpkin field (a better sprayer, a bee hive, a scarecrow).
- **Competition, if it is built:** rival farmers at the Fair, tuned by the guide's rules, so that he wins the blue ribbon about two times in three and is never last. His own record needs no rival.

## Look

A storybook farm: barn red, tractor green, wheat gold, earth brown, under a big pale sky. Fields are striped by whatever machine last crossed them. Icon: a tractor seen from the front with a sprout growing from a seed on its bonnet.

Keep it apart from Wild Rescue. That game goes out to wild animals in wild places. This one stays home, and the living things here are the ones he grows.

## Risks

- A wrong fact taught to a six-year-old is worse than a missing one. Every row of the table needs a source and a second read. When unsure, leave it out and list it in the report.
- Plant biology is full of cases that sound simple and are not (which part of a plant a food is, what a plant "needs"). The rules above name the traps found so far; the research will find more.
- Waiting several Rounds for a crop could feel slow. The first field should be ready to harvest by the third Round, and there should always be more than one field at different stages.
- Leading a wide combine up and down a field may be dull or fiddly. Try it on the iPad 9 early; the fallback is a machine that follows the rows by itself while he steers only the turns.
- Many growing plants drawn at once may be slow. Draw each field as one picture for its stage, not as hundreds of plants.
