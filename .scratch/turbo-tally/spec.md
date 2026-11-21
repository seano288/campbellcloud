# Spec: Turbo Tally (comparing, places, tallies and graphs; build a race car and race it)

Status: built on 2026-11-17 (pass 1 of 3: build), playable at `/turbo-tally/` with a tile in **Learning Games** on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is still a working name.

A new learning game on the family site, built the same way as Rover Code (`src/rover-code/`, `.scratch/rover-code/spec.md`) for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent on race-car parts in the Garage. Each Round also earns a Race: he drives his car round a track from above against three computer Rivals.

## Research: what it teaches, and what it leaves to Math Bots

Started from the standards the brief named, in the way `.scratch/math-bots/research/first-grade-math.md` did:

| Standard | What it asks | Where it is now |
|---|---|---|
| CCSS 1.NBT.B.3 | Compare two two-digit numbers by their tens and ones, with >, = and < | Math Bots' Tens and Ones Level 3 (one form among others); **Faster Car** here practises it as a kind of its own |
| CCSS 1.MD.C.4 | Organise and read data in up to three categories: how many in each, how many in all, how many more or fewer | Math Bots' Scoreboard (one form inside Bot Stories Levels 2 and 3, rows of plain squares); **Race Chart** here |
| CCSS 1.OA.A.2 | Word problems adding three whole numbers, total at most 20 | Math Bots' Bot Stories Level 3 (the `three` story: "The crew finds {a} bolts, then {b}, then {d}. How many in all?") |
| TEKS 1.8(A) | Collect, sort and organise data in up to three categories with models such as **tally marks** or T-charts | Nowhere on the site; **Tally Board** here |
| TEKS 1.8(B), (C) | Make picture and bar-type graphs; draw conclusions and answer questions from them | **Race Chart** here |
| TEKS 1.2(E)–(G) | Compare whole numbers to 120 with comparative language; order whole numbers to 120 with place value and open number lines; show a comparison of two numbers to 100 with >, < or = | **Faster Car** and **Line Up** here |
| Ordinal positions, first to tenth | Not a CCSS Grade 1 code; Virginia's 2016 SOL 1.3 asks for the place of each item in an ordered set of ten, first to tenth (folded into the calendar strand in its 2023 revision) | **Podium** here |

Checked against Math Bots' Weigh-In (true/false equations and a missing number on a balance), Number Chart (counting and 10 more/less on the hundred chart) and Facts (sums and differences within 20): no Turbo Tally kind repeats one of them.

- **Three Laps is dropped (default).** The brief said to drop it if Math Bots already teaches it, and Math Bots' Bot Stories Level 3 asks for three addends with a total under 20. What Three Laps would have added (make the ten first: 4 + 6 + 3) is a strategy, not a new standard; it's open question 2.
- **Faster Car overlaps Math Bots' Tens and Ones Level 3** ("Which is more?" and the sign). It's kept because the brief makes comparing the heart of this game and the Garage's numbers practise it all the time; here it's a whole kind with its own climb (to 20, then different tens, the same tens, swapped digits, then the signs). Open question 3.
- **Race Chart overlaps Math Bots' Scoreboard** (each, in all, how many more). It's kept: what's new here is the picture graph (most and fewest), and reading a bar against the numbers up the side rather than counting squares. Open question 3.

Sources: the TEKS Grade 1 data strand 1.8(A)–(C) wording (TEA §111.3, via teachstarter.com/us/teks/math-1-8 and texasgateway.org); TEKS 1.2(F) wording (via teachstarter.com/us/teks/math-1-2f); Virginia SOL 2016 Grade 1 (doe.virginia.gov, stds-grade1.pdf) for ordinals. TEKS 1.2(E) and (G) are quoted from memory and not re-checked; their lettering differs between the sites that list them.

## Kinds

Five kinds, three Levels each, with Stretch inside a Level (more cars, closer numbers, bigger tallies). Everything is a tap: no dragging.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Podium** `place`: cars in single file heading for the finish, on the right | start | "Tap the car in second place." 3, 4, then 5 cars; first to fifth | "What place is the green car in?" 5, 7, then 10 cars; three written choices (1st, 2nd, 3rd …) | "The red car passes one car. What place is it in now?" then "… is passed by one car", then either, with 5 to 8 cars |
| **Faster Car** `more`: two cars, each with a speed number on its sign | start | Numbers to 20, at least 6 apart, then 3, then 1 to 4 apart; tap the faster car | Two-digit numbers, different tens (far apart, then any), then the same tens | Swapped digits (14 and 41); then pick <, = or > to go between two numbers (swapped digits, then any two-digit pair; = about one time in six) |
| **Tally Board** `tally`: tally marks on a pit board | Podium L2 | "How many tally marks?" to 5, 8, then 10; three number choices | To 20, 25, then 30, in bundles of five | "Make a tally that shows 17." (＋ adds a mark, ⌫ takes one away, ✓; no running count on his board, so he reads his own tally, and a miss leaves his marks there to fix); then "Which tally shows 17?" from three tallies |
| **Race Chart** `chart`: three cars' race wins | Faster Car L2 | Picture graph (a trophy per win): "Which car won the most races?" / "the fewest?", tap the car | Bar graph with 0 to 10 up the side: "How many races did the blue car win?" three number choices | "How many more races did the blue car win than the red car?" and "How many races did they win in all?" (totals to 20) |
| **Line Up** `order`: three numbers on three cars | Faster Car L2 | Numbers to 20; tap them smallest to biggest (the last one goes in by itself) | Two-digit numbers; biggest to smallest as well; the same tens at Stretch 2 | "Which number goes between 38 and 52?" three choices, the gap narrowing with Stretch |

From Stretch 1 of Faster Car Levels 1 and 2, about one question in three asks for the **slower** car, so "always the bigger number" isn't the rule (default).

**Rules the tests enforce** (`tally/problems.test.ts`, 3,600 generated questions of each kind):

- Exactly one of everything he could tap is right, in every kind and form (every car, every choice, every order of three cars, every tally from 0 to 30).
- Podium cars are told apart by colour and a symbol on the roof (star, bolt, leaf, sun, flame, moon, heart, diamond, crown, ring), never a number. They stand in single file, front car nearest the finish, so no two are level; the finish line, its flag and an arrow showing the way they go are always drawn. A Level 3 pass always lands on a place that exists.
- Faster Car never shows two equal numbers unless the answer is =. The signs are met before they are asked: a Meeting says "Signs compare two numbers. The open side faces the bigger number." and shows <, > and = in turn.
- Race Chart always has three different cars. Level 1 has a clear winner and a clear loser, each by at least two. "How many more" is never zero. "In all" is never over 20.
- Tally marks are always bundles of five, four up and the fifth across. Tally marks are met before they are asked (a Meeting counts five and shows the fifth go across).
- Number choices are sorted, but where the right one sits among them is picked first, so it isn't always in the middle (Math Bots research, 6.3). Wrong choices are real mistakes: counted from the back (Podium), a bundle counted as four or as one (Tally Board), another bar, the two bars added, the biggest bar (Race Chart).
- Line Up never shows the three cars already in order; between-questions have exactly one choice between.

**Unlock order (default).** Podium and Faster Car are open from the start. Tally Board opens at Podium Level 2; Race Chart and Line Up at Faster Car Level 2.

**Mastery, placement and Rounds (as Rover Code).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30 questions of a kind asked at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three probes each of Podium and Faster Car at Level 2, one of each a Round; three clean probes start that kind at Level 2 (which can open the next kinds); two misses stop the row. Rounds are five answers, mixed across every open kind, never the same kind twice running while there's another; about one in three, and always the one right after a miss, is easier and doesn't count; a starred kind comes back about once a Round; a miss comes back later as a new question of the same kind and Level, with no Mastery credit. A Round resumes after a reload (shared `place`).

## Teaching a miss

Never a red X. The first miss gets "Not quite!", one line pointing at what to look at, a cue on the picture, and "Try again!". The second miss (or the first, when he's been missing a lot, or when he taps 🔎) gets the whole worked lesson, ending with the right answer glowing:

- **Podium:** "Count from the finish line." (the finish lights up), then the cars count off from the front, each lighting with a 1st, 2nd … tag as its place is said: "First. Second. Third." then "Third place!". For a pass, the car first moves up (or back) one: "It passes one car, so it moves up one."
- **Faster Car:** both numbers turn into tens rods and ones cubes. "41 has 4 tens. 14 has 1 ten. 41 is more. The bigger number is faster." With the same tens: "Same tens. Look at the ones." and each number's ones. For the slower car: "14 is less. The smaller number is slower." For a sign: "The open side faces the bigger number. 14 is less than 41."; for =, the ones are counted too, then "This one means the same. 45 is the same as 45." (the first-miss pointer for = is "Look at the tens first.", since there's no bigger side to face).
- **Tally Board:** "Count the bundles by fives." 5, 10, 15 (each bundle lights), "Then count the ones." 16, 17, "That makes 17". For a tally he made, his own marks (left on the board) are counted first, then the right tally is drawn beside it and counted. A first miss on a tally under five says "Each mark is one.", since there's no bundle to count.
- **Race Chart:** the columns are counted up, unit by unit. For "how many more", the two columns pair off with dashed lines, "These have no partner." and the ones left over light up as they're counted. For "in all", the count runs on across all three columns.
- **Line Up:** the numbers drop onto a number line (in ones to 20, in tens past that) and light in order; for "between", the two ends are marked and the one between lights: "45 is between 38 and 52."

## The reward: the Garage, the Race and the Cups

His feedback on Math Bots decided the shape: he builds from parts, the parts change what happens, and he drives. Flat 2D canvas, no 3D or physics library.

**The loop.** A finished Round earns Bolts and one Race (🏁). Bolts buy parts. A Race against a track's Rival wins that Rival's part and opens the next track. He starts with one free Race, so he sees the reward before his first purchase.

**The Garage (`garage/`).** His car from the side (and from above, a tap away), its three numbers as bars with the number on each, the big Race button with the track it goes to, and the parts tray. Ten slots plus his race number:

| Slot | Starter | To buy (Bolts) | What it does |
|---|---|---|---|
| Engine | Putt-Putt (Speed 40) | Zoomer 8, V6 16, V8 28, Turbo 42, Twin Turbo 58, Jet 78, Rocket 100 (Speed 46 to 85) | Top speed |
| Tyres | Street (Grip 30, 0.85 everywhere) | Slick 10 (tarmac), Knobbly 10 (dirt), Paddle 12 (sand), Studded 12 (snow), Racing Slicks 40, All-Terrain 60, Gold 90 | Grip, and which surface they suit; the wrong surface only slides wider |
| Wing | None | Little Wing 6, Duck Tail 14, Spoiler 24, Big Wing 36, Twin Wing 50, Shark Fin 68, Mega Wing 90 (Grip +5 to +30) | Grip in the corners |
| Booster | Puffer (1 boost) | Fizz Can 8 (2), Nitro 18 (2, stronger), Turbo Can 30 (3), Twin Nitro 45 (3), Rocket Pack 60 (4), Jet Pack 80 (4), Mega Boost 100 (5) | Boosts per Race, and how hard each kicks |
| Body | Go-Kart | 11 more, 6 to 100 (Beach Buggy to Rocket Car) | Shape, and a little Speed and Grip (up to +10 and +8) |
| Paint | Racing Red | 23 more, 3 to 20 | Looks |
| Rims | Plain | 11 more, 4 to 40 | Looks |
| Decals | None | 19 more, 3 to 45 | Looks |
| Horn | Beep | 9 more, 5 to 40 (a honk in the Garage and a 📯 button in the Race) | Sound |
| Boost Flame | Orange | 9 more, 6 to 50 (flames, then star sparks, bubbles, lightning) | Looks, behind a boost |
| Race number | 7 | Free, 0 to 99 on two wheels, tens and ones | On the bonnet and the door |

- **The numbers are real** (Speed = Engine + Body; Grip = Tyres + Wing + Body; Boost = the Booster's count), and the Race uses them. A part he hasn't got goes on the car to try, with the new number next to the old one (struck through) and the bar's old mark, and Buy beside it, so the Garage quietly practises Faster Car. Buying fits it and says what got better ("Your car got faster!").
- **The Goal** is the part he tapped and couldn't afford, otherwise the cheapest part that changes a number.
- **Everything costs at most 100 Bolts** (the voice's numbers stop at 100). The shop's 110 parts cost 2,734 Bolts in all.

**The Race (`race/`).** From above, the camera following his car, three laps, about a minute in the starter car (45 to 80 seconds measured with a scripted child; about 40 in the best car). His car drives forward by itself; a held finger leads it (it turns toward the finger's spot, the Math Bots fight's pattern, copied not imported); with no finger it drifts gently along the track, so it always gets round. One big 🔥 Boost button (with the boosts left on it) and a 📯 horn; 🏠 twice to leave. Lap and place chips at the top, a little map of the track top right. Walls and cars only bounce him. Countdown "3, 2, 1, Go!"; the voice says "Lap 2!", "Last lap!", "You passed a car!", "Finish!". On a computer, the arrows steer, space boosts, H honks.

- **Parts matter, measured** (`race/race.test.ts`): a Turbo Engine is more than 10% quicker round eight tracks than the starter; a fast car with Gold Tyres and the Mega Wing hits the walls less and goes round quicker than the same car on Street Tyres with no wing; Studded Tyres beat Slicks on snow; the Booster gives exactly its number of boosts.
- **Tracks are data** (`race/tracks.ts`): a closed centre line and a width. 24 tracks, four to a Cup, made from a few waves round a circle so each is smooth and never crosses itself (tested: any two parts of a track far apart along it are at least one and a half track widths apart on the ground). A hand-drawn track can list its own points instead.
- **The Results board** lists all four places and says them aloud ("You came second! First. Zippy. Second. You! …"), then the Bolts, then what he won. Every finish is cheered.

**The Rivals and the Cups (`race/rivals.ts`, one tuning table).** Six Cups (Tarmac, Dirt, Sand, Snow, Night City, Volcano), three Rivals each: Zippy, Sparky, Ace; Dusty, Muddy, Rocky; Sandy, Dune, Sunny; Chilly, Blizzard, Icicle; Neon, Shadow, Midnight; Magma, Ember, Blaze. Every Race on a Cup's track has its three Rivals. Tracks 1 to 3 of a Cup each feature one of them, and finishing ahead of that one Rival (not coming first) wins its part the first time and opens the next track. Track 4 is the **Cup Final** against the Cup's champion (2 Speed faster), for the Cup's trophy. The two Rivals not featured run at 90%.

- **Pacing is in one table** (each Rival's Speed and Grip numbers, its boosts, the Final's extra speed, the pack's share, the mercy step and floor, and the ease-off gaps in `sim.ts`). Measured against scripted children: the first Rival (Zippy, Speed 20) loses to the starter car every time, hands on or off; a plausible car for each point in the ladder beats every featured Rival within three tries; and every Rival falls to the starter car in the end.
- **A Rival who beats him gets slower** on that track: 7% a loss, down to 40% of its pace, until he wins (as Math Bots' League). Rivals far ahead of him ease off (to 86% at 500 units ahead, 74% at 1,100), so he's never left alone on the track.

**More races and rewards, 2026-11-21.** He beat all 24 tracks and the six Cups in about 90 minutes, and then there was nothing left to
race for. The parent asked for more rewards, higher prices at the top end, more vehicles, more and harder races, re-racing, races made
on the fly, and more competition. What changed:

- **Four more Cups, 16 more tracks** (40 in all): Jungle (dirt), Candy (snow: slippery icing), Moon (sand: moon dust) and Rainbow
  (tarmac, a rainbow-striped road), each with its own ground and scenery (palms, lollipops, craters under a dark wash, clouds). Their
  tracks are bigger, narrower and twistier. **Six cars race** in them: five Rivals a Cup (three who feature and have prizes, two more
  in the pack; 20 new Rivals, 12 new Rival parts). Their Rivals are faster than anything before (Speed 92 to 132) and slow less after
  a win (`TOUGH`: 4% a loss, down to 75%). Measured with the scripted child: each Cup takes the previous Cup's car several tries, and
  the car that beat the Volcano Cup can't win a Rainbow track first time.
- **The Rivals race properly.** With six cars they used to rear-end each other every frame and lose speed, and they eased off so hard
  when ahead that a much slower car still won. Now a Rival boxed in behind a car steers round it, only a real bump costs speed, and in
  everything harder than the first six Cups' first races the ease-off is light and stops on the last lap (`LIGHT_EASE` in `sim.ts`).
  The first six Cups' own tuning is unchanged and their tests still pass.
- **Stars: re-racing every track.** A beaten track is raced again for three Stars, each won only by **coming first**, against every
  Rival at full pace and faster with each Star (own Speed + 8 a Star, at least 60/80/100, at most 140). The first win of each Star pays
  3, 5 and 8 Bolts on top. After three Stars a track is "Just for fun!". 120 Stars; the Cups shelf shows ☆☆☆ on each beaten track and
  the total under the podium. A Race he falls short in stays picked, so "Race again" retries it.
- **The Mystery Race: races made on the spot.** Opens with the Tarmac Cup. Each Level is a new track generated from the Level number
  (random Cup ground, random waves, checked never to cross itself, the same track every time for that Level), against five Rivals from
  anywhere. Level 1 is about the Dirt Cup; each Level is 3 Speed faster, up to 140 from about Level 30. First place goes up a Level and
  pays 3 to 8 Bolts more; **every fifth Level wins a Mystery part** (10, never sold, the best in each slot: paint, rims, Question Marks
  decal, sparks, horn, wing, tyres, booster, engine, Mystery Racer body). Endless.
- **Where Race goes**: the track he picked; else the next track to beat; else the next Star (every track's first Star before any
  second); else the Mystery Race. The Cups shelf's purple Mystery card picks it any time.
- **More vehicles**: 14 new Bodies, each drawn as itself in both views: Pickup Truck, Jeep, Taxi, Ice Cream Truck, Police Car, Fire Truck,
  Monster Truck, Limo, Race Bike, Tank, Jet Car, Flying Saucer, Dragon Car, Star Cruiser (30 to 400 Bolts). Rivals drive them too.
- **Pricier top end, and more of it.** Prices above 100 are whole tens up to 400 (the voice has a clip for each, `PRICE_TENS`; "You need
  137 more" is said "You need about 140 more Bolts"). The old top parts went up (Rocket Engine 100 → 150, Gold Tyres and Mega Wing
  90 → 130, Mega Boost 100 → 150, Rocket Car 100 → 160, Hover Car 85 → 120, Jet Engine 78 → 110...). New tiers: four Engines (to
  Supernova, Speed 116, 400), three Tyres, three Wings, three Boosters (to 8 boosts), 8 paints, 6 rims, 8 decals (incl. Tally Marks),
  4 horns, 6 boost trails (hearts, confetti, rainbow ribbon, comet). The Garage's bars now fill at Speed 140, Grip 125, Boost 8.
- **How much**: the shop went from 110 parts costing 2,734 Bolts to 179 costing 11,507 (4.2×); about 380 things to earn (parts, 30 Rival
  and 10 Mystery parts, 40 tracks, 10 Cups, 120 Stars) plus the endless Mystery ladder. What a Round pays is unchanged; a Race pays 2
  plus 1 a car beaten (up to 7 with six cars), plus a Star or Mystery bonus, at most 15.
- Save stays version 1: Stars, `mystery` and the new tracks read as fresh values on an old save (tested), and an old save with all 24
  tracks beaten goes straight to the Jungle Cup. 262 new clips, transcribed back with Whisper; "You won a star" was heard as "You want
  a star", so the line is "You got a star!", and Moon Cup gets a breath ("Moon, Cup").
- Not yet: played on the iPad; the new horns not listened to by a person.

**Show off.** The **Cups** screen is the trophy shelf: one shelf per Cup with its trophy (dark until won) and its four tracks (🔒 locked, 🏁 open, 🚩 beaten, with his best place), his car on the podium at the top, and **Watch it go**: his car alone, driving itself one lap of the last track he raced, boosting on its own, no Race used and nothing paid. Tapping an open track picks it for the next Race.

**Economy defaults, for the parent to confirm.**

- One Race per finished Round; one free Race to start. Races don't expire. A Race is used only at the finish; leaving halfway (🏠 twice) costs nothing and pays nothing. A reload during a Race lands in the Garage.
- Every finish pays 2 Bolts plus 1 for each car he beat (2 to 5). A Round pays at most 6. So a Round and its Race pay up to 11.
- The first new part comes after the first Round: the cheapest parts are 3 Bolts (paints, a Side Stripe), and a Round pays at least 1 and the free Race at least 2. The first part that changes a number is 6 (Little Wing, Beach Buggy).
- A Rival's part goes straight on his car when he wins it. A Rival's part is never for sale; its tile in the tray shows 🏁 and the Rival's name, and tapping it says "Beat Zippy to win it!".
- Re-racing a beaten track pays the finish Bolts again but gives no part.

**How much there is to earn: 158 things.** 110 shop parts (12 bodies, 8 engines, 8 tyres, 8 wings, 8 boosters, 24 paints, 12 rims, 20 decals, 10 horns, 10 boost flames, less one free starter in each slot), 18 Rival parts, 24 tracks and 6 Cup trophies. The brief planned 16 Rival parts; there are 18 because each Cup has three Rivals (three tracks each featuring one, and the Final featuring the champion again for the trophy).

**Controls stay off the edges**, as Math Bots' fight learned: the bottom band and the sides belong to iPadOS, so Boost and the horn sit above a floor of at least 56px and 24px in from the sides. Steering is the canvas itself.

## Look

Race day: tarmac grey, chequered black and white, signal red and pit-lane yellow, with the family look kept (Bungee titles, Nunito reading, 4px black outlines, solid drop shadows that press in). Question screens are a light card. The cars are drawn in code (`art/car.ts`) from the fitted parts, from the side and from above, and the same functions draw the Garage, the tiles, the podium and the Race, so the car in the Garage is the car on the track. Each Cup has its own ground and scenery (trees, rocks, cacti, pines, lit buildings with a dark wash at night, glowing lava). Question cars are SVG, a colour and a roof symbol. Icon: a yellow race car from above crossing a chequered line on a signal-red sunburst, with tally marks (four and one across) as its skid.

Particles are capped (140 skid segments, 60 puffs) so three Rivals, skids and boost flames hold up on an iPad 9; Reduce Motion cuts the puffs and the camera shake.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection turbo-tally` (edge-tts): 708 clips in `public/turbo-tally-voice/`, 9.8 MB (Math Bots' is 10.6 MB, Sight Squad's 26 MB). Trimmed as they decode and chained like Rover Code's ("It costs", "12", "Bolts."). Lines that name a colour are recorded whole ("What place is the green car in?", "How many more races did the blue car win than the red car?": 30 of those), so they sound like one sentence. Answer buttons are not read out (Math Bots' rule). All phrases are recorded; none is pending. Not listened to by a person (see Not done), but every clip was transcribed back with speech-to-text (Whisper small.en) in the review pass: 646 of 707 came back word for word and most of the rest were spellings (tires, one for won, 7th). The real misses were fixed in `COLLECTION_SPEECH['turbo-tally']` in `tools/make_voice.py`: "Make the tally for" came out as "…four" in front of a number, so the line is now "Make a tally that shows"; Honk Horn, Big Rig Horn, Grape Purple, Mega Wing, No Wing, Snowball Bends and "…to open this!" get a breath between the words, and Neon is said "Neon!" (it was heard as "Nian").

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `race/sounds.ts`), no files: an engine note that revs with his speed (deeper and louder with a bigger Engine), countdown beeps, a thud off a wall, a clunk off a car, a boost whoosh, a ping when he passes a car, the crowd at the finish, and ten horns (beep, honk, bike bell, duck, air horn, clown, train, siren, a tune, big rig).

## Save

`turbo-tally-save`, version 1 (a version it doesn't know reads as a blank save), with `turbo-tally-place` for the screen and the Round in progress. The garage keeps what he owns, his car (each slot and his number), his Goal, Races left and raced, each track's best place, Rival losses and whether he's beaten it, the Cups won, the picked track and the last track raced. A save that names a part he doesn't own, a track that doesn't exist or a number out of range reads as the fresh value for that piece.

## Open questions for the parent

1. Is "Turbo Tally" the name?
2. Three Laps (adding three lap scores, making a ten first) was dropped because Math Bots asks three-addend stories. Add it back here as a sixth kind for the make-a-ten strategy?
3. Faster Car and Race Chart overlap Math Bots' Tens and Ones Level 3 and its Scoreboard. Keep both games teaching them (default), or trim one?
4. Is one Race per Round right, and are 2 to 5 Bolts a Race too generous? (`FINISH_BOLTS` and `PER_CAR` in `garage/garage.ts`.)
5. Should he win a Rival's part by beating that Rival (default, as the brief) or by coming first?
6. Is the hands-off drift too helpful? A car with no finger on it still gets round, so the Race can't stall. It isn't slow: it drives at full speed and only steers lazily, and in the review pass a car left alone won the first track outright (first place, 70 seconds). Holding a finger behind the car drives it the wrong way round until the 150-second cap ends the Race in fourth; nothing turns him back.
7. Ordinals are first to tenth in Podium. Some schools stop at fifth in first grade; is tenth right?

## Not done

- **Not run on a real iPad 9, an iPhone or in Safari/WebKit.** The steering feel, which decides whether this is fun, can only be judged in his hands on the device. Checked in Chromium (Playwright) at 810×1080, 1080×810, 390×844 and 844×390 with `tools/turbo-tally/tour.ts`, on a new save and on saves with every kind open at Level 2 and at Level 3; offline with `tools/turbo-tally/offline.ts`.
- **The voice has not been listened to by a person** (only transcribed back by machine). "Grip" alone is heard as "Crip" however it's written. The clips most likely to be wrong: single words and names said alone (Ace, Dune, Neon, Chilly, Sparky, Ember), chain pieces the voice may end like a sentence ("has", "and", "ten.", "one.", "is between", "to win the"), part names with letters or hyphens ("V6 Engine", "V8 Engine", "Go-Kart", "Putt-Putt Engine", "All-Terrain Tyres"), "Lap 2!", and "Tyres" (British spelling, should sound the same). Fixes go in `SAID_AS` in `tools/make_voice.py`.
- The 60 fps budget on an iPad 9 is not measured, only capped.
- Later, not in the first build (from the brief): a track builder where he lays his own circuit from pieces.
- No Legendaries, no Tune-Up for Tally Board, Race Chart or Line Up (they start at Level 1 when they open).
