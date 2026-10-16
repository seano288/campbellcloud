# F-16 Fighting Falcon "Viper" — research notes

Scope: General Dynamics (now Lockheed Martin) F-16C Block 50/52 single-seat, with notes on F-16D two-seat and F-16V / Block 70/72.

Legend: `(est.)` = my estimate, not in any source. Everything else is sourced in section 10. Where sources disagree, both values are shown.

---

## 1. Identity

- **Full name:** General Dynamics F-16 Fighting Falcon (Lockheed Martin took over the programme from General Dynamics in 1993).
- **Nicknames:** "Viper" (the common name, and the name of the USAF Viper Demonstration Team). "Lawn Dart" is a pilot slang nickname I have seen mentioned but did not verify against a source. Treat it as unverified.
- **Maker:** General Dynamics Fort Worth division, later Lockheed Martin Aeronautics.
- **Era:** Designed 1970s. First flight 2 Feb 1974 (official), after an unplanned taxi-hop on 20 Jan 1974. Introduced 17 Aug 1978. USAF operational service at Hill AFB on 1 Oct 1980. 4,604 built (Wikipedia infobox).
- **Role:** Multirole fighter. Air-to-air and air-to-ground. Single-engine.
- **Crew:** 1 (F-16C/Block 50/52). Two-seat F-16D trainer/combat variant has 2.
- **Max speed:** "over Mach 2" (Wikipedia lead). Source table: Mach 2.05 (1,176 kn) at 40,000 ft, clean.

### Five kid-friendly voice lines (each under 12 words)

1. "I can fly faster than sound!" (7 words) (true: Mach 2+, about twice the speed of sound)
2. "My pilot sits right inside my bubble window." (8 words) (true: single-piece canopy, 360-degree view)
3. "My nose has a smile, and it breathes air in!" (9 words) (true: chin-mounted intake, "smiling" shape)
4. "I can turn so hard, my pilot feels heavy!" (8 words) (true: rated +9 g, which is extreme)
5. "I have a cannon hidden in my side!" (7 words) (true: M61A1 20 mm Vulcan in the left side of the fuselage)

Optional short alternates: "My engine is loud, so you can hear me coming!" (8 words) (est. for "loud", true in spirit).

---

## 2. Geometry for procedural modelling

### 2.1 Overall dimensions

| Quantity | Value | Source / note |
|---|---|---|
| Length | 15.06 m (49 ft 5 in) | Block 50/52 spec table; Army Recognition. Other sources: 14.8 m (GlobalSecurity, C/D); 15.03 m (Block 70 article). Use **15.06 m**. |
| Wingspan, no wingtip missiles | 9.96 m (32 ft 8 in) | Block 50/52 spec table, GlobalSecurity (C/D). Conflicts with 31 ft / 9.45 m. |
| Wingspan, with wingtip missiles | 9.45 m (31 ft 0 in) | Milavia, f-16.net, Army Recognition. Not clear which config these figures use. The discrepancy is likely the tip-missile configuration, but this is unconfirmed. Treat 9.45 m as "with tip launchers" (est.). |
| Height | 5.09 m (16.7 ft) | GlobalSecurity, Army Recognition. Another source: 4.9 m (16 ft). Use **5.09 m** (tail tip). |
| Wing area | 27.87 m² (300 sq ft) | Consistent across sources. |
| Empty weight | 8,573 kg (18,900 lb) | Block 50/52 spec table. |
| Max takeoff weight | 19,187 kg (42,300 lb) | Block 50/52 spec table. |
| Internal fuel | 3,200 kg (7,000 lb) | Block 50/52 spec table. |
| Max load | 7,700 kg (17,000 lb) | Block 50/52 spec table. |

**Aspect for modelling:** Use 15.06 m fuselage/tail length, 9.96 m overall span (no tip missiles), 5.09 m height. Scale to any unit you like; ratios are what matter.

### 2.2 Fuselage

**Nose and radome.** Ogive nose with a rounded radome. Radome is a sharp-to-rounded point with a slight cone (est.). Nose tip sits at x = 0.

**Cross-section stations.** No source gives station data. The values below are my estimates (est.) for a blended, nearly circular-to-oval body. Half-width (y) and half-height (z) are radii in metres.

| Station (% of length) | x (m) | Half-width y (m) | Height z (m) (est.) | Notes |
|---|---|---|---|---|
| 0% | 0.00 | 0.00 | 0.00 | nose tip |
| 5% | 0.75 | 0.22 | 0.25 (est.) | radome |
| 15% | 2.26 | 0.45 | 0.55 (est.) | forward fuselage, before canopy |
| 25% | 3.77 | 0.55 | 0.75 (est.) | chin intake region |
| 35% | 5.27 | 0.60 | 0.85 (est.) | canopy mid, widest |
| 45% | 6.78 | 0.62 | 0.90 (est.) | over wing LE |
| 60% | 9.04 | 0.60 | 0.85 (est.) | aft of wing |
| 75% | 11.30 | 0.55 | 0.80 (est.) | tail root start |
| 90% | 13.55 | 0.45 | 0.60 (est.) | tail base |
| 100% | 15.06 | 0.30 | 0.30 (est.) | engine nozzle face |

**Canopy:** Single-piece, bird-proof polycarbonate bubble. 360-degree view with 40-degree side look-down, 15-degree nose look-down. No forward bow frame (Wikipedia). Starts ~18% and ends ~45% of length (est.). Peak height about 1.5 m above datum (est.). Modelling it as a half-ellipsoid of length ~4.0 m (est.) is reasonable.

**Ventral "chin" intake (the smiling mouth).** Fixed-geometry, underslung pitot-type intake, sitting under the nose just ahead of the wing LE (Wikipedia). Size: est. ~0.9 m wide and ~0.45 m high (est.). Intake lip centre at x ≈ 4.5 m (est.), about 30% of length. Intake bottom sits about 0.5 m below fuselage centreline (est.).

**Blended wing-body / LERX.** The wing-body blend is the characteristic "lift-generating" transition. Strakes (LERX) run from the fuselage side just behind the canopy, out to around the wing root (est.). LERX length along the body ~3.0 m (est.), outer edge half-width ~0.9 m (est.).

### 2.3 Wing

Cropped delta, with 40-degree leading-edge sweep (Wikipedia-consistent, widely cited).

| Parameter | Value | Source |
|---|---|---|
| Leading-edge sweep | 40° | Widely cited; not in the sourced pages I fetched. Treat as known. |
| Root chord | ~5.0 m (est.) | Estimate |
| Tip chord | ~1.3 m (est.) | Estimate |
| Trailing edge | Straight, with the trailing edge and tip nearly parallel to the root (est.) | Estimate |
| Position along length | Root LE ~40% (x ≈ 6.0 m), root TE ~73% (x ≈ 11.0 m) | est. from chord and sweep |
| Mount | Mid-fuselage, mid-wing (est.) | Estimate |
| Dihedral | 0° | Estimate (F-16 wing is essentially flat; dihedral nil) |
| Thickness | ~3.5% root, ~3.0% tip (est.) | Estimate; F-16 uses a thin supercritical-style section |
| Wing area | 27.87 m² total (includes LEF/strake area, est.) | Source |

Half-span at root y ≈ 0.7 m (est.), tip y = 4.98 m (half of 9.96 m).

**Wingtip launchers (AIM-9 rails):** Two air-to-air launch rails at the wingtips (Wikipedia / Block 50/52 spec). These are the ~0.5 m extension that makes the 9.96 m span become 9.45 m in some figures? (unconfirmed; treat as possible).

### 2.4 Tail

- **Vertical tail:** Single fin. Height from the fuselage top is part of the 5.09 m total height. Root LE at x ≈ 11.0 m, tip LE at x ≈ 13.4 m (est., ~40-degree sweep). Fin root chord ~3.5 m (est.). Fin height above the fuselage ~3.6 m (est.), so tip z ≈ 5.09 m.
- **Dorsal spine:** Long, low fairing on top of the fuselage behind the canopy and in front of the fin. Runs roughly x = 7 to 11 m (est.), height ~0.2 m above the fuselage top (est.).
- **Ventral fins:** Two canted fins under the tail. Canted outward, about 20 degrees from vertical (est.). Positioned x ≈ 12.5 to 14.0 m (est.). Tip about 0.9 m below datum (est.).
- **Horizontal tail (stabilators):** All-moving, one-piece. Stabilator root LE x ≈ 13.0 m (est.), tip LE x ≈ 14.2 m (est.). Half-span ~2.2 m (est.). Dihedral ~ small (est.).

### 2.5 Engine

- **Type:** Single turbofan. Two options:
  - **Pratt & Whitney F100-PW-229** (Block 52). 17,800 lbf dry, 29,160 lbf with afterburner (Block 50/52 spec table).
  - **GE F110-GE-129** (Block 50). 17,155 lbf dry, 29,500 lbf with afterburner (Block 50/52 spec table). GE datasheet lists ~29,000 lb class.
- **Engine length:** 181.9 in (4.6 m) for the F110-GE-129, max diameter 46.5 in (GE datasheet).
- **Nozzle:** Circular convergent, fixed-geometry on early F-16s. The F-16 nozzle is a circular, two-position-geometry type (est.: nozzle exit ~0.75 m diameter). Treat as circular, roughly 0.75 m diameter (est.). The nozzle reaches ~15.0 m from the nose.
- **Intake:** See 2.2. Fixed geometry.

### 2.6 Landing gear

- Tricycle. Single nose wheel, two main wheels in fuselage-side bays (est.).
- Nose gear under the nose ahead of the chin intake, extends about 0.8 m below datum when down (est.).
- Main gear retracts inward into the fuselage side, wheels about 0.5 m below datum when down (est.).

### 2.7 Top-view half-outline

Half-outline (y ≥ 0), x from nose at 0 to the engine nozzle. Points in metres. Traces: nose → canopy blend → LERX/strake → wing → stabilator → nozzle. Wing and stabilator are approximations (est.).

```
(0.00, 0.00)   nose tip
(0.80, 0.15)   radome
(2.00, 0.36)   forward fuselage
(3.00, 0.50)   fuselage approaching LERX
(4.50, 0.90)   LERX outer edge (est.)
(5.20, 0.70)   LERX trailing back to fuselage (est.)
(6.00, 0.70)   wing LE at root
(9.60, 4.98)   wing LE at tip (40° sweep)
(10.90, 4.98)  wing TE at tip
(11.00, 0.70)  wing TE at root (TE is nearly straight)
(13.00, 0.60)  stabilator LE root (est.)
(14.20, 2.20)  stabilator LE tip (est.)
(14.90, 2.20)  stabilator TE tip (est.)
(14.60, 0.60)  stabilator TE root (est.)
(15.06, 0.40)  nozzle edge (est.)
(15.06, 0.00)  nozzle centre
```

### 2.8 Side-view outline (x, z)

z measured from the fuselage datum (0 = centreline of the fuselage belly region). Top outline runs nose → canopy → fin tip → tail. Bottom outline runs tail → belly → intake → nose. All est. except the total height and length.

**Top (about 28 points):**
```
( 0.00,  0.55)   nose tip
( 0.50,  0.72)
( 1.00,  0.85)
( 1.50,  0.95)
( 2.00,  1.05)
( 2.50,  1.15)   canopy start (est.)
( 3.00,  1.30)
( 3.50,  1.42)
( 4.00,  1.50)   canopy crown (est.)
( 4.80,  1.52)
( 5.50,  1.50)
( 6.00,  1.46)   canopy end (est.)
( 6.80,  1.30)   dorsal spine start (est.)
( 7.50,  1.40)
( 8.50,  1.45)
( 9.50,  1.45)
(10.50,  1.55)
(11.00,  1.80)   fin root LE
(12.00,  2.90)
(13.00,  4.00)
(13.40,  5.09)   fin tip LE (height, source)
(14.20,  5.09)   fin tip TE (est.)
(14.80,  2.00)   fin TE (est.)
(15.06,  1.40)   tail
```

**Bottom (about 18 points):**
```
(15.06,  0.30)   nozzle lower edge
(14.80,  0.10)
(14.40, -0.10)   ventral fin root TE (est.)
(14.00, -0.90)   ventral fin tip (est.)
(13.20, -0.90)   ventral fin tip LE (est.)
(12.50, -0.20)   ventral fin root LE (est.)
(11.00, -0.10)   belly aft of wing (est.)
( 8.00, -0.10)   belly
( 6.50, -0.30)   main gear bay (est.)
( 5.00, -0.50)   intake lower lip (est.)
( 4.00, -0.55)   chin intake lower edge (est.)
( 3.00, -0.30)   chin intake forward edge (est.)
( 2.00, -0.10)   nose belly (est.)
( 1.00,  0.10)   nose belly
( 0.00,  0.55)   nose tip (closes outline)
```

---

## 3. Distinctive features checklist (most important first)

1. **Single-piece bubble canopy.** Fully bird-proof polycarbonate bubble with no frame in front of the pilot. Reads instantly as "the F-16". It is the first thing a viewer notices.
2. **Chin-mounted "smiling" intake.** Underslung intake under the nose, forming a grin. Strongest identity cue after the canopy.
3. **Blended LERX / strakes.** Lifting strakes that run from the fuselage side and blend into the wing. Give the body its wide, sharp shoulders.
4. **Cropped delta wing with 40° sweep.** Thin, high-aspect delta with a straight trailing edge; no separate flaperons on the wing trailing edge (est.).
5. **Single tall fin, swept back.** Clean fin with a dorsal spine running into it.
6. **Canted ventral fins under the tail.** Two outward-canted fins under the stabilators. Easy visual cue from low angles.
7. **All-moving stabilators.** Full one-piece tail surfaces, not split elevator/stabiliser.
8. **Wingtip launch rails.** Small rails with AIM-9 Sidewinders on wingtips in the typical loadout.
9. **Single round nozzle.** Round afterburning exit at the back with a visible ring.
10. **Nose-gear and tricycle layout.** Tricycle gear with a short nose gear visible under the chin intake.

Top 3 for a recognisable silhouette: canopy, smiling intake, LERX/delta.

---

## 4. Paint & liveries

**Important:** My search did not return official colour values for any of these. Hex colours below are **all (est.)**: approximations from general knowledge of the schemes, to be checked against FS 595 standard colour chips before use. Do not present them as accurate.

Only the Viper Demonstration Team livery (2024) and the Aggressor "splinter" scheme were confirmed by sources. The rest are from general knowledge and marked accordingly.

| # | Scheme | Description | Main | Secondary | Accent | Markings (est.) |
|---|---|---|---|---|---|---|
| 1 | Standard two-tone grey (USAF) | Dark grey top, light grey underside. Standard operational paint. | #5E6B6E (est.) | #A9B2B6 (est.) | — | Black stencils, USAF roundels in black/white (est.) |
| 2 | Viper Demo Team, 50th anniversary (2024) | Red, white and blue. Replicates the YF-16 prototype livery (Lockheed Martin, May 2024). | #FFFFFF (est.) | #002868 (est.) | #BF0A30 (est.) | Red/blue stripes, white base (est.) |
| 3 | Thunderbirds-style blue and white | Blue and white with contrasting trim. Not confirmed for an F-16 in these sources. Treat as illustrative. | #0A2A6C (est.) | #FFFFFF (est.) | #C8102E (est.) | White stripe, red trim (est.) |
| 4 | Aggressor "splinter" (64th AGRS, Nellis, Aug 2016) | Hard-edged multi-colour threat-representation livery, based on Russian pattern inspiration. Each colour applied separately. | #3B3F38 (est.) | #7A7F6B (est.) | #2F4A6B (est.) | Dark splinter blotches (est.) |
| 5 | Aggressor arctic variant (18th AGRS, Eielson) | Black-grey-white variant of the blue splinter scheme. | #1E2328 (est.) | #DCE1E4 (est.) | #7C8790 (est.) | Splinter pattern in black/grey/white (est.) |
| 6 | Israeli desert camouflage | Tan/sand base with brown and grey camo blotches. Based on IAF practice (est.). | #C8B38A (est.) | #8C7257 (est.) | #5E5B52 (est.) | Brown splinter pattern (est.) |
| 7 | Belgian scheme | Dark grey/green over light grey (est.). Belgian F-16s historically used grey camo. | #56604E (est.) | #A8AEA7 (est.) | #1F2A24 (est.) | National roundels (est.) |
| 8 | Norwegian scheme | Dark grey top, light grey under (est.). Norwegian national markings. | #4D5354 (est.) | #B9BFC0 (est.) | #1B4F8C (est.) | Norwegian roundel (est.) |
| 9 | Polish scheme | Grey-green camo over light grey (est.). | #6A6F57 (est.) | #A7AC9C (est.) | #A21E2A (est.) | Polish roundel (est.) |
| 10 | Gold-canopy (fantasy/late-model) | Standard grey airframe with gold-tinted canopy. Gold canopy is a known real option on some F-16s (est.). | #5E6B6E (est.) | #A9B2B6 (est.) | #D4A017 (est.) | Gold canopy frame (est.) |

### Suggested mod ladder (paint)

- **Free default:** Standard two-tone grey (#1).
- **Rung 1 — "Grey Sky":** Standard grey with a gold canopy (#10). Cheap, reads as "shiny".
- **Rung 2 — "Viper Red, White and Blue":** Viper Demo Team 50th-anniversary scheme (#2). Real, eye-catching.
- **Rung 3 — "Splinter Sneak":** Aggressor splinter (#4). Visually different and a real cool-factor scheme.
- **Legendary — "Desert Star":** Israeli desert camo (#6) plus the gold canopy. Multi-scheme, fully rendered.

---

## 5. Armament & stores

### 5.1 Built-in gun

- **M61A1 20 mm Vulcan** in the fuselage left of the cockpit (Wikipedia). 500 rounds (Block 50/52 spec table).

### 5.2 Hardpoints (Block 50/52 spec table + Wikipedia)

- **2 wingtip air-to-air launch rails.** AIM-9 Sidewinder or AIM-120 AMRAAM-capable.
- **6 under-wing stations.** Inboard and outboard pylons, typical use: bombs, Maverick, HARM, AIM-120, drop tanks.
- **3 under-fuselage stations.** One centreline station, two sensor/pod stations on the chin (Wikipedia notes two of the three are for sensors).
- **Max capacity:** 7,700 kg (17,000 lb) of stores (spec table).

Note the Wikipedia lead says 11 hardpoints; the armament section lists 9 for stores plus 2 sensor pods. Use 9 stores + 2 sensor stations for the procedural model.

### 5.3 Typical per-station loads (est. from general F-16 practice)

| Location | Typical loads |
|---|---|
| Wingtip rails (2) | AIM-9 Sidewinder, AIM-120 AMRAAM |
| Outboard under-wing (2) | AIM-120, AIM-9, targeting pod (est.) |
| Inboard under-wing (2) | GBU bombs, Mk 82, drop tanks (est.) |
| Centreline (1) | Drop tank (300-600 US gal, spec table), bomb, HARM |
| Chin / sensor stations (2) | Targeting pod (Sniper/LANTIRN type), sensor pods (est.) |

### 5.4 Conformal fuel tanks (CFTs)

Conformal fuel tanks are a Block 40+ option that hug the fuselage sides. Present on Block 60/70 and many Block 50/52 upgrades (est.). Model as a flat, rounded extension along the fuselage sides aft of the intake.

### 5.5 Mod ladder (5 steps)

| Step | Name | Stores |
|---|---|---|
| Free | "Practice Ship" | Empty pylons, gun only |
| Rung 1 | "Sky Guard" | Wingtip Sidewinders |
| Rung 2 | "Sky Shield" | + AMRAAM on outer under-wing |
| Rung 3 | "Ground Thunder" | + bombs on inboard pylons |
| Legendary | "Golden Hawk" | + centreline drop tank and chin pod, gold accents |

---

## 6. Engines & propulsion

### 6.1 Engine options (Block 50/52 spec table)

| Engine | Dry thrust | With afterburner | Notes |
|---|---|---|---|
| Pratt & Whitney F100-PW-229 | 17,800 lbf (79 kN) | 29,160 lbf (129.7 kN) | Block 52 |
| GE F110-GE-129 | 17,155 lbf (76 kN) | 29,500 lbf (131 kN) | Block 50 |
| GE F110-GE-132 | — | 32,500 lbf (145 kN) | Block 60 (UAE) (Wikipedia) |

### 6.2 Visual notes

- **GE "Big Mouth" intake:** The F110 engine has a wider intake on Block 50+, which is why the F110 variant is called "Big Mouth" (est.). The F100 has a smaller intake. The intake shape is the same airframe, just a different engine inlet.
- **Afterburner look:** Bright blue-white flame with a visible shock diamond in the exhaust at full afterburner (est.).
- **Nozzle:** Round, convergent, fixed. About 0.75 m exit diameter (est.).

### 6.3 Mod ladder (5 steps)

| Step | Name | Description |
|---|---|---|
| Free | "Standard Engine" | F100-PW-229, 29,160 lbf AB, plain nozzle |
| Rung 1 | "Big Mouth" | F110-GE-129, 29,500 lbf AB, wider intake |
| Rung 2 | "Block 60 Power" | F110-GE-132, 32,500 lbf AB, bigger nozzle glow |
| Rung 3 | "Hot Rod" | Afterburner flame + smoke trail |
| Legendary | "Phoenix Burner" | Fantasy: blue-gold flame, sparkle trail |

---

## 7. Other cool mods specific to this aircraft

1. **Gold-tinted canopy.** Canopy material colour change (est. realism). Animates: canopy reflection shader only.
2. **Conformal fuel tanks.** Flat tanks on the fuselage sides. Animates: none, static.
3. **Smoke trails.** Smoke from the wingtips in turns. Animates: particle emitter on wingtip, driven by g-load.
4. **Tail flash.** Light or strobe on the fin tip. Animates: blinking, periodic.
5. **Drag chute (export variant).** Drag chute in the tail (est.: available on some export F-16s). Animates: deploys from tail on landing.
6. **Speed brakes either side of the nozzle.** Fold out on approach. Animates: speed brake panels rotate at the fuselage aft (est.).
7. **Flaperon / leading-edge flap motion.** Visual only. Animates: LEF deflection with g-load.

---

## 8. Sound

- **Engine:** Turbofan whine at idle, rising to a roaring, full-throated afterburner. (est. for synthesis; typical F-16 spectrum.)
- **Afterburner:** Deep, booming rumble with a crackle, lower than a jet's whine (est.).
- **Air:** High-speed wind noise.
- **Gun:** M61 Vulcan burst, rapid mechanical rattle (est. ~6,000 rounds per minute cyclic for M61, widely cited; treat as est.).
- **Landing gear:** Mechanical clunk, hydraulic whine (est.).

Suggested Web Audio synthesis: layered noise bursts for the afterburner, a bandpass-filtered noise with rising pitch for the turbofan whine, a short click-train for the gun.

---

## 9. Openly licensed 3D models

**Result: no suitable openly licensed F-16 model was verified.**

What I checked:

1. **Sketchfab.** The search returned no Sketchfab F-16 results, and the Sketchfab search page fetch returned no content. I could not verify any CC0 or CC-BY F-16 model. Next step: search Sketchfab directly with the "Downloadable" and "CC" filters.
2. **Poly Pizza.** Not found in search. Could not verify.
3. **NASA 3D Resources.** The current hub is https://science.nasa.gov/3d-resources/. The first page of 25 has no F-16 or fighter aircraft. NASA says all assets are free to use. The hub has an "Aircraft" filter, but I could not page through all results.
4. **Smithsonian 3D.** Not checked.
5. **Wikimedia Commons.** Not found in search. Only commercial and third-party listings came back.
6. **Commercial sites (not openly licensed):** 3dcadbrowser.com, CGTrader, Fab, TurboSquid. Licences vary and several are "Editorial Uses Only" or "Royalty Free No AI License". Not suitable as an openly licensed reference without checking each page.

**Honest outcome:** Procedural modelling from the numbers in section 2 is the realistic route. No downloadable openly licensed F-16 model was confirmed.

---

## 10. Reference sources

- Wikipedia, General Dynamics F-16 Fighting Falcon: https://en.wikipedia.org/wiki/General_Dynamics_F-16_Fighting_Falcon (used for lead, development, armament, cockpit, canopy, intake, engine lines, block info)
- Block 50/52 spec table (quoted via the Wikipedia fetch, same page): https://en.wikipedia.org/wiki/General_Dynamics_F-16_Fighting_Falcon (Specifications section)
- GlobalSecurity F-16 specs: https://www.globalsecurity.org/military/systems/aircraft/f-16-specs.htm
- Aerospaceweb F-16 data: https://aerospaceweb.org/aircraft/fighter/f16/
- Milavia F-16 specs: https://milavia.net/aircraft/f-16/f-16_specs.htm
- Army Recognition, F-16 Block 70 Bulgaria delivery (Lockheed-sourced dimensions): https://www.armyrecognition.com/archives/archives-aerospace-defense/defense-news-aerospace-2025/lockheed-martin-delivers-first-f-16-block-70-fighter-to-bulgaria-as-the-country-replaces-aging-russian-made-jets
- f-16.net versions (dimensions): https://www.f-16.net/f-16_versions_article30.html
- GE Aerospace F110-GE-129 datasheet: https://www.geaerospace.com/sites/default/files/datasheet-F110-GE-129.pdf
- Nellis AFB, Aggressor paint scheme: https://www.nellis.af.mil/Nellis-News/Article/908265/aggressors-paint-scheme-gets-a-makeover/
- Lockheed Martin, Viper Demo Team 50th anniversary paint: https://www.lockheedmartin.com/en-us/news/features/2024/Falcon50PaintScheme.html
- The Aviationist, Viper Demo Team retro scheme (2024): https://theaviationist.com/2024/05/15/the-f-16-viper-demo-team-unveils-new-50th-anniversary-paint-scheme/

### Three-view drawings

- the-blueprints.com, F-16 family (vector side views, licence not stated on page; check before reuse):
  - F-16A: https://the-blueprints.com/blueprints/modernplanes/general-dynamics/26507/view/general_dynamics_f-16a_fighting_falcon
  - F-16C: https://the-blueprints.com/blueprints/modernplanes/general-dynamics/5442/view/general_dynamics_f-16c_fighting_falcon
  - Generic F-16 (3183 x 2013 px): https://the-blueprints.com/blueprints/modernplanes/general-dynamics/27965/view/general_dynamics_f-16_fighting_falcon
- Wikimedia Commons three-view: not located in search. Search the site directly for "F-16 three-view" to find one.

### Not verified / open items

- FS 595 colour numbers for any scheme (all hex values above are est.).
- Wingspan with and without tip missiles: the sources disagree (9.96 m vs 9.45 m). Resolve by checking an official USAF or Lockheed Martin figure.
- F-16D two-seat dimensions: not found.
- F-16V / Block 70 dimensions: only the Army Recognition figures (15.03 m length, 9.45 m span, 5.09 m height) and an f-16.net "31 ft span, 49 ft 3 in length, 16 ft 7 in height" figure, which conflict.
- Thunderbirds livery: not found in sources.
