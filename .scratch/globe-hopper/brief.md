# Brief: Globe Hopper (continents, oceans and landforms; build a rocket base and see the world from orbit)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Globe Hopper. Slug: `globe-hopper`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. Treasure Fleet taught him to read a small map: directions, a key and a grid. The next step in geography is the whole world: the globe, the seven continents, the five oceans, the equator and the poles, and the main shapes of the land (the geography strand of second-grade social studies in most states).

The parent chose a rocket base for the reward. It fits the subject: from orbit he looks down on the real Earth, and the places he has learned are there below him.

## What he learns

Start the research from the TEKS Grade 2 geography strand and the C3 Framework's K-2 geography indicators, and confirm the exact standard numbers there rather than from memory. Read Treasure Fleet's kinds in the code first, so nothing here repeats its compass, key or grid work, and Wild Rescue's Where It Lives, so that Hot and Cold does not repeat its habitats.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Land and Water** `globe`: a globe he can see turning | start | tap land; tap water; "Is there more land or more water?" | tap the North Pole, the South Pole, the equator | "Is this place north or south of the equator?" |
| **Continents** `continent`: the seven continents | start | "Tap Africa" with three continents lit to choose from | all seven, on the flat map and on the globe | a continent's shape by itself: which one is it? Then "Which continent is south of Europe?" |
| **Oceans** `ocean`: the five oceans | Land and Water L2 | the Pacific and the Atlantic | all five | "Which ocean is between Africa and Australia?" |
| **Shape of the Land** `land`: mountain, hill, valley, river, lake, island, desert, plain, volcano, coast | Continents L2 | a picture scene: "Tap the mountain" | the same things as symbols on a map | by meaning: "Which one has water all round it?" |
| **Hot and Cold** `climate`: where it is warm and where it is icy | Land and Water L2 | the poles are cold and the equator is hot: tap the cold place | a snowy scene or a steamy one: where on the globe would it be? | "Which is colder, here or here?" two marks on the globe |
| **Famous Places** `place`: landmarks and animals with their continent | Continents L2 | "Where are the pyramids?" two continents lit | all seven | tap the place itself on the map |

Build the content as tables in `src/globe-hopper/world/`, free of game code: continents, oceans, landforms and places, each with its name, its shape or position and one true "did you know" line, as Wild Rescue's animals have.

Rules the tests must enforce:

- Exactly one tap or choice is right, in every kind.
- Tap targets are generous and never overlap. No question asks for a tap near the line between Europe and Asia, or anywhere two right answers could be argued. Each continent has a marked safe area well inside its coast, and target points are placed there.
- Seven continents and five oceans, the way American schools teach them, the Southern Ocean among the five. Record this as a default for the parent to confirm.
- The flat map always has north at the top, the Pacific split at the same edge, and the same colours for the same continents. The globe and the flat map are shown side by side the first time each continent is met, so he sees they are the same place.
- Greenland is not a continent and is never a choice in Continents. Antarctica is drawn on the flat map as the band along the bottom and is shown on the globe before it is asked on the map.
- Famous Places uses only places that are plainly in one continent. Nothing in Turkey, Russia or Egypt's Sinai. Animals are used only where the link is plain: kangaroos for Australia, penguins for Antarctica.
- Every "did you know" line is true and is listed in the spec with its source.

## Teaching a miss

A miss teaches the place, never just the answer:

- **Land and Water:** the globe turns to face him and the land or the water lights up. For the equator, a belt is drawn round the middle.
- **Continents:** the globe turns to the continent, its shape lifts off, its name is said and its line is spoken: "This is Africa. It is the hottest continent."
- **Oceans:** the ocean fills with colour between the continents that touch it, and they are named.
- **Shape of the Land:** the landform is drawn from the side and from above, with one plain sentence: "An island is land with water all round it."
- **Hot and Cold:** the sun's light is drawn landing straight on the equator and slanting at the poles.
- **Famous Places:** the map flies to the place and its picture pops up with its line.

A second miss gets the fuller lesson: the same place found from a place he already knows ("Start at Africa. Go north. This is Europe.").

## Voice

Aria at -8%. The question is spoken, and so is every continent, ocean and landform name, each lighting as it is said. Place names are single-word clips, which is where the voice slips: listen to each one alone and add fixes to `SAID_AS`. Lesson lines are whole sentences, one for each place. Report the clip count and size. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the Rocket Base, the Launch and the Station

He builds the base on the ground, builds the rocket on its pad, flies it to orbit himself and then looks down on the world he has been learning. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Launch. Bolts buy base buildings and rocket parts. Each Launch carries a payload to orbit, and a payload that has not flown before adds to his Station or his set of satellites.
- **The Rocket Base (from above and from the side).** It starts as a concrete pad and a hut. He buys the assembly building, the crawler that carries the rocket to the pad, the launch tower and its arm, fuel tanks, the control room, tracking dishes, a weather mast, a water tower, a landing pad, a recovery ship, an astronaut bus, a visitor stand, flagpoles and floodlights. A second and a third pad come later.
- **The rocket.** Built in slots on the pad: Nose, Capsule, Upper Stage, Main Stage, Boosters, Engines, Fins, Paint, Decals, and the colour of the flame. He owns several rockets: a small sounding rocket, a satellite launcher, a crew rocket, a heavy lifter with side boosters, a spaceplane and a booster that flies back and lands.
- **Parts matter.** Engines and boosters set how much the rocket can lift, so a heavier payload needs a bigger rocket. The tower sets how tall a rocket can stand on that pad. The tracking dishes set how long the orbit view lasts. Floodlights open night Launches.
- **The Launch (action, 2D canvas, from the side, about a minute).** The countdown is spoken from ten. He holds the big button to burn, and a held finger tilts the rocket to keep it in a wide path up through the clouds. A tap drops the boosters, then the main stage, and the sky goes from blue to black with stars.
- **The orbit.** The Earth turns slowly below, drawn with the same continents and colours as the questions. The mission names a place: "Fly over Africa and take a picture." He taps when it is underneath. After a moment the right place glows faintly, and a tap on the wrong one just has the camera say "Not yet" and wait, so the orbit uses what he learned without being a test (the way Wild Rescue's Park does).
- **It cannot be failed.** Leaving the path only wobbles the rocket and slows the climb. Any rocket reaches orbit. A payload too heavy for the rocket is never offered.
- **Payloads and the Station.** Weather satellites, a telescope, a camera satellite for each continent, and the modules of a space station: a core, solar panels, a lab, a dome window, a docking arm, a greenhouse. The Station grows in orbit, one Launch at a time.
- **Show off.** His photo wall with a picture of every continent and ocean from orbit, the Station turning above the Earth, and "Watch the launch" as a replay.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 45 base buildings, 6 rockets with about 60 parts, 30 paints, 24 decals, 10 flame colours, 30 payloads, 40 photo missions and mission patches. Economy defaults for the parent to confirm: one Launch per Round, the first Launch free; the first new part within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Launch, Pad, Payload, Station, Orbit) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Photo missions made from the world tables.** Every landform, landmark, city, river, island and sea in the content tables is a place to photograph from orbit, so a table of 150 places is 150 missions, and each one teaches the place. After that, missions are generated from a number: two or three places to pass over in one orbit, in a given order. The same number always gives the same mission.
- **The Station keeps growing.** After the named modules he can always launch another: a module made from parts (shape, colour, windows, panels, a dish), which he places where he likes, so his Station becomes his own design. Prices rise gently and then stay flat. Cap what is drawn at once.
- **Rockets made from parts.** Nose, capsule, stages, boosters, fins, paint, decals and flame colour are chosen separately, so the parts give thousands of rockets. A dearer engine lifts a heavier payload; it does not make the Launch easier or harder to fly.
- **The base keeps growing.** More pads, more hangars, more dishes, bought again and again.
- **The logbook.** Every Launch adds to his count of orbits, with a new mission-patch rank at each milestone, without end, and the album shows how many of the world's places he has photographed.
- **Competition:** none against a rival. His own bests are enough: his smoothest Launch (how well he held the path) and how many places he caught in one orbit.

## Look

A launch day: white rockets with bold stripes, a concrete and steel base, a deep blue sky going to black, and an Earth in clear, friendly colours with one fixed colour for each continent. Icon: a small rocket circling a globe with the continents showing.

Keep it apart from Rover Code, which is about other planets and a rover he programs. Here there are no other planets and no rover: the subject is the Earth. If Moon Base Mail is also built, the Moon belongs to that game and this one stays in Earth orbit.

## Risks

- A wrong fact taught to a six-year-old is worse than a missing game. When unsure, leave the fact out and list it in the report.
- The continents must be drawn in code. No art packs. Their outlines need to be simple enough to draw fast and true enough to recognise. The likely way is a small table of simplified outlines made once, at build time, from public-domain map data (Natural Earth); record the source and the licence in the spec. Judge the shapes on the iPad at phone size too.
- A turning globe drawn every frame could be slow on the iPad 9. Draw it from a small set of pre-made views or turn it in steps if it will not hold 60 fps.
- Small places are hard to tap. Europe on a phone is tiny: zoom the map for those questions rather than shrinking the targets.
- The Launch and the orbit are two actions in one go. Build the Launch first with a plain rocket and get it into his hands before the base's content.
