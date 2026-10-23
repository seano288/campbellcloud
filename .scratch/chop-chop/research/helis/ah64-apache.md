# Boeing AH-64 Apache (AH-64E Apache Guardian): research notes for a procedural 3D hangar model

Tags: **[src]** sourced (see section 10), **(derived)** arithmetic on sourced numbers, **(est.)** my estimate (photo or three-view read-off). Where sources disagree, both values are given. Imperial figures are converted as printed. Model the **AH-64E**; the **AH-64D Longbow** radar dome is the most visible older-variant feature and the British **WAH-64 / Apache AH1** is the export cousin.

---

## 1. Identity

- **Full name:** Boeing AH-64 Apache. Current variant: **AH-64E Apache Guardian** (the AH-64D Block III was redesignated AH-64E). [src: Wikipedia, https://en.wikipedia.org/wiki/Boeing_AH-64_Apache]
- **Nicknames:** "Apache" is the usual name. "Guardian" is the AH-64E's name. [src: Wikipedia]
- **Maker:** Hughes Helicopters originally (Model 77 prototype) [src: Wikipedia]; later McDonnell Douglas and now Boeing [src: Boeing product page]. The 1984 purchase detail is (est.) from memory, not fetched. Westland built the British WAH-64 under licence. [src: Wikipedia, search excerpt]
- **First flight:** 30 September 1975, the YAH-64A prototype. [src: Wikipedia]
- **In service:** U.S. Army, April 1986, first operational unit at Fort Hood. [src: Wikipedia]
- **AH-64E:** first U.S. Army unit fielded 21 February 2013; initial operating capability 27 November 2013. [src: Wikipedia, search excerpt]
- **Production:** over 2,700 delivered to the U.S. Army and 18 international partners as of March 2024. [src: Wikipedia]
- **Role:** Two-seat attack helicopter (anti-tank, close air support, armed reconnaissance). [src: Boeing product page, paraphrased]
- **Crew:** 2, in a **tandem cockpit**. The pilot sits behind and above the co-pilot/gunner. [src: Wikipedia; Boeing spec "Standard Crew 2"]

### Kid-friendly voice lines (each under 12 words)

1. "Its main rotor has four blades, each one a quarter!" (9 words). Source: four-blade main rotor [src: Wikipedia]. Quarter fact is (derived).
2. "It has two engines, and two pilots sit in the cockpit." (10 words). Source: two T700 engines [src: Wikipedia]; two-crew standard [src: Boeing].
3. "Its spinning rotor is almost fifty feet across!" (8 words). Source: rotor diameter 48 ft / 14.63 m [src: Wikipedia; Boeing].
4. "It has a big radar dome on top, like a flying hat." (11 words). Source: Longbow radar sits in a dome above the main rotor [src: Wikipedia]. "Like a hat" is my comparison.
5. "It can zoom faster than 170 miles per hour!" (9 words). Source: max speed 158 knots = 182 mph [src: Wikipedia, AH-64A/D spec]. True for the A/D spec; the E's "150+ knots" figure [src: Boeing] is about 173 mph, so "faster than 170" holds for both.
6. "The British Army flew it too, called the Apache AH1!" (10 words). Source: the Westland-built WAH-64 was the Apache AH1 [src: Wikipedia, search excerpt]. Note: the AH1 was reported retired by 2024, so use past tense if asked about it again.
7. "Two pilots sit one behind the other in the cockpit!" (10 words). Source: tandem cockpit [src: Wikipedia].
8. "Over 2,700 of these helicopters have been made!" (8 words). Source: over 2,700 delivered as of March 2024 [src: Wikipedia].

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | Imperial as printed | Source / note |
|---|---|---|---|
| Overall length (with rotors, nose to tail, rotor at rest) | **17.73 m** | 58 ft 2 in | [src: Wikipedia AH-64A/D spec] |
| Fuselage length (nose to tail, excluding rotor) | **15.06 m** (A/D spec) / **14.7 m** (Boeing E page) | 49 ft 5 in / 48.2 ft | [src: Wikipedia; Boeing]. Sources differ by ~0.36 m. Use 15.1 m for the A/D and 14.7 m for the E; the difference may be the nose sensor or nose-cone length, not confirmed. |
| Main rotor diameter | **14.63 m** (radius 7.32 m) | 48 ft 0 in | [src: Wikipedia; Boeing] |
| Height (to top of rotor mast / top of rotor hub) | **4.7 m** (E, Boeing) | 15.5 ft | [src: Boeing]. Wikipedia lists **3.87 m** (12 ft 8 in) for A/D, which probably measures to the fuselage top, not the mast. Treat 4.7 m as the top of the mast, and 3.9 m as a rough fuselage-top value (est.). |
| Fuselage width (widest point, est.) | **~1.5 m** (est.) | | Not published. Read off the silhouette. |
| Stub-wing span | **GAP**, not found | | SKYbrary lists 14.63 m as "wing span", which equals the rotor diameter and is probably wrong. Do not use. See Known gaps. |
| Empty weight (A/D) | 5,165 kg | 11,387 lb | [src: Wikipedia AH-64A/D spec] |
| Max take-off / operating weight | 10,433 kg | 23,000 lb | [src: Wikipedia; Boeing] |
| Primary mission gross weight (E) | 6,838 kg | 15,075 lb | [src: Boeing] |

**Use for in-game scale:** the fuselage is about 15 m long, and the main rotor is about 14.6 m across. The rotor is nearly as long as the whole fuselage, and the rotor sits high over the cockpit.

### 2b. Main rotor

- **Count:** 1 (single main rotor on a mast over the centre of the fuselage). [src: Wikipedia]
- **Diameter:** 14.63 m (48 ft). Radius **7.32 m**. [src: Wikipedia; Boeing]
- **Blade count:** **4**. [src: Wikipedia; Boeing "Rotor Diameter"/"four blades"]
- **Blade chord:** not published. Estimate **0.5 m** (est.) per blade, tapering. Blade area is also not found.
- **Turn direction (seen from above):** **counter-clockwise** (est.), as on most U.S. single-rotor helicopters. Not found in sources.
- **Hub/mast height above ground:** not published. Estimate about **3.6 m** to the hub (est.), from the 4.7 m top-of-mast figure less mast and Longbow housing.
- **Hub position (x from nose):** not published. Estimate about **6.5 m** (est.), roughly the middle of the fuselage, slightly forward of centre, since the cockpit and engines sit forward and the mast is over the centre. (est.)
- **Longbow radar dome:** sits **in a dome above the main rotor**, on the mast top. [src: Wikipedia] Radar dome size not found; use a small dome about 0.9 m across (est.).

### 2c. Anti-torque: tail rotor

This is the unusual feature. The brief's "scissor, non-90°" description needs care.

- **Blade count:** **4**. [src: Wikipedia "4-bladed tail-rotor"]. One slideshow said "two blades each" for a double tail rotor; that did not match the other sources and is ignored.
- **Blade offset:** **55 degrees**, "non-orthogonal blade offset", not the usual 90°. [src: Wikipedia; AFIT thesis abstract by Mark C. Newkirk, 2007, https://scholar.afit.edu/etd/2946, full text https://apps.dtic.mil/sti/pdfs/ADA470136.pdf]. The thesis says the Apache "was the first helicopter of its kind to fly with the tail rotor blade offset by 55 degrees." The 90° is the usual reference; 55° means the blade pairs are not at right angles, which gives the "scissor" look.
- **Name:** the sources say "non-orthogonal", not "scissor". The "scissor" label is the brief's wording and I did not find it in a source. Model it as a non-90° blade offset.
- **Tilt / canting from vertical:** a "20° canting" figure was given in a prompt I did not confirm. **Not verified**; do not model a 20° tilt as a fact.
- **Which side of the tail boom:** not found in sources. Estimate **port (left) side** of the tail boom (est.). Verify from photos.
- **Diameter:** **GAP**, not published in anything I could reach. Estimate **about 2.7 m** from photos (est.), and treat as a guess.
- **Height and x position:** not published. Estimate the hub at about **1.6 m** above ground on the tail (est.) and about **12.0 m** aft of the nose (est.), near the tail boom end where the fin sits.

### 2d. Engines

- **Count:** 2. **Type:** General Electric **T700-GE-701D** (AH-64E). [src: Wikipedia; Boeing]
- **Power:** 1,994 shp per engine (T700-701D, AH-64E). [src: Wikipedia] AH-64A/D: 1,690 shp, later 1,890 shp T700-701C. [src: Wikipedia]
- **Exhaust:** **high-mounted** exhausts on top of the engine housings. [src: Wikipedia]
- **Positions:** engine nacelles sit side by side on top of the fuselage, behind the mast and over the rear cabin. Position: est. about 1 m either side of centre line, about 7.5 m aft of nose (est.).

### 2e. Fuselage station table (est.)

Stations are x in metres from the nose. Width and height are estimates from the silhouette, not published values. z is the centre of the section above ground. Treat all values as (est.).

| Station | x from nose | width | height | centre z above ground |
|---|---|---|---|---|
| Nose (sensor tip) | 0.0 | 0.3 | 0.4 | 1.6 |
| Chin / gun turret | 1.0 | 0.9 | 0.9 | 1.5 |
| Cockpit front | 2.0 | 1.3 | 1.4 | 1.9 |
| Cockpit mid | 3.5 | 1.5 | 1.7 | 2.2 |
| Cockpit rear / mast ring | 5.5 | 1.6 | 1.9 | 2.4 |
| Engine deck | 7.5 | 1.5 | 1.5 | 2.9 |
| Engine rear | 9.5 | 1.2 | 1.4 | 2.5 |
| Tail boom start | 11.5 | 0.6 | 0.7 | 2.0 |
| Tail boom mid | 13.5 | 0.4 | 0.4 | 1.9 |
| Tail end | 15.0 | 0.3 | 0.3 | 1.8 |

- **Tail boom:** length about 4 m (est.) from the cabin's rear to the tail end; diameter about 0.4 m at mid (est.).
- **Cockpit canopy:** tandem, bubble-shaped with a sloped front. Canopy shape is est. from photos; not sourced.
- **Landing gear:** see 2g.

### 2f. Top and side silhouettes (est.)

Half-width top view (x, y), y = half width from centre line, in metres. (est.)

| x | y |
|---|---|
| 0.0 | 0.00 |
| 1.0 | 0.45 |
| 2.5 | 0.65 |
| 5.0 | 0.75 |
| 7.5 | 0.75 |
| 10.0 | 0.35 |
| 12.5 | 0.20 |
| 15.0 | 0.15 |

Side view (x, y), y = height above ground (est.):

| x | y |
|---|---|
| 0.0 | 1.4 |
| 1.0 | 1.2 |
| 2.5 | 1.4 |
| 4.0 | 2.0 |
| 6.0 | 2.6 |
| 8.0 | 2.6 |
| 10.0 | 2.2 |
| 12.5 | 2.0 |
| 15.0 | 1.9 |

### 2g. Tail surfaces

- **Vertical fin:** a tall fin on the tail boom. Span and chord not published. Estimate height about 2.4 m, chord about 1.0 m (est.).
- **Horizontal stabiliser:** span about 3.0 m (est.), chord about 0.6 m (est.), on the tail boom near the fin base. Not sourced.
- **Endplates:** Not confirmed.

### 2h. Stub wings

- **Span:** **GAP**. Not found. Estimate about **6.4 m** (est.) from photos, a rough figure only; SKYbrary's 14.63 m is the rotor, not the wing. Mark as est. in the game.
- **Chord:** about **0.7 m** (est.).
- **Hardpoints:** **4**, two per side, on the stub-wing pylons. [src: Wikipedia] Pylon positions: est. about 1.0 and 3.0 m outboard of the fuselage side (est.).

### 2i. Landing gear

- **Type:** tricycle-style landing gear (nose wheel, two main wheels), **retractable**? Not confirmed.
- **Wheel size / track / height:** not sourced. Estimate main wheels about 0.7 m diameter, track about 2.6 m (est.), nose wheel about 0.5 m (est.). Treat as a guess.
- **Skids:** not used on the Apache; the standard is wheels. (Mark as est.)

---

## 3. Distinctive features checklist (most recognisable first)

1. **Tandem cockpit** with the pilot behind and above the gunner (est. silhouette, [src]).
2. **Longbow radar dome** on top of the main rotor mast (AH-64D/E) [src]. The AH-64E keeps this radar.
3. **Stub wings with 4 hardpoints**, carrying Hellfire and rockets [src].
4. **Chin-mounted 30 mm M230 chain gun** under the nose [src].
5. **Four-blade main rotor** and **four-blade tail rotor** [src].
6. **Tail rotor with the 55° non-90° blade offset** [src: Wikipedia, AFIT thesis].
7. **Two side-by-side engine housings** with high-mounted exhausts [src].
8. **Narrow, slim fuselage** with a tall fin (est.).

---

## 4. Paint & liveries

Colours are (est.) unless marked. I could not find published hex values. Use the hex values as approximations.

1. **U.S. Army olive drab (default)** - hex about #4B5320 (est.) on the fuselage, tail boom, and stub wings. Dark green markings and black stencils. Used for the bulk of the U.S. Army fleet.
2. **Desert tan / sand (Iraq and Afghanistan)** - hex about #B9A77A (est.) with darker brown panels (est.). Used in deployments.
3. **Dark grey (Navy-style demonstrator, est.)** - hex about #4A4F55 (est.). Related to the Navy's "Sea Apache" concept (not built as a production type).
4. **British Army AH1 (WAH-64) grey-green (est.)** - hex about #6B7556 (est.). The AH1 used a grey-green scheme; check photos before use.
5. **AH-64E Guardian demonstrator white (est.)** - hex about #E8E8E8 (est.), with blue markings. Used on Boeing demonstrators (not verified).

### Suggested mod ladder (game)

- **Free default:** Olive Drab (scheme 1).
- **Upgrade 1 - Desert Tan:** swap to sand (scheme 2).
- **Upgrade 2 - Radar Glow:** add a blue glow on the Longbow dome (cosmetic only).
- **Upgrade 3 - Night Vision Lights:** green-glowing cockpit and lights (cosmetic only).
- **Legendary - Demonstrator White:** scheme 5 with gold stripes.

---

## 5. Armament & stores

- **Main gun:** **30 mm M230 chain gun**, chin-mounted under the forward fuselage, rate of fire **600–650 rounds per minute**, **1,200 rounds** carried. [src: Wikipedia; Boeing]. Turret: a chin turret, mounted under the nose, not on the top.
- **Rockets:** **76 × 2.75-inch (70 mm) Hydra 70 rockets** carried. [src: Boeing]
- **Missiles:** **16 × AGM-114 Hellfire** anti-tank missiles. [src: Boeing]. Hellfire effective out to 6,500 m. [src: Wikipedia]
- **Air-to-air:** Stinger was removed from the AH-64E and later restored after a South Korean request. [src: Wikipedia]
- **Other stores:** Thermobaric Hellfire (AGM-114N), APKWS rockets (ordered 2015), Brimstone (tested 2016), Spike NLOS (fielded 2020). [src: Wikipedia]
- **Hardpoints:** **4**, two per stub wing. [src: Wikipedia]
- **Door guns / hoists / cargo hooks:** none. The Apache has no door guns or hoist. (Not in sources; standard fact, verify.)

### 4-step kid-friendly weapons/stores mod ladder

1. **Rockets:** 2 rockets on each stub wing (4 total), colour-coded.
2. **Hellfire:** 4 Hellfire missiles on the hardpoints, one per hardpoint.
3. **Chin gun:** the 30 mm cannon, fired as a sound-and-light effect with no gore.
4. **Full loadout:** 16 Hellfires and 76 rockets (fraction-friendly: 16 Hellfires = 4 per hardpoint).

(Keep language to "launch", "fire", and "tracks"; avoid "kill" and "destroy" per the brief.)

---

## 6. Engines

- **Count:** 2 General Electric T700-GE-701D turboshaft engines. [src: Wikipedia; Boeing]
- **Power:** 1,994 shp each (AH-64E). [src: Wikipedia]
- **Exhausts:** high-mounted, on top of the engine housings. [src: Wikipedia]
- **Top speed:** **158 knots (182 mph, 293 km/h)** (AH-64A/D). [src: Wikipedia]. The AH-64E is quoted at **150+ knots** level flight. [src: Boeing]
- **Cruise speed:** 143 knots (165 mph). [src: Wikipedia]
- **Climb:** about 1,775 ft/min (standard day, A/D) [src]; the E is quoted at 2,800+ ft/min [src: Boeing].
- **Service ceiling:** 20,000 ft (6,100 m). [src: Wikipedia; Boeing]
- **Speed fact (sourced):** 158 knots is about 182 mph, faster than most cars on a highway. [src: Wikipedia]

---

## 7. Other cool mods specific to this helicopter

- **Longbow radar dome spin:** the radar dome rotates (est.; not sourced).
- **Rotor-tip lights:** cosmetic, optional.
- **Night-vision lights:** a green-glowing cockpit (cosmetic).
- **Winch / sling load:** not on the Apache (none). The AH-64 has no external sling or hoist.
- **IR suppressors:** Not confirmed on the AH-64E; skip.
- **Chaff/flare dispensers:** three M130 dispensers on the tail boom [src: search excerpt]; cosmetic "sparkle" effect on tail.
- **Drone control:** the AH-64E can control UAVs such as the RQ-7 Shadow and MQ-1C Grey Eagle [src: Wikipedia]. Cute mod: a little drone icon on the HUD.

---

## 8. Sound

- **Rotor:** a deep, slow "whup-whup-whup" with four blades. Blade slap is strongest on descent. (est.)
- **Tail rotor:** a higher, faster whine, with an uneven beat because the 55° offset makes the blades not evenly spaced. (est.)
- **Engines:** a steady turbine whine under the rotor, louder at high power. (est.)
- **Gun:** short bursts of rapid staccato thumps at about 600 per minute (est.), like a very fast drum roll.
- **Synth tip:** a 4-per-rev blade-pass tone with a slight detuned copy for the tail, plus a turbine whine (about 1–3 kHz, est.).

---

## 9. Fraction-friendly facts

- **Main rotor blades:** 4. Each blade is **one quarter** of the rotor. [src: 4-blade main rotor]
- **Tail rotor blades:** 4. Each tail blade is **one quarter** of the tail rotor. [src: Wikipedia]
- **Rotors total:** 2 (one main, one tail). (derived)
- **Engines:** 2. Each engine is **one half**. (derived)
- **Crew:** 2. The pilot is **one half** of the crew. (derived)
- **Hardpoints:** 4. Two per stub wing, each wing has **one half**. (derived)
- **Hellfire missiles:** 16 total, so 4 per hardpoint, and each hardpoint is **one quarter**. (derived)
- **Rockets:** 76 total, not a clean fraction. Use "76 rockets carried" as a counting fact. [src]
- **Wheels:** 3 (nose + two main) [est.].
- **Doors:** 0 side doors on the Apache (the cockpit has canopy panels, not doors). (est.)

---

## 10. Reference sources

URLs used:

- Wikipedia, Boeing AH-64 Apache (specs, history, variants): https://en.wikipedia.org/wiki/Boeing_AH-64_Apache
- Boeing AH-64 Apache product page (redirect to): http://www.boeing.com/defense/military-rotorcraft/ah-64-apache
- AFIT thesis, Newkirk 2007, "Process Improvements for the AH-64 Tail Rotor Vibration Analysis" (55° offset): https://scholar.afit.edu/etd/2946 and https://apps.dtic.mil/sti/pdfs/ADA470136.pdf
- SKYbrary, AH-64 (wing span label, probably wrong): https://skybrary.aero/aircraft/h64
- Search result pages: AH-64E specs (Boeing figures quoted on forums): https://forum.warthunder.com/t/boeing-ah-64e-v6-apache-guardian-above-the-best/205520 (forum; low authority, used only for E dimensions)

Three-view drawings: **none found** in my search. Dimensions marked (est.) are read off photos or from silhouette judgement, not from a three-view.

### Known gaps

1. **Stub-wing span:** not found. SKYbrary's 14.63 m is the rotor diameter, not the wing. Estimated 6.4 m (est.).
2. **Tail rotor diameter:** not found. Estimated 2.7 m (est.).
3. **Tail rotor side (port vs starboard):** not confirmed. Estimated port (est.).
4. **Tail rotor canting from vertical:** the "20° canting" in the brief is **not confirmed** by any source. Only the 55° blade offset is sourced.
5. **Tail rotor "scissor" name:** not found in a source; the sources say "non-orthogonal".
6. **Fuel capacity:** not found.
7. **Hub height and x position:** not published. Estimated.
8. **Main rotor turn direction:** not confirmed. Estimated counter-clockwise (est.).
9. **Longbow radar dome size:** not found.
10. **Landing gear layout and wheel size:** not found. Retractable status not confirmed.
11. **Fuselage width and cross-sections:** not published; estimated from silhouette.
12. **Paint hex values:** not found. All hex values are (est.).
13. **Length discrepancy:** A/D fuselage 15.06 m vs E 14.7 m; the reason is not confirmed.
14. **Stinger carriage on AH-64E:** sources say it was removed then restored; current status not confirmed.
15. **Top speed for E:** only "150+ knots" (Boeing); no E-specific top speed found.

---

## 11. Conflicting statements (for the game team)

- **Tail rotor: "scissor" vs "non-orthogonal".** Sources use "non-orthogonal blade offset 55°". The brief's "scissor (non-90°)" is the same idea; the word "scissor" is not in the sources.
- **Main rotor blades:** 4 (Wikipedia, Boeing). One search snippet said "six blades per rotor" in total for the two proprotors; that is about the V-22, not the Apache, and is ignored here.
- **Height:** 4.7 m (Boeing, to top of mast) vs 3.87 m (Wikipedia A/D, probably to fuselage top). Use 4.7 m for the mast top.
