# Spec: Sky Writer (handwriting: forming letters and numbers; a stunt plane that writes in smoke)

Status: built on 2026-11-18 from `brief.md` (pass 1 of 3: build), playable at `/sky-writer/` with a tile on the landing page (Learning
Games, after Dino Dig). Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad, and no child has used
the stroke checker yet. The bug-and-sound pass and the visual design pass follow; the look is the family look, functional, not designed.
"Sky Writer" is a working name.

A new learning game on the family site, built the same way as Dino Dig and Rover Code (`src/dino-dig/`, `src/rover-code/`), for the same
player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9, sometimes an iPhone). It is the first game
on the site where he forms letters rather than taps answers: first graders are expected to print every upper- and lowercase letter
(Common Core L.1.1a) and to write numbers, and this is the age of backwards b, d, p, q, 2, 3, 5, 7 and S. Short mixed Rounds earn Bolts and
a Show; he builds a stunt plane at the Airfield and flies it.

## What finger writing does and does not teach

**Does:** where each letter starts, which way each stroke goes, the order of the strokes, and how tall the letter is against the three
writing lines (tall, small, or hanging a tail). Those are where reversals come from (b written from the round part reads d; a circle
going the wrong way), and a touch screen can see them.

**Does not:** how to hold a pencil, how hard to press, the size control of real pencil writing (his finger is far wider than a pencil
line, and the letters here are big), spacing between words, or writing on paper at all. An Apple Pencil works (pointer events take a
finger or a pencil alike, and once a pencil is seen a resting palm is ignored), which is closer to a pencil, but it is still glass. **This
game is practice for letter formation, not a replacement for writing on paper.** The parent should know that.

## The research, and the letter shapes

- **Teaching order.** Handwriting programs teach letters in groups that share a first stroke. Learning Without Tears (Handwriting Without
  Tears) starts with the straight-line capitals (L F E H T I), teaches lowercase "magic c" letters together (c a d g, with o; q later, so
  it isn't confused with g) and "diver" letters together (p r n m h b: down, back up, over), and does the slants (v w x y z) as a group.
  Zaner-Bloser introduces strokes in the order vertical, horizontal, circle back, circle forward, slant, and groups letters the same way.
  The brief's eight Families match this closely, so they are kept as they are (q stays in the c family: default; the parent may want it
  later, as Learning Without Tears does).
- **Ball-and-stick shapes (default), matching Andika.** Lines and circles, as Zaner-Bloser teaches, and as Andika (the site's reading
  font) draws: a single-storey a and g, a straight-tailed y, a t with its cross on the middle line. Not D'Nealian (slanted, with
  "monkey tails"). **The big open question for the parent: which style his school teaches.** If it is D'Nealian, every letter's
  strokes change, and so do some starts (D'Nealian a, d start the same; its letters are slanted and have exit tails).
- **Where each letter starts and how it goes (Zaner-Bloser style):** tall letters and capitals start at the top line; small letters at
  the middle line; the c family starts "near the middle", just under the middle line on the right, and **circles back** (counter-
  clockwise); b and p pull down, then go **back up and around** (circle forward); n, m, h and r pull down, then **back up and over**;
  numbers start at the top (2, 3 and 8 just under it). Strokes are written down as data in `letters/strokes.ts`, one path each with its
  words.
- **The stroke words** are one small shared set of 24 phrases (STROKE_WORDS: "Start at the top.", "Start near the middle.", "Pull down.",
  "Pull down below the line.", "Push up.", "Slide right.", "Slant down.", "Curve back.", "Circle back all the way around.", "Back up and
  over.", "Back up and around.", "Hook back.", "Lift.", "Cross.", "Add the dot."...), recorded once each and said one stroke at a time while the
  plane flies it. Every letter uses only these, so they stay consistent.

Letters with a choice of shape, chosen as defaults: **t** is a tall letter starting at the top line with its cross on the middle line
(Andika's t is shorter; Zaner-Bloser's starts at the top); **k** and **K** have their two arms meeting at the stem (the arm slants in, the leg slants out from where it met the stem: Zaner-Bloser's
"slant left, slant right"; pass 2 moved the leg there from partway up the arm); **4** is open (pull down, slide
right, lift, pull down; Andika's 4 is closed); **1** is a plain line (no flag, no base); **I** has its bars (Andika's does); **G** is
"curve back, slide left"; **J** has no top bar; **e** starts on the left in the middle of the small space and slides right; **f** curves
back from near the top.

## Kinds

Six kinds, three Levels each, as the brief proposed. Opening: Trace It and Where to Start at the start; Which Way at Trace It Level 2;
Tall, Small, Tail at Where to Start Level 2; Write It once both Trace It and Where to Start reach Level 2; Write a Word at Write It Level 2.

| Kind | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Trace It** `trace` | the letter dotted, a green start dot and a yellow arrow, a wide lane (0.42) | dotted, the start dot, a narrower lane (0.34) | the lines and a faint letter that fades as he starts, the narrowest lane (0.28) |
| **Where to Start** `start` | the letter with three dots: tap where it starts | the start dot and three arrows: "Which way does it go first?" | every line of the letter: "Which line comes second?" tap it |
| **Which Way** `flip` | "Tap b": b and its mirror (d) | from four: b d p q, or the letter turned four ways (as it is, backwards, upside down, turned round) | a short word with one letter backwards: tap it (the word is said: a backwards d is drawn as a b, so "beb" can only be answered by knowing it's "bed") |
| **Tall, Small, Tail** `size` | one letter: tall, small or tail? | which of three writings of a word sits on the line the right way? | tap the letter that floats or sinks |
| **Write It** `write` | hear a lowercase letter; it shows for a second, then he writes it on empty lines | no flash | capitals and numbers too, and numbers 10 to 20 in two boxes ("Write 15") |
| **Write a Word** `word` | a three-letter word, one box a letter, the word shown above | shown for about 2.5 seconds, then hidden | only said |

- Lanes are in line units (the small letters are 1 tall); Write It and Write a Word use a hidden lane of 0.45, and the letter can sit
  anywhere along the lines (only its height is fixed).
- Letters are drawn from their stroke data everywhere (the same shapes he writes), on paper-white cards with the three lines; the writing
  pad is a strip of sky with the lines as contrails. Where to Start shows just the part of the lines around the letter, so a small
  letter's three dots are far enough apart to tap on a sideways phone. When a word's boxes would make the letters small (an upright
  phone), the pad fills with the box he's on and slides along to the next.
- Write a Word uses Dino Dig's 43 short-vowel words (`src/dino-dig/words/list.ts`, read only; copied as literals so each can be a voice
  clip, and a test checks they are exactly that list). Which Way Level 3 and Tall, Small, Tail Levels 2 and 3 use them too; before he
  has met enough letters for any word, Tall, Small, Tail writes a row of three met letters instead.
- **Which turns look alike** is worked out from each letter's strokes (`letters/glyphs.ts`), not guessed: a turned letter less than 0.12
  line units from itself looks the same (in ball-and-stick, a upside down is a; t is t every way; s turned round is s; c upside down is
  c), plus n, m and u mirrored and K flipped, which are nearly the same. Those turns are never offered against the letter. t is never
  asked in Which Way Levels 1 and 2 for that reason, and never in Tall, Small, Tail (it is tall in ball-and-stick, shorter in Andika).
- **b, d, p and q** are each other turned, so Which Way shows them as the real letters, and only once he has met the other letter
  (d is in the c family, b in the bumps). A word with one of them backwards must not read as another real word: bag with a backwards b
  reads dag, so it is never asked (the list, checked against the macOS dictionary by the test: bag, big, dig, dog, bug, bed and pin at
  their first letter, web and cub at their last).

**The rules the tests enforce** (`writing/problems.test.ts`: every kind × Level × each of the eight stages through the Families × every
letter it can ask × 3 seeds, about 4,000 questions; `letters/check.test.ts`; `learning.test.ts`):

- Every letter, capital and number (62) has stroke data, and a scripted finger can write each one at every Level's lane: clean, fast and
  slow, lifting or not between strokes where handwriting runs on, anywhere along the lines in Write It, and wobbling inside the lane.
- Only two things are a miss: starting in the wrong place and going the wrong way. A finger wobbling well outside the lane (up to 1.2
  lanes either side), starting a little off, carrying on after a rub-out as a child who didn't notice would, is never told it missed: in
  8,500 scripted wobbly tries at every Level, none was (`check.test.ts`). It rubs out instead.
- A circle going forward, a stroke from its end, b written like d (and the other three), a tall letter started at the middle, the cross of
  t or the bar of H first: all misses. A tap, the dot of i first, or a scribble away from the letter: rub-outs. A scribble across the lines
  never writes a letter.
- Where to Start, Which Way and Tall, Small, Tail have exactly one right choice (every choice is tried); Where to Start's other dots are
  0.6 or more from every stroke's start; its wrong arrows are a quarter turn or more from the right one; its second line has a part a tap
  can't mistake.
- Which Way Level 3 never uses a word where the backwards letter makes another real word, and never flips a letter that looks the same
  backwards.
- A question only uses letters from Families he has met (a backwards b counts as a d).

**Families are met before they are asked**: the first problem of his first Round meets the straight-line capitals ("A new letter family!
These capitals are all straight lines.", then each letter drawn in smoke while it's named). The next Family comes after 8 more first-try
answers and waits while any Family he has met is shaky (strength under 2). Meeting counts as one of the Round's five; the question after
it asks a letter from the new Family. Strength 0 to 5: up one on a first-try answer, down one with help, down two on a miss; weak and new
Families' letters come up more often.

**Mastery (as Math Bots, Rover Code, Dino Dig).** 16 of the last 20 right first try, or 10 in a row; the quick rule (8 of 10, or 6 in a
row) for a kind's first 30 questions at his Level. Never down. A star at Level 3. No Tune-Up.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and
always the one after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back later as a fresh
question of the same kind and Level, no Mastery credit. Bolts: one per first-try answer plus one for finishing (shared `boltsFor`). A
Round resumes after a reload (`sky-writer-place`).

## How a stroke is checked (`letters/check.ts`)

No handwriting recogniser. Each time his finger lifts, the path is walked along the stroke he is on:

- **A stroke passes** when the finger starts near its start (within the start radius, 0.34 to 0.5 by Level, or a little way along it), goes
  along it in order while staying in the lane (progress only moves forward, and never further than the finger has travelled, so a
  shortcut across a circle doesn't count), and gets near its end.
- **Running on.** He may keep his finger down into the next stroke the way handwriting does ("pull down, push up, back up and over"):
  going back along a stroke he has drawn to reach the next one's start is fine, and so is lifting.
- **A lift partway** keeps what he drew; he can carry on from there. A lift just after finishing a stroke (a circle closed with a little
  overshoot) is fine, not a lift partway, so it isn't met with "Keep going!".
- **A dot** is a tap, or a little wiggle (under 0.5 line units) that stays by the dot.
- **Never stricter than a fingertip** (`forPad`, pass 2): the lanes and starts are in line units, and a sideways phone draws a line unit
  only about 40 to 55 CSS px (an iPad 120 to 220), so on a small pad they are widened to at least a fingertip: a lane of 22 px either side,
  a start radius of 28 px, a wrong start 44 px or more from the right one, and 36 px of real writing before anything can be a miss.
- **A miss** needs a real try along the letter (0.7 line units of it): from the wrong place (more than 0.6 from the start), or backwards.
  A real try (pass 2) starts on the letter with a stretch along one stroke one way, and is mostly such stretches: a scribble that
  zigzags across the letter is a rub-out (the first build read three in four random scribbles over a letter as a wrong start at Level 1;
  now about one in a thousand). A stroke written backwards sets off backwards: one that sets off the right way and then slides back over
  itself (or off the pad) is a slip. A stroke begun beside its start (no further along it than 0.45) and going the right way is a sloppy
  start, a rub-out, not a wrong one: a wrong start is another stroke first, or this one from partway along. In Write It, which has no
  guide, a letter written bigger or smaller than the lines ask (0.7 to 1.4 times), slanted or tipped is never called a miss: a path that
  would go the right way at another size rubs out.
  Just after a rub-out, a stroke from further on in the letter is him carrying on, not a wrong start. In Write It, a stroke written
  backwards that begins at the same height as the right start (v, w, c) can't be told from the letter sitting further along the line, so
  it rubs out rather than being called a miss; and q written like p only rubs out there (their starts are at the same height, a little
  apart). Everywhere else both are misses.
- **Three rub-outs in a row**: the plane shows the stroke again ("Watch the plane!"). Not a miss, not help.

**What still needs tuning with him on the iPad** (the parent watching): the lane widths and start radius per Level (are Level 1's
forgiving enough for a first try, is Level 3's still fair?); whether a finger his size makes lane rub-outs at Level 3 on an iPhone (the pad
is smaller there); whether "rub-outs" frustrate him (they are silent apart from a puff and a short hint); whether he lifts between strokes or
runs on; and whether the Apple Pencil changes any of it. All the numbers are in `TUNING` and the constants at the top of `check.ts`.

## Teaching a miss

Never a red X: a wrong choice greys and wobbles sideways, and in the writing kinds the miss just stops the letter.

- **Writing (Trace It, Write It, Write a Word), first miss:** "Watch the plane!" A little plane (his own plane, as fitted) flies the rest
  of the letter, stroke by stroke, leaving pale yellow smoke, while each stroke's words are said ("Start at the top. Pull down." "Back up
  and around."). "Trace the smoke!" He traces over the smoke.
- **b, d, p and q:** first the two are shown side by side, each first stroke lit as it's said: "b starts with the tall line. d starts
  with the round part." (and "p starts with the long line. q starts with the round part.").
- **Second miss** (or the first when he's been missing a lot, or 🔎, which counts as help): the start dot is held lit (yellow) and the
  letter is walked one stroke at a time: the plane flies a stroke, "Now you try!", he traces it, then the plane flies the next.
- **Where to Start:** the letter's first stroke lights (orange) from the right dot while its words are said, and the right dot or arrow
  glows; "Which line comes second?" lights the first line ("This line comes first.") then the second.
- **Which Way:** "This one faces the right way." (Level 3: "This one is backwards."), the right one glows; b, d, p, q get the side-by-side
  lesson first.
- **Tall, Small, Tail:** the letter's rule ("Tall letters touch the top line." "Small letters fit between the middle line and the bottom
  line." "Tail letters hang below the bottom line."); "This letter floats." / "This letter sinks." "Letters sit on the bottom line."

## The reward: the Airfield, the Show, Free Sky and the Wall

**The loop.** A finished Round earns Bolts and one **Show** (he starts with one free). A Show is flown at a place he has opened; flying a
place he hasn't flown before puts its **patch** on his Wall and opens the next place. Bolts buy planes and parts at the **Airfield**. After
a Show's rings, **Free Sky**: he draws in smoke and can keep it as a **postcard** on the **Wall**.

**The Airfield (`airfield/`).** His plane on a runway, puffing its smoke, and twelve tabs, cheapest first. Tapping a thing he hasn't got
tries it on (it goes on the plane in the picture, the smoke changes) and says its name and price, with Buy when he can afford it; one he
can't afford becomes his Goal (a chip with a bar). Tapping a thing he owns fits it (Gear switches on and off). Show! and the Wall are
buttons on the runway.

| Tab | Free one | For sale | Prices | Total | Changes play? |
|---|---|---|---|---|---|
| Planes | Biplane | Glider, Paper Plane, Seaplane, Racer, Triplane, Jet, Twin Prop, Rocket Plane, Flying Saucer, Space Plane, Dragon | 8 to 100 | 505 | yes: each a little faster or turnier |
| Engines | Little Engine | 5 Rungs | 8 to 80 | 198 | speed ×1 to ×1.7 |
| Wings | Short Wings | 5 Rungs | 8 to 80 | 198 | how tight it turns ×1 to ×1.9 |
| Smoke Tanks | Little Tank | 5 Rungs | 6 to 75 | 176 | trail length ×1 to ×3 (and how much Free Sky smoke) |
| Propellers | Two Blades | 5 Rungs | 6 to 65 | 159 | how quickly it gets up to speed |
| Smoke Colors | White | 13 (Red ... Gold, Glow, Rainbow) | 3 to 40 | 134 | look |
| Smoke Shapes | Plain | 9 (Dots, Stars, Bubbles, Hearts, Little Clouds, Sparkles, Music Notes, Snowflakes, Flowers) | 5 to 38 | 180 | look |
| Paint | Stunt Red | 17 (colours, Racing Stripes, Checkers, Star Paint, Gold, Flames, Lightning) | 3 to 30 | 170 | look |
| Pilots | Kid Pilot | 11 (Cat, Dog, Fox, Bear, Frog, Penguin, Monkey, Robot, Alien, Dino, Unicorn) | 5 to 35 | 172 | look |
| Tricks | Loop, Roll | 6 for the third button (Zigzag, Heart, Spiral, Big Loop, Star, Figure Eight) | 10 to 45 | 154 | yes: draws its shape in smoke |
| Gear | none | Sparkle Wings, Ring Magnet, Bubble Shield, Turbo Button, Banner, Confetti Cannon, Fireworks, Autopilot | 15 to 50 | 260 | yes |
| Wall | none | 24 (Flag, Sun, Star ... Crown, Gold Frames) | 3 to 50 | 389 | the Wall |

**Things to earn: 150** (119 bought for 2,695 Bolts, 15 places opened, 16 patches), plus postcards. 45 of the bought things change how a
Show plays (planes, Engines, Wings, Tanks, Propellers, Tricks, Gear). No price is over 100.

**The Show (`show/show.ts` simulation, `show/ShowScreen.tsx`; 2D canvas, no 3D, no physics library).**
1. **Pick a place:** the sixteen places as patches (open ones in colour, ✓ on flown ones, 🔒 on the rest: "Fly a new Show to open it!").
   The newest unflown place is picked; Take off!.
2. **The rings (about 40 seconds):** the world is 1000 units tall and as wide as the screen's shape. His plane flies by itself; a held
   finger anywhere on the sky leads it (it turns toward the finger as tightly as its Wings let it, as fast as its Engine lets it). Ten rings
   come one at a time; a ring he doesn't reach floats off after 7 seconds and the next comes. Loop, Roll and the third trick (and ⚡ with the
   Turbo Button) are buttons above the floor, away from the edges. Three clouds, balloons or birds (by place) drift across; bumping one only
   wobbles the plane ("Wobble!"; the Bubble Shield bounces it off). **It can't be failed:** after 40 seconds the rings are over however many
   he flew through. A scripted child that does nothing finishes; one that steers at the rings flies through most (`show/show.test.ts`).
3. **Show done:** "Show done! You flew through 7 rings!", a patch and "A new place to fly!" when it's a new place. The Show is used and its
   2 Bolts paid now; leaving before (🛫 twice) costs and pays nothing.
4. **Free Sky:** "The sky is yours! Draw with your smoke!" Smoke only while his finger is down; it stays. 📮 Keep puts it on the Wall
   ("You kept a postcard!"); ✓ goes back to the Airfield. When the Wall is full, Keep says "Your Wall is full!" and shows his postcards
   right there: he taps one ("Tap again to take it down.") and taps it again to swap it for the new one (🎨 goes back to drawing). The Smoke Tank sets how much smoke Free Sky holds (800 to 1,600 points; then "Out
   of smoke!").

**Frame rate (the brief's risk):** the trail keeps at most 300 pieces (90 × the Smoke Tank), drawn as six bands (six strokes a frame), with
at most 40 shape marks; Free Sky's drawing goes onto its own layer and only new points are drawn each frame; the scenery is painted once per
size; the canvas runs at most 1.5 device pixels a CSS pixel; at most 90 sparkles. Measured with `tools/sky-writer/perf.ts` in headless
Chromium at 1080×810 and 2 device pixels a CSS pixel, with the costliest plane (the Dragon, Mega Tank, Rainbow smoke, Stars, Sparkle Wings,
Banner, Confetti, Fireworks, the Star trick): the rings hold 60 fps with the CPU slowed 4× (step and draw 0.9 ms a frame on average, 2.5 ms
at worst), Free Sky 56 fps slowed 4× (0.8 ms, 7.4 ms at worst) and 60 unslowed. Not measured on an iPad 9 (below).

**Postcards** are kept as points (0 to 255 across and down, at most 700 points), not pictures, so the save stays small (a few kilobytes
each), and redrawn over the place's scenery. The Wall holds 24; when it's full, Keep says "Your Wall is full!" and he chooses one to take
down (two taps). Nothing is ever taken down for him.

**The Wall (`wall/WallScreen.tsx`):** the screen he shows people: his postcards (tap one: it opens big and the plane's line draws itself
again), his planes, the sixteen patches (❔ for places not flown) and his Wall things. Gold Frames frames every postcard.

**Economy defaults, for the parent to confirm.**
- One Show per finished Round; one free Show to start. Shows don't expire.
- A Show pays 2 Bolts (`SHOW_BOLTS`), like Dino Dig's Dig; a Round pays at most 6. So a Round and its Show pay at most 8, and everything
  costs about 340 Rounds. The first Rung (6 to 8 Bolts) comes after about one Round.
- A new place opens only by flying the newest place: one new place per Show, so all sixteen take sixteen Shows.
- No Legendaries, no Trophies.

## Look (pass 3, design), 2026-11-18

Sky Writer's own world is **a ruled sky**: deep sky blue (#1765c4) fading to a pale horizon (#9fd6fb) with a bank of white cloud along the
bottom of each sky screen, the three writing lines (top, middle dashed, bottom) drawn as white contrails wherever he writes or reads a
letter, cloud white (#f7fbff) for paper and panels, and stunt-plane red (#e63946, dark #a8222c) for his plane, the Show and the trim (the
red band over each question card and panel). The family look stays: Bungee titles, Nunito words, Andika for every letter he reads, 4px
outlines, drop shadows that press in; signals stay the family's (green Go and right and the start dot; yellow look here: a taught answer,
the plane's lesson smoke, the held start dot, the b/d card; orange being read aloud: a lit stroke).

- **Icon** (`icon.ts`): a big single-storey smoke "a" in white with a dark outline, sitting between the middle and bottom contrail lines
  on a deep-to-pale sky, its stroke running on into a smoke trail up to a red biplane (black outlines, yellow spinner) climbing out at the
  upper right; a little cloud top left, a cloud bank along the bottom. No sunburst: Time Flies is the blue sunburst with a clock and a grey
  jet; this one is ruled sky with a letter. Checked at 60 px and tile size beside the other games (`tools/sky-writer/icon-sheet.ts`).
- **Home**: Play is the icon's scene at the left of a strip of sky (the lines run on across the whole tile at the letter's scale) and the
  green ▶ at the right, so it never covers the plane; in a tall tile (iPad sideways) the ▶ sits under the drawing. The Airfield's runway has
  a centre line; the Show's plane flies through a yellow ring on red; the Wall is gold.
- **Writing pad**: the guide dots are white ringed in navy, so they show where they cross a white line. A lesson's plane is about two thirds
  of a line space long and never under about 90 px; its smoke is a yellow core in a soft white puff (and so is the smoke he traces after).
- **Lessons**: b/d (p/q) is a cloud-white card with the yellow teaching glow, floating over the work on every screen (so the pad never
  changes size under his finger), each letter big with its name in Andika; the one not being said is faded. While a lesson plays, the
  answer being taught stays bright while the others fade. The ✓ after a right "Which line comes second?" is a green badge over the corner.
- **Meeting a Family**: the letter cards are as big as the screen allows (fewer to a row when upright).
- **Tall, Small, Tail L2**: the three writings share one scale tall enough for one that sinks or floats, so none is cut off.
- **Round done**: his plane fills its button (a shared rule had shrunk it); the sky has the cloud bank and the runway.
- **Airfield**: the stage spans the screen (sky with two contrails, runway with a centre line); the twelve tabs are two even rows of six
  (one row of twelve on an iPad sideways; pictures only on a phone); every tile is white, the price on a tag (grey while he saves, yellow
  when he can buy it).
- **Show**: places are round patches; Free Sky's label says "Free Sky".
- **Wall**: a cork board: postcards taped up a little crooked (gold-framed with Gold Frames), section names on red tape, planes in sky
  frames, patches stitched (an empty stitched ring for a place not flown), Wall things as round badges.

## Look (pass 1)

Sky blue, cloud white and stunt-plane red, with the three writing lines drawn as contrails, in the family look (Bungee titles, Nunito,
Andika for the letters he reads, 4px outlines, drop shadows that press in). Home: Play is a strip of sky with the lines and the biplane
finishing a smoke "a", the green ▶ over it; his plane at the Airfield; the Show tile (red, with the count); the Wall (gold); My Levels. Icon
(`icon.ts`): a red biplane finishing a smoke "a" over the lines on sky blue. Signals stay the family's: green Go and right and the start dot,
yellow look here (a glowing answer; the start dot held in a lesson), orange being read aloud (a lit stroke).

## Voice

Aria (`en-US-AriaNeural`) at -8%, recorded with `tools/make_voice.py --collection sky-writer`: 527 clips in `public/sky-writer-voice/`
(7.4 MB, more than Rover Code's 4.3 MB: the letter names, 24 stroke words, 43 words and every number to 100), trimmed as they decode and chained like Dino Dig's ("Write", "capital", "B."; "It costs", "45", "Bolts."). Letter names are
"Letter B" phrases, recorded as "B." (make_voice.py's existing rule), the same clip for a capital and a lowercase letter; "capital" is its
own clip. The b/d/p/q lesson lines are recorded as "B, starts with the tall line." so the voice says the letter's name. "cat" is Jenny's
voice, as in Dino Dig (Aria says "Kate"). Answer buttons are never read out.

**Voice check.** All 527 clips are real audio (none empty; a test checks each file exists and is over 1.5 KB). Every clip except numbers
21 to 100 (447) was transcribed back with faster-whisper small.en, and the doubtful ones with large-v3-turbo. Fixed after the check, in
`COLLECTION_SPEECH['sky-writer']` in `make_voice.py` (only this collection's clips): Aria's "Q." came back as "Hugh" or "Hue" however it
was written (Q! Queue. Cue.), so **"Letter Q" and the q lesson line are Jenny's voice** (both models hear Q); the stroke word **"Dot."
became "Add the dot."** (alone it came back as "."); **"Start at the green dot!"** is said with a breath ("green, dot") (it was "green
knot"); the cheer "Nice writing!" became **"Great writing!"** ("riding"); the locked hints say the kind's name with commas round it (as
Dino Dig found); the Wall's "Medal" is a **"Gold Medal"** ("metal"). Rechecked: all heard right by both models. Left for the parent's ear:
small.en hears "Write" as "Right", "bat" as "that" (large-v3-turbo hears it right), "Boing!" as "Boy", "Gear" alone as "year", and "This
letter sinks." as "syncs". The letter names said alone ("A." to "Z.") were heard right by large-v3-turbo; none was listened to by a person.

## Save

`sky-writer-save`, version 1 (an unknown version reads as a blank save), and `sky-writer-place` for the screen and the Round in progress.
`readAirfield` trusts nothing: nothing he doesn't own is fitted, no more places are open than he has flown his way to, broken postcards are
dropped. A Show isn't a place: a reload during one lands at the Airfield with the Show still there.

## Pass 2 (bug and sound review), 2026-11-18

What the review found and changed (the sections above are updated to match):

- **The stroke checker invented misses.** Random scribbling over a letter (mashing) was read as a wrong start three times in four at
  Level 1; a stroke that went half-way and slid back up and off the pad was called "wrong way"; a correct letter written a bit big or
  slanted in Write It could be called a miss; a sloppy start beside the green dot, going the right way, could be called a wrong start; on a
  sideways phone (a line unit about 40 to 55 px) the lanes and starts were narrower than a fingertip. All fixed (see How a stroke is
  checked), each with a test in `letters/check.test.ts`, which still requires every backwards stroke, circle the wrong way, b written as d
  and wrong start the first build caught to be a miss.
- **A dot drawn with a little wiggle never counted** (only a near-perfect tap did): fixed.
- **"Keep going!" after a finished stroke** (a circle closed with a small overshoot) and the rub-out hints queuing up one per rub-out when
  he mashes (the voice went on for seconds after he stopped): fixed; the Show's "Wobble!", trick names and the like are dropped the same way
  while the voice is talking.
- **The words didn't match the plane:** "Push up." (a, g, q), "Push up to the top." (d), "Back up and over." (n, m, h, r) and "Back up and
  around." (b, p) were said while the plane flew only the stroke after the push up. The plane now flies back up what was drawn first
  (`leadIn` in `letters/strokes.ts`); `letters/words.test.ts` checks every stroke word against what the plane flies.
- **k and K:** the leg came off partway up the arm; it now comes from where the arm meets the stem, as Zaner-Bloser writes it.
- **Which Way Level 3 could be unanswerable:** a backwards d in "bed" is drawn as a b ("beb"), and the word was never said. The word is now
  said ("bed. One letter is backwards. Tap it!"); every question's line is in `writing/ask.ts` and tested to say what is needed to answer it.
- **Fingers on the pad:** a resting hand that touched first, or landed with the finger, could take the stroke, and a pencil once seen
  stopped fingers working for the rest of the question. Now the touch that moves is the writing, a touch that sits still is dropped without
  a word, and a palm is ignored only while the pencil is down and for a moment after. `tools/sky-writer/fingers.ts` plays these with real
  touch events (a second finger, a resting hand, sliding off the pad, a cancelled touch, fast, slow, tiny and big strokes, a miss and its
  lesson, mashing).
- **Write a Word on a sideways phone:** the word sat above the pad, leaving letters about 38 px a line unit; it now sits beside the pad,
  and the pad's margins above and below the lines are smaller (letters about 10% bigger everywhere).
- The offline check (`tools/sky-writer/offline.ts`) now checks every clip is precached, not just over 500, and that the second question is
  said offline too; the reload check (`tools/sky-writer/reload.ts`) also reloads during a Show and in Free Sky.

Left as they are, for the parent: a t cross or a capital's bar drawn right to left is a wrong-way miss (Zaner-Bloser slides right; some
programs accept either, and left-handed children often cross right to left); in Write It a stroke written backwards that starts at the
height the right one does (v, w, c, e) only rubs out. (When the Wall was full, keeping a new postcard meant leaving Free Sky to take one
down, losing the drawing; pass 3 fixed it: see Look.)

## Open questions for the parent

1. **Which handwriting style does his school teach?** Ball-and-stick (Zaner-Bloser and others) is the default; if it's D'Nealian or another
   slanted style, the stroke table changes (`letters/strokes.ts`). Also: does his school start t at the top line, use an open 4, a flag on
   1, bars on I?
2. Is the Family order right for him, and should q wait until later (as Learning Without Tears does)?
3. Watch him use Trace It (the brief's first risk): are the lanes too strict, too loose? Does he lift between strokes or run on? Does he
   like the plane's lesson, or would he rather just try again?
4. Is a second plane game on the site fine (Time Flies has the 3D Hangar)? The brief's fallback: the same kinds with a spray-paint robot or
   a laser cutter.
5. Should a Show pay Bolts at all (2 now), or only be for fun?
6. Are 24 postcards enough, or should the Wall be bigger?
7. Is "Sky Writer" the name?

## Not done

- **No child has used the stroke checker.** It is tuned with scripted fingers only; the real tuning is the parent watching him.
- Not run on a real iPad 9 or iPhone, or in Safari/WebKit. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 by the tour
  (`tools/sky-writer/tour.ts`, real touch events through the DevTools protocol), on a new save and on saves with every kind open at Level 2
  and at Level 3 (several Rounds each, so every kind gets a deliberate miss).
- Apple Pencil input is handled (pointer events, palm rejection once a pencil is seen) but not tested with a pencil.
- The Show's frame rate on the iPad 9 is not measured (60 fps in headless Chromium slowed 4×, above); the writing pad's isn't measured at all
  (it redraws a few lines and his smoke each frame, at up to 2 device pixels a CSS pixel).
- The Round resuming after a reload is checked once (`tools/sky-writer/reload.ts`), on the meeting; offline on the production build by
  `tools/sky-writer/offline.ts`.
- The voice clips have not been listened to by a person (see the voice check).
- Visual design is pass 3's: the writing pad, the Airfield, the Show and the Wall are functional, not designed. The plane in the lesson is
  small; the Home Play tile's plane sits under the ▶.
- No Trophies, no per-letter strength (per Family), no lowercase-capital pairing questions, no handwriting of words beyond three letters.
