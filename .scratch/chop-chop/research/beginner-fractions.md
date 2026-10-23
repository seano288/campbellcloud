# Teaching fractions to a total beginner (age 6, pre-reading): research note for Chop Chop

Status: research only, no source code changed. Date: 2026-10-23.

Problem (from the parent): "my son doesn't know what 'one quarter' means... even that needs to be taught." Today the
game asks for a named quarter, and for "what is one piece called?", early, and only teaches after misses.

## 1. Findings (with sources)

- **Fair sharing is the entry point, before any words or notation.** Empson and Levi argue that children should solve and
  discuss equal-sharing problems before they meet fraction symbols; textbooks usually do the reverse. A child can reason
  about fair shares with no fraction vocabulary. Source: Heinemann blog, Empson and Levi, https://blog.heinemann.com/empson-levi-cgi-11-09
- **Equal sharing is recommended across the literature.** A literature review cites Wilson, Confrey et al., Empson and Levi,
  Fosnot and Dolk, and Lamon for developing fractions by fair sharing of collections or regions. Source: MH Education
  literature review, https://www.mheducation.com/unitas/school/explore/research/em-review-literature-fractions-strand.pdf
  (Susan Empson's classroom version uses four friends sharing ten oranges, https://www.mathlearningcenter.org/blog/making-sense-fractions-susan-empson-phd)
- **Young children have informal fair-sharing ideas.** Children as young as kindergarten can share intuitively; a
  first-grade candy-bar problem (4 children, 5 bars) was solved by halving without formal instruction. Source: Heinemann
  blog (above). A 2012 NCTM paper notes few studies of preschool and early fair sharing. Source:
  https://nctm.confex.com/nctm/2012RP/webprogram/Paper1345.html
- **US standard for this age.** Common Core 2.G.3: partition circles and rectangles into two, three or four equal shares;
  describe the shares as halves, thirds, fourths; describe the whole as "two halves, three thirds, four fourths"; equal
  shares of identical wholes need not look the same. Source: CDE, https://www2.cde.ca.gov/cacs/id/web/330 ; wording:
  https://www.twinkl.com.au/resources/usa-resources-common-core-math-grade-2-geometry/ (Grade 2 geometry, 2.G.3)
  Implication: a US child meets "fourths" in grade 2, so "quarter" must be learnt as a word he can match to "fourths" later.
- **Order in England (Year 1, ages 5-6).** Halves first, then quarters; a quarter is found "by finding half and then finding
  half again". Notation (1/2, 1/4) is not required in Year 1; recognising and naming come first. Sources: Oxford Owl,
  https://home.oxfordowl.co.uk/maths/primary-fractions/fractions-year-1-age-5-6/ ; Year 1 notes, https://news.urbrainy.com/2023/05/30/year-1-fractions ;
  NCETM KS1 guidance, https://ncetm.org.uk/classroom-resources/primm-30-guidance-on-the-teaching-of-fractions-in-key-stage-1/
  (its list is: name one-half, one-quarter, one-third of a shape or set; then notation; then halves of numbers; then
  thirds and quarters of numbers; then two-quarters = one-half. It gives no rationale for the order.)
- **Concrete first, then word.** Practical activities: cut a sandwich in half, then halves again; split toys into two or four
  equal groups; fold paper "in half"; colour one half or one quarter of a drawn shape; and ask the child to explain why a
  piece is one quarter, not just name it. Try different shapes so the child sees equal parts can take many shapes. Source:
  Oxford Owl (above).
- **Misconceptions to design against.**
  - Bigger denominator means bigger piece (1/8 > 1/2). Common in older students; a play-dough "split into more pieces, each
    smaller" activity helped. Source: https://primarytimery.com/tag/fractions/ and
    https://www.mathnasium.com/blog/common-math-misconceptions-k-8 (general)
  - Equal parts must be the same shape. Source: NCETM/Oxford Owl tips above; Kentucky 2.G.3 resource notes children call parts
    "two's", "three's" (https://education.ky.gov/curriculum/conpro/Math/Documents/2_KDE_Geometry_Partitioning_the_Whole_into_Equal_Shares_Grade_2.pdf)
  - Unequal parts called halves. Not verified in a source we could fetch; the game already tests it (Fair Shares), so keep it.
  - Two quarters is one half: a stated Year 1 target. Source: Oxford Owl / NCETM steps above.
- **Evidence quality.** Most sources are curriculum and practitioner pages, not controlled studies. The original Empson and
  Levi book, Mix/Moore/Holcomb's early-fraction study and Charalambous and Pitta-Pantazi (2007) were not retrieved; claims
  attributed to them here are second-hand. Confrey's specific claims on denominators were not confirmed.

## 2. Recommended teaching progression (total beginner)

Each step: one new idea or word. A word is only asked after it has been shown (its "meet", see section 3).

1. **Fair means equal.** Show one whole pizza cut evenly and one cut unevenly. "Equal pieces are all the same size." Then
   share with friends: "Two friends share a pizza. How many pieces?" No fraction words. (Share It L1, Fair Shares meet.)
2. **Sharing into a count.** N friends, N pieces (Share It L1). Builds the idea that the number of pieces is the number
   of people. Still no fraction word.
3. **Half.** Cut into two equal pieces; one piece is one half; two halves make the whole. Tap or colour "one half"
   (Find L1 and Color L1 with halves only).
4. **Half of a half is a quarter.** Cut one half in half again: four equal pieces, each is a quarter. Say "quarter" only
   after this physical step is shown.
5. **Quarter names.** Tap the quarter among half and quarter choices (Name the Piece, two choices only: half and quarter).
   This is the first time "quarter" is asked, and only after step 4 has been shown. Optional for US: "Quarters are also
   called fourths" said once, as a parenthetical at the quarter meet, never asked.
6. **Bigger piece, half vs quarter.** "More pieces means smaller pieces!" (Bigger Piece L1, with pictures.)
7. **Third**, after quarters are secure: three equal pieces, each is one third. Then Name the Piece adds thirds.
8. **Quarters and halves together.** Two quarters is one half; three quarters (Find, Color, Fuel Lock).
9. **Words for the pile.** Half of a pile of cookies, then a quarter of a pile (Share It L2 and L3).
10. **Eighths and sixths last.** Only after steps 1 to 9.

## 3. Concrete recommendations for Chop Chop (mapped to code)

### What the code does now (read for this note)
- `src/chop-chop/fractions/problems.ts`: `FAIR_DENS` L1 = [2] (good). `NAME_DENS` L1 = [2, 4] and `NAME_CHOICES` L1 = [2, 3, 4]
  (thirds offered before any third is taught). `FIND_TARGETS` L1 = 1/2 and 1/4, `FIND_OTHERS` L1 includes 1/3. `BIGGER_PAIRS` L1
  includes 1/8. `COLOR_TARGETS` L1 includes 1/4 of 4. `makeX` pick only by Level, so a word can be asked before he has met it.
- `src/chop-chop/fractions/teach.ts`: teaching only runs after a miss (`explainX`, via `helpWith` for the 🔎 button). Nothing
  introduces a word before it is asked. `teachFair` already has the right lines (unfair vs fair) but is only used after a miss.
- `src/chop-chop/learning.ts`: `OPENS_AFTER` (Name opens at Fair L2, Bigger at Name L2, Color at Find L2). `introPending` is
  always forced to false in `recordSolved`, so there is no card-style intro to reuse; the questions must teach.
- `src/chop-chop/fractions/views.tsx`: Name the Piece's choices are shown as the words ("one third") and voiced on tap;
  the speech is `cutInto`, "What is one piece called?", then each choice. Find shows `findLine`.
- `src/chop-chop/mix.ts` (`mixedSession`, around line 83): picks each question by calling `makeX(level, rng, avoid)`. This is
  where a meet can be inserted before an unmet word is asked.

### Change 1: a "met" set, and a first-meet before any new word is asked
- `learning.ts`: add `met: FracKey[]` (e.g. "1/2", "1/4", "1/3", "1/6", "1/8", "2/3", "3/4"; plus the piece words "half",
  "quarter", "third"). Add it to `LearningState`, `freshLearning` (empty), and `readLearning` (default empty). Add a pure
  `recordMet(state, key)`. Keep it in the same save as the modes (save key `chop-chop-save`).
- `problems.ts`: give each `makeX` a `met` argument and filter its options to words he has met, so a question never uses a
  word he hasn't met. Concretely:
  - `makeName`: options = `NAME_DENS[level]` filtered by met; choices = met words only. At start, choices are [2, 4]
    once quarter is met; with only half met, the question is skipped or is "Name the piece" with just "half" (see Change 3).
  - `makeFind`: targets and `FIND_OTHERS` filtered by met.
  - `makeColor`, `makeBigger`, `makeFuel`: the same filter on their target/pair lists.
  - `makeFair`: no change (halves, then thirds/quarters, need no words).
- `mix.ts`: in `mixedSession`, before presenting a question whose words aren't all met, call a new `meetWord(p, lesson, voice)`
  in `teach.ts`, then `recordMet`. The meet runs once, the first time, and is not an "explain" (no "Not quite!" toast).
- `teach.ts`: new exports `meetHalf`, `meetQuarter`, `meetThird` (and later `meetEighth` etc.), each a short scripted
  sequence using the `step`/`count` helpers already there. Lines are in Section 4.

### Change 2: first-ask order (what starts open, what is gated)
- `learning.ts` `MODE_IDS` order is fine for Home. Change which kinds are open at the start and which Level 1 contents exist:
  - **Share It** (open, L1): keep. Pure counting, fair sharing; the best first question.
  - **Fair Shares** (open, L1 halves): keep, but run `meetFair` (existing `teachFair` lines) before the first Fair question.
  - **Find the Part** (open at start today): change `FIND_TARGETS[1]` to `['1/2']` only at first. Until quarter is met, the
    distractors are pictures that are not halves: use a "whole" picture (all pieces shaded) and an empty one. This needs one
    new spoken line, "The whole thing!" (Section 4). Quarter is added to targets and distractors after the quarter meet.
  - **Name the Piece** (opens at Fair L2): before quarter is met, asking the name is pointless. Gate Name L1 on "half" met and
    quarter met (choices [2, 4]). Thirds are not offered at L1 at all (`NAME_CHOICES[1]` drops 3; thirds from L2).
  - **Bigger Piece** (opens at Name L2): change `BIGGER_PAIRS[1]` from `['1/2','1/4'], ['1/2','1/8']` to `['1/2','1/4']`
    only; move `1/2 vs 1/8` to L2. Require quarter met.
  - **Color the Part** (opens at Find L2): fine; `COLOR_TARGETS[1]` has only halves and quarters. Require quarter met for 1/4.
  - **Share It L2/L3**: L2 halves only (OK after half meet); L3 quarters and thirds, so require their meets.
- Remove `1/6` and `1/8` from every Level 1 and Level 2 list until steps 9 and 10 (eighths and sixths are last in the progression).
  - Find L2 currently has 1/6 and 1/8; Bigger L2 has 1/6; Color L2 has 1/6 and 1/8. Move these to L3, or gate by met.

### Change 3: a half-only Level 1 for the Name question
- With only "half" met, the Name question cannot yet offer a choice. Use the Color or Find question first, and let Name
  start with [2, 4] once quarter is met. If the parent wants Name earlier, offer [2, 3] only after thirds are met.

### Change 4: teaching after a miss
- Keep `teachX` after misses, but after the first miss of a word he has only just met, say the meet line again (not the full
  teach). Keep the "Try again!" first-miss path. The teach lines below already exist for most steps.

### Change 5: "fourths"
- Do not ask about "fourths" in the game. Optionally say once at the quarter meet: "Quarters are also called fourths." It
  matters for a US child (Common Core 2.G.3, grade 2), so he can match it later at school. Record it if used.

### Change 6: the 🔎 Help button
- `helpWith` already runs the lesson for the current question. Keep it; if the question's word is unmet, it should run the
  meet instead of the lesson.

## 4. New spoken lines (each a separate clip)

Existing lines to reuse (already in `FRACTION_LINES` / `problemPhrases()`): "Equal pieces are all the same size.",
"These pieces are all the same size!", "These pieces are not the same size.", "Two equal pieces are halves." (piecesAre(2)),
"So one piece is one half.", "One half means one of the two equal pieces.", "Four equal pieces are quarters.", "So one
piece is one quarter.", "Three equal pieces are thirds." (piecesAre(3)), "So one piece is one third.", "More pieces means
smaller pieces!", "Let's count the pieces.", "One piece for each friend!", "Two friends share a pizza. How many equal pieces should we cut?"

New lines to record (keep to one idea each; add to `FRACTION_LINES` or the template helpers in `fraction.ts`):

Meet, half (step 3):
1. "Look! This is a pizza." (`Look! This is a ${food}.`, new template, or reuse "Look!" + cutInto)
2. "Cut it into two equal pieces." (new template)
3. "One half of the pizza is one piece!" (new)

Meet, quarter (step 4):
4. "Now we cut one half in half again." (new)
5. "Half of a half is one quarter!" (new, the key sentence)
6. "Quarters are also called fourths." (optional, US only)

Meet, third (step 7):
7. "Now we cut it into three equal pieces." (new)

Find (Change 2):
8. "The whole thing!" (new; the distractor for "one half" before quarter is met)

Other:
9. "Here are two pictures. Which one shows one half?" (optional lead-in, new)

Total new phrases proposed: 9 (6 plus up to 3 optional).

## 5. Open questions

- Whether a meet should be a whole Round (a "lesson" card) or just the first question. This note assumes the latter.
- The exact save key and migration for `met`: check the `chop-chop-save` migration in `learning.ts` before adding the field.
- Whether `mixedSession` (mix.ts) is the right insertion point for the meet, and whether `round.ts` renders the lesson before
  the question. Not read in full for this note.
- Verification of the cited primary studies (Empson and Levi 2011; Mix, Moore and Holcomb; Charalambous and Pitta-Pantazi 2007).
