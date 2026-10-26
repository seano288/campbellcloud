# Sight Words: the "army" reward

Research for the sight-word game's reward. The parent asked for "the reward should be building an army". This file proposes how that works for a 6-year-old early reader, using the sibling games' economy (Bolts, Slots/Mods/Rungs, Colours, Bodies, Goal, Trophies, Show Off).

Tags: [src] = taken from a source listed in section 7. (est.) = my judgement, not sourced. Where a search returned weak or conflicting results, that is said.

---

## 0. The short version

- An army is many small things that grow, not one thing that is customised. The growth itself is the reward: he sees the crowd get bigger on the mat.
- Recommended theme: **green plastic toy soldiers on a play-mat** (a toy-box army, not a war). It matches the parent's words, uses the simplest 3D primitives, and its toy-battle physics ("knocked over, bounce home") fit the no-gore rule.
- Recruits are the cheap, frequent reward (a new soldier every Round or two). Unit *types* and *Kits* (upgrades per type) are the Bodies and Mods. Tents are the Goal steps that let the army grow.
- Show Off: a **Parade** that marches past, with formation changes he taps. Battle and word-spelling formations are later phases.
- Reading ties in through **command words** (GO, STOP, UP, DOWN, RUN, JUMP, COME, LOOK) read aloud and tapped on the Show Off stage. They are not a gate on Bolts. Legendaries open by reading a word he has mastered.

---

## 1. What makes "collect and grow an army" work in kids' and casual games

### 1a. What the games do

- **Clash Royale (Supercell).** Each troop card has levels that raise its stats; the level cap was raised in late 2025 and the upgrade path now uses regular cards plus Gold [src: supercell blog, timesaver guide]. Sources disagree on current numbers, so treat exact costs as unverified. The useful lesson: every troop can be upgraded, so the deck is a collection that keeps getting stronger.
- **Clash of Clans.** Army Camp capacity is the cap on how many troops you can field, and the Laboratory unlocks higher troop upgrades [src: CoC wiki Army Camp]. The useful lesson: a *housing cap* that grows is itself a goal ("I need a bigger camp").
- **Kingdom Rush.** Barracks spawn soldiers, and each tower type has an upgrade tree (five upgrades per tree in the first games). Players asked for more variety in upgrade paths and noted that some upgrades dominate others [src: Kingdom Rush wiki Upgrades; community posts]. The useful lessons: a spawner is a simple "army grows" mechanic, and upgrade balance must not let one option always win.
- **Pikmin.** A crowd of Pikmin follows the captain. The field holds up to 100 at once; new ones come from the Onion, which turns collected items into seeds [src: Pikmin Wikipedia, PikminWiki Onion]. The useful lessons: a *follower crowd* is the most visible growth in the game, and a cap makes each new one matter. Pikmin left behind are lost; for a 6-year-old that becomes "they go home" (see section 1c).
- **Count Masters and Santa Crowd Race (crowd runners).** Gates add or multiply the crowd; a bigger crowd wins the clashes with other crowds [src: Gamezebo guide; App Store listing]. The useful lesson: choosing the gate that adds most is a satisfying tiny decision, and every gate is a number he can read.
- **Mob Control (Nintendo Switch).** Gates multiply the mob; you unlock new mob types and see their evolutions as you level them; cards upgrade the collection [src: Nintendo store listing]. The useful lessons: multipliers are exciting, and "unlock a new type, then evolve it" is a proven loop.
- **Totally Accurate Battle Simulator (TABS).** Ragdoll physics make falls and wobbles funny; reviewers describe its unit creator as "a building toy" that kids enjoy designing with [src: TurboGeek review; PC Gamer piece on ragdolls]. The reviewers are adults, and there is no formal study of children. Useful lesson: physical comedy holds up on repeat play (est. for this audience).
- **Lego and green plastic army men (est.).** Army men are sold in bags of identical soldiers with a few types (rifleman, bazooka, jeep, tank). Kids collect and line them up, and the appeal is the sheer count plus the play-mat or sandbox. I did not find a sourced study on this.
- **Age of Empires for kids, Army of Two toys (est.).** Not researched in depth. The general idea (train units, grow the army, form up before a fight) is well established in strategy games.

### 1b. The mechanics that work

1. **Seeing it get bigger.** A crowd that visibly grows on screen is the strongest reward in this list (Pikmin, crowd runners, Clash). Every recruit should be a visible new figure, marching onto the mat (est.).
2. **Unit variety.** Several unit types with different shapes and roles (fast, tough, support, big). A 6-year-old wants to find the one he does not have (est.; Kingdom Rush players asked for more variety [src]).
3. **Upgrades that visibly change units.** When a kit upgrade changes the whole type at once (every Private gets a helmet), the change is seen across the army in one moment, which is the big payoff (est.; matches Clash's upgrade model [src]).
4. **A cap that grows.** Clash of Clans uses housing capacity; the cap gives the Goal bar a physical meaning (est.).
5. **A commander.** One figure he leads and customises, who stands at the front of the parade. Lets the reward feel personal (est.).
6. **Small, readable decisions.** Pick the gate or the formation; never a long strategy choice (Count Masters [src]; est.).

### 1c. Keeping it age-appropriate

- Battles are toy battles. Units that are "hit" are **knocked over**, do a comic wobble, go **poof** into a puff of confetti, and **bounce home** to the Tent. Nothing dies, nothing bleeds, nothing is "killed" (est.; the Pikmin-style "they go home" fits this [src: Pikmin wiki on losses, reworded]).
- Avoid spoken words: kill, shoot, attack, fire at, destroy, blow up, die. Use: knock over, bounce, go home, charge (est.; charge is an army word but not a kill word, and it is not a Dolch word, so treat it as optional).
- Weapons are toy things: slingshot, squishy ball launcher, drum, bugle, flag.

---

## 2. Theme options

Five candidates. Each row says what it does for a 6-year-old and what it costs to build with three.js primitives (boxes, cylinders, spheres, cones) (est. throughout).

### Theme A: Green plastic toy soldiers on a play-mat (recommended)

- **For him:** Instantly readable as "army" (the parent's word). Toy soldiers are a familiar toy, and a play-mat with pale tan dirt, a little hill and some tin cans is easy to picture. Toy-battle physics read as play.
- **Against:** Soldiers and tanks can feel like war to some parents; keep it toy-like (no real guns, no gore, soft ball launchers). Green-only units need differences in shape and in the team Colour to be told apart.
- **Build:** Very easy. Soldier = box body, sphere head, cylinder helmet/rifle. Tank = box with cylinder barrel. Jeep = two boxes and four cylinders. All instanced meshes; 60 on screen is fine (est.).

### Theme B: Knights and castle

- **For him:** Fairy-tale, friendly, and a favourite for many kids. Archers, cavalry, catapult, a dragon as a legendary.
- **Against:** Swords and "fighting" language is closer to violence than toys; horses are the hardest mesh to model cleanly; the castle is a whole second world to build.
- **Build:** Medium-hard (horses, catapult arms).

### Theme C: Robots

- **For him:** No humans, so no war feeling. Robots are a common kids' favourite, and boxes-and-cylinders bodies suit primitives perfectly. Upgrades can be "parts" (antenna, jet pack, shield), which matches the Mods idea.
- **Against:** "Robot army" reads more like a sci-fi invasion than a toy army, and "destroy" language creeps in. It may overlap with other sites' robot games.
- **Build:** Easy (boxes, cylinders); upgrades are very visual.

### Theme D: Dinosaur army

- **For him:** Dinosaurs are loved by most 6-year-olds. Roars and stomps are fun, and a T-rex general is a strong legendary.
- **Against:** Animals are harder to model (four legs, tails, heads) and the "army" frame is weaker. Some parents dislike "fighting" dinos.
- **Build:** Medium (quadrupeds, but simple shapes work).

### Theme E: Space troopers

- **For him:** Lasers, jetpacks, a fleet feel. Sci-fi is exciting.
- **Against:** It overlaps with the aircraft sibling games (Time Flies, Chop Chop's Helicopter, Monster Truck Money's vehicles), so it would blur the family look. "Laser" language is closer to shooting than toy-battle play.
- **Build:** Easy to medium (sci-fi boxes and glow).

### Recommendation: Theme A

Green plastic toy soldiers on a play-mat. It is the only candidate that matches the parent's word "army" and the toy-battle tone, it keeps the "toy box" family look (Time Flies and Monster Truck Money already use physical, toy-like objects), it is the easiest to build, and the Colours mechanic gives him a way to make the army his (tan, blue, red) without changing the base idea.

A toy-box variant (a few robots, a dog, a jeep among the soldiers) is possible but muddles the "army" read. Keep the army to soldiers and vehicles, with the dog as a single novelty unit.

---

## 3. Economy: mapped onto the existing system

### 3a. Mapping to the sibling games

| Sibling term | Army equivalent | What it does |
|---|---|---|
| Body (bought with Bolts, one per Body) | Unit type (e.g. Scout, Medic) | Unlocked once; then recruit as many as you can afford. |
| Mod / Slot / Rung (5/15/30) | Kit per unit type (3 rungs) | Upgrades every unit of that type at once. |
| Colour (3 Bolts; Red free) | Team Colour (Army Green free; 11 others at 3) | Changes the team's look. |
| Door Number | Banner number (on the flag) | Free to change. |
| Goal | Tent (the next capacity step) | The one thing he is saving for. |
| Legendary (money, via Pay the Shop) | Legendary unit (via Word Lock) | Opened by reading a word, never Bolts. |
| Trophy | Trophy Shelf (unchanged) | Earned for Learning, Skill, Sticking with it. |
| Show Off (spin, tricks) | Parade (march past, tap to salute) | See section 4. |

New terms to add to GLOSSARY.md if this is built (est.): **Recruit** (one soldier bought, army grows by one), **Unit type**, **Kit**, **Tent** (room for more soldiers), **Banner**, **Word Lock**, **Parade**.

### 3b. Mechanics

- **Recruit.** Spend Bolts; one soldier of a chosen unlocked type marches onto the mat. Army grows by one per recruit. Recruit costs are small (2 to 8 Bolts), so there is always something to buy.
- **Unit types.** Ten regular types unlocked once with Bolts (cost rises with power, like Bodies). Two legendary types are opened by Word Lock.
- **Kits.** Each unit type has one Kit slot with three rungs (5, 15, 30 Bolts). A Kit changes every unit of that type: Kit I = helmet, Kit II = shoulder pads and a pack, Kit III = a gold stripe and a flag. The change shows at once across the army.
- **Tents.** Capacity steps. Tent 1 is free and holds 10 soldiers (the three starting Privates plus seven). Each further Tent adds 10 places, and the cap is 60 in total. The cap is the Goal's visible step.
- **Banner.** A flag on a pole at the front of the army. Three rungs (5, 15, 30): stripe, badge, then a flapping flag (flapping is cut under Reduce Motion).
- **Team Colour.** Army Green is free; the other eleven are 3 Bolts each, bought once and used across the army.
- **General.** The commander at the front. He has a hat (one slot, three rungs at 5, 15, 30 Bolts) and a Team Colour sash. He is never a soldier in the army count.
- **Word Lock (Legendaries).** Once a type's Kit III is his, its Legendary unit is locked behind a Word Lock: he is asked to read a word he has mastered, from three read aloud; the lock opens when he taps the right one. This is the army's version of Time Lock and Fuel Lock. Never bought with Bolts.
- **Cap.** The field shows up to 60 figures in the Parade; later Tents do not add more figures than that. Pikmin's on-field cap of 100 is a reasonable upper bound (est.).

### 3c. Concrete numbers

**Recruit costs (per soldier, Bolts):** Private 2, Scout 3, Medic 3, Grenadier 3, Drummer 3, War Dog 4, Sergeant 4, Jeep 6, Mortar 6, Tank 8.

**Unlock costs (once per type):** Scout 6, Medic 8, Grenadier 10, Drummer 10, War Dog 12, Sergeant 15, Jeep 20, Mortar 25, Tank 30. Private is free.

**Kit costs (per type):** 5 / 15 / 30 (50 in total per type).

**Tents (capacity to 10 / 20 / 30 / 40 / 50 / 60):** Tent 1 free; Tent 2 10; Tent 3 15; Tent 4 20; Tent 5 25; Tent 6 30.

**Colours:** Army Green free; 11 others at 3 Bolts.

**Banner:** 5 / 15 / 30. **General's hat:** 5 / 15 / 30.

**Unit types, final roster (12):** 10 regular plus 2 Legendary. Regular: Private, Scout, Medic, Grenadier, Drummer, War Dog, Sergeant, Jeep, Mortar, Tank. Legendary: Golden Sergeant (after Sergeant Kit III), Mega Tank (after Tank Kit III).

**Totals to finish (est.):** unlocks 136 + Tents 100 + Kits 500 + Banner 50 + General hat 50 + Colours 33 + recruits to fill 60 (about 200) = **about 1,070 Bolts**. At 6 Bolts per Round that is about 180 Rounds. At around 3 Rounds a day, 5 days a week (est.), that is about 12 weeks, so roughly 2.5 to 3 months, matching the target.

### 3d. Progression: first 20 Rounds

Assumes 6 Bolts per Round (the design target: 5 right on the first try plus one for finishing). Real play is closer to 5 per Round, so each row arrives about 20 percent later (est.). Army starts with 3 Privates; Tent 1 holds 10.

| Round | Earned | Spend | Army | Pocket after | What he sees |
|---|---|---|---|---|---|
| 1 | 6 | 3 Privates (6) | 6 | 0 | Three new Privates march onto the mat |
| 2 | 6 | Unlock Scout (6) | 6 | 0 | Scout type appears on the mat |
| 3 | 6 | 2 Scouts (6) | 8 | 0 | Two Scouts run in |
| 4 | 6 | 2 Privates (4) | 10 | 2 | Tent 1 is full |
| 5 | 8 | Unlock Medic (8) | 10 | 0 | Medic with a bandage cross |
| 6 | 6 | Save for Tent 2 | 10 | 6 | Goal bar shows Tent 2 |
| 7 | 6 | Tent 2 (10) | 10 | 2 | The mat gets a second tent (cap 20) |
| 8 | 6 | 2 Medics (6) | 12 | 2 | Two Medics join |
| 9 | 8 | 2 Privates (4), 1 Scout (3) | 15 | 1 | Growth of three |
| 10 | 7 | 2 Scouts (6) | 17 | 1 | Two more Scouts |
| 11 | 7 | 1 Medic (3), 2 Privates (4) | 20 | 0 | Tent 2 full |
| 12 | 6 | Save for Tent 3 | 20 | 6 | Goal bar shows Tent 3 |
| 13 | 6 | Save | 20 | 12 | Goal bar is almost full |
| 14 | 6 | Tent 3 (15) | 20 | 3 | Third tent; cap 30 |
| 15 | 6 | 3 Privates (6) | 23 | 3 | Three Privates |
| 16 | 6 | 3 Scouts (9) | 26 | 0 | Three Scouts |
| 17 | 6 | 2 Privates (4) | 28 | 2 | Two Privates |
| 18 | 6 | Kit I for Privates (5) | 28 | 3 | Every Private gets a helmet at once |
| 19 | 6 | 2 Medics (6) | 30 | 3 | Army hits cap 30 |
| 20 | 6 | Save for Tent 4 (20) | 30 | 9 | Goal bar shows Tent 4 |

Notes:
- Every Round except 2, 6, 12, 13 and 20 adds a soldier or a type. The gap rounds (6, 12, 13, 20) show the Goal bar filling; that is the "saving" moment. Round 2 gives the Scout unlock as the visible change.
- Cumulative spend by Round 20 is 111 Bolts with 9 saved (120 earned).
- Rounds 21 to 40 (est.): Tent 4 and 5, Drummer and Grenadier unlocks, Kit I for Scouts and Medics, first Team Colours, Banner I.
- Rounds 41 to 90 (est.): Sergeant, Jeep, Mortar, Tank unlocks; Kit II and III; General's hat; the rest of the Tents.
- Rounds 91 to 180 (est.): Kit III across types, Word Locks for Golden Sergeant and Mega Tank, the last Colours.

---

## 4. The Show Off moment for an army

The Show Off stage is where the army is seen as a whole. Options, scored for fun and build effort (both est.).

| Option | Fun for a 6-year-old | Build effort | Verdict |
|---|---|---|---|
| **Parade**: the army marches past in rows behind the General and the drummer; a crowd cheers; tap a figure and it salutes or hops | High; every figure is seen | Low to medium: a walk cycle from scaled boxes and a bob; drum beat is prerecorded | **Phase 1 default** |
| **Formation taps**: tap a button to switch line, wedge or square; the army moves into it | Medium-high: he changes the shape | Medium: a target position per figure per formation | **Phase 1** (three formations) |
| **Battle**: a toy battle against a row of tin cans or training dummies; hits knock them over, they poof into confetti and bounce home | Very high: physics is the most fun | High: physics (cannon-style rigid bodies), balance, reset logic | **Phase 2** |
| **Word formation**: the army marches into the shape of a word (GO, UP) | Medium: novelty; the shape is the reward | Medium-high: a 3x5 letter font, a position solver; he must read it | **Phase 2 or 3**; ties learning to reward |
| **Drums and march music**: a short march loop, drum on each recruit, a bugle on Tent | High for the sound, almost free | Low (audio) | **Phase 1** |
| **Command tiles**: 5 to 6 big words on the stage; he taps one and the army does it | High; he is in charge | Medium-low: one action per word | **Phase 1** (see section 5) |

Recommended Show Off: **Parade** with drum and bugle, plus **Formation taps** (line, wedge, square) and **Command tiles** for a few words. Battle and Word formation come after launch.

Reduce Motion: a still parade (figures stand and salute, no marching) when Reduce Motion is on. (Product rule [PRODUCT.md].)

---

## 5. How the army ties into reading (sight words)

### 5a. Dolch words that work as commands

The Dolch list has 220 "service words" [src: Wikipedia Dolch word list]. Pre-primer (40), Primer (52) and 1st grade (41) are listed in the source. Here are the words a command could use, with a check of whether the army can do something clear with it.

| Word | Dolch list | Command it could give | Usable? |
|---|---|---|---|
| go | Pre-primer | GO: the army marches forward | Yes, strong |
| run | Pre-primer | RUN: quick march | Yes |
| jump | Pre-primer | JUMP: everyone hops | Yes |
| stop | 1st grade | STOP: halt | Yes; a later Level |
| look | Pre-primer | LOOK: heads turn, salute | Yes |
| come | Pre-primer | COME: the army rallies to the General | Yes |
| up | Pre-primer | UP: stand, arms up | Yes |
| down | Pre-primer | DOWN: kneel, take cover | Yes |
| help | Pre-primer | HELP: Medics run to a knocked-over figure | Yes |
| walk | 1st grade | WALK: slow march | Yes |
| ride | Primer | RIDE: Privates climb in the Jeep | Yes, if Jeep is unlocked |
| play | Pre-primer | PLAY: the army dances | Weak (fun, not a clear action) |
| make | Pre-primer | No clear action | Weak |
| see | Pre-primer | Redundant with LOOK | No |
| find | Pre-primer | FIND: search the mat | Marginal |
| fly | 1st grade | FLY | No: overlaps with the aircraft games |
| take, give, put, open, ask, think, know, let, live, thank | 1st grade or Primer | Abstract | No, mostly |

Best command set (est.): **GO, RUN, JUMP, STOP, UP, DOWN, COME, LOOK**, with HELP and WALK later. Those are all pre-primer or first grade and are actions a 6-year-old can see.

Avoid: shoot, fire, attack, charge (not Dolch, and kill-adjacent wording).

### 5b. The idea evaluated

**What works:**
- He reads the word aloud or hears it (the voice comes first, per PRODUCT.md), taps it, and the army does the action. The action is the feedback.
- The words are the ones the sight-word game is already teaching, so it reinforces them.
- No penalty. A command is never wrong; it is a toy.

**What to watch:**
- It must not become a test on the reward. Bolts and Tents must never depend on reading a command, or the reward turns into a reading exam. Keep Bolts on the Rounds.
- Repetition matters. A widely repeated figure says a word needs about 20 to 30 exposures before it is automatic, but I found no primary study behind that number [src: childhood101.com]. A university literacy resource says repeated practice is needed and that new words should come slowly and alongside phonics [src: University of Iowa IRRC]. So: a small set of commands (about 8), repeated, is the right size (est.).
- Do not put a command on the Show Off until he has mastered the word in the game. Otherwise he is guessing at a word, which the product avoids (est.; the parent's own rule about never boards that need guessing [memory: Purrdoku preferences] suggests the same house style).

**Word Lock (legendaries):** read a word he has mastered, from three read aloud. The word list comes from his Mastered words only. Never a guess.

**Verdict:** Yes, adopt it as a Show Off feature with 8 commands, and as the Word Lock for legendaries. It is the strongest reading tie-in in the list.

---

## 6. Recommendation summary

**Theme:** Green plastic toy soldiers on a tan play-mat (toy box, not war). Team Colours: Army Green (free) plus 11 others.

**General:** the commander at the front, with a hat slot (5 / 15 / 30) and a sash in Team Colour.

**Unit roster (12):**

| # | Unit | Name (spoken) | Line (voice clip) | Unlock | Recruit | Kit (5/15/30) |
|---|---|---|---|---|---|---|
| 1 | Rifleman | Private Pip | "Pip is ready!" | Free | 2 | Yes |
| 2 | Runner | Scout Zip | "Zip zooms!" | 6 | 3 | Yes |
| 3 | Medic | Medic Patch | "Patch fixes it!" | 8 | 3 | Yes |
| 4 | Grenadier | Bounce | "Bounce!" (soft ball lob) | 10 | 3 | Yes |
| 5 | Drummer | Boom | "Boom boom!" | 10 | 3 | Yes |
| 6 | War Dog | Biscuit | "Woof!" | 12 | 4 | Yes |
| 7 | Sergeant | Sergeant Stripe | "Stripes says: stop!" | 15 | 4 | Yes |
| 8 | Jeep | Jumper | "Jumper, go!" | 20 | 6 | Yes |
| 9 | Mortar | Mini Mortar | "Pop!" | 25 | 6 | Yes |
| 10 | Tank | Tread | "Rumble!" | 30 | 8 | Yes |
| 11 | Legendary | Golden Sergeant | "Gold shines!" | Word Lock (after Sergeant Kit III) | Free to recruit after unlock | Kit not separate |
| 12 | Legendary | Mega Tank | "Mega rumble!" | Word Lock (after Tank Kit III) | Free to recruit after unlock | Kit not separate |

The voice clips are all lines to record (est.); they should be short and read like the other games (the product voice rule [PRODUCT.md]).

**Slots and upgrades:**
- Kit per unit type (3 rungs: helmet, shoulder pads and pack, gold stripe and flag).
- Banner (3 rungs: stripe, badge, flapping flag).
- General's hat (3 rungs).
- Team Colour: Army Green free; 11 others at 3 Bolts.
- Tents: 1 free (10 places), then 10 / 15 / 20 / 25 / 30 Bolts, to 60.

**Pacing:** a visible change in most Rounds, the Goal bar filling in the gaps, about 1,070 Bolts in total (est. 2.5 to 3 months).

**Show Off:** a **Parade** (drum and bugle; figures march in rows behind the General and salute when tapped). Formation taps: line, wedge, square. Command tiles: GO, RUN, JUMP, STOP, UP, DOWN, COME, LOOK, read aloud. Phase 2: toy battle with knocked-over figures that poof and bounce home, and word formations.

**Glossary terms to add (if built):** Recruit, Unit type, Kit, Tent, Banner, Word Lock, Parade.

---

## 7. Gaps and caveats

- Clash Royale's current costs are unclear (sources conflict on the level cap and Gold costs).
- No primary study of children and army-building games was found. Child-appeal claims are reviews and judgement (est.).
- The Dolch exposure figure (20 to 30) is widely repeated but unverified.
- Lego, Army of Two and Age of Empires for kids were not researched in depth; those points are (est.).
- All Bolt numbers assume about 6 Bolts per Round; real play is lower (about 5), so the table stretches by roughly 20 percent (est.).

---

## Sources

- [src] Wikipedia, Dolch word list: https://en.wikipedia.org/wiki/Dolch_word_list (word lists for pre-primer, primer and 1st grade; 1936 and 1948 publication details)
- [src] Wikipedia, Pikmin (video game): https://en.wikipedia.org/wiki/Pikmin_(video_game) (100-Pikmin cap; Pikmin lost at day's end; Onion makes new seeds)
- [src] PikminWiki, Onion menu (cap and Onion notes): https://www.pikminwiki.com/Onion_menu
- [src] Supercell, Clash Royale "coming in the next update": https://supercell.com/en/games/clashroyale/blog/news/coming-in-the-next-update
- [src] Timesaver, Clash Royale card levels explained (September 2026, third-party): https://timesaver.gg/blog/clash-royale-card-levels-explained-september-2026
- [src] Clash of Clans Wiki, Army Camp: https://clashofclans.fandom.com/wiki/Army_Camp
- [src] Kingdom Rush Wiki, Upgrades: https://kingdomrushtd.fandom.com/wiki/Upgrades
- [src] Gamezebo, Count Masters strategy guide: https://www.gamezebo.com/walkthroughs/count-masters-crowd-run-3d-strategy-guide-nail-the-math-with-these-hints-tips-and-cheats-2/
- [src] App Store, Count Master: Crowd Runner: https://apps.apple.com/app/id6447996068
- [src] Nintendo, Mob Control: Complete Edition: https://www.nintendo.com/store/products/mob-control-complete-edition-switch
- [src] TurboGeek, Totally Accurate Battle Simulator review: https://www.turbogeek.co.uk/?p=9345
- [src] PC Gamer, "Why I love ragdoll physics": https://www.pcgamer.com/uk/why-i-love-ragdoll-physics
- [src] University of Iowa IRRC, Teaching sight words (2018): https://irrc.education.uiowa.edu/blog/2018/06/teaching-sight-words-part-comprehensive-reading-instruction
- [src] childhood101, What are sight words: https://childhood101.com/what-are-sight-words/ (exposure figures, unverified)
- [memory] Purrdoku player preferences (house style: no boards that need guessing): /Users/seancampbell/.claude/projects/-Users-seancampbell-campbellcloud/memory/purrdoku-player-preferences.md
- Repo: /Users/seancampbell/.t3/worktrees/campbellcloud/t3-6bc26ef9/GLOSSARY.md, PRODUCT.md
