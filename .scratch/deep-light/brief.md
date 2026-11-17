# Brief: Deep Light (light and sound; build a submarine and explore the dark sea)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Deep Light. Slug: `deep-light`. The name is a working name for the parent to confirm.

## Why this game

Wild Rescue is the site's only science game, and it covers living things and the sky. The other half of first-grade science is light and sound (NGSS 1-PS4): things can only be seen when light reaches them, materials let light through or block it, mirrors bounce it, sound comes from things that shake, and both can carry a message a long way. The deep sea is dark and full of animals that make their own light, so every one of those ideas has a job there.

## What he learns

Research NGSS 1-PS4-1 to 1-PS4-4 and the matching TEKS Grade 1 strand before fixing the kinds, and record which standard each kind serves. Use plain words in the game ("lets light through", "blocks light", "bounces light"); the school words (transparent, opaque, reflect) can be met at Level 3 if the research supports it.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Light to See** `see` | start | two caves, one lit and one dark: "In which cave can you see the crab?" | "Tap everything that makes its own light", then ✓ (sun, torch, fire, anglerfish among things that don't) | "Why can't you see the crab?" three spoken choices |
| **Through or Not** `through`: a beam meets a thing | start | "Which one lets the light through?" clear glass or wood | sort three things: lets all the light through, lets some through, blocks it | "What will the wall look like?" a bright spot, a dim glow or a shadow |
| **Shadows** `shadow` | Through or Not L2 | match a thing to its shadow, 2 choices | the lamp is on the left; tap where the shadow falls | "Which lamp made this shadow?" three lamps |
| **Mirrors** `mirror`: a beam, a mirror, a gem | Light to See L2 | "Which one bounces the light?" a mirror or a rock | tap the mirror to turn it so the beam hits the gem | two mirrors, or pick which of three spots the mirror must sit in |
| **Shake and Sound** `sound` | start | "Which is loud?" / "Which is quiet?" 2 pictures | a drum with sand on it, a string, a bell: "Tap the thing that is shaking" | "The string stops shaking. What happens to the sound?" three choices; then sound making a thing move |
| **Signals** `signal`: messages by light and sound | Mirrors L2 and Shake and Sound L2 | "It is dark and your friend is far away. What can you use to say hello?" | copy a pattern of long and short flashes | a key says two flashes mean "come" and three mean "stop"; the lighthouse flashes; what did it say? |

Rules the tests must enforce:

- Exactly one choice is right, in every kind.
- Every beam on screen is traced by the same small ray code that decides the answer, so the picture can never disagree with what is marked right. Mirrors sit on a grid and turn in fixed steps.
- The moon is never offered in "makes its own light", right or wrong, at Levels 1 and 2. It is the classic mix-up; meet it at Level 3 only, with its own spoken lesson, or leave it out.
- Shadows never uses a thing whose shadow could belong to another thing on screen.
- Sound questions also show the sound (rings that are big for loud and small for quiet, a string drawn blurred while it shakes), so a question never depends on the iPad's volume.
- "Lets some light through" uses only clear cases (wax paper, a thin leaf, frosted glass), from a hand-checked table.

## Teaching a miss

Show it happen. The lamp switches on and the crab appears. The beam runs to the wood and stops, then to the glass and carries on. The lamp moves and the shadow swings to the other side. The mirror turns step by step and the beam swings with it. The string is plucked, shakes and hums, then a finger stops it and the sound stops. Each is said in one short line. A second miss slows the same thing down and lets him do it himself (drag the lamp, turn the mirror).

## Voice

New clips: the kind names, the things in the pictures, the animals' names and their facts. Animal names are spoken; he is not asked to read them.

## The reward: the Dock, the Dive and the Logbook

- **The loop.** A finished Round earns Bolts and one Dive. A Dive finds animals and treasure. Bolts buy submarine parts, and better parts open deeper zones.
- **The Dock.** His submarine out of the water. Slots: Hull, Headlights, Sonar, Motor, Claw, Paint, Glow Stripes, and a Buddy in the window.
- **Parts matter, and they are the lesson.** Headlights set how wide and how far his light reaches, and he sees only what the light touches. Sonar sends a ping that draws the outline of things the light can't reach: sound finding what light can't. A stronger Hull lets him go deeper. The Claw picks up treasure.
- **The Dive (action, 2D canvas).** He swims freely with a held finger leading the sub. The sea is dark outside his light. He finds glowing animals, takes their picture by holding the light on them, and collects treasure. About 60 seconds, then the sub rises by itself. Nothing chases him and nothing can hurt him.
- **Zones.** Eight to start: the sunlit reef, the twilight zone, the midnight zone, a shipwreck, a sea cave with crystals that bounce his light, hot vents, under the ice, the trench.
- **The Logbook and show off.** Every animal he has photographed, with its name and one true fact said aloud, the way Time Flies and Chop Chop do for aircraft. About 60 real animals: anglerfish, lanternfish, vampire squid, dumbo octopus, giant squid, gulper eel, comb jellies. The facts need research and a source for each.
- Bolts also buy light colours, glow patterns, horns and a camera flash that lights the whole screen for a moment.

Plan for about 150 things to earn from the first build (see the build guide). Economy defaults for the parent to confirm: one Dive per Round, the first one free; a first-time animal on almost every early Dive; no price over 100 Bolts.

## Look

Near-black blue with bright, glowing colour: cyan, lime, magenta and warm headlight yellow. Animals are drawn in code, friendly rather than frightening. Icon: a yellow submarine with its headlight beam picking out a glowing fish.

## Risks

- Drawing the dark. A light cone cut out of a dark layer over a large canvas may be slow on the iPad 9. Prototype it first and check it holds 60 fps.
- Deep-sea animals can look scary. Round the teeth off, keep the eyes friendly, and let the parent see the anglerfish before the rest are drawn.
- The science must be right and still simple. Every question and lesson line should be checked against a source, with the moon and "lets some light through" checked hardest.
- Sound questions when the sound is off. The visual form of every sound must be enough to answer.
