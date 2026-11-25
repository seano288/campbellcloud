# Spec: Coaster Crew (pushes, pulls and motion; build a roller coaster and ride it)

Status: built on 2026-11-25 (pass 1 of 3: build; pass 2: bug and sound review, same day), playable at `/coaster-crew/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari.

A new learning game on the family site, built the same way as Globe Hopper and Moon Base Mail, for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn **Tokens**, spent in his **Coaster Yard** on track pieces, train parts and a park. Each Round also earns a **Ride**: he rides his own coaster or the next **Guest Coaster**, from the side, on rails.

## What he learns, and where it comes from

The brief asked for the standards to be confirmed at the source rather than from memory. What I could confirm (2026-11-25, through state and publisher copies of the texts; I could not open nextgenscience.org's own pages or TEA's adopted rule PDFs in this pass, so **the parent may want to check the exact numbers there**):

- **NGSS K-PS2-1**: "Plan and conduct an investigation to compare the effects of different strengths or different directions of pushes and pulls on the motion of an object." Assessment boundary: strength *or* direction, not both at once, and **no non-contact pushes or pulls such as magnets** (California's CA NGSS copy, and the National Academies' printing of NGSS).
- **NGSS K-PS2-2**: "Analyze data to determine if a design solution works as intended to change the speed or direction of an object with a push or a pull." Assessment boundary: **friction is not included** as a way to change speed.
- **NGSS 3-PS2-1**: "Plan and conduct an investigation to provide evidence of the effects of balanced and unbalanced forces on the motion of an object."
- **NGSS 3-PS2-2**: "Make observations and/or measurements of an object's motion to provide evidence that a pattern can be used to predict future motion." Examples include "a ball rolling back and forth in a bowl" (Colorado's copy); technical terms such as period are excluded.
- **NGSS 3-PS2-3**: "Ask questions to determine cause and effect relationships of electric or magnetic interactions between two objects not in contact with each other." Clarification examples: two permanent magnets, a magnet and steel paper clips, and how distance changes the force.
- **TEKS Science, Grade 1, §112.3(b)(7)(A)** (adopted 2021, taught from 2024-25): "explain how pushes and pulls can start, stop, or change the speed or direction of an object's motion" (TEKS Guide's listing, Science.1.7.A).
- **TEKS Science, Grade 2, §112.4(b)(7)(A)–(B)**: (A) explain how objects push on each other and may change shape when they touch or collide; (B) plan and conduct a descriptive investigation to demonstrate how the strength of a push and pull changes an object's motion.
- **A finding the brief didn't expect**: TEA's "TEKS in Focus: Forces and Motion" (Sept 2024) says the 2021 TEKS **moved magnets out of Grades 1 and 2 into Kindergarten** (K.7(A): how a magnet interacts with various materials and how magnets can push or pull), and moved "patterns of motion" out too. So Magnets is Kindergarten TEKS plus NGSS 3-PS2-3, not a Grade 1–2 TEKS strand.

**Which standard each kind serves** (default to confirm):

| Kind | Serves | Notes |
|---|---|---|
| Push or Pull | K-PS2-1; TEKS 1.7(A), 2.7(B) | Level 3 (a big and a small push) is 2.7(B)'s "strength of a push" |
| Hills | 3-PS2-2 (a pattern predicts motion: a cart can't climb higher than it started, as the ball in a bowl); a first look at 4-PS3-1 (speed and energy) | Not in K–2 standards: the brief's own subject, the bridge to the reward. Default to confirm |
| Heavy and Light | 3-PS2-1 (unbalanced forces change motion), TEKS 2.7(B) | All on flat ground (see the rules) |
| Rough and Smooth | 3-PS2-1 (the ground's rub is a force against the motion); TEKS 1.7(A) ("stop or change the speed") | K-PS2-2 explicitly leaves friction out, so this is a step past Kindergarten |
| Bump | TEKS 2.7(A) (objects push on each other when they collide); K-PS2-1's examples (two objects colliding); 3-PS2-1 (a push from the side) | |
| Magnets | TEKS K.7(A); NGSS 3-PS2-3 | Not a Grade 1–2 TEKS strand since 2021 (above) |

**Words.** The game says plain words throughout ("push", "pull", "speeds up", "slows down", "rough", "smooth", "pulls together", "pushes apart"). The school words are met only in a Level 3 fuller lesson: "A push or a pull is called a force." (Push or Pull and Heavy and Light) and "The rubbing is called friction." (Rough and Smooth). "Attract" and "repel" are not used: they come from TEKS teaching notes, not the expectation text, and Magnets is Kindergarten TEKS. **Default to confirm.**

## Kinds

Six kinds, three Levels each. Every question is a scene drawn on a canvas, and two to four choices (words, coloured carts, arrows, grounds or things).

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Push or Pull** `push` | start | An everyday action played out (kicking a ball, opening a drawer, towing a wagon, getting a carrot out of the ground...): "Is it a push or a pull?" (Push / Pull). What is said never has "push" or "pull" in it ("Moving a shopping cart.", not "Pushing a shopping cart."), so he has to watch which way the hand moves it | A box on the floor from above, a hand pushing it or a rope pulling it, the arrow showing which way: "Which way will it go?" (four arrows) | The same cart in two lanes, a big push and a small one: "Which cart will go farther?" |
| **Hills** `hill` | start | Two carts let go from two hills: "Which one is faster at the bottom?" A speed sign at the bottom of each lane fills to the speed its cart passes at, and stays (pass 2: the cart from the lower hill gets to the bottom first, though slower, so without the signs the scene looked as if the wrong one won) | One cart, then a next hill a quarter lower or a quarter higher: "Will it get over the next hill?" (Yes / No) | Three start heights and one hill ("Which one will get over the hill?"), or one start and three hills ("Which one will get over its hill?") |
| **Heavy and Light** `heavy` | Push or Pull L2 | An empty cart and a full one (sandbags), the same push: "Which cart will go farther?" | The same steady push on two or three loads: "Which cart needs the bigger push to get going?" | Two or three loads rolling at the same speed, a hand pushing back: "Which cart is harder to stop?" |
| **Rough and Smooth** `rough` | Hills L2 | Two or three grounds (ice, smooth floor, carpet, grass, sand), the same push: "On which ground will it go farthest?" | "Which ground will stop it first?" | "The cart must stop at the station" (the station stands just past where the roughest ground stops it, in every lane, so the others are seen rolling on past it) or "must coast a long way" (a flag at the far end): "Which ground should we use?" |
| **Bump** `bump` | Rough and Smooth L2 | From above on a table: a rolling ball hits a still one: "What will the still ball do?" (rolls on / stays / rolls back, in a shuffled order: "rolls on" is always right) | A bouncy ball meets a wall, straight on or slanting: "Which way will it go after it hits?" (three arrows) | A rolling ball gets a push from the side: "Which way will it go now?" (straight on / along the push / in between) |
| **Magnets** `magnet` | Heavy and Light L2 | "Which one will the magnet pull?" (three things) or "a wooden block. Will the magnet pull it?" (Yes / No) | Two bar magnets, their facing ends marked N (red) and S (blue): "Will they pull together or push apart?" | Two paper clips, one near and one far: "Which one will the magnet pull?"; or "There is paper (a card, a cloth) in between. Will the magnet still pull it?" |

- **Unlock order** (the brief's): Push or Pull and Hills from the start; Heavy and Light at Push or Pull L2; Rough and Smooth at Hills L2; Bump at Rough and Smooth L2; Magnets at Heavy and Light L2.
- **Mastery and placement** (as Globe Hopper and Math Bots): 16 of the last 20 right first try, or the last 10 in a row; the first 30 questions of a kind use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three probes each of Push or Pull and Hills at Level 2, one of each a Round; three clean probes start that kind at Level 2, two misses stop the row.
- **Rounds**: five answers mixed across every open kind, never the same kind twice running while there's another; about one in three (and always the one after a miss) is easier and doesn't count; a starred kind comes back about once a Round; a missed question comes back later as a new one with no Mastery credit; one Token for each first-try answer and one for finishing (the shared `boltsFor`); a Round resumes after a reload.
- **Every answer plays the scene.** A right answer plays the scene through (sped up to about two seconds) so he sees what happens, then counts. A miss plays it in its lesson.

### The one motion model, and the rules the tests enforce

`src/coaster-crew/physics/motion.ts` moves every question's scene and the coaster. Down a track, speed comes only from how far the cart has dropped, less a little to rolling resistance; nothing about mass is in it at all (air drag, which would differ, is left out). On flat ground: speed after a push = push ÷ mass; the ground then slows every cart alike (resistance × g); a cart starts only when a push beats the ground's hold (resistance × weight); stopping distance = mass × speed² ÷ (2 × stopping force). From above: equal balls head on swap speeds; a bouncy ball comes off a wall the mirror way; a side push adds to the motion. Magnets pull iron and steel within reach, through paper, card or cloth, harder when nearer; different ends pull together, the same ends push apart.

- **No answer is written by hand.** `outcome()` works out each question's answer from its scene with the motion model; `questions/problems.test.ts` makes 27,000 (1,500 of each kind and Level) and checks every one: exactly one right choice, and it is the outcome.
- **The scene that plays agrees with the answer**: each scene is played to its end with the same functions the canvas draws (`questions/scenes.ts`) and what happens is checked against the answer: the cart that goes farthest, the one that doesn't start, the one over the hill, the ball's way, the thing that jumps.
- **No question depends on weight making something fall or roll downhill faster** (its own tests, `physics/motion.test.ts` and `problems.test.ts`): the motion along a track has no mass in it; a full and an empty cart down the same hill roll identically; a Hills scene has no load in it and its words never say heavy, light, full or empty; Heavy and Light is only on flat ground. A Hills fuller lesson says it aloud: "It does not matter how heavy it is. Only how high it starts."
- **Hills compares heights that differ clearly**: every pair of heights in one scene (starts and hills) differs by at least a quarter (so none within a fifth); a hill a quarter lower is always got over and a quarter higher never.
- **Magnets uses only a hand-checked table**: iron or steel, said so (a steel paper clip, an iron nail, a steel ball), and plainly not metal (a wooden block, a plastic cup, a piece of paper, a glass marble, a rubber ball, a wool sock, a feather, a wax crayon). **Left out on purpose**: the brief's "steel spoon" (many stainless steel spoons are a kind of steel a magnet does not pull: arguable), coins, cans, foil, keys, jewellery and pencils (a metal band). Pass 2 also took out the iron pan: every scene shows the thing jumping across the table to a small magnet, and a pan doing that is false. "A steel ball" stays (a ball bearing; classroom kits use them), but it has the same doubt as the spoon if it were stainless: **default to confirm**.
- **Rough and Smooth never pairs two close grounds**: two grounds are only compared when one stops the cart at least three times sooner; so never grass and carpet, grass and sand, or ice and a smooth floor.
- **Bump is drawn from above on a flat table**, so gravity plays no part.
- **Push or Pull** uses only actions with one plain answer: no "open a door" (either), no throwing, no dog on a lead; and what is said never contains the answer (a test checks).
- **Nothing the game says puts weight and going downhill in one line** (a test reads every phrase); the one line that mentions both is the Hills lesson that says weight doesn't matter.

## Teaching a miss

Never a red X. The first miss plays the scene slowly, says why, then "Try again!" with the right choice lit:

- **Push or Pull:** the action plays again with arrows: "A push moves a thing away from you. So it is a push." / "It moves the way the rope pulls it."
- **Hills:** both carts run side by side with a height bar beside each and a dashed line at each start height: "This one started higher, so it is going faster." / "It can not go higher than where it started."
- **Heavy and Light:** both carts get the same push, the same arrow, and the full one barely moves: "The full cart is heavy, so it hardly moves. The empty cart is light, so it goes farther."
- **Rough and Smooth:** the cart rolls on each ground in turn, then a round close-up of the roughest ground catching the wheel: "Rough ground rubs the wheels and slows the cart down."
- **Bump:** the meeting in slow motion with arrows before (yellow) and after (green): "The rolling ball gives the still ball a push, so it rolls on the same way." (Pass 2 changed this from "The rolling ball stops, ...": two balls rolling on a table don't quite do that, since the rolling one keeps a little spin and follows on slowly.)
- **Magnets:** the magnet slides in to each thing in turn and the iron or steel one jumps to it: "Magnets pull things made of iron or steel."

**The second miss** (or the first when he's been missing a lot, or 🔎) is hands-on, as the brief asks: "Your turn! Tap a cart to push it." Each lane glows and plays when he taps it (a finger tap pushes the cart, lets it go, brings the magnet in); after nine quiet seconds the rest play by themselves. Then the fuller lesson's words, with the school word at Level 3. **Default to confirm**: the brief says "pushing the cart or moving the magnet" with a finger; this pass makes it a tap on each, not a drag.

## The reward: the Coaster Yard, the Ride and the Park

**The loop.** A finished Round earns Tokens and one Ride. Tokens buy track pieces, train parts, park rides and stands, looks, more track, more cars, more land and more coasters. The first Ride is free, on a starter coaster that already gets round (Little Lift, Little Drop, Straight), so he sees the reward before his first purchase.

**The builder** (Yard → Build): his coaster from the side, the tray of pieces he owns **that fit at the end of the track** (a drop needs height under it, a splash pool sits on the ground, nothing goes above 14 steps), and a big ↩️ that takes the last piece off in one tap. Pieces snap on the end; there is no free drawing. Owning a piece lets him use it as often as he likes; **track slots** cap the length (6 to start, "More Track" adds one, up to 30); when every slot is used the tray holds one ➕ More Track button that takes him to it in the shop. Every track ends with a gentle run back down, the brakes and the station, added by itself, so there is no "finish" to build.

**Rolling back is a lesson, never a failed build.** A piece that makes a hill too tall for the car is let on. The car is shown slowing on that hill and rolling back, again and again, the piece goes red, and the voice says "Oh no! The car can not get over that. It needs to start higher, or get a push." The two honest fixes take the tray's place, beside ↩️ (so the coaster above stays in sight on a sideways phone), one tap each:
- **Taller hill**: the first lift goes up one size and a Little Drop (free, always his) is put just after it, so every hill he built stays where it was and only the start is higher. (In this game's pieces, heights are relative: a taller lift alone would raise every later hill too and fix nothing.)
- **Booster**: a booster just in front of the hill; on a track with no slot left, a booster in place of the nearest flat piece before it (so a full track still has a fix). If no fix works (no slot, no flat piece to swap), ↩️ pulses: taking the piece off is the way out.
Each is a piece he has if one works, else the cheapest he could buy (shown with its price: one tap buys and fits it if he can afford it; otherwise it becomes his Goal). A coaster that rolls back can't be picked for a Ride ("Your coaster rolls back. Fix it in the Yard first!"). Nothing is lost.

**The Ride** (`ride/ride.ts`, 2D canvas, about 20 to 60 seconds, 40 for a typical Guest Coaster): pick "My Coaster" or the next Guest Coaster. The station's tyres push the car out, the chain clacks it up the lift (a tall lift's chain runs faster, so no climb takes more than about five seconds: pass 2 found a Mega Lift climb was over 20 seconds, half the Ride, with nothing to do), and it waits right at the edge of the top: "Pull the lever!" (a big 🕹️ Go button; it goes by itself after five seconds), and over it goes a moment later. What the chain does changes nothing after the top: the car always leaves the crest at the same creep, so speeds, drops, Thrill and rolling back are unchanged. Holding a finger anywhere on the screen leans the riders in with their hands up: stars over each drop and hill are caught only with hands up, and a drop with hands down just makes them squeal ("Eek!"). At his tallest drop a 📷 comes up: a tap takes the photo (it snaps by itself anyway, without the extra Token). The instructions ("Pull the lever!", "Hold your finger down...", "Tap the camera!") are never cut off by the riders' "Eek!" or "Woo-hoo!" (pass 2: "Wheee!" came out as "we"). The view follows the car and only the pieces on screen are drawn. **It cannot be failed**: the car is on rails on a track already checked to get round; `ride/ride.test.ts` and `coaster/coaster.test.ts` ride it with three scripted children (nothing, clumsy, skilled), all to the station.

**Results**: Tokens, stars caught, top speed, the Thrill number (said aloud only when the voice has that number: to 100, or a whole ten to 400; otherwise only shown), riders added, a new best, a Guest Coaster's prize, Trophies, a new rank, and with a **Photo Booth** the photo from the big drop, as a snapshot.

**Thrill**: top speed in km/h + half the tallest drop in metres + 8 for each inversion. Shown for each coaster, best ever kept; a new best on his own coaster is cheered and pays a Token. This is the only competition (his own record): **no rival**, as the brief says.

**The Park** (Yard → Park): his fairground from above: plots of grass with six spots each (three plots a row, two on a phone so a spot stays bigger than a fingertip), his coaster looping round the top, little visitors walking the paths in the hats and with the balloons he has bought. Tap a spot, then a ride or stand to put there (or take one off: it stays his). A new ride or stand goes on the first empty spot; with none free it waits for more land. The map is drawn at one scale and grows taller as he buys land (the Yard scrolls; the things to put on a spot stay in sight at the bottom): pass 1 squashed it into a fixed height, so twelve plots on a sideways phone were thin strips.

**Show off**: "Watch it run": his whole coaster on screen with the train going round by itself, beside (on a wide screen) or above his park from above, its visitors walking about, shrunk evenly to fit.

### What's for sale (prices in Tokens; dear things change what the reward does)

- **Track pieces** (41 for sale, 3 free, 10 prizes): lifts (Little Lift free, Lift Hill 14, Big Lift 38, Giant Lift 85, Sky Lift 170, Mega Lift 290), drops (Little Drop free, Drop 6, Big Drop 24, Steep Drop 55, Giant Drop 120, Sky Drop 230), hills (Bunny Hop, Hump, Camelback, Big Camelback, Top Hat 140, Little Climb, Climb, Dip, Valley), loops and rolls (Loop 36, Big Loop 75, Double Loop 150, Corkscrew, Double Corkscrew, Zero-G Roll, Heartline Roll, Cobra Roll 110), flat track (Straight free, Long Straight, Tunnel, Long Tunnel, Banked Turn, Wave Turn, Helix, Double Helix, Brakes 3), water (Splash Pool 23, Big Splash 62: the water slows it a lot), speed (Booster 40, Big Booster 95, Rocket Launch 180). Taller lifts and steeper drops mean more speed and a bigger Thrill.
- **Track styles** (8): Wooden, Mine Train, Space, Candy, Jungle, Ice, Rainbow, Golden.
- **Train** (19 bodies, 11 fronts, 29 paints, 9 stripes, 9 rider sets): a car's body sets its **seats** (2, 4 or 6), so dearer bodies (Dragon, Bus, Steam Train, Jet, Flying Saucer, Golden) carry more riders round each Ride; "Another Car" (up to six cars).
- **Park** (30 rides, 40 stands and scenery): rides from the Bouncy Castle (22) to the Monorail (120). Some stands change the Ride or the park: **Night Lights** (night rides and a lit park; a ☀️/🌙 switch), **Speed Sign** (live speed on the Ride), **Star Trail** (twice the stars), **Fireworks Tower** (fireworks at the station), **Band Stand** (a fanfare as the lever goes), **Waiting Line** (visitors queue), **Rider Board** (the rider count by the gate), **Photo Booth** (the Ride's photo from the big drop is shown at the end; it isn't kept after that).
- **Looks**: 19 station themes, 10 hats and 10 balloons the visitors wear and carry.
- **Prizes, never sold** (one every fifth Guest Coaster): 10 prize pieces (Golden Loop, Thunder Booster, Rainbow Drop, Star Corkscrew, Moon Hill, Triple Loop, Comet Lift, Dragon Dive, Jelly Hops, Geyser Splash: gold rails) and 10 prize cars (Comet, Phoenix, Unicorn, Pirate Ship, Robot, Whale, Tiger, Moon Buggy, Candy, Star: all six-seaters), taking turns.
- **Trophies** (10, earned on his own coasters): First Ride, Loop the Loop, Splash Down, Upside Down, Sky High, Speed Demon (100 km/h), Thrill 100, Thrill 150, Thrill 200, Guest Star (ten Guest Coasters).

### Rewards that never run out

1. **The endless layer, made by the game.**
   - **Guest Coasters** (`coaster/guest.ts`): Guest Coaster *n* is generated from *n* by a seeded generator: its pieces, length, style, weather (sunny, sunset, night, rain, snow, starry), car body, paint and number of cars. The same number is always the same coaster. Each is a little longer (5 pieces, one more every three, up to 16) and wilder (a taller lift every six, more loops and rolls) than the one before. The generator checks every piece with the motion model as it goes and puts a booster in front of a climb that would be too much, and `coaster/coaster.test.ts` makes **3,000** and checks every one runs end to end without rolling back (and rides every 25th with all three scripted children). Every fifth gives a never-sold prize: the 20 prize pieces and cars, then a numbered **Guest Paint** (a two-colour paint made from its number), without end. A Guest Coaster is always on offer and each is new, so every Ride can be something new.
   - **Trains from parts**: 20 bodies × 12 fronts × 30 paints × 10 stripes × 10 rider sets × up to 6 cars, plus every Guest Paint won.
   - **Riders and ranks**: every Ride adds its riders (cars × seats) to the counter; ranks at Helper, Ticket Taker (20), Ride Operator (60), Track Fixer (120), Coaster Crew (200), Crew Chief (320), Park Manager (480), Thrill Master (700), Coaster Captain (1,000), Coaster Legend (1,400), then Coaster Legend 2, 3, ... every 600 riders without end.
2. **Things bought again and again** (price rises gently, then flat): More Track (10, +2 each, to 40; up to 30 slots), Another Car (25, +10, to 60; up to 6 cars), **More Land** (20, +4, to 60; without end: six more spots each), **Another Coaster** (60, +10, to 120; without end: each a new empty coaster to build and ride, picked with the 1 2 3 buttons in the builder).
3. **The fixed catalogue**: 234 things for sale, 20 prizes, 10 ranks and 10 trophies: **274 named things**.

**Measured** (`park/economy.test.ts`: the scripted child gets every answer right first try, takes every Ride on the next Guest Coaster with the photo tapped, and always buys the cheapest new thing as soon as he can; the catalogue first, then the again-and-again things):

| | |
|---|---|
| Tokens a Round (Round 6 + Ride 4, first 300 Rounds) | **10.0** |
| Rounds to buy the whole fixed catalogue (7,376 Tokens) | **738** |
| Longest gap between purchases | first 100 Rounds **2**; first 300: 5; first 1,000: 29 (saving for the Mega Lift, while every Ride is still a new Guest Coaster) |
| First purchase | Round 1 |
| Dearest things, in Rounds of saving | Mega Lift 29, Sky Drop 23, Rocket Launch 18, Sky Lift 17, Golden Car 16; everything else 15 or less |
| After 2,000 Rounds | something new every Round (a new Guest Coaster; land and coasters to buy) |

**How long a Round takes**: the browser tour timed a Round with two kinds each missed twice (both lessons) at about 87 seconds, and a Ride on the starter coaster at about 40 seconds. A clean Round and Ride is likely about a minute and a half, so somewhere between 20 and 40 Rounds an hour: **738 Rounds is roughly 18 to 37 hours** of play before the fixed catalogue is bought. Not measured with a real child.

**Economy defaults, for the parent to confirm.**
- One Ride a Round; the first Ride free; Rides don't expire.
- A Ride pays 2 Tokens, +1 for tapping the photo, +1 for something new (a Guest Coaster ridden for the first time, or a new Thrill best on his own coaster): at most 4, so a Round and its Ride pay at most 10, under Turbo Tally's 15. No other way to earn Tokens.
- Prices up to 100 in ones, then whole tens to 400 (the dearest is 290), said with the whole-ten clips (`PRICE_TENS`) and "You need about 150 more Tokens." for a gap that isn't a whole ten.
- The dearest things are lifts, drops, launches, loops and six-seat cars; a paint is never dear (26 at most). Every tab has things under 15 beside the dear ones, and the Goal bar fills toward what he's saving for.

## Currency: Tokens

`TOKEN` (one Token, many Tokens) in `src/currency/kind.ts`; the icon in `src/ui/currency.tsx` is a round red and white fairground token with a ridged edge and a white star stamped in the middle (no number, no head: not a coin). At the end of a Round the Tokens drop out of a red and white token machine one by one and clatter onto the pile. Nothing in the game says or shows "Bolt" (`game.test.ts` checks every phrase and every screen file). Recorded: "You earned 1 Token!" to "You earned 10 Tokens!", "It costs", "Token.", "Tokens.", "You need", "You need about", "more Token.", "more Tokens.".

## Look

A fairground on a summer evening: a teal sky going pink and peach, candy red and white stripes, bulb yellow. Track is two rails (black under the style's colour) on chunky supports, with the family's black outlines; a station at each end in his theme. Questions sit on a cream card; scenes on a light sky, a wooden table (from above) or a felt table (Bump). Icon: a red coaster car with two riders, hands up, at the top of a lift hill, with a big red and white Token for a sun, on the evening sky. Kept apart from Sentence Express: here the track is tall, seen from the side, and the car is fast.

## Voice

645 clips, Aria at -8% (`tools/make_voice.py --collection coaster-crew`), one mp3 a phrase in `public/coaster-crew-voice/` (packed by the build into at most 16 files). Every question is said; word, ground and thing choices are said as they light; cart and arrow pictures are not read out. Numbers and names are clips of their own, chained into lines.

## Save

`coaster-crew-save` (version 1) and `coaster-crew-place`. An unknown version reads as a blank save; anything a save holds that it doesn't own, or a track piece that doesn't fit, is dropped when read (a track is cut at the first piece that isn't his or doesn't fit). A Ride is used and paid only at its end; a reload during one lands at the Yard.

## Open questions for the parent

1. **Hills and the standards**: Hills (height and speed) isn't in the K–2 standards found; it's the brief's own subject and the reward's lesson (3-PS2-2's pattern, 4-PS3-1). Keep it as a start kind?
2. **Magnets** is Kindergarten TEKS since 2021 and NGSS Grade 3. Keep it last (after Heavy and Light L2), as the brief has it?
3. **School words**: only "force" and "friction", only in Level 3 fuller lessons. More, fewer, or "attract" and "repel" too?
4. **The steel spoon** was left out (many stainless spoons aren't magnetic). Fine?
5. **The hands-on lesson** is a tap on each cart or thing, not a drag. Is that enough "with a finger"?
6. **"Taller hill" fix** puts a Little Drop after the taller lift so the rest of the track stays put. Is that clear enough to him, or should it be called something else?
7. **Ride length**: about 20 seconds on the starter coaster, 40 on a typical Guest Coaster, at most about 60 (Guest Coasters grow to 16 pieces; measured over 3,000 with a child who does nothing). Too long once they're long?
8. **The Ride's play**: hold for hands up (catch stars) and tap the camera. If it bores him, add things to collect along the track (the brief's own suggestion) before anything he could fail.
9. Is **Coaster Crew** the name?

## Not done

- Not run on a real iPad or in Safari: the canvas Ride's frame rate on an iPad 9 (it draws only the pieces on screen, but a long Guest Coaster with many supports and emoji riders is the heaviest frame), emoji in canvas, the hold-anywhere lean and the lever button need checking on the device.
- No measured play time with a real child; the Rounds-an-hour figure above is a guess from the tour's timings.
- The park map is drawn simply (emoji on plots); visitors don't queue at real rides, and things can't be dragged between spots (tap a spot, then a thing).
- No sound for the train beyond simple tones (chain clack, whoosh, squeal, chime, the Band Stand's fanfare).
- The Ride's photo isn't kept in an album: with a Photo Booth it is shown on the results and then gone.
- The fuller lesson's hands-on taps are a tap per lane, not a drag of the magnet or a push with a swipe.
- Design polish (pass 3) is still to come.
