# Brief: Carrier Deck (story problems; build an aircraft carrier and fly from it)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Carrier Deck. Slug: `carrier-deck`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. Math Bots' Bot Stories teaches story problems within 20. Second grade asks for the same thinking with bigger numbers and with two steps (Common Core 2.OA.A.1), and for reading a graph with four bars to answer a question (2.MD.D.10). The hard part is not the sum. It is working out which sum the story needs.

He likes building an aircraft carrier, so the carrier is the reward. A flight deck is a natural place for stories: jets launch, land, go below and come back up.

## A peaceful ship

The glossary's word rule holds: never "kill", "shoot" or "destroy". This carrier does no fighting. Its missions are rescues, supply drops, storm watches, air shows and finding lost boats. No weapons are drawn, bought or mentioned.

## What he learns

Start the research from 2.OA.A.1 and 2.MD.D.10, the Common Core table of problem types, and the matching TEKS Grade 2 strand. Read section 3.7 of `.scratch/math-bots/research/first-grade-math.md` and Bot Stories in the code first: its story types, its rule against key words and its wrong-answer rules all carry over. Level 1 here begins where Bot Stories Level 3 ends.

If Jetway is built first, check its Levels: a story here should never need a sum harder than he has met there or in Math Bots.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Deck Log** `one`: a one-step story with bigger numbers | start | the end is asked ("40 jets. 20 launch. How many now?"), round tens, then any numbers without carrying | the change is asked ("32 on deck. Some launch. Now 20.") | the start is asked ("Some were on deck. 15 landed. Now 40.") |
| **Which Sum** `pick`: hear a story, tap the number sentence that fits; no answer is worked out | start | `38 + 25` or `38 - 25` | a sentence with a gap (`38 + ? = 60`) | the story holds a number that is not needed |
| **How Many More** `compare`: two decks or two ships | Deck Log L2 | "how many more", with two bars drawn | "how many fewer", bars drawn, then not | the tricky one: "The big ship has 12 more than the small ship. The big ship has 30. How many has the small ship?" |
| **Two Steps** `two`: a story with two things happening | Which Sum L2 | add, then add again, numbers to 20 | add, then take away | numbers to 100, with no hint that there are two steps |
| **Mission Board** `board`: a bar graph of four squadrons | How Many More L2 | read one bar; the scale goes up in ones | "how many more" between two bars; the scale goes up in twos or fives | "how many in all" for two or three bars; the scale goes up in tens |

How he answers: Which Sum uses choices. The others use number wheels, one for each digit, as Big Jumps does in Math Bots (copy the pattern, don't import it), unless testing on the iPad shows three choices work better for him.

Rules the tests must enforce:

- A story's words never give the sum away. About half the stories that say "more" need taking away, and about half that say "left" or "fewer" need adding (the key-word trap in the Math Bots research).
- Every story has one answer, never below zero and never over 100.
- Every number that is needed is said and shown. Which Sum Level 3 is the only place with an extra number, and there it is always a different kind of thing ("3 sailors watched") so the story still makes sense.
- Two Steps stories are true two-step stories: the first step's answer is needed for the second.
- Where there are choices, exactly one is right. The wrong ones are the real mistakes: the other operation, one of the story's own numbers, the first step given as the final answer.
- Mission Board bars always end on a marked line at Levels 1 and 2. A bar ends halfway between lines only at Level 3, and only on a scale of twos or tens.
- Story nouns stay few: jets, helicopters, crates, sailors, boats.

## Teaching a miss

- **Deck Log and Two Steps:** the story plays again on the deck, one sentence at a time, with the jets moving as each number is said. When the start is the unknown, the action runs backwards. It ends by writing the number sentence in the story's order.
- **Which Sum:** each sentence of the story lights the part of the number sentence it stands for.
- **How Many More:** the two rows pair off, and the ones without a partner glow. "These have no partner." This is the lesson Bot Stories uses.
- **Mission Board:** a line runs from the top of the bar across to the scale, and the scale is counted by its step.

A second miss gets the fuller lesson with a bar picture: a long bar for the whole and two shorter bars for the parts, one of them empty.

## Voice

Stories are spoken one sentence at a time, with each number appearing on screen as it is said, and a speaker button says the story again as often as he likes. He reads numbers, so number buttons are not read out. This game has many story sentences: build them from chained pieces the way Bot Stories does, test one chained story on the iPad before recording the rest, and report the clip count and size. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the Carrier, the Mission and the Fleet

He wants to build an aircraft carrier, so the ship is the main reward. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Mission. Bolts buy ship sections, aircraft and gear. A Mission he has not flown before opens the next one and adds a patch to his wall.
- **The Carrier (from the side and from above).** It starts as a short hull with a bare deck. He buys it longer, one hull section at a time, and fits it out: the island with its bridge and radar, catapults, landing wires, deck lifts, the hangar deck below, an angled deck, deck lights, the signal mast, anchors, a galley, a rescue boat. A cutaway view shows the decks inside filling up.
- **Sections matter.** A longer deck takes bigger aircraft. A second catapult launches two at once. More wires make the landing zone longer. The lift brings aircraft up from the hangar, so the hangar's size sets how many he can own. Deck lights open night Missions.
- **The air wing.** A trainer jet to start, then a rescue helicopter, a cargo plane, a radar plane with its dish, a twin-rotor helicopter, a seaplane, a storm-watch plane, a water bomber, a display jet with coloured smoke and a jump jet. Each has paint, tail art and a number he picks.
- **The Mission (action, 2D canvas, from the side, about a minute).** He holds the catapult button to fill a gauge and lets go to launch. A short flight does the mission's job with one finger: drop a supply crate to an island, lower the helicopter's winch to a raft, fly through rings for an air show, follow a whale for the scientists. Then he follows the landing lights down and catches a wire.
- **It cannot be failed.** Any launch flies. Missing the wires just sends him round again, and the third pass lands itself. Nobody is ever in danger: the raft is waiting, not sinking.
- **The Fleet and the Voyage.** Other ships join his: a supply ship, a tug, a hospital ship, a rescue boat, a research ship, a lighthouse tender. A sea chart shows the Voyage from port to port, and each group of Missions is at a new place: the home port, the islands, the ice, the reef, the storm sea, the far harbour.
- **Show off.** "Watch the deck": the carrier working by itself, with his aircraft coming up on the lift, launching, landing and going below, and his Fleet sailing alongside.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 50 ship sections and fittings, 12 aircraft, 30 paints, 24 tail arts, 8 Fleet ships, 36 Missions with a patch each, flags and deck markings. Economy defaults for the parent to confirm: one Mission per Round, the first Mission free; the first new section within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Mission, Air Wing, Fleet, Voyage, Patch) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Missions made on the spot.** Once the first Missions are flown, the radio always has a new call. Each one is generated from its number: the job (drop, winch, rings, follow, search), how far, the wind, the sea, day or night, and which aircraft suits it. The same number always gives the same Mission. Each is a little harder than the last, and every fifth one earns a patch or a deck marking that is never sold.
- **The Voyage never ends.** The sea chart keeps drawing new waters and new ports ahead of him, generated from the chart number, each with its own colour of sea and sky and its own run of Missions.
- **The ship and the Fleet keep growing.** He can always buy another hull section, another lift or another hangar bay, up to a length that still draws well, and then another ship for the Fleet. Fleet ships are put together from parts (hull, deckhouse, mast, funnel, colour), so there is always a new one in the yard. Prices rise gently and then stay flat.
- **Flight hours and ranks.** Every Mission adds to his logbook, with a new rank and a new stripe on his jersey at each milestone, without end.
- **Competition, if it is built:** an Air Show where his display is scored beside two or three rival pilots, tuned by the guide's rules, so he usually places first or second and is not always first. His own best landing (which wire he caught) is shown on every return.

## Look

Sea colours: deep navy water, a grey ship, a dark deck with white and yellow markings, and the bright jersey colours of a real deck crew (yellow, green, red, purple, blue) for buttons and badges. Everything is drawn in code, and the aircraft on the deck is the one he flies. Icon: the carrier's bow from the side with one jet lifting off it.

Keep it apart from Treasure Fleet (a sailing ship and maps) and from Jetway (an airport on land). The catapult and the wire are what make this one different to play.

## Risks

- Hearing a story and holding its numbers is harder than reading a sum. If he taps before the story ends, hold the answer buttons until it has been said once.
- Two-step stories are the hardest thing here. If he stalls, add Stretch inside Two Steps Level 1 with the middle question asked aloud ("First, how many are on deck now?").
- Chained story sentences can sound flat or stumble on a number. Test early, as the Math Bots research warns.
- The landing has to feel fair. Tune the size of the wire zone on the iPad 9, and keep the tuning in one table.
- A grey ship on blue water can look dull beside the other games. The deck crew colours and the aircraft paint must carry it.
