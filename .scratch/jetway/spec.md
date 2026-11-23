# Spec: Jetway (two-digit adding and taking away, numbers past 100; build an airport and fly from it)

Status: built on 2026-11-23 (pass 1 of 3: build; pass 2, bug and sound review, the same day), playable at `/jetway/` with a tile in **Learning Games** on the landing page, after Sky
Writer. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is still a
working name.

A new learning game on the family site, built the same way as Turbo Tally (`src/turbo-tally/`, `.scratch/turbo-tally/spec.md`) for the
same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9), and the first of the third batch,
which steps up to early second-grade work. Short mixed Rounds earn Bolts, spent on airport pieces, planes and liveries. Each Round also
earns a Flight: he leads his plane from its gate, takes off, picks up stars and lands at another airport.

## Research: what it teaches, and where it starts

Started from the standards the brief named, in the manner of `.scratch/math-bots/research/first-grade-math.md`. Legend: **[V]** read in
a source this session, **[S]** search result or summary only, **[M]** from memory, not re-checked.

| Standard | What it asks | Where it is in Jetway |
|---|---|---|
| CCSS 2.NBT.A.1 | Three-digit numbers are hundreds, tens and ones; 100 is a bundle of ten tens; 100, 200 … 900 [M] | **Jumbo** L1 and L2 (blocks to a number; which digit is in a place); the Seats Meeting |
| CCSS 2.NBT.A.2 | Count within 1000; skip-count by 5s, 10s and 100s [M] | Partly: **Ten Hops** L1 and L2 (by tens and hundreds). Skip-counting by 5s is left out (Math Bots' Skip Count does 10, 5 and 2 to 120) |
| CCSS 2.NBT.A.3 | Read and write numbers to 1000 with numerals, number names and expanded form [M] | **Jumbo** L1 (to 199, then 999), L2 (`300 + 40 + 6`, numbers with a zero). Number names (words) are left out: he leans on the voice to read |
| CCSS 2.NBT.A.4 | Compare two three-digit numbers by their hundreds, tens and ones, with >, = and < [M] | **Jumbo** L3 |
| CCSS 2.NBT.B.5 | Fluently add and subtract within 100 using place value, properties and the inverse [M] | **Boarding** L1–L2, **Unload** L1–L2, **Missing Bags** |
| CCSS 2.NBT.B.6 | Add up to four two-digit numbers [M] | Not asked (open question 4) |
| CCSS 2.NBT.B.7 | Add and subtract within 1000 with models and place-value strategies; composing and decomposing tens or hundreds [S, cde.ca.gov] | **Boarding** L3 (`67 + 58`), **Unload** L3 (`100 - 36`, `143 - 28`); every lesson's seat blocks regroup a ten (and a hundred) |
| CCSS 2.NBT.B.8 | Mentally add or subtract 10 or 100 to or from a number 100–900 [S, cde.ca.gov] | **Ten Hops** L1 and L2 |
| CCSS 2.NBT.B.9 | Explain why the strategies work, using place value [M] | The lessons say why ("Ten ones make a new ten", "Not enough ones? Break a ten") |
| TEKS 2.2(A), (B) | Compose and decompose numbers to 1,200 as thousands, hundreds, tens and ones; standard, word and expanded forms [M] | **Jumbo** (to 999 only) |
| TEKS 2.2(C) | Generate a number greater or less than a given number to 1,200 [S, TAC §111.4 via law.cornell.edu] | **Ten Hops** (ten or a hundred more and less) |
| TEKS 2.2(D) | Use place value to compare and order numbers to 1,200 with words, numbers and >, <, = [S, teachstarter.com; the lettering differs between sources] | **Jumbo** L3 |
| TEKS 2.2(E), (F) | Locate a number on an open number line; name the number at a point [M] | **Ten Hops** L3 and **Missing Bags**' lesson (the runway line) |
| TEKS 2.4(B), (C) | Add up to four two-digit numbers and subtract two-digit numbers with mental strategies and place-value algorithms; word problems within 1,000 [M] | **Boarding**, **Unload** and **Missing Bags**, each framed as a one-line spoken story |

**Where it starts.** Read in the code (`src/math-bots/numbers/problems.ts`) as well as the spec: Big Jumps ends at Level 3 with `28 + 5`
(a two-digit number plus a one-digit number crossing a ten) and `46 + 20` (plus a decade), totals under 100; Tens and Ones ends with
two-digit compare and the signs; Number Chart ends with ten more and less to 120 on the chart; Over Ten is single-digit make-ten. So
Jetway's Level 1 sums always have two two-digit numbers (`34 + 25`, `57 - 23`), Jumbo starts at 111, Ten Hops' ten more and less is past
100 and on a number line rather than a chart, and no kind repeats one of theirs (tested: `sums/problems.test.ts`, "begin past Big Jumps").

**Two choices made from the research (defaults):**

- **No column method.** Sums are written across, never stacked (the brief's rule; the standard algorithm is a fourth-grade expectation in
  CCSS 4.NBT.B.4 [M]). The seat blocks carry the place-value idea.
- **Signs are met here.** The < > = signs are asked only after a short spoken Meeting in Jumbo (he may not have played Turbo Tally).

## Kinds

Five kinds, three Levels each, with Stretch inside a Level. Boarding, Unload and Missing Bags are answered on **number wheels**, one for
each digit (he builds the answer and can't pick it by its last digit); three wheels only when the answer can pass 100. Jumbo and Ten
Hops are three choices or a tap on a digit.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Boarding** `add`: two groups of passengers board one plane | start | no carrying (`34 + 25`); Stretch 0 keeps the total under 70 | carrying a ten (`38 + 25`), totals under 100 | totals past 100: the tens pass 100 (`74 + 52`), then both carry (`67 + 58`), then either; three wheels |
| **Jumbo** `hundreds`: seats in blocks of a hundred, rows of ten and single seats | start | the blocks show which number? 111–199, then to 999; at Stretch 2 the mat's columns can stand ones-tens-hundreds, so he reads each by its name | "Which digit is in the tens place?" (all digits different, so one tap is right); numbers with a zero (`306`: 36, 306, 360); `300 + 40 + 6` | which plane holds more (or fewer): different hundreds, then the same hundreds, then the bigger tens in the smaller number (`389` and `412`); then <, = or > (= about one in six) |
| **Unload** `take`: bags come off a plane | Boarding L2 | no borrowing (`57 - 23`) | borrowing a ten (`62 - 17`) | from a round number (`80 - 36`), then 100 or a round number, then from past 100 (`143 - 28`, three wheels) |
| **Ten Hops** `hop`: hops along a runway number line | Jumbo L2 | ten more and ten less to 200: no hundred crossed, then crossing it (`93 + 10`, `104 - 10`), then any | a hundred more, then less, then mixed with ten more and less past 200, to 999 | two hops: `47 + 38` as a jump of 30 (he taps where it lands) then of 8; at Stretch 2 taking away too (`85 - 38`) |
| **Missing Bags** `gap`: some bags are on the belt; how many more fill the cart | Unload L2 | to the next ten (`38 + ? = 40`) | to a later ten (`38 + ? = 60`) | any two numbers: no ten to pass (`32 + ? = 65`), then passing one (`38 + ? = 65`), then any |

**Rules the tests enforce** (`sums/problems.test.ts`, 2,700 generated questions of each kind):

- Each Level's sums match its row: a Level 1 Boarding or Unload sum never carries or borrows, a Level 2 sum always does, and only Level 3
  passes 100 (Boarding's total, Unload's starting number; Missing Bags stays under 100). Ten Hops and Jumbo are about numbers past 100,
  so the "only Level 3" rule is for the three sum kinds (default).
- No answer is below zero, and nothing shown, asked or offered passes 999.
- Where there are choices exactly one is right, and the wrong ones are the real mistakes: a tens/ones swap, the digits back to front, a
  block counted twice or left out (Jumbo); the zero left out or put in the wrong place (`306`: 36, 360); one more instead of ten more, a
  hundred more, the wrong way (Ten Hops). Number choices are sorted, with the right one's place picked first, so it isn't always in the
  middle (Math Bots research, 6.3; tested).
- On the wheels, every number from 0 to 99 (or 999) is a possible answer and exactly one is right. The real mistakes are kept for the
  lesson: the ten not carried (`38 + 25 = 53`), both columns written down (`513`), the smaller digit taken from the bigger in each column
  (`62 - 17 = 55`).
- About one sum in four is written with the answer on the left (`? = 38 + 25`; measured 18–32%), and every sum is written across.
- The < and > signs are asked only after the Signs Meeting; the first Jumbo question is after the Seats Meeting ("This is one seat. Ten
  seats make a row of ten. Ten rows make a block of a hundred.").

**Unlock order, Mastery, placement and Rounds (as Turbo Tally).** Boarding and Jumbo are open from the start; Unload opens at Boarding
Level 2, Ten Hops at Jumbo Level 2, Missing Bags at Unload Level 2. 16 of the last 20 right on the first try, or the last 10 in a row;
the first 30 questions of a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a
Tune-Up: three probes each of Boarding and Jumbo at Level 2; three clean probes start that kind at Level 2. Rounds are five answers, mixed,
never the same kind twice running while there's another; about one in three (and always the one after a miss) is easier and doesn't
count; a miss comes back later as a new question with no Mastery credit. A Round resumes after a reload.

## Teaching a miss

Never a red X. Every lesson uses the same picture: the **seat mat**, a column each for hundreds, tens and ones, with blocks of a hundred
seats, rows of ten and single seats (blue for the first number, orange for the second, green for a ten or hundred made or broken), or the
**runway number line** for hops. The first miss gets one line pointing at what to look at, the picture, and "Try again!". The second miss
(or the first when he's been missing a lot, or 🔎) gets the **fuller lesson: the same sum walked through one step at a time, and he taps
the big yellow arrow to move each step on** ("Tap the arrow." the first time). It ends with the right answer glowing and his wheels kept,
so he fixes his own number.

- **Boarding:** "Add the ones first." → the ones light: "8 and 5 make 13." → ten of them are ringed: "Ten ones make a new ten." → they
  become a green row of ten in the tens: "That is one ten and 3 ones. The new ten goes with the tens." → "Now add the tens. 6 tens." (and
  "Ten tens make a hundred." past 100) → the digits appear under the columns: "That makes 63." First miss: "Don't forget the new ten!" if
  he wrote 53, "Ten ones make a new ten." if he wrote 513, else "Add the ones first."
- **Unload:** "Take away the ones first." → "You need to take 7, and there are only 2." → a row of ten breaks into ten green ones: "Break a
  ten. Now there are 12 ones." (a block of a hundred breaks into rows first when there are no tens: `100 - 36`) → the ones taken away are
  crossed: "Take away 7." → "Now take away the tens. Take away 1 ten." → "That leaves 45." First miss: "Not enough ones? Break a ten." when
  he took the smaller digit from the bigger, or there aren't enough ones.
- **Jumbo:** the number is built block by block, hundreds first, each digit lighting under its column as its blocks land ("2 hundreds. 4
  tens. 3 ones. That makes 243."; "No tens, so the tens digit is zero."). For a place: the column lights ("This is the tens place. 4
  tens."). For compare: "Look at the hundreds first." → "Same hundreds. Look at the tens." → "412 is more." / "389 is less than 412."
- **Ten Hops:** the hop is drawn on the runway line with what it adds; "Ten more: the tens digit goes up one. The ones stay the same.
  That makes 83." Across a hundred the tens digit doesn't go up or down one, so the lesson says what does happen: "Ten more. Ten tens make
  a hundred. The ones stay the same. That makes 103." for `93 + 10`, and "Ten less. No tens, so break a hundred." for `104 - 10` (pass 2;
  tested). Two hops: "Jump the tens first. 47 plus 30 lands on 77. Then jump the ones. 77 plus 8 lands on 85."
- **Missing Bags:** "Hop to the next ten." → "That is 2." → "Then hop to 65." → "That is 25 more." → "2 and 25 make 27."

Tested (`sums/teach.test.ts`, thousands of questions): every fuller lesson waits on the arrow and ends on the right answer; Boarding's
mat ends showing exactly the sum with fewer than ten in each column; Unload breaks a ten exactly when it must and ends on the difference.

## The reward: the Airport, the Flight, the Routes and the Charters

**The loop.** A finished Round earns Bolts and one Flight (✈️). Bolts buy airport pieces, planes, liveries, trucks, signs and garden
things. A Flight to a Route he hasn't flown opens the next one. He starts with one free Flight, so he sees the reward before his first
purchase. Flat 2D canvas, no 3D or physics library, no new dependencies.

**The Airport (`airport/`, from above).** A wide plot that starts as a grass strip and a shed. Every piece has a fixed place
(`airport/plot.ts`), so the layout works whatever order he buys in; tested: no two places overlap except stages of one thing (the
terminal's stages, the tower's two). The screen shows his airport with his Fleet parked at their gates, the big **Fly** button (with his
Flights and where it goes), the **Goal** (a bar filling toward what he's saving for: what he tapped and can't afford, else the cheapest new
thing), 👀 **Watch it run**, 🗺️ **Routes**, and the tray: Build, Planes, Paint, Stripes, Tails, Marks (and his airline's name, two words
he taps through, each said), Trucks, Signs (and the runway light colour) and Garden. Tapping a thing says its name and price ("It costs
140 Bolts", "You need about 30 more Bolts."); Buy buys it.

**Pieces matter** (`airport/airport.ts`, tested):

| Piece | What it changes |
|---|---|
| Tarmac Runway, Long Runway | which planes can fly: the Two-Seater, Crop Duster and Floatplane fly off grass; the Turboprop, Regional Jet, Private Jet and Water Bomber need tarmac; the Cargo Plane, Jumbo, Double-Decker and Supersonic Jet the long runway. A plane he owns but can't fly stays parked, and says what it needs |
| Helipad | the Helicopter flies (it lifts straight up, no taxi) |
| Gates 1–6, Another Gate | each parks one more plane; more planes and more traffic in "Watch it run" |
| Control Tower, Tall Tower | night Routes (City at Night, Lighthouse Point; Space Port and Northern Lights need the Tall Tower) |
| De-icing Pad, Snow Plough Garage | snowy Routes (Snowy Town, North Pole; Ice Glacier) |
| Seaplane Dock | island Routes (Palm Island, Volcano Island, Coral Reef) |
| Cargo Apron | Busy Harbour, and the Cargo Loader truck |
| Weather Station, Fuel Farm, Radar, Small and Big Terminal, Long Runway | Red Canyon, Sunset Coast, Rocket Range, Big City, Capital City, Castle Hill |
| Radar | a radar scope in the Flight shows the stars ahead, above or below |
| Approach Lights | the line of lights starts further out (12 lights, not 8) |
| Crossing Runway | lands into the wind: gusts are half as strong |
| Paint Shop | stripes can be bought |
| Ticket Hut → Small → Big → Glass Terminal, car parks, bus stop, taxi rank, hotel, train, monorail, Another Concourse | more passengers on each Flight (the plane's seats, as many as the airport brings) |

**The Fleet.** Twelve planes, each drawn in code from the side and from above (`art/plane.ts`), each with its own name (24 to tap
through, each said) and livery: a body colour, a stripe, a trim colour and a tail art, bought once and used on any plane (30 × 13 × 30 ×
25 = 292,500 planes before the Charter tails), and the airline's mark on every plane. Special planes play differently: the Helicopter lifts
straight up; the Crop Duster trails spray; the Water Bomber has a **Drop** button that puts out fires below for more stars; the Cargo
Plane picks up crates; the Supersonic Jet booms and cruises fastest; the Jumbo and Double-Decker carry hundreds of passengers.

**The Flight (`flight/`, about a minute: 50 to 80 seconds with the scripted children, 50 in the browser tour).** On the card: where he's going, the weather, his plane and his bests there.

1. **Taxi, from above** (his own airport): he holds a finger and the plane heads for it, as Math Bots' robot does (copied, not imported).
   A dashed yellow line and a green circle show the way to the runway. Paved ground is quick, grass slow; it never stops. With no finger
   it rolls along the taxiway by itself; after 16 seconds a follow-me car leads it whatever he does ("Follow the car!").
2. **The take-off, from the side** (the view changes at the line-up, "Line up! Hold the throttle!"): holding the big 🔥 Hold button (or a
   finger anywhere) speeds it up; letting go only speeds it up more slowly. It lifts when it's fast enough ("Lift off!").
3. **The cruise:** a held finger sets how high it flies (a dashed line shows where it's heading). Stars (or crates) among the clouds,
   scenery for the Route sliding by, rain or snow, day or night. Gusts only wobble it. The ground can't be reached.
4. **The approach:** "Follow the lights down!" A line of rings down to the far runway; each he flies through turns green. With no finger
   the plane drifts onto the line itself. Too high over the runway: "Too high! Go around!", once, and the second approach lands itself.
5. **Touchdown and the roll to a stop**, at the far airport, built from its parts. "Smooth landing!" (3), "Good landing!" (2) or "Bumpy
   landing!" (1), by how many rings he flew through.

**It cannot be failed and he can't get stuck** (`flight/sim.ts`, tested with three scripted children, doing nothing, clumsy (a finger
anywhere, on and off) and careful, on every Route in every plane from a bare and a fully built airport): every Flight reaches the far
runway and stops, in under 150 seconds; a finger held off the plot only takes the plane to the edge until the follow-me car comes.

**Routes (`airport/routes.ts`).** Twenty-four, flown in order, each with its own icon, weather and little airport: Sandy Beach, Farm
Field, Lake Town, Desert Strip, Big City, High Mountains, Palm Island, Snowy Town, City at Night, Rainforest, Red Canyon, Volcano Island,
Busy Harbour, Castle Hill, Lighthouse Point, Rainbow Valley, North Pole, Coral Reef, Sunset Coast, Ice Glacier, Rocket Range, Capital
City, Space Port, Northern Lights. A Route that needs a piece he hasn't built waits (🔒 and the piece's icon on the board; tapping it
says what to build) and the Fly button skips to the next, so he's never stuck (tested). His **personal bests** on each (most stars, best
landing) are on the Routes board; beating one is cheered ("New best!") and pays one more Bolt. The board's rows pick a Route to fly
again.

**Show off: "Watch it run" (`watch/`).** His airport working by itself: his own planes (up to six) land on his runway, taxi to his
gates, wait while his trucks (up to eight) come and go, push back, taxi out and take off; one plane on the runway at a time. More gates,
planes and trucks mean more traffic. Nothing is paid or used.

### Rewards that never run out

The guide's three layers:

1. **The endless layer: Charter Flights** (`airport/charter.ts`). Open after three Routes, always on offer from then. Each is generated
   from its number (seeded, so the same on a reload): one of 30 towns, one of 20 sceneries, the weather, day or night, the wind (rising
   with the number to a ceiling of 0.8: wind only wobbles), the distance (a little longer each one, from 5,400 to a ceiling of 8,600 at
   Charter 80), 10 to 18 stars, and a little airport at the far end laid out from parts (tower, terminal, hangars, trees, sign; never
   overlapping). **Every fifth Charter brings a Charter-only prize, never sold:** twelve hand-made ones (Comet, Aurora, Phoenix, Whale and
   Flying Saucer tails; purple, pink, green and rainbow runway lights; the Charter, Globe and Trophy signs), then numbered Charter Tails
   made from a picture and a colour, without end. Tested: 3,000 Charters generated, each the same twice, laid out properly, flown to the
   end by a child who does nothing (and every tenth by the clumsy child), with a unique prize every fifth and none for sale.
   **The passenger counter** is endless too: every Flight adds its passengers to the big board, with a rank at each milestone (Airstrip,
   Airfield 50, Airport 250, Big Airport 1,000, Hub 3,000, Big Hub 7,000, Mega Hub 15,000, then Super Hub 1, 2, 3 … every 10,000, without
   end). **Liveries made from parts** give hundreds of thousands of planes.
2. **Things to buy again and again:** Another Concourse (60, +10 each, flat at 120; more passengers), Another Gate (40, +5, flat at 80;
   another parked plane), Another Hangar (50, +10, flat at 100) and Runway Stretch (30, +5, flat at 60; a longer runway). They open after
   the Big Terminal, the sixth gate, the Big Hangar and the Long Runway. Only 4 to 8 of each are drawn; the rest are counted on a sign.
3. **The fixed catalogue: 256 things.** 203 to buy (57 pieces, 20 signs and lights, 20 garden things, 11 planes, 29 paints, 12 stripes,
   24 tails, 12 airline marks, 18 trucks; 7,767 Bolts in all), 24 Routes and 29 Trophies, plus the 5 free starters.

**Measured with the scripted child** (`airport/economy.test.ts`: every answer right first try, every Flight flown with every star and a
smooth landing, the cheapest new thing always bought first):

- **Bolts a Round: 12.9** (a Round's 6 and its Flight's 2 to 9) over the first 300 Rounds. No Round and Flight pays more than 15, the
  same ceiling as Turbo Tally's Round and Race.
- **The fixed catalogue lasts 601 Rounds** (every Route flown by Round 409, every Trophy by Round 1,277). At the guide's first guess of
  about 20 Rounds an hour that is about 30 hours; the tour measured a Round with two deliberate misses at about 90 seconds and a Flight at
  about 50, so a perfect child plays nearer 25 to 30 Rounds an hour.
- **The longest gap between new things: 2 Rounds in the first 100** (6 in the first 300). His first purchase is in Round 1.
- After 2,000 Rounds something new is still on offer every Round (a new Charter every Flight, the again-and-again things), and no
  state reads "all done".
- The dearest thing, the Supersonic Jet (400), is 31 Rounds of saving; seven things take more than 15 (Supersonic Jet, Double-Decker,
  Jumbo Jet, Glass Terminal, Crossing Runway, Museum Hangar, Water Bomber). The twelve dearest are all planes and pieces.

**Economy defaults, for the parent to confirm.** One Flight per Round, the first free; Flights don't expire, and one is used only at
touchdown (leaving with 🏠 twice costs nothing). A Flight pays 2, plus 1 for every 5 stars (up to 3), plus 3 for a new Route or 2 for a
Charter, plus 1 for a new best: 2 to 9. Prices up to 100 in ones, then whole tens to 400. Everything is kept; nothing is ever lost.

**Competition.** The Air Race is **not built** (the brief makes it optional; see Not done). His **personal bests on every Route** (most
stars, best landing) are kept, shown on the board and cheered, and need no balancing.

## Look

Airport colours: tarmac grey, runway white, taxiway yellow, sky blue and high-visibility orange, with the family look (Bungee titles,
Nunito reading, 4px black outlines, solid drop shadows). Signs are yellow on black with big numbers: the sum card, the wheels, the
passenger board, the gate numbers, the Routes board. Everything is drawn in code (planes, the plot and its 77 pieces, the far
airports); emoji stand in for small icons. The plane at the gate is the plane he flies. Icon: a jet bridge meeting a plane's door, with a
plus sign on its orange tail, over a taxiway's yellow line. Apart from Time Flies and Sky Writer (one plane he owns): here the airport is
the thing he builds. This is a first pass: pass 3 is the design pass.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection jetway`: 701 clips in `public/jetway-voice/` (9 MB; pass 2 removed 19
lines nothing said and added three). Numbers to 100 are a
clip each; past 100 a hundreds clip and the rest ("three hundred", "6"), so every number to 999 has a voice from 109 clips; prices past
100 use whole-ten clips (`PRICE_TENS`, "You need about 140 more Bolts." as Turbo Tally). The story that frames a sum is said once ("38
people are on the plane. 25 more get on. How many are on the plane now?"); sums and number buttons are not read out. Every item, Route,
town, plane name, airline word, rank and Trophy name is a clip. Not listened to by a person. Pass 2 transcribed every clip back with
faster-whisper small.en, and the ones it doubted (and the short names) with large-v3-turbo, and re-recorded what both models misheard,
with a breath round the name (`COLLECTION_SPEECH['jetway']` in `tools/make_voice.py`); every clip's speech length fits its text. See Not
done for the clips the parent should hear.

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `flight/sounds.ts`): an engine that rises with the throttle (a jet hisses, a propeller
buzzes), a ping for each star and each ring, a gust, the touchdown (with a chime for a smooth one), the water drop, the supersonic boom,
and the crowd at the end.

## Save

`jetway-save`, version 1 (a version it doesn't know reads as a blank save), with `jetway-place` for the screen and the Round in progress.
The airport keeps what he owns (and his Charter prizes), how many of each again-and-again thing, each plane's livery, the plane he flies,
his airline, the runway light colour, his Goal, Flights left and flown, each Route's record, the next Charter, the picked Route,
passengers, Trophies and smooth landings. Anything that doesn't read, or names a thing he doesn't own, reads as the fresh value. A reload
during a Flight lands in the Airport with the Flight unused.

## Open questions for the parent

1. Is "Jetway" the name?
2. Are the number wheels quick enough for three digits on the iPad 9, or should Level 3 use a number pad (the brief's fallback)?
3. The step from Level 1 to Level 2 (carrying, borrowing) is the hardest on the site. If he stalls, add Stretch inside Level 2 with the
   blocks left on screen (the brief's plan), rather than a new Level?
4. Adding three or four two-digit numbers (2.NBT.B.6) and skip-counting by fives to 1000 are not asked. Add them?
5. Is one Flight per Round right, and are 2 to 9 Bolts a Flight right? (`FLIGHT_BOLTS` and the rest in `airport/airport.ts`.)
6. Should the taxi stay (the brief's risk: the view changes from above to the side)? If it confuses him, the fallback is a straight
   roll from the side.
7. Should an Air Race (round pylons, against rivals) be added, or are personal bests enough?
8. Ten Hops at Level 1 reaches 200 and Jumbo reaches 999 from Level 1 Stretch 1; is that the right pace?

## Not done

- **Not run on a real iPad 9, an iPhone or in Safari/WebKit.** Checked in Chromium (Playwright) at 810×1080, 1080×810, 390×844 and 844×390
  with `tools/jetway/tour.ts`, on a new save and on saves with every kind open at Level 2 and at Level 3; offline with
  `tools/jetway/offline.ts`. What most needs checking on the device: the taxi's held finger and the view change; the throttle button
  held while the iPad's edge gestures are near; the wheels' size and speed for three digits; frame time on the iPad itself. Pass 2 measured
  in Chromium with the CPU slowed 4× and the GPU on (Metal): 60 fps on Home, in "Watch it run" and in the Flight on a fully built airport
  (the Airport screen 53 fps on average, with an occasional long frame; the taxi 49 fps on average, its first frames). With software
  drawing (the default headless browser) the Airport, "Watch it run" and the Flight fall to 15 to 36 fps, so the canvas leans on the GPU.
- **The Air Race is not built** (the brief makes it optional). So no rival, no tuning table, and no three-children win-rate test; the only
  competition is his personal bests on each Route.
- **The voice has not been listened to by a person.** Transcribed back by two speech-to-text models (pass 2), which heard the pass-1
  suspects right ("and", "make", "plus", "take away", "lands on", "ten.", "one.", the hundreds, "Two-Seater", "Double-Decker", "Follow-Me
  Car", "De-icing Pad", "Air", "Lines", "Jets", "Nimbus", "Whizzer", "Fox Hollow", "Misty Glen", "Boom!"). For the parent to hear:
  "Baggage Hall" (both models hear "haul" however it's written), "Kite Hill" (said as two words with a pause, the only way both models
  heard "Kite"), "De-Icer Truck", "You opened Unload!", "You are a Ten Hops star!", "You are a Missing Bags star!", "The cart holds",
  "Ten more." / "Ten less." (new), "Phoenix Tail" and "Rainbow Tail" (tail or tale), and a chained number line such as "three hundred",
  "6".
- **Seen in the browser:** every kind's Levels 1 to 3 and a deliberate first and second miss in each kind (the fuller lesson walked
  through with the arrow), including the two-hop form, the signs and "which plane holds more". Pass 2 also saw on screen, with first and
  second misses, Unload Level 3 (from a round number, from 100 and from past 100, on three wheels) and Jumbo Level 2's numbers with a zero
  and `800 + 70 + 6`.
  `TOUR_WINDOW=0` (a Level's first forms) and `TOUR_ROUNDS=n` reach more of them. `tools/jetway/looks.ts` screenshots a fully built
  airport; `tools/jetway/shot.ts` and `tools/jetway/measure.ts` were used to fix the phone layouts.
- Number names in words (2.NBT.A.3's "number names") are not asked.
- No Tune-Up for Unload, Ten Hops or Missing Bags (they start at Level 1 when they open).
- Planes are drawn simply; pass 3 is the design pass (the plot's pieces are boxes with emoji; the question screens' pictures are plain).
- **Found in pass 2 and left for the design pass:** on the seat mat a block of a hundred is drawn smaller than one row of ten (6px seats
  against 20px), so a hundred can look like less than a ten; the extra gates' planes (Another Gate) are drawn over the tower and the
  workshops; at 1080×810 the hundreds wheel touches the mat's ones column; a mat of nine hundreds is about 2,000 SVG shapes redrawn at each
  lesson step.
- **The again-and-again things stop changing anything after a few:** only 4 concourses, 8 extra gates, 4 hangars and 4 runway stretches
  are drawn; past those they are a count on a sign. Concourses stop adding passengers once the Glass Terminal's 600 outnumber the biggest
  plane's 550 seats, and past the fifth extra gate there is no plane left to park (eleven planes use stands). The Charters (new every Flight, a prize every fifth) and the passenger
  ranks carry the endless layer; whether these four should keep doing something is for the parent.
