# Spec: Globe Hopper (continents, oceans and landforms; a rocket base and the Earth from orbit)

Status: built on 2026-11-24 (pass 1 of 3: build), playable at `/globe-hopper/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari.

A new learning game on the family site, built the same way as Cargo Words and Carrier Deck, for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent at his Rocket Base. Each Round also earns a Launch: he flies his rocket to orbit and photographs the places he has learned, from above.

## What he learns, and where it comes from

The brief asked for the research to start from the TEKS Grade 2 geography strand and the C3 Framework's K-2 geography indicators, with the numbers confirmed at the source.

- **TEKS, Social Studies, Grade 2, §113.13(b)(4)(A)** (the 2018 revision): "identify major landforms and bodies of water, including each of the continents and each of the oceans, on maps and globes". In the older (2011) numbering the same expectation is 2.6(A). Confirmed through two published TEKS listings (Teach Starter's "Social Studies 2.4(A)" and Twinkl's listing of the 2011 text); I could not open TEA's own copy of Chapter 113 in this pass, so **the parent may want to check the number against TEA's text**. §113.13(b)(4)(B) (locate places such as the community, Texas, the United States and its neighbours on maps and globes) is the sibling; this game does not ask about Texas or the United States' neighbours, which belong in a later game.
- **C3 Framework, D2.Geo.2.K-2**: "Use maps, graphs, photographs, and other representations to describe places and the relationships and interactions that shape them." **D2.Geo.3.K-2**: "Use maps, globes, and other simple geographic models to identify cultural and environmental characteristics of places." (C3 Framework for Social Studies State Standards, NCSS, Dimension 2, Geography, Table 16.) D2.Geo.1.K-2 (constructing maps) is Treasure Fleet's ground and is not repeated here.
- **The equator and the poles** are not named in the TEKS text found. They are in other states' second-grade standards (Utah's asks for "the seven continents, the five oceans, the poles, and the equator" on a map or globe), and the brief asks for them, so Land and Water Level 2 and 3 and Hot and Cold use them. **Default to confirm.**
- **Hot and Cold** (warm near the equator, cold near the poles) goes a little past both frameworks. It supports D2.Geo.3 ("environmental characteristics of places") and the TEKS K and Grade 1 "physical characteristics of place" (weather). It deliberately does not repeat Wild Rescue's Where It Lives (which habitat an animal lives in): here the question is only where on the globe a place is, and whether it is warm or cold there.
- Nothing repeats Treasure Fleet's compass, key or grid: there are no compass roses, no map keys and no grid squares. "North of the equator" and "Which continent is south of Europe?" use north and south on the globe, not a compass.

**Seven continents and five oceans** the way American schools teach them (Africa, Europe, Asia, North America, South America, Australia, Antarctica; the Pacific, Atlantic, Indian, Arctic and Southern Oceans). **Default to confirm**: some places teach six or five continents, or four oceans.

## Kinds

Six kinds, three Levels each. Everything is a tap: on the Earth (the flat map or the globe), on a picture card, on a pin, or on a name button.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Land and Water** `globe` | start | "Tap the land." / "Tap the water." on a globe; "Is there more land or more water on the Earth?" (Land / Water) | "Tap the North Pole / the South Pole / the equator" on a globe seen side-on | A ringed place, the equator drawn: "Is this place north or south of the equator?" (North / South), on the map or the globe |
| **Continents** `continent` | start | "Tap Africa" on the flat map with three continents lit to choose from | Any of the seven, all lit, on the flat map or on a globe turned near it | A continent's shape by itself: "Which continent is this?" (three names), or "Which continent is south of Europe?" (three names: the answer and two continents that plainly don't lie that way) |
| **Oceans** `ocean` | Land and Water L2 | "Tap the Pacific Ocean" or the Atlantic, on the map or a globe | Any of the five (the Arctic and Southern on a globe tipped toward the pole) | "Which ocean is between Africa and Australia?" and the like (the two Pacific ones on a globe turned to the Pacific, since the flat map splits it), or "Which ocean goes all the way round Antarctica?" (three names) |
| **Shape of the Land** `land` | Continents L2 | Three picture cards from the side: "Tap the mountain" | Three map signs from above: "Find the map sign for a lake" (no valley: it has no sign a first grader would know) | By meaning: "Which one is land with water all round it?" (three side cards) |
| **Hot and Cold** `climate` | Land and Water L2 | Two pins on the map, one by the equator, one far toward a pole, the equator drawn: "Tap the cold place." / "Tap the hot place." | A snowy scene or a hot, steamy one beside the map with two pins (the hot pin always on land: a jungle, not the open sea): "Where on the Earth could it be? Tap it." | "Which place is colder?" / "Which place is warmer?" Two numbered pins: hot and cold, mild and cold, or hot and mild |
| **Famous Places** `place` | Continents L2 | "Where are the pyramids?" with two continents lit: tap the continent | The same with all seven lit | Three pins on three continents, each with its picture: "Where are the pyramids? Tap its pin." |

- **Unlock order** (default): Land and Water and Continents at the start; Oceans and Hot and Cold at Land and Water Level 2; Shape of the Land and Famous Places at Continents Level 2.
- **Mastery and placement** (as Cargo Words and Math Bots): 16 of the last 20 right first try, or the last 10 in a row; the first 30 questions of a kind use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three probes each of Land and Water and Continents at Level 2, one of each per Round; three clean probes start that kind at Level 2, two misses stop the row.
- **Rounds**: five answers mixed across every open kind, never the same kind twice running while there is another; about one in three, and always the one after a miss, is easier and doesn't count; a starred kind comes back about once a Round; a missed question comes back later as a new one with no Mastery credit; one Bolt per first-try answer plus one for finishing (shared `boltsFor`); a Round resumes after a reload.
- **Meetings.** The first time each continent is needed (the one asked about, or named in a neighbour or between question), a Meeting comes first: the globe turns to it beside the flat map, both glowing, "Here is a new continent! This is Africa. Here it is on the globe. And here it is on the map." and its line, then Next. So the globe and the map are seen side by side the first time each continent is met, and Antarctica is always shown on the globe before the map asks for it.

### Rules the tests enforce (`questions/problems.test.ts`, `world/world.test.ts`)

- **Exactly one right answer** in every one of 27,000 generated questions (1,500 of each kind and Level): its possible answers are unique and exactly one is right.
- **Taps are judged only where nobody could argue.** A tap on the Earth is turned into a longitude and latitude and judged by `map/geo.ts`. Land near the line between Europe and Asia (the Urals, the Caucasus, Turkey and the Black Sea), round Suez, the Sinai and the Red Sea, at Gibraltar, across Panama, and round New Guinea and the islands between Asia and Australia counts as no continent at all (it neither counts nor misses). Oceans are judged only well inside each one; a coast, a strait, the Mediterranean and the seas round Europe count as no ocean. Land and water are judged only more than about two degrees from a coast.
- **Each continent and ocean has a safe area** well inside it, where its target sits; every point of it is tested to be that continent or ocean, clear of every arguable box, and no two safe areas overlap.
- **Pins are at least 24 degrees apart**, and a tap counts within 9 degrees, so a finger can only hit one.
- **On a globe, the answer is in view and big enough for a finger**: at least 3% of the disc (about a 50-point patch on a phone), and a continent's or ocean's safe area faces him. "Tap the North Pole" counts the cap above 55° (it was 62°, a sliver under 20 points tall on a phone) and a finger just over the rim counts as the rim.
- **North or south of the equator** is picked half and half before the place, so always saying "North" is no way through (it was right three times in four).
- **"Which continent is south of Europe?"** and the other neighbour questions are measured on the outlines: the answer has most of its land that way, every wrong choice less than half (Antarctica, South America and Australia were wrong choices for "south of Europe", and Europe and Asia for "north of South America": two right answers).
- **Greenland is drawn (as an icy island) but is never a continent**, never a choice and never counted.
- **The flat map** always has north at the top, the Pacific split at the left and right edges, Antarctica as the white band along the bottom, and each continent in its one colour (the same function colours the map, the globe, the orbit and the icon).
- **On a narrow screen** (under 560 points wide) the map zooms in on Europe whenever Europe is part of the question, rather than shrinking it.
- **Shape of the Land** never puts a hill beside a mountain or a volcano, or a valley beside a river, at Level 1; never uses a valley at Level 2; and at Level 3 never offers a choice whose meaning could be argued to fit too (for "land with water all round it", never the coast).
- **Hot and Cold** compares only a low, wet place by the equator (within 5°) with one far toward a pole (65° or more), or a mild coastal place (30° to 40°) with one of those; no mountains (it snows on Kilimanjaro), no deserts.
- **Famous Places** uses only places plainly in one continent: nothing in Turkey, Russia or the Sinai, nothing on an arguable border, and animals only where the link is plain (kangaroos, koalas and the platypus for Australia; emperor penguins, not "penguins", for Antarctica, since other penguins live in Africa, South America and Australia too).

## Teaching a miss

Never a red X. A miss teaches the place, on the Earth itself, then "Try again!":

- **Land and Water:** "The land is in colours. The water is blue." (with every continent's name written on it); for the poles and the equator, the poles are marked N and S and the equator is drawn as a dashed belt: "The North Pole is at the very top of the Earth." For north or south: "Above the equator is north. Below the equator is south."
- **Continents:** the globe turns to the continent (a small globe appears beside the flat map), it glows, "This is Africa." and its line.
- **Oceans:** the ocean fills with its colour, "This is the Indian Ocean." and its line.
- **Shape of the Land:** the landform is drawn from the side and from above, with its one sentence ("An island is land with water all round it.").
- **Hot and Cold:** the sun's light is drawn landing straight on the equator and slanting across the poles: "Near the equator, the sun shines straight down, so it is hot. Near the poles, the sunlight comes in at a slant, so it is cold."
- **Famous Places:** the map turns to the place, its picture and name pop up, its line is said, and "It is in Africa."

**The second miss** (or the first when he has been missing a lot, or 🔎) gets the fuller lesson: the place is found from one he already knows ("Start at Africa. Go north. This is Europe."), an ocean's continents are named one by one as each glows, the landform he picked is explained before the right one ("You tapped the hill. A hill is ..."), and "The further from the equator, the colder it gets."

## The reward: the Rocket Base, the Launch and the Station

**The loop.** A finished Round earns Bolts and one Launch. Bolts buy buildings, rockets, rocket parts, looks and payloads at the Rocket Base. Each Launch flies the next photo mission and carries the next payload his rocket can lift; a payload that has not flown before joins his Station or his satellites. The first Launch is free, so he sees the reward before his first purchase. A Launch is used, and paid, only at its end; leaving halfway costs nothing. A reload during a Launch lands at the Base.

**The Launch** (`launch/sim.ts`, 2D canvas from the side, about a minute):
1. The countdown, spoken from ten, steam and a shake at the end.
2. The climb: he holds a finger on the screen to fire the engines, and where his finger is, left or right of the rocket, tilts it, to keep it in a wide path (yellow chevrons) that leans gently over as it climbs through the clouds. Out of the path the rocket only wobbles and climbs more slowly; clouds only bump it. With no finger it burns gently and steers back toward the path, so it always reaches orbit (a child who does nothing gets there in about two minutes, a skilled one in under a minute).
3. Staging: when the boosters are empty a big Drop button appears ("Tap to drop the boosters!"), then for the main stage; each drops by itself after 3.5 seconds. The sky goes from blue to black with stars.
4. Orbit.

**The orbit** (`orbit/sim.ts`): the Earth turns below, drawn with the same continents and colours as the questions, the camera's sight in the middle. "Let the payload go! Tap!" (it goes by itself after five seconds), then the mission: "Fly over Africa and take a picture! Tap when it is right under the camera!" The orbit swings so each place comes round under the camera; it glows faintly once it is close; a tap too early only has the camera say "Not yet!" and wait; if it slips past, the orbit swings round again, and on the third pass the camera takes it itself. "Snap! This is Cairo. It is in Africa." Then **free time** (12 seconds, six more for each dish and eight for the Radio Relay, to a minute; 3 fixed dishes and 5 more reach it): whatever continent or ocean is under the camera when he taps becomes a photo. It cannot be failed.

**Results**: the Bolts, his stars (by how smooth the climb was: the share of the time he flew it himself, finger down, that he kept it in the path; time the rocket flew itself counts for nothing, so doing nothing is one star and 0%, never his smoothest Launch), his photos, new bests ("Smoothest launch!", "Most places in one orbit!"), the payload joining his Station or orbit, a patch every fifth mission, a new rank, the booster landing (Flyback Booster with the Landing Pad) or the spaceplane landing (with the Runway).

**The Rocket Base** (`base/`), tabs by price, a dear thing always beside cheap ones, the Goal bar filling toward what he's saving for:
- **Build** (54 buildings): the Launch Tower, Tall Tower and Giant Tower (each lets a taller rocket stand), Tower Arm, Assembly Building, Crawler, Fuel Tank, Big Fuel Tank, Oxygen Tank, Control Room (draws the path plainly), Mission Control, Tracking Dish, Big Dish, Giant Dish (each lengthens free time in orbit), Weather Mast (halves the clouds' bump), Water Tower, Landing Pad (the flyback booster needs it), Recovery Ship, Astronaut Bus, Visitor Stand, Big Grandstand, Flagpoles, Floodlights (opens night Launches), Second Pad, Third Pad, Runway (the spaceplane needs it), Hangar, Module Factory (opens Station modules he designs), Clean Room, Camera Tower (opens "Watch the launch"), and 24 more for the base's life (Countdown Clock, Press Site, Cafeteria, Astronaut School, Rocket Museum, Rocket Garden, Gift Shop, Helipad, Fire Station, Radar, Lightning Towers, Beacon Light, Windsock, Fence, Road, Car Park, Rocket Train, Observatory, Training Pool, Spin Trainer, Solar Farm, Engine Test Stand, Front Gate, Big Sign).
- **Rockets** (6): Sounding Rocket (his first), Satellite Launcher (60, tower level 2), Crew Rocket (130, level 3), Heavy Lifter (240, level 3, side cores), Spaceplane (300, needs the Runway), Flyback Booster (350, level 4 and the Landing Pad). He owns several and taps one to fly it.
- **Parts** (60, chosen slot by slot, any part on any rocket): Nose (9), Capsule (8), Upper Stage (8), Main Stage (8), Boosters (8: lift 0 to 6), Engines (10: lift 1 to 10), Fins (9). **Lift** = the rocket's own lift + its engines + its boosters; a payload heavier than every rocket he can fly is never offered and never flown.
- **Paint** (30 paints, 24 decals, 10 flame colours).
- **Payloads** (30): Station Core, Solar Panels, Science Lab, Dome Window, Docking Arm, Greenhouse, Sleeping Pods, Kitchen Module, Big Solar Wings, Airlock, Storage Module, Robot Helper, Gym Module, Big Radiator; Weather Satellite, Storm Watcher, Ice Watcher, Ocean Watcher, Space Telescope, Big Telescope (weight 9), GPS Satellite (an arrow points to the next place in orbit), Radio Relay (longer free time), TV Satellite; a Camera for each continent. With nothing bought waiting, a Launch carries supplies for the Station (or a Test Payload before there is one), so a Launch is never empty. A payload that builds on another (Solar Panels and most modules on the Station Core, Big Solar Wings on Solar Panels, the Robot Helper on the Docking Arm, the Big Telescope on the Space Telescope) can be bought only once that one has flown ("Fly this first:"), so the core is always the Station's first module.
- **Station**: every module he launches waits until he puts it on the Station himself, on any glowing free spot next to one already there (the core first).
- **Photos**: a card for every continent and ocean (grey until photographed from orbit), his patches, and every place he has photographed.
- **Logbook**: Launches flown, his rank, his bests, his Station, dishes and satellites.

### Rewards that never run out

1. **The endless layer, made by the game.**
   - **Photo missions.** The first 12 Launches photograph the seven continents and five oceans; then every place in the world tables, one per Launch, taking turns round the continents (212 hand-made missions in all). After those, each mission is generated from its number (`base/missions.ts`): two or three places to pass over in one orbit, in order, each at least 25° from the others so it comes round on its own, three places more often as he goes, never more than three. The same number always gives the same mission. Every fifth mission earns a numbered patch, without end. `base/gen.test.ts` makes 3,000 and flies every one to its end with the child who does nothing (and every tenth with the clumsy and skilled children), and flies every hand-made one too.
   - **Station modules he designs.** With the Module Factory and the core flown, "New Station Module" can be bought again and again: he picks its shape (6), colour (12), windows (0 to 3), solar panels (0 to 2) and a dish (1,728 different modules), it flies on a Launch, and he puts it where he likes. A new module's parts start from a design made from its number. The test places 2,000 and there is always a free spot.
   - **Rockets from parts**: 6 kinds × 9 × 8 × 8 × 8 × 8 × 10 × 9 parts × 30 paints × 24 decals × 10 flames: millions of rockets. A dearer engine lifts heavier payloads; it does not make the Launch harder or easier to fly.
   - **The logbook**: ranks by Launches (Cadet, Rocket Rookie at 3, Launch Crew 8, Pilot 15, Commander 25, Captain 40, Flight Director 60, Space Ace 85, Star Captain 120, Orbit Legend 160), then Orbit Legend 2, 3, 4 ... every 40 Launches without end. The album shows how many of the world's places he has photographed.
2. **Things bought again and again**, price rising gently then flat: Another Pad (120 to 200, up to six more), Another Hangar (45 to 90, up to 12, all drawn on the base), Another Dish (60 to 100, up to 5 more, when free time reaches its minute), New Station Module (40 to 80, without end, each one he designs and places). Pass 2 capped hangars and dishes: past those, a purchase showed and did nothing.
3. **The fixed catalogue**: 203 things for sale, 212 hand-made photo missions and 10 ranks: **425 named things**.

**Measured** (`base/economy.test.ts`, the scripted child: every answer right first try, every Launch flown with three stars and every place caught, the cheapest new thing bought as soon as he can, the strongest engine and boosters fitted, each new module put on the Station):

| | |
|---|---|
| Bolts a Round (Round and Launch, first 300 Rounds) | **9.1** |
| Rounds to buy the whole fixed catalogue | **893** (about 45 hours at 20 Rounds an hour) |
| Rounds to fly every hand-made photo mission | 212 |
| Longest gap between purchases, first 100 Rounds | **2** (first 300: 5; first 1,000: 39, saving for the dearest rockets, while every Launch still flies a new mission) |
| First purchase | Round 1 |
| Dearest things, in Rounds of saving | Flyback Booster 38.6, Spaceplane 33.1, Hyper Engine 28.7, Heavy Lifter 26.5, Mega Engine 22.1, Super Boosters 19.9; everything else 15 or less |
| After 2,000 Rounds | something new every Round (a mission he hasn't flown, and modules, hangars and dishes to buy) |

**Economy defaults, for the parent to confirm.**
- One Launch per Round; the first Launch free; Launches don't expire.
- A Launch pays 2 Bolts, +1 for a smooth climb (three stars), +1 when a bought payload flies for the first time, +1 for a new best. At most 5; a Round and its Launch at most 11, under Turbo Tally's ceiling of 15. No other way to earn Bolts.
- Prices up to 100 in ones, then whole tens to 400 (the dearest is 350), using the whole-ten clips (`PRICE_TENS`, as Turbo Tally) and "You need about 140 more Bolts." for a gap that isn't a whole ten.
- The dearest things are rockets, engines, boosters and buildings that change the Launch or the orbit; a paint is never dear (30 at most).
- **No rival.** Competition is his own bests only: his smoothest Launch (percentage of the climb in the path) and the most places caught in one orbit, shown on the Launch card and in the Logbook, cheered when beaten and paid one Bolt.

## The map

- **Source**: Natural Earth 1:110m Admin 0 countries and 1:110m lakes (v5, from `nvkelso/natural-earth-vector` on GitHub). **Licence: public domain** ("All versions of Natural Earth raster + vector map data found on this website are in the public domain", naturalearthdata.com terms of use). No art packs.
- `tools/globe-hopper/outlines.ts` reads them once and writes `src/globe-hopper/world/outlines.gen.ts` (about 60 KB): countries grouped into the seven continents (Russia split at 60°E, roughly the Urals; Russia's far east across the date line is Asia; French Guiana is South America, not France), Greenland, New Zealand and the Pacific islands kept apart, every outline simplified (Douglas-Peucker, 0.15°) and the smallest islands dropped, in tenths of a degree. The game never reads the downloaded files.
- The borders inside a continent are hidden (outlines are stroked before they are filled), so each continent is one shape with one colour. The line between Europe and Asia shows as a straight line at 60°E across Russia; it is never asked about.
- The globe is drawn every frame (about 6,000 points, one small turn each); a point on the far side is pulled to the rim. Measured in the browser tour (headless Chromium on a Mac), the whole orbit frame takes 0.4 to 0.7 ms on average and under 2 ms at the 99th percentile, so there is a wide margin under the 16.7 ms of a 60 fps frame. **Not yet measured on an iPad 9**; it is the first thing to check there. If it drops frames, draw it into a cached canvas and turn it in steps.

## Voice

Aria at -8% (`tools/make_voice.py --collection globe-hopper`), **895 clips, 13.7 MiB on disk** (pass 2 removed 12 lines the game never said) (`public/globe-hopper-voice/`). Every continent, ocean, landform and place name is a clip of its own, said alone and chained into lines ("Fly over", "Cairo", "and take a picture!"). Every lesson sentence and every "did you know" line is a whole clip.

The 227 name clips were checked with speech-to-text (faster-whisper small.en). 211 came back as written. Of the rest, plain/plane, Coliseum, Marrakech, Keto (Quito), Karakas, Adelade, Yanktse, A konkabwa (Aconcagua), Galapagos, Svalbar and Weddle are spelling or homophones of the right sound. Five were real slips and have `SAID_AS` fixes in `make_voice.py`: Bogotá (was "Bo-Guitar", now "Bo-go-ta"), the Paraná River (was "the Piranha River"), Manaus, Cuba (was "HUBA") and Lagos. Pass 2: Lagos is now said "Lay-goss" (heard as "Lagos"; "Lay gos" was still heard as "LEGOs") and Flagpoles "Flag poles" (was "flight poles").

## Every "did you know" line, and its source

Sources were chosen from standard references; the lines are kept short and plain. **They were not each re-opened in this pass**; the ones marked (check) are the ones most worth a parent's look.

| Line | Source |
|---|---|
| The equator goes across the middle of Africa. | Encyclopaedia Britannica, "Africa" (Africa runs from about 37°N to 35°S; the equator crosses Gabon, the Congo, Uganda, Kenya and Somalia). Pass 2 replaced "Africa is the hottest continent.", whose sources were mixed. |
| Europe is the second smallest continent. | Encyclopaedia Britannica, "Europe" |
| Asia is the biggest continent. | Encyclopaedia Britannica, "Asia" |
| Canada, the United States and Mexico are in North America. | Encyclopaedia Britannica, "North America" |
| The Andes mountains run all the way down the west side of South America. | Encyclopaedia Britannica, "Andes Mountains" |
| Australia is the smallest continent. | Encyclopaedia Britannica, "Australia" |
| Antarctica is the coldest continent. It is covered in ice. | British Antarctic Survey, "About Antarctica" (about 98% is covered by ice) |
| The Pacific is the biggest and deepest ocean. | NOAA Ocean Service, "How big is the Pacific Ocean?" |
| The Atlantic is the second biggest ocean. | NOAA Ocean Service, "How many oceans are there?" |
| The Indian Ocean is the third biggest ocean. | NOAA Ocean Service, "How many oceans are there?" |
| The Arctic is the smallest ocean. Much of it is covered in ice. | NOAA Ocean Service, "How many oceans are there?" and NOAA Arctic sea ice pages |
| The Southern Ocean goes all the way round Antarctica. | NOAA Ocean Service, "How many oceans are there?" |
| Most of the Earth is covered in water. | USGS Water Science School, "How Much Water is There on Earth?" (about 71%) |
| It is halfway between the North Pole and the South Pole. (the equator) | National Geographic Education, "Equator" |
| Near the equator, the sun shines straight down, so it is hot. / Near the poles, the sunlight comes in at a slant, so it is cold. / The further from the equator, the colder it gets. | NASA Climate Kids and National Geographic Education, "Climate" (simplified: altitude and oceans also matter, which is why the questions use only low places) |
| Greenland is the biggest island in the world. | Encyclopaedia Britannica, "Greenland" (Australia is counted as a continent) |
| The pyramids of Giza were built more than four thousand years ago. | Encyclopaedia Britannica, "Pyramids of Giza" (about 2575 to 2465 BCE) |
| The Great Wall of China is thousands of miles long. | Encyclopaedia Britannica, "Great Wall of China" |
| The Eiffel Tower is in Paris, in France. | Encyclopaedia Britannica, "Eiffel Tower" |
| The Statue of Liberty stands in New York Harbor. | National Park Service, Statue of Liberty National Monument |
| The roof of the Sydney Opera House looks like sails. | Encyclopaedia Britannica, "Sydney Opera House" ("sail-shaped interlocking panels"); UNESCO World Heritage calls them shells. Checked in pass 2. |
| Machu Picchu is an old city high in the Andes mountains. | UNESCO World Heritage, "Historic Sanctuary of Machu Picchu" |
| The Taj Mahal in India is made of white marble. | UNESCO World Heritage, "Taj Mahal" |
| Mount Everest is the highest mountain in the world. | Encyclopaedia Britannica, "Mount Everest" (highest above sea level) |
| Uluru is a giant red rock in the middle of Australia. | Parks Australia, Uluru-Kata Tjuta National Park |
| Mount Kilimanjaro is the highest mountain in Africa. | Encyclopaedia Britannica, "Kilimanjaro" |
| The Amazon is the biggest rainforest in the world. | WWF, "Inside the Amazon" (the largest tropical rainforest) |
| The Colorado River carved the Grand Canyon. | National Park Service, Grand Canyon, "Geology" |
| Niagara Falls is on the border of Canada and the United States. | Encyclopaedia Britannica, "Niagara Falls" |
| The Sahara is the biggest hot desert in the world. | Encyclopaedia Britannica, "Sahara" |
| Iguazu Falls is made of hundreds of waterfalls. | UNESCO World Heritage, "Iguazu National Park" (about 275 falls) |
| The Leaning Tower of Pisa, in Italy, leans to one side. | Encyclopaedia Britannica, "Leaning Tower of Pisa" |
| The Colosseum in Rome is almost two thousand years old. | Encyclopaedia Britannica, "Colosseum" (opened about 80 CE) |
| Mount Fuji is the tallest mountain in Japan. | Encyclopaedia Britannica, "Mount Fuji" |
| Victoria Falls is one of the biggest waterfalls in the world. | UNESCO World Heritage, "Mosi-oa-Tunya / Victoria Falls" |
| The South Pole is in Antarctica. | British Antarctic Survey |
| Big Ben is a huge bell in a clock tower in London. | UK Parliament, "Big Ben" (Big Ben is the bell; the tower is the Elizabeth Tower) |
| Stonehenge is a ring of giant stones in England. | English Heritage, "Stonehenge" |
| The Golden Gate Bridge in San Francisco is painted orange. | Golden Gate Bridge District ("International Orange") |
| Table Mountain has a flat top, like a table. | Encyclopaedia Britannica, "Table Mountain" |
| Kangaroos carry their babies in a pouch. | Australian Museum, "Kangaroos" |
| Koalas eat the leaves of eucalyptus trees. | Australian Koala Foundation |
| Emperor penguins huddle together to keep warm. | British Antarctic Survey, "Emperor penguin" |
| Giant pandas eat bamboo. | WWF, "Giant Panda" |
| Tigers are the biggest cats in the world. | WWF, "Tiger" (the largest cat species) |
| No two zebras have the same stripes. | Smithsonian's National Zoo, "Grevy's zebra" (each zebra's stripes are unique) |
| Giraffes are the tallest animals in the world. | Encyclopaedia Britannica, "Giraffe" (the tallest living land animal) |
| The platypus is a mammal that lays eggs. | Australian Museum, "Platypus" |
| The bald eagle is the national bird of the United States. | U.S. Fish and Wildlife Service (the national emblem since 1782; named the national bird in law in December 2024) |
| Orangutans spend most of their lives in trees. | WWF, "Orangutan" |

**Lesson sentences** (from National Geographic Education's encyclopedia definitions, simplified for a six-year-old):

| Sentence | Source |
|---|---|
| A mountain is very high land with steep sides. | National Geographic Education, "Mountain" |
| A hill is land that is higher than the land around it, but lower than a mountain. | National Geographic Education, "Hill" |
| A valley is low land between hills or mountains. | National Geographic Education, "Valley" |
| A river is water that flows across the land. | National Geographic Education, "River" |
| A lake is water with land all round it. | National Geographic Education, "Lake" |
| An island is land with water all round it. | National Geographic Education, "Island" |
| A desert is a very dry place that gets very little rain. | National Geographic Education, "Desert" |
| A plain is wide, flat land. | National Geographic Education, "Plain" |
| A volcano is a place where hot, melted rock comes up from inside the Earth. | National Geographic Education, "Volcano" (an opening in the Earth's crust where molten rock erupts). Pass 2 replaced "A volcano is a mountain that can let out hot, melted rock.": not every volcano is a mountain. |
| A coast is the land beside the sea. | National Geographic Education, "Coast" |

**Left out on purpose** (unsure, or arguable for a six-year-old): any "biggest/longest river" (the Nile and the Amazon are argued), "Africa is the biggest desert continent", lions (they also live in India), polar bears (several continents), llamas, sloths and toucans (Central America is North America), the Great Barrier Reef as Australia's (it is in the Pacific; it is a photo mission said as "in the Pacific Ocean"), Lake Baikal and everything else in Russia, Istanbul and everything in Turkey.

## Defaults for the parent to confirm

- The name, Globe Hopper.
- Seven continents and five oceans (with the Southern Ocean).
- The equator and the poles, and Hot and Cold, which go a little past the TEKS text.
- The unlock order and the economy above (one Launch per Round, payouts, prices).
- Russia split at 60°E on the map; Turkey, the Caucasus and Kazakhstan drawn as Asia; New Zealand and New Guinea drawn in a lighter red beside Australia and never asked about.
- The Southern Ocean counted south of 60°S (NOAA's boundary).
- Name buttons (continents, oceans, North/South, Land/Water) are read out as they light, since the question is about the place, not reading the name; landform cards and lit continents are never named.

## Open questions

- Is the straight 60°E line between Europe and Asia across Russia acceptable, or should Russia be drawn one colour (as some children's maps do)?
- Should New Zealand count as part of Australia (Oceania) for the photo missions' "It is in" line? It is said as "in the Pacific Ocean" now.
- Should "Watch the launch" need the Camera Tower (as now), or be there from the start?
- Is the Launch's two-minute worst case (a child who never touches the screen) too long?

## Verified

- `npm run typecheck`, `npm run typecheck:pairings`, `npm test` (167 files, 2,440 tests), `npm run build:site`, `npm run check:offline` (7 journeys) and `tools/globe-hopper/offline.ts` (precaches 921 files with all 907 clips; offline, a Round starts, the answer counts, and a reload mid-Round comes back to it).
- `tools/globe-hopper/tour.ts` at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and Level 3: a Round with two deliberate misses in each kind met, a purchase, every Base tab, a Launch with both stages dropped (Level 2/3 saves fly a Satellite Launcher with boosters), the payload let go, the photo taken and the results. The tours found and fixed: the landform lesson's picture covering the cards and blocking taps; the Europe zoom hiding another target on a narrow screen; a 27px overflow on a sideways phone; the lesson's small globe staying over the map after the lesson.

## Pass 2 (bugs and sound), 2026-11-24

Found by playing every kind at every Level (right, one miss, two misses) at 810×1080 and 844×390, the tour at all four sizes on all three saves, a scripted reload/mash/do-nothing run, and reading a few hundred generated questions of each kind:

- **Two right answers in Continents Level 3**: "Which continent is south of Europe?" offered Antarctica (south of Europe too), and South America and Australia; "north of South America" offered Europe and Asia; "north of Africa" North America. The wrong choices are now only continents with less than half their land that way (measured on the outlines in `world.test.ts`).
- **"Which ocean is between Asia and North America?"** was asked on the flat map, which splits the Pacific: between the two lit continents the map shows the Atlantic (offered as a wrong choice). Both Pacific "between" questions now use a globe turned to the Pacific.
- **"Tap the North Pole" was a sliver**: the cap above 62° on a side-on globe is under 20 points tall on a phone. Now 55°, and a finger just over the rim counts.
- **"North or south of the equator?"** was "North" three times in four; now half and half.
- **The South Pole's pin** in Famous Places Level 3 stood below the flat map's bottom edge; it now stands just above it.
- **The steamy scene** in Hot and Cold Level 2 could put its hot pin in the middle of the sea; now only on land.
- **A shape's lesson** ("Which continent is this?") turned a globe that wasn't on screen; a globe now comes up beside the shape for the lesson.
- **Doing nothing was the smoothest Launch**: the rocket steering itself scored 100% and three stars, more than a clumsy child who tried. Now only the time he flies it counts (see Results).
- **The Launch commentary** could cut off a "must say" line (the Drop prompt) with "Bump!": a cut-off line's ending cleared the flag for the line that replaced it.
- **Solar Panels could become the Station's middle**: a module needed the core bought, not flown, and a small rocket can't lift the core. Now it needs the core flown ("Fly this first:").
- **Another Hangar past 12 and Another Dish past 5** bought nothing he could see or use; now capped there. New Station Modules stay endless.
- **Voice**: "You are a Oceans star!" is now "an"; Lagos is said "Lay-goss" (still heard as "LEGOs" before), Flagpoles "Flag poles"; 12 lines the game never said were removed (895 clips). Three "did you know" lines resolved (see the table).

Not changed, for the parent to weigh: a Meeting takes one of a Round's five places and pays its Bolt like an answer (7 in all, early on); the Base's tab bar scrolls sideways on a phone; Weather Mast was once heard as "Weather Masked" (heard right on re-recording).

## Not done (pass 1)

- **No real iPad or Safari testing.** Most needs checking there: the globe's frame rate on an iPad 9 (orbit and Meetings draw a full globe every frame); holding a finger to burn while steering, and the Drop button with the other hand; taps on Europe and on small places at phone size; the voice's timing on iPad Safari.
- **The voice was not listened to by ear**, only checked by speech-to-text (above). Least likely to sound right: Lagos, Manaus, Aconcagua, Quito, Krakatoa, Kilauea, Cotopaxi, Iguazu, Addis Ababa, Svalbard, and the long chained lines ("Fly over" + a name + "and take a picture!").
- The flat map does not yet zoom for other small targets on a phone (only Europe); the pins and safe areas are large enough by the tests, but not checked by eye at 390 wide for every place.
- The base is drawn with emoji for its buildings on the Base screen and simple shapes in the Launch; a design pass could draw them properly.
- Recovery Ship, Astronaut Bus and most "look" buildings appear on the base but do not appear in the Launch scene.
- No Trophies/medals beyond patches and ranks.
