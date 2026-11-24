# Spec: Moon Base Mail (reading a short passage for meaning; build a moon base and land its supply ship)

Status: built on 2026-11-24 (pass 1 of 3: build), playable at `/moon-base-mail/` with a tile in **Learning Games** on the landing page,
after Cargo Words. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad or in Safari. The name is
still a working name.

A new learning game on the family site, built the same way as Cargo Words (`src/cargo-words/`, `.scratch/cargo-words/spec.md`) for the
same player (6 to 7, reads short words, leans on the recorded voice, alone on an iPad 9), and the third-batch step up in reading after
Sentence Express: from the sentence to the passage. Short mixed Rounds earn Bolts, spent on modules for his moon base, landers and their
parts, suits, paints, plants and things for the base. Each Round also earns a **Landing**: he flies the supply ship down to the pad
himself, and it brings the newest module he bought, a moon rock, and every fifth time a special crate.

## Research: what it teaches, and where it starts

Legend: **[V]** read in a source this session, **[S]** search result or summary only, **[M]** from memory, not re-checked.

| Standard | What it asks | Where it is in Moon Base Mail |
|---|---|---|
| CCSS RL.1.1, RI.1.1 | Ask and answer questions about key details in a text [S, Iowa, Chino USD grade 1 lists] | **Read the Mail** L1 (who, what, where); the detail question on every Big Idea, Clue Finder and Fact File letter |
| CCSS RL.1.2 | Retell stories, including key details, and show understanding of their central message [S] | **What Came Next** (retell in order); **Big Idea** |
| CCSS RL.1.3 | Describe characters, settings and major events using key details [S] | **Read the Mail**, **Clue Finder** L2 (how a character feels) |
| CCSS RI.1.2 | Identify the main topic and retell key details of a text [S] | **Big Idea** L1–L2, **Fact File** L1 |
| CCSS RL.2.1, RI.2.1 | Ask and answer who, what, where, when, why and how to show understanding of key details [S; RI.2.1's wording only seen garbled in a search result] | **Read the Mail** L2 (when) and L3 (why and how, answered in the letter) |
| CCSS RI.2.5 | Use text features (captions, bold print, subheadings, glossaries ...) to locate key facts [S, Shmoop RI.2.5] | **Fact File** L2: labels on a picture |
| CCSS RI.2.7 (next to RI.2.5) | Explain how images contribute to a text [S] | **Fact File** L2 |
| TEKS 2.6(F) | Make inferences and use evidence to support understanding [S, Texas Gateway] | **Clue Finder** (every Level: the answer is never written in the letter; the clue words are lit in the lesson) |
| TEKS 2.6(C) | Make, correct or confirm predictions using text features, characteristics of genre and structures [M] | **Clue Finder** L3: what will happen next |
| TEKS 2.6(G) | Evaluate details read to determine key ideas [M; the search did not return its text] | **Big Idea** L3: the sentence that does not belong |
| TEKS 2.7(D) | Retell and paraphrase texts in ways that maintain meaning and logical order [M] | **What Came Next** |
| TEKS 2.9(D) | Recognise characteristics and structures of informational text: the central idea with supporting evidence; features and graphics to locate and gain information [M] | **Fact File** L2–L3 |

TEKS numbering differs between the 2009 and the 2017/2019 Grade 2 standards (TEA publishes a side-by-side); the letters above are the
current (2017) ones, from memory where marked.

**Where Level 1 starts (read in the code, `src/sentence-express/reading/problems.ts` and `views.tsx`).** Sentence Express ends with
What Happened (he reads one sentence and taps its picture; the sentence is never said, and 🔊 counts as help) and Who, What, Where (a
sentence is said, then a question; Level 3 has two sentences, the answer in one). So Read the Mail Level 1 starts one step on: three
sentences he reads himself, a spoken who/what/where question, picture answers.

**The speaker rule is Sentence Express's What Happened rule.** The letter is never said when it appears. A 🔊 beside each sentence reads
it, and a 🔊 beside each written answer reads that answer; using either makes that answer "helped" (`current.actions.help` in
`views.tsx`), which in the shared Round engine means no Mastery credit and no first-try Bolt. The question itself is said (only after he
taps **I read it**), and 🔊 at the top says it again without counting as help.

**What the Mastery rule does about speaker taps.** A helped answer counts in the Mastery window as not clean, so it never counts toward
16 of 20 or 10 in a row. A child who taps the speaker on every letter never levels up and earns only the finishing Bolt each Round
(`learning.test.ts`: forty helped answers leave him at Level 1). It does not make him "struggling" (that counts misses), so he gets no
extra lessons for listening. Every tap is counted in the save (`learning.heard`: sentence taps, answer taps, answers, and answers helped
by listening). The game has no parent screen, so the count is only in the save for now (open question 4).

**The allowed-word rule** (`mail/words.ts`, tested on every word of every letter, written answer, statement and label). A word is allowed
when it is in Sight Squad's list, Dino Dig's list (which is Word Wreckers' table) or Cargo Words' tables (long words, add-on words and
their bases), and, as a default for the parent to confirm, Sentence Express's sentence words and the words he read in Hook and Ladder
(its Endings words, compound words and their halves, its opposites); any of those with a regular ending he met in Hook and Ladder (-s,
-es, -ed, -ing) or Cargo Words (-er, -est); or one of 46 **base words**, the Moon Base's own, met first in a **Meeting** (their pictures
and the voice) before the first letter that uses them. 36 of the base words are used: around, Ava, base, boots, cloud, Commander, crater,
crew, Dot, dome, dust, Earth, food, gravity, hatch, ice, Jo, Kit, lander, light, mad, next, Pip, planet, put, rover, scared, space, suit,
tired, wind (and plurals). The letters use 111 Sight Squad words, 59 Dino Dig words, 41 Cargo Words words, 44 Sentence Express words, 41
Hook and Ladder words. Meetings come in nine small groups (crew; the base; going outside; getting about; around the base; the mail;
words for the reports; feelings; "next"). While he is still meeting them, a letter that needs at most one new group is picked first, so
a Round is not all Meetings (the first Round of a new save has two or three).

## Kinds

Five kinds, three Levels each. Defaults:

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Read the Mail** `ask` | start | 3 sentences; who, what or where; picture answers (14 letters) | 4–5 sentences; when as well; short written answers (12) | 4–5 sentences; why and how, the answer said in the letter (10) |
| **What Came Next** `order` | start | read a 3-sentence story, then tap its 3 pictures in order (13) | 3 sentences mixed up, no pictures, only one order makes sense (10) | 4 sentences mixed up, with First, Next, Then and Last (10) |
| **Big Idea** `main` | Read the Mail L2 | the picture that fits the whole letter (9) | the best title of three (9) | one sentence does not belong: tap it (9) |
| **Clue Finder** `infer` | Read the Mail L2 | "Where is Ava going?" picture answers (9) | how someone feels, and which sentence tells you (9) | what will happen next (9) |
| **Fact File** `fact` | What Came Next L2 | find a fact said in the report (10) | use the labels on its picture: "Which part slows the lander down?" (9) | "Does the report say this?" yes, no, or not in the report (9) |

Each letter has two or three questions (359 in all). What Came Next's are made from its lines: the whole order, what happened first, what
happened last. Big Idea, Clue Finder and the Fact File's first Level carry a detail question too, so a letter can come back asked another
way.

**Mastery, placement and Rounds (as Cargo Words).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30
questions of a kind at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three
probes each of Read the Mail and What Came Next at Level 2; three clean probes start that kind at Level 2. Rounds are five answers, mixed,
never the same kind twice running while there's another (a starred kind comes back in between when only one is left to practise); about
one in three (and always the one after a miss) is easier and doesn't count; a miss comes back later as a new letter with no Mastery
credit. A Round resumes after a reload. A Meeting counts as one of the five.

**How a question goes.** The letter appears on cream paper with a moon stamp, "To the Commander" and "from Kit" (the Fact File's are
reports, "Fact File"). The voice says "Read the letter. Then tap I read it." He reads it (with a 🔊 beside each sentence if he needs it)
and taps **I read it**; only then is the question said and its answers shown, beside the letter on a sideways screen and under it
upright. The letter stays on screen while he answers. Written answers each have a 🔊. What Came Next's mixed sentences, and Big Idea's
"which one does not belong", are tapped on the letter itself.

## Rules the tests enforce

`mail/mail.test.ts` over every letter and question, `reading/problems.test.ts`, `learning.test.ts`, `reading/teach.test.ts`:

- Every word of every passage, written answer, Fact File statement and label is in an allowed list (above).
- Exactly one choice is right, every choice differs, pictures differ.
- The right answer is never the only choice that names something in the letter, and never the longest by a clear margin (no more than
  four letters or 30% longer than the longest wrong one).
- Wrong answers in Read the Mail are things from the letter (every content word of the choice is in it, or the letter is signed by it),
  each the answer to a different question (a place for a who, a time for a where).
- In Clue Finder, neither the answer nor the wrong guesses are written in the letter (they are guesses the clues rule out), and every
  question records its clue words, each of which is in the letter, and the thinking said after them.
- Every question records the sentence(s) that hold its answer ("not in the report" holds none); a yes or no Fact File statement shares a
  word with the sentence it points at.
- Sentence counts per kind and Level (table above, `mail/types.ts`); no sentence longer than twelve words.
- What Came Next Level 3's lines start First, Next, Then, Last; Level 2's never do; the mixed-up sentences are never shown in the right
  order; every other order of taps is wrong.
- A letter is not asked again until at least twenty others have been, and never with the same question twice running (simulated 150
  Rounds from a new save, from all kinds at Level 2, all at Level 3, and two kinds only at Level 2: no letter came back within twenty).
  A Round never asks a letter twice. At the start, Read the Mail and What Came Next Level 1 have 27 letters between them.
- Lowercase in Andika, capitals only for a sentence's first word, I, and names.
- Every Fact File report's id is listed in this spec with its sources (below).

**The second read for two right answers and guessable ones** (pass 1 did it on all 151 after writing them): it took out "from a star"
beside "from the sun" (the report said the sun is a star), "in a hot spot" beside "in the sun", "Who got the rock out?" and three other
questions whose letter had only one person, place or time (so the type of answer gave it away), and added a second time or place to
four letters so "when" and "where" have a wrong answer of the same type. "There it was, under a box!" was made plain, since an
exclamation also says Kit is happy.

## Teaching a miss

Never a red X (`reading/teach.ts`). The first miss gets the brief's short lesson, and "Try again!":

- **Read the Mail, the Fact File and every detail question:** the sentence holding the answer lights up and is read: "It says: Sam put a
  big box in the dome. So the box is in the dome." A labelled part glows. "Does the report say this?": the sentence, then "The report
  says so." / "The report says it is not so.", or "The report does not say that."
- **What Came Next:** "Let's put it in order." The story plays in its right order, each sentence lit and said with "First," "Next,"
  "Then," "Last,".
- **Big Idea:** "This one is about the plants." "This one too." "And this one." "So the letter is about the plants." The odd one out:
  "But not this one!"
- **Clue Finder:** "Look for the clues." Each clue lights in the letter and is said ("suit", "boots", "helmet"), then the thinking:
  "You put those on to go outside."

The second miss (or the first when he has been missing a lot) gets the fuller lesson: "Let's read it together." The whole letter is read,
each word lighting as it is said (shared out over the clip by its letters: the clip has no word timings), then the short lesson, then
"Listen again." and the question again. Tested: every line a lesson can say is recorded; the order lesson says the story in order.

## The reward: the Moon Base, the Landing and the Crew

**The loop.** A finished Round earns Bolts and one **Landing**. Bolts buy modules and the rest. A module he buys goes on the supply ship;
each Landing delivers the newest one waiting (or a supply crate when none is), and after the Landing the Base opens with it waiting:
he taps a free plot and it goes down there (a fanfare). He can pick up any module (tap it) and put it on another plot (tap it) at any
time. Tunnels join modules that stand side by side, drawn by themselves. He starts with one free Landing, so he sees the reward before
his first purchase. Flat 2D, no 3D or physics library, no new dependencies.

**The Moon Base (`base/`).** From above: a grid of plots on grey ground, the home dome in the middle (`BaseMap.tsx`). The map scrolls
when it outgrows the screen. Modules matter (`base.ts`): the greenhouse opens the garden (and living domes 3 to 6 need it); each living
dome adds a crew member (Max, Pam, Tess, Rex, Liz, Gus); the solar field keeps the windows lit through the night on a walk; the rover
garage opens the moon buggy and its parts; the observatory opens the telescope on a walk; the workshop opens lander parts and the rock
shelf; the second landing pad opens the Wide Cargo Lander, the hangar the Tall Lander, the crane tower the Crane Lander, the rocket pad
the Star Lander; the glass garden dome makes plants grow twice as fast; the moon mine brings rarer moon rocks.

**The Landing (`landing/`, the action, about 30 seconds for a careful child).** From the side, on a canvas: black sky, the Earth (hanging
still: from the Moon's near side it never rises or sets, so the brief's "the Earth rises" was not drawn), grey hills and craters, the pad
with blinking lights, a yellow arrow pointing to the pad when it is off screen. He **holds the Engine button** (bottom right, above the
56px floor, inset from the edge) to slow the fall or rise, and **a finger held on the moon** slides the ship toward it. Low gravity,
floaty fall (capped). It **cannot be failed** (`landing/sim.ts`, tested): a hard touchdown bounces on its legs; off the pad it rests a
moment and hops toward the pad by itself, high enough to clear any ridge; after 45 seconds it is guided to the pad; nothing can break and
fuel never runs out. A child who does nothing lands on every one of 3,000 generated Landings in at most 96 seconds; clumsy, careful and
engine-holding children land with all six landers. A careful child takes 31 seconds on average (50 at most). If he does nothing for 12
seconds the voice tells him to hold the engine. Keys work on a computer (arrows, space).

**After the Landing.** How soft ("Soft as a feather!" to "Big bounce!") and how close ("Right in the middle!" to "On the pad!"), his bests
(softest touchdown, closest to the middle; each beaten pays a Bolt and is cheered), the Bolts, the moon rock it brought, any special crate,
and what it carried. Then Base (pulsing when a module waits), Land again, or ▶.

**Landers.** Little (free), Hopper (bouncier, hops further), Wide Cargo (soft legs, slower), Tall (strongest engine), Crane (fast slide),
Star (fastest slide, softest). Parts in three ranks: Springy Legs → Super Springs → Pillow Legs (softer bounce), Big → Mega → Super
Engine (more thrust), Side → Quick → Zoom Jets (faster slide); and five light colours.

**The Crew and show off: Walk the base (`walk/WalkScreen.tsx`).** His astronaut in his suit and helmet walks (◀ ▶ held) and moon-hops (⤴)
along a row of his modules joined by a tunnel. The five letter-writers, Dot and Pip and his new crew stand along it; a tap on one gets a
wave and a line ("Hi, Commander!", "Beep boop!", "Meow!"). The light comes and goes; with the Rover Garage he drives the buggy (🚙), with
the Observatory he looks at the Earth through the telescope (🔭). Nothing is paid or used.

### Rewards that never run out

The guide's three layers:

1. **The endless layer** (`base/gen.ts`, all seeded: the same on a reload, tested 3,000 of each). **Landings made from their number:**
   the hills, the craters, a ridge on the way from Landing 8, where the pad is and how far he must slide to it; a little trickier each
   Landing (further, a narrower pad, taller hills, from 260 to about 1,000 metres and a 110 to 60 metre pad) up to Landing 60, then
   steady. Every seventh is a night landing. **Every fifth Landing brings a special crate**: twelve named prizes (Gold Moon Statue, Comet
   Lamp, Alien Toy, Crystal Tree, Star Map, Rocket Fountain, Space Swing, Disco Dome, Robot Band, Meteor in a Jar, Gold Lander Statue,
   Earth Lamp), then lucky statues made from parts (a colour and a thing: "Gold Cat Statue"), without end, never sold. **Moon rocks**:
   every Landing brings one, made from parts (six shapes, twelve colours, four sparkles, three sizes), rarer the further he has got (and
   with the Moon Mine); his newest are on the shelf, numbered, and there is no last rock. **Modules made from parts** after twelve named
   ones (New Module: a shape, a colour, windows and a roof fitting, 96 names from two clips, then numbered). **The garden grows a stage
   every Round** he plays (two with the Glass Garden Dome), and every grown plant adds to the harvest every Round after: something has
   always changed when he comes back.
2. **Things to buy again and again** (prices rise gently, then stay flat): **Land Patch** (22, +4, flat at 50: a column or a row of
   plots, without end), **New Module** (45, +5, flat at 90: a module made from parts; opens after twelve named modules), **Garden Bed**
   (18, +3, flat at 36: a new plant made from parts; needs the greenhouse). A module that has no free plot waits for land: the shop and
   the Goal point him to a Land Patch.
3. **The fixed catalogue: 254 things.** 211 to buy (50 modules, 5 landers, 14 lander parts, 30 paints for the lander and the domes, 11
   suits, 11 helmets, 20 flags, 20 plants, 40 things for the base, 10 buggy parts; 8,231 Bolts in all), 6 crew members (one per living
   dome), the 12 named special crates and 25 badges, plus the free starters.

**Measured with the scripted child** (`base/economy.test.ts`: every answer right first try, every Landing flown with touchdowns that
soften and land closer as he gets better, the cheapest new thing bought as soon as he can, a Land Patch when a module waits for a plot,
an again-and-again thing when nothing new is for sale):

- **Bolts a Round: 9.2** (a Round's 6 and its Landing's 3 to 5) over the first 300 Rounds. No Round and Landing pays more than 11,
  under Turbo Tally's 15.
- **The fixed catalogue lasts 947 Rounds** (every badge by Round 947 too). At about 20 Rounds an hour that is about 47 hours. The tour
  measured a new player's first Round (three Meetings, two letters each missed twice, both lessons) at 120 seconds and a Landing at 16
  seconds (the tour steers straight in); a child reading letters carefully probably plays nearer 20 Rounds an hour.
- **The longest gap between new things: 2 Rounds in the first 100** (7 in the first 300). His first purchase is in Round 1 (Star Flag, 5).
- After 2,000 Rounds something new is still on offer every Round (a Landing made from its number, a new moon rock every Landing, a special
  crate every fifth, the garden, the again-and-again things), and no state reads "all done".
- The dearest thing, the Star Lander (340), is 37 Rounds of saving; eight things take more than 15 (Star Lander, Sky Elevator, Rocket
  Pad, Giant Telescope, Moon Mine, Crane Lander, Hangar, Tall Lander). The twelve dearest are all modules, landers and parts.

**Economy defaults, for the parent to confirm.** One Landing per Round, the first free; Landings don't expire, and one is used only when
the ship settles on the pad (leaving midway costs nothing). A Landing pays 3, plus 1 for a softest touchdown and 1 for a closest to the
middle: 3 to 5. Prices up to 100 in ones, then whole tens to 400 (`PRICE_TENS`, "You need about 140 more Bolts." as Turbo Tally). Nothing
is ever lost: a module bought is on the ship, waiting to go down, or on a plot (a save that reads oddly puts any missing one back on the
ship); one left waiting goes down by itself on the next Landing.

**Competition.** **None against a rival**, by the brief. His own bests (softest touchdown, closest to the middle of the pad) are kept,
shown on the Landing's card, cheered and paid a Bolt when beaten, and earn badges (Soft as a Feather, Bullseye).

## The Fact File's facts, and their sources

Sources: **[N1]** NASA Science, "Earth's Moon: Facts", science.nasa.gov/moon/facts (a rocky body; orbits Earth about every four weeks;
covered in craters; about 127 °C in full Sun, −173 °C in darkness) [S]. **[N2]** NASA Science, "Weather on the Moon",
science.nasa.gov/moon/weather-on-the-moon (no snow, rain or thunder; a black sky) [S]. **[N3]** NASA Space Place, "All About the Moon",
spaceplace.nasa.gov/all-about-the-moon (craters; moonlight is reflected sunlight) [S]. **[E1]** ESA, "Moon facts: Temperature"
(a lunar day and a lunar night each last about 14 Earth days) [S]. **[L1]** Live Science / Space.com on Moon temperatures (swings
because there is no atmosphere) [S]. **[M]** from memory, not re-checked: the Moon's surface gravity is about a sixth of Earth's (NASA);
footprints stay because nothing (wind, water) wears them away; water ice in permanently shadowed polar craters (LCROSS, 2009; confirmed at
the surface, 2018); the Sun is a star and Earth a planet that goes round it; the Moon is smaller than Earth; Apollo-era facts about the
lunar module (legs, ladder, hatch, descent engine), the suit (white outer layer to reflect heat, a gold-coated visor against sunlight, a
backpack with the oxygen, thick gloves, big boots), the lunar rover (wheels, a dish antenna to talk to Earth, a place for samples); moon
dust is sharp and clings to suits; plants have been grown on the International Space Station; some telescopes orbit Earth (Hubble); a
refracting telescope takes light in at the big end; from space Earth's blue is water and its white is clouds and ice; never look at the
Sun.

| Report | Facts | Sources |
|---|---|---|
| `fact1-01` | The Moon is a big ball of rock; it goes around Earth; there is no air | N1, N2 (only a very thin exosphere: "no air" to a child) |
| `fact1-02` | Craters all over; a crater is a big hole; rocks from space made them | N1, N3 |
| `fact1-03` | The Sun is a star; it is very hot; it lights Earth and the Moon | M, N3 |
| `fact1-04` | The Moon makes no light; it shines with sunlight; the Sun is a star, the Moon and Earth are not | N3, M |
| `fact1-05` | The sky on the Moon is black, day and night, because there is no air | N2 |
| `fact1-06` | Gravity pulls us down; the Moon is smaller so its gravity is weaker; you can jump high | M (one sixth) |
| `fact1-07` | Hot in the day, very cold at night; crews go out in suits | N1, L1, E1 |
| `fact1-08` | No wind and no rain; footprints don't go away; the first footprints are still there | N2, M |
| `fact1-09` | Earth is a planet; it goes around the Sun; the Moon goes around Earth | N1, M |
| `fact1-10` | Ice on the Moon, in dark craters where the Sun doesn't shine; crews can make it into water | M (LCROSS) |
| `fact2-01` | A lander's legs sit on the ground; the crew go down the ladder; the rocket under it slows it | M (Apollo lunar module) |
| `fact2-02` | The crew get in and out at the hatch; its rocket fires to go up and down | M (Apollo lunar module) |
| `fact2-03` | The suit's backpack has the air; the helmet has gold to stop the sun; the boots are big and thick | M (Apollo suit) |
| `fact2-04` | A moon suit is white so it doesn't get as hot; thick hands for gathering rocks | M |
| `fact2-05` | A moon rover's wheels go over rocks and dust; its dish talks to Earth; a box for rocks | M (Apollo lunar rover) |
| `fact2-06` | The Sun is a star; Earth goes around the Sun; the Moon goes around Earth | M, N1 |
| `fact2-07` | A crater is a hole made by a space rock; dust over the ground; footprints in the dust | N1, N3, M |
| `fact2-08` | A telescope: light comes in at the big end, you look in at the little end; stars look big | M (a refractor, as drawn) |
| `fact2-09` | From space, Earth is blue and white; the blue is water; the white is ice and clouds | M |
| `fact3-01` | Ball of rock; no air; Earth is bigger; crews went in rockets ("Crews can dig up moon rocks." is not in the report, and is true) | N1, N2, M |
| `fact3-02` | Gravity pulls down; the Moon has gravity; it is weaker; you jump high ("Gravity on the sun is big." not in it, true) | M |
| `fact3-03` | Plants grow in light; they get water from the dirt; plants have been grown in space; crews can grow them in a dome | M (ISS Veggie) |
| `fact3-04` | The Sun is a star, the one we see by day; much bigger than Earth; don't look at it ("The sun is far from us." not in it, true) | M |
| `fact3-05` | Earth is a planet; it goes around the Sun; it has air and water; it looks blue from the Moon ("The moon goes around the Earth." not in it, true) | N1, M |
| `fact3-06` | Craters all over; made by rocks from space; big and little; some dark inside all the time ("Craters have ice in them." not in it; true of some) | N1, M |
| `fact3-07` | Dust all over; sharp, not soft; sticks to suits and boots; crews brush it off | M (Apollo) |
| `fact3-08` | A lunar day is long, the Sun up for days and days; the night is long too, and very cold | E1, N1 |
| `fact3-09` | A telescope makes stars look big; some are on the ground, some in space; you look in at the little end | M |

Every "not in the report" statement was chosen to be true (or true of some), so it teaches nothing wrong.

**Left out, as not sure enough or not sayable in his words:** the Earth rising over the base (it doesn't, seen from the near side: it was
drawn still); "there is no sound on the Moon" (true of sound through air, but a child hears the crew on the radio in the game); exact
numbers (a sixth of Earth's gravity, fourteen days of sunlight, 384,000 km), which his words can't say; the dark patches being old lava
(true, but "volcanoes on the Moon" invites "are there volcanoes now?"); the Moon's "dark side"; Mars, Saturn's rings and other planets by
name (not in his words; Kit's letter says "a red planet" and "a big yellow planet" without naming them).

## Look

The brief's colours: moon-grey ground under a black sky, the base in warm colours (orange suits, yellow window light, a green greenhouse,
the blue Earth above), the mail on cream paper with a dashed-red moon stamp, in Andika. Family look kept (Bungee titles, Nunito, 4px
black outlines, solid drop shadows). Icon: a cream dome with a lit window and a red flag on grey ground under a black sky with the blue
Earth, and an envelope in front whose stamp is a small moon. Kept apart from Rover Code (a rover on a planet) and Globe Hopper (a rocket
on Earth): here the action is the landing and the place is the Moon. The stylesheet began as a copy of Cargo Words', renamed; much of it
is unused, and pass 3 is the design pass. The landers, modules and crew are drawn simply (shapes and emoji).

## Voice

Aria at −8%, recorded with `tools/make_voice.py --collection moon-base-mail`: **1,856 phrases, 1,856 clips, 30 MB** in
`public/moon-base-mail-voice/` (Cargo Words' is 16 MB, Sight Squad's 30 MB). Every one of the 518 sentences is a clip, as are 359 questions'
lines, every written answer and label, every lesson line ("So the box is in the dome."), every clue, the base words, numbers to 100 and
the whole tens to 400, every name in the reward and the words made things are named from. The precache is the voice plus about 0.4 MB of
code (see "Not done" for the measured total). It fits the site's budget of about 50 MB a game; if it must shrink, the first cut would be
the "So ..." lesson lines (about 250 clips, the answer could be shown instead), not the letters' sentences.

## Save

`moon-base-mail-save`, version 1 (a version it doesn't know reads as a blank save), with `moon-base-mail-place` for the screen and the
Round in progress. The save keeps his learning (Levels, Mastery windows, Tune-Up, Meetings met, the last 40 letters asked and the
question each was asked last, and `heard`: speaker taps on sentences and on answers, answers, and answers he had read to him), Bolts, and
the base: what he owns, his again-and-again counts, every plot's module, the modules on the ship and the one waiting to go down, his
lander and what it wears, his suit, helmet and flag, his Goal, Landings waiting and flown, Rounds played (for the garden), when each plant
was planted, supply crates, his bests and his badges. Anything that doesn't read, or names a thing he doesn't own, reads as the fresh
value; a module he owns that is nowhere goes back on the ship. A reload during a Landing lands at the Base with the Landing unused.

## Open questions for the parent

1. Is "Moon Base Mail" the name?
2. The allowed words include Sentence Express's and Hook and Ladder's (as well as the four lists the brief named), and regular endings.
   Is that fair, or should letters keep to the brief's four lists? (It would mean rewriting about a third of the letters.)
3. The 46 base words are met in nine small Meetings (two or three in his first Round). Too many? Should a Meeting not count as one of
   the five answers?
4. The speaker rule is Sentence Express's: any sentence or answer he has read to him makes that answer "helped" (no Mastery credit, no
   Bolt). With a whole letter that may feel harsh: should hearing one sentence be free, or the rule apply only from Level 2? The taps are
   counted in the save; where would you like to see them?
5. Read the Mail's wrong answers must be things from the letter, so at Level 1 some are of the wrong type (a picture of the box for
   "Where did Sam put the box?"). Is that fine, or should a wrong "where" always be a place?
6. Is one Landing per Round right, and are 3 to 5 Bolts a Landing right (`LANDING_BOLTS` and `BEST_BOLTS` in `base/base.ts`)?
7. The brief asks for the module to be carried to its plot with one finger; pass 1 has him tap the plot (and tap a module, then a plot,
   to move one). Is a drag needed?
8. The Earth does not rise on the walk or the Landing (it would not, seen from the Moon's near side). Is that right for the game?
9. Living domes add new crew who wave and talk on a walk, but the five letter-writers write from the start (holding letters back would
   leave too few to keep twenty letters between repeats). Should new crew also write letters (it needs more letters)?

## Not done

- **Not run on a real iPad 9, an iPhone or in Safari/WebKit.** Checked in Chromium (Playwright) with `tools/moon-base-mail/tour.ts`
  at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and at Level 3 (12 runs,
  each a whole Round with a deliberate first and second miss in every kind met, a speaker tap, the sound paused by the "device" mid-Round,
  a purchase, a Landing to the pad, putting the module on a plot, and a walk). All pass. The tours found and fixed: Home's kinds board
  off the screen on a sideways phone, the answers and "I read it" in the bottom band on an upright iPad, and the "Tap a plot!" tip
  covering (and blocking taps on) the first plot on phones. A Round took 77 to 143 seconds with the deliberate misses; a Landing 16 to
  17 seconds (the tour steers straight in). The production build's precache is 1,872 files, about 30.6 MB (30 MB of voice, 0.5 MB of
  code, styles and fonts), and `tools/moon-base-mail/offline.ts` shows a Round starting, answering and resuming after a reload offline. What most needs checking on the device: the Landing's Engine hold and finger slide together on the
  iPad (two touches at once), its frame time, the letter's text size and the sideways-phone layout of the longer letters beside their
  answers, the 30 MB precache on the first visit, and the read-along lighting (shared out by letters, not timed to the clip).
- **The voice has not been listened to by a person, and not transcribed back** (Cargo Words used faster-whisper; not done here). The
  clips most likely to sound wrong: names said alone (**Jo**, **Kit**, **Dot**, **Pip** may come out as words: "joe", "kit" as in a kit,
  "dot"), **"Commander"** fine but **"Moon Base"** and the made names ("Teal Pod", "Gold Lump"), the quoted sentences ("Kit said, "Thank
  you, Ben!""), the clue phrases said alone ("no food", "jumped up and down"), "mad", "next", and the base words alone ("hatch", "dome",
  "suit" can blur).
- **Read-along lighting** shares a clip's time out by letters; real word timings would need recording with marks.
- **Walk the base** is plain: no Sky Elevator ride, no buggy parts drawn, no rock shelf in the walk, the crew drawn as emoji. Pass 3.
- **The Moon Base map** draws modules as emoji in coloured circles; generated modules have their own drawing. Pass 3.
- **The Landing** has no wind or hazards beyond hills and craters, and its ship is small on an iPad.
- No parent screen for the speaker count; it is in the save only.
- The stylesheet carries Cargo Words' unused rules (renamed): pass 3 should prune it.
