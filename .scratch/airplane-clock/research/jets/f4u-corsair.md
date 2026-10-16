# Vought F4U Corsair: research for the hangar game

Legend: **[src]** = sourced from a fetched page (see section 10). **(est.)** = my estimate, not in any fetched source. Treat all `(est.)` geometry as placeholders to check against a real three-view before modelling.

Variant note: sources mix F4U-1/-1D (≈10.2 m long, 4.5 m tall, 12.5 m span) with F4U-4 (10.26 m long, 4.50 m tall, 12.47 m span). Use the F4U-1D as the base model unless stated otherwise.

---

## 1. Identity

- **Full name:** Vought F4U Corsair (Chance Vought; designation "F4U" = fighter, 4th Navy type, U = Vought). [src Wikipedia]
- **Nicknames:** "Whistling Death" (widely cited; not confirmed in fetched text). "Hose Nose" and "Bent-wing Bird" are commonly used but not verified here.
- **Maker:** Chance Vought (prototype XF4U-1, factory designation V-166B, BuNo 1443). Goodyear built FG-series; Brewster built F3A-series. [src Wikipedia]
- **First flight:** 29 May 1940 (XF4U-1, pilot Lyman A. Bullard Jr.). First production F4U-1: 24 June 1942. [src Wikipedia]
- **In service:** introduced 28 Dec 1942; first combat 14 Feb 1943 (VMF-124, Kahili raid, Henderson Field). US retired 1953; Honduras 1979; final combat 1969 (Football War). [src Wikipedia]
- **Production:** 12,571 aircraft in 16 models. [src Wikipedia]
- **Role:** carrier and land-based single-seat fighter / fighter-bomber, WWII and Korea.
- **Crew:** 1 (pilot only). [src vought.org]
- **Engine:** Pratt & Whitney R-2800 Double Wasp, 18-cylinder twin-row radial. [src]

### Kid voice lines (under 12 words, all true)

1. "My wings bend like a seagull in the sky!" (9 words; gull wing is real)
2. "I can zoom faster than four hundred miles an hour!" (10 words; max speed 446 mph [src])
3. "My engine has eighteen cylinders. That is lots of power!" (9 words; R-2800 is 18-cylinder [src])
4. "I flew off big ships to help win a big war!" (10 words; carrier-based, WWII [src])
5. "My wings fold up, so I fit on a ship!" (9 words; folding wings; not in fetched text, from general knowledge, verify before shipping)

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions [src unless noted]

| Item | Value | Source / note |
|---|---|---|
| Length | 10.2 m (33 ft 4 in) F4U-1D; 10.26 m (33 ft 8 in) F4U-4 | Commons infobox; Wikipedia F4U-4 spec; vought.org 33.67 ft |
| Wingspan (unfolded) | 12.50 m (41 ft 0 in) F4U-1D/-4 | Wikipedia; vought.org gives 40.90 ft (12.47 m) for F4U-4 |
| Wingspan (folded) | not found in sources | (est.) roughly 4.5–5 m span with wingtips folded; verify |
| Height (tail on ground, gear down) | 4.50 m (14 ft 9 in) F4U-4; 14.75 ft on vought.org | Wikipedia; vought.org |
| Wing area | 314 sq ft = 29.17 m² | Wikipedia F4U-4 spec (one source for -1D) |
| Empty weight | 9,205–9,206 lb (4,238 kg) | Wikipedia; vought.org |
| Gross weight | 14,670 lb (6,654 kg) | Wikipedia; vought.org |
| Max speed | 446 mph sea level (717 km/h) | Wikipedia F4U-4; vought.org |
| Service ceiling | 41,500 ft | Wikipedia; vought.org |
| Range | 1,005–1,015 mi | Wikipedia; vought.org |

Mean geometric chord from area: 29.17 / 12.5 = 2.33 m (derived).

### 2b. Fuselage

- **Shape:** round, deep cowling at the nose (radial engine); fuselage tapers to a "razorback" profile with a raised spine behind the cockpit. [src mnvdet.com "razorback"]
- **Nose / cowl:** short, deep, circular cross-section. Spinner is pointed-blunt, roughly 0.4–0.5 m dia. (est.)
- **Fuselage structure:** large aluminium panels spot-welded to frames, very few rivets. Not a modelling constraint, but explains the smooth look. [src]
- **Fuselage length:** the F4U-1 fuselage was lengthened 1 ft 5 in (0.43 m) in a later change. [src Wikipedia]

**Cross-section stations** (x = % of total length from spinner tip; width/height in m; all **(est.)** except overall length):

| x % | x m | Width (m) | Height (m) | Section shape |
|---|---|---|---|---|
| 0 | 0.00 | 0.00 | 0.00 | spinner point |
| 5 | 0.51 | 0.80 | 0.80 | circle (cowl) |
| 15 | 1.53 | 0.98 | 1.00 | circle (cowl, max diameter) |
| 25 | 2.55 | 0.95 | 1.00 | rounded square, cowl ring |
| 35 | 3.57 | 0.80 | 1.05 | canopy front, flatten sides |
| 45 | 4.59 | 0.72 | 1.40 | canopy, raised spine |
| 55 | 5.61 | 0.62 | 1.35 | canopy rear, spine ridge |
| 65 | 6.63 | 0.52 | 1.05 | tapering, razorback |
| 75 | 7.65 | 0.40 | 0.85 | tail cone start |
| 85 | 8.67 | 0.28 | 0.55 | tail cone |
| 95 | 9.69 | 0.16 | 0.30 | tail |
| 100 | 10.20 | 0.05 | 0.05 | tail tip |

Note: width is half-width on the top view if you use the half-outline below; I've kept full width here.

### 2c. Canopy

- **Start / end:** starts about 33–35% of length (≈3.4–3.6 m from spinner) and ends about 55–58% (≈5.6–5.9 m) (est.).
- **Early F4U-1 canopy:** framed "birdcage" with many bars. [src mnvdet.com]
- **F4U-1A:** taller, wider canopy with two frames, pilot seat raised. [src Wikipedia]
- **Later models:** curved transparent panel behind the pilot's headrest on F4U-1; a bubble-top style on F4U-1D as used in the Flightline model listing (name source only). [src]
- **Royal Navy:** bulged canopy. [src Wikipedia]
- **Canopy jettison:** emergency jettison fitted. [src Wikipedia]
- **Cockpit position:** moved back 32 in (810 mm) on production models. [src Wikipedia]

### 2d. Intakes

- **Type:** supercharger / carburettor air intakes sit beside the oil coolers, not as protruding scoops. [src Wikipedia]
- **Position:** inboard wing leading edge at the root, just outboard of the fuselage and roughly at the cowl line. (est.)
- **Oil cooler openings:** in the wing leading edges. [src Wikipedia]

### 2e. Wings: inverted gull wing

**Structure [src Wikipedia]:** inverted gull wing. Shortens the landing gear struts needed for propeller clearance. Inboard section has pronounced anhedral, so the wing meets the fuselage at a near-optimal angle without root fairings. Outboard section has dihedral. Inboard panel has the oil coolers. Outboard panels are fabric-covered aft of the main spar and armament bays.

**Gull bend angles:** not in any fetched source. Sources agree only on the sign (inner = anhedral/down, outer = dihedral/up).

- **Inner panel anhedral:** about −20° to −25° (est.). Not verified.
- **Outer panel dihedral:** about +5° to +8° (est.). Not verified.
- **Bend location:** at roughly 30–35% of semi-span, where the landing gear attaches (est.; the gear sits at the joint [src search summary]).

Verify these against a three-view or the Vought drawings (see section 10) before modelling.

**Planform (est.):**

| Item | Value |
|---|---|
| Root chord (at fuselage) | ≈3.2 m (est.) |
| Tip chord | ≈1.2 m (est.) |
| Tip shape | square-ish, slightly rounded (est.) |
| Leading-edge sweep | small, ≈10–15° on outer panel (est.) |
| Semi-span | 6.25 m [src 12.5 m span] |
| Wing root position | leading edge at ≈3.9 m from spinner (≈38% of length) (est.) |
| Position along fuselage | wing sits low, mid-fuselage, roughly 38–52% of length (est.) |

Check: half area ≈ (3.2+1.2)/2 × 6.25 ≈ 13.75 m², vs 14.6 m² needed for 29.17 m². Close enough for a placeholder; tune root chord up to ≈3.4 m if you need an exact match.

**Thickness:** outboard airfoil ≈ 13–15% thick (est.). Inboard thicker near the root (est.).

**Wing folding:** outer panels fold upward/aft for carrier stowage. Fold angle and hinge position not verified in fetched sources. (est.) Fold hinge at ≈ 0.7 semi-span, panel rotates ≈ 90° up. Verify.

### 2f. Tail

- **Fin:** tall, pointed-top fin with a curved leading edge that blends into the fuselage spine. Fin top ≈ 4.5 m above ground (overall height). Fin height above fuselage top ≈ 3.2 m (est.).
- **Rudder:** tall, tapering, fabric-covered. [src Wikipedia: rudder and ailerons fabric-covered]
- **Horizontal stabiliser:** span ≈ 4.4 m (est.), chord ≈ 1.4 m (est.). Plywood elevators. [src Wikipedia: elevators plywood]
- **Tail wheel:** strut lengthened 6 in (150 mm) on F4U-1A. F4U-5 had a fully retractable tail wheel. [src Wikipedia]

### 2g. Propeller and spinner

- **Blades:** three-blade Hamilton Standard Hydromatic on F4U-1 (Wikipedia). F4U-4 used a different (4-blade) prop in my recollection; not verified here.
- **Diameter:** 13 ft 4 in = 4.06 m. [src Wikipedia]
- **Spinner:** short, pointed-blunt cone, ≈0.45 m dia. (est.)

### 2h. Landing gear [src Wikipedia]

- Oleo struts rotate 90° during retraction. The wheel sits at the lower end of the strut.
- Retracts rearward into a fully enclosed wheel well with a pair of doors.
- Gear attaches at the inner/outer wing joint (the gull bend).

### 2i. Top-view half-outline (x = m from spinner, y = m half-width outward) (est.)

**Fuselage half-width:**
```
(0.00, 0.00) (0.40, 0.22) (1.50, 0.49) (2.60, 0.52) (3.60, 0.45)
(5.60, 0.40) (7.50, 0.25) (9.00, 0.12) (10.20, 0.03)
```

**Wing (half-planform, leading edge then trailing edge):**
```
LE: (3.90, 0.50) (4.20, 1.50) (4.60, 3.00) (5.00, 4.50) (5.30, 5.60) (5.50, 6.25)
Tip: (6.70, 6.25)
TE: (6.70, 5.60) (6.75, 4.50) (6.80, 3.00) (6.90, 1.50) (7.10, 0.50)
```

**Tailplane half (est.):**
```
LE: (8.30, 0.30) (8.40, 2.20)  Tip: (8.60, 2.20)  TE: (9.80, 2.20) (9.80, 0.30)
```

### 2j. Side-view outline (x = m from spinner, z = m above ground) (est.)

**Top edge** (fuselage top through fin top):
```
(0.00, 1.80) (0.50, 2.25) (1.50, 2.40) (2.60, 2.45) (3.60, 2.65)
(4.50, 2.90) (5.60, 2.85) (6.50, 2.60) (7.50, 2.40) (8.50, 2.30)
(9.20, 2.80) (9.80, 4.50) (10.20, 4.40) (10.20, 3.10)
```

**Bottom edge** (underside to tail):
```
(0.00, 1.80) (0.60, 1.20) (2.00, 1.00) (4.00, 1.00) (6.00, 1.00)
(8.00, 1.05) (9.20, 1.20) (10.20, 1.80)
```

Ground line is z = 0. Main gear wheel contact sits near the wing bend, so the nose is about 1.8 m high (est.).

### 2k. Front-view wing half-line (y = m half-width, z = m above ground) (est.)

Shows the gull bend:
```
(0.55, 1.80)   root
(2.20, 1.20)   gull bend (gear joint)
(6.25, 1.60)   tip
```
Inner slope ≈ 20° anhedral. Outer slope ≈ 5.5° dihedral. Both est.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Inverted gull wing.** Dead giveaway. Wings look bent down near the fuselage and kink up toward the tips.
2. **Massive three-blade prop with a radial engine.** Short, fat nose and a large round cowl.
3. **Tall, pointed tail fin on a razorback fuselage.** Fin looks very tall against a short tail.
4. **Birdcage canopy (F4U-1) or bubble-style canopy (later).** Early version has many frame bars.
5. **Wing-root air intakes** on the leading edge, where the wing meets the fuselage.
6. **Wings with fold hinges.** Outer panels fold up for carrier stowage.
7. **Fixed landing gear fairing shape with rear-retracting wheel doors.**
8. **Short, blunt-tipped spinner.**
9. **Large fin above the tail with a tall rudder.**
10. **Pacific-era markings:** Navy white star or red-white-blue, or the VMF-214 black sheep emblem.

---

## 4. Paint and liveries

Hex values are **(est.)** approximations of named colours. Real paint standards are FS (Federal Standard) numbers; match against a paint chart before shipping if accuracy matters.

### 4a. Real schemes (6–10)

1. **Tri-colour USN (1943–44 standard).** Upper Dark/Sea Blue; intermediate blue on some areas; light grey underside. White/red roundels and bars. Main `#1F3A5F`, secondary `#8A9BA8`, underside `#B9C2C9`, markings: insignia white `#F2F2EE`, insignia red `#C8102E`. (est.)
2. **Glossy Sea Blue (USN, post-war standard).** Gloss blue top, light grey underside. Main `#1E3A5F`, underside `#C5CDD3`, markings white `#F2F2EE` and red `#C8102E` (est.).
3. **VMF-214 "Black Sheep" (Pappy Boyington).** Black overall; F4U-1A BuNo 17883 photographed at Vella Lavella, end 1943 [src Wikipedia caption]. Main `#1C1C1C`, secondary `#3A3A3A`, markings white `#F2F2EE`, accent `#C8102E`. (est.)
4. **Royal Navy FAA (Dark Slate Grey / Extra Dark Sea Grey top, Sky underside).** Original RN finish [src Wikipedia]. Main `#3A4A4F` (Dark Slate Grey), secondary `#3E4A3F` (Extra Dark Sea Grey), underside `#8FA8B8` (Sky), markings white `#F2F2EE`, RN roundel red `#C8102E` (est.).
5. **Royal Navy overall dark blue (later RN).** Later RN finish overall dark blue [src Wikipedia]. Main `#2A3F5A`, markings white `#F2F2EE` (est.).
6. **Operation Musketeer (Aéronavale).** Yellow-and-black recognition stripes [src Wikipedia]. Main `#C8C8C0` (grey), stripes yellow `#F2C300` and black `#1C1C1C` (est.).
7. **Boyington "Bent Bird" (BuNo 17883, Black Sheep).** Named scheme from Pappy Boyington's aircraft, same as #3. Use as a named variant with a sheep emblem on the cowl. (est. design.)
8. **Corsair "Hot Rod" race livery (fantasy).** Red and white with gold pinstripes. Not a real scheme. Fantasy.
9. **Nose art pin-up (fantasy).** Generic WWII-style nose art. Use an invented name like "Lil' Thunder".
10. **Kill-marking scheme.** Rows of small mission marks on the cowl or fuselage. Common in the Pacific, generic. Mark accents `#F2F2EE` (est.).

### 4b. Mod ladder (suggested)

| Step | Name | Scheme | Unlock idea |
|---|---|---|---|
| Free default | **Sea Blue Starter** | Glossy Sea Blue (#2) | none |
| Rung 1 | **Black Sheep** | VMF-214 black, sheep emblem (#3) | 50 Bolts |
| Rung 2 | **Sky Sea Blue** | Royal Navy dark slate / sky (#4) | 120 Bolts |
| Rung 3 | **Striped Musketeer** | yellow-black stripes (#6) | 220 Bolts |
| Legendary | **Golden Gull** | fantasy gold-and-white with star sparkles | 400 Bolts or a special puzzle |

---

## 5. Armament and stores

### 5a. Real loadouts [src unless noted]

- **Guns (F4U-1, production):** six .50 cal M2 Browning machine guns, three per outer wing panel. Inner pair 400 rounds; outer pair 375. [src Wikipedia]
- **Guns (F4U-1C):** four 20 mm cannon. Only 200 built. [src Wikipedia]
- **Guns (F4U-4):** six .50 cal. F4U-4B and F4U-4N: four 20 mm cannon. F4U-4C: four 20 mm. [src vought.org]
- **Prototype:** two .30 cal cowl guns and two .50 cal wing guns, later changed. [src Wikipedia]
- **Wing hardpoints:** four under each wing, for up to eight 5-inch HVAR rockets. [src Wikipedia; F4U-4B "eight 5-inch rockets under the wings"]
- **Centreline and pylon racks:** up to 4,000 lb of bombs. [src Wikipedia; vought.org]
- **Drop tanks:** 150 US gal each, carried on the bomb racks. [src vought.org "includes two 150-gal drop tanks"]
- **Tiny Tim rocket:** not verified in fetched sources. Skip unless you verify.

Model placement (est. where not sourced):
- Gun ports on the outer leading edge of each wing panel, outboard of the gull bend.
- Rocket rails under the wing, four per side, evenly spaced along the outboard panel.
- Bomb / drop-tank pylon under the centreline (fuselage belly, mid-length, just aft of the wing).

### 5b. Armament mod ladder (5 steps)

| Step | Name | Loadout |
|---|---|---|
| Free default | **Pop-Pop Guns** | six .50 cal guns |
| Rung 1 | **Rocket Rider** | eight 5-inch rockets, four per wing |
| Rung 2 | **Bomb Buddy** | centreline bomb + pylon bombs (up to 4,000 lb total) |
| Rung 3 | **Long Trip** | two 150-gal drop tanks (extra range) |
| Legendary | **Sky Sparkler** | fantasy rainbow-trail rockets |

Note for a 6-year-old: avoid words like "kill" or "bomb" as the main label if the parent wants softer language. "Bomb Buddy" is fine, but "Pop-Pop Guns" is cute. Adjust to taste.

---

## 6. Engines and propulsion

### 6a. Real variants [src unless noted]

| Variant | Engine | Rated power | Water injection | Notes |
|---|---|---|---|---|
| F4U-1 | R-2800-8 | 2,000 hp (military and takeoff) | no | Production F4U-1 [src Wikipedia] |
| F4U-1D | R-2800-8W | 2,000 hp; 2,250 hp WI emergency | yes | One source; a Paul Bennett listing says 2,630 hp (outlier) [src search] |
| F4U-4 | R-2800-18W | 2,100 hp (military/takeoff); 2,450 hp WI emergency | yes | vought.org; another source says 2,380 hp (conflicting) |
| XF4U-1 prototype | XR-2800-4 | 1,805 hp | no | [src Wikipedia] |

Summary: R-2800 is 18-cylinder, twin-row, air-cooled radial. Three-blade prop for -1/-1D. F4U-4 uses a different prop (4-blade in my recollection, not verified).

### 6b. Exhaust and cowl look (est.)

- Individual short exhaust stacks along each side of the cowl, in a row near the lower cowl rim. Eighteen stacks total, nine per side (est. for 9 per row; two rows of nine per side is my understanding).
- Exhaust is dark, sooty, with blue-orange glow when the model "fires up" (for effect only).
- Cowl is deep and round; air intake for the engine at the front.
- Oil cooler on the underside of each wing root, inboard (est.).

### 6c. Engine mod ladder (5 steps)

| Step | Name | Engine | Look |
|---|---|---|---|
| Free default | **Starter Engine** | R-2800-8, 2,000 hp | plain cowl, stacks |
| Rung 1 | **Water Boost** | R-2800-8W, 2,250 hp | extra intake shine |
| Rung 2 | **Four-Blade Power** | R-2800-18W (F4U-4), 2,450 hp WI | four-blade prop |
| Rung 3 | **Gold Stacks** | same engine, gold exhaust stacks | cosmetic |
| Legendary | **Golden Double Wasp** | fantasy: glowing gold radial, sparks from stacks | fantasy |

Propeller variants for the ladder: three-blade (default) vs four-blade (F4U-4). Spinner colour can match the paint.

---

## 7. Other cool mods specific to this aircraft

1. **Folding wings.** Outer panels fold up and aft on a hinge at ≈ 0.7 semi-span. Animate rotation ≈ 90° over 1.2 s. Fold angle and hinge location (est.); verify.
2. **Prop spin.** Three or four blades rotate at engine speed. Animate with a visible blur disc above ~ 1000 rpm. Idle slow, climb fast.
3. **Gull-wing flap / aileron movement.** Outboard ailerons droop on take-off and move ±20° in roll. Animate as a joystick response.
4. **Landing gear.** Gear swings 90° rearward into wheel bays. Doors close after the wheel. Animate on a button.
5. **Canopy style.** Birdcage (F4U-1) vs bubble-style (later). Swap meshes. Slide open on canopy jettison.
6. **Kill markings.** Small mission markers on the fuselage or cowl. One per "good landing" or per level completed. Cosmetic.
7. **Tail hook.** The carrier-equipped variants have a tail hook under the rear fuselage. Not verified in fetched sources. Flip down before landing if you add a carrier mini-game.

---

## 8. Sound

- **Engine character:** 18-cylinder twin-row radial. Deep, rough, burbling "chuffa-chuffa" at idle, rising to a loud, full-throated roar at full power. (est.; qualitative)
- **Firing frequency (for Web Audio):** at 2,700 rpm, the crankshaft turns 45 rev/s. Each cylinder fires every 2 revs. 18 cylinders fire 405 firings/s. Set a 405 Hz fundamental for full-power roar; drop to ~ 45 Hz at idle with an 18-cylinder firing pattern (est. rpm and derivation; verify rpm).
- **Propeller:** a low-frequency "whoosh" at blade-pass frequency = 3 × prop rpm/60 (for 3 blades). At 2,700 rpm engine, prop rpm is lower (gear-reduced); estimate 1,400 rpm prop → 70 Hz blade-pass (est.).
- **Wing-root intake whistle:** high-pitched whine from the supercharger and wing-root intakes, mainly under power and in dives. Synth: a bandpassed noise around 2–4 kHz, with gain rising with throttle (est.; qualitative).
- **Overall mix:** engine roar (low-mid), prop whoosh (mid), intake whistle (high), and wind rush at speed.

---

## 9. Openly licensed 3D models

Verification: the Sketchfab search API (`api.sketchfab.com/v3/search`) returned `license.label` and `isDownloadable` for each model. I did not open the model page itself for these, because the page fetches came back empty. Check the download panel for glTF/OBJ before use.

Five candidates with plain CC Attribution (CC BY), downloadable per API:

| # | Model | Author | Licence (API) | Faces / Vertices | Notes |
|---|---|---|---|---|---|
| 1 | **Corsair F4U** https://sketchfab.com/3d-models/corsair-f4u-c49ca24bbf33451183a4205c4ff6420b | perceval-66 | CC Attribution | 8,658 / 4,059 | Wings3D + GIMP. Good mid-poly base. Best first pick. |
| 2 | **F4u** https://sketchfab.com/3d-models/f4u-b042ee1ca0674810a7d05a7a568dd284 | manilov.ap | CC Attribution | 29,566 / 15,409 | Higher detail. Heavier for iPad. Check mesh quality. |
| 3 | **F4U-1A Corsair** https://sketchfab.com/3d-models/f4u-1a-corsair-db935aad8a314805b973b5f8591261ef | PBC33 | CC Attribution | 3,042 / 1,619 | Light, good for an iPad. Check for a fold-wing mesh. |
| 4 | **F4U Corsair - Low Poly** https://sketchfab.com/3d-models/none-cb11ebb220454ae1b72d913a5bd9b1d0 | Wersaus33 | CC Attribution | 596 / 354 | Very low poly. Fine for a fallback or LOD. |
| 5 | **Corsair F4U-1 Airplane** https://sketchfab.com/3d-models/corsair-f4u-1-airplane-7d3f0002261346c8adc20c11f86992f1 | Alec Huxley | CC Attribution | 160,592 / 80,593 | Too heavy for mobile. Search summary calls it a background prop; verify. |

**Excluded or flagged:**
- **War Thunder models (KojfDiscord, ~20 entries).** Labelled CC BY, but built from game assets whose rights belong to Gaijin Entertainment. Do not use; licence claim is doubtful.
- **F4U-4 by ThomasBeerens.** CC BY-NC, so no commercial use.
- **Plane Corsair F4U-4 low poly edition (The lighthouse keeper).** "Free Standard" licence, not on the allowed list.
- **Sircher raw scan (585k faces).** CC BY but photogrammetry, far too heavy.
- **Aeroux "Vought F4U Corsair Lowpoly" (150 faces).** CC BY but too crude; credits go to Art in Games; attribution chain unclear.
- **Smithsonian (si.edu/object/nasm_A19610124000).** Blocked (403). Not checked.
- **Poly Pizza.** No Corsair model found.
- **CGTrader.** Proprietary/paid licences, not CC; excluded.
- **Fab.** Licences not shown; excluded.

Attribution: CC BY requires credit to the author with a link and a note of changes. Keep a credits screen.

---

## 10. Reference sources

**Used (fetched):**
- Wikipedia, Vought F4U Corsair — https://en.wikipedia.org/wiki/Vought_F4U_Corsair (dimensions, engine, production, service, wing, fuselage, gear, armament)
- Vought, F4U-4 specification page — https://www.vought.org/products/html/f4u-4spec.html (dimensions, weights, engine ratings, speeds, armament)
- Military Machine, F4U-1D vs F6F-5 comparison — https://militarymachine.com/ww2-aircraft/compare/f4u-1d-corsair-vs-f6f-5-hellcat (F4U-1D span/length/area cross-check)
- Wikimedia Commons, Category: Vought F4U Corsair — https://commons.wikimedia.org/wiki/Category:Vought_F4U_Corsair (infobox: 10.2 m length, 4.5 m height, 12.5 m span)
- Wikimedia Commons, Category: F4U Corsair drawings — https://commons.wikimedia.org/wiki/Category:F4U_Corsair_drawings (drawing list)
- Wikimedia Commons, Vought F4U-1 Corsair 3-view.svg — https://commons.wikimedia.org/wiki/File:Vought_F4U-1_Corsair_3-view.svg (CC BY-SA 3.0, Kaboldy; no printed dimensions)
- Sketchfab search API (licence and face count data) — https://api.sketchfab.com/v3/search?type=models&q=corsair%20f4u&downloadable=true&count=24
- mnvdet.com, Vought F4U — https://www.mnvdet.com/PAOWWIIACWTS/Vought_F4U.html ("razorback" fuselage, birdcage canopy)
- Flightline F4U-1D "Bubble Top" listing (name only) — https://www.motionrc.com/collections/in-stock-products/products/flightline-f4u-1d-corsair-bubble-top-1600mm-63-wingspan-pnp-flw3041p

**Not reached:**
- Sketchfab model pages (empty fetch).
- Smithsonian NASM object (403).
- Wikimedia "Vought AU-1 Corsair Standard Aircraft Characteristics 1953" — likely a US Navy document, but licence not verified.
- Aircorps Library drawings (members only).

**Still needed to finish geometry:**
- Verified wing gull angles and bend position (check a 1943–44 Vought three-view or NACA/NAVAIR report).
- Verified wing fold geometry (hinge location, fold angle).
- Verified tail dimensions (fin height, tailplane span/chord).
- Verified prop rpm and firing rpm for sound.
