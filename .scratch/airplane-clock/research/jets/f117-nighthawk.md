# Lockheed F-117 Nighthawk: research for the hangar game

Status: research draft. Sourced figures are cited inline. Anything without a source is marked (est.) and must be checked before it is treated as fact. Geometry coordinates are our own approximations built from the sourced overall dimensions, not from a published drawing. Planform area does NOT reconcile with the sourced wing area (see 2c, conflict C2).

Sources used (full URLs in section 10):
- [W] Wikipedia, "Lockheed F-117 Nighthawk" (infobox, lead, development, specifications, operational history, post-retirement references)
- [FG] Fiddler's Green, Lockheed F117 page (67.5 degree wing sweep, dimensions)
- [TD] This Day in Aviation, tag page for tail 79-10780 (67 deg 30 min sweep, dimensions)
- [ASF] Air & Space Forces Magazine, F-117 page (dimensions in feet, via search snippet)
- [ARRSE] ARRSE wiki, F-117 page (metric dimensions)
- [WCM] Wikimedia Commons, Lockheed F-117A Nighthawk.svg (public domain outline image)
- Attempted but NOT usable: GlobalSecurity (HTTP 402), AeroSpaceWeb F-117 page (HTTP 500), National Museum of the USAF fact sheet (HTTP 403), Poly Pizza search (HTTP 502), Sketchfab model page and Sketchfab search (returned empty page text).

---

## 1. Identity

- **Full name:** Lockheed F-117A "Nighthawk". Official designation F-117A. The official name is "Night Hawk"; "Nighthawk" is also used. [W]
- **Nicknames:** "Stealth Fighter" and "Wobblin' Goblin" (the Wobblin' Goblin nickname is widely used but was NOT found in the fetched sources; treat as unverified). "Stealth Fighter" appears in the search listings. [W, search]
- **Maker:** Lockheed Corporation, Skunk Works division. [W]
- **First flight:** 18 June 1981, YF-117A 79-10780, at Groom Lake, Nevada. [W]
- **Introduced:** First production aircraft delivered 1982; initial operating capability October 1983. [W]
- **Built:** 64 aircraft (5 YF-117A, 59 F-117A). Last production aircraft delivered 3 July 1990. [W]
- **Era and retirement:** Cold War. Retired from combat service in 2008. Operational aircraft were retired in seven waves from 13 March 2007 to 22 April 2008. The last aircraft left Palmdale on 11 August 2008. [W]
  - NOTE: the brief said "2021 retirement". That is WRONG per the sources. 2021 is when F-117s were seen flying again: a pair landed at Fresno Yosemite International Airport on 13 September 2021, after retirement. [W, reference titles]
- **Role:** Single-seat, subsonic, twin-engine stealth attack aircraft. [W]
- **Crew:** 1 (single pilot). [W]
- **Armed:** Yes. Internal bombs only (see section 5).

### Kid-friendly voice lines (each under 12 words, simple words)
1. "My flat, pointy shape helps me sneak past radar!" (Simplified. Faceted shape and stealth design are sourced in [W]; the radar-sneaking claim is the stealth purpose in simple words.)
2. "My wings point way back, like a sharp arrow!" (Wing sweep 67.5 degrees, sourced [FG], [TD].)
3. "My bombs hide inside me, so my outside stays smooth!" (Internal weapons bays, sourced [W].)
4. "I first flew in 1981. Pilots called me the Stealth Fighter!" (First flight 18 June 1981 [W]. Nickname "Stealth Fighter" from search listings.)
5. "I fly so quiet and sneaky, I was a secret for years!" (Program was secret until its public reveal in 1988. The 1988 date was not in the fetched text. Verify before shipping.)

---

## 2. Geometry for procedural modeling

### 2a. Overall dimensions

| Quantity | Value | Source |
|---|---|---|
| Length | 20.09 m (65 ft 11 in) | [W] infobox; [TD] 65 ft 11 in; [ARRSE] 20.08 m; [ASF] 65.9 ft |
| Wingspan | 13.21 m (43 ft 4 in) | [W] infobox; [TD]; [FG]; [ARRSE] 13.20 m |
| Height | 3.78 m (12 ft 5 in) | [W]; [TD]; [ARRSE] 3.78 m |
| Wing area (reference) | 72 m² (780 sq ft) | [W] specifications |
| Empty weight | 13,381 kg (29,500 lb) | [W] |
| Max takeoff weight | 23,814 kg (52,500 lb) | [W] |
| Max speed | Mach 0.92; 594 kn (1,100 km/h) | [W] specifications. CONFLICT: [W] design section says 623 mph (1,003 km/h) at high altitude. |
| Service ceiling | 45,000 ft (14,000 m) | [W] specifications; design section says 43,000 to 45,000 ft |
| Max climb rate | 2,820 ft/min (860 m/min) | [W] |
| Range | 930 nmi (1,720 km) | [W] |
| Aspect ratio | b²/S = 13.21² / 72 = 2.42 (derived, not sourced) | derived |

Variable states: none. The airframe is fixed. Only moving surfaces: elevons on the wing trailing edge, ruddervators on the V-tail, and the nozzle/exhaust panels. Bay doors are the only other movers (section 5).

### 2b. Wing sweep and planform

- **Leading-edge sweep: 67.5 degrees.** [FG] "swept back 67.5°"; [TD] gives 67 deg 30 min. Use 67.5°. Note: [W] lists "50° sweep angle" in its specifications, which conflicts. Two independent sources support 67.5, so use 67.5 and log the conflict.
- **Empennage (tail) leading-edge sweep: 20 degrees.** One search snippet states "empennage ... leading-edge sweep at 20°". Source page not fetched. Treat as single-source.
- **Wing shape:** A delta-like wing with a W-shaped (sawtooth) trailing edge, which was intended to reduce radar return from the trailing edge. The trailing-edge notch placement below is estimated (est.).
- **Control surfaces:** four elevons on the wing trailing edges (one search snippet, source page not fetched; treat as single-source).
- **Chines:** The fuselage and wing blend through sharp chines running from the nose back into the wing. Chine line positions below are est.

### 2c. CONFLICT C2: planform area does not reconcile

With 13.21 m span and 67.5 degree leading-edge sweep, a straight delta planform gives roughly 100 m² full area. The sourced reference wing area is 72 m² [W]. The outline in 2e (A) gives about 102 m² (computed). The reference area may count the blended body differently. Fix options for the modeller:
- (a) Keep sweep and span, accept the larger wing (visually closer to the real silhouette), or
- (b) pull the outboard trailing edge forward to hit 72 m² (costs the W-tail look).
Recommendation: option (a) for the visual look. Log it as a known deviation.

### 2d. Fuselage facets (est. unless marked)

Coordinates are metres in a model frame: x = 0 at the nose, x increases aft; y = 0 on the centreline, positive to starboard; z = 0 at the ground (tyre contact). All est. unless noted. The shape is built from flat facets with sharp chines, which is the defining look.

Nose and forward fuselage:
- N0 nose tip: (0.00, 0.00, 0.90)
- N1 upper nose: (1.20, ±0.35, 1.05)
- N2 chine root (nose/wing junction): (4.00, ±0.80, 0.80)
- N3 belly forward: (0.00, 0.00, 0.45)
- N4 belly mid: (6.00, ±0.80, 0.30)

Canopy (faceted, see 2f):
- C0 windscreen centre top: (3.50, 0.00, 1.60)
- C1 canopy apex: (6.50, 0.00, 2.00)
- C2 canopy side top: (6.00, ±0.85, 1.75)
- C3 canopy aft top: (9.00, 0.00, 1.60)
- C4 canopy aft side: (9.00, ±0.95, 1.55)

Dorsal ridge and aft fuselage:
- D0 dorsal ridge aft: (15.50, 0.00, 1.45)
- D1 dorsal shoulder: (15.50, ±1.00, 1.10)
- B0 belly aft: (14.00, ±1.00, 0.30)
- B1 belly tail: (19.50, ±0.80, 0.35)

Intake grilles (sit on the upper surface above the wing roots; positions est.):
- I0 intake front lip: (8.00, ±2.20, 1.10)
- I1 intake aft lip: (11.00, ±2.20, 1.10)
- I2 intake grille plane top: (9.50, ±2.20, 1.25)

Exhaust (flat slot nozzles at the rear; est.):
- E0 upper slot outer: (19.20, ±1.20, 0.95)
- E1 slot aft edge: (19.90, ±1.20, 0.75)

### 2e. Top-view half outline (x, y), metres; mirror for the other side

Traced around the right half from the nose to the centreline trailing edge:
(0.00, 0.00) → (1.20, 0.35) → (4.00, 0.80) [chine root] → (18.50, 6.60) [wingtip LE, 67.5 deg from root] → (19.00, 6.60) [tip TE] → (16.80, 3.20) [outer notch] → (18.20, 1.00) [inner point] → (18.20, 0.00) [centreline TE]

Area check (computed, python): half = 50.9 m², full = 101.9 m² (conflict C2).
Note on the nose: the chine root sits at 4.0 m, so the fuselage width at the nose is very narrow and the body blends into the wing outboard.

### 2f. Side-view outline (x, z), metres (top and belly)

Top, nose to tail: (0.00, 0.90) → (3.50, 1.60) → (6.50, 2.00) → (9.00, 1.60) → (15.50, 1.45) → (16.20, 1.40) [V-tail root] → (17.60, 3.78) [V-tail tip leading edge at top] → (19.60, 3.50) [V-tail trailing tip] → (20.09, 2.50) [tail end, est.]

Belly, tail to nose: (20.09, 0.50) → (19.50, 0.35) → (14.00, 0.30) → (6.00, 0.30) → (0.00, 0.45) → back to nose.

Ground contact: nose gear and main gear touch z = 0 (est. gear length below the belly line; see 2h).

### 2g. V-tail (ruddervators)

Each side is a flat, planar panel, cant of about 50 degrees from vertical (est.; the 50 deg value was NOT found in fetched sources).
- Root leading edge: (16.20, ±0.45, 1.40)
- Tip leading edge: (17.60, ±3.20, 3.78)
- Tip trailing edge: (19.60, ±3.20, 3.50)
- Root trailing edge: (19.60, ±0.45, 1.50)
- Cant check (computed): atan(2.75/2.38) = 49.1 degrees from vertical with the vertices above.
- Leading-edge sweep: about 27 degrees from the spanwise axis (computed from the vertices; sourced single-source value is 20 degrees, so tune to 20 if preferred).
- Function: ruddervators. The surfaces act as elevator and rudder combined (one search snippet; single-source).
- Span/size: est. about 3.2 m tip from centreline. The 3.78 m overall height [W] sets the tip height.

### 2h. Landing gear (est.)

- Tricycle gear. Nose gear under the forward fuselage, two main gear under the centre fuselage. Gear sizes est.
- The Have Blue demonstrators used A-10 landing gear [W]. The production F-117 gear was not described in the fetched text.
- Brake chute: a drag chute at the rear is commonly reported. Not verified in fetched sources; treat as est.

### 2i. Canopy (faceted, gold-tinted)

- Single-seat canopy built from flat panels (facets), with a large framed windscreen. The shape is in 2d (C0 to C4).
- Gold tint: the canopy is often shown as gold-tinted. Not confirmed in fetched sources; the exact tint is est.
- The cockpit has a large blind spot to the rear [W].

---

## 3. Distinctive features checklist (recognition order)

1. **Faceted, flat-sided shape** with sharp chines and no curved surfaces. The most recognisable cue.
2. **Wings swept back at 67.5 degrees** (very sharp leading edge). [FG]
3. **The W-shaped (sawtooth) trailing edge** with a notch in the centre.
4. **V-tail** (two angled fins, not a conventional tail). [W]
5. **Flat slot exhausts** at the rear (noncircular, slit-shaped nozzles). [W]
6. **Black paint** on the standard scheme (paint section).
7. **Two intake grilles** above the wing roots, covered with a conductive mesh [W].
8. **Bomb bay doors** under the belly, which open to drop a bomb on a trapeze (section 5).
9. **Small single-seat canopy** with a gold tint (est.).
10. **Tall, short-coupled look** for a 20 m jet. Overall height 3.78 m [W].

---

## 4. Paint and liveries

Colours marked (est.) are our palette suggestions, not sourced paint codes. Do not present them as official.

### 4a. Real schemes (names and descriptions)

1. **Standard flat black ("RAM black")**: Operational service. Matte black with radar-absorbing material (RAM) coatings. The default livery for most of its career. Source: general description in [W] (the black colour and stealth role). Hex: main #1B1E22 (est.), secondary #2A2E33 (est.), accent #3A3F45 (est.), markings #E8E8E8 (est.) for unit stencils.
2. **"Gray Dragon" experimental camouflage**: A grey test scheme pictured in [W] Development section. Hex: main #7A8088 (est.), secondary #5C626A (est.), accent #A9AEB5 (est.), markings #101214 (est.).
3. **Pastel camouflage (first flight)**: [W] cites "Why The F-117 Made Its First Flight In Pastel Camouflage 40 Years Ago Today" (The War Zone, 18 June 2021) as a reference. Pastel tones. Hex: main #B9C4CC (est.), secondary #9AA7B0 (est.), accent #D8DDE2 (est.), markings #3A4046 (est.).
4. **"Have Blue" prototype look**: The Have Blue demonstrators were 1977-era prototypes [W]. Their paint was not described in fetched text. Hex: main #43474D (est.), secondary #2B2F34 (est.), accent #6A7077 (est.), markings #D0D4D8 (est.). Treat as an imagined look, not a real scheme, unless verified.
5. **Mirror-like skin (2022)**: A reference title in [W] cites "F-35 And F-117 Spotted Flying With Mysterious Mirror-Like Skin" (The Drive, 23 January 2022). One aircraft had a reflective coating, believed to reduce infrared signature. Hex: main #8C949C (est.), secondary #6E767E (est.), accent #C5CCD3 (est.), markings #1E2226 (est.).
6. **Flag-theme belly livery (2008)**: Two aircraft in 2008 flew with a US flag theme painted on their bellies [W]. The word "Thanks" was in the brief and was NOT verified in sources. Hex: main #1B1E22 (est.), secondary #B22234 (est.), accent #FFFFFF (est.), markings #3C3B6E (est.). Belly-only: the flag appears under the fuselage.
7. **49th Fighter Wing (Holloman AFB, New Mexico)**: [W] lists the 49th Fighter Wing at Holloman from 1992, with the 7th, 8th and 9th squadrons flying the F-117 (1992 to 2006/2008). Markings: wing tail-band and squadron badges. Hex: main #1B1E22 (est.), secondary #1B1E22 (est.), accent #C8102E (est.), markings #F2C200 (est.). Badges are not described in fetched text, so keep as "wing band + squadron badge" only.
8. **37th Tactical Fighter Wing (Tonopah era)**: [W] lists the 37th TFW absorbed the 4450th Tactical Group in 1989; squadrons 415th, 416th, 417th. Markings: 37th TFW tail band. Hex: main #1B1E22 (est.), secondary #1B1E22 (est.), accent #0B3D91 (est.), markings #F2C200 (est.).
9. **Gold canopy**: A common look. The canopy tint is est. Gold tint suggestion: #C9A227 (est.) with a reflective edge #E8D27A (est.).
10. **Desert or grey splotch camouflage (post-retirement flights)**: The brief asked for this. NOT verified. None of the fetched sources described a desert or splotch scheme. Do not ship unless a source is found. Hex if used: main #8A7E68 (est.), secondary #5F5646 (est.), accent #B5A98C (est.), markings #2B2822 (est.).

### 4b. Mod ladder (paint and livery)

- **Free default:** Standard flat black (1). Kid name: "Night Black".
- **Rung 1:** Gray Dragon test grey (2). Kid name: "Sneaky Grey".
- **Rung 2:** Flag-belly (6) or 49th Fighter Wing band (7). Kid name: "Flag Friend" or "Holloman Hawk".
- **Rung 3:** Mirror-like shine (5). Kid name: "Shiny Ghost".
- **Legendary:** Gold canopy plus gold trim (9). Kid name: "Golden Night Hawk".

---

## 5. Armament and stores

### 5a. Real loadout (sourced)
- **No gun.** Internal weapons only. [W]
- **Two internal weapons bays.** Each bay has one hardpoint. The split internal bay carries up to 5,000 lb (2,300 kg) total. [W]
- **Trapeze:** The bomb hangs in a bay on a trapeze-style rack. Each bomb swings down on its trapeze carriage and is released from the bay. One search snippet described the rack as "like wishbone automobile suspension members turned vertical". Single-source.
- **Laser-guided bombs:** GBU-10, GBU-12, GBU-27 (laser-guided); GBU-31 JDAM; BLU-109 and BLU-116 penetrators [W].
- **Nuclear:** The B61 is listed in [W]. Do NOT include in the kids' game.
- **External pylons:** None in service. (Consistent with the brief; not separately verified.)
- **Typical loadout (est.):** One GBU-10 or GBU-27 per bay. The GBU-10 is a 2,000 lb class bomb (est. length 4.3 m, diameter 0.46 m; not fetched, est.).

### 5b. Bay doors and trapeze (est. unless noted)
- Bay doors open downward to drop the bomb. The door opening time is anecdotal (one Reddit comment, about one second per drop); do NOT use as fact.
- Bay size: est. about 4.5 m long by 0.8 m wide per bay (est., to fit the bomb plus trapeze). Not sourced.
- Trapeze: a pair of angled arms that rotate the bomb down out of the bay. Modeled as two hinged bars.

### 5c. Weapon mod ladder (kid-friendly, no nukes)
1. **Free default:** Two laser-guided "Sure-Zap" bombs (GBU-10 class). Bay doors open, bombs drop on trapeze. Kid name: "Laser Lightning".
2. **Rung 1:** Laser-guided bomb upgrade (GBU-27 class). Kid name: "Super Laser Bomb".
3. **Rung 2:** GPS-guided bomb (GBU-31 JDAM class). Kid name: "Satellite Bomb".
4. **Rung 3:** Penetrator bomb (BLU-109 class). Kid name: "Tunnel Buster".
5. **Legendary:** Sparkle bomb (fantasy, no real equivalent). Kid name: "Rainbow Star Bomb".

### 5d. Bay door show (big cool factor)
- Bay doors slide or swing open with a clunk and a hydraulic hiss sound. Bombs swing down on the trapeze and drop. Doors close after release.

---

## 6. Engines and propulsion

- **Engines:** Two General Electric F404-F1D2 non-afterburning turbofans. [W]
- **Thrust:** 9,040 lbf (40.2 kN) each. [W]
- **Note:** The F404 family is also used on the F/A-18. The F-117 variant is non-afterburning (no reheat), so no afterburner flame. [W]
- **Exhaust:** Noncircular, slit-shaped tailpipes (nozzles). They mix hot exhaust with cool ambient air to lower infrared signature. [W]
- **Inlets:** Intake grilles covered with a conductive metal mesh to block radar returns through the intake. [W]

### 6a. Engine mod ladder
1. **Free default (realistic):** F404-F1D2 at 9,040 lbf per engine, no afterburner, slit exhausts. Kid name: "Quiet Hawk Engine".
2. **Rung 1:** Brighter exhaust glow at takeoff (visual only, est.). Kid name: "Glow Engine".
3. **Rung 2:** Cooler-exhaust mode (slit panels open wider, est.). Kid name: "Cool Breeze".
4. **Rung 3:** Thrust-vector nozzles (fantasy; not on F-117). Kid name: "Turning Thrust".
5. **Legendary:** Rainbow exhaust trail (fantasy). Kid name: "Rainbow Jet".

---

## 7. Other cool mods specific to this aircraft (4 to 8 ideas)

1. **Bay doors and trapeze:** Doors slide open, trapeze lowers, bomb drops. Moves: two bay doors (hinge at the outer edge), two trapeze arms, one bomb. Sequence is 0.3 to 0.6 s (est.).
2. **Drag chute on landing:** A small brake chute deploys from the tail on touchdown. Moves: one chute, scale up from a small disc. Brake chute existence is est. (see 2h).
3. **Retractable antennas:** Small antennas pop out on the belly and lower back when flying. Moves: 2 to 3 short rods, rotate 90 degrees. Not historical; a mod.
4. **Gold canopy:** Canopy tint changes to gold with a moving glint. Moves: material colour only.
5. **Glowing night-ops lights:** Low-intensity glow along the chines and exhaust slots at night missions. Moves: emissive material toggle. Not historical; a mod.
6. **Radar-shimmer effect:** The jet briefly shimmers and turns semi-transparent when it passes over a radar screen, then solidifies. Moves: shader alpha pulse, 1 to 2 s.
7. **Stealth mode toggle:** Tap to fade the trail and turn the paint matte black. Moves: material roughness and colour.

---

## 8. Sound (for Web Audio synthesis)

Sourced: none. All estimates below (est.). Synthesize with Web Audio:
- **Engine idle:** Low hum from two turbofans, about 80 to 120 Hz fundamental with a soft high-frequency whine (est.), filtered noise plus a sine sweep.
- **Takeoff:** Rising whine up to 2 to 3 kHz, with broadband roar (est.). Use a noise source through a band-pass filter, sweep centre frequency 800 Hz to 3 kHz.
- **Bay door open:** Hydraulic hiss (noise through a high-pass filter, 1 s) plus a mechanical clunk (short sine click at 120 Hz with fast decay).
- **Bomb drop:** Short whoosh (down-sweeping noise) and a soft thud.
- **Landing:** Tyre chirp (noise burst) and brake squeal (high-pitched sine at 1.5 to 2.5 kHz).
- **Radar shimmer (mod):** Soft shimmer (high sine at 4 to 6 kHz, fast tremolo).

---

## 9. Openly licensed 3D models

Searched Sketchfab, CGTrader, Poly Pizza, Wikimedia Commons, TurboSquid and RenderHub. Result: no suitable CC0 or CC-BY 3D model was verified.

1. **Wikimedia Commons outline (2D SVG, not a 3D model):** https://commons.wikimedia.org/wiki/File:Lockheed_F-117A_Nighthawk.svg
   - Licence (as stated on the page): "I, the copyright holder of this work, release this work into the public domain. This applies worldwide." Author: Stefan von Halenbach, 6 May 2008.
   - Format: SVG, 491 x 280 px nominal.
   - Quality: useful as a silhouette reference to trace the top-view or side-view outline. The page does NOT confirm it is a three-view drawing.
2. **Sketchfab: "Lockheed F-117 Nighthawk" (listed in search results):** https://sketchfab.com/3d-models/lockheed-f-117-nighthawk-d944c746c365478ebef94210f9965a53
   - Licence: NOT VERIFIED. The fetch returned empty page text. The search result said "3D Model NoAI", which suggests a no-AI-training restriction, not an open licence.
   - Do not use without checking the licence on the live page.
3. **CGTrader: low-poly F-117 (listed in search results):** https://www.cgtrader.com/3d-models/aircraft/military-aircraft/lockheed-f-117-nighthawk-lowpoly-stealth-bomber
   - Licence: NOT VERIFIED. Search summary says royalty-free (paid), not open.
4. **TurboSquid: F-117 low-poly (listed in search results):** https://www.turbosquid.com/3d-models/lockheed-f-117-nighthawk-low-poly-1663675
   - Licence: NOT VERIFIED. Search summary says "editorial use only" at $24, which is not open for a shipped game.
5. **RenderHub (Max3ddd) low-poly F-117:** https://www.renderhub.com/max3ddd/lockheed-f-117-nighthawk-low-poly
   - Licence: NOT VERIFIED. Search summary says Extended Use License (IP restricted) and Editorial Use Only. Not open.

Verdict: No suitable openly licensed 3D model was confirmed. Procedural modeling from the coordinates in section 2 is the recommended route. Use the Wikimedia SVG only as a 2D reference. Poly Pizza returned HTTP 502 and the Smithsonian and NASA 3D sites were not checked.

---

## 10. Reference sources

Used:
- [W] Wikipedia, Lockheed F-117 Nighthawk: https://en.wikipedia.org/wiki/Lockheed_F-117_Nighthawk
- [FG] Fiddler's Green, Lockheed F117 (67.5 deg sweep): https://www.fiddlersgreen.net/models/aircraft/Lockheed-F117
- [TD] This Day in Aviation, tag 79-10780 (67 deg 30 min sweep): https://www.thisdayinaviation.com/tag/79-10780/
- [ASF] Air & Space Forces Magazine, F-117 Nighthawk: https://www.airandspaceforces.com/weapons/f-117/
- [ARRSE] ARRSE wiki, F-117 Nighthawk (metric dims): https://www.arrse.co.uk/wiki/F-117_Nighthawk
- [WCM] Wikimedia Commons, F-117A outline SVG (public domain): https://commons.wikimedia.org/wiki/File:Lockheed_F-117A_Nighthawk.svg
- [TWZ] The War Zone, "Why The F-117 Made Its First Flight In Pastel Camouflage 40 Years Ago Today" (18 June 2021). Title only, cited via [W] references; article not fetched.
- [TDR] The Drive, "F-35 And F-117 Spotted Flying With Mysterious Mirror-Like Skin" (23 January 2022). Title only, cited via [W] references; article not fetched.

Attempted and failed (do not rely on, re-try later):
- GlobalSecurity F-117 page: https://www.globalsecurity.org/military/systems/aircraft/f-117.htm (HTTP 402)
- AeroSpaceWeb F-117 page: https://aerospaceweb.org/aircraft/bomber/f117/ (HTTP 500; has a 3-view schematic per search snippet)
- National Museum of the USAF fact sheet: https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/198020/lockheed-f-117-nighthawk/ (HTTP 403)
- Poly Pizza search: https://poly.pizza/search/f-117 (HTTP 502)

Three-view drawings (not confirmed as dimensioned):
- Wikimedia Commons PNG: https://commons.wikimedia.org/wiki/File:Lockheed_F-117A_Nighthawk.png (licence not checked)
- AeroSpaceWeb 3-view schematic: https://aerospaceweb.org/aircraft/bomber/f117/ (page failed; re-try)
- Sam Pearson 1:72 plans referenced in a Cybermodeler review: https://cybermodeler.com/hobby/ref/guide/book_guide_war138.shtml (book, paid)
- The-Blueprints vector drawings (free, dimensions not shown in search): https://the-blueprints.com/blueprints/modernplanes/lockheed/2195/view/lockheed_f-117a_nighthawk

Open questions to resolve before modeling:
1. Confirm the wing trailing-edge notch placement and planform area (conflict C2).
2. Confirm the V-tail cant angle (50 deg is est.; 49 deg matches the coordinates in 2g).
3. Confirm the 20 deg empennage sweep (single-source).
4. Confirm the max speed (594 kn vs 623 mph conflict, [W]).
5. Confirm canopy tint and bay door size from a readable three-view drawing.
