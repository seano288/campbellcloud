# Brief: Storm Chaser (weather; build a weather station and drive the chase truck)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Storm Chaser. Slug: `storm-chaser`. The name is a working name for the parent to confirm.

## Why this game

Wild Rescue has one kind, Sky and Seasons, that names the weather and the seasons. That is as far as the site goes. Weather is a full strand of early science: watching it and recording it, reading a thermometer, knowing what the sky is about to do, getting ready for a storm, and seeing what wind and water do to the land (NGSS K-ESS2-1, K-ESS3-2, 2-ESS1-1 and 2-ESS2-1, and the weather strand most states teach in first and second grade).

A storm chaser's truck is covered in instruments, and each one measures something he will learn to read.

## What he learns

Start the research from NGSS K-ESS2-1, K-ESS3-2, 2-ESS1-1, 2-ESS2-1 and 2-ESS2-3 and the matching TEKS Grade 1 and Grade 2 earth and space strands, and confirm the exact standard numbers there rather than from memory. Record which standard each kind serves. Read Wild Rescue's Sky and Seasons in the code first, so that Today's Weather and Seasons start past it.

**Where Rain Comes From is past second grade.** The water cycle is named in later grades in most standards. A plain version (a puddle dries, a cloud forms, rain falls) is within his reach, and it opens last. Mark it in the spec as extra, for the parent to confirm.

Temperatures are in degrees Fahrenheit, as his school will use. Confirm this with the parent.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Today's Weather** `sky`: seeing it and getting ready | start | what to wear or take: an umbrella, a coat, a sun hat | a week's weather in pictures: how many days did it rain | the same week with temperatures: which day was warmest |
| **Thermometer** `temp`: reading how hot or cold | start | hot or cold: is the red line high or low | read it to the nearest ten degrees | read it between the tens; then "Water freezes at 32. Will this be rain or snow?" |
| **Seasons** `season`: the year's pattern | Today's Weather L2 | which season is this: four pictures of one tree | what comes after autumn; which months are winter | long days and short days: which season has the most daylight |
| **Clouds** `cloud`: what the sky will do | Thermometer L2 | puffy white clouds, a flat grey sheet, a tall dark tower: which one brings a storm | match each cloud to its weather | wind: which way is it blowing, from a flag or a wind sock, and which is the strongest |
| **Stay Safe** `safe`: what to do in bad weather | Seasons L2 | you hear thunder: go inside, or stay in the pool | lightning, a flood, great heat, a blizzard: match each to the safe thing to do | the forecast says a storm is coming tonight: what should we get ready |
| **Wind and Water** `shape`: how weather changes the land | Clouds L2 | what did this: wind made the dune, water cut the gully | fast or slow: a flood, or a river cutting a canyon | what would slow it down: trees, a wall, sandbags |
| **Where Rain Comes From** `water`: the path water takes | Wind and Water L2 | where did the puddle go | put in order: the sun warms the water, a cloud forms, rain falls | rain, snow or hail: which falls when it is freezing |

Build the content as tables in `src/storm-chaser/weather/`, free of game code: kinds of weather, clouds and what they bring, seasons and their signs, safety rules with their sources, and changes to the land.

Rules the tests must enforce:

- A question can only offer what the table says is plainly right or plainly wrong.
- Every thermometer has its scale drawn evenly, with tens labelled. A Level 2 reading always sits on a labelled line. Wrong choices are the real mistakes: the label above instead of below, and counting each small tick as one when it is two.
- Seasons are the northern half of the world's, and the game says so once. Weather for a season is the kind every child's book agrees on: no question depends on where he lives (it does not snow everywhere in winter). Ask the parent what winter is like at home.
- **Every Stay Safe answer comes from a named public source** (the National Weather Service or the Red Cross), listed in the spec. Where advice differs by place or has changed, leave it out.
- Clouds asks about three or four kinds that look nothing alike. The Latin names are spoken at Level 2 if the research supports it, and are never the question.
- Wind and Water never pairs two changes of similar speed.

## Teaching a miss

- **Today's Weather:** the child in the picture steps outside in what he chose, and then in the right thing. For the chart, each day is counted as it lights.
- **Thermometer:** the red line rises from the bottom while the tens are counted, then the ones.
- **Seasons:** the tree goes through its whole year, and the season's name is said as it arrives.
- **Clouds:** time runs forward and the cloud does what it does.
- **Stay Safe:** the safe thing is shown and the reason said in one line. "Lightning strikes tall things. Indoors is safe."
- **Wind and Water:** the change plays, fast for the fast ones and with a calendar spinning for the slow ones.
- **Where Rain Comes From:** one drop is followed from the puddle to the cloud and back down.

A second miss gets the fuller lesson: the same scene with him tapping to move each step on.

## Currency: Raindrops

A chaser goes where the rain is. He earns Raindrops and spends them at the station on instruments, truck parts and buildings.

- One Raindrop, many Raindrops. Add `RAINDROP` to `src/currency/kind.ts`.
- The icon is a fat blue drop with a white glint and a dark blue outline.
- When a Round ends, the drops fall from a small cloud onto the pile, each with a plink.
- His balance is shown beside the icon as in every game. The station also has a rain gauge that fills with every Raindrop he has ever earned and never goes down, so spending never looks like losing.
- Raindrops are never money.

## Voice

Every question is spoken. Answer pictures are not read out. He reads numbers, so thermometer answers are not read out. New clips: the kind names, the weather words, the seasons, the cloud kinds, the safety lines, the instruments and "degrees". The currency lines are recorded with "Raindrops" (see the build guide's "Currency").

## The reward: the Truck, the Chase and the Station

He builds a weather station and a chase truck, and drives out to measure storms. Flat 2D, from the side.

- **The loop.** A finished Round earns Raindrops and one Chase. Raindrops buy instruments, truck parts and station buildings. Each Chase brings back a photo for the Album.
- **The Chase (action, 2D canvas, from the side, about a minute).** The radar shows a storm ahead. He holds a pedal to drive across open country, over hills and fords, with the sky darkening as he goes. At the marked spot he stops, raises the mast, lets a weather balloon go with a swipe and taps the camera when the storm is in the frame. The truck's own dials read the wind, the rain and the temperature as he works.
- **It cannot be failed.** The storm stays in the distance and never reaches the truck. Wind rocks it, rain drums on it and hail pings off, and that is all. A missed photo can be taken again.
- **The chasers are scientists.** The voice says so at the first Chase: they are trained, their truck is built for it, and they watch from far away. The game teaches him to go indoors in a storm, and the reward must never show otherwise: nobody drives into a tornado, stands in the open or crosses a flood.
- **The Truck.** Body, tires, a mast, a radar dish, a wind meter, a rain gauge, a camera, a balloon launcher, lights and paint. Better instruments see the storm from farther off and give sharper photos.
- **The Station.** His base on a hill: a radar tower, a wind sock, a balloon shed, a garage, a map room, a rain gauge, a lightning rod, a snow lab, a helipad and later a hangar with a storm plane.
- **The Album.** Every storm he has photographed, with its kind and its numbers: how fast the wind was, how much rain fell.
- **Show off.** "Watch the station": instruments turning, the day's weather passing over, balloons going up.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 10 truck bodies, 60 instruments and parts, 30 paints and decals, 40 station pieces, 30 balloons and probes, 24 places to chase, 40 named storms and skies for the Album, and badges. Economy defaults for the parent to confirm: one Chase per Round, the first one free; the first new part within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Body, Slot, Mod, Goal) and add the new ones (Raindrop, Chase, Station, Album, Instrument) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Storms made on the spot.** After the named storms, every Chase's storm is generated from its number: its kind (thunderstorm, squall, snow, hail, dust, waterspout), its size, the colour of the sky, the shape of the lightning, whether a rainbow follows, and the land he drives over. The same number always gives the same storm, rarer skies turn up the further he has got, and a test checks that every Chase can be finished. Every fifth one brings back something that is never sold.
- **The Album has no last page.** Each photo is of a storm no other number gives.
- **Records.** The strongest wind, the heaviest rain, the biggest hailstone and the coldest day he has measured are personal bests on a board in the map room, in numbers he can read.
- **Instruments with ranks.** Radar, mast and camera can each be improved again and again, with smaller gains each time.
- **The station keeps growing.** He can always add another instrument on the hill or another bay on the garage. The price rises gently and then stays flat.
- **Competition:** none against a rival. His records are enough.

## Look

A wide sky is the whole picture: two thirds of the screen, changing from clear blue through green-grey to near black, over flat gold and green country. The truck is white with orange stripes and bright lights. Instruments look like real ones, with needles and numbers. Icon: a truck with a radar dish under a dark cloud with one raindrop.

Keep it apart from Wild Rescue, where weather is one background among many. Keep it apart from Plow Patrol, which is about what snow and ice are made of. Here the weather is the subject, and he measures it.

## Risks

- Safety advice must be right. A wrong line here could matter one day. Use only named public sources, quote them plainly, and list every line with its source in the spec for the parent to read.
- A game that makes chasing storms look fun could teach the opposite of Stay Safe. The scientists' framing, the distance and the rules above are the answer; report how it reads when played.
- Storms can frighten a six-year-old. Keep thunder soft, keep people and animals out of harm, and show no damage to homes in the Chase. Wind and Water shows changes to land, not to houses.
- Weather differs by place, and a "right" answer about winter may be wrong where he lives. The rules above name this; the research should check every season question against it.
- The thermometer's small ticks need room. Lay out the sideways phone first.
- A sky that changes smoothly with rain, lightning and moving cloud may be slow on the iPad 9. Draw the sky as a few layers, and cap the rain.
