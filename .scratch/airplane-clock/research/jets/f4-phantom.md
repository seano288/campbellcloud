# McDonnell Douglas F-4 Phantom II (research for hangar game)

Conventions: **(est.)** = estimated by me, not in any source. Units metric first, imperial in brackets when sourced. "F-4E" is the default variant for all geometry unless stated. Hex colours are **approximate, est.** and must be checked against Federal Standard 595 chips before anyone treats them as authoritative.

Source key (full URLs in section 10):
- [WP] Wikipedia main article (specs block is the "Specifications (F-4E)" template, read via raw wikitext)
- [MIL] MILAVIA F-4 specifications page
- [MIG] migflug.com F-4 page (aggregated figures, per-variant table)
- [KEY] Richard Keyt, f-4phantom.com, 8 Oct 2017
- [FAS] man.fas.org F-4 page (F-4G figures)
- [SB] search-result snippet only (not fetched in full)

---

## 1. Identity

**Full name:** McDonnell Douglas F-4 Phantom II. Original designation F4H-1 (US Navy, 1959/60); redesignated F-4 in the 1962 tri-service system. [WP]

**Nicknames** [WP, "Nicknames" section, quoted names only]: Rhino, Snoopy, Double Ugly, Old Smokey, Flying Anvil, Flying Footlocker, Flying Brick, Lead Sled, Big Iron Sled, St. Louis Slugger ("named for its production in St. Louis"), "World's Leading Distributor of MiG Parts", "the triumph of thrust over aerodynamics". Luftwaffe: *Eisenschwein* ("Iron Pig"). RAF: "The Toom". Turkish AF: *Baba* ("Father"). Mascot: "The Spook", a cartoon ghost.

**Maker:** McDonnell Aircraft Corporation, later McDonnell Douglas (after the 1967 merger). [WP]

**First flight:** 27 May 1958. **Introduced:** 30 Dec 1960 (USN VF-121 at NAS Miramar). **Built:** 5,195, 1958–1981, including about 138 built under licence in Japan. [WP][MIG]

**Role:** Two-seat all-weather fighter-bomber / interceptor. Carrier, land-based USAF, USMC, and export. [WP]

**Crew:** 2 (pilot plus RIO/WSO in the rear seat). [WP]

**Era:** Vietnam-era supersonic fighter, Cold War. US combat use ended 1996; last US target drone flights 2016; Japan retired 2021; South Korea 2024. Hellenic AF still listed as operator on WP. [WP]

### Five kid voice lines (under 12 words, simple, true)
1. "I flew for over sixty years. That's older than most grown-ups!"
   - Check: intro Dec 1960, last retirement 2024 (South Korea). Sourced [WP].
2. "I have two big engines and I can go twice as fast as sound!"
   - Check: Mach 2.23 max speed [WP], which is about twice the speed of sound. Sourced.
3. "My nose hides a big radar that can spot other jets!"
   - Check: bulbous nose "with a larger radar antenna" [WP]. Sourced.
4. "My wings are tipped up, so I stay steady in the sky!"
   - Check: outer wing panels angled up 12 degrees [WP]. Sourced.
5. "Two pilots sit in me, one in front and one behind!"
   - Check: tandem two-seat [WP]. Sourced.

---

## 2. Geometry for procedural modeling

### 2.1 Overall dimensions (F-4E)

| Item | Value | Source |
|---|---|---|
| Length | 19.20 m (63 ft 0 in) | [WP] spec block 19.2 m; [MIL]; [MIG]. F-4B/C/D: 17.76 m (58 ft 3 in) [MIG]. |
| Wingspan, spread | 11.70 m (38 ft 5 in) | [WP] spec block 11.7 m; [KEY] 38 ft 5 in. [MIL] gives 11.77 m (38 ft 7 in); treat as a 0.07 m discrepancy. |
| Wingspan, folded | 8.40 m (27 ft 7 in) | [WP] "wing folded" width 8.4 m; [MIG]; [KEY] 27 ft 7 in. |
| Height | 5.00 m (16 ft 5 in) | [WP] 5 m; [MIG]; [MIL] 5.02 m. |
| Wing area | 49.2 m² (530 ft²) | [WP] spec block; [MIG] |
| Aspect ratio | 2.77 | [WP] spec block; [MIG] |
| Empty weight | 13,757 kg (30,328 lb) | [WP], [MIG] |
| Gross (clean) weight | 18,824 kg (41,500 lb) | [WP] 41,500 lb; [MIG] |
| Max takeoff weight | 28,030 kg (61,795 lb) | [WP], [MIG] |
| Max landing weight | 16,706 kg (36,831 lb) | [WP] note; [MIG] |
| Internal fuel | ~5,880 kg (~12,960 lb, ~1,994 US gal) | [MIG] |

**Variable states that matter for the model:**
- **Wings** fold outboard of the wing mid-section (folded span 8.4 m). Fold is a Navy/USMC feature. The USAF F-4E did not fold its wings, but the model should match the F-4J/S (Navy) if we show folded wings. (Verify fold type in a three-view or a manual; not verified in this session.)
- **Landing gear** down or up. Nose gear strut extends 20 in (51 cm) [WP].
- **Stabilator** is fixed at the anhedral angle, but its deflection can animate (see section 7).
- **Leading-edge slats**: F-4E from 1972, fixed on the wing [WP]. Slat deploy is an animation, see section 7.
- **Drag chute**: deployed on landing (landing roll 1,122 m with drag chute) [MIG].
- **Centreline tank** and wing tanks: present or absent.

### 2.2 Fuselage

**Nose.** Conical-ish, pointed, with a noticeably bulbous radar-nose profile [WP: "larger radar antenna, necessitating the bulbous nose"]. The nose is bulged and rounded at the top, narrowing to a dark-tipped radome. Specific radome radius (est.): 0.45 m half-width at x = 3 m.

**Cross-section along the length (F-4E).** No source gave fuselage width or depth at stations. Estimates below are from the 19.2 m length and 5.0 m height, scaled with the known wing-root and intake placement. Verify against a scaled three-view before shipping.

| Station (% of length) | x (m) | Approx width (m) | Approx height (m) | Note |
|---|---|---|---|---|
| 0% | 0.0 | 0.00 | 0.00 | Nose tip |
| 5% | 0.96 | 0.45 | 0.55 (est.) | Radome |
| 15% | 2.9 | 0.95 (est.) | 1.25 (est.) | Windscreen starts |
| 25% | 4.8 | 1.20 (est.) | 1.75 (est.) | Intake lip region |
| 35% | 6.7 | 1.37 (est.) | 1.95 (est.) | Wing root leading edge |
| 50% | 9.6 | 1.37 (est.) | 1.95 (est.) | Max body, spine |
| 65% | 12.5 | 1.25 (est.) | 1.75 (est.) | Wing trailing edge |
| 80% | 15.4 | 1.00 (est.) | 1.45 (est.) | Tail boom start |
| 92% | 17.7 | 0.70 (est.) | 1.15 (est.) | Nozzle start |
| 100% | 19.2 | 0.60 (est.) | 0.95 (est.) | Nozzle exit |

Cross-section shape: **rounded-rectangular** with a flattish belly (est.). The F-4 has a noticeable spine behind the canopy, and the intake side walls are flat.

**Canopy.** Two-seat tandem bubble on a raised spine. Source only says the canopy was "reworked to improve visibility" [WP].
- Canopy starts (front windscreen leading edge): about 15% of length, x ≈ 2.9 m (est.)
- Canopy ends (rear canopy trailing edge): about 52% of length, x ≈ 10.0 m (est.)
- Shape: front windscreen is a sloped, three-panel wraparound; the rear canopy is a separate, taller hump over the RIO seat (est.).

**Intake.** Two side-mounted, rectangular-ish intakes under the fuselage, forward of the wing, with the forward edge close to the nose-to-wing area. Design features from [WP]:
- One fixed ramp and one variable-geometry ramp per intake.
- About 12,500 small boundary-layer bleed holes.
- Splitter plates on production aircraft.
- Intake position: under the fuselage, forward of the wing leading edge. Intake lip x ≈ 4.5–8.0 m (est.). Each intake is about 0.9 m wide and 0.6 m tall (est.).

**Engines.** Two General Electric J79 turbojets, side by side, mounted low in the fuselage "to maximize internal fuel capacity" [WP]. Engine nacelles are visible as two round nozzles at the tail.

**Nozzles.** Round convergent-divergent nozzles with petals (est.). Nozzle exit diameter about 0.80 m each (est.). Two nozzles separated by a central fin/keel. Length of the engine bay is about 6 m (est.). Nozzle is at the tail end (x = 19.2 m).

### 2.3 Wings

| Item | Value | Source |
|---|---|---|
| Planform | Trapezoidal, outboard panels with 12-degree upturn | [WP] |
| Leading-edge sweep | 45° | [WP] "leading edge sweep of 45°"; [KEY] |
| Trailing-edge sweep | About 12° aft (est.), derived from the geometry below | (est.) |
| Root airfoil | NACA 0006.4-64 | [WP] spec block |
| Tip airfoil | NACA 0003-64 | [WP] spec block |
| Thickness-to-chord | About 6.5% at root, 5.4% at tip | [SB] historyrise.com snippet |
| Root chord | ~6.5 m (est.) | derived, see below |
| Tip chord | ~1.9 m (est.) | derived, see below |
| Mount | Mid-wing on the fuselage, roughly at the fuselage waist (est.) | |
| Position along fuselage | Root LE at x ≈ 7.5 m (39% of length, est.). Root TE at x ≈ 14.0 m (73%, est.). | |
| Dihedral | Outer panels +12°, average +5° across the span | [WP] |
| Dogtooth | Yes, a leading-edge extension on the inboard wing root | [WP] |
| Leading-edge slats | F-4E onward, fixed | [WP] |
| Flaps | Blown flaps on prototype [WP] | |

**Chord derivation (est.).** The wing area and span from [WP] give:
- Wing area S = 49.2 m², span b = 11.7 m, so the sum of root and tip chords is (Cr + Ct) = 2S/b = 8.41 m.
- Assuming a taper ratio Ct/Cr ≈ 0.30 (est.), Cr ≈ 6.47 m and Ct ≈ 1.94 m.
- These numbers are estimates. The actual values are not in any source I could reach. Check against a three-view before finalising.

**Mount and dihedral, side view.** The wing root sits at about the fuselage waist. Outer panels are angled up 12 degrees, so the tips rise above the root line. For the side view, the wingtip is at z ≈ 1.95 + 5.85 · tan(12°) ≈ 1.95 + 1.24 = 3.2 m (est.), measured from the ground-line baseline. Wing-root z is 1.95 m (est.).

### 2.4 Tail

| Item | Value | Source |
|---|---|---|
| Vertical fins | 1 (single fin, not twin) | [WP] (F-4 has a single fin) |
| Fin cant | None (est.) | |
| Fin height (fuselage top to tip) | ~3.1 m above the fuselage top (est.) | overall height 5.0 m [WP] |
| Fin leading-edge sweep | ~40° (est.) | |
| Stabilator (all-moving tailplane) | Yes, all-moving | [WP] |
| Stabilator anhedral | 23° | [WP]; [KEY] |
| Stabilator span | ~6.0 m total (est.) | not in sources |
| Stabilator sweep | ~45° leading edge (est.) | |
| Stabilator root position | x ≈ 16.8 m (est.), roughly 87% of length | |

### 2.5 Landing gear

- Tricycle gear. Nose gear strut can extend 20 in (51 cm) [WP].
- Landing gear designed for a maximum sink rate of 23 ft/s [WP].
- Main gear: two-wheel units on each side, retracting into wing/fuselage (est.). Main gear pivot near the wing root (est.).
- Drag chute: yes, deployed on landing [MIG].
- Tailhook: Navy/USMC versions only (general knowledge, not verified in this session).
- Refuelling probe: USAF F-4E has a retractable probe forward on the left side of the nose (general knowledge, not verified in this session).

### 2.6 Top-view half outline (x, y), y = half-width outward, metres

Nose to wing to tail. Use the y-mirror for the other side. Wing and stabilator are est.

```
(0.00, 0.00)   nose tip
(0.96, 0.22)   radome
(2.90, 0.45)   windscreen start
(4.80, 0.60)   intake region
(6.70, 0.68)   fuselage waist
(7.50, 0.68)   wing root LE
(8.56, 1.20)   wing LE inboard
(9.60, 3.00)   wing LE mid-span
(11.50, 5.00)  wing LE outboard
(13.35, 5.85)  wingtip LE
(15.25, 5.85)  wingtip TE
(14.00, 0.68)  wing root TE
(15.40, 0.70)  fuselage tail boom start
(16.80, 0.70)  stabilator root LE
(18.30, 3.00)  stabilator tip LE
(19.00, 3.00)  stabilator tip TE
(19.20, 0.60)  tail end
```

Note: the wing LE points use the 45° sweep at est. spacing: LE x = 7.5 + y, which matches a 45° leading edge. Tip chord est. 1.9 m; TE from 14.0 at root to 15.25 at tip.

### 2.7 Side-view outline (x, z), z = height above ground-line in metres

Top profile (nose to tail), then bottom profile (tail back to nose). Est. except overall height 5.0 m [WP].

```
TOP (nose -> tail)
( 0.00, 1.00)   nose tip, radome centre
( 1.00, 1.25)
( 2.50, 1.55)   windscreen start
( 4.00, 1.90)
( 6.00, 2.30)   canopy top, forward
( 8.00, 2.35)   canopy peak
( 9.50, 2.20)   canopy aft / spine
(11.00, 2.20)   spine
(13.00, 2.20)
(15.00, 2.25)
(16.00, 2.30)   fin root leading edge
(16.50, 4.00)   fin leading edge
(17.00, 5.00)   fin tip (overall height 5.0 m [WP])
(18.20, 4.00)   fin trailing edge, slanted
(19.20, 2.00)   tail end top

BOTTOM (tail -> nose)
(19.20, 1.00)   nozzle exit bottom
(18.00, 0.90)
(16.00, 0.85)
(12.00, 0.75)
( 8.00, 0.65)   engine bay, belly
( 4.00, 0.60)   intake underside
( 2.00, 0.55)
( 0.50, 0.60)
( 0.00, 0.90)   nose tip underside
```

Note: the fuselage bottom is only 0.6–1.0 m above the ground-line in this profile, which is a simplification. The real jet has tyres below. For the main-gear footprint, add wheels as separate meshes.

---

## 3. Distinctive features checklist (ordered by importance)

1. **Single tall fin with an all-moving stabilator** that **droops 23°** (anhedral) at the tail [WP]. This is the easiest tell after the cockpit.
2. **Two big round nozzles** close together at the rear of a slim, long fuselage, with a flat-sided tail.
3. **Outer wing panels angled up 12°**, so the wingtips point up and the wing looks like a shallow V [WP].
4. **Small, sharp wings** (2.77 aspect ratio, 45° leading-edge sweep) with **dogtooth** notch on the inboard leading edge [WP].
5. **Bulbous radar nose** with a pointed tip, longer and fatter than an F-14 or F-15 nose [WP].
6. **Intakes under the fuselage** in front of the wings, with a ramp on each side (fixed + variable).
7. **Two-seat tandem canopy**, with the rear seat slightly raised.
8. **Fat, boxy body** with a flat belly, not a slim needle like an F-104.
9. **Missiles on the fuselage belly** (AIM-7 Sparrows semi-recessed, est. general knowledge) and **Sidewinders on the wingtips**, adding to the "loaded" look.
10. **Drag chute** on the tail (landing only).

---

## 4. Paint & liveries

**Note on colours:** every hex below is an approximation based on the sources' FS numbers and common paint matches, marked (est.). The Federal Standard numbers themselves come from forum and decal-review snippets. Two FS numbers in the search results conflict (36622 vs 36222), and FS 36081, FS 36231 and "Ghost Gray" were not confirmed. Use these as a starting palette, not a museum-accurate one.

### 4.1 Real schemes

1. **Vietnam SEA camouflage (USAF, 1965–1973)**
   - Description: standard tri-colour camo. Upper surfaces in two greens with a lower grey. The most recognised F-4 look.
   - Sources: FS 34079 / 34102 / 30219 over FS 36622 (finescale forum and modelingmadness snippets [SB]). Hex (est.): main green #4E5A3C (FS 34079-ish), secondary green #5F6B4A (FS 34102-ish), accent/tan #8E8A6A (FS 30219-ish), underside grey #7E8386 (FS 36622-ish).
   - Markings: USAF roundels (blue/white/red), national stars, black/white tail codes.

2. **US Navy grey (USN, 1970s–1980s, F-4J/S era)**
   - Description: all-over grey, low visibility, with black/white stencils. Navy F-4S and F-4J Blue Angels were grey before the Blue Angels scheme.
   - Hex (est.): main #8A9095 (grey), underside #B8BDC1 (light grey), markings #1B1F24 (black).
   - Note: FS 36375 "Ghost Gray" is likely the chip name for the USN grey but I could not confirm it in this session.

3. **Blue Angels (USN flight demonstration, F-4J, 1969–1973)**
   - Description: dark blue fuselage, gold/yellow trim, white accents, team insignia. Source: [SB] forum said the 1969 Blue Angels scheme was darker than other years.
   - Hex (est.): main blue #1E3A6E, secondary white #F4F4F0, accent gold #E8B53B, markings #0A1B38 (near-black navy).

4. **Thunderbirds (USAF demonstration, F-4E, 1969–1974)**
   - Description: white base coat over the old camo, with team red/white/blue markings. The white base was introduced for the team and "is still in use today" [SB].
   - Hex (est.): main white #F2F2EE, secondary red #C8102E, accent blue #1B3F8F, trim #B7B7B0.

5. **Shark mouth (generic, unit attribution not verified)**
   - Description: teeth painted around the intake on the nose, with eye on the nose cone. A popular scheme on many fighter types.
   - Hex (est.): main grey or camo base, mouth red #B3141F, teeth white #F5F5F5, outline black #111.

6. **Luftwaffe F-4F "ICE" grey (Germany, 1970s–1990s)**
   - Description: light grey and dark grey with black and white German crosses. Germany flew F-4Fs for decades.
   - Hex (est.): main #9AA0A4, secondary #6C7277, markings black #1A1A1A, crosses black/white. Germany retired the F-4 in 2013 per [WP].

7. **RAF F-4M Phantom FGR.2 (UK)**
   - Description: low-visibility grey tones used on RAF Phantoms (general knowledge; not verified in this session).
   - Hex (est.): main #7C8084, underside #A9AEB2, roundel red/white/blue.

8. **JASDF F-4EJ (Japan)**
   - Description: Japanese Phantoms carried a grey/white scheme with national roundels. Japan retired the type in 2021 [WP].
   - Hex (est.): main #C5CAD0, markings red #C8102E, roundel red #BC002D.

9. **QF-4 drone (USAF target drone, 2016 retirement)**
   - Description: drone-ized F-4s, usually plain grey or dark-grey with contrast markings. Painting unverified.
   - Hex (est.): main dark grey #3E4348, markings orange #E06C1B for drone identification (est.).

10. **Snoopy/ghost "Spook" (nickname livery)**
   - Description: cartoon ghost mascot "The Spook" on the fuselage [WP].
   - Hex (est.): main grey #8B9196, Spook white #F7F7F7, eye black #111.

### 4.2 Mod ladder (paint)

- **Free default:** Vietnam SEA camo (USAF). The most recognised look and the one most players will expect.
- **Rung 1 (Bolts, low cost):** US Navy grey, with black stencils.
- **Rung 2:** Thunderbirds white and red/white/blue. Fits the "demonstration team" fantasy.
- **Rung 3:** Blue Angels blue and gold. Also fits the "flying show" fantasy.
- **Legendary:** "Golden Ghost" — a gold chrome livery with the Spook mascot in black, and a glowing gold tail stripe. Fantasy, not realistic.

---

## 5. Armament & stores

### 5.1 Hardpoints and loads (F-4E)

- **Internal gun:** 1 × 20 mm M61A1 Vulcan six-barrel cannon, 640 rounds. F-4E onward; earlier marks had no internal gun [WP][MIL][MIG].
- **External hardpoints:** 9 stations, up to 8,480 kg (18,650 lb) [WP]. Practical load is lower once fuel is carried [MIG].
- **Fuselage belly:** AIM-7 Sparrow semi-recessed missiles (est. general knowledge; WP spec block says "fuselage AIM-7 Sparrows").
- **Centreline station:** drop tank (600 or 610 US gal) or a bomb rack [MIG].
- **Wing stations (4 per wing, est.):** inboard and outboard pylons; AIM-9 Sidewinder on the outboard wing pylons, 370 US gal drop tanks inboard [WP][MIG].
- **Other loads** [WP]: AGM-65 Maverick and AGM-88 HARM (F-4G), CBU-52/-58/-71/-87/-89 cluster munitions, MK-20 and BL-755 bombs, nuclear weapon types. Rockets and gun pods on F-4C (SUU-16 gun pods, pre-F-4E) [WP].
- **Drop tanks:** two 370 US gal wing tanks plus one 600/610 US gal centreline tank, total ~21,680 lb of fuel [MIG].

### 5.2 Mod ladder (armament)

- **Free default:** "Sky Guardians" — 4 Sparrow missiles under the fuselage, 4 Sidewinder missiles on the wing pylons, M61 cannon.
- **Rung 1 "Bomb Buddies":** general-purpose bombs on the four wing pylons and the centreline rack (est. kid-friendly load; bomb types from [WP] list).
- **Rung 2 "Rocket Rascals":** Maverick missiles on two wing pylons, plus rocket pods (est. loadout).
- **Rung 3 "Star Shooter":** 4 Sidewinders + 4 Sparrows + a drop tank on the centreline, and a glowing targeting pod.
- **Legendary "Golden Thunder":** all-gold missiles, gold cannon barrels, and a gold centreline tank with sparkle trail.

---

## 6. Engines & propulsion

### 6.1 Real engine variants

| Variant | Engine | Dry thrust (each) | Afterburner (each) | Source |
|---|---|---|---|---|
| F-4E / G | 2 × GE J79-GE-17A | 11,905 lbf (52.9 kN) | 17,845 lbf (79.4 kN) | [WP][MIG] |
| F-4B | 2 × GE J79-GE-8 | 10,900 lbf (48.5 kN) | 16,950 lbf (75.4 kN) | [WP] |
| F-4C / D | 2 × GE J79-GE-15 | (not sourced) | (not sourced) | [MIG] |
| F-4J | 2 × GE J79-GE-10 | — | 17,844 lbf (79.4 kN) | [WP] |
| F-4S | 2 × GE J79-GE-17 (smokeless) | — | 17,900 lbf (79.4 kN) | [WP] |
| UK F-4K / M | 2 × Rolls-Royce Spey | — | — | [MIG] |

- Engine maker: General Electric. Engine family: J79 (single-spool axial turbojet, supersonic-capable).
- **Afterburner:** yes, on all variants.
- **Smoke trail:** the earlier J79s smoke heavily at idle and in afterburner. The F-4S had "smokeless" J79-GE-17 engines, which is the usual difference [WP].
- **Nozzle colour and material:** nozzle petals are dark steel/black (est.), with a blue-white flame plume in afterburner (est.).

### 6.2 Mod ladder (engine)

- **Free default:** J79-GE-17A (realistic F-4E engine). Dark nozzles, orange flame, normal smoke.
- **Rung 1 "Smokeless Pro":** J79-GE-17 smokeless variant. Clean exhaust, cyan-tinted flame.
- **Rung 2 "Thunder Pack":** J79-GE-8 (F-4B) with a louder, longer flame.
- **Rung 3 "Rainbow Burner":** Afterburner flame shifts colour as the player gains Bolts (blue, green, purple).
- **Legendary "Golden Jet":** gold-coloured nozzle petals, gold flame with sparkles, and a gold smoke trail.

---

## 7. Other cool mods for this aircraft

1. **Shark mouth** on the nose, with teeth around the intake. Static decal, no animation.
2. **Tail hook** (Navy/USMC versions only). Hook extends on a button press, with a landing "snag" animation. (Tailhook existence confirmed only in general knowledge.)
3. **Drag chute** on landing. Chute deploys from the tail and drags the jet to a stop. Animate: chute scales up from the fin root, then retracts.
4. **Refuelling probe** on the left forward fuselage (USAF F-4E). Probe extends and retracts (general knowledge; not verified in this session).
5. **Smoke trails** from the nozzles under afterburner. Particle emitter on each nozzle, colour = engine variant.
6. **Folding wings** (Navy/USMC versions). Outer panels fold up along the fold line at 8.4 m span. Animate: rotate outer panels up around the fold hinge.
7. **Slats** on the leading edge (F-4E). Animate: slats extend forward, opening a gap, when the player "slows" in the hangar demo.
8. **Stabilator droop**: the all-moving tailplane tilts up and down with control input (animate ±15° as est.).
9. **Gun-cam flash:** the M61 cannon fires a short muzzle-flash burst from a nose port (est.).

---

## 8. Sound

- **Start-up:** a J79 whine rising with spool-up, then a deep rumble. The start-up recording is documented in [SB] (YouTube "Collings Foundation J79 start" uploads) but I did not verify a licence on those, so do not reuse the audio.
- **Idle:** low, steady roar with a high-pitched compressor whine.
- **Full power (dry):** louder, broader roar.
- **Afterburner light-off:** sharp "whump" followed by a deep, rumbling roar. The afterburner adds a low-frequency boom that the flight-sim J79 packs in [SB] are said to lack.
- **Howl:** the J79 howl only occurs at particular throttle settings and the earlier F-4s make a similar howl [SB].

**Web Audio synthesis suggestion (est.):**
- Noise source through a bandpass at 800–1,200 Hz for the roar.
- Sine oscillator sweeping 2,000–6,000 Hz for the compressor whine, gain ramped with RPM.
- Afterburner: low-pass noise at 80–200 Hz with a short attack for the boom.

---

## 9. Openly licensed 3D models

Sketchfab's download API was reachable [api.sketchfab.com/v3/models/<uid>]. Licence labels below are from that API, and the link to each licence is listed. Poly Pizza, NASA 3D Resources, Smithsonian 3D and Wikimedia Commons were not found to have a usable F-4 model in this session (Poly Pizza returned a 502; Smithsonian has only a physical 1/48 model at NASM [SB]).

1. **McDonnell Douglas F-4 Phantom II** by andertan
   - URL: https://sketchfab.com/3d-models/mcdonnell-douglas-f-4-phantom-ii-1ea38a66a59048529d27b24a570c5e07
   - Licence (verified via API): CC Attribution, http://creativecommons.org/licenses/by/4.0/ ("Author must be credited. Commercial use is allowed.")
   - Downloadable: yes. Faces 62,702, vertices 37,876, 5 textures, 22 materials, no animation.
   - Notes: highest detail of the verified set. Description says it was "originally developed by McDonnell Aircraft for the United States Navy". Quality not visually checked. Good candidate for a higher-detail reference.

2. **FREE F-4 Phantom low poly** by Artbor
   - URL: https://sketchfab.com/3d-models/free-f-4-phantom-low-poly-4cd9a24404954246a13394f1def64431
   - Licence (verified via API): CC Attribution, http://creativecommons.org/licenses/by/4.0/
   - Downloadable: yes. Faces 5,703, vertices 2,986, 2 textures, 12 animations.
   - Notes: low-poly, made in Blockbench. Animations present, which may be useful for checking the moving parts. Good for a mobile budget.

3. **McDonnell Douglas F-4 Phantom II** by ETAN798
   - URL: https://sketchfab.com/3d-models/mcdonnell-douglas-f-4-phantom-ii-1f6c51fc1db24730b595ac5cfcca62b0
   - Licence (verified via API): CC Attribution, http://creativecommons.org/licenses/by/4.0/
   - Downloadable: yes. Faces 8,342, vertices 2,950, 3 textures.
   - Notes: described as a "stylized version" with no source named. Good silhouette target for a kid-friendly look.

4. **F-4 Phantom II Recreation** by jpford63
   - URL: https://sketchfab.com/3d-models/f-4-phantom-ii-recreation-666403b893024c8c88409f9feb2277eb
   - Licence (verified via API): CC Attribution, http://creativecommons.org/licenses/by/4.0/
   - Downloadable: yes. Faces 10,445, vertices 6,254, 0 textures.
   - Notes: described as "First attempt at recreating the F-4 Phantom II from blueprints." Useful reference for geometry, check against a three-view.

5. **McDonnell Douglas F-4 Phantom II Fighter Jet** by Bung Wrag
   - URL: https://sketchfab.com/3d-models/none-0bf525a1fcfb49b6bf9f8fbb34bc4ae2
   - Licence label from the API listing only: CC Attribution. Detail record not fetched, so verify the licence and download on the page before use.
   - Downloadable: true (API listing). Faces 11,840, vertices 5,920.

**Not suitable:** bohmerang "F-4 Phantom II - Fighter Jet - Free" is CC BY-NC-SA (non-commercial, share-alike). Do not use if the game is ever sold. War Thunder-derived models (e.g. "F-4J Phantom II (#4 Custom) (War Thunder)") carry game-asset rights questions, and are not CC-licensed as far as I can tell. kositsuwan's 499,966-face models are far too heavy for an iPad.

**Three-view drawings** (for checking geometry): MILAVIA F-4E specs page has an embedded three-view image [MIL], but the image text could not be read here. The-blueprints.com has paid F-4F SVGs and free raster F-4 entries. Wikimedia Commons had no confirmed three-view SVG in this session.

---

## 10. Reference sources

- Wikipedia, "McDonnell Douglas F-4 Phantom II": https://en.wikipedia.org/wiki/McDonnell_Douglas_F-4_Phantom_II (main article; spec block read via raw wikitext at https://en.wikipedia.org/w/index.php?title=McDonnell_Douglas_F-4_Phantom_II&action=raw)
- MILAVIA, "McDonnell Douglas F-4 Phantom II Specifications" (F-4E): https://mail.milavia.net/aircraft/f-4/f-4_specs.htm (first published 10 Oct 2002, last modified 29 May 2014)
- migflug.com F-4 page (per-variant tables): https://migflug.com/afterburner/aircraft/f-4-phantom-ii/
- Richard Keyt, f-4phantom.com (8 Oct 2017): https://f-4phantom.com/?p=7
- man.fas.org F-4 page: https://man.fas.org/dod-101/sys/ac/f-4.htm (F-4G figures)
- Smithsonian NASM, F-4E 1/48 model: https://www.airandspace.si.edu/collection-objects/model-static-mcdonnell-douglas-f-4e-phantom-ii/nasm_A19981565000
- Sketchfab API (licences and counts): https://api.sketchfab.com/v3/models/<uid> (uids listed in section 9)
- Finescale forum on SEA camouflage FS numbers: https://forum.finescale.com/t/fs-numbers-for-vietnam-era-a-c-tri-color-camo/167859
- Finescale forum on Thunderbirds / Blue Angels colours and dates: https://forum.finescale.com/t/sea-camouflage-variations/116940 (Thunderbirds/Blue Angels notes came from [SB] snippets, not fetched in full)
- MILAVIA three-view: see [MIL] above.

**Unverified or missing from this research:** wing root and tip chord (only derived), fuselage width/height by station (est.), stabilator and fin areas (est.), nozzle diameter (est.), canopy and intake stations (est.), FS 36375 "Ghost Gray" and FS 36081 / 36231 (not confirmed), Blue Angels and Thunderbirds exact hex values (est.), refuelling probe and tailhook (general knowledge), all sound (no recording verified).
