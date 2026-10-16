# Lockheed Martin F-22 Raptor — research notes

Status legend: plain numbers are sourced (see section 10). "(est.)" = my estimate, not a source value. "(unverified)" = named or stated but I could not confirm it in the sources I reached.

Research gaps (read before using): the Lockheed fact page (404), the Air Force fact sheet (403 on both af.mil and the jble.af.mil PDF), and the Wikipedia livery text were not readable. Only search snippets from the Air Force fact sheet were available. Intake, nozzle, weapons-bay, canopy, and cross-section dimensions are all estimates. Paint hex codes are estimates. No openly licensed model was verified.

---

## 1. Identity

- **Full name:** Lockheed Martin F-22 Raptor (designation F-22A for the production single-seat version; the F-22B two-seat variant was cancelled in 1996 per Wikipedia).
- **Nicknames:** "Raptor" is the official name. I did not verify any other nickname; do not use one without a source.
- **Maker:** Lockheed Martin (Wikipedia article title).
- **Era:** 5th-generation stealth air-superiority fighter. First flight 7 September 1997; entered service December 2005 (Wikipedia infobox and text).
- **Role:** Air superiority first, with ground-attack capability added later (Wikipedia; upgrades to integrate JDAM and SDB).
- **Crew:** 1 (Wikipedia "Specifications (F-22A)").
- **Team:** Raptor Demo Team, first approved in 2007 to replace the F-15C demo team, based at Langley AFB, Virginia (Wikipedia Demo Team page).

### Kid-friendly voice lines (each under 12 words)

1. "The F-22 is a super fast stealth jet!" (7 words; "stealth" = hard to spot on radar)
2. "It can fly more than twice as fast as sound!" (9 words; max speed Mach 2.25 per Wikipedia)
3. "Its missiles hide inside its wings until it's time!" (9 words; internal weapons bays)
4. "Its engines can point up and down to turn fast!" (9 words; thrust vectoring, plus-minus 20 degrees pitch per Wikipedia)
5. "A raptor is a bird that hunts. This jet hunts too!" (10 words; name meaning)

---

## 2. Geometry for procedural modeling

### 2.1 Overall (sourced)

| Quantity | Value | Source |
|---|---|---|
| Length | 18.92 m (62 ft 1 in) | Wikipedia spec table |
| Wingspan | 13.56 m (44 ft 6 in) | Wikipedia spec table |
| Height | 5.08 m (16 ft 8 in) | Wikipedia spec table |
| Empty weight | 19,700 kg (43,340 lb) | Wikipedia |
| Max takeoff weight | 38,000 kg (83,500 lb) | Wikipedia |
| Wing loading | 377 kg/m^2 (77.2 lb/ft^2) | Wikipedia |
| Thrust/weight | 1.08 (1.25 at loaded weight, 50% fuel) | Wikipedia |

Air Force fact sheet (search snippet): length 62 ft 1 in, wingspan 44 ft 6 in, height 16 ft 8 in. Snippet dated 23 Sep 2015. Matches Wikipedia.

Aerospaceweb (non-government) gives 18.92 m, 13.56 m, and 5.00 m. Use 5.08 m for height (official figure).

Scale reference: for a model at scale S, multiply metres by S. Use length 18.92 and wingspan 13.56 as hard constraints. Everything below is in metres unless marked.

### 2.2 Fuselage (x = 0 at nose tip, x = 18.92 at tail; all est.)

Faceted stealth nose with chines. The forward fuselage is a faceted, blended shape with chine lines running from the nose to the wing root. The fuselage is widest near the wing/intake area. Frameless canopy sits on the spine.

Cross-section stations (est., width = full width across, height = full height from belly to top):

| Station (% length) | x (m, est.) | Width (m, est.) | Height (m, est.) | Notes |
|---|---|---|---|---|
| 0% | 0.00 | 0.00 | 0.00 | nose tip, point |
| 5% | 0.95 | 0.40 | 0.45 | faceted nose, chine lines begin |
| 15% | 2.84 | 0.85 | 0.80 | intakes forward of this |
| 25% | 4.73 | 1.30 | 1.20 | canopy starts ~here |
| 35% | 6.62 | 1.55 | 1.55 | canopy on spine |
| 45% | 8.51 | 1.60 | 1.70 | widest near wing root |
| 55% | 10.41 | 1.55 | 1.75 | canopy ends ~here |
| 70% | 13.24 | 1.40 | 1.90 | wing trailing edge area |
| 85% | 16.08 | 1.20 | 2.20 | spine rises toward tail |
| 95% | 17.97 | 0.90 | 2.80 | tail boom |
| 100% | 18.92 | 0.70 | 2.90 | aft fuselage end |

### 2.3 Frameless bubble canopy

- Start: about 22-25% of length (est., roughly x = 4.2-4.7 m).
- End: about 52-55% of length (est., roughly x = 9.8-10.4 m).
- Tint: gold-tinted (common knowledge; not verified in sources I reached). Treat as a visual claim to confirm before relying on it.
- Shape: smooth single bubble, no frame. Top height above the spine about 0.6 m (est.).

### 2.4 Intakes (caret/diamond-like, shoulder-mounted)

- Source: Wikipedia calls them "fixed shoulder-mounted caret inlets," offset from the forward fuselage. Serpentine ducts lead to the engine faces.
- Shape (est.): a flat-faced caret/trapezoid, wider at the top front edge, tapering toward the rear. Front-view outline is roughly a rounded trapezoid, not a circle.
- Size (est.): each intake about 1.0 m wide by 0.7 m tall at the lip.
- Position (est.): on the lower-side shoulder of the fuselage, at about 14-22% of length (x ≈ 2.6-4.2 m), just forward of the leading edge of the wing root.
- Canting: the outer edge is canted outward and downward; the inner edge is near-vertical (est.). Model as a diamond-ish trapezoid tilted about 15-20 degrees (est.).

### 2.5 Wings

Sourced:
- Leading-edge sweep: 42 degrees (Wikipedia).
- Trailing-edge sweep: -17 degrees (forward-swept trailing edge, per Wikipedia "trailing edge swept -17 degrees").
- Anhedral: slight (Wikipedia). Value not given.
- Conical camber: yes (Wikipedia).

Estimated (est.):
- Root chord: about 6.0 m.
- Tip chord: about 2.2 m.
- Leading edge root x: 7.5 m (39.6% of length). Trailing edge root x: 13.5 m (71.4%).
- Leading edge tip x: 7.5 + 6.78 x tan(42 deg) = 13.6 m (est.). Trailing edge tip x: 13.5 - 6.78 x tan(17 deg) = 11.4 m (est.).
- Mount: shoulder/mid. Model as a blended wing that merges into the fuselage at about 40-70% of length (est.).
- Anhedral: about 3-5 degrees (est.; sourced only as "slight").
- Thickness: about 6-8% of chord at root, thinner at tip (est.).

Planform description: diamond-ish trapezoid with a long swept leading edge, a forward-swept trailing edge with a notch near the tip, and a small tip.

### 2.6 Tails

Vertical tails:
- Twin, canted outward. Canted vertical stabilizers (Wikipedia). Cant angle about 28 degrees (commonly cited; unverified here).
- Height above the spine: about 1.6-1.9 m (est.). Top of the tail sets the 5.08 m overall height.
- Sweep: swept back at roughly the same 42-45 degree angle as the wing leading edge (est.).
- Position: aft fuselage, about 80-95% of length (est., x ≈ 15.1-18.0 m).

Horizontal stabilators:
- Full-span all-moving tail surfaces (est.).
- Span: about 0.5-0.6 of wingspan (est.), so about 3.4 m half-width outward per side (est.).
- Position: at about 80-90% of length (est., x ≈ 15.1-17.0 m), mounted on the fuselage sides.
- Edges: sawtooth/serrated trailing edge (common knowledge; not verified here).

### 2.7 Engines and thrust-vectoring nozzles

- Engines: 2x Pratt & Whitney F119 augmented turbofans, "in the 35,000 lbf (156 kN) class" (Wikipedia).
- Nozzles: "rectangular two-dimensional thrust vectoring nozzles," with a range of plus-minus 20 degrees in pitch (Wikipedia).
- Nozzle size (est.): about 1.2 m wide by 0.9 m tall per nozzle.
- Nozzle position (est.): at the aft end, about 95-100% of length (x ≈ 18.0-18.9 m).
- Spacing (est.): centre-to-centre about 1.9 m (the two nozzles sit on each side of the centreline, with the two engines sharing the centreline area).
- Vectoring: pitch only (plus-minus 20 degrees). Model the flaps as hinged plates at the nozzle exit, rotating up and down together.

### 2.8 Internal weapons bays (est.)

Sourced: Wikipedia says the internal bays have eight weapon stations, and six AIM-120C/D are part of the air-to-air loadout. Four under-wing hardpoints can be fitted for external stores.

Estimated layout:
- Main ventral bay: centred on the centreline, under the wing root between about 35% and 55% of length (est., x ≈ 6.6-10.4 m). Width about 1.0 m, length about 4.0 m (est.). Two doors, one on each side of the centreline, that open downward and outward (est.).
- Side bays (left and right): one on each side of the fuselage, between the intake and the wing root at about 25-35% of length (est., x ≈ 4.7-6.6 m). Each bay holds one AIM-9 class missile (est.). Doors are small and swing outward on hinges/trapezes (est.).

### 2.9 Gun

- M61A2 20 mm rotary cannon, 480 rounds (Wikipedia).
- Position: right wing root, gun port with a door (common knowledge; not verified in sources I reached). Estimate: gun port at about 35-40% of length on the right wing root.

### 2.10 Landing gear (est., not sourced)

- Nose gear: retracts forward into the forward fuselage, at about 10-15% of length (est.).
- Main gear: two units, retract inward into the wing-root area / under the fuselage, at about 40-50% of length (est.). Main wheels are spaced about 2.5 m apart (est.).
- Gear doors: visible flush doors when retracted (est.).

### 2.11 Top-view half outline (est.)

Format: (x, y), where x = distance from nose (m), y = half-width outward (m). Left half only; mirror for the other side. Nose at (0, 0).

```
(0.00, 0.00)
(0.95, 0.20)
(2.84, 0.42)
(4.73, 0.65)
(6.62, 0.78)
(7.50, 0.80)   wing root leading edge
(13.60, 6.78)  wing tip leading edge
(11.40, 6.78)  wing tip trailing edge
(13.50, 0.80)  wing root trailing edge
(15.10, 0.70)  tail root (front)
(15.10, 3.40)  stabilator tip (front)
(17.00, 3.40)  stabilator tip (rear)
(17.50, 0.60)  tail root (rear)
(18.92, 0.30)  aft fuselage end
(18.92, 0.00)  aft centreline
```

Note: this top-view outline is simplified. Wing tip y = 6.78 is the sourced half-span. Other y values are estimates.

### 2.12 Side-view outline (est., x = m from nose, z = m above ground at the belly line)

Top outline (nose to tail):
```
(0.00, 0.90)
(0.95, 1.10)
(2.84, 1.40)
(4.73, 1.80)
(6.62, 2.20)
(8.51, 2.40)
(10.41, 2.50)
(13.24, 2.60)
(15.10, 3.50)  vertical tail start
(16.50, 4.60)
(17.80, 5.08)  tail top (highest point)
(18.50, 4.60)
(18.92, 3.90)  aft end, top
```

Bottom outline (tail to nose):
```
(18.92, 2.60)  aft end, bottom
(18.50, 1.60)
(17.00, 1.10)
(15.10, 0.95)
(13.24, 0.90)
(8.51, 0.85)
(4.73, 0.85)
(2.84, 0.90)
(0.95, 0.95)
(0.00, 0.90)
```

The bottom line stays near z = 0.85-0.95 m, because the belly sits about 1 m above ground at rest (est.). Landing gear stands the aircraft off the ground.

---

## 3. Distinctive features checklist (most important first)

1. **Diamond/trapezoid wing planform.** Long swept leading edge, forward-swept trailing edge. This is the single most recognizable silhouette cue.
2. **Canted twin vertical tails.** They splay outward. Very distinct from straight-tail fighters.
3. **Smooth faceted stealth nose** with chines, no radome. A clean, dark, almost blunt nose from the front.
4. **Caret (diamond-like) intakes** on the shoulders of the fuselage, not under the nose.
5. **Frameless gold-tinted bubble canopy** that sits low and flows into the spine (gold tint unverified).
6. **Rectangular thrust-vectoring nozzles** (flat, boxy outlets, not round). Visible when you look at the rear.
7. **Open weapons bays** with doors swinging down/out, showing missiles (strong cue when animated).
8. **Sawtooth-edged stabilators** on the tails (common knowledge; unverified here).
9. **Metallic, shimmery light/dark grey paint** (sourced as a modeller and photo-based description; the metallic sheen is visible in sunlight).
10. **No nose gun.** The M61A2 sits in the right wing root (common knowledge; unverified here), so do not model a nose gun.

---

## 4. Paint and liveries

### 4.1 Standard operational grey (sourced via secondhand forum report; hex est.)

- **Name:** Standard two-tone grey, metallic/shimmery look (factory colours per forum relay from a Tyndall AFB project engineer; treat as secondhand).
- **Colours:** Light grey FS36251, dark grey FS36173 (sourced: forum.finescale.com, secondhand). Hex approximations (est.): FS36251 ~#B9BDBA, FS36173 ~#4A5049.
- **Finish:** metallic sheen (multiple sources, including modeller and photo accounts).

### 4.2 Schemes to implement (verify before shipping)

| # | Name | Description | Main | Secondary | Accent | Markings | Verified? |
|---|---|---|---|---|---|---|---|
| 1 | Standard operational grey | Two-tone grey, metallic | #B9BDBA (est.) | #4A5049 (est.) | #DDE0DC (est.) | none | Colours: forum only |
| 2 | Raptor Demo Team | Red, white and blue team colours (Wikipedia infobox) | #8E9490 (est.) | #C22B2B (est.) | #1F3A6E (est.) | red/white/blue bands on tail (est.) | Colours: infobox only, unsourced |
| 3 | Langley heritage (1st Fighter Wing) | Home-base markings | standard grey | — | — | unit badge on tail (est.) | Name only; markings not verified |
| 4 | Hawaii ANG tail | Tail art for Hawaii Air National Guard | standard grey | — | — | Hawaii tail markings (est.) | Name only; not verified |
| 5 | Elmendorf | Alaska base markings | standard grey | — | — | unit markings (est.) | Name only; not verified |
| 6 | Tyndall | Florida base markings | standard grey | — | — | unit markings (est.) | Name only; not verified |
| 7 | Gold canopy | Gold-tinted canopy as an accent | standard grey | — | #C9A227 (est.) | gold canopy | Common knowledge; not verified |
| 8 | Chrome/mirror-finish test | Reflective coating test aircraft (The Aviationist, 2021; a second chrome-finish F-22 at Nellis was reported in 2022) | #D8D8D8 (est.) | #A8A8A8 (est.) | — | none | Reported in news titles only |

Notes:
- Only scheme 1 has sourced colours (secondhand). The rest are not verified.
- Scheme 8 is a real test/novelty paint reported in news titles (The Aviationist, 10 Dec 2021; reference in the Wikipedia citation list). Do not treat it as a standard livery.

### 4.3 Mod ladder (suggested)

- **Free default:** Standard operational grey (scheme 1). Ships with the game.
- **Rung 1 (Team Colours):** Raptor Demo Team red/white/blue. Unlock with a few Bolts.
- **Rung 2 (Base Colours):** Gold canopy plus one base-markings scheme (Langley or Tyndall).
- **Rung 3 (Heritage):** Hawaii ANG tail or Elmendorf markings.
- **Legendary:** Chrome/mirror finish (scheme 8). A rare, shiny unlock.

---

## 5. Armament and stores

### 5.1 Sourced

- Gun: one 20 mm M61A2 Vulcan rotary cannon, 480 rounds (Wikipedia).
- Internal bays: eight weapon stations (Wikipedia).
- Air-to-air loadout: six AIM-120C/D (Wikipedia).
- External: four under-wing hardpoints (Wikipedia).
- Upgrades (Wikipedia): integration with AIM-9X, AIM-120D, JDAM, and SDB. AIM-260 JATM under test.
- Fuel: 18,000 lb internal, 8,000 lb external tanks (Wikipedia).

### 5.2 Estimated or common knowledge (verify)

- Main ventral bay: holds AIM-120 class missiles (est.).
- Side bays: hold AIM-9 class missiles, which swing out on trapezes so the missile can drop clear (est.; common knowledge, unverified).
- GBU-32 JDAM and GBU-39 SDB: carried in the main bay (est.; Wikipedia says JDAM/SDB integration is planned or added as an upgrade).
- Drop tanks: external stores on the under-wing hardpoints for ferry flight (est.).

### 5.3 Five-step mod ladder for weapons

1. **Free default:** Gun only (M61A2, the right wing root gun door).
2. **Rung 1, "Sky Sparks":** Two AIM-9 missiles in the side bays. Bay doors open on pick-up.
3. **Rung 2, "Big Hunter":** Six AIM-120 missiles in the main bay. Main doors open for the release.
4. **Rung 3, "Smart Bomb":** Two JDAM bombs under the wings (external pylons, est.). Shows the bomb drop animation.
5. **Legendary, "Ghost Storm":** Full internal load (AIM-120, AIM-9) plus drop tanks for a long-range ferry look.

Opening bay doors is a major cool factor: animate the main bay doors and side doors on arming.

---

## 6. Engines and propulsion

### 6.1 Sourced

- Engine: 2x Pratt & Whitney F119 augmented turbofan (Wikipedia).
- Thrust: "35,000 lbf (156 kN) class" each (Wikipedia).
- Max speed: about Mach 2.25 (1,500 mph) at altitude (Wikipedia spec table).
- Supercruise: Mach 1.5 at 50,000 ft (15,000 m) (Wikipedia). Supercruise combat range 100 nmi (Wikipedia).
- Ceiling: 65,000 ft (20,000 m) (Wikipedia).
- Nozzles: rectangular 2D thrust vectoring, plus-minus 20 degrees pitch (Wikipedia).

### 6.2 Afterburner look (est.)

- Afterburner flame: flat, wide, rectangular-ish plume (not round). Matches the 2D nozzle shape.
- Colour: blue-white core fading to orange-red at the edges (est.).
- Length: flame extends about 3-5 m behind the aircraft at full afterburner (est.).

### 6.3 Five-step engine mod ladder

1. **Free default (realistic):** Standard F119 nozzles, small blue-white flame at idle, no vectoring visible.
2. **Rung 1, "Super Cruise":** Flame turns to a clean white-blue when supercruising (no afterburner glow).
3. **Rung 2, "Afterburner":** Flat rectangular orange-red flame at full afterburner.
4. **Rung 3, "Vector Power":** Nozzles pitch up and down visibly (plus-minus 20 degrees) during turns.
5. **Legendary, "Rainbow Thrust":** Flame changes colour (rainbow ramp) and nozzle plates glow.

---

## 7. Other cool mods specific to this aircraft

1. **Bay door animation:** Main ventral and side bay doors open on weapon release. Animates the hinge rotation and missile drop.
2. **Thrust-vectoring nozzle animation:** The flat nozzle plates pitch up and down during turns.
3. **Demo flares:** Flare canisters release from the rear during the demo, showing a "flare" trail (est.; flare deployment for the demo is common knowledge, not verified).
4. **Gold canopy shine:** Animated gold tint that flashes when the sun hits the canopy (gold tint unverified).
5. **Tail flash art:** Swap the tail markings each season (ties to the heritage liveries in section 4).
6. **Chrome paint reflection:** Reflective environment map for the Legendary mirror finish.
7. **Gun port door:** The right wing root gun door opens for a firing animation.
8. **Stealth shimmer:** Subtle low-opacity sheen on the nose and wing edges to suggest radar-absorbent material.

---

## 8. Sound

No sourced sound profile was found in this session. Estimated (est.) characteristics for a Web Audio synthesis:

- **Idle:** Low, steady turbofan hum, about 80-120 Hz fundamental (est.), with a soft high-frequency whine.
- **Takeoff/afterburner:** Deep roar with a broad noise spectrum, peaking around 300-1,000 Hz (est.). Add a noise source with a band-pass sweep for the jet exhaust.
- **Supercruise:** Smoother, quieter hum with less noise (est.).
- **Gun (M61A2):** Fast, rhythmic chatter at about 100 rounds/second (common knowledge; cannon rate not verified here). Synthesize with rapid short noise bursts.
- **Bay door open:** Short mechanical whine and click (est.).

---

## 9. Openly licensed 3D models

Searches run this session (Sketchfab, Poly Pizza, NASA 3D, generic search) did not turn up a verified CC-BY or CC0 F-22 model with a readable licence.

- **None verified as suitable yet.** The candidates below are unverified; check each page before use.
- **Sketchfab:** Filter for downloadable models with the CC Attribution licence. Search results showed F-22 listings by FreakGames (https://sketchfab.com/freakgames) and jadonisapro (https://sketchfab.com/jadonisapro). Licence not shown in the snippets. Check each page.
- **3dcadbrowser.com listings:** several F-22 models (e.g. https://www.3dcadbrowser.com/3d-model/f-22-raptor-117376 and https://www.3dcadbrowser.com/3d-model/f-22-raptor-rc). Licence not shown on snippets; one listed as royalty-free, not CC. Not suitable without a CC licence.
- **CGTrader:** paid models only (for example https://cgtrader.com/3d-models/aircraft/military/f-22-raptor-aircraft). Not CC. Not suitable for an open-licence game.
- **NASA 3D Resources (nasa3d.arc.nasa.gov):** unverified claim that an F-22 OBJ exists. Not confirmed; check directly.
- **Poly Pizza and Wikimedia Commons:** not searched successfully this session. Check manually.

Recommendation: procedural modelling (as the brief plans) is the safer route. Use the dimensions in section 2 as the source of truth.

---

## 10. Reference sources

Verified (sourced in this session):
- Wikipedia, Lockheed Martin F-22 Raptor (spec table, design, development, armament): https://en.wikipedia.org/wiki/Lockheed_Martin_F-22_Raptor
- Wikipedia, F-22 Raptor Demo Team (2007 approval, Langley base, colours infobox): https://en.wikipedia.org/wiki/F-22_Raptor_Demo_Team
- US Air Force F-22 fact sheet (search snippet with dimensions, dated 23 Sep 2015): https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104506/f-22-raptor/ (page returned 403 to direct fetch; dimensions confirmed via search snippet)
- Air Force fact sheet mirror (search result): https://www.jble.af.mil/Portals/46/F-22%20Fact%20Sheet.pdf (403 on direct fetch)
- Aerospaceweb F-22 data (non-government cross-check): https://aerospaceweb.org/aircraft/fighter/f22/
- Finescale forum, F-22 factory colours (secondhand): https://forum.finescale.com/t/correct-colors-for-an-f-22-raptor/191900
- USAF-SIG colour schemes reference: https://usaf-sig.org/index.php/references/reference/112-color-schemes/84-f-22a-raptor-colors-mark-s-bilas (listed in search only; not fetched)

Not found or not readable:
- Lockheed Martin product page (404): https://www.lockheedmartin.com/en-us/products/f-22-raptor.html
- Three-view drawings: no verified three-view source found in this session. Check Wikimedia Commons (search "F-22 three view") and the Air Force media library manually.

To verify manually before shipping:
- Canopy start/end and gold tint.
- Intake, nozzle, and weapons bay dimensions.
- Vertical tail cant angle (28 degrees is commonly cited, not verified here).
- Paint hex values (estimates).
- Heritage liveries (Langley, Hawaii, Elmendorf, Tyndall) and the Demo Team markings.
