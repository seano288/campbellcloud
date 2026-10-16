# Lockheed P-38 Lightning: research notes for the hangar game

Legend: **[S]** = sourced (see section 10). **(est.)** = estimated by me, not in any source. Hex colours are suggestions, not sourced.

Coordinate convention for section 2: x = 0 at the nose tip, increasing aft to the tail. y = lateral distance from the aircraft centreline (outward). z = height above ground. Units are metres unless stated.

---

## 1. Identity

- **Full name:** Lockheed P-38 Lightning. Maker: Lockheed Aircraft Corporation (Burbank, California). **[S]** Wikipedia.
- **Nicknames:** "Fork-tailed Devil" (German: *der Gabelschwanz Teufel*). Wikipedia notes the attribution is doubtful. British name "Lightning" replaced the original "Atalanta." **[S]**
- **Era:** Designed 1937–39. First flight 27 January 1939 (Ben Kelsey at the controls). Used in WWII. **[S]**
- **Role:** Single-seat, twin-engined fighter. Later variants: photo-recon (F-5), night fighter (P-38M), fighter-bomber, and the droop-snoot bomber conversion. **[S]** (variants from Wikipedia's variant list)
- **Crew:** 1 pilot. **[S]**
- **Production:** 10,037 built. **[S]**
- **Top scorer:** Richard Bong, 40 victories in P-38s, the highest-scoring US WWII ace. **[S]**
- **Yamamoto mission:** April 1943, 16 P-38Gs intercepted Admiral Yamamoto's transport. **[S]**

### Kid-friendly voice lines (each under 12 words, all true)

1. "This plane has two tails, like a giant fork!"
2. "Its two engines spin in opposite directions to stay steady."
3. "It can zoom faster than 400 miles every hour!"
4. "The pilot sits in the middle, between the two long tails."
5. "Over ten thousand of these planes were built long ago!"

Notes on truth: "two engines spin in opposite directions" is from the counter-rotating propellers **[S]**. "faster than 400 miles" is the 414 mph Military Power maximum speed **[S]**. The pilot sitting between the booms is from the central nacelle design **[S]**.

---

## 2. Geometry for procedural modelling

### 2a. Overall

| Item | Value | Source |
|---|---|---|
| Length | 11.53 m (37 ft 10 in) | [S] Wikipedia P-38L spec |
| Wingspan | 15.85 m (52 ft 0 in) | [S] |
| Height | 3.91 m (12 ft 10 in) | [S] Wikipedia. Note: reddog1944 lists 3.00 m. Conflict, Wikipedia used. |
| Wing area | 30.43 m² (327.5 ft²) | [S] |
| Aspect ratio | 8.26 | [S] reddog1944 |
| Mean chord | 1.92 m (est.) | span ÷ area = 15.85 ÷ 30.43 |
| Airfoil | NACA 23016 at root, NACA 4412 at tip | [S] reddog1944, sim-outhouse (root/tip assignment from sim-outhouse) |
| Empty weight | 5,806 kg (12,800 lb) | [S] |
| Gross weight | 7,938 kg (17,500 lb) | [S] |
| Max takeoff | 9,798 kg (21,600 lb) | [S] |

Scale for the hangar: model at roughly 1 unit = 1 m. Keep the whole aircraft about 11.5 units long.

### 2b. Central nacelle (gondola), the pilot and guns

- **Role:** central nacelle with the pilot and armament. **[S]** Wikipedia.
- **Forward tip = Station 0.** Engineering drawings put Station 0 at the nacelle's forward tip. **[S]** sim-outhouse.
- **Length:** not sourced. (est.) about 6.0 to 6.5 m, from nose to the wing-trailing-edge junction, then the tail booms carry the rest.
- **Nose:** solid nose on the standard fighter, housing the guns. The 20 mm cannon and four .50 cal sit in the nose. **[S]** (solid nose from historyofwar). Shape (est.): tapered, low-slung nose, slightly flattened top.
- **Nose cross-sections (est.)** with width (y, full width) and height (z range, ground = 0):

| x (m) | full width (m) | z bottom (m) | z top (m) | note |
|---|---|---|---|---|
| 0.00 | 0.00 | 1.00 | 1.00 | nose tip, point |
| 0.50 | 0.50 | 0.80 | 1.30 | |
| 1.20 | 0.80 | 0.70 | 1.55 | guns housing |
| 2.20 | 0.90 | 0.65 | 1.80 | |
| 3.20 | 0.95 | 0.65 | 1.95 | canopy starts about here |
| 4.20 | 1.00 | 0.65 | 2.05 | canopy peak |
| 5.00 | 0.95 | 0.65 | 1.95 | |
| 6.20 | 0.70 | 0.65 | 1.40 | rear of nacelle, wing junction |

- **Canopy (est.):** starts around x ≈ 3.2 m, ends around x ≈ 5.2 m, one-piece bubble canopy with a sloped windscreen. Canopy top about z = 2.05 m. Canopy is not described in any source I fetched. The night-fighter variant had a raised canopy for the radar operator. **[S]** (Wikipedia).
- **Droop-snoot variant:** guns removed. Nose replaced by a transparent Plexiglas bubble "similar in profile to that used on the Mosquito." Norden bombsight and bomb release inside. **[S]** historyofwar. Profile of the bubble not measured. (est.) a rounded cone, about 1.4 m long, from x = 0 to x ≈ 1.4 m, max diameter about 1.2 m.

### 2c. Tail booms (two, one each side)

- **Boom centreline offset from aircraft centreline:** engines are 8 ft (2.44 m) from centreline. **[S]** (sim-outhouse, from the template; the figure is attributed to the template and marked as unsourced in that thread). Use **y = 2.44 m** for the boom centreline (est. from that figure).
- **Boom start x:** the booms start at the nacelle's trailing edge, about x ≈ 5.8 m (est.).
- **Boom end x (tail):** x = 11.53 m (aircraft length).
- **Boom end section:** 13 in high × 10 in wide at the tail end. **[S]** sim-outhouse (forum, source not stated). Convert: 0.33 m high × 0.25 m wide.
- **Boom cross-sections (est.)** (y = half-width from boom centreline, z = height relative to ground):

| x (m) | half-width (m) | z bottom | z top | note |
|---|---|---|---|---|
| 5.8 | 0.45 | 0.80 | 1.80 | root, meets nacelle |
| 6.5 | 0.55 | 0.70 | 1.90 | engine nacelle bulge |
| 7.5 | 0.55 | 0.70 | 1.90 | engine, turbo behind |
| 8.5 | 0.42 | 0.80 | 1.70 | turbo bulge |
| 9.5 | 0.32 | 0.90 | 1.55 | |
| 10.5 | 0.22 | 1.00 | 1.40 | |
| 11.00 | 0.18 | 1.05 | 1.30 | |
| 11.53 | 0.12 | 1.10 | 1.20 | tail end, about 0.25 m wide and 0.33 m high **[S]** scale-check, est. |

- **Engine nacelle:** houses the Allison V-1710. Maximum engine width "a bit over 29 inches" (0.74 m). **[S]** sim-outhouse (Jane's). Use as the engine bulge diameter.
- **Radiator scoops (est., not sourced):** the boom has coolant radiator and oil cooler scoops. Placement (est.): one radiator and oil-cooler scoop on the underside of each engine nacelle, just aft of the propeller. Wikipedia states the intercooler sits in a chin between the oil coolers in the engine nacelles on the P-38J. **[S]** This is the "chin" under the engine.
- **Turbocharger:** behind the engine, in the boom, with its exhaust exposed on the top of the boom. **[S]** Wikipedia. Position (est.): x ≈ 8.3 to 8.9 m, on the boom's dorsal surface. Shape: a short rounded fairing with an exhaust outlet pointed aft. The exhaust outlet is a pipe with a grey metal tip.

### 2d. Wings

- **Planform:** straight-tapered, high aspect ratio. Centre section and outer panels joined at the nacelle.
- **Span:** 15.85 m total, 7.93 m per half. **[S]**
- **Root chord (est.):** 2.55 m at the centreline.
- **Tip chord (est.):** 1.28 m at the tip. (Taper ratio ~0.5, est., consistent with mean chord 1.92 m.)
- **Tip shape (est.):** square-cut or slightly rounded.
- **Leading-edge sweep:** 5° 11' 31" from a forum template, not confirmed against drawings. **[S]**-ish (sim-outhouse, unconfirmed). Use 5.2° as (est.).
- **Dihedral:** 5° 40' from the same template. **[S]**-ish (sim-outhouse, unconfirmed). Use 5.7° as (est.).
- **Incidence:** 2° at the centreline, 0° at the tip (forum template). **[S]**-ish.
- **Position along fuselage:** the wing sits at the nacelle's mid-to-rear section. Forum station data suggests the wing span station is at about 7.3 m from Station 0 (est.). Take x ≈ 6.3 m for the wing root leading edge and x ≈ 7.6 m for its trailing edge at the root (est.).
- **Wing root height (est.):** the wing joins the nacelle at about z = 1.1 m (est.), sitting low, mid-fuselage.
- **Ailerons, flaps:** Fowler flaps with a "combat maneuver" setting. Hydraulically boosted ailerons on later variants. **[S]** Wikipedia.

### 2e. Tail

- **Fins and rudders (twin):** one vertical fin and rudder on each boom, at the tail end. The booms carry the tail. **[S]** Wikipedia: "twin booms to accommodate the tail assembly."
- **Fin height (est.):** about 1.2 m above the boom top, based on proportion (not sourced). Fin shape (est.): rounded-top trapezoid, leading edge swept about 25°.
- **Horizontal stabilizer:** spans between the two booms. **[S]** sim-outhouse template: span 261 in (6.63 m), chord 45 in (1.14 m), elevator chord 20 in (0.51 m). Leading edge at Station 397.584 in (10.10 m from Station 0). Vertical offset 21.1 in (0.54 m) above the reference line. **[S]**-ish (forum template).
- **Tail assembly incidence:** 1.25° nose down (not modelled in template). **[S]**-ish.
- **Construction:** all-metal, aluminium skin (not fabric). **[S]** Wikipedia.

### 2f. Propellers

- **Blades:** 3 per propeller. **[S]** Wikipedia ("three-bladed Curtiss electric constant-speed propellers").
- **Diameter:** 11.5 ft (3.51 m). **[S]** sim-outhouse, Ivan's post (source not stated).
- **Rotation:** counter-rotating. Left engine turns one way, right engine the other. **[S]** Wikipedia.
- **Spinner:** tip at Station 44 1/32, base at Station 67.5 (forum template). Diameter not sourced. (est.) 0.6 m.
- **Engine thrust line:** 0.42 ft (0.13 m) above the Fuselage Reference Line. **[S]**-ish.

### 2g. Landing gear (tricycle)

- **Type:** tricycle. **[S]** (sim-outhouse template, standard P-38).
- **Main wheels:** 36 in (0.91 m) diameter. **[S]**-ish.
- **Nose wheel:** 27 in (0.69 m) diameter. **[S]**-ish.
- **Track:** 198 in (5.03 m), main wheels at 99 in (2.51 m) from centreline. **[S]**-ish.
- **Wheelbase:** 120.8 in (3.07 m). **[S]**-ish.
- **Nose gear:** sits under the nacelle, forward. (est.) x ≈ 2.8 m.

### 2h. Top-view half outline (x, y), y = outward from centreline, metres

Half-outline of nacelle plus one boom, starting at the nose and going aft. Both booms are mirror images about y = 0.

Nacelle (centre section, half):
(0.00, 0.00), (0.50, 0.25), (1.20, 0.40), (2.20, 0.45), (3.20, 0.48), (4.20, 0.50), (5.00, 0.48), (6.20, 0.35)

Wing root joint and boom root (est.):
(6.20, 0.35), (6.50, 1.20), (7.00, 1.50), (7.60, 1.60), (8.20, 1.70)

Boom outer edge, from wing trailing to tail (y = outer edge = 2.44 + half-width):
(8.20, 2.14), (8.50, 2.44 + 0.42 = 2.86), (9.00, 2.87), (9.50, 2.76), (10.00, 2.60), (10.50, 2.46), (11.00, 2.44 + 0.18 = 2.62), (11.53, 2.56)

Boom inner edge, back forward to the wing root:
(11.53, 2.32), (11.00, 2.26), (10.50, 2.22), (10.00, 2.27), (9.50, 2.36), (9.00, 2.44 - 0.45 = 1.99), (8.50, 2.02), (8.00, 1.90), (7.50, 1.90), (7.00, 1.62), (6.50, 1.20), (6.20, 0.35)

This outline is (est.) and is a sketch, not an accurate drawing. Use it as a starting point and check against a three-view drawing.

Horizontal stabilizer (half of the 261 in span, est. from section 2e): spans y from 0 to 3.315 m, chord 1.14 m, leading edge at x = 10.10 m.

### 2i. Side-view outline of the gondola (x, z), ground = 0 (est.)

(0.00, 1.00), (0.40, 1.10), (0.80, 1.25), (1.20, 1.45), (1.60, 1.60), (2.20, 1.75), (2.80, 1.85), (3.20, 1.95), (3.80, 2.05), (4.20, 2.10), (4.60, 2.05), (5.00, 1.95), (5.40, 1.80), (5.80, 1.55), (6.20, 1.30), (6.20, 0.70), (5.60, 0.65), (4.20, 0.65), (2.80, 0.65), (1.60, 0.70), (0.80, 0.80), (0.00, 1.00)

### 2j. Side-view outline of one boom (x, z), ground = 0 (est.)

Top edge, nose to tail:
(5.80, 1.80), (6.50, 1.90), (7.50, 1.90), (8.50, 1.70), (9.50, 1.55), (10.50, 1.40), (11.00, 1.30), (11.53, 1.20)

Bottom edge, tail to nose:
(11.53, 1.10), (11.00, 1.05), (10.50, 1.00), (9.50, 0.90), (8.50, 0.80), (7.50, 0.70), (6.50, 0.70), (5.80, 0.80)

Fin (vertical, on top of the tail, est.): (11.00, 1.30), (11.10, 2.50), (11.53, 2.50), (11.53, 1.20)

---

## 3. Distinctive features checklist (most important first)

1. **Twin tail booms** with the pilot in a central gondola. Nothing else looks like this. (Core silhouette.)
2. **Twin vertical fins and rudders** on the booms, with the horizontal stabilizer spanning between the booms. The "fork" shape.
3. **Central nacelle** that is low and tapered, with a bubble canopy on top and the guns under the nose.
4. **Counter-rotating propellers.** The two props turn in opposite directions. Visible from the front and behind.
5. **Turbochargers behind the engines**, with exhaust outlets on the top of each boom.
6. **Chin intercooler** under each engine nacelle. (P-38J and later, from Wikipedia.)
7. **Underwing drop tanks** (150 or 300 gallon) on the inner hardpoints. **[S]**
8. **Tricycle landing gear** with nose wheel under the gondola.
9. **Droop-snoot nose** (bomber conversion): a clear bubble in the nose, replacing the guns.
10. **Overall pale metal skin** with dark anti-glare panels in some wartime photos. (Hobbyist sources, unverified.)

---

## 4. Paint and liveries

Hex values are suggestions I chose (est.), not sourced from anywhere. Check against photographs before shipping.

### 4a. Real schemes

**1. Natural metal (default for many P-38Js)**
- Description: polished bare aluminium. Some sources say Bong's aircraft was polished metal with red wingtips. [S] historynet/wreck report (search snippet only).
- Main: #C9CCD1 (metal). Secondary: #8E9399 (shadow). Accent: #B22222 (red wingtips). Markings: #1A1A1A.

**2. Olive drab over neutral grey (early P-38s, F/G/H)**
- Description: olive drab upper surfaces, neutral grey lower surfaces. Standard USAAF scheme for early models. (est. general knowledge.)
- Main: #5C5E3A (olive drab). Secondary: #9EA19B (neutral grey). Accent: #E8D8A0 (yellow identification band). Markings: #FFFFFF (US star).

**3. Richard Bong's "Marge" (P-38J, 1944)**
- Description: named after Bong's girlfriend Marge Vattendahl. Aircraft is shown in polished metal with black anti-glare panels in front of the cockpit and on the engine booms' inboard sides. Nose art in colour, hand-tinted from a black-and-white portrait. [S] historynet/forum (not fetched).
- Main: #C9CCD1 (metal). Secondary: #1A1A1A (anti-glare panels). Accent: #B22222 (red wingtips). Markings: "Marge" in #FFFFFF script, nose portrait.
- Caution: a hobby forum says black vs OD on Bong's panels is disputed.

**4. Invasion stripes (D-Day, June 1944)**
- Description: black-and-white stripes on wings, booms and fuselage. Used on Allied aircraft for Normandy recognition. (est. general knowledge; not sourced here.)
- Main: #C9CCD1 (metal). Secondary: #1A1A1A (black stripes). Accent: #FFFFFF (white stripes). Markings: US star and national markings.

**5. "Glacier Girl" (restored 1992 recovery, Greenland)**
- Description: P-38 recovered from Greenland ice in 1992. Restored finish. **Paint scheme not confirmed by any source I fetched.** The recovered wreck is sometimes shown in natural metal. (est.)
- Main: #C9CCD1. Secondary: #8E9399. Accent: #D9A441 (gold name). Markings: "Glacier Girl" in #1A1A1A.

**6. F-5 photo-recon (unarmed, natural metal, with camera nose)**
- Description: the F-5 is the photo-reconnaissance variant, with cameras in the nose instead of guns. Often shown in a plain natural metal finish with a gloss-black nose. (est., F-5 colours not sourced.)
- Main: #C9CCD1. Secondary: #2B2F3A (black nose). Accent: #6D8A9C (recon blue-grey). Markings: US star.

**7. "Putt Putt Maru" (museum P-38L)**
- Description: a museum P-38L painted in the colours of Charles H. MacDonald's aircraft. **[S]** Wikipedia (postwar operations). Exact scheme not described.
- Main: #C9CCD1. Secondary: #5C5E3A. Accent: #E8D8A0. Markings: name and kill marks.

**8. Airshow / race scheme (polished metal, bright trim)**
- Description: polished silver with a bright stripe on the booms and fuselage. Common on post-war racing and airshow P-38s. (est.)
- Main: #E6E8EC (polished). Secondary: #C9CCD1. Accent: #E0A526 (yellow trim). Markings: #1F3A93 (blue cheat-lines).

**9. Night-fighter "black" (P-38M)**
- Description: matte black finish for the night-fighter variant with radar nose. (est. general knowledge.)
- Main: #1E2024 (black). Secondary: #2E3238. Accent: #4A8FD6 (radar blue, est.). Markings: #FFFFFF.

**10. Shark-mouth (Pacific nose art)**
- Description: shark teeth painted on the nose. Common Pacific-theatre nose art on P-38s. (est. general knowledge.)
- Main: #5C5E3A. Secondary: #9EA19B. Accent: #B22222 (mouth). Markings: #FFFFFF teeth.

### 4b. Mod ladder for paint (suggested)

- **Free default:** Olive drab over neutral grey (scheme 2). The "old reliable" look.
- **Rung 1:** Natural metal with red wingtips (scheme 1). Unlocked by the first 5 Bolts or equivalent.
- **Rung 2:** Invasion stripes (scheme 4). A paint-only upgrade with stripes.
- **Rung 3:** Bong's "Marge" (scheme 3). Named after a real pilot, with nose art and anti-glare panels.
- **Legendary:** "Sky Shark" fantasy scheme. Metallic purple-gold with shark teeth on the nose and rainbow stripes on the booms. (Fantasy, not historical; name chosen for kids.)

---

## 5. Armament and stores

### 5a. Real loadouts (sourced)

- **Nose (standard P-38):** 1 × Hispano M2(C) 20 mm cannon, 150 rounds. 4 × M2 Browning .50 cal (12.7 mm) machine guns, 500 rounds per gun. **[S]** Wikipedia.
- **Inner wing hardpoints:** up to 2,000 lb (907 kg) of bombs, or drop tanks, or several smaller combinations. **[S]** Wikipedia.
- **Outer wing hardpoints:** 10 × 5 in HVAR rockets, or 2 × 500 lb or 2 × 250 lb bombs. **[S]** Wikipedia.
- **Rocket option:** 4 × M10 three-tube launchers for 4.5 in M8 rockets, as an alternative to bombs. **[S]** Wikipedia (M10 name is in Wikipedia, verbatim).
- **"Christmas tree" rocket rack:** 5 rockets in 3 rows, looking like an upturned tree. Gives 10 × 5 in rockets per aircraft. Reported as the P-38L's rack. **[S]** search snippet (historyofwar P-38L page, not fetched). One Revell manual says the rack was seldom used. (CM_04701 manual, search snippet.)
- **Drop tanks:** 150 to 165 US gallon, and 300 to 310 US gallon. **[S]** Wikipedia. The P-38L could carry two 300-gallon tanks. **[S]** search snippet.
- **Bombs, typical combat load:** 1 × 1,000 lb bomb per aircraft (82nd Fighter Group, Ploiești mission). **[S]** Wikipedia.
- **Droop-snoot:** nose guns removed. Plexiglas bomb nose and a Norden bombsight. Bomb racks carry up to 1,600 lb. **[S]** historyofwar (2 × 2,000 lb on internal fuel), search snippet (1,600 lb).

### 5b. Per-hardpoint location (for the model)

| Hardpoint | Position (est.) | Store |
|---|---|---|
| Nose guns | x ≈ 0.5 to 1.5 m, centreline, under the nose | 20 mm cannon + 4 × .50 cal |
| Inner wing | y ≈ 1.2 m, under the wing near the nacelle | 2,000 lb bomb or 150/300 gal tank |
| Outer wing | y ≈ 3.0 to 5.0 m, under the wing | HVAR rockets, bombs |
| Centre (droop-snoot) | nose, x 0 to 1.4 m | Plexiglas bombardier's bubble |

### 5c. Armament mod ladder (suggested)

- **Free default: "Sky Guard"** — nose cannon + 4 machine guns. The standard fighter loadout.
- **Rung 1: "Rocket Rain"** — Christmas-tree rocket racks on the outer wings.
- **Rung 2: "Bomb Buddy"** — 1,000 lb bombs on the inner hardpoints.
- **Rung 3: "Long Haul"** — 300-gallon drop tanks for a long flight.
- **Legendary: "Thunder Tree"** — a fantasy version: 5-rocket trees on every hardpoint, with sparkle trails on launch.

---

## 6. Engines and propulsion

### 6a. Real engines (sourced)

- **Engine:** 2 × Allison V-1710. Liquid-cooled V-12. **[S]** Wikipedia.
- **Models:** V-1710-111/113. **[S]** reddog1944.
- **Power:** early P-38s 1,000 hp each. **[S]** Wikipedia intro. Later P-38L: 1,600 hp each at War Emergency Power, 60 inHg, 3,000 rpm. **[S]** Wikipedia P-38L spec. Power per engine 1,600 hp (1,194 kW). **[S]** reddog1944.
- **Turbosuperchargers:** both engines have a turbo-supercharger behind the engine in the boom. **[S]** Wikipedia. Turbo maker not confirmed in the sources I fetched. (est. General Electric, general knowledge.)
- **Exhaust:** turbos muffled the exhaust. The exhaust outlet is on top of the boom. **[S]** Wikipedia.
- **Propellers:** 3-blade Curtiss electric constant-speed. Left and right hand. Counter-rotating. **[S]** Wikipedia.
- **Propeller diameter:** 11.5 ft (3.51 m). **[S]**-ish (sim-outhouse). Use 3.5 m.
- **Engine width:** a bit over 29 in (0.74 m). **[S]**-ish (Jane's via sim-outhouse).

### 6b. Exhaust look

- Turbo outlets on the top of each boom: short, rounded pipes with a dark, slightly glowing tip under power (est.).
- Exhaust flame: a short blue-orange flare behind each boom outlet, only in fast or afterburner-style power boosts. (est. for game effect.)

### 6c. Engine mod ladder (suggested)

- **Free default: "Allison V-1710 (1,000 hp)"** — early P-38. Plain exhaust, normal prop speed.
- **Rung 1: "Allison V-1710 (1,600 hp)"** — late P-38L War Emergency Power. **[S]** Wikipedia. Bright glowing turbo exhausts.
- **Rung 2: "Turbo Spin"** — spinner tips painted, prop motion blur increased.
- **Rung 3: "Counter Thunder"** — exhaust flames from both booms, bigger puffs of smoke.
- **Legendary: "Sky Rocket Engines"** — fantasy: rainbow exhaust and sparkle trails, with props that leave coloured rings in the air.

---

## 7. Other cool mods specific to this aircraft

1. **Nose art** on the gondola nose. Moves: none. Decal swap on the nose texture. (Bong's "Marge" portrait is the historical example.)
2. **Kill markings** under the cockpit: small painted symbols, one per victory. Moves: the decal count grows as a reward.
3. **Prop spinner colours.** Each spinner can be red, blue or gold. Moves: spinner spins with prop; colour stays fixed.
4. **Recon camera nose (F-5).** The gondola nose swaps for a camera bulge with a small glass port. Moves: the camera port can open and close.
5. **Droop-snoot nose.** Swap the gun nose for the clear bubble. Moves: a small bombardier figure inside, a Norden bombsight that can turn.
6. **Drop tank ejection.** Tanks drop off the wing when the pilot presses the button. Moves: tank falls and tumbles.
7. **Rocket-tree launch.** Rockets fire from the outer wings, with trails. Moves: rockets fly forward in sequence.
8. **Counter-rotating prop indicator.** A small arrow on each spinner shows direction. Moves: arrows spin in opposite directions.

---

## 8. Sound (for Web Audio synthesis)

- **Engines:** twin Allison V-1710 V-12s, liquid-cooled. **[S]** Wikipedia.
- **Exhaust is quieter than most fighters** because the turbosuperchargers muffled it. **[S]** Wikipedia. Use a lower, softer engine tone than a Mustang or Spitfire.
- **Counter-rotating props.** Two prop tones, slightly detuned, with the beat frequency heard as a faint wobble. (est. sound design.)
- **Suggested synthesis:**
  - Two sawtooth oscillators at the firing frequency (est. 60 to 120 Hz at idle, 200 to 260 Hz at full power), slightly detuned by 2 to 4 Hz to give the counter-rotating beat.
  - Low-pass filter at 800 to 1,200 Hz to keep it soft.
  - Add a noise layer through a band-pass filter for the turbo whine: 1.5 to 3 kHz, rising with throttle. (est.)
  - Mix so the sound is about 6 dB quieter than a typical single-engine fighter loop.
- **Pitch by throttle:** idle 0.6 × base, full 1.5 × base. (est.)

---

## 9. Openly licensed 3D models

Searched Sketchfab, CGTrader, Free3D, RenderHub, 3DCadBrowser, Highend3d and general web. **No openly licensed (CC0 or CC-BY) P-38 model suitable for this game was found.** Details:

1. **Sketchfab: "P-38G Lightning" by Hangar.b.productions** — https://sketchfab.com/3d-models/p-38g-lightning-a65f49595cd646a9bd06a5a8b2e1332a
   - Licence as stated on the page: "NoAI: This model may not be used in datasets for, in the development of, or as inputs to generative AI programs." Not CC.
   - Downloadable: not stated. Only Embed and Share shown.
   - Format: not listed. Polygons: 1.1M triangles, 324.6k vertices.
   - Quality: described as the "Miss Virginia" (Rex Barber). Accuracy not stated. **Not usable** (not CC, too many polygons, no download).

2. **CGTrader: "Lockheed P-38 Lightning WW2 fighter"** — https://www.cgtrader.com/3d-models/aircraft/military-aircraft/lockheed-p-38-lightning-ww2-fighter
   - Licence per search snippet: "Royalty Free License," paid. Formats: OBJ, FBX, BLEND. Page fetch returned empty, so the licence was not checked on the page.
   - Quality: low-poly. Not CC. **Not suitable** without buying a licence. Check terms first.

3. **Free3D: "Lockheed P-38 Lightning Gentle Annie"** — https://free3d.com/3d-model/lockheed-p-38-lightning-gentle-annie-3731.html
   - Licence: **not verified** (page returned 403). A search snippet said one Free3D P-38 page is "Editorial Only."
   - **Not usable until licence is checked on the page.**

4. **RenderHub P-38 range (e.g. "Glamour Puss II", "Shadys Lady")** — https://www.renderhub.com/panaristi/lockheed-p-38-lightning-glamour-puss-ii
   - Licence per search snippet: "Extended Use License." Paid. Not CC.
   - **Not suitable** for a free game without a commercial licence.

5. **Poly Pizza, NASA 3D Resources, Smithsonian 3D, Wikimedia Commons** — searched, no P-38 result found. Poly Pizza returned HTTP 503. Wikimedia Commons had a 3D search result as a note only. **No usable result.**

**Verdict:** none suitable. Procedural modelling (as the brief suggests) is the realistic path. Use the sourced dimensions in section 2 and the three-view drawings in section 10 for checking.

---

## 10. Reference sources

- Wikipedia, Lockheed P-38 Lightning (fetched for specs, design, armament, operational history): https://en.wikipedia.org/wiki/Lockheed_P-38_Lightning
- reddog1944, P-38 Specifications (fetched; overall dimensions, airfoil, aspect ratio, engine ratings): https://reddog1944.com/P38_Specifications.htm
- sim-outhouse forum, Lockheed P-38 Lightning Design Study (fetched; station data, propeller, tail, undercarriage. Dimensions from a modeller's templates, not verified against drawings): https://sim-outhouse.org/sohforums/threads/lockheed-p-38-lightning-design-study.90998
- historyofwar, P-38 Droop Snoot (fetched; nose conversion): https://www.historyofwar.org/articles/weapons_P-38_droop_snoot.html
- historyofwar, Lockheed P-38L (search snippet only, not fetched; Christmas tree racks, drop tanks): https://www.historyofwar.org/articles/weapons_P-38L.html
- historynet, "Building Marge" (search snippet only): https://historynet.com/building-marge/
- American Air Museum, P-38 entries (search snippet only): https://americanairmuseum.com/aircraft/20119
- Air Corps Library, Lockheed P-38 manufacturer's drawings (catalogue only, membership needed to view): https://app.aircorpslibrary.com/drawing/viewer/198030 (aft boom lines), https://app.aircorpslibrary.com/drawing/viewer/199641

### Three-view drawings (for checking the geometry)

- Air Corps Library manufacturer's drawings (Lockheed Smithsonian Set): https://app.aircorpslibrary.com/drawing/viewer/199641, /198030, /203316, /194576 (individual drawings, catalogue listing). Membership needed.
- No public-domain three-view drawing was found in my search. Check the Wikimedia Commons category for "Lockheed P-38 Lightning" directly for a three-view image.

### Unresolved gaps (to check against drawings before building)

- Nacelle length and exact canopy shape.
- Root and tip chord (I estimated the taper).
- Radiator and oil-cooler scoop positions.
- Turbocharger exact position and maker.
- Propeller spinner diameter.
- Glacier Girl and F-5 paint details.
- Fin height and rudder area.
- Height conflict: Wikipedia 3.91 m vs reddog1944 3.00 m. This file uses 3.91 m.
