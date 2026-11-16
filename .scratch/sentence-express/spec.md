# Spec: Sentence Express (reading sentences, a train set he builds and drives)

Status: built on 2026-11-16 from `brief.md`, playable at `/sentence-express/` with a tile on the landing page (Learning Games, after Wild Rescue). Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Rover Code, Treasure Fleet and Wild Rescue (`src/wild-rescue/` was the model), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent in the Shed on engines, cars, paint, track and scenery. Each Round also earns a Delivery: he drives his own train on the Layout he drew.

It is the site's first game about the **sentence** (Common Core RF.1.1a, RF.1.4, L.1.1, L.1.2a, L.1.2b): word order, the capital at the start, the mark at the end, and reading a sentence for what it means.

## The central picture

A sentence is a train. The first word is the **engine** and carries the capital letter; each word after it is a **car**; the end mark is the **caboose**. Every kind and every lesson uses it. The engine in a question is his own engine in his own paint, and the cars are drawn by the same code (`art/train.ts`) as the cars in his Shed, so the word cars and his toy are plainly the same train.

## What he reads

- **159 curated sentences** in `src/sentence-express/sentences/list.ts` (55 of three words or fewer, the rest four to six words; 28 questions, 19 with ! and the rest statements). Every one is a clip of its own, and every word in them (124 words) is a clip, so tapping a car says its word.
- Words: Sight Squad's 100 sight words (`src/sight-squad/words/list.ts`, read only; the test checks against it), short decodable words kept in `sentences/words.ts` (there is no Dino Dig game), picture nouns (train, ball, bird, tree, car, boat, sky) and six names (Sam, Pam, Max, Ben, Mom, Dad).
- What each sentence is used for is worked out from what it is: Build the Train and Fix the Train take the 145 with exactly one right order (below); What Happened the 60 with a drawable meaning; Who, What, Where the 39 with questions (56 question lines).

## Kinds

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Build the Train** `order`: the sentence is said; its cars wait shuffled in the yard; he couples them in order | start | 3 words | 4 to 5 words (Stretch: 4, then 5) | 5 to 6 words and the questions |
| **Engine and Caboose** `marks`: the train is missing one piece; he picks it | start | the engine: "The" or "the" (Stretch: a third engine with another word of the sentence capitalised); sentences of up to four words | the caboose: . or ? | the caboose with ! too, or the capital on "I" or a name in the middle ("i" or "I") |
| **What Happened** `mean`: he reads it alone and taps its picture | Build the Train L2 | 2 pictures (another animal or person) | 3 pictures | pictures that differ by one word (on / under / in, big / little, a colour, a number, what it's doing) |
| **Who, What, Where** `ask`: the sentence is said, then a question; he taps the picture that answers | What Happened L2 | who (2 pictures, then 3) | what it has, where it is, what it can do | two sentences, the answer in one of them, and what the other says offered as a wrong answer |
| **Fix the Train** `fix`: one mistake; he taps the bad car, then fixes it | Engine and Caboose L2 | a lowercase engine, or the caboose missing its mark | two cars swapped | any one of: a capital (engine, "I" or a name), the end mark (missing or wrong), two cars swapped, a word that doesn't belong |

**The fix step.** Tapping a good car is a miss. Tapping the bad one lights it, and then: a lowercase car gets a big "t → T" button; a wrong or missing caboose offers its marks; a swapped car asks "Now tap where it goes!" (tapping the wrong car is a miss); a word that doesn't belong gets "✋ Take it off". The fix that puts it right is the answer.

**Reading alone.** What Happened is the one kind not said aloud: 🔊 reads the sentence and tapping a car says its word, and both count as help. In every other kind the sentence is said and tapping a car says its word for free.

**Rules the tests enforce** (`sentences/sentences.test.ts`, `reading/problems.test.ts`, every kind × Level × Stretch × 150 seeds):

- **One right order.** The order checker (`sentences/grammar.ts`) is a small grammar of the sentences the game uses, with enough meaning to throw out silly orders ("The box is in the dog."). It tries every order of a sentence's cars with the engine first and the caboose last and the test requires exactly one to make sense for every Build the Train sentence. It finds the traps: "The dog sees the cat." / "The cat sees the dog."; "The big dog is red." / "The red dog is big."; "Will you help Max?" / "Will Max help you?"; "Did the dog dig a hole?" / "Did a dog dig the hole?"; "What is in the box?" / "What is the box in?"; "Can you see the big dog?" / "Can the big dog see you?". Those sentences are kept for the other kinds only (`noOrder`). Words that can sit in more than one place (now, too, then) and "and" between two things that could swap are kept out of Build the Train altogether. The capital on the engine settles "Is it big?" against "It is big." (the test checks the end mark does too).
- **One right picture.** A picture matches a sentence when everything the sentence says is true of it; every wrong picture changes something the sentence says, so it can't also be true. Level 3 wrong pictures differ in exactly one thing. Every deciding word is in the sentence, so a lesson can light it.
- **Fix the Train has exactly one mistake**, and fixing it gives back the curated sentence. A swap or a slipped-in word never makes another sentence that makes sense (checked by the same grammar), and a slipped-in word is the only car whose removal makes a sentence.
- **Exactly one right answer** among distinct choices, every kind. A question with two sentences is never also answered by the other sentence.
- **End marks.** A question takes only ?, so it's offered . and ! too. A telling sentence is offered . or ? (never !, which could also be fine); a big-feeling sentence ! or ? (never .). So . against ! is never asked where both could be right.
- **The engine shows its capital and the caboose its mark from Level 1** in Build the Train: honest clues.

**Unlock order, Mastery, Rounds** exactly as Wild Rescue: 16 of the last 20 right on the first try or 10 in a row, the quick rule (8 of 10 or 6 in a row) for a kind's first 30 questions at his Level; Levels never go down; a star at Level 3. No Tune-Up. Five answers a Round, mixed across open kinds, never the same kind twice running; about one in three easier and always after a miss; a miss comes back later as a fresh question with no credit; the same sentence is rarely asked twice in a Round. Bolts: one per first-try answer plus one for finishing. A Round resumes after a reload.

## Teaching a miss

Never a red X. A second miss (or the first, when he's been missing a lot) says more and leaves the answer glowing; 🔎 runs that fuller lesson and counts as help.

- **Build the Train:** "Listen to the train." A train couples up car by car above his, each word said, then the whole sentence. His cars stay where he put them with the first wrong one lit; tapping a car uncouples it and every car behind it (as a real train would), so he fixes it from there.
- **Engine and Caboose:** the right piece glows in the gap with its line: "A sentence starts with a capital letter." / "The word I always has a capital letter." / "A name starts with a capital letter." / "This one tells something, so it ends with a period." / "...asks something, so it ends with a question mark." / "...shows a big feeling, so it ends with an exclamation mark."
- **What Happened:** the sentence is read now, then "Look!" and the words that decide it light in the sentence and are said ("under"), while the matching part of the right picture lights (who, the place, or what it has).
- **Who, What, Where:** "Listen." The answer's words light in its sentence, the sentence and the question are said again.
- **Fix the Train:** the bad car lights with its line ("This word does not belong.", "Two cars are swapped.", "Every sentence needs a mark at the end.", or the capital and mark lines), and the sentence is said.

## The reward: the Train Set

**The loop.** A finished Round earns Bolts and one Delivery (📦). Bolts buy engines, cars, paint, track and scenery in the Shed. A Delivery is a run he drives on his own Layout; finishing it opens the next station on the line. He starts with one free Delivery.

**The Layout (`layout/`, 2D canvas).** Free-form track drawing shipped (the fallback of pre-built layouts was not needed). A pale wood table of squares, 12×8 to start (14×9, 16×10 and 18×11 tables are bought). He drags a finger across squares to lay track (✏️); straights, corners, points (three sides) and crossings (four) are worked out from what he draws, and a quick finger that skips a square or cuts a corner still lays a joined line. When he lifts his finger a loose end closes itself up the shortest way to other track through empty squares; if there's no way, the end gets a little turnaround loop and the train comes back. 🧽 rubs track out (the ends it leaves close up the long way round). 🌳 places scenery: tap a piece, then a square (a tunnel, bridge or level crossing on a straight; the rest on an empty square); tap a piece on the table to put it back; tap a station to pick it up and put it on another straight. A tap on points switches them. Track squares are counted: 40 to start (the starter loop uses 28), 12 more in each Track Box; when he runs out, "You need more track!" and the next Track Box becomes his Goal. The table is drawn on its side when the screen is taller than wide. The Layout is saved after every change.

**The Delivery (`delivery/`).** A card: "Go to the Farm to pick up the milk!" and Go. He drives his own train (his engine and coupled cars) on his own Layout: a tall throttle at the right he slides (it stays where he leaves it), a whistle and a bell at the left, and points he taps on the table (the nearest within a square of the tap). The pickup station glows orange. Arriving stops the train by itself whatever the speed ("Loading!"), the cargo rides on the first car, the throttle goes back to zero and he drives it home: "Now take it to Toy Town!". Faster than a comfortable speed round a corner, the train leans and squeals ("Whee!"); it never derails. Points set the wrong way only send it round again; after 6 seconds on a leg the points it needs glow and "Tap the points to switch them!"; after 26 seconds they set themselves ("I switched the points for you!"). Before it starts, the plan makes sure the pickup can be reached from Toy Town and Toy Town from the pickup (whichever way the train arrives); if not, the pickup station moves to a straight that works, and if none does (he has taken his track apart), the starter loop goes back on the table ("Let's fix your track!"). A scripted child finishes on 80 random scribbled Layouts in the tests, tapping the points or not.

**Stations.** Toy Town (home) and eight on the line: the Farm (milk), the Quarry (rocks), the Port (fish), the City (mail), the Mill (logs), the Mine (coal), the Zoo (bananas), the Toy Shop (toys). The Farm is open from the start; each finished Delivery opens the next one, placed on his track by itself. The first Delivery from each station brings a gift piece of scenery, put beside it: Red Barn, Digger, Lighthouse, Tall Building, Log Cabin, Gem Pile, Giraffe, Giant Teddy. After all eight, Deliveries take each station in turn.

**The Shed (`shed/`).** Tabs: Engines, Cars, Paint, Track, Scenery. As in the Garage of the other games, a thing he hasn't got goes on his train to try, with Buy beside it; one he can't afford becomes his Goal. A car he owns is coupled or uncoupled with a tap; the engine pulls up to six. The catalogue is plain rows in `shed/catalogue.ts`, so more can be added by adding rows.

| | | Bolts |
|---|---|---|
| Engines (13) | Little Tank Engine (free), Yard Shunter 12, Tram 18, Big Steam Engine 30, Mail Engine 40, Snow Plow Engine 50, Diesel Engine 60, Electric Engine 70, Mountain Engine 78, Old Timer 85, Golden Engine 92, Sky Train 96, Bullet Train 100 | 731 |
| Cars (25) | Open Wagon (free), Coal Car 6, Log Car 8, Block Car 9, Animal Car 10, Milk Tanker 12, Passenger Car 15, Caboose 18, Mail Car 20, Rock Hopper 22, Ice Cream Car 25, Fruit Car 28, Fuel Tanker 30, Circus Car 32, Dining Car 35, Sleeper Car 40, Toy Car 45, Crane Car 50, Car Carrier 55, Treasure Car 60, Fish Tank Car 65, Rocket Car 70, Dino Car 80, Party Car 90, Golden Car 100 | 925 |
| Paint (25) | Toy Red (free), then 4 to 24 (stripes, polka dots, checkers, stars, flames, rainbow stripes...) | 268 |
| Track (13) | ten Track Boxes of 12 squares, 2 to 5 each; Bigger Table 25, Big Table 50, Giant Table 80 | 190 |
| Scenery (57) | Trees 3, Flowers 3 ... Water Tower 12, Level Crossing 15, Bridge 18, Tunnel 20, Windmill 25 ... Castle 60, Ferris Wheel 70, Volcano 80, Roller Coaster 95, Flying Saucer 100 | 1,667 |

**Everything together costs 3,781 Bolts**, every price at most 100.

**Economy defaults, for the parent to confirm.** One Delivery per finished Round; one free Delivery to start; Deliveries don't expire. A Delivery pays 2 Bolts plus 1 a car, at most 6 (the brief's "up to 6 by train length"); with the free Open Wagon it's 3. A Round pays at most 6, so a Round and its Delivery at most 12. The Delivery is used, and paid, only when the cargo reaches Toy Town; leaving halfway (🏠 twice) costs nothing and pays nothing.

**Controls stay off the edges.** The throttle, whistle and bell sit at least 28px in from the sides and above a floor of at least 56px; the canvas sits between them. Every tap is a pointer event on a big target (cars fire on pointerup so a light touch counts; points and the table use a tolerance of a square).

## Look

Wooden-toy colours: bright red, blue and green on a pale wood table under a blue sky, with the family's black outlines and solid drop shadows; Bungee titles, Nunito for the game's words, Andika for anything he reads. Home: Play is a big green ▶ over a toy rail; the Shed tile (red) shows his train; the Layout tile (green) a picture of his table. Icon: a little red tank engine with a capital S on its side, pulling two word cars and a caboose with a full stop up a toy track under a yellow sun. Pictures are small SVG scenes (`art/Scene.tsx`): animals and people are emoji, coloured things (ball, hat, car, cup, box) and places (bed, box, log, rug, tree, pond, mud, nest, car) are drawn.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection sentence-express`: **706 clips, 9.8 MB** in `public/sentence-express-voice/`: 159 sentences, 124 single words, 56 question lines, the numbers to 100, item names and the game's own lines. `voice.test.ts` checks every line the game builds at run time has its clip and nothing on disk is left over; `tools/sentence-express/clips.ts` decodes every clip in a browser with the game's own trim (all decode, none silent or clipped, the trim never cuts speech).

Checked without ears on 2026-11-16 (Whisper small.en transcriptions, pitch and formant measurements; still not listened to by a person). Every sentence and line was heard as written except these, which need a listen: "duck" (its vowel sits between "dock" and "dack"); "The pig ate." (heard as "The paygate": run together?); "The fox naps." (heard as "fox snaps"); "Where is the dog?", "Where is the frog?" and "Where is the bird?" (the "is" comes out reduced, "Where's"). Seven yes/no questions end flat or a little lower instead of rising: "Will you help Max?", "Can you see the big dog?", "Did the dog dig a hole?", "Is the dog in the box?", "Do you want a cake?", "Is the cat on the bed?", "Can Sam ride the bus?" (the other twelve rise; changing their punctuation doesn't change what the voice does). "a" alone is said "ay" (the same clip as Sight Squad's, and as the letter A); "the" alone is "thuh"; "cat" is said right (Whisper hears "Kate" for any lone "cat", so it can't judge it).

## Save

`sentence-express-save`, version 1 (a version it doesn't know reads as a blank save), and `sentence-express-place` for the screen and the Round in progress (a reload during a Delivery lands at the Layout). A Layout whose squares don't join up both ways reads as the starter loop.

## Open questions for the parent

1. Is the order checker's idea of "right" the one you want: an order that is grammatical *and sensible* (so "The box is in the dog." doesn't count)? The stricter "grammatical at all" would rule out nearly every sentence with two nouns.
2. Should ! be taught against . (it's never asked now, since both are often fine)? Does his class say "period" or "full stop"?
3. Should What Happened's 🔊 count as help, as the brief says, or be free?
4. Is 3,781 Bolts the right size? It's about 315 Round-and-Deliveries at full pay.
5. Should he pick which station to deliver to, rather than the newest one first, then each in turn?
6. Should points set themselves after 26 seconds, or only light up?

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari/WebKit. Checked in Chromium (touch events) at 810×1080, 1080×810, 390×844 and 844×390 (`tools/sentence-express/tour.ts`) on a new save and on saves with every kind open at Level 2 and at Level 3, and offline on the production build (`tools/sentence-express/offline.ts`). The tour also logs every clip it plays, checks no two play at once and that leaving a Round, the Layout or a Delivery stops its voice (and the Delivery itself); `tools/sentence-express/reload.ts` reloads mid-Round, mid-lesson and mid-Delivery, and checks the sound starts on the first tap and wakes again after it's parked.
- The voice clips were recorded but not listened to; see Voice.
- No Trophies; no per-word strength tracking (Sight Squad's); the train doesn't run by itself on the Layout for show (only in a Delivery); scenery doesn't animate.
- The order checker's grammar only knows the sentence shapes the game uses; a new sentence with a new shape needs the grammar (and its trap tests) taught first.
- On a phone held sideways the table's squares are about 38px (the Layout's header moves to a column at the left to give the table the whole height); a bought bigger table makes them smaller still (about 28px on the Giant Table). Below the 44pt guideline: laying track works, but it's tight. An iPad is 70px.
