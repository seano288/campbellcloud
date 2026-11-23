# Second-grade groups, rows and odd and even: what Skyline should ask

Status: research note (2026-11-23), written before the kinds were fixed, in the manner of
`.scratch/math-bots/research/first-grade-math.md`. The decisions it led to are in `../spec.md`.

Legend (as in the Math Bots note): **[S]** search snippet or secondary summary, page not opened. **[M]** from memory, not
checked this session. **(est.)** my own judgement. No page was opened in full this session ([V] is not used).

## 0. The short version

- Second grade lays the ground for multiplying in four standards: equal groups and arrays as **repeated adding**
  (2.OA.C.4), **odd and even** by pairing (2.OA.C.3), **rows and columns** of a rectangle (2.G.A.2) and **skip counting to
  1,000** (2.NBT.A.2). Texas says the same thing more directly: join equal sets (multiplying) and separate a set into equal
  sets (sharing) with objects (TEKS 2.6A, 2.6B).
- Multiplying itself (×, "5 groups of 7", 3.OA.A.1), sharing as division (3.OA.A.2) and the facts (3.OA.C.7) are **third
  grade**. Skyline reaches them only in its last kind, Times, and only after the pictures.
- The order that the standards and the brief agree on: **see groups → count them by adding → rows and columns → the × sign
  as a short way to write it**. That is the order the kinds open in.
- Two choices follow from the research and differ from a naive build: arrays never go past 5 by 5 at the first Level
  (2.OA.C.4's limit), and odd and even stays within 20 (CCSS) although Texas goes to 40.

## 1. The standards

| Code | What it asks (paraphrased) | Source | Skyline |
|---|---|---|---|
| 2.OA.C.3 | Is a group of up to 20 odd or even, by pairing or counting by 2s; write an even number as a sum of two equal addends | [S] CDE, CPALMS | Odd or Even |
| 2.OA.C.4 | Find the total in a rectangular array of up to 5 rows and 5 columns by adding; write it as a sum of equal addends | [S] Smithsonian Learning Lab | Windows |
| 2.G.A.2 | Partition a rectangle into rows and columns of same-size squares and count them | [M] | Windows (the building face *is* the partitioned rectangle) |
| 2.NBT.A.2 | Count within 1000; skip-count by 5s, 10s and 100s | [S] WA OSPI grade 2 standards | Count By |
| 3.OA.A.1 | Interpret 5 × 7 as the total in 5 groups of 7 | [M] | Times |
| 3.OA.A.2 | Interpret 56 ÷ 8 as the size of each share, or the number of shares | [M] | Share It (no ÷ sign) |
| 3.OA.A.3 | Word problems with equal groups and arrays, multiply and divide within 100 | [M] | Equal Groups L3, Share It L3 (kept within 50) |
| TEKS 2.6A | Model and describe multiplication situations in which equivalent sets of objects are joined | [S] Teach Starter, Shmoop | Equal Groups |
| TEKS 2.6B | Model and describe division situations in which a set of objects is separated into equivalent sets | [S] Teach Starter, Shmoop | Share It |
| TEKS 2.7A (older text) | Even or odd up to 40, by pairing objects | [S] one snippet; may be the pre-2012 wording | Odd or Even stays within 20 (est.) |

## 2. What Math Bots already teaches (read in `src/math-bots/numbers/problems.ts`)

Skip Count counts by 10s (Level 1), 5s (Level 2) and 2s (Level 3), never past 120 (`SKIP_TOP`), with an offset start (3, 13,
23) only at Level 1 Stretch 2, a missing number in the middle at Stretch 1+, and "how many in 6 jumps of 5" as a groups form.
So Count By starts past it: hundreds to 1,000, tens from any number past 100, fives past 100, then threes and fours (not in
the grade 2 standard; they are the first step toward the 3 and 4 facts in Times).

## 3. Hard parts and misconceptions (what wrong answers should be)

- **Adding the two numbers** instead of counting groups: "3 buses, 5 on each" answered 8 [M, widely reported in teacher
  guides]. Every total question offers it.
- **One group too many or too few**: counting on one jump too far, or stopping a jump short (est.; it is what a child who
  skip counts on his fingers does). Offered as `total ± group`.
- **The count of groups given for the total** (answering "3" to "3 buses of 5, how many people?") [M].
- **Rows and columns mixed up**: a row is the line that goes across. Children who say "rows" for the up-and-down lines are
  common [M]. Skyline always shows rows across, and asks rows before columns ("How many in each row?" rather than the word
  *columns* at Level 1).
- **Odd numbers "can't be split"**: Illustrative Mathematics warns not to suggest odd numbers can't be two addends at all,
  only not two *equal* ones [S]. Skyline says "two equal halves" and never "can't be split".
- **Zero**: whether 0 is even confuses second graders and is not asked for (the brief's rule).
- **The turn-around** (3 × 4 = 4 × 3) is a third-grade property. Shown by tipping the building on its side.

## 4. What is known about teaching it (short)

- Arrays are the bridge from repeated adding to multiplying; drawing the rows one at a time while counting on by the row
  size ("4, 8, 12") is the standard model [M].
- Pairing objects to show odd and even (one left alone means odd) is the method both CCSS and TEKS name [S].
- Sharing by dealing one at a time ("one for you, one for you") is how children first share fairly; the "how many groups"
  form (quotative division) is harder than "how many in each" (partitive) [M]. So Share It asks "how many trucks" last.

## 5. Decisions this note leads to (for the spec)

1. Six kinds as the brief lists, opened in the brief's order. Windows Level 1 stays within 5 by 5.
2. Totals at most 50, no group or row over 10 (the brief's rule; the standards stop at 5 by 5 and 20, so Level 2 and 3 are
   already stretching into third grade).
3. Odd or Even within 20, never 0.
4. The × sign is met in a short Meeting before it is asked and said "rows of" or "groups of"; the word "times" waits for
   Times Level 2.
5. Wrong choices come from section 3.

## Sources

- [CDE: 2.OA.3](https://www2.cde.ca.gov/cacs/id/web/305) [S]
- [CPALMS: odd or even up to 20](https://cpalms.org/PreviewStandard/Export/5331) [S]
- [Smithsonian Learning Lab: 2.OA.C.3–4](https://learninglab.si.edu/standards/view/49) [S]
- [Illustrative Mathematics grade 2 unit](https://cms-assets.illustrativemathematics.org/gu4z470y88ph0yojl0l8gale4dzl) [S]
- [WA OSPI grade 2 math standards](https://ospi.k12.wa.us/sites/default/files/2022-12/mathstandards_grade2.pdf) [S]
- [Teach Starter: TEKS Math 2.6(A)](https://www.teachstarter.com/au/teks/math-2-6a) [S]
- [Shmoop: TEKS 111.4.b.6.A](https://shmoop.com/teks/math/elementary/2nd-grade/TEKS-111-4-b-6/TEKS-111-4-b-6-A) [S]
- [Teach Starter: TEKS 2.7](https://www.teachstarter.com/us/teks/math-2-7/) [S]
