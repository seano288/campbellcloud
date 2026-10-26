# Teaching sight words: research and design notes for a voice-led tablet game

Status: research draft (2026-10-26). Written for the sight-word game (working title only). Claims are tagged
`[src]` with a URL in section 8, or `(est.)` for my own judgement. Where a source could not be read (403, binary PDF),
that is said, and the claim is marked as unverified.

Audience for the game: one boy, about 6, an early reader. He reads numbers and some short words, and leans on the
recorded voice. Every instruction is a pre-recorded clip, so the spoken phrase set is finite and known at build time.

---

## 1. What the science says

### 1.1 Sight words vs. sight vocabulary

- A **sight word** is a word read instantly, without sounding it out. Reading Rockets defines it this way and notes that
  any word can become a sight word, including high-frequency words `[src: readingrockets sight-words page]`.
- A **sight vocabulary** is the wider set of words a reader recognises automatically. For a child this set is built
  mostly from words they have decoded many times, not from words they have memorised as shapes `(est.)`.
- The goal of a sight-word game is therefore not "memorise these 100 shapes". It is "make these 100 words instant
  because the child has connected their letters to their sounds" `(est.)`.

### 1.2 Orthographic mapping (Ehri)

- Linnea Ehri's theory: a word becomes a sight word when the reader forms **orthographic mapping**, which binds the
  word's spelling, its pronunciation and its meaning in memory `[src: Reading Rockets OM research summary]`.
- Mapping needs **phonemic awareness** (hearing the sounds in a word) and **grapheme-phoneme knowledge** (knowing which
  letters make which sounds). Without them, the child has nothing to bind the spelling to `[src: Reading Rockets OM
  research summary]`.
- Ehri describes phases the connection moves through: visual (nonalphabetic), partial alphabetic (first and last letters
  matter), full alphabetic (every sound-letter pair is used), then consolidated units `[src: Reading Rockets OM research
  summary]`. This matters for the game: a child in the partial-alphabetic phase will confuse words that share first and
  last letters, which is exactly the distractor problem in section 3.
- Ehri's 2014 review in *Scientific Studies of Reading* is the primary paper behind this. I did not read it directly
  (the Reading Rockets pages were the readable sources). Treat the phase names as Ehri's terms, verified only through
  the Reading Rockets summary `(est.)`.

### 1.3 Why pure rote memorisation or shape flashcards are weak

- A flashcard drill teaches the **whole shape** of "said" as a picture. The child can then match it, but has no way to
  read a new word built from the same letters, and no way to spell it `(est.)`.
- Shape memory breaks on the things the child will meet in real books: a capital letter at the start of a sentence
  ("The" and "the"), a different font, a handwritten word, or a longer word that contains the same letters `(est.)`.
- UFLI's position is that irregular words should not be taught as pure sight memorisation. Instruction should promote
  orthographic mapping, so the child connects letters to sounds even for unusual ones `[src: UFLI heart words mirror]`.
- Really Great Reading makes the same point: even "tricky" heart words are read by decoding the parts that are regular,
  and only the irregular part needs special attention `[src: RGR Heart Word Magic page]`.

### 1.4 The "heart word" approach

- **Heart words** (UFLI, Really Great Reading) are high-frequency words with one or more letters that break a common
  pattern. Words like *said*, *the*, *was*, *where* are common and partly irregular `[src: UFLI heart words mirror; RGR
  Heart Word Magic]`.
- The method: the child decodes the regular parts and learns only the irregular part "by heart". In *said* the `ai` is
  the tricky part (it says /e/), and the rest is regular `[src: UFLI heart words mirror]`.
- Classroom routine described by UFLI: cover the irregular letters, say the word, then point out the irregular part
  together and note its unexpected sound `[src: UFLI heart words mirror]`.
- RGR's routine: highlight or mark the tricky letter(s), place a heart above the irregular part, and read the word with
  the tricky part called out (e.g. in *is*, the `s` says /z/, a heart goes over the `s`) `[src: RGR Heart Word Magic;
  RGR lesson sample]`.
- The heart is a visual cue for the tricky letter only. It is not a letter, and it should never be a red X.

What that means for the game:

- Every word in the list gets a **heart part** (section 2 table). Words marked "regular" are decodable for a beginner
  with the patterns he already knows. Words marked "heart" need one irregular letter or team taught explicitly.
- Teaching a heart word = say the word, show the word, show the heart over the irregular letter, say its unusual sound
  in a clip, then ask for the whole word. The regular letters are sounded out with highlighting first.
- A regular word can be taught by sounding it out letter by letter (highlight, then blend). Spending a heart on a
  regular word wastes the heart.

### 1.5 How many new words at once, and how many exposures

- **New words per session.** No firm study number. Practical view `(est.)`: 3 new words per session, never more than 5
  in one sitting, and no new word until the last one is known. The fraction game does the same with one new word at a
  time, with 8 questions right in a row before the next (chop-chop spec), so the design is consistent.
- **Exposures.** UFLI's material (via the mirror) says many readers commit an irregular word after 1 to 4 exposures, and
  a struggling reader may need 20 or more `[src: UFLI heart words mirror]`. I could not find a Reading Rockets number to
  check this against, so treat these as a rough range, not a rule `(est.)`.
- **Spaced retrieval.** The one study I could read (Haebig et al., 2021) compared spaced and immediate retrieval for
  novel word *meanings and labels* in 20 typically developing preschoolers. Equal exposures, spaced prompts, recall at
  5 minutes and 1 week. Spaced retrieval gave better recall (labels about 3.05 vs 1.50 points at 5 minutes; 2.90 vs 1.40
  at 1 week; meaning gains of about 0.65 to 0.75 points) `[src: Haebig et al. 2021]`. Caveats: small sample, nouns only,
  preschool, not sight words. It supports the design direction, not the exact intervals `(est.)`.
- **Interleaving.** Mixing kinds of question in one Round (as the sibling games do) is consistent with the spacing
  evidence. I did not find a direct sight-word study on interleaving `(est.)`.

### 1.6 What this means for a voice-led tablet game

- The game is a **retrieval** game, not a **presentation** game. Each question makes him produce or choose a word from
  memory, then the game speaks the answer. That is what spaced retrieval favours `[src: Haebig et al. 2021]` `(est.)`.
- The **spoken phrase set** must include, at minimum:
  - each word alone, as a clip (about 115 clips);
  - a carrier sentence per word, used in questions ("Tap *said*", "Find *said* in the sentence") (about 1 to 2 per word);
  - the letter names and sounds needed for heart and sounding-out teaching (about 26 letters plus the team sounds used:
    ai, ee, ea, ow, oo, ou, ar, or, er, ir, ur, ue, ay, oi, sh, th, ch, wh, ng, ck, ll, ss, ff, zz) (est. 60 clips);
  - the heart-part sound clips ("the ai says eh") and a feedback set of about 40 to 60 phrases (est.).
  - Rough total: 350 to 450 clips (est.). Recording cost is fine for this; the design should still keep the phrase set
    closed.
- Voice-only instructions must not depend on reading. Every instruction, including "Tap the word that says...", is a
  clip. The on-screen word is shown while the clip plays.

---

## 2. The word list

### 2.1 Source lists

- **Dolch Pre-primer (40)**, **Primer (52)**, **First grade (41)**, **Second grade (46)**, **Third grade (41)**, **Nouns
  (95)**. Lists read from two consistent sources (the pre-primer and primer lists agree in both) `[src: Dolch readabilit
  page; Rhoda Design Studio page]`. The Wharton list in an earlier search gave a different pre-primer set and is not used
  here `(est.)`.
- **Fry first 100.** Read from the Bookroo tool page, which lists them in frequency order `[src: Bookroo Fry tool]`.
  The Bismarck PDF of Fry's list could not be read (binary), so the Bookroo order is unverified against Fry's own sheet.
  Check before publishing `(est.)`.

Dolch Pre-primer (40):
a, and, away, big, blue, can, come, down, find, for, funny, go, help, here, I, in, is, it, jump, little, look, make, me,
my, not, one, play, red, run, said, see, the, three, to, two, up, we, where, yellow, you.

Dolch Primer (52):
all, am, are, at, ate, be, black, brown, but, came, did, do, eat, four, get, good, have, he, into, like, must, new, no,
now, on, our, out, please, pretty, ran, ride, saw, say, she, so, soon, that, there, they, this, too, under, want, was,
well, went, what, white, who, will, with, yes.

First 100 Fry words, frequency order `[src: Bookroo Fry tool]`:
1 the, 2 of, 3 and, 4 a, 5 to, 6 in, 7 is, 8 you, 9 that, 10 it, 11 he, 12 was, 13 for, 14 on, 15 are, 16 as, 17 with,
18 his, 19 they, 20 I, 21 at, 22 be, 23 this, 24 or, 25 one, 26 had, 27 by, 28 words, 29 but, 30 not, 31 what, 32 all,
33 were, 34 we, 35 when, 36 your, 37 can, 38 said, 39 there, 40 use, 41 an, 42 each, 43 which, 44 she, 45 do, 46 how,
47 will, 48 up, 49 other, 50 about, 51 out, 52 many, 53 then, 54 them, 55 these, 56 so, 57 some, 58 her, 59 would, 60 make,
61 like, 62 him, 63 into, 64 time, 65 has, 66 look, 67 two, 68 more, 69 write, 70 number, 71 no, 72 way, 73 could,
74 people, 75 my, 76 than, 77 first, 78 water, 79 been, 80 called, 81 who, 82 oil, 83 sit, 84 now, 85 find, 86 long,
87 down, 88 day, 89 did, 90 get, 91 come, 92 made, 93 have, 94 from, 95 their, 96 if, 97 go, 98 see, 99 may, 100 part.

Note: Fry's list includes "words" at 28 and "I" at 20 in the Bookroo copy; a few entries (e.g. "called", "oil",
"sit") may differ from Fry's printed sheet `(est.)`.

### 2.2 Heart-part key

- **R** = regular for a beginner, decodable with patterns taught early (CVC, blends, digraphs sh/ch/th/wh/ck/ng, silent
  e, common teams such as ee, ai/ay, oa, ow, oo).
- **H** = heart word: one letter or team breaks the pattern. The heart part is named (letters, then the sound it makes
  here). Exceptions for heart words are taken from the UFLI heart-word mirror where it gives them; otherwise I marked
  them from the standard irregularity `(est.)`.
- Note: the UFLI mirror's heart labels are partial (it gives the irregular part for about 17 words). I used them where
  given and my own judgement for the rest, marked `(est.)` in the notes column.

### 2.3 The sequence (23 sets of 5 = 115 words)

Ordered by frequency and by Dolch level, not by spelling. Within a set, no two words share first letter, a rhyme, or
a one-letter difference. Near-confusables are kept in different sets. Sets 1 to 9 are the first ones he meets.

| Set | Words | Type | Heart part (letters: sound here) |
|---|---|---|---|
| 1 | a, I, go, up, see | a: H; I: H; go: H; up: R; see: R | a: /uh/ (unstressed); I: /ī/ (single letter); go: o says /ō/ at end with no e (est.) |
| 2 | and, you, my, down, can | and R; you H; my H; down R; can R | you: ou says /oo/, y says /oo/; my: y says /ī/ at end |
| 3 | it, to, we, look, make | it R; to H; we R; look H; make R | to: o says /oo/; look: oo says /ŏŏ/ as in book |
| 4 | the, said, like, come, one | the H; said H; like R; come H; one H | the: e says /uh/; said: ai says /e/ (UFLI); come: o says /uh/; one: o says /wŭn/ |
| 5 | he, pretty, two, play, run | he R; pretty H; two H; play R; run R | pretty: e says /ĭ/, y says /ē/ (est.); two: tw says /t/, o says /oo/ (est.) |
| 6 | here, have, help, not, big | here R; have H; help R; not R; big R | have: final e is silent after v (est.) |
| 7 | where, blue, jump, little, red | where H; blue H; rest R | where: ere says /air/, re is irregular (UFLI); blue: ue says /oo/ (est.) |
| 8 | yellow, three, find, away, funny | yellow R; three R; find R; away H; funny H | away: a says /uh/; funny: final y says /ē/ (est.) |
| 9 | all, at, do, are, get | all H; at R; do H; are H; get R | all: a says /aw/ before ll (est.); do: o says /oo/ (est.); are: ar says /ar/ with silent e (est.) |
| 10 | black, brown, but, good, day | black R; brown R; but R; good H; day R | good: oo says /ŏŏ/ (book sound) (est.) |
| 11 | eat, four, now, no, out | eat H; four H; now R; no H; out R | eat: ea says /ē/ (est.); four: our says /or/ (est.); no: o says /ō/ at end (est.) |
| 12 | is, in, into, ride, ran | is H; in R; into H; ride R; ran R | is: s says /z/ (UFLI); into: final o says /oo/ (est.) |
| 13 | this, too, went, want, well | this R; too R; went R; want H; well R | want: a says /ŏ/ after w (est.) |
| 14 | that, him, her, from, has | that R; him R; her H; from H; has H | her: er says /ur/ (est.); from: o says /ŭ/ (est.); has: s says /z/ (est.) |
| 15 | they, will, with, who, what | they H; will R; with R; who H; what H | they: ey says /ā/ (est.); who: o says /oo/ after w (est.); what: a says /ŏ/ after wh (UFLI) |
| 16 | was, be, know, she, our | was H; be R; know H; she R; our H | was: a says /ŏ/ after w, s says /z/ (UFLI); know: silent k (est.); our: ou says /ow/ (est.) |
| 17 | saw, so, very, must, please | saw H; so H; very H; must R; please H | saw: aw says /aw/ (est.); so: final o says /ō/ (est.); very: y says /ē/ (est.); please: ea says /ē/ (est.) |
| 18 | on, of, by, about, how | on R; of H; by H; about H; how R | of: f says /v/ (UFLI), o says /uh/ (est.); by: y says /ī/ (est.); about: ou says /ow/, a says /uh/ (est.) |
| 19 | for, could, would, your, their | for H; could H; would H; your H; their H | for: or says /or/ (est.); could: ou says /ŭ/ (UFLI); would: ou says /oo/, l silent (est.); your: our says /or/ (est.); their: ei says /air/ (est.) |
| 20 | then, came, time, long, first | then R; came R; time R; long R; first H | first: ir says /ur/ (est.) |
| 21 | many, other, write, water, word | many H; other H; write H; water H; word H | many: a says /ĕ/ (UFLI); other: o says /ŭ/, th, er (est.); write: w silent (est.); water: er says /ur/ (est.); word: w silent, or says /ur/ (est.) |
| 22 | people, number, way, been, called | people H; number H; way R; been H; called R | people: eo says /ee/ (est.); number: er says /er/ (est.); been: ee says /i/ (est.) |
| 23 | oil, sit, did, made, part | oil R; sit R; did R; made R; part H | part: ar says /ar/ (est.) |

Words not yet placed (sets 24 onward): had, his, were, if, may, more, than, each, which, use, over, am, ate, white,
yes, new, soon, under, there, ask. Add as sets 24 to 27 once sets 1 to 23 are firm, with the same confusable checks
`(est.)`. Note "there" must sit away from "they" (set 15) and "then" (set 20).

### 2.4 Confusable pairs kept apart

| Pair | Where they sit |
|---|---|
| was / saw | sets 16 and 17 |
| on / no | sets 18 and 11 |
| the / then | sets 4 and 20 |
| of / for | sets 18 and 19 |
| there / they | (there not yet placed; they in set 15) |
| here / where | sets 6 and 7 |
| to / too / two | sets 3, 13, 5 |
| for / four | sets 19 and 11 |
| run / ran | sets 5 and 12 (one letter apart; watch this pair) |
| come / came | sets 4 and 20 |
| eat / ate | sets 11 and 9 (ate not placed yet; eat is in 11) |
| will / well | sets 15 and 13 |
| he / she | sets 5 and 16 (she is held back to set 16 so it is not with he) |

Known weak spots: "what / with / who" share a shape (set 15). Consider moving "who" to set 16 if he confuses them.
"run / ran" is the closest pair left; the game should show both together only after both are known.

---

## 3. Question types

Six kinds, as in the sibling games (each with Levels 1 to 3, one Round of 5 mixing the open kinds). Each kind is
designed for a child who cannot yet read a sentence, so the voice carries the instruction and the screen carries the
word.

Design rules for all kinds:

- Big tap targets: at least 1/5 of the screen width for each choice on iPad, and 1/3 on iPhone, with a gap of at least
  one target-width between targets (est.).
- The instruction is always a clip. A word the child has to read is also shown in the same big type on screen while
  the clip plays `(est.)`.
- A word is only ever asked about after it has been met (section 5).
- The spoken phrase set for each kind is closed (section 1.6).

### Kind A: Hear it, tap it (word recognition)

- **Prompt.** Clip: "Tap *said*." Three or four written words on screen. Child taps the one that matches.
- **Skill.** Matching a spoken word to its written form. The first step of mapping: the child must hear the word and
  find the letters `(est.)`.
- **Why it works.** Easy to understand without reading. Uses the voice, which he trusts.
- **Why it may not.** The child can pick by guessing from the first letter or from the shape if the distractors are
  easy. This is a guessing risk (section 7).
- **Levels.**
  - L1: 2 choices, distractors with a different first letter and a different length (e.g. *said* vs *big*).
  - L2: 3 choices, distractors with the same first letter (e.g. *said* vs *saw*, *sit*).
  - L3: 4 choices, distractors visually confusable (e.g. *was* vs *saw*; *then* vs *the*; *run* vs *ran*).
- **Opens.** From the start (set 1).

### Kind B: See it, pick what it says (reverse, read aloud)

- **Prompt.** One large written word on screen. Three buttons, each with a word. The game speaks each word when the
  child taps (or on hover, for iPad, tap-and-hold to hear). Child picks the one that is the same as the big word.
- **Skill.** Reading a written word and matching it to a word it knows the sound of. Stronger on mapping, because the
  child has to read the big word, not just recognise it.
- **Why it works.** The voice speaks each choice, so the child can use sound to check, not only the shape.
- **Why it may not.** If the child only uses the first sound of the big word, he will guess among the choices that
  start with that sound. Needs distractors that differ in the middle and end (est.).
- **Levels.**
  - L1: 2 choices, very different (*up* vs *said*); the game plays each choice aloud after the tap, and says the big
    word first.
  - L2: 3 choices, same first letter (*the*, *then*, *they*).
  - L3: 3 choices, same length and shape (*was*, *saw*, *sat*) with no spoken hint until after a tap.
- **Opens.** After Kind A L1 is steady (about 8 right on the first try).

### Kind C: Build it from letter tiles (spelling and mapping)

- **Prompt.** Clip: "Make *said*." Letter tiles in a row under an empty word frame. Child taps tiles in order. A tap on
  a tile says its letter sound. The word is spoken when complete.
- **Skill.** Full mapping: the child must connect each sound to a letter. This is the activity closest to Ehri's
  mechanism `[src: Reading Rockets OM research summary]`. It is also the best place for the heart part: the heart letters
  are shown with a heart.
- **Why it works.** The only kind that makes him produce the spelling. For regular words it is pure decoding. For heart
  words it teaches the irregular letter directly.
- **Why it may not.** Hard for a child who cannot sound out letters yet. Needs letter sounds on the tile tap.
- **Levels.**
  - L1: regular words only (set 1 onward, R words), with the letters in a shuffled row of only the needed letters
    plus 2 spare tiles.
  - L2: heart words with the heart letter shown and its sound spoken before the tiles appear.
  - L3: heart words with no hint, and all tiles of the alphabet to choose from, including distractor letters.
- **Opens.** After 3 words are met (set 1 and first half of set 2). Heart-word level opens after first heart word in
  set 1 (*the* / *said*).

### Kind D: Find the word in a short sentence (word inside a sentence)

- **Prompt.** A short sentence is spoken and shown on screen, one or two words big. Clip: "Tap the word *up*." Child
  taps the word in the sentence. Sentences use only words the child knows, plus the target.
- **Skill.** Locating a known word in running text. Builds the step from single word to reading.
- **Why it works.** Sentences give context and let the child hear the word in a phrase, which matters for heart words.
- **Why it may not.** The child may guess from the surrounding picture if there is one. Use no picture in L2 and L3.
- **Levels.**
  - L1: 3 to 4 words in the sentence, the target is a regular word, and every other word is one he already knows.
  - L2: 4 to 5 words in the sentence, with the target a heart word, sentence spoken first.
  - L3: 5 to 6 words, the target appears twice in the sentence, child must tap the one the clip names (first, second).
- **Opens.** When Kind A L2 is steady (set 2 known).

### Kind E: Fill the missing word (cloze, read aloud)

- **Prompt.** A 3 to 5 word sentence is read aloud, one word is a blank. Clip: "Tap the word that goes here: I see a
  ___." Choices: 2 to 3 words. Child taps the one that makes sense.
- **Skill.** Using meaning and sentence context with a known word. More difficult than Kind A, because the child must
  check the choice in the sentence.
- **Why it works.** Connects the words to meaning and to the sound of the whole sentence, which Ehri's vocabulary
  finding supports (seeing a spelling next to a meaning helps) `[src: Reading Rockets OM research summary]`.
- **Why it may not.** Depends on the child understanding the sentence. Keep sentences very literal, with pictures
  allowed at L1 only.
- **Levels.**
  - L1: 2 choices, very different (*I see a ___* with *dog* and *the*? use words he knows); picture shown.
  - L2: 3 choices, no picture, sentence read aloud twice.
  - L3: 3 choices with same first letter, sentence read once, child must read the choices himself (no spoken choices).
- **Opens.** After 15 words are met. Starts with a sentence whose choices are all known words.

### Kind F: Word hunt (tap all copies in a grid)

- **Prompt.** Clip: "Tap all the *said* words!" A grid (about 4 by 4 or 5 by 4) with many words, some of them the target.
  Child taps each target. Taps that are wrong are taught (section 4), not marked red.
- **Skill.** Visual discrimination and recognition in a dense field; practises the shape and letters together. Builds
  speed without a timer.
- **Why it works.** Fun, and a good test for near-confusables in one screen.
- **Why it may not.** The child can match shapes without reading. Good for recognition, weak for mapping. Use it after
  the child can already read the word (Kind A L2 steady), not as the first way in.
- **Levels.**
  - L1: 3 by 3 grid, 3 targets, the other words are very different.
  - L2: 4 by 4 grid, 4 targets, distractors include words of the same length.
  - L3: 5 by 4 grid, the grid mixes lowercase with a capitalised target ("Said" at the start of a sentence), distractors
    include confusables (*was*, *saw*).
- **Opens.** After Kind A L2 and set 3 started.

### Kind G (optional): Flash it (speed recognition)

- Shown for a short time (for example 1 second at L1, 0.5 seconds at L3), then three words appear and the child picks
  the one that was flashed.
- Not in the first six. It is a timed kind and fits badly with an untimed design. Keep it only if the other six are
  working `(est.)`.

### Summary: which kinds open when

| Kind | Opens | Notes |
|---|---|---|
| A: Hear it, tap it | start | Set 1 onward |
| B: See it, pick what it says | after A L1 steady | voice reads each choice |
| C: Build it from tiles | after 3 words met | the only kind that asks for spelling |
| D: Find it in a sentence | after A L2 steady (set 2) | sentences use only known words |
| E: Fill the blank | after 15 words met | sentence read aloud |
| F: Word hunt | after A L2 steady and set 3 started | recognition in a grid |

Round mix: each Round of 5 draws from every open kind, never the same kind twice in a row, with about one question in
three from an easier Level (the chop-chop pattern) `(est.)`.

---

## 4. Teaching a miss (no red X)

A wrong answer is shown, not marked. The same routine works for every kind. Keep the spoken line short.

1. **Say the right answer, once, slowly.** Clip: "Not that one. This one says *said*." The right word is highlighted,
   the wrong one dims.
2. **Compare the two words.** Both are shown side by side, with the first differing letter(s) in colour. Clip: "*was*
   has an *a*. *saw* has an *a* in the middle, a *w* at the end."
3. **Sound it out, letter by letter.** Each letter lights as its sound is spoken: "/s/ ... /ai/ ... /d/." For a regular
   word the blend is spoken: "/s/ /a/ /t/ ... *sat*." For a heart word, go to step 4.
4. **Show the heart.** The heart goes over the irregular letters, and the unusual sound is spoken: "The *ai* says /eh/.
   It's a tricky one. *said*." UFLI and RGR both describe marking the irregular part this way `[src: UFLI heart words
   mirror; RGR Heart Word Magic]`.
5. **Use the word in a sentence.** One short sentence with the word, spoken and shown: "She said hi."
6. **Ask again, same kind, easier Level.** Per the spec, the next question after a miss comes from an easier Level.

Design rules:

- Never show a red X or a sad face. Use a neutral highlight.
- Do not take a point away from a word the child has met. A miss only moves the word's strength (section 6).
- If he misses twice on the same word in a Round, play the teaching in full (steps 1 to 5) before the next question.
- Stop after two teachings in a row on the same word, and move the word back to "meet" (section 5).

What teaching cannot be: a long explanation. The voice clip must be under about 6 seconds, and the picture does the
rest.

---

## 5. Meeting a new word

A new word is met before it is asked, as the fraction game does with new piece words. The design:

1. **See it.** The word appears big, alone, in lowercase, with a clip: "This is *said*."
2. **Hear it.** The word is spoken by the voice, twice, slowly, with the word shown.
3. **Map the sounds.** The word is shown in letter tiles. Each tile lights and its sound is spoken: "/s/ ... /e/ ... /d/."
   For a heart word the letters that are regular are lit first, then the heart letters are shown with the heart and
   their sound: "The *ai* says /e/. A heart word."
4. **Use it in a sentence.** One sentence, shown and spoken: "I said hi."
5. **Tap it.** The child taps the new word once, on screen, to finish the meeting. The game says "Yes, *said*!"

Design rules:

- A meeting takes under a minute, and only one new word per meeting.
- A meeting is not a question. The word counts as met, not as known, until the child answers correctly on the first try
  in a question (section 6).
- The next word appears only after the last one has reached a strength (section 6) of at least "known" `(est.)`.
- Meetings happen at the start of a Round, when the Round has a new word to introduce. They do not interrupt a Round.

---

## 6. Mastery and review

### 6.1 Per-word strength

Each word has its own strength value, separate from the per-kind Levels in section 3.

- States: **new** (not yet met), **met** (seen in a meeting), **learning**, **known**, **secure**.
- A correct first-try answer raises strength. A correct answer after a teaching or after help raises strength by less.
- A miss lowers strength and sets the word to come back soon (the next Round or the Round after).
- Known words are reviewed on a spacing: a known word comes back after a longer gap each time it is answered right,
  for example about one Round, then three, then about a week, then about two weeks `(est.)`. Haebig et al. support spaced
  over massed retrieval, but not these exact gaps `[src: Haebig et al. 2021]`.
- A word missed twice in a short time is pulled back to "met" and taught again (section 4, last rule).

### 6.2 How this sits with the per-kind Levels

- The per-kind Level is about **how hard the question is** (for example, how many choices, how similar the
  distractors). Each kind has its own Level 1 to 3 and its own Mastery (the same rule as the sibling games: 16 of the last
  20 right on the first try, or 10 in a row).
- The per-word strength is about **which words he knows**. It decides which words are used in a question, not how hard
  the question is.
- A question draws a word from the sets he has met, weighted toward words with low strength, and a Level from the kind's
  current Level (with about one in three from an easier Level).
- Mastery of a kind does not mean the whole list is known. A kind can reach Level 3 on the words he knows, and the list
  keeps growing `(est.)`.

### 6.3 Pacing

- The list grows by one set at a time: a set opens when the previous set's words are all at "known" or better. This
  is the same rule as the fraction game's "8 more questions right" before the next word.
- Sets 1 to 9 come first. The set order in section 2 is a draft, and the later sets are placed by his results.

---

## 7. Pitfalls

### 7.1 Guessing from pictures

- Kind A and Kind E can be solved by pictures or by the context of a picture. Keep pictures out of L2 and L3, and in
  L1 only where the picture is not the answer.
- Do not put a picture of the word's object next to the word (for example "dog" with a dog picture). It teaches
  picture-matching, not reading `(est.)`.

### 7.2 Relying on the first letter only

- The partial-alphabetic phase in Ehri's model is exactly where a child uses first and last letters and gets the
  middle wrong `[src: Reading Rockets OM research summary]`. The game must test the middle letters.
- Distractor design: L1 distractors differ in the first letter (easy). L2 share the first letter. L3 share first and
  last letters or shape (e.g. *was* / *saw*; *then* / *than*). Track the child's errors by position: if he repeatedly
  picks a word with the right first letter, move the next questions to L2 on that word.

### 7.3 Case: lowercase first

- Most of the list is taught in lowercase. Capitals are taught after the lowercase word is known: "The" (capital T)
  and "I" are special cases. Use "I" in its capital form because it is always capital `(est.)`.
- A sentence-start capital is a separate pattern. Teach it only as a Level 3 twist on Kind D or Kind F.

### 7.4 Fonts

- Use a clear "school" font with a single-storey *a* and *g*, because a double-storey *a* is one of the earliest things
  children confuse with *o* and *d*. Verification is a must before use.
- Checked for this note:
  - **Andika** (SIL): the SIL page says the design focus is "clear, easy-to-perceive letterforms that will not be
    readily confused with one another"; it does not state single- or double-storey `[src: SIL Andika page]`. A Glyphs
    forum post describes Andika's *a* as single-storey, with a double-storey alternative, but it is a forum comment
    `[src: Glyphs forum]`. Probably the best candidate; verify by rendering.
  - **Lexend** (Google Fonts): the page does not state the *a* or *g* form. One school district guide says Lexend has a
    single-storey *a* `[src: school district accessibility guide]`. Verify by rendering.
  - **Atkinson Hyperlegible**: the GitHub README says open areas of letters are expanded for distinction, but it does
    not name the *a* or *g* form. A school district guide says Atkinson has a double-storey *a* `[src: school district
    accessibility guide]`. The two secondary sources disagree; verify by rendering.
  - **Comic Neue**: not checked.
- Recommendation: pick one font after rendering a, g, d, o and the lowercase alphabet in each candidate at the game's
  size, and choose the one where a and g are clearly single-storey. Use one font for all of the game's sight words.
  Do not switch fonts within a Round.

### 7.5 Confusable letters b, d, p, q

- These are a reversal risk for every word with those letters. The word list has *big*, *black*, *blue*, *brown*,
  *play*, *please*, *red*, *help* (b, d, p, q, and the mirror pair of b and d in *big* / *blue* / *black* / *brown*).
- Teach letter-sound links for b/d and p/q early with the tile kind (Kind C), and keep those letters out of the same
  distractor set in L3 until he can separate them.
- The font should differentiate b/d/p/q clearly (check in the font render step above).

### 7.6 Other pitfalls

- A "sight" word is taught as sight, not sound, if it is heart-only. The heart part must be shown every time, not only
  in the first meeting `(est.)`.
- Do not use a timer for the first Levels. Timed flash (Kind G) is optional.
- Do not put a letter name next to a word unless the game says it is a letter name.
- Do not let the voice read the target and a choice at the same time; the child can get the answer from the speech.

---

## 8. Sources

Read and used:

- Dolch lists (pre-primer, primer, first grade, second grade, third grade, nouns) read from
  https://www.readabilit.com/readability/dolch-sight-words (redirected from textcompare.org). Pre-primer and primer
  cross-checked against https://www.rhodadesignstudio.com/dolch-pre-primer-sight-words/ (pre-primer only).
- Fry first 100 words in frequency order: https://bookroo.com/tools/fry-word-list. The Bismarck Public Schools PDF
  (https://learnbps.bismarckschools.org/pluginfile.php/156888/mod_glossary/entry/20151/Fry%20Instant%20Word%20List.pdf)
  could not be read (binary PDF), so the Fry list is unverified against the original sheet.
- UFLI heart words (partial): https://stb-www.onrender.com/resources/ufli-heart-words (a third-party mirror of UFLI
  content; the original UFLI page is https://ufli.education.ufl.edu/). UFLI's heart-word card PDF
  (https://ufli.education.ufl.edu/wp-content/uploads/2022/09/UFLI_Heart_Word_Printable_Cards.pdf) could not be read.
- Really Great Reading, Heart Word Magic: https://www.reallygreatreading.com/heart-word-magic (from search; page not
  fetched directly).
- Really Great Reading lesson sample PDF: https://reallygreatreading.com/sites/default/files/tailored-support-for-teachers-sample.pdf
  (from search result text only).
- Haebig, E., Leonard, L., Deevy, P., Schumaker, J., Karpicke, J., & Weber, C. (2021). Journal of Speech, Language,
  and Hearing Research. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC8740735
- Font pages checked: https://software.sil.org/andika/ ; https://fonts.google.com/specimen/Lexend ;
  https://github.com/googlefonts/atkinson-hyperlegible
- Glyphs forum, single-storey a discussion (Andika comment): https://forum.glyphsapp.com/t/ipa-and-single-storey-a/18248
- School district accessibility guide (Lexend and Atkinson comments):
  https://staff.tsd.org/departments/communications/inclusive-design/accessible-type

Used from search summaries (page not fetched; treat as secondary):

- Reading Rockets, orthographic mapping research summary (Ehri):
  https://www.readingrockets.org/research-by-topic/orthographic-mapping-acquisition-sight-word-reading-spelling-memory-and-vocabulary
  and the teaching article https://www.readingrockets.org/teaching/reading-basics/sight-words-and-orthographic-mapping
  (both returned 403 on fetch; the claims come from search-result summaries).
- Reading Rockets, "should we still teach sight words" (Shanahan): https://www.readingrockets.org/blogs/shanahan-on-literacy/should-we-still-teach-sight-words
  (403; not used for any claim).
- Ehri, L. C. (2014). Orthographic mapping in the acquisition of sight word reading, spelling memory, and vocabulary
  learning. *Scientific Studies of Reading*, 18(1). Not read directly.
- National Reading Panel (2000) report, phonics and sight-word sections. Not read in this pass; cited here only as a
  pointer for the sight-word and phonics recommendations `(est.)`.

Not read and not used for any claim: the Wharton Dolch list (inconsistent pre-primer), the Broward Fry PDF, the
Manchester and Lancaster Fry pages, the spellingtestbuddy UFLI copies.

---

## 9. Open questions (for the designer, not decided here)

1. Which font: must be verified by rendering (section 7.4). Andika is the likely candidate, but the evidence is one
   forum post.
2. Fry list exactness: check the Bookroo order against Fry's own sheet before the set order is final.
3. Heart-word labels: most "(est.)" labels in section 2.3 should be checked against the UFLI card PDF or RGR's heart-word
   article, which I could not read.
4. Exposure numbers: the 1 to 4 and 20+ range is from a UFLI mirror. Use it as a starting guess, and tune from his data.
5. Set size and pace: 5 words a set, one set open at a time. Confirm with his results.
