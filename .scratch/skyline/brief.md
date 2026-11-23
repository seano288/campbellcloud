# Brief: Skyline (equal groups, rows and columns, the start of multiplying; build a city and drive in it)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Skyline. Slug: `skyline`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. Second grade lays the ground for multiplying: equal groups, things set out in rows and columns, adding the same number again and again, and odd and even (Common Core 2.OA.C.3, 2.OA.C.4, 2.G.A.2 and 2.NBT.A.2, leading into 3.OA.A.1). Nothing on the site teaches it. Math Bots' Skip Count has the counting by tens, fives and twos to 120, and Skyline builds on it.

He likes building cities, so the city is the reward. A city is made of equal groups: windows in rows, cars in a car park, seats on a bus.

## What he learns

Start the research from 2.OA.C.3, 2.OA.C.4, 2.G.A.2, 2.NBT.A.2 and 3.OA.A.1 to A.3, and the matching TEKS Grade 2 strand, the way `.scratch/math-bots/research/first-grade-math.md` did. Read Math Bots' Skip Count in the code first, so that Count By here starts past it.

The order matters. He meets equal groups and rows as pictures and as adding first. The × sign comes last, as a short way to write what he already knows.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Equal Groups** `groups`: buses with people on them | start | "Do all the buses have the same number?" then "How many buses? How many on each?" | "3 buses, 5 on each. How many people?" with the picture (totals to 30) | the same with no picture, only "4 groups of 5"; then pick the picture that shows it |
| **Windows** `array`: a building face with windows in rows | start | "How many rows?" and "How many in each row?" (up to 5 by 5) | "How many windows?" | pick the adding sentence that matches (`4 + 4 + 4`); then rows and columns swapped: is it the same number? |
| **Odd or Even** `pair`: people pairing up for a ride | Equal Groups L2 | up to 10 people shown: does everyone get a partner? | numbers to 20 with no picture | "Which makes 14?" (`7 + 7`); an even number is two equal halves |
| **Count By** `count`: house numbers along a street | Windows L2 | by hundreds to 1,000; by tens from any number (`37, 47, 57`) | by fives past 100; a missing number in the middle | by threes and fours with the groups shown |
| **Share It** `share`: boxes shared fairly between trucks | Equal Groups L2 | share 6 to 12 between 2 trucks; he moves them one at a time, then ✓ | between 3 or 4 trucks | "12 boxes, 3 on each truck. How many trucks?" |
| **Times** `times`: the × sign | Windows L3 and Equal Groups L3 | match `3 × 4` to its picture, said as "3 rows of 4" | twos, fives and tens, as written facts | threes and fours; the turn-around (`3 × 4` is the same as `4 × 3`) |

Rules the tests must enforce:

- Exactly one choice is right, in every kind.
- Every array is a full rectangle with no gaps, and rows are always the lines that go across. A building with 3 rows of 4 never appears beside a choice of 4 rows of 3 unless the question is the turn-around one.
- Totals stay at 50 or less, and no group or row is bigger than 10.
- Share It always comes out even. Leftovers are a third-grade idea.
- Wrong choices are the real mistakes: the two numbers added (`3 + 4 = 7`), one group too many or too few, the count of groups given for the total.
- The × sign is met before it is asked, in a short spoken introduction, and is always said as "rows of" or "groups of". The word "times" is added only at Times Level 2.
- Odd or Even never asks about zero.

## Teaching a miss

- **Equal Groups and Windows:** the groups or rows light one at a time while the count goes up by that number: "Four. Eight. Twelve."
- **Odd or Even:** the people pair off two by two. One left alone means odd.
- **Count By:** the numbers land on a hundred chart or a number line and the jump between them is drawn.
- **Share It:** the boxes are dealt out one at a time to each truck, round and round.
- **Times:** the fact turns back into its picture, and the picture is counted row by row. For the turn-around, the building is tipped on its side.

A second miss gets the fuller lesson, with him tapping each row to count it himself.

## Voice

He reads numbers, so number buttons are not read out. The question is spoken. New clips: rows, columns, groups of, equal, odd, even, share, the kind names and the building and vehicle names. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the City, the Job and the Districts

He wants to build a city, so the building is the main reward. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Job. Bolts buy buildings, floors and vehicles. Jobs open new Districts.
- **The City (from above).** Streets are a fixed grid, so every plot can always be reached and every Job can always be driven. He chooses what goes on each empty plot: houses, shops, a school, a fire station, a hospital, a library, a cinema, a park, a pond, a stadium, a market, a train station, a bridge, a clock tower, a Ferris wheel. He can move a building or swap it at any time and gets nothing taken away.
- **Towers grow by floors.** A tower is bought one floor at a time, and each floor is a row of windows, so his skyline is made of arrays he can count. A side view of the street shows the towers at their real heights.
- **Buildings matter.** A bus depot adds bus Jobs. The fire station, the harbour and the helipad add their own. Houses add people on the pavements, and shops and parks give them somewhere to go.
- **The Job (action, 2D canvas, from above, about a minute).** He drives through the city he built. A held finger leads the vehicle, as in the Math Bots fight (`src/math-bots/fight/` is the pattern to copy, not import). Jobs: a bus route that stops at stops, a taxi fare, a parcel round, the bin lorry, a street sweeper, a tram line, an ice-cream van, a helicopter tour over the rooftops. Passengers and parcels come in equal groups, and the count is said as he collects them, which practises the game quietly.
- **It cannot be failed.** Kerbs and other cars only bounce him. There is no clock, and every Job ends with a cheer.
- **Districts.** Six, each a new piece of land with its own look and special buildings: Old Town, Downtown, Riverside, the Harbour, the Hill and the Beach.
- **Show off.** The city lives by itself: people walk, traffic runs, and day turns to night with the windows lighting up. "Fly over" takes a slow helicopter pass across the whole city.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 70 buildings, tower floors, 14 vehicles, 30 paints, street furniture (trees, lamps, fountains, statues), 6 Districts, 40 Jobs and trophies. Economy defaults for the parent to confirm: one Job per Round, the first Job free; the first new building within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Job, District, Plot, Floor) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **The city has no edge.** After the six Districts, he can always buy the next block of land. Each block is a new set of plots and streets joined to the grid. The price rises gently and then stays flat. Cap what is drawn at once (draw far blocks as a simple skyline), not what he owns.
- **Buildings made from parts.** Beyond the named buildings, a house, shop or tower is put together from a base, a number of floors, a window style, a roof, a colour and a sign. The shop always has a fresh street of generated buildings to choose from, seeded so a reload shows the same ones. He can also design one himself, part by part.
- **Towers take another floor.** Any tower can always be bought one floor higher, up to a height that still draws well, and the tallest tower in the city gets a flag.
- **Jobs made from his own city.** Every Job after the first few is generated from the streets and buildings he has: a bus route between his own stops, a parcel round to his own shops. A bigger city makes longer and more varied Jobs, so building more gives him more to do.
- **The population counter.** Every house and floor adds people, shown as a running total with a new city rank at each milestone (Village, Town, City, Big City, and on without end).
- **Competition:** none against a rival. His own bests are enough: most passengers in one bus Job, tallest tower, biggest population.

## Look

A bright toy city: warm brick, glass blue, park green and road grey, with yellow lane lines. Buildings are drawn in code from their parts (floors, windows, roofs), so a tower with more floors is taller in every view. Icon: three towers of different heights with lit windows in rows.

Keep it apart from Hook and Ladder's Town, which is a map of places he has helped. Here he places every building himself.

## Risks

- A free-form city builder can grow without limit. The fixed street grid and fixed plot sizes (small, wide and large) are what keep it buildable. Do not add free road drawing in the first build.
- Driving on a grid of right-angle streets may feel stiff with a held finger. Build one District and one bus Job first and get it into his hands before building the content.
- A full city has many windows, people and cars. Draw buildings to an offscreen image once and cap the moving pieces, so it holds 60 fps on the iPad 9.
- Times Level 2 and 3 are third-grade facts. If he stalls there, hold him on the pictures longer rather than drilling facts.
