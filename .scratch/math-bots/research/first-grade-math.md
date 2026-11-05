# First-grade math: what the game should ask

Status: research draft (2026-11-04). Working title only: Math Bots. Written so a builder can write the question generators
from it. Nothing here is decided until a spec says so; section 8 lists what needs the user's call.

Audience: one boy, about 6 to 7, alone on an iPad, reads numbers and short words, leans on recorded voice. Short mixed
Rounds earn currency spent on robot combat. He may already be partway through first grade.

Legend: **[V]** read this session in a fetched source. **[S]** search snippet or secondary summary only, source not opened.
**[M]** from memory, not checked this session. **[U]** tried and could not verify. **(est.)** my own judgement or arithmetic.
(The brief pointed to the sight-word note for this legend, but that note uses `[src]`/`(est.)`. The [V]/[S]/[M]/[U] legend is
from `.scratch/airplane-clock/research/rendering-realism.md`. I used it, plus `(est.)`.)

Vocabulary: Game Mode (a "kind"), Level, Stretch, Mastery, Mixed Round, Strength, Meeting, Mod, Goal, as in `GLOSSARY.md`.

---

## 0. The short version

- **Teach ten and the part-whole idea, not a list of facts.** Almost everything hard in grade 1 (making ten, teen numbers,
  missing addends, subtraction, place value) rests on seeing numbers as made of parts around five and ten.
- **Twelve kinds** (section 3). Eight are the core; four can ship later. Time, halves and coins are left out on purpose:
  Time Flies, Chop Chop and Monster Truck Money already teach them.
- **One plain counter, one ten frame, everywhere.** No bot parts drawn as detailed counters (section 7).
- **Three findings that change the brief's assumptions:**
  1. "Avoid timed tests" is not settled. The IES 2021 guide gives timed activities a **strong** evidence rating, with
     limits. No clock in Rounds is still my recommendation, but on product grounds, not because timing is proven harmful
     (section 6.1).
  2. The fight cannot honestly carry the math. The bench work around it can (section 7).
  3. Two repo rules need changing for math: a replayed miss seems to count toward Mastery with the same numbers, and
     sorted number choices with near-miss wrong answers put the right answer in the middle (section 6.3).

---

## 1. What a first grader is expected to learn, and in what order

### 1.1 The Common Core map

Four critical areas: addition and subtraction within 20 with strategies; whole-number relationships and place value;
linear measurement by iterating units; composing and reasoning about shapes [V: CCSS Grade 1 intro].

| Code | What it asks (paraphrased) | Game? |
|---|---|---|
| 1.OA.A.1 | Word problems within 20: add to, take from, put together, take apart, compare; unknown in any position | Bot Stories |
| 1.OA.A.2 | Word problems adding three numbers, total at most 20 | Bot Stories |
| 1.OA.B.3 | Use properties as strategies: 8+3 known so 3+8 known; 2+6+4 = 2+10 | Count On, Over Ten |
| 1.OA.B.4 | Subtraction as an unknown addend | Missing Part, Count On L3 |
| 1.OA.C.5 | Relate counting to adding and subtracting (counting on) | Count On |
| 1.OA.C.6 | Add and subtract within 20; **fluent within 10**; counting on, making ten, decomposing, inverse, near doubles | Make Ten, Facts, Over Ten |
| 1.OA.D.7 | Meaning of =; judge true or false: 6=6, 7=8-1, 5+2=2+5 (true), 4+1=5+2 (false) | Weigh-In |
| 1.OA.D.8 | Find the unknown in three-number equations: 8+?=11, 5=_-3, 6+6=__ | Missing Part, Weigh-In |
| 1.NBT.A.1 | Count to 120 from any start; read and write numerals to 120 | Number Chart |
| 1.NBT.B.2 | Two digits mean tens and ones; ten ones = a ten; 11 to 19 = a ten and some ones; decades | Tens and Ones |
| 1.NBT.B.3 | Compare two-digit numbers with >, =, < | Tens and Ones L3 |
| 1.NBT.C.4 | Add within 100, including two-digit + one-digit and two-digit + a decade, with models and reasons | Big Jumps |
| 1.NBT.C.5 | Find 10 more or 10 less without counting | Number Chart L3 |
| 1.NBT.C.6 | Subtract decades from decades (10 to 90) | Big Jumps |
| 1.MD.A.1 | Order three objects by length; compare two indirectly with a third | Measure It |
| 1.MD.A.2 | Length as a count of same-size units, end to end, no gaps or overlaps | Measure It |
| 1.MD.B.3 | Time to the hour and half hour | No: **Time Flies** |
| 1.MD.C.4 | Data in up to three categories: total, how many in each, how many more or fewer | Bot Stories (Scoreboard) |
| 1.G.A.1 | Defining vs non-defining attributes (closed and three-sided, not colour or orientation) | Shapes |
| 1.G.A.2 | Compose 2D or 3D shapes into composite shapes | Shapes L3 |
| 1.G.A.3 | Halves and fourths of circles and rectangles | No: **Chop Chop** |

[V: thecorestandards.org 1.OA, 1.NBT, 1.MD, 1.G; D.7, D.8 and B.3 examples checked on their own pages.]

Fluency target matters: Grade 1 asks for fluency **within 10**; within 20 is a Grade 2 goal. "Fluent" means fast and accurate,
and is a mix of knowing some answers, patterns and strategies [V: Progressions CC/OA, Grade 2 section]. So Facts should not
demand instant recall of 8+7 from a first grader.

Difficulty the writers expect: some first graders will not master Start Unknown problems or Compare problems whose language
points to the wrong operation; they should meet them, and proficiency can wait for Grade 2 [V: Progressions CC/OA p.14].

### 1.2 The order that works

The Progressions give three levels of method, and each is the road to the next [V: Progressions CC/OA p.6]:

1. **Level 1, direct modelling:** make both groups, count everything.
2. **Level 2, counting on:** start from one addend and count the rest, keeping track on fingers or similar.
3. **Level 3, convert to an easier problem:** decompose and recompose (8+6 = 8+2+4 = 10+4).

Make-ten has three prerequisites, all of which he must have first: (a) the partner to ten of any number, (b) all splits of
numbers below 10, (c) teens as ten and some ones. Prerequisite (c) is harder in English because the teen words reverse the
digits [V: Progressions CC/OA pp.15-16]. This is the single most useful ordering fact in this note: **Over Ten cannot open
until Make Ten and Tens and Ones are ready.**

Suggested year, whatever the curriculum labels (est., drawn from the above and section 1.4):

1. Five and ten structure; quick look at small amounts; partners to ten; splits within 10.
2. Add To, Take From, Put Together stories within 10, then 20; counting on; doubles.
3. Teens as ten and some ones; count to 40, then 120; subtraction as a missing part; related facts.
4. Equal sign in odd positions; true or false; making ten over 10.
5. Two-digit numbers as tens and ones; comparing; 10 more and 10 less.
6. Compare stories; decades; 24+3, 24+30.
7. Length by units and shapes run alongside throughout.

### 1.3 Hard parts and misconceptions

Each is written as what the generator must catch. Section 3 turns these into wrong answers.

| Misconception | What he does | Evidence | Which kind teaches it |
|---|---|---|---|
| **= means "the answer comes next"** | Reads = as "find the total"; 8=5+3 looks backwards; for 8+5=?+3 says 13 (or adds everything, 16) | Most students read it operationally; even first graders can gain the relational view from contexts like 8=8 [V: McNeil et al. 2006 intro]. First and second graders solve operation-right forms less well [S: Carpenter & Levi 2000, via search]. "Here comes the answer" wording in Warren & Cooper [S]. The 12 and 17 errors on 8+4=[]+5 [M: Falkner, Levi & Carpenter 1999] | Weigh-In, and formats across the game |
| **Counting all when he could count on** | Recounts 8 to do 8+3 | Children move from counting all through a shortcut to counting on from the larger number, often on their own [S: Siegler & Jenkins 1989]. Counting on is a thinking strategy resting on the first addend being embedded in the total, not a rote trick [V: Progressions p.14] | Count On |
| **Off by one counting on** | Says "8, 9, 10" for 8+3 (counts the start) | Common classroom error (est.); the Progressions describe the need to monitor when to stop [V] | Count On |
| **Counting back to subtract** | Slow and error prone | Counting on to subtract is easier than counting down, and shows subtraction as an unknown addend [V: Progressions p.15] | Count On L3, Missing Part |
| **Missing addend treated as a sum** | 9+?=13 gives 22, or 13 | Follows from the operational view (est.). Change Unknown and Start Unknown need a situation equation rewritten [V: Progressions p.13] | Missing Part |
| **Teen reversal** | Writes fourteen as 41; hears "four" first | "Four" is spoken first in fourteen, the reverse of 14 [V: Progressions p.16]; 41 for fourteen reported [S: Peters 1997]. East Asian number words are transparent [V: Progressions; S: Miura 1993] | Tens and Ones |
| **Writing what is heard** | Eighty-six as 806 | Named "a common Grade 1 error" [V: Progressions NBT 2011]. Same pattern for 109 as 1009 (est.) | Tens and Ones, Number Chart |
| **Teen and decade words sound alike** | fourteen vs forty, fifteen vs fifty | Named directly [V: Progressions NBT]. Matters for voice: section 4 | Tens and Ones |
| **Decade crossing** | "twenty-nine, twenty-ten, twenty-eleven" | Named directly [V: Progressions NBT] | Number Chart |
| **Digits by size, not place** | 39 > 41 because 9 is big | The tens digit matters more [V: Progressions NBT on 1.NBT.3] | Tens and Ones L3 |
| **< and > flipped** | Places symbols wrongly | "A challenge for early learners"; put the wide part by the larger number [V: Progressions NBT] | Tens and Ones L3 |
| **Compare problems** | Cannot find the difference, which is not physically there; hears who has more but not how many more; thinks "less" means "more" | Named directly, with the fix: matching with objects, and a separate sentence for each part [V: Progressions pp.12-13]. Harder than change or combine [S: Riley, Greeno & Heller 1983 and later reviews] | Bot Stories |
| **Wording, not maths, blocks compare** | "How many more birds than worms?" fails; "how many birds won't get a worm?" succeeds | Hudson 1983: 25% vs 96% in kindergartners [V: as reported in Tolar et al. 2012]; about 64% vs 100% in a small first-grade group [V: secondary blog; original not read] | Bot Stories L2 |
| **Key-word reading** | "more" means add, "left" means subtract | IES says avoid key words: they fail and stop children reading the whole problem [V: IES 2021, Rec 5] | Bot Stories |
| **Length: gaps, overlaps, wrong start** | Counts units with gaps or mixed sizes; starts rulers at 1 | [S: several reviews citing Clements & Sarama] | Measure It |
| **Shape by prototype** | Rejects a rotated or skinny triangle | Half of 5-6 year olds struggled with non-prototype triangles; orientation effects [S: 2016 study; Satlow & Newcombe 1998] | Shapes |
| **Sum vs some** | Hears "some" | Use "total", not "sum", with young children [V: Progressions p.8] | Voice rule |

### 1.4 State and curriculum variations

| Source | Differs from Common Core | Tag |
|---|---|---|
| **Texas TEKS Grade 1** | Forward **and backward** by ones from any start to 120; skip count by 2s, 5s, 10s to size a set to 120; **coins** and their values; equations with three or four terms; open number lines; financial literacy | [V: 19 TAC 111.3] |
| **Virginia 2023** | Facts within 10 "with automaticity"; part-part-whole to 20; forward to 120 but backward only from 30; pennies, nickels, dimes | [S: search; the PDF returned 403] |
| **Singapore P1** | Number bonds are the base for adding and subtracting; numbers to 10, then 20; ordinal numbers; picture graphs; money in cents. Sources disagree on whether work reaches 100 in P1 | [S: MOE school slides, parent guides; MOE syllabus not found] |
| **Math in Focus Grade 1** | Numbers to 10, then number bonds, then addition and subtraction within 10 | [S: chapter lists only; 2020 edition; later chapters vary by edition] |

Takeaways (est.): every source agrees on bonds and ten first, so the order above is safe. Add backward counting and skip
counting to Number Chart if the family's state wants them. Coins are covered by Monster Truck Money. Common Core has no
money standard in Grade 1 [V: 1.MD list].

### 1.5 What is known about teaching this

- **Strategy before speed.** Baroody's three phases: counting, reasoning, mastery. His number-sense view holds that the first
  two lead to the third, and practice should make reasoning automatic rather than drill isolated facts; purposeful practice
  beats drill and practice [V: Baroody 2006]. This is an argued position in a practitioner journal, not a trial. The IES 2009
  panel says there is evidence strategy-based fact instruction, such as counting on, beats rote memorisation [V: IES RTI 2009
  Rec 6]; it recommends quick-retrieval work "beginning in grade 2", with cumulative review and number families [V]. Fuchs
  found counting-strategy remediation beat control (d = 0.53), and brief practice added on top (d = 0.21 over strategies
  alone), though in third graders [V: Fuchs et al. 2010]. Baroody's first-grade computer study exists; I could not get its
  results [U: Baroody, Purpura, Eiland & Reid 2014].
- **Tablet fluency games are not automatically good.** A tablet game for first graders did not improve Arabic-numeral
  addition or subtraction fluency, only subtraction with dots [S: van der Ven et al. 2017]. Evidence is modest and often
  developer-run [S].
- **Word problems: teach structure.** Word-problem types and their underlying structure; avoid key words [V: IES 2021 Rec 5].
- **Representations.** Use a small well-chosen set, concrete and semi-concrete [V: IES 2021 Rec 3, strong]; number lines
  [V: IES 2021 Rec 4, strong]. Move from concrete to symbols: concreteness fading [S: Fyfe et al. 2014], with better transfer on
  equivalence in second and third graders [S: Fyfe, McNeil & Borjas 2015].
- **Linear number experience.** Linear number board games raised low-income preschoolers' number understanding; circular ones
  did not [S: Ramani & Siegler 2008; Siegler & Ramani 2009]. A straight path is the right shape (est.).
- **Subitizing.** Perceptual, then conceptual: seeing 5 and 2 as 7. It supports counting on: see 4, then "5, 6, 7" [S: Clements
  1999; Sarama & Clements trajectory via IES REL material]. The Progressions make the same link [V p.8].
- **Equal sign.** Nonstandard contexts help; nonsymbolic practice helped symbolic equivalence in second graders [S: Sherman &
  Bisanz 2009]; practice with operations on the right beat traditional practice, though some children still fell short [S:
  McNeil et al. 2015]; IES's K-2 example defines equal as "the same amount" with counters [V: IES 2021 Example 2.2]. Mixed
  evidence on the balance model: widely used, with limits [S: Warren & Cooper; Stephens et al. 2020, 21 K-2 students].
- **Mixing kinds.** Interleaving doubled later test scores for fourth graders [S: Taylor & Rohrer 2010]; other maths results
  are mixed [S: Nemeth et al. 2019 and reviews]. IES recommends cumulative mixed practice [V]. Mixed Rounds fit.
- **Feedback.** Feedback helped children who lacked a strategy and hindered those already taught one [S: Fyfe & Rittle-Johnson
  2015, grades 2-3]. So a first miss should stay light, and full teaching should wait, as the repo's rule does (est.).
- **Apps.** None of 171 top preschool maths and literacy apps had all of prompts, modelling, feedback and rewards that support
  learning [S: Callaghan & Reich 2018]. Educational apps should be active, engaged, meaningful and socially interactive, with
  a learning goal [S: Hirsh-Pasek et al. 2015]; playing alone misses the fourth pillar. Well-designed maths apps did raise 4-5
  year olds' scores in a UK randomised trial [S: Outhwaite et al. 2019, 389 children, 30 minutes a day for 12 weeks]. That is a
  different app and dose; it shows apps can work, not that this one will.

---

## 2. Rules that apply to every kind

1. **One visual language.** Ten frame, number path, number bond, rods and cubes, scale, each met once (2.3). Plain round
   counters in two colours for the two addends, never textured (section 7). Fives are grouped: frames fill row by row.
2. **Fade the picture.** Levels go concrete (tokens), then semi-concrete (frame, path, bond), then numerals only, with the
   picture coming back as teaching [S: concreteness fading]. Chop Chop's progression of words then numbers is the same idea.
3. **Equation formats rotate from the start.** About one written equation in four shows the operation on the right
   (`_ = 6 + 2`, `10 = 7 + 3`). The Round format must not teach that the answer always comes last [S: McNeil 2015].
4. **Read = as "is the same as"** at Levels 1 and 2 of every kind; "equals" may join it at Level 3 (est.; IES example [V]).
5. **Answers are tapped.** Three forms (est.):
   - **Choices**: 3 number buttons. Level 1 only for most kinds.
   - **Number strip**: a fixed row of 0 to 10 (or 0 to 20 in two rows of 11 and 10 on iPad, targets at least 44pt). Each tap
     says the number. One tap, not typing, and the layout never changes. Used wherever recall is the point, because recall
     is what practice is meant to build and three buttons let him recognise the right number instead [M: retrieval practice].
     It also makes guessing useless (6.3).
   - **Build**: drag or tap tokens. Every drag also works by tap (tap a counter, it moves), per "nothing important hidden
     behind precise gestures alone" [V: PRODUCT.md].
   - For two-digit answers: the Door Number's two wheels (tens and ones) already exist in the Garage [V: `GarageScreen.tsx`].
     Better than a keypad because the wheels show place value.
6. **Say, then light up.** Buttons light as read. Nothing in the spoken prompt gives the answer. Replay is always free.
7. **A miss follows the repo's steps.** First miss: show what his answer means on the visual, without giving the right one.
   Second miss, or first when `struggling`: teach in full, in a spoken line under about 6 seconds. Then the question comes
   back; see 6.3 for why with new numbers.
8. **Language.** Say "total" and "in all", never "sum". Use "fewer" and "less" in equal measure with "more" [V: Progressions].

### 2.1 Levels, Mastery, Stretch

Use three Levels per kind, as Chop Chop and Sight Squad do, and `WORD_RULE` (16 of last 20, or 10 in a row, top 3). Use
**Stretch** inside a Level for number size: it exists in `src/modes/progress.ts` but the mixed games do not use it yet (the
fraction makers I read take only a Level). For numbers it fits well: same idea, bigger numbers.

Load (est.): 12 kinds at 3 Levels is 36 Levels. At 10 to 20 pushed questions a Level that is 360 to 720 pushed questions; a
Round of 5 with one in three easier gives about 3.3 pushed, so **108 to 216 Rounds** (8 kinds: 72 to 144). At ten Rounds a
week that is 2 to 5 months, which suits a school year. Placement shortens it.

### 2.2 Per-fact Strength

Sight Squad's Strength fits number facts. Facts is the only kind that needs it; other kinds generate freely. A
family is a pair and its turnaround and inverses: 3+5, 5+3, 8-3, 8-5 are one family, as the IES 2009 panel's number families
suggest [V]. Addends 0 to 10 give 66 families, turnarounds merged (computed, est.). Sets in 3.3.

### 2.3 Meetings

As with words, nothing is asked before it is met. One short Meeting per visual, the first time a question needs it:

| Meeting | Moment |
|---|---|
| Ten Frame | Counters fill two rows of five. "Five on top. Five below. Ten." He taps the frame |
| Number Path | A straight row of numbered squares. He hops 3 |
| Number Bond | A whole splits into two parts and rejoins |
| A Ten | Ten cubes snap into a rod. "Ten ones make one ten." He taps the rod |
| Same As | Two piles on a scale. = appears. "This means the same as" |
| More and Less signs | The wide side faces the bigger number |
| Unit | One unit laid along a length, then repeated |

---

## 3. The twelve kinds

Priority: **core 8** are kinds 1 to 8. Number Chart, Big Jumps, Measure It and Shapes are the second wave, needed for
coverage of the critical areas. Names are working names, short enough to say. Shared helpers are in 3.13.

### 3.1 Make Ten (`ten`)

- **Standards:** 1.OA.C.6 (within 10), building on K.OA.3, K.OA.4. Prerequisites (a) and (b) of make-ten.
- **Screen:** one ten frame. Choices at L1, number strip at L2 and L3.
- **Level 1, Quick Look.** Frame shows n for about 2 seconds, then a cover slides on. "How many?" One free 👀 peek; a peek is
  not help. Example: 7 (top row full, 2 below). The short show is the point: it stops him counting one by one. It limits the
  look, not the answer: he has as long as he likes to answer (6.1). Stretch: 1 to 5, then 6 to 10.
- **Level 2, Ten Partners.** Frame with n filled stays up. "How many more to make ten?" 7 needs 3.
- **Level 3, Hiding.** "Eight in all. Five are here. How many are hiding?" A frame with 5 counters and a cover hiding the rest.
  Whole from 4 to 10.
- **Spoken:** `How many?` / `How many more to make ten?` / `{whole} in all. {part} are here. How many are hiding?`
- **Generate:** `n = pick(1..10)`, weighting 6 to 9, avoiding the last n. L3: `whole = int(4,10), part = int(1,whole-1)`.
- **Wrong answers:** L1: n±1, 5 if n is 6 to 9 (saw only the full row), 10. L2: n itself (repeats what he sees), 10, (10-n)±1.
  L3: whole, part, whole+part (adds everything), (whole-part)±1.
- **Taught:** L1: counters lift and count, then group: "Five and two. Seven." L2: the empty cells fill one by one with the second
  colour and count: "Seven and three make ten." L3: the cover lifts and the hidden ones count; bond shows `8 = 5 + 3`.

### 3.2 Count On (`on`)

- **Standards:** 1.OA.C.5, 1.OA.C.6, 1.OA.B.3 (start from the bigger), 1.OA.B.4.
- **Screen:** number path, then number line at L3. The first addend is a closed box with its number on it; the second is loose
  counters. Tapping a counter hops one square and says the next number.
- **Level 1.** Box of a (3 to 9) plus b (1 to 3). "Eight in the box. Three more. How many in all?" He taps counters: nine, ten,
  eleven. Then taps 11. Stretch: a to 15.
- **Level 2, bigger first.** `2 + 9`: "Tap the number to start from." He taps 9, then counts on. A right total starting from 2
  still counts; starting from the bigger is the taught route, not a rule to enforce. b up to 4, total at most 20.
- **Level 3, count up to subtract.** `13 - 9`: "Start at nine. Count up to thirteen. How many hops?" Difference 1 to 5. Hops
  fade: number line shows only start and end at the top of Stretch.
- **Spoken:** `{a} in the box. {b} more. How many in all?` Numbers by chain. Long start number, as in "Niiiine", is natural and
  marks the start [V: Progressions p.14]: record a stretched version of 1 to 19 for teaching.
- **Generate:** L1 `a=int(3,9+stretch*3), b=int(1,3)`; L2 pick pair with `max>=2*min` so order matters, randomise which is first;
  L3 `a=int(3,15), d=int(1,5), c=a+d`, c at most 20.
- **Wrong answers:** a+b-1 (counts the start, the main trap), a+b+1, a (stops at the start), b. L3: c, a, d+1 (counted the start
  square), and c-a-1.
- **Taught:** the start square glows. "We are already on eight. One more is nine." Hops replay with a number over each, and the
  count of hops shows on counters. At L3 hops are counted: "Four hops. Nine and four make thirteen."

### 3.3 Facts (`facts`)

- **Standards:** 1.OA.C.6 fluency within 10; easy facts within 20. Uses Strength.
- **Screen:** an equation big on a card, spoken. Choices at L1, number strip at L2 and L3.
- **Level 1:** +0, +1, +2, doubles to 5+5, ten pairs, and their subtractions. 
- **Level 2:** rest of within 10 (5+3, 6+3, 3+4, 4+5), with subtraction by the related addition: `8 - 3` "Three and what make eight?"
- **Level 3:** doubles to 10+10, near doubles (6+7, 7+8), 10+n, related subtractions (12-6, 14-7, 15-10).
- **Sets (addends 0 to 10, turnarounds merged, computed):** +0 (11), +1 (10), +2 (9), doubles (8 after those), near doubles (7),
  10+n (6), 8+ and 9+ make-ten (9), ten pairs (2 left), and only four left over: 5+3, 6+3, 7+4, 7+5. Strategies therefore cover
  nearly all of them, which is the argument against rote drill. Crossing-ten make-ten facts are practised in Over Ten first and
  only join Facts once Over Ten reaches Level 2.
- **Spoken:** chain `{a}`, `plus`, `{b}` then a rising `is the same as what?`; or whole clips for all facts (section 4).
- **Generate:** like `wordsFor`: choose from met families weighted to low Strength; next set joins after `gap` clean answers and
  while no more than 2 are shaky. Show the turnaround half the time. Rotate formats (rule 2.3).
- **Wrong answers** (on Choices, so L1 and warm-ups; the strip needs none): for a+b: a+b±1, a-b, a, b. Doubles: 2a±1, a. For
  a-b: a+b (the wrong operation), a-b±1, b.
- **Taught:** the fact in a two-colour frame, with a line by strategy: double "Six and six. Double six is twelve."; near double
  "Six and six is twelve. One more is thirteen."; subtraction "Three and five make eight. So eight take away three is five."
  Never a plain "the answer is 5": the strategy is the point [V: Baroody 2006].

### 3.4 Over Ten (`over`)

- **Standards:** 1.OA.C.6 making ten, 1.OA.B.3.
- **Screen:** two stacked frames. Top holds a, bottom holds b.
- **Level 1, nine.** `9 + 5`: he drags or taps one counter up to fill the top frame. Frames now show 10 and 4. Then he taps 14.
- **Level 2, eight and seven.** `8 + 6`, `7 + 5`. After filling he picks the matching step: `10 + 4`. Then the total.
- **Level 3, either way.** Any crossing pair with no frames: `6 + 8` strip answer; and `14 - 8` by going up through ten. Frames are
  shown only as teaching.
- **Spoken:** `{a} plus {b}. Fill the ten.` then `Ten and {r}.` then `How many in all?`
- **Generate:** pairs both 2 to 9 with total above 10: 36 ordered, 20 with turnarounds merged (computed). L1 `a=9, b=2..9`; L2
  `a in 7,8, b such that a+b>10`; L3 all, including a<b so he must choose where to fill.
- **Wrong answers:** a+b-1 and a+b+1 (slips counting on). 10+p where p is the number moved, a common confusion (est.; for 8+6, 12).
  "104" style is impossible on a strip, which is another reason to use one. Step at L2: `10 + 6` (forgot to move), `10 + 2`
  (used the moved part), `10 + 4`.
- **Taught:** counters slide up one by one with "nine, ten"; the leftovers glow: "Ten and four. Fourteen." Bond shows 6 splitting into
  2 and 4.

### 3.5 Missing Part (`part`)

- **Standards:** 1.OA.B.4, 1.OA.D.8.
- **Screen:** number bond with the whole on top. Answer on strip.
- **Level 1.** Bond, whole at most 10, one part hidden under a plate. "Seven in all. Four here. How many under the plate?"
- **Level 2.** `9 + ? = 13`, bond and frame beside it. "Nine and how many make thirteen?"
- **Level 3.** `13 - ? = 9`, `? + 6 = 15`, `5 = ? - 3`. Equation only.
- **Spoken:** `{a} and how many make {c}?` For a blank, always "what number". Never "plus blank".
- **Generate:** `c=a+d`, position of the unknown picked from allowed slots for the Level. Use `5 = ? - 3` form about one in four at L3.
- **Wrong answers:** c (the answer goes after =; for 9+?=13, 13), a, (c-a)±1, and a+c (adds what he sees, 22) when choices are
  shown. The strip stops at 20, so 22 can't be tapped there. L3 `5 = ? - 3`: 2 (does 5-3), with 8 right.
- **Taught:** the bond parts light; tokens count up from a to c, the same movement as Count On, so subtraction and adding look the
  same [V: Progressions p.15]. "Nine and four make thirteen. So the missing part is four."

### 3.6 Weigh-In (`scale`)

- **Standards:** 1.OA.D.7, 1.OA.D.8. Why a scale fits: real robot combat has weight classes [M; the brief's ~250 lb class].
- **Screen:** a two-pan scale that stays level and hidden behind a cover until he answers. Numbers and counters on each pan.
- **Level 1, Same or not.** `6 = 6`, `7 = 8 - 1`, `5 = 2 + 3`, some false (`6 = 7`, `7 = 7 - 1`). Two buttons: ✓ same, ✗ not same.
  A false one adds a Fix It step (below).
- **Level 2, three cards.** Three short equations; "Tap the true one." `8 = 5 + 3`, `5 + 2 = 2 + 5`, `4 + 1 = 5 + 2` (false). Each is
  read as he taps. Total on the left at least half the time.
- **Level 3, Balance it.** `8 + 5 = ? + 3`, `6 + 4 = 5 + ?`. Strip.
- **Spoken:** `Is it the same on both sides?`; `{a} is the same as {b} plus {c}.`; Level 3 `{a} plus {b} is the same as what number plus {c}?`
- **Generate:** equations from `{left, right}` with values; L1 half true, equal shares of true and false. False ones differ by 1 or
  2, or are the common trap (`4 + 1 = 5 + 2`, shape looks right). L2: one true, two false; one false is `a + b = a + b + 1` style.
  L3: `a+b=x+c`, x in 1..10, totals at most 20.
- **Wrong answers (L3, these are the misconception test):** for 8+5=?+3: **13** (answer-comes-next), **16** (added everything), 8
  (copied the mirror position), 10 is right. Log which is picked (6.4).
- **Fix It step:** after a right "not same", he drags or taps counters to even the pans. Turns a 1-in-2 guess into work.
- **Taught:** the cover lifts, the scale tips, and each side's counters count: "This side has seven. This side has nine. Not the
  same." "The equal sign does not mean the answer is next. It means both sides are the same." (Under 6 seconds; say the second
  half only once in a Round.) Do not start this until a Meeting has happened.

### 3.7 Bot Stories (`story`)

- **Standards:** 1.OA.A.1, 1.OA.A.2, 1.MD.C.4 (the Scoreboard).
- **Screen:** story told one sentence at a time, with plain token rows appearing as numbers are said. A bench he can drop counters
  on to model it (his to use or ignore). Strip for answers. 🔊 repeats any sentence. Text shown in short lines; all is spoken.
- **Levels:**

| Level | Types | Numbers |
|---|---|---|
| 1 | Add To result, Take From result, Put Together total | Total to 10, Stretch to 20 |
| 2 | Add To change, Take From change, Put Together part, Compare by matching ("won't get"), Compare difference (more, then fewer), Compare bigger with "more", smaller with "fewer"; Scoreboard totals and each | Within 15, Stretch to 20 |
| 3 | Add To start, Take From start, Compare with language opposite the operation, three addends, Scoreboard "how many more" | Within 20 |

This is the Progressions' sequence: K types first, all others in Grade 1, with Start Unknown and opposite-language Compare met but
not needed for mastery until Grade 2 [V]. So Level 3 here is deliberately above grade expectations: **his star here may wait for
second grade, and a slow Level 3 is not a failure.** Exact difficulty order within a Level is from the Table 1 family and CGI
summaries [V: CCSS Table 1; S: CGI handouts; book itself not read]; adjust from his data.

- **Templates** (a, b, c with a+b=c; each sentence is one clip or chain; `{}` are number clips):

| id | Story | Answer |
|---|---|---|
| addResult | Torque has {a} bolts. The crew gives it {b} more. How many bolts now? | c |
| takeResult | The bin has {c} bolts. Torque uses {b}. How many are left? | a |
| putTotal | {a} red wheels and {b} blue wheels are on the bench. How many wheels in all? | c |
| addChange | Torque has {a} bolts. It gets some more. Now it has {c}. How many more did it get? | b |
| takeChange | The bin has {c} bolts. Torque uses some. Now {a} are left. How many did it use? | b |
| putPart | {c} wheels are on the bench. {a} are red. The rest are blue. How many are blue? | b |
| match | There are {c} bots and {a} batteries. Each bot gets one. How many bots won't get a battery? | b |
| diffMore | Torque has {c} bolts. Anvil has {a}. How many more does Torque have? | b |
| diffFewer | Torque has {c} bolts. Anvil has {a}. How many fewer does Anvil have? | b |
| bigMore | Anvil has {a} bolts. Torque has {b} more than Anvil. How many does Torque have? | c |
| smallFewer | Torque has {c} bolts. Anvil has {b} fewer. How many does Anvil have? | a |
| addStart | Torque had some bolts. It got {b} more. Now it has {c}. How many did it have at first? | a |
| takeStart | The bin had some bolts. Torque used {b}. Now {a} are left. How many were in it at first? | c |
| bigFewer | Anvil has {a} bolts. Anvil has {b} fewer than Torque. How many does Torque have? | c |
| smallMore | Torque has {c} bolts. Torque has {b} more than Anvil. How many does Anvil have? | a |
| three | The crew finds {a} bolts, then {b}, then {d}. How many in all? | a+b+d |

For compare, say each part in its own sentence at Level 2 ("Torque has more. It has 3 more.") as the Progressions advise [V p.12].
Keep story nouns to 3 or 4 (bolts, wheels, batteries, bots). Within Level 2, use `match` first and `diffMore` and `diffFewer` later.

- **Scoreboard:** a three-row chart with one plain square per item, no pictures in bars [S: Kaminski & Sloutsky 2013]. "How many hits in
  all?", "How many did the drum get?", "How many more did the drum get than the hammer?" These phrases stay in the closed set.
- **Generate:** pick template for Level; pick c, a so a>=1, b>=1, and a≠b mostly; c at most Stretch cap. Balance which operation is
  right 50/50 across a run, tracked per Round, so "add the two numbers" fails half the time.
- **Wrong answers:** the other operation (a+b when the answer is c-a; c-a when the answer is c), the numbers in the story (a, b or c)
  when not the answer, answer±1. On opposite-language types the other-operation answer is the key test: for bigFewer `a-b`. Log it.
- **Taught:** act it out on the tokens. Add To: more arrive. Take From: some leave. Compare: rows line up one to one; unmatched ones
  glow, "These three have no partner." Start Unknown: the action runs backwards. End by writing the equation in the order of the story,
  for example `? + 3 = 9`. No key-word hints, ever [V: IES Rec 5].

### 3.8 Tens and Ones (`tens`)

- **Standards:** 1.NBT.B.2, 1.NBT.B.3.
- **Screen:** rods and cubes on a mat. Wheels for two-digit answers. Tap + on a rod or cube; ten cubes snap into a rod.
- **Level 1, teens.** Double frames or a rod and cubes. "One ten and four ones. What number?" Answer from choices 14, 41, 104. Reverse too:
  "Make fourteen" with one rod and cubes. Spoken "ten and four" alongside "fourteen", to borrow the transparent form [V: Progressions].
- **Level 2, two digits.** 20 to 99: "Make sixty-seven" (6 rods, 7 cubes); "How many tens in 40?"; 4 rods and 12 cubes (regrouped) at top
  Stretch.
- **Level 3, compare.** "Which is more?" 39 and 41; then the sign: tap `<`, `=` or `>` between them. Pairs where the bigger ones digit
  belongs to the smaller number. Also equal pairs.
- **Spoken:** a number shown *and* said for any teen or decade so fourteen and forty are never hear-only (section 4). `{tens} tens and
  {ones} ones.` Sign: `{a} is less than {b}`.
- **Generate:** L1 `n=11..19`; L2 `tens=2..9, ones=0..9`; L3 pairs: half have `tensA<tensB && onesA>onesB`, a sixth equal.
- **Wrong answers:** the swap (14→41, 23→32), written as heard (14→104, 86→806), the sound-alike (14→40, 15→50), digit sum (23→5),
  ±1. L3: answer chosen by ones digit. Skip any swap equal to the target (22).
- **Taught:** rod and cubes count. "One ten. Four ones. Ten and four is fourteen. The one is the ten." L3: rods side by side, "Three tens
  is less than four tens. Tens first." Sign: the wide side turns to the bigger number.

### 3.9 Number Chart (`chart`)

- **Standards:** 1.NBT.A.1, 1.NBT.C.5.
- **Screen:** a 120 chart grouped in tens. The Progressions show columns of ten [V]; rows of ten read better on a wide iPad (est.). Only a window of rows at once on phones.
- **Level 1.** To 50. "Tap thirty-four." "What comes next?" 17, 18, __.
- **Level 2.** Crossing decades: 29, __; 59, __; 99, __. To 120: 100 to 120 especially (they are "especially difficult" to write [V]).
- **Level 3.** One or ten more or less. "Ten more than 34." Jump a row. Cells blank out through Stretch, then a blank chart: mental.
- **Spoken:** `Tap {n}.` / `What comes next?` / `Ten more than {n}.`
- **Generate:** L2 start near decades: `start = 10k - int(1,2)`. L3 `n=int(11,109)`, `op` one of +1, -1, +10, -10, within 1..120.
- **Wrong answers:** 29→"210" (twenty-ten) for next; 20, 40. 109→1009, 190, 19. Ten more: n+1 (moved along, not down), n+100, n+9,
  n+11. Ten less: n-1.
- **Taught:** the column lights; "Same ones. One more ten." Next number: "After twenty-nine comes thirty, a new ten."

Optional, if the family's state wants it: count back (Texas, Virginia) and skip count by 2, 5, 10 (Texas) as added Stretches.

### 3.10 Big Jumps (`jump`)

- **Standards:** 1.NBT.C.4, 1.NBT.C.6.
- **Screen:** rods and cubes, then numerals. Wheels.
- **Level 1, decades.** `40 + 30`, `70 - 20`. "Four tens and three tens." Say tens as tens.
- **Level 2, no carrying.** `24 + 3`, `24 + 30`.
- **Level 3, crossing a ten.** `28 + 5`, `46 + 20`. Ten cubes snap into a rod.
- **Spoken:** `{a} plus {b}.`; Level 1 teaching uses "tens" as the unit: "Four tens and three tens are seven tens."
- **Generate:** L1 tens only, within 10 to 90; L2 `tens` + ones with no carry; L3 ones total above 9.
- **Wrong answers:** 40+30: 7 (dropped the ten), 430 (written as heard), 80. 24+30: 27 (added 3 to ones: place swap), 64, 54 right.
  28+5: 213 (8+5 written after 2), 23, 32, 34.
- **Taught:** rods go with rods, cubes with cubes. "Tens go with tens." At L3: ten cubes snap. This grows out of Facts: "Four and three is
  seven, so four tens and three tens is seven tens."

### 3.11 Measure It (`measure`)

- **Standards:** 1.MD.A.1, 1.MD.A.2. Whole units only. No ruler: rulers are Grade 2.
- **Screen:** an object on a strip and a pile of units (a wrench, a plain bar). Units do not snap: that is what makes gaps possible.
- **Level 1, order.** Three lengths: tap longest, then shortest. Then indirect: a rope matches A; compare it with B.
- **Level 2, lay units.** He drags units along. Done button. Right if end to end, count right. Forgiving: within a set tolerance they
  nudge together, with a voice line on the first big gap.
- **Level 3, what went wrong.** Three pictures of a measure: gaps, overlap, right: "Which one is measured right?" Then units of two
  sizes: "Which takes fewer?" Bigger unit, fewer of them.
- **Spoken:** `How many wrenches long?` / `Which one is measured right?`
- **Generate:** length L = integer 2 to 12 units. Pictures: gap pushes the row short so it reads more than truth; overlap the reverse.
- **Wrong answers:** the count from gap or overlap pictures (L±1,2), counting end marks instead of units (L+1).
- **Taught:** the units slide together; the gap closes; "No gaps. No overlaps. Now count."

### 3.12 Shapes (`shape`)

- **Standards:** 1.G.A.1, 1.G.A.2. Fair shares are in Chop Chop.
- **Screen:** shape tiles.
- **Level 1.** "Tap every triangle." Mix of orientation, size, skinny ones, and near-misses. Uses the Word Hunt's tap-all pattern.
- **Level 2.** Rules: "Three sides, closed." "Which one is not a rectangle?" Colour and size vary so they stop mattering.
- **Level 3.** Fill an armour-plate outline with shapes: two triangles make a square, two squares a rectangle. No rotation gesture: tiles
  auto-rotate on tap.
- **Spoken:** `Tap every {shape}.` / `Which one is not a {shape}?`
- **Generate:** table of shapes with a true/false label for each target name. Targets include rotated, skinny; foils: open three-sided,
  curved side, four-sided.
- **Wrong answers:** by design the foil is tempting: a triangle with a gap; a rotated square called a diamond.
- **Taught:** the corners and sides count as they glow. "One, two, three sides. All joined. Triangle." Colour is not named.

### 3.13 Shared helpers

```ts
/** Number choices. Traps come from real misconceptions; near misses top up. The target's place among the sorted choices is
 *  picked first, so it isn't always in the middle. */
export function numberChoices(rng: Rng, target: number, traps: readonly number[], wrong: number, lo: number, hi: number): number[] {
  const usable = traps.filter(t => t !== target && t >= lo && t <= hi);
  const near = (side: 1 | -1) => [1, 2, 3, 4, 5].map(d => target + side * d).filter(x => x >= lo && x <= hi);
  const below = [...shuffle(rng, usable.filter(t => t < target)), ...near(-1)];
  const above = [...shuffle(rng, usable.filter(t => t > target)), ...near(1)];
  let under = int(rng, 0, wrong);                                   // how many wrong answers sit below the target
  const uniq = (xs: number[]) => [...new Set(xs)];
  if (uniq(below).length < under) under = uniq(below).length;       // near the edge: borrow from the other side
  if (uniq(above).length < wrong - under) under = wrong - uniq(above).length;
  const chosen = [...uniq(below).slice(0, under), ...uniq(above).slice(0, wrong - under)];
  return [...chosen, target].sort((a, b) => a - b);                 // numbers read best in order
}

export type Op = 'add' | 'sub';
/** a + b = c or c - b = a, with `blank` as the hidden slot; `flip` puts the single number on the left. */
export interface Equation { readonly a: number; readonly b: number; readonly c: number; readonly op: Op; readonly blank: 'a' | 'b' | 'c'; readonly flip: boolean }
```

Tested in a throwaway script (300,000 runs, 0 to 20, two wrong answers): no duplicates or out-of-range values, and the target
lands low, middle and high equally. The cost: when all traps sit on one side and the target is placed at that end, near misses
replace the traps. For a kind like Weigh-In L3, where the trap is the point, force at least one trap in. A trap outside what the input can take (213 on the wheels, 22 on the strip) is simply not offered. Each maker returns a question with its `traps` labelled, for example `{ value: 13, trap: 'answerNext' }`, so 6.4 can log which
misconception he picked. `avoidOf` keeps the last target from repeating, as in `mix.ts`.

---

## 4. Saying it: the voice plan

Facts about the repo [V]: all speech is pre-recorded with a typed phrase list, the build fails if a clip is missing, and `say(...)`
already chains clips and joins money amounts from pieces (`say('It costs', { cents: 225 })`). Existing collections run about 16 to
18 KB a clip (Chop Chop 962 clips, 15 MB; Sight Squad 1,731 clips, 30 MB).

Plan (est.):

| Group | Clips | Note |
|---|---|---|
| Numbers 0 to 120, plus 13 to 19 stretched and decades | About 150 | One `{ n }` piece, like `{ cents }` |
| Number names with the ending intonation ("13?") | About 30 | Ends of questions |
| Whole equation clips for facts and over-ten, turnarounds both ways | Up to 460 | a+b<=20 is 231 pairs, and as many subtractions; optional, try chaining first |
| Prompt phrases and teaching lines | About 300 | Closed set, per kind |
| Story fragments | About 60 per noun set, 3 sets | 180 |
| Around the game, Trophies, Mods | 300+ | From siblings |

So **about 900 to 1,400 clips, 15 to 25 MB**, added to the robot assets the prototype brief caps at about 30 MB. Worth a check against
the PWA's budget. Chaining gives flatter sentences; test one equation and one story chained on the iPad before committing.

Voice traps:

- **fourteen vs forty, fifteen vs fifty** sound alike [V: Progressions NBT]. Never make a question depend on hearing the difference. Show
  the numeral with it. Listen to clips of all pairs. Sight Squad moved to Aria because Ava blurs short vowels [V: `make_voice.py`];
  test both.
- **Four and for, two and to, eight and ate** are fine in speech but mind prompts like "for two": reword (est.).
- **"Some"** in stories means an unknown amount: keep it distinct from "sum", which is never said [V: Progressions p.8].
- **Do not speak the answer.** In `Count On` the tap-by-tap count says the answer, and that is the model working at L1; at L3 the count
  stays silent.
- Say numbers slowly. Add a short gap between chained clips in equations.

---

## 5. Unlock order and placement

### 5.1 What needs what

| Kind | Opens | Why |
|---|---|---|
| Make Ten | Start | Foundation |
| Count On | Start | Foundation |
| Bot Stories | Start | Stories give meaning first [V: Progressions, K onward] |
| Facts | Make Ten L2 | Needs five and ten |
| Tens and Ones | Make Ten L2 | Needs ten as a unit |
| Missing Part | Count On L2 | Counting up to a total |
| Number Chart | Count On L2 | Extends counting |
| Measure It | Bot Stories L2 | Spacing; needs count only |
| Shapes | Facts L2 | Spacing and variety (est.) |
| Weigh-In | Missing Part L2 | Needs unknowns; can run earlier as L1 only |
| Over Ten | Make Ten L3 **and** Tens and Ones L2 | The three prerequisites [V] |
| Big Jumps | Tens and Ones L3 **and** Number Chart L2 | Tens as units |

`OPENS_AFTER` currently takes one parent; Over Ten and Big Jumps need two. A small change: `ModeId[]`, opening when all parents reach the
stated Level. `OPENS_AT` is needed too, because the rule today is always Level 2.

Weigh-In is about the one prerequisite I would loosen first. If he has the operational view of = already, later fixing costs more
than early exposure (est.). Rule 2.3 means he sees odd formats well before it opens.

### 5.2 Keeping Rounds balanced

`pickNext` picks uniformly among open kinds. With 12 open and 5 questions, a kind he is working on may not come up in a Round. Change
for this game (est.): pick from the working set (kinds without a star, at most 5, the ones he is furthest behind on in the order above),
and let starred kinds appear about one question per Round as review. This also keeps him close to spaced practice.

### 5.3 Placement

The brief says he may be mid-year; the date on this file is early November, so some of this may be done at school (est.). Levels never go
down in the shared rule [V: GLOSSARY], so too-high placement can't correct itself. Therefore place low and let him climb fast.

**Do not make it a test.** Run it as his first three Rounds, looking like normal Rounds ("Tune-Up"). No failure visible. About 15
questions (est.):

| Anchor | Probes (3 each) | If 3 of 3 clean | Otherwise |
|---|---|---|---|
| Ten partners | 7+?=10, 4+?=10, 2+?=10 | Make Ten starts L2 and opens Facts | L1 |
| Count on | 8+3, 6+4, 5+3 at a box | Count On L2 | L1 |
| Facts within 10 | 3+4, 8-3, 5+3 with strip | Facts L2 | Facts L1 |
| Teens | 14 from 1 ten 4 ones, 12, 17 | Tens and Ones L2, Number Chart open | Stays locked until Make Ten L2 |
| Story | diff at 8 and 5, addChange, putPart | Bot Stories L2 | L1 |

Rules: stop a row after 2 misses; no teaching during a probe beyond the first-miss line; a question that needs a visual still gets its
Meeting. Nothing places him past Level 1 of **Weigh-In** (the misconception is worth checking even in a strong child) or past Level 2 of
**Bot Stories**.

**Fast climb.** For the first 30 pushed questions of a kind, use `{ window: 10, mastery: 8, streak: 6, top: 3 }` (the shared `DEFAULT_RULE`
pace), then `WORD_RULE`. A child who has it clears a Level in 6 questions.

**A parent setting** (hidden, off Home) to start any kind at any Level, since a parent knows what school has done. Levels shouldn't change
in front of him. For the user to decide (8).

If placement puts him at L2 of the core kinds, he skips about a third of those kinds' Levels (est.), which is the point of placing him.

---

## 6. What to avoid

### 6.1 Timing: what the evidence really says

The brief lists timed pressure as something to avoid. The evidence is less tidy than that, so this is the honest version.

**For timing:** The IES 2021 guide recommends "regularly include timed activities", rated **strong**, 27 studies, for students who
struggle, including some grade 1 samples [V]. Limits it sets: 1 to 5 minutes, only once a concept has been taught over many lessons,
never to introduce a concept, part of a multi-component intervention, with an efficient strategy already taught. It explicitly does not
recommend "merely giving students timed worksheets or putting students on a computer-based program without supporting their learning"
[V]. A first-grade classroom study raised addition fluency with brief timed response, combined with rewards, so the two can't be
separated [V: Aspiranti et al. 2011]. Most studies use 5 minutes a day or less [V: Peltier blog on his preprint].

**Against:** Math anxiety is linked to lower achievement from first grade, mostly in higher working memory children [S: Ramirez et al.
2013, n=154, correlational] and such children avoid advanced strategies when anxious [S: Ramirez et al. 2016]. Claims that timed tests
*cause* anxiety come from opinion writing, not trials [S: Boaler, Education Week 2012]. Authors of a short-response-time study suggest
those starting in the frustrational range may do better untimed [V: Aspiranti et al.]. The IES panel itself lists anxiety as an obstacle
and advises fewer visible problems and meet-or-beat formats [V]. Baroody warns against fast timed testing of many facts at once [V].

**My read (est.):** timing is not shown to be harmful in itself, and brief timed practice helps fluency for what has been taught. But the
IES evidence is mostly adult-run, for struggling students, and the game has no adult watching; Grade 1 fluency is only within 10; and
the product's principle is that he comes back and nothing is lost.

**Recommendation:**

- No clock, countdown or speed bonus in any Round.
- Measure response time silently, starting when the prompt finishes, and use it only to tell recall from counting for top Strength
  (a fact reaches Strength 5 only if answered in about 4 seconds, est., tune it). Never show it. The 3-second convention may overstate
  retrieval anyway [S: Illinois study on first graders].
- Quick Look's short show is not a response timer: he has unlimited time to answer.
- **Optional, for the user:** a "Pit Stop" challenge, opened only after the Facts star: 1 minute, facts he already has, meet or beat his own
  count, with no loss and no effect on Levels. Fits the IES limits. Leave out if the family prefers. I would ship without it first.

### 6.2 Mechanics that crowd out the math

- **Reward time.** Keep the fight short, about 30 seconds per Round, and let it replay outside Rounds; Rounds must remain the main activity.
- **Rich pictures on question screens** (section 7).
- **Extra tapping to reach a question.** Play goes straight into a Round.
- **Lives, hearts, losing currency.** "Never a score to lose" [V: PRODUCT.md].
- **Streak pressure** that shames a missed day. Trophies are fine; a broken-streak message is not (est.).
- **Bonus for speed** in any form.
- **Scaffold left on too long.** A path that always shows the hops teaches clicking. Fade by Level.
- **Prompting him to count on fingers or stop.** Fingers are fine for tracking; only staying at direct modelling is a concern [V: Progressions p.8].

### 6.3 Answer-guessing exploits

Guessing and help abuse are the off-task behaviours most tied to poor learning, in high-school tutors [S: Baker et al. 2004]. Children
find regularities fast. The repo's protections: Bolts for first try, help at the second miss, 1.5 seconds wait after a miss.

Odds of random guessing reaching Mastery (computed, est.):

| Choices | 16 of last 20 | 10 in a row | A run of 10 within 100 tries |
|---|---|---|---|
| 2 | 0.59% | 0.098% | 4.4% |
| 3 | 0.0025% | 0.0017% | 0.1% |
| 4 | under 0.0001% | about 0.0001% | |
| Number strip, 0 to 20 | effectively 0 | effectively 0 | |

So 2-choice kinds are the danger, and only for 10-in-a-row, and for currency: a guess on 2 choices earns about half a Bolt each. Hence
Fix It and three cards in Weigh-In.

Specific exploits to close:

1. **Always the middle button.** With wrong answers of ±1 and sorted buttons, the right answer is always in the middle. Chop Chop sorts its
   choices [V: `makeName`]. `numberChoices` picks the target's position first (3.13). This is the top one to get right.
2. **Replay with the same numbers.** A missed question comes back after one other, and it seems a clean replay is credited in full:
   `session.replay` keeps `push`, the Round marks the answer `replay: true`, and nothing that scores it reads that flag, as far as I can see [V:
   `src/learning/round.ts`, `src/chop-chop/mix.ts`, `src/sight-squad/learning.ts`, `src/round/rules.ts`; not confirmed by running it]. For words that is fair enough. For maths he has just
   been shown the answer. Replay should keep the same shape with **new numbers**, and not count toward Mastery.
3. **Teaching gives the answer.** Tapping wrong twice to get help can be faster than thinking. Any helped answer earns nothing and counts against
   Mastery (already the rule).
4. **Add-the-two-numbers.** Stories must mix operations (3.7).
5. **Pick a number from the problem.** Wrong answers include the numbers in the question, and the right answer sometimes equals one (double: 4+4
   story with 4 on screen).
6. **Tap-count the visual.** At L1 this is the method. Fade by Level.
7. **Rapid tap.** A strip tap before the prompt ends is ignored; the question is unanswerable until the clip ends (L3 may allow it, once known).
8. **Parity and size patterns.** Keep wrong answers on both sides and of both parities (`numberChoices` does this by mixing).

### 6.4 Other cautions

- **Log which trap he picks**, per kind: for example `answerNext` on Weigh-In. Two or more of the same trap in recent answers triggers the teaching for
  it; the parent view can show it later. Levels alone won't say why he is stuck.
- **Not more than the standard needs.** No vertical algorithm, carrying notation, or multiplication.
- **Don't over-teach the words.** He needs no "addend", "commutative", "minuend" [V: CCSS 1.OA.B.3 footnote; Progressions].

---

## 7. Tying the math to the robots

**Verdict: yes on the bench, no in the fight.**

### 7.1 What the research says

- **Intrinsic integration** helps: children learned more and played 7 times longer when the maths was the game's core action in Zombie Division, 7 to 11
  year olds [S: Habgood & Ainsworth 2011]. Later work points to attention rather than motivation as the reason [S: Cutting & Iacovides 2022]. Either way,
  the lesson is that maths needs to be what he is looking at.
- **Rich objects can hurt counting and maths.** Children trained on bars filled with pictures counted the pictures instead of reading the axis, and did worse
  later, K to grade 2 [S: Kaminski & Sloutsky 2013]. Perceptually rich objects help when unfamiliar and hinder when familiar, since a beloved object must be
  held as both itself and a number [S: Petersen & McNeil 2013, age 3 to 4]. His own bot's parts are exactly a familiar, rich object.
- **Rewards.** Tangible expected rewards can lower intrinsic interest [S: Deci, Koestner & Ryan 1999, 128 studies, disputed by Cameron & Pierce]. The family's
  games already rest on rewards; I don't think this changes the design, but it is a reason not to pay for every action, and to tie rewards to finishing.
- **Sugar coat.** A fight after maths is an honest extrinsic reward. It teaches nothing, and that's fine as long as nobody pretends otherwise.

### 7.2 What works

- **Bot parts as story nouns, not as counters.** "Torque has 8 bolts" is fine: stories need nouns, and these ones matter to him. On screen the same story shows plain
  tokens. Say bolt, draw the plain counter.
- **Ten frames as parts trays.** Same plain counters; the frame can be named a parts tray. Cost: nothing. Honest: it's a name.
- **Weigh-In.** Real weight classes make a true reason for the scale: a bot must weigh in. The scale is the maths, not decoration. Best tie in the game.
- **Armour plate shapes (Shapes L3).** Fill a plate outline with shapes. Composing is the action.
- **Measure It.** Measuring a bot's arm in wrenches: a good context. Use a plain flat outline, not the 3D bot.
- **Scoreboard.** Real fight data gives a real reason, though the fights are scripted; generate plausible numbers and never claim they are his.
- **Legendary Lock.** Every sibling keeps Legendaries behind a skill lock (Time Lock, Fuel Lock, Password Lock). A **Balance Lock**: tap counters to balance `8 + 5 = ? + 3`
  at his Weigh-In Level. Tested pattern, intrinsic to the reward.
- **Need line.** "You need 7 more Bolts" is already spoken. Showing it on a ten frame is a small free practice, but the glossary makes Bolts deliberately not a counting
  exercise, so it must stay decoration, never a gate.
- **Door Number.** Already teaches tens and ones; keep it.

### 7.3 What doesn't work

- **Maths as attacks in the fight.** Real-time attacks turn a question into time pressure, and since TORQUE wins every time [V: prototype brief], the answer wouldn't matter,
  which he would soon spot. If wrong answers cost damage, it punishes a miss, against "teach rather than mark wrong".
- **Quiz during the fight or to unlock FIRE.** It breaks the reward and the learning.
- **Countable 3D bot parts on question screens.** Attention goes to the bot [S above], and a screen with a big render costs loading time on an iPad (est.).
- **Bolts as counters.** Counting the currency token invites mixing the count with what he owns ("are those mine?"). Use a separate plain counter (est.).
- **Damage numbers or health bars as "number practice".** Decoration; and it would bring in loss.
- **Math Levels tied to bot strength.** A weaker bot for a child who struggles is a score to lose.

Word rules from Sight Squad apply: never "kill", "shoot" or "destroy" [V: GLOSSARY]. For a bot: "knocked out", "stopped", "sent spinning" (est.). The story bank is about the workshop, not
damage, which also keeps it mild.

---

## 8. Open questions for the user

1. Is a parent setting for placement wanted? (5.3)
2. Which state's standards? Adds back counting, skip counting (Texas, Virginia).
3. "Pit Stop" optional timed challenge: yes, no, later? I'd ship without. (6.1)
4. All 12 kinds, or ship the core 8 and add the rest? I'd ship 8, then Number Chart and Big Jumps, then Measure It and Shapes.
5. Replay with new numbers and no Mastery credit: only here, or a shared-engine fix for all games? (6.3)
6. Should the Bolt reuse the shared currency, or does the game want its own name? Bolt suits a workshop; `src/currency/kind.ts` would need nothing new.
7. The voice budget plus the robot assets: is about 50 MB acceptable offline? (4)
8. Time spent in fights vs Rounds: is the 30-second loop per Round the right ratio? Ties to the rendering choice.

## 9. Sources

Read this session [V]:

- Common Core Grade 1: https://www.thecorestandards.org/Math/Content/1/introduction/ ; /1/OA/ ; /1/NBT/ ; /1/MD/ ; /1/G/ ; D.7, D.8, B.3 pages; Table 1 glossary
  https://www.thecorestandards.org/Math/Content/mathematics-glossary/Table-1/
- Progressions, K-5 Counting and Cardinality and OA (draft 5/29/2011):
  https://commoncoretools.files.wordpress.com/2011/05/ccss_progression_cc_oa_k5_2011_05_302.pdf
- Progressions, K-5 NBT (draft 4/7/2011): https://www.isbe.net/Documents/number-base-ten-k-5.pdf . A 2015 draft exists at Achieve the Core [S], not read.
- IES/WWC 2021, Assisting Students Struggling with Mathematics, WWC 2021006: https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf
- IES/WWC 2009, Assisting Students Struggling with Mathematics: RtI: https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/rti_math_pg_042109.pdf
- IES/WWC 2013, Teaching Math to Young Children: https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/early_math_pg_111313.pdf (structure only; it covers preschool to kindergarten)
- Baroody (2006), "Why Children Have Difficulties Mastering the Basic Number Combinations and How to Help Them", Teaching Children Mathematics, August 2006:
  https://core-docs.s3.amazonaws.com/documents/asset/uploaded_file/782145/Why_Children_have_Difficulties_Mastering_the_Basic_Number_Combinations_and_How_to_Help_Them.pdf
- McNeil et al. (2006), Cognition and Instruction 24(3), intro: https://alibali.psych.wisc.edu/wp-content/uploads/sites/371/2018/02/McNeilGrandauKnuthAlibaliStephensHattikudurKrill2006.pdf
- Texas: https://law.cornell.edu/regulations/texas/19-Tex-Admin-Code-SS-111-3
- Fuchs et al. (2010), Exceptional Children 76(2): https://pmc.ncbi.nlm.nih.gov/articles/PMC3144578
- Aspiranti et al. (2011), Behavior Analysis in Practice 4(2): https://pmc.ncbi.nlm.nih.gov/articles/PMC3357097
- Tolar et al. (2012) reporting Hudson: https://pmc.ncbi.nlm.nih.gov/articles/PMC3544082
- Hudson wording, secondary blog: https://textsavvy.substack.com/p/1686 (Hudson 1983, Child Development 54, 84-90, not read)
- Peltier on timed practice: https://coreypeltier.substack.com/p/timed-math-practice

Search snippets only [S]:

- Virginia 2023: https://doe.virginia.gov/home/showpublisheddocument/48916/638296738981730000 (403)
- Singapore: https://radinmaspri.moe.edu.sg/files/Slides%20for%20Parents/2025/Mathematics_P1_2025.pdf ; https://sg.theasianparent.com/primary-1-maths-syllabus
- Math in Focus: https://edreports.org/reports/detail/math-in-focus-2013-1 and teachable index pages
- CGI handouts: https://nctm.confex.com/nctm/2014VA/webprogram/Handout/Session26326/159_Disney_Whats%20the%20Difference.pdf ; Carpenter et al., Children's Mathematics (book, not read)
- Ramirez et al. 2013, J. Cognition and Development 14(2): https://bohrium.dp.tech/paper/arxiv/39283253 ; Ramirez et al. 2016, JECP 141
- Boaler: https://www.edweek.org/teaching-learning/opinion-timed-tests-and-the-development-of-math-anxiety/2012/07
- Response time criterion: https://www.ideals.illinois.edu/items/45535
- Kaminski & Sloutsky 2013: https://www.sciencedaily.com/releases/2013/05/130508092412.htm , JEP 105(2), 351-363
- Petersen & McNeil 2013: https://news.nd.edu/news/childs-counting-comprehension-may-depend-on-objects-counted-study-shows/
- Habgood & Ainsworth 2011: https://shura.shu.ac.uk/3556/ ; Cutting & Iacovides 2022: https://eprints.whiterose.ac.uk/189921
- Deci, Koestner & Ryan 1999: https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf
- Callaghan & Reich 2018: https://news.uci.edu/2018/09/19/most-preschool-math-literacy-apps-not-designed-to-help-children-learn-uci-study-finds
- Hirsh-Pasek et al. 2015: https://www.psychologicalscience.org/publications/educational-apps.html
- Outhwaite et al. 2019: https://eprints.nottingham.ac.uk/55889
- van der Ven et al. 2017: https://datalearner.com/academic/journal-papers/0747-5632/volumes-and-issues/184/paper-detail/36743
- Baker et al. 2004: https://hci.rwth-aachen.de/materials/conferences/CHI2004/1p383.pdf
- Fyfe et al. 2014: https://www.doi.org/10.1007/S10648-014-9249-3 ; Fyfe & Rittle-Johnson 2015: https://news.vanderbilt.edu/files/FyfeRittleJohnson2015_JEP.pdf
- Sherman & Bisanz 2009, JEP 101(1); McNeil et al. 2015; Taylor & Rohrer 2010; Nemeth et al. 2019: https://www.frontiersin.org/articles/10.3389/fpsyg.2019.02296/pdf
- Siegler & Jenkins 1989 via https://tidsskrift.dk/NOMAD/article/download/149188/192067/328277 ; Ramani & Siegler via https://www.sciencedaily.com/releases/2008/03/080325083304.htm
- Clements subitizing: https://ies.ed.gov/ncee/rel/math-young-children/pdf/TMYC_Mod1_Subitizing_Developmental_Progression.pdf ; Clements et al. 1999: https://researchconnect.suny.edu/en/publications/young-childrens-concepts-of-shape/
- Triangle study: https://ejmste.com/article/young-childrens-conceptual-understanding-of-triangle-4480
- Length misconceptions: https://files.eric.ed.gov/fulltext/EJ1093323.pdf
- Balance: https://typeset.io/pdf/young-children-s-ability-to-use-the-balance-strategy-to-23nj127z0a.pdf ; Stephens et al. 2020: https://informahealthcare.com/doi/abs/10.1080/10986065.2020.1793055
- Teen numbers, Peters 1997: https://merga.net.au/wp-content/uploads/DOCS/common/Uploaded%20files/Annual%20Conference%20Proceedings/1997%20Annual%20Conference%20Proceedings/RP_Peters_1997.pdf

Tried and not verified [U]: Baroody, Purpura, Eiland & Reid 2014 results (Cognition and Instruction 32(2)); Riley, Greeno & Heller 1983 percentages; Ho & Fuson 1998 results; Carpenter, Franke & Levi's true/false
work directly; Mann 2004.

## 10. Recommendation

Build the game around ten: open with Make Ten, Count On and Bot Stories, let Facts and Tens and Ones grow from Make Ten, and hold Over Ten until both make-ten prerequisites are real. Ship the core eight kinds in
this order (Make Ten, Count On, Bot Stories, Facts, Tens and Ones, Missing Part, Weigh-In, Over Ten), with Number Chart, Big Jumps, Measure It and Shapes next, and leave time, halves and coins to the sibling games. Use one
plain two-colour counter on one ten frame everywhere, tap answers on a fixed number strip once he is past Level 1, and treat Strength-tracked fact families as strategies, not drill. Mix equation formats and read = as "is the
same as" from day one, and make Weigh-In, whose scale really is a weigh-in, the honest bridge to the bots, with a Balance Lock on Legendaries; keep the fight itself as a clean reward with no maths in it. Keep Rounds free of any
clock while logging response time silently, place low in three unmarked Rounds with a fast early climb since Levels never go down, and before writing generators fix the two repo traps: right answers stuck in the middle of
sorted choices, and replayed misses counting toward Mastery with the same numbers.
