# Spec: Deep Light (light and sound, a submarine in the dark sea)

Status: built on 2026-11-18 (pass 1 of 3: the build), playable at `/deep-light/` with a tile on the landing page after Dino Dig. Every
decision below is a **default for the parent to confirm**. Not yet run on a real iPad. "Deep Light" is the brief's working name.

A new learning game on the family site, built the same way as Hook and Ladder and Wild Rescue (`src/hook-and-ladder/`,
`src/wild-rescue/`), for the same player (6, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed
Rounds earn Bolts and a Dive. Bolts buy submarine parts; better parts open deeper zones. On a Dive he steers through the dark sea and
photographs real deep-sea animals for his Logbook, which says each one's name and one true fact.

## What he learns, and which standard each kind serves

Researched 2026-11-18 (sources at the end).

- **NGSS 1-PS4-1**: "Plan and conduct investigations to provide evidence that vibrating materials can make sound and that sound can make
  materials vibrate." Clarification: tuning forks, a plucked stretched string; paper near a speaker.
- **NGSS 1-PS4-2**: "objects in darkness can be seen only when illuminated." Clarification: a dark room, a cave explorer with a
  flashlight; "Illumination could be from an external light source or by an object giving off its own light." DCI PS4.B: "Objects can be
  seen if light is available to illuminate them or if they give off their own light."
- **NGSS 1-PS4-3**: "determine the effect of placing objects made with different materials in the path of a beam of light."
  Clarification: transparent (clear plastic), translucent (wax paper), opaque (cardboard), reflective (a mirror). DCI PS4.B: "Some
  materials allow light to pass through them, others allow only some light through and others block all the light and create a dark
  shadow on any surface beyond them... Mirrors can be used to redirect a light beam." Boundary: no speed of light.
- **NGSS 1-PS4-4**: "design and build a device that uses light or sound to solve the problem of communicating over a distance."
  Clarification: a light source to send signals, cup-and-string telephones, a pattern of drum beats. DCI PS4.C.
- **TEKS**: the 2021 Grade 1 science TEKS (19 TAC §112.3) have **no light or sound strand**: Grade 1's energy strand is heat ((b)(8)).
  Texas teaches this content in **Kindergarten** (§112.2 (b)(8)(A) "objects can only be seen when a light source is present"; (b)(8)(B)
  "light travels through some objects and is blocked by other objects, creating shadows") and **Grade 2** (§112.4 (b)(8)(A) sound is
  made by vibrating matter; (b)(8)(B) levels of sound, "a whisper in a classroom or a fire alarm"; (b)(8)(C) a device that uses sound to
  communicate over a distance; (b)(9)(A) "the Moon reflects the Sun's light"). So the kinds follow NGSS and touch both sides of Texas's
  first grade.

## Kinds

Six kinds, three Levels each. Everything is a tap (the Shadows lesson also lets him drag the lamp).

| Kind | Standard | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|---|
| **Light to See** `see` | 1-PS4-2; TEKS K.8A, 2.9A | start | Two caves, one lit: "In which cave can you see the crab?" (crab, fish, octopus, turtle, shrimp) | "Tap everything that makes its own light. Then tap the check." 4 to 6 things, 1 to 3 that do | "Why can't you see the crab?" three spoken reasons; or "Which one makes its own light?" sun or moon; or the tap-all with the moon among them |
| **Through or Not** `through` | 1-PS4-3; TEKS K.8B | start | "Which one lets the light through?" / "Which one blocks the light?": one clear, one solid (never a "some") | Sort three (one of each) into Lets all the light through / Lets some light through / Blocks the light | "What will the wall look like?" A bright spot, a dim glow, a shadow (the lesson meets transparent, translucent, opaque) |
| **Shake and Sound** `sound` | 1-PS4-1; TEKS 2.8A, 2.8B | start | "Which one is loud?" / "...quiet?": two pictures with rings | "Tap the one that is shaking": three things, one drawn shaking | "The string stops shaking. What happens to the sound?"; "You hit the drum harder..."; "The speaker plays a loud sound. What does the paper next to it do?" (three spoken choices) |
| **Shadows** `shadow` | 1-PS4-3 (shadow DCI); TEKS K.8B | Through or Not L2 | Which shadow belongs to it? two silhouettes | The lamp is on one side: tap where the shadow will be | "Which lamp made this shadow?" three lamps (left, top, right) |
| **Mirrors** `mirror` | 1-PS4-3 (mirrors DCI) | Light to See L2 | "Which one bounces the light?" a mirror or a solid thing (never glass) | Turn one mirror until the beam lights the gem, then ✓ | Two mirrors; or which of three spots the mirror must go in |
| **Signals** `signal` | 1-PS4-4; TEKS 2.8C | Mirrors L2 and Shake and Sound L2 | "It is dark, and your friend is far away. What can you use to say hello?" (a flashlight; behind a rock, a horn) | Copy the lighthouse's short and long flashes (3, or 4 at Stretch 2), then ✓ | "Count the flashes. What did the lighthouse say?" with the key: one flash hello, two come here, three stop |

Defaults to confirm: the kind names; Signals needing both Mirrors and Shake and Sound; the school words only in a Level 3 lesson (NGSS
uses them in its own first-grade clarification); "a horn" being the right answer behind the rock (a whisper isn't offered there).

### Rules the tests enforce (`science/problems.test.ts`)

- **Exactly one choice is right, in every kind and Level**, judged from the picture's own rules (thousands of generated questions):
  every tap, every setting of the mirrors, every pattern of flashes, every sort is tried and only the marked one passes.
- **One piece of ray code** (`science/optics.ts`) both decides the answers and draws every beam: the mirror lab is a grid, the lamp
  shines in one of eight directions, mirrors turn in steps of 45° and bounce the beam angle-in-equals-angle-out (edge-on stops it). A
  mirror puzzle is generated, then every setting is tried, and it's kept only if exactly one lights the gem. The answer check for the
  mirror kinds asks the same ray code, not a stored string. The beam through a material, the wall's look and every shadow come from the
  same file.
- **The moon is never offered at Levels 1 and 2** (it isn't in `LIGHT_THINGS` at all); at Level 3 it appears in the tap-all (never
  counted as making light) and in "sun or moon", with its own lesson: "The moon does not make its own light. Light from the sun bounces
  off it." (NASA.)
- **Shadows never shows two things whose shadows could look alike**: each thing has a silhouette class (fish, whale and dolphin are all
  "fish"; crab and lobster "claws"; octopus and squid "arms"; shell and snail "spiral"; duck and penguin "bird"), and a question never
  shows two from one class.
- **Every sound is shown, not only heard**: rings round a sound are big for loud and small for quiet; a shaking thing is drawn blurred and
  jiggling with rings (sand jumps on a drum). Each loud/quiet pair is one loud and one quiet; one shaker of three is shaking.
- **"Lets some light through" is only wax paper, frosted glass and tissue paper** (`MATERIALS`, hand-checked). The brief's "a thin leaf"
  is left out: how much light a leaf lets through depends on the leaf, and no source gave it as a clean classroom case.

## Teaching a miss

Never a red X; what he tapped fades. The lesson shows it happen on the question's own picture and says one short line
(`science/teach.ts`):

- **Light to See**: the dark cave's lamp switches on and the animal appears ("We see things when light shines on them."); the things
  that make their own light glow; the sun's ray goes to the moon and bounces to us (the moon line).
- **Through or Not**: the beam runs from the lamp to the thing and stops, carries on dim, or carries on bright, and the wall shows a
  shadow, a dim glow or a bright spot ("The light stops." / "Only some light gets through." / "The light goes through.").
- **Shadows**: the shadow appears beside its thing ("The shadow has the same shape."); the lamp swings to the other side and the shadow
  swings with it ("The shadow falls on the side away from the lamp.", "Move the lamp, and the shadow moves too.").
- **Mirrors**: the lamp shines at the other thing (it stops) and at the mirror (it bounces up); the mirror turns step by step to the
  answer and the beam swings with it, then goes back for him to turn; each spot is tried until the gem lights.
- **Shake and Sound**: the rings pulse; the string is plucked, shakes and hums, then stops and the sound stops ("When the shaking stops,
  the sound stops.").
- **Signals**: the flashlight's beam reaches the friend in the dark, or sound waves go round the rock; the lighthouse flashes again,
  each flash counted aloud, then the key is said.
- **Second miss** (or the first when he's been missing a lot, or 🔎, which counts as help): the same, slower, then the stage is his: a
  big button to switch on the lamp, shine the light, pluck the string or flash the light, or the lamp to drag (Shadows), for up to nine
  seconds (twelve for dragging), before "Try again!". At Level 3 of Through or Not the fuller lesson says the school word.
- A missed question comes back later in the Round as a fresh one with no Mastery credit (shared `mix.ts` pattern).

## Rounds and Mastery

As Hook and Ladder: five answers, mixed across every open kind, never the same kind twice running while there's another; about one in
three (and always the one after a miss) is easier and doesn't count; a starred kind comes back about once a Round. 16 of the last 20
right first try, or 10 in a row; the first 30 of a kind use the quick rule (8 of 10, or 6 in a row). No Tune-Up. Bolts: one per first-try
answer plus one for finishing (`boltsFor`). A Round resumes after a reload (`deep-light-place`).

## The reward: the Dock, the Dive and the Logbook

**The loop.** A finished Round earns Bolts and one Dive. He starts with one free Dive, so he sees the sea before his first purchase. A
Dive photographs animals for the Logbook and picks up treasure (**1 Bolt each, 3 treasures a Dive**). Bolts buy parts; better parts open
deeper zones. One Dive per Round. A Dive is used, and paid, only when it ends; leaving halfway (🏠 twice) costs nothing.

**The Dock** (`dock/DockScreen.tsx`): his submarine on the water by the pier (what he's trying on shows on it), the things he bought for
the Dock along the pier, the zone map (tap an open zone to dive there next; a locked one says what it needs), the big Dive button, and
the tray in tabs. As Hook and Ladder's Station: a tile he doesn't own goes on the submarine to try, with Buy beside it; buying fits it;
the Goal is the cheapest part that changes the Dive, or the one he tapped and couldn't afford.

**What there is to earn: 150 things for 2,775 Bolts, plus 60 animals and the treasure.**

| Tab | Items (buyable) | Bolts in all | What it does |
|---|---|---|---|
| Hull | 7 (6): Starter, Strong 10, Steel 20, Deep 32, Titan 48, Super 68, Ultra 90 | 268 | Each Rung opens deeper zones |
| Headlights | 6 (5): 8, 16, 26, 40, 60 | 150 | Reach 300 → 640, half-width 0.36 → 0.66 rad |
| Sonar | 6 (5): 8, 16, 28, 44, 64 | 160 | Ping reach 380 → 960, every 4.5 → 2.2 s |
| Motor | 6 (5): 6, 14, 24, 38, 56 | 138 | Speed 230 → 450 |
| Claw | 6 (5): 6, 12, 22, 34, 50 | 124 | Grab reach 80 → 235 |
| Camera Flash | 5 (4): 12, 24, 40, 60 | 136 | 1, 2, 3 or 5 flashes a Dive |
| Paint | 25 (24), 4 to 20 | 219 | Colours and patterns |
| Glow Stripes | 16 (15), 5 to 30 | 200 | Lines that glow in the dark sea |
| Light Colors | 14 (13), 4 to 25 | 130 | The headlight beam's colour |
| Horns | 12 (11), 4 to 25 | 145 | A toot; on a Dive, animals near him wiggle (sound makes things move) |
| Buddy | 17 (16), 6 to 75 | 443 | Who rides in the window |
| Bubble Trails | 12 (11), 4 to 30 | 151 | What streams out behind |
| The Dock | 30, 4 to 60 | 511 | Things on the pier |

No price is over 100 (the voice's numbers). The brief's slots are all here (Hull, Headlights, Sonar, Motor, Claw, Paint, Glow Stripes,
Buddy) plus its extras (light colours, glow patterns, horns, camera flash); Bubble Trails and Dock things are added to reach ~150.

**Zones** (`sea/zones.ts`), each darker: the Sunlit Reef (Hull 0, dark 0.18), the Twilight Zone (Hull 1), the Shipwreck (Hull 1 and Claw
1), the Midnight Zone (Hull 2, 0.93), the Crystal Cave (Hull 3 and Sonar 2; crystals bounce his beam like mirrors), the Hot Vents (Hull
4), Under the Ice (Hull 5 and Headlights 3), the Deep Trench (Hull 6, 0.97). A Dive goes where he picked on the map, else the deepest
open zone with an animal he hasn't photographed. Cheapest path to the trench: 268 Bolts of Hull; every zone needs 268 + 12 + 16 + 26.

### More rewards, and his own submarines (2026-11-21)

The parent asked to "increase the rewards and allow him to choose and build his own submarines". As in Rover Code, Treasure Fleet and
the others, that was taken as **more to earn, not bigger payouts**: Round pay, treasure and every old price are unchanged. Defaults for
the parent to confirm are marked ⚑.

**Now: 249 things for 6,418 Bolts (was 150 for 2,775), 76 animals in ten zones (was 60 in eight), and 12 submarines to build.**

- **Submarines** (`dock/subs.ts`, the first tab): the free Explorer Sub (the one he had), then Mini 15, Duck 20, Bubble 30, Torpedo 40,
  Turtle 50, Manta 60, Whale 70, Shark 80, Angler 85, Octo 90 and Dragon 100. Each is drawn with its own body (`art/sub.ts`, a Frame of
  where every piece joins it) and has a **trick** on a Dive, said when he taps it ⚑: Mini turns twice as quickly, Duck's horn reaches
  twice as far, Bubble has a soft light all around it (210 units), Torpedo is 25% faster, Turtle has one more camera flash (even with
  No Flash), Manta's light is 30% wider, Whale's sonar reaches 35% farther, Shark's claw 40% farther, Angler's light 25% farther, Octo
  takes pictures in about half the time, Dragon is 15% faster and its light 15% farther. A trick never opens a zone and never pays more.
- **Building** (`art/pieces.ts`): four new tabs, each piece drawn to fit every submarine. **Noses** 12 (Round free, Bumper 5 … Unicorn
  Horn 60), **Tails** 11 (Propeller free … Rainbow Jet 65), **Fins** 11 (Little free … Glow Fins 60), **Tops** 11 (Tower free … Crown
  50). Jets, boosters, the Crystal Nose, the Antenna, the Lighthouse Top and Glow Fins shine in the dark on a Dive.
- **Each submarine keeps its own build and looks** (nose, tail, fins, top, paint, stripes, light colour, horn, buddy, bubbles): switching
  submarines swaps them (`DockState.sub`, `builds`; `fitted` is always the one he dives in). The parts that open zones (Hull,
  Headlights, Sonar, Motor, Claw, Flash) are shared by all. A new submarine comes in **Its Own Colors** (a new free Paint) with the
  starter pieces ⚑. Buying a submarine puts him in it.
- **More of the rest**: 11 paints (Polka Dots … Diamond 50), 4 glow stripes, 4 light colours, 5 horns (Siren, Laser Zap, Drum Roll, Sea
  Lion Bark, Ice Cream Song), 10 buddies (Bunny 36 … Unicorn 90), 4 bubble trails, 10 Dock things (Stone Head 35 … Roller Coaster 100).
- **Two zones** (`sea/zones.ts`), shallow and sunlit but far from the Dock, so they need a **faster Motor, not a Hull** ⚑ (a stronger
  Hull still means deeper): **the Kelp Forest** (Motor 1, swaying kelp; Sea Otter, Garibaldi, Leopard Shark, California Sea Lion, Bat
  Ray, Wolf Eel, Giant Sea Bass, California Sheephead) and **the Open Ocean** (Motor 3, sun rays and no rocks; Blue Whale, Whale Shark,
  Sailfish, Ocean Sunfish, Flying Fish, Portuguese Man o' War, Leatherback Turtle, Yellowfin Tuna). Facts checked on 2026-11-21 against
  the pages in `sea/animals.ts` (Monterey Bay Aquarium, NOAA, Oceana, the National Park Service, Wikipedia). New line: "You need a
  faster Motor to go there!"
- **Dock**: 18 tabs in two rows (the build row teal, the Submarines tab showing his submarine), the zone map ten wide (five on a phone).
  Tiles and the Dock fit each submarine to its own size (`art/Pics.tsx` measures each drawing once).
- **Save**: still version 1; an old save reads as the Explorer Sub looking exactly as it did. 156 new clips (Aria), not yet heard by a
  person and not machine-transcribed (no recogniser on the Mac): listen first to the new animal names (Garibaldi, California Sheephead,
  Portuguese Man o' War), Narwhal Tusk, Crow's Nest and Its Own Colors.
- **Checks**: a test plays a Dive in every zone with every submarine, starter and best parts; `tools/deep-light/subs-sheet.ts` draws every
  submarine and piece for checking by eye.

**The Dive** (`dive/sim.ts`, `dive/draw.ts`, `dive/DiveScreen.tsx`): 2D canvas, about 60 seconds, then the submarine rises by itself.
He holds a finger and the submarine follows it, its headlights pointing where it's going. Outside the cone the sea is dark (by the
zone's darkness), so he sees only what his light touches, plus the animals that make their own light, whose glow shows in the dark (the
Light to See lesson again: "You can see it because it makes its own light!"). Holding the light on an animal for 0.9 s fills a ring and
takes its photo ("A new animal!" and its name). Sonar pings by itself every few seconds (📡 pings now): the ring outlines everything it
passes that his light isn't on ("Your sonar found something!"). The Claw picks up treasure he passes close to. 📯 toots his horn; 📸
(once bought) lights the whole sea for a moment and photographs everything near. Nothing chases him and nothing can hurt him: the
edges only nudge him back. Six animals a Dive, those he hasn't met first, so an early Dive almost always meets someone new (tested).

**The Logbook** (`dock/LogbookScreen.tsx`): a page per zone, a frame per animal; one found shows in colour and tapping it opens it big
and says its name and fact; one not found is a dark shape ("Not found yet!").

### Drawing the dark (the brief's first risk), measured 2026-11-18

A prototype (`.scratch/deep-light/proto/`) drew a sea (gradient, 24 fish, 60 motes), a moving cone of light, glows and a sonar ring
three ways, timed in headless Chromium with the CPU throttled 4× (a rough iPad 9 stand-in), at 1080×810 and 810×1080:

| Approach | 2× pixels: JS per frame / frame interval | 1× pixels |
|---|---|---|
| A: an offscreen dark layer, the cone erased (destination-out), drawn over the sea | 7.6 ms / **23 ms** (≈43 fps) | 1.9 ms / 16.7 ms |
| B: the same at quarter size, scaled up | 1.0 ms / **44 ms** (≈23 fps: the scaling costs the GPU) | 0.2 ms / 16.7 ms |
| C (chosen): **one even-odd fill over the screen with the cone cut out, and a gradient inside the cone's far end**, drawn straight on the canvas | 0.2 ms / **16.7 ms** (60 fps) | 0.1 ms / 16.7 ms |

The game uses C. Animals are drawn once into sprites per Dive and stamped. In the real game (`tools/deep-light/perf.ts`, which seeds the
most costly look, the brightest parts and the Crystal Cave, and `?skip=` in dev to leave layers out) three more costs turned up and were
cut:

- **A full-screen gradient for the water** cost more than everything else together (39 fps unthrottled at 2×; 60 without it). The water
  is now one solid colour, the zone's top and bottom colours mixed by the camera's depth.
- **A gradient over the whole cone, and an additive wash of the headlight's colour over it**, each cost as much again under throttling.
  Now the gradient (tinted the headlight's colour, the Light Colors items) covers only the cone's outer band.
- **Adaptive resolution**: if the Dive runs under 50 fps for two seconds, its canvas steps down from 2× to 1.5× to 1× pixels.

Measured after (headless Chromium, software raster, so pixel fills are slower than on an iPad's GPU and the throttle slows them too):

| Where | Unthrottled | CPU 4× slower |
|---|---|---|
| Crystal Cave, 1080×810, 2× | 60 fps at 2×, drawing 0.22 ms a frame | ~50 fps after stepping to 1.5× (39 fps if held at 2×), drawing 1.2 ms a frame |
| Crystal Cave, 1080×810, 1× | 60 fps | 60 fps, drawing 0.9 ms a frame |
| Midnight Zone, 810×1080, 2× | 60 fps | 57 fps at 2× |

Every tour run (1×, unthrottled, all four sizes) holds 60 fps through the whole Dive, its drawing 0.2 to 0.35 ms a frame on average.
What most needs the real iPad 9: whether Safari's GPU canvas holds 60 fps at 2× in the Crystal Cave, and whether the step down to 1.5×
ever happens there (it would show as a slightly softer picture).

## The animals and their facts

Sixty real animals (`sea/animals.ts`), 6 to 9 per zone, each drawn in code in one friendly style (round body, big round eyes with a
shine, a little smile, teeth as soft rounded nubs). The anglerfish was drawn first: `.scratch/deep-light/anglerfish.png`
(`npx tsx tools/deep-light/gallery.ts <out.png> [id]` draws any or all). Each fact was checked against its page on 2026-11-18 by fetching
the page and reading the sentence it rests on; a fact was reworded or the source changed where the page said something narrower (the
Greenland shark "may live for more than one hundred years", Oceana says "well over 100 years"; the giant squid has "some of the biggest
eyes", Wikipedia says the largest except perhaps the colossal squid; the phantom jelly's arms are over 10 m, "longer than two cars", not
"a school bus"). Pages that blocked fetching (Smithsonian Ocean) were replaced by ones that didn't. Sources, by zone:

- **Reef**: clownfish, green turtle, queen parrotfish, longsnout seahorse, giant manta ray, blue tang, Caribbean reef octopus (oceana.org);
  giant clam (Wikipedia).
- **Twilight**: lanternfish, marine hatchetfish, Ctenophora (comb jelly's rainbow is scattering, not its glow), firefly squid, swordfish
  (Wikipedia); crystal jelly (Monterey Bay Aquarium); barreleye (MBARI); sperm whale (NOAA Fisheries).
- **Midnight**: deep-sea anglerfish (oceana.org), tan bristlemouth (oceana.org); vampire squid, whiptail gulper eel, Pacific viperfish,
  giant phantom jelly (MBARI); Malacosteus niger (stoplight loosejaw's red light), Atolla wyvillei ("alarm jellyfish"), giant squid
  (Wikipedia).
- **Shipwreck**: Atlantic goliath grouper, green moray eel (the yellow mucus), red lionfish (13 spines) (oceana.org); Caribbean spiny
  lobster, sea anemone, nudibranch, giant Pacific octopus (Wikipedia).
- **Crystal Cave**: flashlight fish, Pacific purple sea urchin, Hawaiian bobtail squid (oceana.org); Monocentridae (pinecone fish), cleaner
  shrimp, sea cucumber (cloacal respiration), cardinalfish (male mouthbrooding) (Wikipedia).
- **Hot Vents**: Riftia pachyptila, Kiwa hirsuta, Rimicaris exoculata (dorsal eyespot), Chrysomallon squamiferum (iron sulphide shell),
  Bathymodiolus (Wikipedia); Pompeii worm (MBARI). (A vent octopus was dropped: no page gave a simple fact that could be checked.)
- **Under the Ice**: narwhal, beluga ("canaries of the sea"), Greenland shark (oceana.org); Antarctic krill (its light organ), Weddell seal
  (dives up to an hour), emperor penguin (about 20 minutes under), Channichthyidae (colourless blood), Clione limacina (Wikipedia).
- **Trench**: dumbo octopus (oceana.org); snailfish (the deepest records), Alicella gigantea (to 34 cm, "longer than a ruler"),
  Bathypterois grallator, giant isopod (related to woodlice), Macrouridae (rattails) (Wikipedia); sea pig (MBARI).

Each animal's exact URL is in its `source` field. Defaults to confirm: the selection; "a dad seahorse/cardinalfish"; the nudibranch's
"loses its shell when it is a baby" (the source says after its larval stage); "the anglerfish has a glowing lure" (its light is made by
bacteria living in the lure; the game counts the anglerfish as something that makes its own light, as NGSS's "an object giving off its
own light" allows; the parent may prefer the firefly squid there instead).

### Other science sources

- NGSS 1-PS4-1 to 1-PS4-4 and DCIs: nextgenscience.org performance expectation pages.
- TEKS: 19 TAC §112.2 (K), §112.3 (Grade 1), §112.4 (Grade 2), via law.cornell.edu.
- The moon: NASA Space Place, "All About the Moon" (spaceplace.nasa.gov/all-about-the-moon) and science.nasa.gov/moon ("The Moon does not
  make its own light"; moonlight is reflected sunlight).
- Lets some light through: NGSS 1-PS4-3 (wax paper); frosted glass and tissue paper as translucent in classroom materials (Harvard
  Project Zero "Light Play: Translucent Materials", Education.com flashlight activity, Varsity Tutors 1st-grade lessons).
- Louder is a bigger shake; the sound stops when the vibration stops: The Physics Classroom ("Intensity and the Decibel Scale").
- Lighthouses each have their own flash pattern: NPS Cape Lookout "Lighthouse for Kids", Britannica "lighthouse: character of lights".
  (The game's one/two/three-flash key is a made-up key, as a classroom would make one.)

## Voice

641 clips (10 MB, in `public/deep-light-voice/`), recorded with `tools/make_voice.py --collection deep-light` (Aria, -8%). Every question,
lesson line, choice that is a word or sentence, item name, tab name, zone name, animal name and fact is its own clip; prices and counts
are chained from number clips. 10 MB is more than Rover Code's 4.3 MB (sixty facts and long science sentences); the site stays well
under its 50 MB budget.

The listen-check (2026-11-18): every clip is real audio (afinfo: 1.9 to 7.8 s with edge-tts's padding; none empty or cut off), and all
541 non-number clips (and 0 to 12) were transcribed with faster-whisper small.en, the doubtful ones again with large-v3-turbo:

- **Fixed by renaming**: "Medal" was heard as "metal" by both models (now "Gold Medal"); "Sea Map" as "CMAP" (now "Treasure Map"); "a
  kitten mew" as "a kitten you" (now "a kitten meowing"); "Abyss Hull" and "Trench Hull" kept ending in "hole" even with a breath before
  "Hull", and "Mega Hull" came out "Make a hole" (now "Super Hull" and "Ultra Hull", heard right by large-v3-turbo).
- **Fixed in `COLLECTION_SPEECH['deep-light']`** (this collection only; no other game's clips changed, their indexes re-check with no new
  or missing clips): "Deep Hull" said as "Deep, Hull"; "You opened Shadows!", "...Signals!" and "...Shake and Sound!" lost their "-ed"
  ("You open shadows") and now have a breath after "opened"; "Barreleye" ("Baralife") is said "Barrel eye"; "Play more Mirrors and Shake
  and Sound to open this!" ran its end together ("openness") and has a breath before "to open this".
- **Heard right by large-v3-turbo, noise from small.en**: Comb Jelly ("cone jelly"), Honk Horn ("HongKong"), Foghorn, Zoom Motor, Lime
  Stripe, Steel/Strong/Titan Hull, "A dad cardinalfish" ("a dead cardinal fish" in small.en), Bristlemouth, Icefish, Cardinalfish.
- **Left for the parent's ear**: Atolla ("Atala"), Weddell ("Weddle", which is how it's said), Nudibranch ("Nudebrank", close to
  NOO-di-brank), Scaly-Foot, Super Hull (small.en "Superhole"; large-v3-turbo right).

## Verified (2026-11-18)

- `npm run typecheck` and `npm run typecheck:pairings` pass.
- `npm test`: Deep Light's 72 tests pass (`science/problems.test.ts`, `learning.test.ts`, `game.test.ts`, `dive/sim.test.ts`,
  `sea/animals.test.ts`, `voice.test.ts`). The whole suite passes; under heavy load from other sessions on the same machine a few other
  games' slow tests hit their 5 s timeout and passed when run again.
- `tools/deep-light/tour.ts` at 810×1080, 1080×810, 390×844 and 844×390, each on a new save (six Rounds, so new kinds open during it),
  and on saves with every kind open at Level 2 and at Level 3: a deliberate miss in every kind, then the same question answered (it
  still takes taps), the end of the Round, a purchase at the Dock, a whole Dive to its end (60 fps throughout), the Logbook, and 🏠 twice.
  No layout problems (nothing off screen, nothing under 44 px, no question that scrolls), no page errors, no two clips at once.
  TOUR_MISS=2 runs (portrait Level 2, phone and landscape Level 3) also played the fuller lessons and tried the lamp, light or string
  himself.
- `npm run build:site`, `npx tsx tools/deep-light/offline.ts` (the production build precaches 655 files, 641 of them voice clips; offline,
  a Round starts, its question is said and the answer counts) and `npm run check:offline` pass.

## Bug and sound review (pass 2, 2026-11-18)

Played every kind at every Level on its own (right, one miss, two misses with the stage handed to him) at all four sizes, the Dive
(doing nothing, mashing with many fingers, leaving and reloading halfway, starter against best parts, every zone), a Round reloaded
mid-lesson, and the sound through a paused audio context, a hidden-and-shown tab and a miss lesson. Fixed:

- **Light to See Level 1: the animal in the lit cave was drawn huge**, spilling over both caves (the choices' emoji size rule reached
  the SVG `<text>` inside the cave). The caves' and the shadow scene's emoji now set their size as a style.
- **A tap on the lamp, light or string while "Tap the lamp!" was still being said was lost**, and he waited out the whole nine seconds
  (the wait only started after the line). It now starts as the button appears (`teach.ts letHimTry`).
- **Mirrors Level 1's beam was a drawn path, not the ray code** (the brief's rule). It's now traced on a small lab (`optics.ts
  bounceLab`).
- **"Which one bounces the light?" could ask the very same picture twice in a row**, which looks as if his answer didn't count (its
  "same thing" key ignored what the mirror was offered against, and the Round gave up looking for a new one after 8 tries).
- **On a Dive with a fast Motor the submarine overshot his finger and turned round**, and it could be drawn facing one way with its
  beam coming out of its tail. It now slows sooner the faster it goes, and always faces where its light points.
- **The little drum tap was the same size as the big bang**, and **the string choice was wider than its tile on a phone** (only one peg
  showed): two more choice rules winning over the sound pictures'.
- **The anglerfish and lanternfish in "makes its own light" were small grey fish on yellow**, nothing saying they make light; they're
  now bigger, on a dark-sea backing where their lights show.
- **On an iPad, a lesson's picture pushed the answers into the bottom band** (30 px from the edge); the question keeps them above it.
  On a sideways phone the Dive's Sonar and Horn sat 36 px from the bottom; they're above the floor now.
- **"Foghorn" was heard as "Falkhorn"** by both speech models; re-recorded said as "Fog horn".

Still left: on a sideways phone the answers sit about 26 px from the bottom (the shared card layout has no room to spare at 390 px tall);
the quiet sounds' small rings are faint; Shadows Level 2 still can't take a second, different miss. Clips for the parent's ear: Comb
Jelly (heard "cone jelly"), Atolla Jelly ("Atala"), Nudibranch ("Neutobranch"), Scaly-Foot Snail ("Skelly"), Super Hull ("Superhole"),
Weddell Seal, Pompeii Worm, Vent Mussel (sounds like "muscle", as it should), Barreleye Fish and the new Foghorn.

## Not done

- Not run on a real iPad 9 or in Safari. Most needs checking there: the Dive's frame rate in the dark zones (the Crystal Cave draws the
  most), holding a finger to steer (and that iPadOS edge gestures don't steal it), SVG emoji (`<text>`) in the caves and shadow scenes,
  CSS `filter:brightness(0)` on emoji for the shadow choices, the voice timing of the lighthouse flashes, and the sideways iPhone layouts.
- No Meetings or Tune-Up (Hook and Ladder has none either).
- The second-miss "do it yourself" for Mirrors Level 2 and 3 is the question itself (turning the mirror); the lesson turns it step by step
  first. Shadows Level 2's second miss on a two-spot question can't be a different wrong answer (the tour only exercises it once).
- The Logbook doesn't yet show which zone's animals he has all found (no badge or star per page).
- The game's art is a first pass; the design pass follows.

## Open questions for the parent

1. Is "Deep Light" the name?
2. Are the anglerfish (`.scratch/deep-light/anglerfish.png`) and the others friendly enough?
3. Should the anglerfish count as "makes its own light" (its lure's light is made by bacteria)?
4. Should the school words (transparent, translucent, opaque) be said at Level 3, or left out?
5. One Dive per Round and the first one free; treasure 1 Bolt each, 3 a Dive: right amounts?
6. Is 2,775 Bolts for everything the right size (about 350 Rounds at 6 Bolts plus treasure)?

## Design pass (pass 3, 2026-11-18)

Judged from screenshots at 810×1080, 1080×810, 390×844 and 844×390 (`tools/deep-light/shots.ts`, which seeds `Math.random` so the
same questions come up every run; before and after in `.scratch/deep-light/design/`). No question, answer, Level, price, payout, save,
ray-code geometry or spoken line changed.

- **Lessons play on full-strength pictures.** The shared "wait" fade (`.card.thinking button`, 50% and desaturated) greyed out the very
  pictures a lesson plays on: the cave that lights up, the fire and anglerfish that glow. Now only the pictures not being taught dim (60%),
  and the taught ones (the hint, a glowing thing, pulsing rings, both caves) stay at full strength. The cave lesson's lamp button sits in a
  small row of its own, so the caves keep their size.
- **Sound is answerable with the volume off.** A quiet sound's one small ring was the same size as its emoji and drawn under it, so it
  was never seen. The sound's picture is now drawn small in the middle of its rings (ring sizes unchanged), the quiet ring is a 4px line
  that never fades below half, and the ship emoji no longer spills out of its box.
- **Materials sit on a little light box** of bright stripes: clear glass shows them, wax paper and frosted glass dim them, wood and metal
  hide them (each sheet's look is unchanged). On the yellow tile, clear glass had looked like a yellow sheet.
- **The lighthouse stands in a night sea**: its flashes were pale yellow on the pale card.
- **Mirrors he can turn have a dashed cyan ring**, and the light lab is bigger when it is the whole question.
- **Sun or moon**: each sits in a little night-sky disc (the moon was yellow on the yellow tile).
- **Tap-all** goes two by two for four things (the fourth sat alone), and a glowing thing glows round its own shape.
- **Sideways phone**: answers now sit 56px or more above the bottom (the reviewer's 26px).
- **Home**: the beam now runs from his headlight to the glowing fish (it pointed at nothing); specks of cyan, lime and magenta and a
  crystal jelly in the dark; the Logbook is a dark album of tilted photos (empty: three dashed "?" frames, not a camera emoji), with its
  count no longer cut off on a phone; My Levels is a dark glass panel with cyan Level bars; a sideways phone puts Play, the biggest thing,
  on the left in three columns (it was the smallest tile).
- **Start**: a glowing fish at the end of his beam.
- **Dock**: his submarine floats in the water by the pier (it sat on the pier line); the Dive button is a deeper teal so its white
  lettering reads; locked places show their picture dimmed with a little lock; the Dive, Logbook and ▶ buttons and Buy sit above the 56px
  floor.
- **Logbook**: every animal fills its frame (a vent mussel was a speck); the card's ✓ was white on white.
- **Round end**: shafts of light from the surface and glowing specks.
- **The Dive**: each zone has its own lit-water colour, so in the Midnight Zone and the Trench the headlight shows blue water instead of
  black (one solid fill as before; no new drawing).
- **Animals**: the dark ones are lighter so they show on the dark sea (manta, viperfish, loosejaw, gulper, flashlight fish, penguin,
  scaly-foot snail and others); the viperfish has soft rounded teeth like a smiling walrus and a light on its back; the loosejaw a red lamp
  under its eye; the flashlight fish a big light under its eye; the hatchetfish a hatchet shape; the gulper eel a big shut grin; the
  vampire squid its cape and ear fins; squids, shrimps, the lobster and worms smile.
- **Icon**: the family's sunburst, in deep-sea blues, spins out from the glowing fish; the yellow submarine climbs in from the lower left
  and its warm beam reaches the fish (cyan with magenta fins and lime lights). Its gradient ids are now `dl-…`: the landing page inlines
  every icon, and another icon's `#glow` had been colouring Deep Light's. The fish's glow is drawn under the beam, so the Home Screen PNG (librsvg, via sharp) keeps the beam warm instead of tinting it
  green.

Checked after: `npm run typecheck`, `typecheck:pairings`, `npm test` (1437 tests), `build:site`, `tools/deep-light/offline.ts`, and the
tour at all four sizes on a new save and on Level 2 and Level 3 saves (no problems; 60 fps through every Dive). The Dive, measured with
`tools/deep-light/perf.ts` (CPU 4× slower, 2× pixels) against a copy of the code before this pass: 60 fps in the Crystal Cave, the
Trench and the Midnight Zone, drawing 0.5 to 0.7 ms a frame both before and after.

Not changed, for the parent: the question card stays the family's pale card (the dark scenes sit on it); the shaker's rings are a big
circle round the small string picture; the mirror key for "where should the mirror go" sits at the stage's top left, away from the lab.
