# Grumman F-14 Tomcat: research notes for procedural 3D model

Legend: **(src)** = stated in a fetched or searched source (see section 10). **(est.)** = my estimate, derived or guessed, not from a source. Units: metres unless stated. Length/height/span figures are as published; the rest is marked.

Verification status: Wikipedia (F-14D specs, F-14A variant text) fetched OK. Milavia and 3DCadBrowser fetched OK. Navy history page, Aerospaceweb, NNAM and Sketchfab pages failed to fetch (errors, empty), so figures from those are search-snippet only and marked as such.

---

## 1. Identity

- **Full name:** Grumman F-14 Tomcat (Grumman Aircraft Engineering Corp., designed for US Navy). **(src)**
- **Nicknames:** "Tomcat" (from "Tom's Cat", a programme nickname for Vice Adm. Thomas F. Connolly). **(src)** Variant "Super Tomcat" for the F-14D. **(src)**
- **Maker:** Grumman (Calverton/Bethpage, NY). Production 1969–1991, 712 built across variants. **(src)**
- **First flight:** 21 December 1970 (F-14A prototype). **(src)**
- **Introduction:** 22 September 1974 (fleet). IOC 1973. **(src)**
- **Retirement (US Navy):** 22 September 2006. **(src)**
- **Operators:** US Navy (historical); Imperial Iranian Air Force (historical); Islamic Republic of Iran Air Force (current). **(src)**
- **Role:** Carrier-based fleet air defence interceptor; later strike fighter and reconnaissance (F-14B/D). **(src)**
- **Crew:** 2, tandem: pilot (front) and Radar Intercept Officer / RIO (back). **(src)**

### Variants (for context)
- F-14A: original, TF30 engines. First flight 21 Dec 1970. **(src)**
- F-14A Plus / F-14B: GE F110 engines, redesignated F-14B on 1 May 1991; F-14B prototype with F401 engines flew 1973 (programme ended Apr 1974). **(src)**
- F-14D "Super Tomcat": F110, digital avionics, first delivered 1991. **(src)**

### Kid-friendly voice lines (each under 12 words, all checked against the specs above)
1. "My wings can swoop back like a bird's!" (true: sweep 20 to 68 degrees, 75 parked)
2. "I can fly faster than twice the speed of sound!" (true: Mach 2.34 **(src)**)
3. "Two pilots fly me, and they're a team!" (true: pilot plus RIO **(src)**)
4. "My missiles can hit planes very, very far away!" (true: AIM-54 Phoenix long range)
5. "I was a Navy jet that landed on aircraft carriers!" (true: carrier-based **(src)**)

---

## 2. Geometry for procedural modelling

### 2.1 Overall dimensions

| Item | Value | Source |
|---|---|---|
| Length (F-14D) | 62 ft 9 in = **19.13 m** | (src) Wikipedia F-14D specs |
| Length (F-14A) | 19.10 m (62 ft 8 in) | (src) Milavia; Aerospaceweb snippet 19.10 m |
| Height (overall, tails) | 16 ft = **4.88–4.9 m** | (src) Wikipedia, Milavia 4.88 m |
| Wing area (wings only) | **52.5 m² (565 ft²)** | (src) Wikipedia F-14D |
| Wing area (incl. fuselage, effective) | 94 m² (1,008 ft²) | (src) Wikipedia F-14D |

Use **L = 19.13 m** as the modelling length. Height 4.88 m overall.

### 2.2 Wingspan by sweep (full span, tip to tip)

| Sweep | Full span | Source / note |
|---|---|---|
| **20°** (minimum, "unswept") | **19.545 m** (64 ft 1.5 in) | (src) Wikipedia F-14D "wingspan, unswept". Taken to correspond to 20°. |
| **68°** (maximum, "swept") | **11.646 m** (38 ft 2.5 in) | (src) Wikipedia F-14D "swept wingspan". Sweep angle is the standard for this figure (est. that it is 68°). |
| **75°** (overswept / parked) | **10.15 m** (33 ft 3 in) | (src, search snippet only) Aerospaceweb 10.15 m; NNAM 33 ft 3 in. Sweep angle is 75° per the Wikipedia overswept note. |

Note: one NNAM snippet quotes 48 ft 2 in for fully swept. I rejected it as a conflict with the other sources.

### 2.3 Wing pivot (derived, est.)

The three span figures above fix the pivot geometry. Assume a pivot at offset `y_p` from centreline and a wing arm `r` from pivot to tip (sweep θ measured from the lateral axis, so tip y = y_p + r·cos θ):

- 20°: y_p + r·cos20 = 9.78
- 68°: y_p + r·cos68 = 5.82
- Solving: **r ≈ 7.0 m (est.)**, **y_p ≈ 3.2 m (est.)** (pivot is outboard of the fuselage, on the glove).
- Check at 75°: y_p + r·cos75 ≈ 5.0 m, consistent with the 5.07 m half-span from 10.15 m.

Pivot x position: **≈ 7.6 m from nose (≈ 40% of length) (est.)**. The F-14 pivot is well forward of the tail; the wings pivot about a point near the wing glove.

Tip leading-edge x = pivot_x + r·sin θ:
- 20°: 7.6 + 2.4 = **≈ 10.0 m (est.)**
- 68°: 7.6 + 6.5 = **≈ 14.1 m (est.)**
- 75°: 7.6 + 6.8 = **≈ 14.4 m (est.)**

### 2.4 Fuselage

- **Shape:** "Pancake" body, wide and flat, with two widely spaced engine nacelles (the fuselage is the lifting centre body between them). Width of the body centre section approx. 2.8 m (est.), body height approx. 2 m (est.) at the wing root.
- **Nose / radome:** Pointed conical nose, long radome housing the AWG-9 radar (antenna about 0.91 m (36 in) wide **(src)**). Nose tip at x=0, centreline z ≈ 1.3 (est.).
- **Engine nacelles:** Two, far apart, extending from the glove to the tail. Nacelle outer half-width ≈ 1.6 m (est.).

#### Fuselage cross-sections (est., all at 19.13 m length)
Stations at % of L, full width W and height H (est. unless noted):

| Station | % of L | x (m) | Width W (m) | Height H (m) | Note |
|---|---|---|---|---|---|
| Nose tip | 0 | 0.00 | 0.0 | 0.0 | radome point |
| Radome | 8 | 1.5 | 0.5 | 0.5 | |
| Forward cockpit | 16 | 3.0 | 1.2 | 1.1 | canopy start |
| Mid cockpit | 26 | 5.0 | 1.6 | 1.5 | |
| Canopy end | 39 | 7.4 | 2.0 | 1.8 | canopy end |
| Wing root / pivot | 40 | 7.6 | 2.8 | 1.9 | |
| Mid body | 55 | 10.5 | 3.0 | 1.8 | |
| Aft body | 75 | 14.3 | 2.6 | 1.6 | |
| Exhaust | 92 | 17.6 | 2.2 | 1.0 | |
| Tail end | 100 | 19.13 | 1.8 | 0.9 | |

### 2.5 Canopy (tandem two-seat)

- **Start:** ≈ 16% of L (x ≈ 3.0 m) (est.). **End:** ≈ 39% of L (x ≈ 7.4 m) (est.).
- **Shape:** Single "bubble" canopy covering both seats, with a faired top. Four mirrors around it for all-round visibility (src: Wikipedia F-14D text).
- Top at z ≈ 2.6 m (est.).

### 2.6 Intakes

- **Type:** Rectangular, under the fuselage/glove, with movable **ramps** and **bleed doors** (src). The bleed system blocks the frontal ramp during missile launch to avoid compressor stall (src).
- **Position:** Lips ahead of the wing pivot, approx. x = 5.5–7.5 m (est.), low on the body (est.).
- **Size:** approx. 1.0 m wide × 0.9 m high per intake (est.).
- **Ramp:** Two ramps per intake (upper and lower) (est.).

### 2.7 Wing glove and glove vanes

- The **wing glove** is the fixed wing section (LEX-like) between the fuselage and the pivot, carrying the outer glove pylons (AIM-9) and glove stations (src).
- **Glove vanes:** Small fixed vanes on the glove leading edge, for stability at high AoA (est. position; widely described, not verified here).
- Glove leading edge runs from fuselage side (y ≈ 1.5 m) forward toward the pivot (x ≈ 7.6 m, y ≈ 3.2 m) (est.).

### 2.8 Movable wings

- **Root chord:** ≈ 3.2 m (est.). **Tip chord:** ≈ 1.0 m (est.). Taper ratio ≈ 0.3 (est.).
- **Sweep range:** 20° (min) to 68° (max), overswept 75° (parked) (src).
- **Airfoil:** Thin, supercritical-style section (est.); a plain NACA-like 4-digit approximation is fine for a toy model.
- **Pivot:** titanium pivot structure (src: ~25% titanium by structure weight, incl. pivots and wing box).
- Movable wings have **leading-edge slats** and **trailing-edge flaps/ailerons** (est. standard; not verified here).

### 2.9 Tails

- **Vertical tails:** Twin, canted outward (est. ≈ 15°). Height from the fuselage top ≈ 2.5 m (est.), overall height 4.88 m (src). Sweep ≈ 45° at the leading edge (est.).
- **Horizontal stabilators:** All-moving, mounted on the twin tails' inboard side at roughly 0.7 of tail height (est.). Set nearly horizontal at rest.
- **Ventral fins:** Two, under the tail booms, outboard of the exhausts, approx. 0.8–1.0 m tall (est.). Shown on the fuselage bottom.

### 2.10 Engines and nozzles

- **Count:** 2. **Spacing:** nacelles outboard of the body, roughly ±1.6 m (outer edge) from centreline (est.).
- **Models:** Pratt & Whitney **TF30-P-412A** (F-14A, src) and **General Electric F110-GE-400** (F-14B and F-14D, src).
- **Nozzle:** Afterburning turbofan, convergent nozzle (est.). Nozzle diameter ≈ 0.9 m (est.). Nozzle is commonly described as "turkey feather" (petal) style in fleet photos (est., not verified here).

### 2.11 Landing gear

- **Nose gear:** Single strut, retracts forward, twin wheels (est.).
- **Main gear:** Retracts into the body/nacelles, wheel track ≈ 3.5–4.0 m (est.). Wheels 0.8 m diameter (est.).
- **Tail hook:** Under the tail, at approx. x = 17.5 m (est.), folds out for carrier arrestment.

### 2.12 Top-view half-outlines (x = 0 nose → 19.13 tail, y = half-width, metres) (est.)

Fuselage edge is shared between the two outlines. Both outlines include the glove, wing and tail-boom edge.

**20° sweep (fully spread):**
```
(0.00, 0.00)
(0.80, 0.30)
(2.00, 0.55)
(4.00, 0.90)
(6.00, 1.20)
(7.60, 1.50)
(7.60, 3.20)    pivot
(10.05, 9.78)   tip leading edge
(11.05, 9.78)   tip trailing edge
(10.93, 6.50)
(10.80, 3.20)   root trailing edge
(11.00, 2.00)
(12.00, 1.20)
(15.00, 1.00)
(17.50, 0.90)
(19.13, 0.75)   tail
```

**68° sweep (swept):**
```
(0.00, 0.00)
(0.80, 0.30)
(2.00, 0.55)
(4.00, 0.90)
(6.00, 1.20)
(7.60, 1.50)
(7.60, 3.20)    pivot
(14.10, 5.82)   tip leading edge
(14.85, 5.82)   tip trailing edge
(12.81, 4.50)
(10.80, 3.20)   root trailing edge
(11.00, 2.00)
(12.00, 1.20)
(15.00, 1.00)
(17.50, 0.90)
(19.13, 0.75)   tail
```

**75° sweep (overswept, parked) (est.):**
```
(14.37, 5.07)   tip leading edge
(15.10, 5.07)   tip trailing edge
(12.87, 4.10)
(10.80, 3.20)
```
(Use the 68° outline for the fuselage and the 75° tip points.)

### 2.13 Side-view outlines (x = nose → tail, z = height above ground, metres) (est.)

Top edge (z):
```
(0.00, 1.35)
(1.00, 1.60)
(2.00, 1.85)
(3.00, 2.10)
(4.00, 2.30)
(5.00, 2.45)
(6.00, 2.55)
(7.00, 2.60)
(8.00, 2.50)
(9.00, 2.30)
(11.00, 2.25)
(12.50, 2.40)
(13.50, 3.80)
(14.50, 4.88)
(17.50, 4.88)
(18.50, 4.00)
(19.13, 2.10)
```

Bottom edge (z):
```
(0.00, 1.25)
(1.00, 0.95)
(2.00, 0.80)
(4.00, 0.70)
(7.00, 0.70)
(9.00, 0.75)
(11.00, 0.80)
(13.00, 0.85)
(15.00, 0.80)
(17.00, 0.70)
(18.50, 0.75)
(19.13, 0.80)
```

Gear: wheels to z = 0 (ground).

---

## 3. Distinctive features checklist (ordered by recognition value)

1. **Variable-sweep wings** swept back to the fuselage (75° parked) and extended to 20°. The single most recognisable cue.
2. **Twin tall vertical tails**, canted outward, sitting on the tail booms.
3. **Wide flat "pancake" body** with the two engine nacelles far apart and the tail booms beyond them.
4. **Large wing glove** (fixed wing section) with glove vanes and glove pylons for AIM-9.
5. **Two-seat bubble canopy** with four mirrors on top, and the visible back seat.
6. **Rectangular intakes** under the forward body, with the movable ramps.
7. **Ventral fins** under the tail booms.
8. **All-moving stabilators** set low between the tails.
9. **Tail hook** under the rear.
10. **Carrier-style landing gear** with nose gear forward.

---

## 4. Paint & liveries

Hex values are **(est.)**, read from memory of the squadron schemes and not from a fetched colour chart. Verify against a scheme reference before shipping.

### 4.1 Real schemes

**a) 1970s gull grey / white with squadron tail art (VF-1 etc.)**
- Early F-14A schemes were gloss light gull grey over white, with white on upper control surfaces and underside, and very high visibility squadron markings (src: CombatAce forum). By the very early 1980s many squadrons had dropped white for overall gull grey (src).
- Main `#B9C2C8` (light gull grey, est.), secondary `#F2F2F0` (insignia white, est.), accent `#C0392B` (red, est.), markings `#1B1F2A` (dark, est.).

**b) VF-84 Jolly Rogers (skull and crossbones, 1980s)**
- Overall gull grey top, white underside (gloss), black/white skull on the tail. Forum source notes gloss gull grey top and gloss insignia white belly (src: Modelingmadness/Starfighter decal page, search snippet).
- Main `#B9C2C8` (est.), secondary `#F2F2F0` (est.), accent `#000000` (est.), markings `#FFFFFF` skull (est.).

**c) VF-1 Wolfpack**
- Gull grey with a black/white wolf motif on the tail (est.). Source search returned nothing on the VF-1 colours. Mark as unverified.
- Main `#B9C2C8`, secondary `#F2F2F0`, accent `#1B1F2A` (est.), markings `#C9A227` gold (est.).

**d) VF-111 Sundowners (shark mouth, sunburst)**
- Overall light gull grey; ~1981–82 markings took up most of the tail in red (src: CombatAce). The 1987 CAG jet had the sunburst limited to the rudder (src).
- Main `#B9C2C8` (est.), secondary `#F2F2F0`, accent `#C0392B` (src: red), markings `#F4D03F` sunburst yellow (est.).

**e) Top Gun movie (VF-1 "Wolfpack" / Top Gun school, 1986)**
- Gull grey with the Top Gun school markings and red/black tail. Film scheme details not verified here.
- Main `#B9C2C8` (est.), secondary `#F2F2F0` (est.), accent `#1B1F2A` (est.), markings `#E74C3C` (est.).

**f) Tactical paint (low-viz grey, late 1980s+)**
- Overall low-visibility grey, matte. Main `#5F6B73` (est.), secondary `#7D8790` (est.), accent `#2C3440` (est.), markings `#1B1F2A` (est.).

**g) Iranian desert camouflage (IRIAF F-14)**
- Desert tan and brown camouflage, IRIAF roundels (est.). Source not verified here.
- Main `#C2A878` (est.), secondary `#8B6B47` (est.), accent `#5C4A32` (est.), markings `#1B1F2A` (est.).

**h) Final-cruise specials (2006 retirement schemes)**
- Commemorative schemes in gloss grey with squadron names (est.). Not verified here.
- Main `#B9C2C8` (est.), secondary `#1B1F2A` (est.), accent `#C0392B` (est.), markings `#F2F2F0` (est.).

**i) NASA research scheme (F-14 used by NASA, Ames)**
- NASA white with blue and red NASA logo, "NASA" lettering (est.). The NASA F-14 flew research flights; scheme details not verified here.
- Main `#F2F2F0` (est.), secondary `#B9C2C8` (est.), accent `#0B3D91` (est.), markings `#E03C31` (est.).

### 4.2 Mod ladder (paint, suggested)

- **Free default:** Overall light gull grey with white underside, no squadron markings. (Grey `#B9C2C8`, white `#F2F2F0`.)
- **Rung 1 "Sunset Stripe":** Squadron-style tail stripe in red/white (VF-111 style). Cost: 10 Bolts.
- **Rung 2 "Jolly Roger":** Black skull tail art (VF-84). Cost: 25 Bolts.
- **Rung 3 "Shark Mouth" or "Wolfpack":** Full shark mouth (VF-111) or wolf motif (VF-1). Cost: 50 Bolts.
- **Legendary "Golden Tomcat":** Gold-trim desert or gloss black scheme with glowing tail stripe. Cost: 100 Bolts.

---

## 5. Armament & stores

### 5.1 Hardpoints (src: Wikipedia F-14D)
- **10 hardpoints total**, capacity **14,500 lb (6,600 kg)**.

### 5.2 Loadout positions (est. layout, from standard descriptions)
- **Gun:** 20 mm M61A1 Vulcan, internal (in the nose, left side), **675 rounds** (src).
- **AIM-54 Phoenix:** Up to 4 on under-fuselage "tunnel" pallets (est.). Long range.
- **AIM-7 Sparrow:** Recessed under the fuselage belly (est.). Semi-active radar.
- **AIM-9 Sidewinder:** On the glove pylons and wing-tip rails (est.). Heat seeking.
- **Bombs:** Mk-80 series, Mk 20 Rockeye II, GBU-38 JDAM (added 2003), Paveway (src).
- **Rockets:** 7 × LAU-10 pods, 28 rockets total (src).
- **LANTIRN targeting pod:** Under-fuselage, right side (est.).
- **TARPS recon pod:** Under-fuselage (est.).
- **Drop tanks:** 2 × 267 US gal (1,010 L) (src).

### 5.3 Weapons mod ladder (kid-friendly names)
1. **Free default "Gun Jet":** M61 Vulcan gun only. (Free.)
2. **Rung 1 "Sidewinder Buddy":** Adds AIM-9 Sidewinders on the glove. (10 Bolts.)
3. **Rung 2 "Long Shot":** Adds AIM-7 Sparrows under the belly. (25 Bolts.)
4. **Rung 3 "Big Reach":** Adds the 4 AIM-54 Phoenix pallets. (50 Bolts.)
5. **Legendary "Sky Hammer":** Full bomb load with a glowing trail effect. (100 Bolts.)

---

## 6. Engines & propulsion

### 6.1 Real engines
- **F-14A:** Pratt & Whitney **TF30-P-412A** (also JTF10A). **20,900 lbf (93 kN)** static uninstalled thrust per engine (src).
- **F-14B / F-14D:** General Electric **F110-GE-400**. **16,333 lbf (72.65 kN) dry**, **26,950 lbf (119.9 kN) with afterburner** each (src: Wikipedia F-14D). Installed thrust at sea level 23,400 lbf (104 kN) with afterburner (src: Wikipedia F-14 F110 section).
- Max speed: **Mach 2.34** at 40,000 ft (src). Service ceiling 53,000 ft+ (src). Range 1,600 nmi (src).
- Thrust-to-weight: 0.73 at max weight with F110 (src).

### 6.2 Afterburner look and nozzles
- Afterburner plume: long, bright blue-white cone (est.). Tailpipe glow orange-red at the nozzle (est.).
- **Nozzle:** Afterburning convergent nozzle, petal ("turkey feather") style on the TF30 (est.; not verified here).

### 6.3 Engine mod ladder (realistic first, fantasy Legendary)
1. **Free default "TF30 Thunder":** TF30 turbofan, no afterburner plume. Realistic.
2. **Rung 1 "F110 Power":** GE F110 with afterburner. Realistic. (10 Bolts.)
3. **Rung 2 "Full Burner":** Long blue afterburner plume with heat shimmer. (25 Bolts.)
4. **Rung 3 "Sonic Boom":** Contrail and shockwave ring effect at Mach 1. (50 Bolts.)
5. **Legendary "Rainbow Burner":** Coloured fantasy plume with sparkles. (100 Bolts.)

---

## 7. Other cool mods specific to this aircraft

1. **Wing sweep animation:** Wings sweep 20° → 68° → 75°. Pivots at ~(7.6, ±3.2) m (est.). Good for a clock-driven reveal.
2. **Tail hook:** Hook extends from the rear underside, with a sparks effect on landing (est.).
3. **Refuelling probe:** Probe extends from the nose-right side, toggled by a button (est.; the F-14 has a probe, not verified here).
4. **Shark mouth:** VF-111 style, on the nose (est.).
5. **Jolly Rogers tail:** Skull and crossbones tail art (VF-84).
6. **Squadron tail art:** Per-squadron tail designs (VF-1 wolf, VF-111 sunburst).
7. **Speed brakes:** Spoilers/speed brakes open on the wings and fuselage top (est.).

---

## 8. Sound (for Web Audio synthesis)

- **Engine:** Two TF30 or F110 turbofans. Low, deep whine at idle (est.). Afterburner: a loud roar with a rising hiss (est.).
- **Wing sweep:** Mechanical whirr and clunk when the pivots move (est.).
- **Landing gear:** Thud on touchdown, rattle on extend (est.).
- **Missile launch:** Sharp "whoosh" (est.).
- **Vulcan gun:** Rapid chatter at about 6,000 rounds/min (est.; M61 rate is widely quoted, not verified here).

---

## 9. Openly licensed 3D models

Searches were run on Sketchfab, Poly Pizza, NASA 3D Resources, Smithsonian 3D and Wikimedia Commons. **None confirmed as CC0 or CC-BY.**

1. **Sketchfab: "F-14D Super Tomcat (War Thunder)" by KojfDiscord**
   - URL: https://sketchfab.com/3d-models/f-14d-super-tomcat-war-thunder-heavy-cavalry-f9db1f6ea1294b158a1e0da9ed1b2acf
   - Licence: **UNVERIFIED.** Search snippet says CC Attribution, but the page fetch came back empty. Open the page and check the licence field before use.
   - Format: glTF offered for downloadable Sketchfab models (src: Sketchfab glTF page). Polygon count about 710.9k triangles (search snippet, unverified).
   - Quality: game-ripped model. Likely high poly and may be a War Thunder asset with terms restricting reuse. Check the terms.
2. **Sketchfab: "F-14 Tomcat Top Gun (Gear Up/Down)" by dwsd**
   - URL: https://sketchfab.com/dwsd/models (search lead only)
   - Licence: **UNVERIFIED.**
   - Quality: unknown. Look at the model page before deciding.
3. **3DCadBrowser: "F-14 Tomcat CAD Model"**
   - URL: https://www.3dcadbrowser.com/3d-model/f-14-tomcat-66255
   - Licence (quoted from page): "Royalty-Free License." "Redistribution of source files is not allowed." **Not CC-BY. Do not use for redistribution.**
   - Formats: MAX, OBJ, FBX, C4D, BLEND, STEP AP214, IGES 5.3. Polygon count: not shown.
   - Quality: CAD, potentially useful as a dimension reference; licence blocks redistribution.
4. **CGTrader: "Grumman F-14 Tomcat lowpoly jet fighter"**
   - URL: https://www.cgtrader.com/3d-models/aircraft/military-aircraft/grumman-f-14-tomcat-lowpoly-jet-fighter
   - Licence: **UNVERIFIED** (marketplace licence, not CC-BY per snippet). Polygon count unknown.
5. **NASA 3D Resources / Smithsonian 3D / Poly Pizza / Wikimedia Commons:** no F-14 model found in search. The Smithsonian NASM record for a 1:48 plastic F-14A kit is a museum object (CC0 "Open Access"), not a 3D model.

**Conclusion:** No openly licensed F-14 model is confirmed as usable. Procedural modelling per section 2 is the recommended route. Reference data only from the CAD/dimension sources.

---

## 10. Reference sources

- Wikipedia, Grumman F-14 Tomcat (F-14D specs section; variant dates): https://en.wikipedia.org/wiki/Grumman_F-14_Tomcat
- Wikipedia, F-14 Tomcat variants (404 at time of fetch): https://en.wikipedia.org/wiki/Grumman_F-14_Tomcat_variants (not usable)
- Milavia, F-14 specifications (F-14A dims and weights): https://www.milavia.net/aircraft/f-14/f-14_specs.htm
- Aerospaceweb, F-14 data (search snippet only; fetch returned 500): https://aerospaceweb.org/aircraft/fighter/f14/
- US Navy history, F-14 Tomcat (fetch failed; search result only): https://history.navy.mil/research/histories/naval-aviation-history/naval-aircraft/current-aircraft-inventory/f-14-tomcat.html
- US Navy NNAM, F-14A Tomcat (fetch failed; snippet only): https://history.navy.mil/content/history/museums/nnam/explore/collections/aircraft/f/f-14a-tomcat.html
- Midway Museum F-14 Tomcat page (snippet only): https://www.midway.org/visit/aircraft-gallery/f-14-tomcat
- CombatAce forum, early F-14A paint schemes: https://combatace.com/forums/topic/76727-early-f-14a-tomcat-paint-schemes-the-gulls-part-1-v111/
- DCS VF-111 Sundowners skin (scheme reference): https://www.digitalcombatsimulator.com/de/files/3318058
- Modelling Madness, VF-84 Jolly Rogers decal page (scheme reference): https://mail.modelingmadness.com/decals/decals%20F/f14.htm
- Sketchfab glTF info: https://www.sketchfab.com/features/gltf
- 3DCadBrowser F-14 CAD model (licence check): https://www.3dcadbrowser.com/3d-model/f-14-tomcat-66255

### Three-view drawings (for checking proportions yourself)
- The Blueprints (commercial, SVG and PNG, 1:72 and 1:100 options): https://the-blueprints.com/blueprints/modernplanes/grumman/2169/view/grumman_f-14_tomcat
- Navy standard characteristics chart with three-view drawings: no longer available (src: search result, "requested by NAVAIR" note)
- No free Wikimedia Commons three-view SVG found in search.
