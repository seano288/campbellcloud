---
name: Time Flies
description: A cockpit for learning to tell the time. A windshield of sky over a gunmetal instrument panel, where the clock gauge is Play.
colors:
  family-yellow: "#ffd23f"
  family-orange: "#ff7a00"
  family-red: "#e63946"
  family-ink: "#1d1d1f"
  outline-black: "#000000"
  play-green: "#178046"
  night: "#0f2a4a"
  windshield-sky-top: "#3d93dc"
  windshield-sky-mid: "#86c5f3"
  windshield-sky-horizon: "#cfe9fb"
  round-sky-deep: "#1b4f86"
  canopy-blue: "#1f5fd1"
  gunmetal-light: "#7d8794"
  gunmetal: "#3b424c"
  gunmetal-dark: "#1c2027"
  panel-face: "#4a525d"
  glare-shield: "#11151a"
  placard-black: "#14181d"
  screw-steel: "#9aa3ad"
  dial-white: "#f4f1e8"
  hour-hand-red: "#e2352b"
  annunciator-amber: "#ffb000"
  lamp-off: "#3b2c12"
  lamp-row: "#1c2128"
  lamp-row-edge: "#2c333d"
  placard-grey: "#aeb6c2"
  cockpit-white: "#e8edf2"
  hangar-floor: "#0d1622"
  hangar-navy: "#2d3650"
  hangar-gold: "#ffc53d"
  fitted-green: "#3ddc84"
  fitted-green-deep: "#1f4a39"
  shelf-wood: "#8b5a2b"
  shelf-shadow: "#3d2410"
  plank-label: "#e6c79c"
typography:
  display:
    fontFamily: "Bungee, sans-serif"
    fontSize: "max(24px, calc(40px * var(--u)))"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Bungee, sans-serif"
    fontSize: "calc(40px * var(--u))"
    fontWeight: 400
    lineHeight: 1.1
  placard:
    fontFamily: "Bungee, sans-serif"
    fontSize: "max(14px, calc(18px * var(--u)))"
    fontWeight: 400
    letterSpacing: "0.02em"
  question:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "max(22px, calc(34px * var(--u)))"
    fontWeight: 900
    lineHeight: 1.15
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "max(14px, calc(19px * var(--u)))"
    fontWeight: 900
    lineHeight: 1.1
  answer:
    fontFamily: "Nunito, sans-serif"
    fontSize: "calc(30px * var(--u))"
    fontWeight: 900
  dial-numeral:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 900
rounded:
  lamp: "12px"
  placard: "12px"
  choice: "16px"
  placard-go: "18px"
  panel: "18px"
  tile: "20px"
  button: "22px"
  card: "26px"
  stage: "28px"
  pill: "999px"
  round: "50%"
spacing:
  hairline: "4px"
  tight: "8px"
  gap: "14px"
  edge: "16px"
  loose: "28px"
components:
  play-placard:
    backgroundColor: "{colors.play-green}"
    textColor: "#ffffff"
    typography: "{typography.placard}"
    rounded: "{rounded.placard-go}"
    padding: "calc(8px * var(--u)) calc(34px * var(--u))"
    height: "52px"
  placard:
    backgroundColor: "{colors.placard-black}"
    textColor: "#ffffff"
    typography: "{typography.placard}"
    rounded: "{rounded.placard}"
    padding: "calc(5px * var(--u)) calc(14px * var(--u))"
  lamp-row:
    backgroundColor: "{colors.lamp-row}"
    textColor: "{colors.cockpit-white}"
    typography: "{typography.body}"
    rounded: "{rounded.lamp}"
    padding: "4px 8px"
    height: "44px"
  levels-panel:
    backgroundColor: "{colors.glare-shield}"
    rounded: "{rounded.panel}"
    padding: "calc(10px * var(--u))"
  big-button-go:
    backgroundColor: "{colors.play-green}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "calc(16px * var(--u)) calc(28px * var(--u))"
  big-button-hangar:
    backgroundColor: "{colors.family-yellow}"
    textColor: "{colors.family-ink}"
    rounded: "{rounded.button}"
    padding: "calc(16px * var(--u)) calc(28px * var(--u))"
  icon-button:
    backgroundColor: "{colors.outline-black}"
    rounded: "{rounded.round}"
    size: "max(46px, calc(56px * var(--u)))"
  answer-choice:
    backgroundColor: "{colors.family-yellow}"
    textColor: "{colors.family-ink}"
    typography: "{typography.answer}"
    rounded: "{rounded.choice}"
    padding: "calc(14px * var(--u))"
  question-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.family-ink}"
    rounded: "{rounded.card}"
  goal-chip:
    backgroundColor: "{colors.hangar-floor}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "4px 14px 4px 6px"
    height: "max(46px, calc(52px * var(--u)))"
  mod-tile:
    backgroundColor: "{colors.hangar-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.tile}"
    padding: "10px 6px 12px"
  mod-tile-fitted:
    backgroundColor: "{colors.fitted-green-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.tile}"
  hangar-tab-on:
    backgroundColor: "#16181c"
    textColor: "#ffffff"
    typography: "{typography.placard}"
    rounded: "14px"
    height: "44px"
---

# Design System: Time Flies

> **Scope.** This file documents **Time Flies only** (`src/time-flies/`). It does not describe the other games on the site (Monster Truck Money, Chop Chop, Purrdoku, Hunch), which have their own looks. Time Flies is built from two stylesheets loaded in order: the shared family stylesheet `src/styles.css` (also used by Monster Truck Money) and Time Flies' own `src/time-flies/time-flies.css`, which recolours and extends it. Each token below is marked **shared** or **Time Flies' own**.

## Overview

**Creative North Star: "The Pilot's Instrument Panel"**

Time Flies is the cockpit of his own plane. Home is a strip of daytime sky seen through a canopy frame, with a gunmetal instrument panel below it. The analog clock is the main instrument, and tapping it is Play. Everything he can operate is a physical-looking control: engraved black placards in Bungee, amber annunciator lamps for his Levels, a riveted round porthole that shows his plane and opens the Hangar. The cockpit material (gunmetal radial gradients, steel screws, a glare shield) is what makes Time Flies itself. The rest is the family look it shares with Monster Truck Money: Bungee for titles, Nunito for reading, 4px black outlines and chunky solid drop shadows that press down when tapped.

The screens are dense with large things rather than many things. There is one hero per screen (the gauge on Home, the clocks on a question, the Bolt pile at the end of a Round, the plane in the Hangar), and supporting controls sit around its edge. Colour carries meaning: green means Play or "right", yellow means "look here" (taught, lit, ready to buy), orange means "being read aloud", and amber means Level earned. The sky shows up wherever he is flying: the Home windshield, the Round's blue gradient, and the night sky at the end of a Round.

This is a game for an early reader holding a tablet, so the system works with floors as well as a style. Every target is at least 44pt. Type has a pixel minimum even when the whole UI scales down on a phone. Reduce Motion stops every pulse, shake and spin.

**Key Characteristics:**
- Cockpit materials: gunmetal bezel gradient, steel screws, glare shield, engraved placards, amber lamps.
- Family traits (binding, shared with Monster Truck Money): Bungee titles, Nunito 800/900 reading, 4px black outlines, solid black offset shadows that press in on tap.
- One hero per screen. On Home the clock gauge is the largest object and it is Play.
- Colour as signal: green = go/right, yellow = taught/lit/ready, orange = being spoken, amber = Level.
- Everything scales with one unit (`--u`), and every target and label has a fixed minimum.

## Colors

The palette is a saturated toy palette (shared) set against cockpit gunmetal and flight-sky blues (Time Flies' own).

### Primary
- **Play Green** (`play-green`, Time Flies' own `--go`): every Play control and "go" button (the green ring round the Home gauge, the ▶ Play placard, the end-of-Round ▶, the Hangar HUD ▶). It replaces the shared `--green` (#2bb673) on buttons because white text on it reads at about 5:1, where the shared green managed 2.6:1. The shared `--green` still marks a right answer (`.choice.right`, the right-clock ring).
- **Family Yellow** (`family-yellow`, shared `--yellow`): the "look here" colour. It fills answer choices and the say button, glows round a taught clock, choice or lit numeral, fills the Goal track, rings the Bolt pile and icon buttons, and is the colour of the Trophies and "Round done!" titles.

### Secondary
- **Canopy Blue** (`canopy-blue`, Time Flies' own): the first offset layer of every white Bungee title's two-step shadow (2px blue, then 4px black). The minute hand uses the same blue (#1f5fd1), so "the long hand is blue" holds everywhere.
- **Hour-Hand Red** (`hour-hand-red`, Time Flies' own): the short hand only, outlined in a darker red (#6e120c).
- **Annunciator Amber** (`annunciator-amber`, Time Flies' own): a lit Level lamp (a radial gradient from #ffe9a8 through amber to #e07800, with a soft amber glow) and the ring of a newly opened kind. Unlit lamps are **Lamp Off** (`lamp-off`), a dead brown-black.
- **Family Orange** (`family-orange`, shared): reserved for the "being read aloud" outline (`.speaking`, a 5px ring).

### Tertiary (the Hangar)
- **Hangar Gold** (`hangar-gold`, shared): prices, the frame of something he can afford, the Legendary frame, the active tab and number-picker borders.
- **Fitted Green** (`fitted-green`, shared) over **Fitted Green Deep** (`fitted-green-deep`, shared): a Mod, plane or colour he already has fitted.
- **Hangar Navy** (`hangar-navy`, shared): Mod tiles, plane chips, wheel buttons and inactive tabs, on **Hangar Floor** (`hangar-floor`, Time Flies' own background).

### Neutral
- **Gunmetal ramp** (`gunmetal-light` → `gunmetal` → `gunmetal-dark`, Time Flies' own `--metal`): the clock bezel and the Hangar porthole. It is a radial gradient lit from the upper left (35% 30%). `gunmetal-dark` is also the cockpit background and the canopy posts.
- **Panel Face** (`panel-face`): the top of the instrument panel's radial gradient, which falls through #2a3038 to `gunmetal-dark`.
- **Glare Shield** (`glare-shield`): the curved hood under the windshield and the inset Levels panel.
- **Placard Black** (`placard-black`): placard fill. Body text on placards is white. The "My Levels" engraving is **Placard Grey** (`placard-grey`).
- **Lamp Row** / **Lamp Row Edge**: the switch plates behind each Level line. Text on them is **Cockpit White** (`cockpit-white`). A locked kind drops to `gunmetal-light`.
- **Screw Steel** (`screw-steel`): screws on the bezel and in the panel's lower corners, plus the faint aircraft mark on the dial.
- **Dial White** (`dial-white`): the clock face, a radial from #ffffff to `dial-white` to #d9d4c5. Numerals are `family-ink`, haloed in #f7f5ef so a hand never hides them.
- **Windshield Sky** (`windshield-sky-top` → `-mid` → `-horizon`): the Home windshield. The Round background uses `windshield-sky-top` → `round-sky-deep` → #163e69. The end of a Round is a night sky from `round-sky-deep` to #0b1a2e. The page background is **Night** (`night`, Time Flies' own `--night`).
- **Family Ink** (`family-ink`, shared `--ink`) and **Outline Black** (`outline-black`): reading text on white cards, and every outline and offset shadow.
- **Shelf Wood** / **Shelf Shadow** / **Plank Label** (shared, plus Time Flies' plank labels): the Trophy Shelf's planks on a dark wood radial (#3a2716 → #140d07).

### Named Rules
**The Signal Colour Rule.** Each bright colour means one thing. Green: Play or right. Yellow: taught, lit or ready. Orange: being read aloud, and nothing else. Amber: a Level earned. Never use orange to teach or yellow to mark "speaking".

**The Readable Green Rule.** Any green surface carrying white text uses Play Green, never the shared #2bb673.

## Typography

**Display Font:** Bungee (self-hosted via `@fontsource/bungee`, weight 400 only, sans-serif fallback). Shared family font.
**Body Font:** Nunito (self-hosted via `@fontsource/nunito`, weights 800 and 900 only, system-ui fallback). Shared family font.

**Character:** Bungee is the stencilled signage of the cockpit (titles, placards, tabs, plank labels). Nunito is the friendly, heavy reading voice for everything he actually reads: questions, answers, names and numbers.

### Hierarchy
- **Display** (Bungee 400, `max(24px, 40px×u)`): the "Time Flies" title in the windshield and the first-plane picker title. White, with the two-step shadow (2px canopy blue, 4px black). Drops to 22px on an iPhone SE.
- **Headline** (Bungee 400, 40px×u): "Round done!" in yellow. The Trophies title is `max(24px, 36px×u)` in yellow with a 2px black shadow.
- **Placard** (Bungee 400, `max(14px, 18px×u)`, +0.02em): Hangar label, the "My Levels" engraving (`max(14px, 15px×u)`), Hangar tabs, plank labels. The ▶ Play placard steps up to `max(22px, 34px×u)`.
- **Question** (Nunito 900, `max(22px, 34px×u)`, line-height 1.15, balanced wrapping): every question, in sentence case. Calendar quiz questions use `max(20px, 30px×u)` and are left-aligned.
- **Answer** (Nunito 900, 30px×u; time choices 40px×u; word choices 32px×u): answer buttons.
- **Body** (Nunito 900, `max(14px, 19px×u)`, line-height 1.1): Level names on the lamp rows, Mod names, the Goal chip count.
- **Dial numerals** (Nunito 900, 21 SVG units, 8-unit halo stroke): clock numbers. Minute labels round the bezel are 8.5 units in yellow, and the one being counted grows to 12 in white.

### Named Rules
**The Bungee for Signs Rule.** Bungee is for titles, placards and labels only. Anything he must read to answer a question is Nunito, in sentence case.

**The Pixel Floor Rule.** Every scaled size is written as `max(<floor>, <size>×u)`, so the phone scale (`--u` 0.62) never takes readable text below 14px.

## Layout

**One unit scales everything.** The shared `--u` is 1 by default, 0.8 when the viewport is ≤700px wide or tall, and 0.62 when it is ≤430px wide or ≤520px tall. Sizes are written `calc(Npx × var(--u))`, and targets and text carry a `max()` floor. The app fills the viewport (`position: fixed; inset: 0`), pads by the safe-area insets and never scrolls the page. Only an overlay that can overflow scrolls inside itself: the end-of-Round screen on a sideways phone and the Trophy planks.

**Home, portrait** (iPad and iPhone upright): a windshield strip at the top (at least 120px×u) holds the title, Goal chip and Bolt pile, and wraps when narrow. Below it the panel is a three-row grid. The gauge spans the full width and takes all spare height (`minmax(0, 1fr)`), sized as a container query to `min(100cqw − 32px, 100cqh − 32px, 520px)` and sitting at the bottom of its cell. The next row holds the ▶ Play placard, centred under the gauge, with the Hangar porthole and placard at the right (150px×u porthole, minimum 96px). The Levels panel spans the bottom with lamp rows two to a row (2×3).

**Home, landscape** (iPad on its side): one row of three columns at 1.1 : 1.35 : 0.9, with Levels on the left (lamp rows one per line, 1×6), the gauge in the centre and the porthole on the right, sized by container to `min(100cqw − 12px, 100cqh − 70px, 300px, 34vh)`. The Play placard moves inside the gauge button, so gauge and placard are one target centred together.

**Home, phone sideways** (landscape, ≤520px tall): the windshield collapses to its padding (8px top, 18px bottom), the panel top padding drops to 24px, and the lamps go back to two per row with tighter padding.

**Home, small phone upright** (portrait, ≤700px tall, e.g. iPhone SE): a lower windshield, the title at 22px, the porthole at 78px, the "My Levels" engraving hidden visually (still read by screen readers), and the Play placard at a 48px minimum, so the clock keeps its size. Narrow phones (≤430px wide) get an 84px porthole and an 8px column gap.

**Question screens:** a top bar (🏠, five stars, Goal chip, Bolt pile), then one white card that takes all remaining space with a 16px margin. Find the Clock's three clocks are sized by container query: in a row, or stacked in a column when the card is narrower than 4:5 (a phone upright), each up to 300px. A single big clock is `min(46vh, 86vw, 440px)`. Word choices go to one column under 500px wide.

**Hangar:** a HUD row (Bolt pile, Goal chip, spacer, 🏠, ▶), then a 3D stage with 28px corners filling the rest. In portrait the parts sheet rises from the bottom (38% high, 54% for Paint), with Mods three per row and Colours four per row. In landscape it docks to the right at 46% width, with Mods two per row and Colours six per row.

**Spacing rhythm:** 16px screen edges, about 14px×u grid gaps, 8px between small parts, 4px between lamp rows. Overlays pad by 16px plus the safe-area insets.

## Elevation & Depth

Depth is a hybrid. The family offset shadow says "you can press this". The cockpit's lit metal gradients say "this is a real instrument". There is no soft ambient elevation on the Home or Round surfaces. Blur appears only for glows (taught, lit, ready) and in the Hangar, where floating controls sit over a 3D scene.

### Shadow Vocabulary
- **Family press shadow** (`box-shadow: 0 6px 0 #000`, cards 8px, tiles 7px, choices 5px, small buttons 4px): every tappable family control. On `:active` it shrinks to about 2px and the element moves down by the difference (`translateY(4px)`), so it looks pressed in.
- **Gauge ring** (`0 0 0 7px×u var(--go), 0 0 0 (7px×u + 4px) #000, 0 9px×u 0 (7px×u + 4px) #000`): the Play gauge has a green ring, then a black outline, then a solid black drop. It breathes with an extra `#3ddc8455` halo every 2.4s.
- **Placard engraving** (`inset 0 1px 0 #ffffff26, 0 4px 0 #000`): a 1px top highlight plus the family drop.
- **Inset well** (`inset 0 3px 8px #0009`): the Levels panel is recessed into the dashboard. Unlit lamps use `inset 0 2px 2px #0008`.
- **Glare shield** (`0 4px 0 #000` under a curved #11151a hood): the lip between windshield and panel.
- **Teaching glow** (`0 0 0 8px <colour>, 0 0 30px 8px <colour>`): yellow for a lit clock or choice, green for the right one.
- **Hangar float** (`0 5px 0 #0007` on tiles; `0 4px 12px #0008` on hotspots; `0 -10px 40px #0008` under the sheet): softer, translucent versions of the press shadow for controls over the 3D stage.

### Named Rules
**The Press-In Rule.** If a control has a solid offset shadow, tapping it removes most of the shadow and moves it down by the same amount. The only untappable things with a solid black drop are structural lips (the glare shield, the Trophy planks), and these are never rounded like a button.

## Shapes

Round where it is an instrument, softly squared where it is a control. Clocks, the gauge, the porthole, icon buttons, the say button, screws and lamps are perfect circles. Controls use generous radii: 12px for placards and lamp rows, 16px for answer choices, 18px for the Play placard and Levels panel, 20px for Mod tiles, 22px for big buttons, 26px for cards, 28px for the Hangar stage and sheet. Pills (999px) are only for the Bolt pile and Goal chip. Outlines are 4px solid black on family controls (cards, big buttons, choices, the Play placard, the canopy posts) and 3px on smaller parts (placards, Levels panel, porthole, chips). The windshield's canopy posts are skewed ±12°, and the glare shield's lower edge is an elliptical curve: the only non-rectangular silhouettes outside the circles.

## Components

### The Clock Gauge (signature)
The analog clock drawn as a cockpit instrument (SVG, viewBox ±110). A gunmetal bezel (radius 108, `--metal` gradient, #0b0d10 rim) with four steel screws at 45°, 135°, 225° and 315°. A dial-white face with 60 ticks (every fifth one heavier), a faint aircraft mark below the centre, a short red hour hand, a long blue minute hand, and a dark hub with a steel cap. Numerals sit above the hands, haloed in dial white. During a lesson, the hand being taught gets a yellow stroke and glow, a numeral being named gets a yellow disc, and minute labels count round the bezel. Hands glide (`transform .6s cubic-bezier(.3,1.4,.5,1)`), or jump when dragged or with Reduce Motion. On Home it shows 10:10, and tapping it spins the long hand two and a half turns (with a whoosh) for 650ms before the Round starts. With Reduce Motion the Round starts at once. When the clock is turnable, either hand can be dragged and the hands are geared together, with a click at each step.

### Placards
Engraved labels: placard black, 3px black outline, 12px corners, Bungee in white, the engraving shadow. The **Play placard** is the big variant: Play Green, 4px outline, 18px corners, `max(22px, 34px×u)` text, at least 52px high (48px on an iPhone SE). It is tied to the gauge: it presses down when the gauge is pressed. In portrait it is a separate button below the gauge, hidden from screen readers. In landscape it sits inside the gauge button.

### Hangar Porthole
A round gunmetal porthole (3px #0b0d10 rim, family 6px drop) framing his plane on a pale steel radial (#d9dfe5 → #8d98a3), with a Hangar placard under it. It presses down on tap.

### Levels Annunciator
An inset glare-shield panel (18px corners, 3px outline, inset well shadow) headed "My Levels" in grey Bungee. Each kind is a lamp row: a 44px-minimum switch plate with an emoji icon, the name in Nunito 900, and three round lamps (amber when earned). A star badge sits at the right when he has starred. Locked rows show a lock, grey text and a desaturated icon. A newly opened kind gets an amber border and a pulsing amber ring. Tapping a row speaks its name, or for a locked row what opens it.

### Buttons
- **Big button** (shared): 4px outline, 22px corners, family 6px press shadow, Nunito 900 at 30px×u. **Go** is Play Green with a white ▶. **Hangar** is family yellow carrying a grey plane drawing. At the end of a Round they grow to 38px×u.
- **Icon button** (shared, Time Flies floors): a black circle with a 3px yellow ring, `max(46px, 56px×u)`, holding an emoji. Variants: Play Green (▶), dark gold #b8860b (Trophies), violet #c04dff (Take Off).
- **Say button**: a yellow circle with a 4px outline and 4px drop, `max(48px, 58px×u)`.
- **Help button**: white, 3px outline, 14px corners, 4px drop, at least 48px high.
- **Answer choice** (shared): yellow, 4px outline, 16px corners, 5px drop. Wrong turns grey (#ddd on #999) and shakes. Right turns green with white text. A choice being taught gets the yellow glow.

### Cards / Containers
- **Question card** (shared): white, 4px outline, 26px corners, 8px drop, filling the screen under the top bar. While a miss is explained, its buttons fade to 60%, but a clock being taught never fades.
- **Modal card** (shared): same treatment, capped at 620px wide, over a #000b scrim. The **Time Lock vault** card is a dark-gold gradient (#4a3a10 → #2d2410) with a gold border.
- **End of a Round** (Time Flies' own colour): a solid night-sky overlay, "Round done!", a Bolt pile that ticks up, the plane flying in carrying the Bolts, the spoken lines, then the yellow Hangar and green ▶ buttons and the 🏠 icon button. The buttons stay asleep (25% opacity and `disabled`) until the show ends. A tap anywhere skips to the end.

### Goal Chip
A Hangar-floor pill (at least 46px high) showing what he is saving for, with a 🎯 flag, a yellow progress track (hidden under 430px wide) and the count in Bolts. When he can afford the Goal, it pulses.

### Hangar Controls
Mod tiles, plane chips and swatches are Hangar Navy with a translucent 5px drop. Fitted means a green border on deep green. Affordable means a gold border. Only the current Goal pulses (`tilepulse`). Legendary tiles have a gold frame on a dark-gold gradient with a twinkle. Tabs are Bungee, at least 44px high, with the active tab in near-black with a gold border. Stage hotspots are white circles, `max(50px, 66px×u)`. The plane strip fades out at both edges to show it scrolls.

### Trophy Shelf
A full-screen dark-wood room with three planks labelled in Bungee (Learning, Skill, Sticking with it). Cups are SVG with a 4px black outline in bronze, silver, gold, teal or violet by step, or a single-step gold. Unearned cups are grey silhouettes at 55% opacity. Earned cups shine every 2.4s. Step pips are yellow when earned.

### Motion
Motion is short and physical. Presses are instant transforms. Glides are 0.6s with a small overshoot. The plane flies in over 1.1s. Pulses run on 1–2.4s loops. With **Reduce Motion** (`prefers-reduced-motion: reduce`) every animation and transition collapses to 0.01ms and runs once. Every pulsing "ready" or "new" state becomes a steady 5px yellow ring. Confetti, fireworks, sparks and shatters are not drawn. The end-of-Round flight is cut to 300ms. Clock hands jump. The Home gauge starts the Round at once. The check is in both CSS and JS (`reducedMotion()` in `src/time-flies/motion.ts`).

## Do's and Don'ts

### Do:
- **Do** keep the family traits on every new surface: Bungee 400 for titles and placards, Nunito 800/900 for reading, 4px solid black outlines, and a solid black offset drop on anything tappable. These are a binding brand commitment shared with Monster Truck Money.
- **Do** make Play the largest, greenest thing on the screen, in Play Green (#178046) with white text.
- **Do** draw every analog clock with the shared ClockFace: gunmetal bezel, red short hand, blue long hand, numerals above the hands.
- **Do** build cockpit surfaces from the existing materials: the `--metal` gradient, steel screws, placard black with the engraving shadow, amber lamps.
- **Do** give every target at least 44pt, written as `max(44px…, N×u)`, and every scaled text size a 14px floor.
- **Do** pair every new pulse, shake, spin or fly-in with a Reduce Motion fallback (a steady yellow ring, or the end state at once).
- **Do** give each new Home layout separate portrait and landscape rules, plus the short-landscape (≤520px tall) and small-portrait (≤700px tall) cases.

### Don't:
- **Don't** use the orange ring for anything except "being read aloud", or use yellow for it.
- **Don't** put white text on the shared #2bb673 green.
- **Don't** put questions or answers in Bungee or all caps. They are Nunito, in sentence case.
- **Don't** let more than one thing pulse at a time in the Hangar. Only the current Goal pulses.
- **Don't** put a button-shaped solid black drop on something that can't be tapped. Structural lips (glare shield, planks) are the only exception.
- **Don't** fade a clock that is being taught.
