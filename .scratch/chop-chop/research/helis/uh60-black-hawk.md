# Sikorsky UH-60 Black Hawk (UH-60M): research notes for a procedural 3D hangar model

Conventions: [src] = fetched or search-snippet source (URLs in section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, no source. Metres throughout; imperial shown only where the source printed it. Where sources disagree, both values are given.

Short tags: [WIKI] = en.wikipedia.org Black Hawk article (fetched, UH-60M specs section); [WIKI-PH] = Wikipedia HH-60 Pave Hawk article (fetched); [MIG] = migflug.com spec compilation (search snippet, secondary); [AR] = armyrecognition/aerocorner-type commercial reference (search snippet only, page 404'd on fetch); [TM-quote] = U.S. Army technical manual passage quoted secondhand in a forum thread; [SNIP] = search-result snippet only, page not fetched.

Sources on the user's premise: the tail rotor is on the **right** side of the pylon and canted 20 degrees (see 2c). One compilation ([MIG]) says port. The weight of evidence (quoted Army TM plus a UH-60A student handout) supports right, but this needs a check against an official TM before the model is locked.

---

## 1. Identity

- **Full name:** Sikorsky UH-60 Black Hawk. Current production: **UH-60M**. Earlier: UH-60A, UH-60L. [WIKI]
- **Designations:** UH-60 family plus HH-60 (search and rescue: HH-60G Pave Hawk, HH-60W "Jolly Green II", HH-60U "Ghost Hawk") and MH-60 (special operations and Navy: MH-60K, MH-60L, MH-60M, MH-60R/S Seahawk). [WIKI] [WIKI-PH]
- **Nicknames:** "Black Hawk" (usual); "Blackhawk" (spelled that way by many sources); Pave Hawk is the rescue cousin. "Night Stalker" is the 160th SOAR unit nickname, not the aircraft's. [WIKI] (unit nickname: est., common knowledge)
- **Maker:** Sikorsky Aircraft (now part of Lockheed Martin). [WIKI]
- **First flight:** 17 October 1974, the YUH-60A prototype. [WIKI]
- **In service:** UH-60A entered U.S. Army service June 1979 (first deliveries October 1978). [WIKI] UH-60M is the standard U.S. Army production model "since 2007". [MIG]
- **Role:** Medium-lift utility helicopter (troop transport, medevac, sling-load, special operations). Four-blade main rotor, twin-engine. [WIKI]
- **Crew (UH-60M):** 2 pilots plus 2 crew chiefs/gunners = **4 crew**. [WIKI] Side-by-side cockpit seats (pilot left, co-pilot right). Side-by-side seating: (est.), common knowledge, not fetched.
- **Passengers:** 11 seated troops or 6 stretchers (internal). [WIKI]

### Kid-friendly voice lines (each under 12 words)

1. "It carries eleven soldiers, plus a whole crew!" (8 words). Source: 11 seated troops plus 4 crew [WIKI].
2. "Its main rotor has four blades, all spinning together!" (9 words). Source: four-blade main rotor [WIKI].
3. "Its spinning rotor is over sixteen metres across!" (8 words). Source: main rotor 16.36 m [WIKI].
4. "The Black Hawk first flew in nineteen seventy-four!" (9 words). Source: first flight 17 Oct 1974 [WIKI].
5. "Its two engines together make over three thousand horsepower!" (9 words). Source: 2 x 1,902 shp = 3,804 shp (derived) [WIKI].
6. "Its tail rotor spins sideways, so the helicopter stays straight!" (9 words). Source: tail rotor cancels main rotor torque [TM-quote, general description; [WIKI] anti-torque role].
7. "Its tail has a flat wing that tilts to fly level!" (11 words). Source: variable-incidence stabilator [TM-quote] [SNIP].
8. "Its stub wings can carry fuel tanks, so it can fly far!" (11 words). Source: ESSS external tanks, ferry range 1,199 nmi with ESSS and tanks [WIKI].

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | As printed | Source |
|---|---|---|---|
| Fuselage length (nose to tail, no rotors) | **15.27 m** | 50 ft 1 in | [WIKI] (15.26 m in [SNIP]; use 15.27) |
| Length with rotors (overall, UH-60M) | **19.76 m** | 64 ft 10 in | [WIKI] (helis.com lists 19.4 m; [SNIP] 19.76 m) |
| Height to top of rotor head (gear down) | **5.13 m** | 16 ft 10 in | [WIKI] (helis.com 5.2 m) |
| Fuselage width (body, excluding stub wings) | **2.36 m** | 7 ft 9 in | [MIG] (secondary) |
| Main rotor diameter | **16.36 m** | 53 ft 8 in | [WIKI] (also [SNIP]) |
| Tail rotor diameter | **3.35 m** | 11 ft 0 in | [SNIP] (search snippet, multiple sources) |
| Stub-wing (ESSS) span | **not found** | - | see Known gaps |

- Main rotor radius = **8.18 m** (derived). Rotor disc area per rotor = pi x 8.18^2 = **210.2 m^2** (derived; matches [SNIP] "210 m^2").
- Key proportion (derived): the main rotor (16.36 m) is about **1.07 x the fuselage length** (15.27 m), so the rotor is slightly longer than the body.

### 2b. Main rotor

- **Count:** 1. Single main rotor on a mast above the cabin. [WIKI]
- **Blades:** **4**. [WIKI] Fully articulated head with elastomeric bearings. [WIKI]
- **Diameter:** 16.36 m. Radius 8.18 m. [WIKI]
- **Blade chord:** not in sources. (est.) Use **0.55 m** constant chord (est.), giving blade area 4 x 0.55 x 8.18 = 18 m^2 (derived from est.). Tapered-tip variant is fine.
- **Rotation (seen from above):** counter-clockwise for U.S. Sikorsky main rotors. (est.) Common knowledge; not confirmed by a fetched source.
- **Hub/mast height above ground:** hub is near the top of the 5.13 m height figure; (est.) **hub centre at 5.0 m** above ground.
- **Hub x from nose:** (est.) **x = 6.5 m** (the mast sits just aft of the cockpit and over the cabin).
- **Blade folding:** U.S. Army UH-60s can fold the tail pylon and blades for stowage (folding tail for shipboard and airlift [MIG] [SNIP]); the Navy MH-60R folds its rotor (folded length 12.51 m, folded width 3.35 m [SNIP]).

### 2c. Anti-torque: tail rotor

- **Type:** Conventional tail rotor (not fenestron, not NOTAR, no pusher).
- **Side:** **right side of the tail pylon** [TM-quote: "installed on the right side of the tail pylon, canted 20 degrees upward"; UH-60A student handout gives the same right side]. Conflict: [MIG] says "canted 20 degrees to port". The model should follow the Army TM (right side) unless an official check says otherwise.
- **Cant:** **20 degrees** [TM-quote] (described as 20 degrees "upward" or "off the vertical" in different sources, same angle). The cant lets the rotor add ~2.5% of hover lift (UH-60A-era figure) [TM-quote, secondhand].
- **Diameter:** 3.35 m (11 ft). [SNIP]
- **Blades:** **4**. [WIKI] [SNIP]
- **Tail rotor height above ground:** (est.) **3.3 m** (hub sits high on the pylon).
- **x from nose:** (est.) **x = 14.0 m** (at the tail-pylon hub, near the end of the boom).
- **Rotation:** (est.) opposes main rotor torque (anti-clockwise seen from the right side). Confirm before animating.

### 2d. Fuselage stations (x from nose, est. unless noted)

Known from sources: fuselage length 15.27 m [WIKI], body width 2.36 m [MIG], height to rotor head 5.13 m [WIKI]. Stations and the cross-sections below are **est.** from the public three-view / common photo proportions; no fetched source gave them.

| Station | x from nose (m) | Width (m) | Height (m) | z centre above ground (m) |
|---|---|---|---|---|
| 1 nose (chin) | 0.0 | 0.6 | 0.8 | 1.6 |
| 2 cockpit | 1.2 | 2.0 | 1.6 | 2.1 |
| 3 cockpit rear / cabin front | 3.0 | 2.36 | 2.1 | 2.2 |
| 4 cabin mid (door line) | 6.0 | 2.36 | 2.2 | 2.2 |
| 5 cabin rear / ramp | 9.0 | 2.36 | 2.1 | 2.2 |
| 6 cabin aft / boom start | 11.0 | 1.4 | 1.6 | 2.2 |
| 7 boom | 13.0 | 0.9 | 1.1 | 2.5 |
| 8 tail end | 15.27 | 0.5 | 0.6 | 2.8 |

- **Engine housings:** two, on the top of the fuselage behind the main rotor mast, one each side of the centreline, (est.) at x = 8.0 to 9.5 m. Exhaust is at the rear of the engine deck, pointing up and aft (est.).
- **Cockpit canopy:** two-pilot glasshouse with a large sloped windscreen (est.), not sourced in detail.
- **Tail boom:** length and diameter not found. (est.) boom from x = 11 to 15.27 m, diameter ~0.9 m. See Known gaps.
- **Cabin doors:** **2 large lateral cabin doors**, one each side [SNIP]. Rear ramp/door: (est.) side and aft cargo area.

### 2e. Top-view and side-view outlines (est.)

Top half-outline (x, half-width) for the body, est.:
(0, 0.3), (0.8, 0.9), (1.5, 1.18), (3.0, 1.18), (6.0, 1.18), (9.0, 1.18), (11.0, 0.7), (13.0, 0.45), (15.27, 0.25)

Side-view outline (x, y above ground), est., nose to tail:
(0, 1.6), (1.0, 2.6), (2.0, 2.9), (4.0, 2.9), (6.0, 2.6), (8.0, 2.9), (10.5, 3.1), (13.0, 3.6), (15.27, 3.8)

### 2f. Tail surfaces

- **Vertical fin:** on the tail pylon; the tail rotor sits on the pylon (see 2c). Fin height: (est.) 2.0 m above the boom.
- **Horizontal stabiliser:** this is the **stabilator**, a **variable-incidence, movable horizontal tail** across the tail cone, which changes angle automatically to control pitch and fuselage attitude; on the UH-60M it is integrated with digital flight control. [TM-quote] [SNIP]
- **Stabilator span and chord:** **not found** in any fetched or snippet source. (est.) span **2.9 m**, chord 0.6 m, mounted across the tail cone at the boom end (x ~ 13.5 m, height ~ 2.7 m). Pure guess, no three-view read; check before relying on it. Make it visibly big and movable.
- **Endplates:** none found.

### 2g. Stub wings (ESSS)

- **Type:** External Stores Support System (ESSS) "stub wings" on each side of the cabin, above the doors. [SNIP] [WIKI]
- **Span:** **not found** (see Known gaps). (est.) 2.4 m per side, 4.8 m total across both wings, (est.) chord 0.45 m.
- **Hardpoints:** **2 removable pylons per wing** [SNIP] (4 pylons total). Inboard stations take **450 US gal tanks**, outboard take **230 US gal tanks** (per wing, [TM-quote] UH-60A test report). Later Army UH-60s used a crashworthy external fuel system with up to **four 200 US gal** tanks [WIKI] [SNIP].
- **Wing rating:** each wing rated to 5,000 lb [SNIP]; ESSS can carry up to **10,000 lb** of armament/stores [WIKI].
- **Wingtip stations:** lights and fairing (est.), not sourced.

### 2h. Landing gear

- **Type:** **fixed wheeled landing gear** (not skids on the UH-60M). [SNIP]
- **Wheel size and track:** **not found**. (est.) main wheels 0.8 m diameter, track 2.6 m, wheelbase (nose to mains) 4.0 m. Tail: the tail rests on the boom skid or a tail bumper on the ground (est.).
- **Retractable:** no.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Four-blade main rotor on a single mast above a boxy cabin** (the single rotor and boxy green/grey cabin are the instant read). [WIKI]
2. **Canted tail rotor on the right of a tall tail pylon**, 4 blades, 20 degrees cant. [TM-quote]
3. **Big variable-incidence stabilator** across the tail cone. [TM-quote]
4. **Two big side cabin doors** and the open cabin door with an open-door gunner. [SNIP]
5. **Fixed wheeled gear and no skids** (wheels, not skids). [SNIP]
6. **Stub wings (ESSS) with fuel tanks** on the sides of the cabin, above the doors. [WIKI] [TM-quote]
7. **Tall tail pylon with a fold line** (folding tail for stowage). [MIG] [SNIP]
8. **HH-60 Pave Hawk** variant: same family body with a **retractable in-flight refuelling probe** (probe position not sourced; est. on the nose) and a rescue hoist. [WIKI-PH]
9. **Navy MH-60R Seahawk** variant: folding main rotor and tail, grey Navy paint, sonobuoy and torpedo pylons (see section 5). [SNIP]

## 4. Paint and liveries

All hex values are (est.) from memory of the colour names; no fetched source gave hex codes. Treat as starting points.

| # | Scheme | Look | Hex (est.) | Where colours go |
|---|---|---|---|---|
| 1 | **U.S. Army Green** (service, default) | Olive drab over body, black tail stripe, white/yellow stencils | body #4B5320 (est.), trim #111111 (est.) | body, tail pylon, stencils in #F2F2E8 (est.) |
| 2 | **U.S. Army Desert Tan** (Iraq/Afghanistan era) | Sand base, brown and tan blotches | base #C2B280 (est.), dark #6B5B3E (est.) | body, rotor blades, tail |
| 3 | **Navy MH-60R Haze Grey** (Seahawk) | Light grey hull, black tail band | grey #6C7C7C (est.), black #1A1A1A (est.) | body, pylons, red roundels (est.) |
| 4 | **160th SOAR "Night Stalker" black** (MH-60 special ops) | Matt black, no insignia | #1B1B1B (est.) | everything; cockpit glass dark (est.) |
| 5 | **Air Force HH-60 Pave Hawk grey** (rescue) | Dark grey, white stencils | #5E6264 (est.) | body, probe, stencils (est.) |

**Mod ladder (suggested):**
- Free default: **U.S. Army Green** (scheme 1).
- Upgrade 1: **Desert Tan** (scheme 2).
- Upgrade 2: **Navy Haze Grey** with black tail band (scheme 3).
- Upgrade 3: **Pave Hawk grey** with a bright red-white stripe (est.) (scheme 5).
- Legendary: **Night Stalker black** (scheme 4) with glowing cockpit and rotor-tip lights.

---

## 5. Armament and stores

- **Door guns:** **M240 7.62 mm** machine guns on the cabin doors (added to Ukrainian UH-60s) [WIKI]; **M60** photographed in Iraq 2005 [WIKI]; **M134 minigun** is the MH-60A door gun [WIKI]. The **GAU-17** is not mentioned in any fetched source (see Known gaps; M134 is the sourced minigun for MH-60A).
- **Gun position:** left and right side doors, one gunner each (est.). Pedestal mount (est.).
- **Rockets:** **Hydra 70** rockets (MH-60L DAP gunship) [WIKI]; on UH-60M ESSS (est.).
- **Missiles:** **AGM-114 Hellfire** (MH-60L DAP) [WIKI]; **AIM-92 Stinger** (on the Stinger-equipped variants) [WIKI].
- **Cannon:** **M230 30 mm chain gun** (MH-60L DAP) [WIKI].
- **Hardpoints (ESSS):** 2 pylons per wing, 4 total [SNIP]. Outboard pylon for 230 gal tank; inboard for 450 gal tank [TM-quote].
- **Hoist:** rescue hoist on HH-60 Pave Hawk, **600 lb (270 kg)** lift from a hover 200 ft (60 m) up [WIKI-PH].
- **Cargo hook / sling load:** **9,000 lb (4,100 kg)** external sling load (UH-60L/M) [WIKI].
- **Internal cargo:** 3,190 lb (1,450 kg) internal cargo [WIKI] (quoted in the UH-60M spec section).

### Kid-friendly weapons and stores mod ladder (4 steps)

1. **Door gun** (M240 machine gun on the side door) - "Pop-pop-pop! The rescue gun!"
2. **Rescue hoist** (lift a 600 lb crate or a rescue swimmer on a cable) - "It can lift a whole crate on a cable!"
3. **Stub-wing fuel tanks** (450 and 230 gallon tanks) - "It can fly a long, long way!"
4. **Hellfire pylons** (Hellfire missiles on the stub-wing pylons) - "Extra Hellfires! Stay safe, helicopter!" (non-violent wording: mark as **gunship mod only**, not in UH-60M service; sourced from MH-60L DAP [WIKI]).

---

## 6. Engines

- **Count and type:** **2** General Electric **T700-GE-701C/D** turboshafts. [WIKI]
- **Power:** **1,902 shp (1,418 kW) each** [WIKI]. Another source gives 2,000 shp max for T700-GE-701D (UH-60M). Use **1,902 shp** per [WIKI]; total **3,804 shp** (derived).
- **Exhaust positions:** on the top rear of the fuselage, behind the main rotor, (est.) x ~ 9 m, height ~ 3.2 m, exhausts up and aft (est.).
- **Top speed:** **159 kn** (183 mph, 294 km/h) [WIKI].
- **Cruise:** 152 kn (175 mph, 282 km/h) at max range, at 18,000 lb [WIKI].
- **Ceiling:** 19,000 ft (5,800 m) [WIKI].
- **Range:** combat range 320 nmi (370 mi, 590 km); ferry range 1,199 nmi (1,380 mi, 2,221 km) with ESSS and external tanks [WIKI].
- **Weights:** empty 12,511 lb (5,675 kg); max take-off 22,000 lb (9,979 kg) [WIKI].
- **Lifting fact:** The main rotor makes all the lift; the tail rotor also supplies **2.5% of hover lift** (UH-60A-era figure) because of its cant [TM-quote, secondhand].

---

## 7. Other cool mods

- **Rotor-tip lights:** navigation lights on the tip caps (est.).
- **Searchlight:** a "FLIR/searchlight" on the nose or door (not sourced for UH-60M; (est.)).
- **Rescue hoist and winch:** the Pave Hawk hoist (600 lb, 200 ft) [WIKI-PH].
- **Sling load:** a cargo hook for 9,000 lb [WIKI].
- **Stabilator flap:** the stabilator moves up and down with a fun swoosh in the animation (sourced behaviour: variable incidence [TM-quote]).
- **Folding tail/rotor:** a stowed-mode animation from the ship (Navy MH-60R [SNIP]).
- **Refuelling probe mod:** retractable probe, fitted to the Pave Hawk [WIKI-PH] and to the MH-60K and MH-60M [WIKI]. Probe position not sourced.

---

## 8. Sound

- **Blade slap:** a deep "thwump-thwump-thwump" at the rate of 4 blades per turn (sourced blade count [WIKI]); low-frequency, slightly grumbly, strongest on approach.
- **Engine whine:** two turboshafts, a rising "wheeee" then a steady whine around the blade-pass frequency; sound designer: two overlapping sine-plus-noise layers, ~1,000 Hz and up.
- **Tail rotor:** a higher, thinner "whirr-whirr" at 4 blades, on the right side of the tail (est. pitch).
- **Stabilator:** a quiet hydraulic "whirr" when it moves (est.).

---

## 9. Fraction-friendly facts

- **Main rotor blades:** 4, so each blade is **one quarter** of the main rotor. [WIKI]
- **Tail rotor blades:** 4, so each tail blade is one quarter of the tail rotor. [SNIP]
- **Total rotor blades:** 4 + 4 = 8 blades; 4 of 8 are the main-rotor blades, so **one half** are main-rotor. (derived)
- **Engines:** 2, so each engine is **one half** of the power. (derived: 1,902 shp each, half of 3,804 shp)
- **Crew:** 4 (2 pilots + 2 crew chiefs), so each pilot is **one half** of the pilots. (derived)
- **Passengers:** 11 seats, so 11 passengers fill the cabin (fraction: 11 out of 15 seats = 11/15 of the people on board, derived).
- **Cabin doors:** 2 large side doors, so each door is **one half** of the entry points.
- **Stub-wing pylons:** 2 per wing, 4 total, so each wing is **one half** of the stub-wing pylons. (derived)
- **Fuel tanks (ESSS):** 2 per side in the TM-quoted configuration, 4 total (derived; treat as est.).

---

## 10. Reference sources

Fetched or searched URLs:
- Wikipedia, UH-60 Black Hawk (UH-60M spec section, fetched): https://en.wikipedia.org/wiki/Sikorsky_UH-60_Black_Hawk
- Wikipedia, HH-60 Pave Hawk (fetched): https://en.wikipedia.org/wiki/Sikorsky_HH-60_Pave_Hawk
- helis.com UH-60M table (search snippet): https://www.helis.com/database/model/273
- Pima Air & Space Museum, UH-60M designation (search snippet): https://pimaair.org/designation/uh-60mu/
- aerospaceweb UH-60 data (search snippet): https://aerospaceweb.org/aircraft/helicopter-m/uh60/
- migflug.com Black Hawk specs (search snippet, secondary): https://migflug.com/aircraft/uh-60-black-hawk/
- migflug.com (tail-rotor canting, port claim, snippet): https://migflug.com/?p=20595
- Army technical manual quoted in forum (tail rotor right side, 20 degrees cant): https://helicopterforum.verticalreference.com/topic/5982-blackhawk-tail-rotor/
- Army UH-60A ESSS test reports (tank sizes): https://apps.dtic.mil/sti/pdfs/ADA132964.pdf and https://apps.dtic.mil/sti/pdfs/ADA181947.pdf (snippets)
- military.com UH-60A/L Black Hawk (ESSS wing rating, search snippet): https://mst.military.com/equipment/uh-60a-l-black-hawk
- Seaforces Online, Royal Norwegian / Australian / Danish MH-60R (Navy variant, snippet): https://www.seaforces.org/marint/Norwegian-Navy/AVIATION/MH-60R-Seahawk-RNN.htm
- Navy MH-60R spec sheet snippet (aeropedia): https://aeropedia.com.au/content/sikorsky-mh-60r/

Three-view drawings: none fetched. Three-view for measurements should come from Sikorsky or Army TM (not found).

### Known gaps

- **Stabilator span and area:** not found. Estimated 2.9 m span (section 2f). Needs a three-view.
- **Tail rotor canting direction:** **conflict**. [TM-quote] says right side, 20 degrees up; [MIG] says port. Follow right unless an official TM says otherwise.
- **ESSS stub-wing span:** not found in meters. Estimated 2.4 m per side.
- **Tail boom length and diameter:** not found.
- **Main rotor blade chord:** not in any source; est. 0.55 m constant.
- **Landing gear track, wheel size, wheelbase:** not found; est.
- **Fuselage cross-section stations:** all est. (no three-view fetched).
- **Engine housing and exhaust positions:** est.
- **Paint hex codes:** all est. (no source gave hex).
- **GAU-17:** not mentioned by any fetched source; door gun data uses M240/M134/M60 instead.
- **Hub and tail rotor x positions:** est.
- **Rotor rotation direction (counter-clockwise from above):** est., common knowledge, not fetched.
- **MH-60R engine power:** the spec snippet gives 1,910 shp for T700-GE-401C; other sources say 1,890 shp. Not used for the UH-60M model.
- **Max-speed and engine-power discrepancy:** one source says 2,000 shp max for T700-GE-701D; [WIKI] says 1,902 shp. Used 1,902 shp.
