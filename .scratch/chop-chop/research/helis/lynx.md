# Westland Lynx (AH.7 / G-LYNX): research notes for a procedural 3D hangar model

Conventions: [src] = fetched or search-returned source (URL in section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, no source. Where sources disagree, both values are given. Colour hexes are all (est.) unless stated.

Model choice: **Army AH.7 (XZ185-type) with BERP main rotor blades**. Reason: it is the only Lynx variant for which I found a full set of printed dimensions (rotor, tail rotor, fuselage, height, weights, engines). G-LYNX (1986) was a company demonstrator built on the standard Lynx airframe, rotor and transmission, so the same geometry applies to it, with BERP blades and Gem 60 engines. Its own engine rating and any livery detail were not found. A "G-LYNX record" variant is a paint and blade swap on the same model (see section 4).

---

## 1. Identity

- **Full name:** Westland Lynx (Lynx AH.1, AH.7, AH.9A; Navy HAS.2, HAS.3, HMA.8; Super Lynx Series 100 and 300). [src: https://en.wikipedia.org/wiki/Westland_Lynx]
- **Nicknames:** "Lynx". No well-sourced nickname found. "Black Cats" is the display team name, not a nickname for the type.
- **Maker:** Westland Helicopters (Yeovil, England). [src: Wikipedia]
- **First flight:** 21 March 1971 (prototype). [src: Wikipedia]
- **In service:** Army Air Corps Lynx AH.1 entered service in 1979 per Wikipedia body text; Wikipedia infobox says 1978; another source says operational use began 1977. Use "late 1970s". Navy Lynx (HAS.2/HAS.3) followed. [src: Wikipedia, conflicting]
- **Role:** Light/medium multi-role helicopter: anti-tank (TOW), troop transport, naval anti-submarine and anti-ship, search and rescue. [src: armedconflicts.com, Wikipedia]
- **Crew:** Sources differ. Armedconflicts (AH.7) gives 2 (pilot and observer side by side). Pimaair (AH.7 museum page) gives 3. Wikipedia: British Army operations typically use three crew, including a door gunner. Use 2 seats in front plus 1 door gunner. [src, conflicting]
- **Seating:** Side-by-side cockpit (pilot left, observer or co-pilot right). [src: Wikipedia]

### 1a. Record aircraft: G-LYNX (1986)

- **What it is:** A Westland company demonstrator registered G-LYNX, on a standard Lynx airframe, rotor and transmission, modified with Gem 60 engines and BERP rotor blades. [src: https://en.wikipedia.org/wiki/Westland_Lynx; https://fragoutmag.com/g-lynx-35-years-of-an-unrivalled-speed-record/]
- **Date and place:** 11 August 1986, evening, Somerset Levels, England (15 km course). [src: fragoutmag]
- **Pilot:** Trevor Egginton (some spell it Eggington); flight test engineer Derek Clews. [src: fragoutmag; search snippet]
- **Record:** Average 400.87 km/h (249.09 mph) over 15 km, and 25 km, an absolute world speed record for helicopters that the FAI still recognises. Previous record 198 kt (367 km/h). [src: Wikipedia, fragoutmag]
- **Lift-to-drag ratio at that speed:** 2. Blade tips reached Mach 0.97. [src: Wikipedia]
- **Recognition:** Institution of Mechanical Engineers Heritage Engineering Award, 2014. [src: fragoutmag]
- **Note:** Leonardo ran an apprentice restoration of G-LYNX (search result only). Current location and paint not verified.

### Kid-friendly voice lines (each under 12 words)

1. "In 1986, this helicopter set the world's fastest helicopter record!" (10 words). True: G-LYNX record. [src: fragoutmag; Wikipedia]
2. "It zoomed along at 249 miles an hour!" (8 words). True: 249.09 mph record average [src: fragoutmag].
3. "Its four rotor blades spin like a giant fan!" (8 words). True: four main blades, rigid titanium head [src: Wikipedia].
4. "It can carry up to ten soldiers inside!" (7 words). True: "up to ten equipped troops" [src: Wikipedia]. Armedconflicts says 9 for AH.7; use "up to ten" with the Wikipedia wording.
5. "It has two engines, so it has a backup!" (8 words). True: twin turboshafts [src: armedconflicts, Wikipedia].
6. "Its big rotor is as wide as a school bus is long!" (10 words). The rotor is 42 ft (12.8 m) [src: armedconflicts]. The bus comparison is (est.): a typical school bus is about 35 to 40 ft long, so 42 ft is close. Say "almost as wide" if unsure.
7. "A little rotor on its tail keeps it pointing straight!" (10 words). True: tail rotor [src: armedconflicts].

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | Imperial as printed | Source / note |
|---|---|---|---|
| Fuselage length (nose to tail end) | **12.06 m** | 39 ft 6.75 in | [src] armedconflicts (AH.7). Conflict: GlobalSecurity 13.33 m, but that figure is Super Lynx Series 100 (13.34 m per Wikipedia). Use 12.06 m for AH.7. |
| Length with rotors turning | **15.16 m** | 49 ft 9 in | [src] armedconflicts. Pimaair prints 50 ft (15.24 m). |
| Height (overall) | **3.66 m** | 12 ft | [src] armedconflicts. Pimaair: 12 ft 3 in (3.73 m). |
| Fuselage width (max) | (est.) 1.6 m | | No source found. See 2e. |
| Stub-wing span | none | | Production Lynx has no stub wings or tailplane mentioned in Wikipedia. The proposed Lynx ACH demonstrator had wings. Treat as none. |
| Main rotor diameter | **12.80 m** | 42 ft | [src] armedconflicts, Wikipedia, pimaair. Radius 6.40 m. |
| Main rotor disc area | **128.71 m²** | 1385.44 ft² | [src] armedconflicts. (derived check: pi x 6.4² = 128.7 m²) |
| Tail rotor diameter | **2.36 m** | 7 ft 9 in | [src] armedconflicts. Radius 1.18 m. |
| Tail rotor disc area | 4.38 m² | 47.17 ft² | [src] armedconflicts. (derived check: pi x 1.18² = 4.37 m²) |

### 2b. Main rotor

- **Count:** 1 main rotor (single main, with anti-torque tail rotor). [src]
- **Blade count:** **4**. Rigid titanium monobloc rotor head with folding blades for shipboard stowage. [src: Wikipedia]
- **Blade chord:** not found. (est.) 0.35 m, low confidence. Derived from a typical solidity of about 0.07 for a 4-bladed 12.8 m rotor: c = sigma x pi x R / N = 0.07 x pi x 6.4 / 4 = 0.35 m (derived from an estimated solidity, so treat as est.).
- **BERP blades:** Composite, developed by Westland with UK MoD (British Experimental Rotor Programme). Outer tip swept about 30 degrees from about 86% radius, with the outer 2% swept much harder (around 70 degrees). [src: BERP rotor search snippet, low-quality source]. Later AH.7s received BERP-type main blades. [src: GlobalSecurity search snippet]. The Wikipedia claim of "approximately 35% more thrust before blade stall" is footnoted as disputed. Do not state it as fact to a kid.
- **Shared root:** BERP blades share the root chord and radius of the standard blade (one source, no numbers). [src: search snippet]
- **Rotation direction (seen from above):** **not found**. Gap. Pick one in code and label it (est.). Common UK helicopter default is counter-clockwise from above, but this is unverified for the Lynx.
- **Hub height above ground:** (est.) 3.0 m. Derived from overall height 3.66 m, with the top of the hub near the top of the rotor head. Gap: no source.
- **Hub position along fuselage (x from nose):** (est.) 4.6 m, roughly over the cabin, forward of mid-length. Gap.

### 2c. Anti-torque: tail rotor

- **Type:** Conventional tail rotor (not fenestron, not NOTAR). [src]
- **Side:** **not found**. Gap. Model on the port side of the tail pylon or fin by default, and state it as (est.).
- **Blades:** **4** composite blades. [src: GlobalSecurity search snippet; armedconflicts/pimaair not checked for blades]
- **Diameter:** 2.36 m (radius 1.18 m). [src: armedconflicts]
- **Direction:** Early production tail rotor had the top of the disc moving forward. The Mk.7 (AH.7) was changed so the top of the disc moves aft, to cut noise from interaction with the main rotor tip vortices. [src: search snippet, Glasgow PhD thesis reference]
- **Hub height:** (est.) 2.2 m above ground. Gap.
- **x from nose:** (est.) 11.8 m. Gap.
- **Pusher propeller:** none.

### 2d. Fuselage: stations (all est. unless marked)

Only the total length (12.06 m) and height (3.66 m) are sourced. Everything below is (est.), read from typical Lynx three-view proportions. Use these as a starting shape, not as fact.

| # | x from nose (m) | width (m) | height (m) | z centre above ground (m) | note |
|---|---|---|---|---|---|
| 1 | 0.0 | 0.10 | 0.30 | 1.55 | nose tip (est.) |
| 2 | 1.5 | 1.30 | 1.65 | 1.75 | nose / chin (est.) |
| 3 | 3.0 | 1.55 | 1.90 | 1.85 | cockpit (est.) |
| 4 | 4.5 | 1.60 | 1.95 | 1.95 | cabin, near rotor mast (est.) |
| 5 | 6.0 | 1.55 | 1.80 | 1.95 | cabin rear (est.) |
| 6 | 7.5 | 1.20 | 1.45 | 1.90 | boom start (est.) |
| 7 | 9.0 | 0.70 | 0.85 | 2.10 | tail boom (est.) |
| 8 | 10.5 | 0.45 | 0.45 | 2.35 | tail boom, near fin (est.) |
| 9 | 12.06 | 0.25 | 0.30 | 2.50 | tail end (est.) |

- **Cabin:** holds up to ten troops, depending on seating. [src: Wikipedia]. Use 9 seats in the model (AH.7 "9 troops" per armedconflicts) plus 2 cockpit.
- **Cargo:** 907 kg (2000 lb) internal; 1,360 kg (3,000 lb) external underslung load. [src: armedconflicts]
- **Tail boom:** length and diameter not found separately (see station table).
- **Engine housings:** two engines mounted on top of the fuselage behind the main rotor mast, exhaust to the rear. Positions (est.) x = 5.5 m, two housings either side of centreline, z = 2.6 m. Gap: no source for engine positions.
- **Canopy:** front glazing, cockpit with two front seats and a door gunner's opening on each side. (est.) Gap for exact shape.
- **Doors:** side cabin doors, one each side with door-mounted gun positions (armament, see section 5).

### 2e. Top-view and side-view outlines

No printed outline data found. Use the station table in 2d as the basis for both views. Half top-view (est.) at each station: x 0.0 to 12.06 m, half-width = width/2 from the table above. Side-view (est.) at each station: centre z ± height/2.

### 2f. Tail surfaces

- **Vertical fin:** present, tall, tail rotor sits at its base or on its side (side not found). Span and chord not sourced. (est.) fin height 1.4 m, root chord 0.9 m, located x 10.6 to 12.0 m.
- **Horizontal stabiliser:** none on production Lynx (none mentioned in Wikipedia). Treat as none.
- **Endplates:** none found.

### 2g. Landing gear

- **Type:** fixed undercarriage with skids. [src: armedconflicts]
- **Skid track (width between skids):** not found. Gap. (est.) 2.0 m.
- **Skid length:** not found. Gap. (est.) 2.6 m.
- **Skid height (ground to skid bottom):** not found. Gap. (est.) 0.4 m.
- **Wheels:** none on the AH.7 or HAS.3 Army/Navy skid variants. Navy wheeled undercarriage version exists per the brief but not checked here.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Four-bladed main rotor** with a squared-off, blunt look and **BERP blades** (swept outer tips) on the speed-record and later AH.7 aircraft. The tip shape is the key visual on G-LYNX and later Lynxes.
2. **Tail rotor on the side of a tall tail pylon**, with four blades, mounted high on the tail. Side (port or starboard) not verified.
3. **Two side-by-side cockpit seats** under a big front canopy, with a door gunner's opening on each side.
4. **Skids** (not wheels) on the Army AH.7 and Navy HAS.3 versions.
5. **Two turboshaft engines** on top of the fuselage behind the rotor mast.
6. **TOW missile racks** on the AH.7 (8 TOW). Mount positions not found.
7. **Army green** or **Black Cats grey and black** paint.
8. Compact, **boxy cabin** with a long, slim tail boom.

---

## 4. Paint & liveries

| Scheme | Used on | Colours | Where | Source |
|---|---|---|---|---|
| **A. Army Air Corps (AH.7, free default)** | XZ185 (AH.7 museum example, markings "British Army Air Corps, circa 2012") | Army green / olive. Dark olive #4B5320 (est.); light grey underside #A7A9AC (est.); black details #1A1A1A (est.) | Fuselage sides and top: olive. Underside and skids: grey. Roundel and tail codes: white. | [src: pimaair for markings only; colours est.] |
| **B. Black Cats display team (HAS.3)** | Royal Navy Lynx HAS.3 of 702 NAS / Black Cats, 2001 to 2014 | Grey and black. Grey #7A8288 (est.); black #141414 (est.); white trim #F2F2F0 (est.) | Overall grey with black tail, black cat badge and team name on fuselage sides. Exact split not verified. | [src: Wikipedia Wildcat Demo Team infobox "Grey and Black"; caption "Lynx HAS.3 ... in Black Cats colour scheme"; cat badge from 702 NAS]. The specific split and cat artwork are gaps. |
| **C. G-LYNX record demonstrator (1986)** | G-LYNX, Westland demonstrator | Unknown. White #F4F4F2 (est.) with dark trim (est.) | Gap | Not found |
| **D. Royal Navy Lynx HAS.3 (grey)** | Fleet Air Arm HAS.3 | Navy grey #6E7B80 (est.); white #F2F2F0 (est.) | Overall grey, roundels | (est.) |
| **E. Blue Eagles (Army display team)** | Army Lynx display team | Unknown. Blue (est.) #1F4E9A | Gap | Wikipedia mentions Blue Eagles flew Lynx; colours not found |

### Suggested mod ladder

- **Free default:** Scheme A, Army green AH.7 with standard blades.
- **Upgrade 1 "Black Cat":** Scheme B grey and black with a black cat badge. Needs a badge decal, est. only.
- **Upgrade 2 "Blue Eagle":** Scheme E (blue, colours need checking).
- **Upgrade 3 "Naval Grey":** Scheme D.
- **Legendary "Speed Record" (G-LYNX):** white demonstrator with BERP blades, Gem 60 exhaust, and a gold "record" trim (est., since the actual G-LYNX livery is not verified).

---

## 5. Armament & stores

- **Door guns:** 1 to 2 door-mounted 7.62 mm FN MAG machine guns, one each side. [src: armedconflicts]
- **Anti-tank:** 8 x BGM-71 TOW missiles. [src: armedconflicts]. Mount positions: not found. (est.) two 4-missile racks on each side of the cabin, lower fuselage. Gap.
- **Underslung load:** external cargo hook, 1,360 kg (3,000 lb) rating. [src: armedconflicts]
- **Rockets, missiles on the Navy HAS.3:** not checked. Gap. (Navy Lynx carried Sea Skua anti-ship missiles per general knowledge, not verified here.)
- **Hoist:** Navy and SAR variants carry a winch; not verified for AH.7.

### 4-step kid-friendly weapons/stores ladder

1. **Step 1, Cargo:** Underslung hook carries a crate (1,360 kg) [src].
2. **Step 2, Troops:** Nine soldiers sit in the cabin [src].
3. **Step 3, Door gun:** One door-mounted machine gun (7.62 mm) [src]. Keep it friendly: "a gun that keeps you safe."
4. **Step 4, TOW missiles:** Eight missiles on the side racks [src]. Keep it friendly: "eight rockets that help soldiers in a tough spot." Avoid "kill" and "destroy".

---

## 6. Engines

- **Count:** 2 turboshafts. [src]
- **Army AH.7 engine:** Rolls-Royce Gem 41-1, rated 1,120 shp each (835 kW). [src: armedconflicts; pimaair]
- **Navy HAS.3:** Rolls-Royce Gem 42-1 (power not stated in source). [src: Wikipedia]
- **Super Lynx 100 (not the AH.7):** LHTEC CTS800-4N, 1,362 shp each for takeoff. [src: Wikipedia]. Not used on our model.
- **G-LYNX (1986):** Rolls-Royce Gem 60 engines, power **not found**. Gap. Also reportedly with a water-methanol injection system (search snippet only, unverified).
- **Exhaust positions:** top rear of fuselage, behind the rotor mast, exhausts to the rear. (est.)
- **Top speed (AH.7):** 184 mph (296 km/h, derived from the pimaair printed figure). [src: pimaair] Cruise 259 km/h (161 mph). [src: armedconflicts]
- **Record speed (G-LYNX):** 400.87 km/h (249.09 mph), 1986. [src]
- **Fact to use:** G-LYNX beat the previous helicopter record of 367 km/h by about 34 km/h (derived: 400.87 - 367 = 33.9 km/h). Kid line: "It beat the old helicopter record by a big jump!" (est. wording, the figure is derived).

---

## 7. Other cool mods specific to this helicopter

- **BERP blades:** swept outer tips. Speed-record look and later AH.7 blades. [src]
- **Gem 60 engines** on G-LYNX (power unknown, see section 6).
- **Water-methanol injection** on G-LYNX: visible tank or vent (search snippet only).
- **External hook:** a cargo hook underneath, 1,360 kg. [src]
- **Door gun** on each side. [src]
- **Tail-rotor noise reduction:** the Mk.7 changed the tail rotor so the top of the disc moves aft. A visual difference between early and late Lynx (est. visual only). [src: search snippet]
- **Folding rotor blades:** on Navy versions for shipboard stowage. [src: Wikipedia]. Could be a kid "fold up" animation.
- **Winch:** not verified for AH.7.
- **Searchlight or IR suppressors:** not found for AH.7.

---

## 8. Sound

- **Turboshaft whine:** a high, steady whine from two gas-turbine engines, rising in pitch with power. (est.)
- **Blade slap:** a rhythmic "whup-whup" from four main blades, louder in descent and at low speed. (est.)
- **Tail rotor:** a higher-pitched, faster "whup" overlaid on the main beat. Its noise pulses are known to be strong from main-rotor interaction, which is why the Mk.7 tail was changed. [src: search snippet]. (est.) for the sound character.
- **Synth suggestion:** Two sine-ish turbine whines near 1,100 to 1,400 Hz at full power (est.), a 4-per-rotation blade-pulse at main rotor speed (est.), and a faster tail pulse with a clear 3:1 or similar ratio to the main pulse (est.).

---

## 9. Fraction-friendly facts

- **Main rotor blades:** 4. Each blade is one quarter of the main rotor. [src: 4 blades]
- **Tail rotor blades:** 4. Each tail blade is one quarter of the tail rotor. [src]
- **Engines:** 2. Each engine is one half of the power. [src]
- **Crew seats in front:** 2 (or 3 with a door gunner). Each front seat is one half. [src, conflicting]
- **Troop seats:** 9 or 10 (src); e.g. 9 troop seats gives 9 places, so one ninth each. Use "nine seats" for the AH.7.
- **Door guns:** 2 (one each side). One half each. [src: 1 to 2 door guns, conflicting]
- **TOW missiles:** 8. One eighth each. [src]
- **Skids:** 2 (est.). Each is one half of the landing gear. Gap for exact source.
- **Rotor size:** 12.8 m diameter. Radius 6.4 m (derived).
- **Fraction hook:** the rotor disc is 1385 sq ft. The tail rotor disc is 47 sq ft (derived from 47.17 ft²). A tail disc is about one thirtieth of the main disc (derived: 47.17 / 1385.44 = 0.034, roughly 1/29).

---

## 10. Reference sources

URLs used:
- https://en.wikipedia.org/wiki/Westland_Lynx (fetched; first 100k chars, then 100k to 193k, specifications for Super Lynx, service history, record, Black Cats mention)
- https://en.wikipedia.org/wiki/Wildcat_Demo_Team (fetched; Black Cats colour "Grey and Black", HAS.3 caption)
- https://www.armedconflicts.com/topic/view/9586 (fetched; AH.7 spec table: fuselage 12.06 m, length with rotors 15.16 m, height 3.66 m, MR dia 12.8 m, TR dia 2.36 m, disc areas, weights, Gem 41-1 1,120 shp, troops/cargo, armament)
- https://pimaair.org/museum-aircraft/westland-lynx-ah-7/ (fetched; AH.7 XZ185 length 50 ft, height 12 ft 3 in, 184 mph, 10,600 ft ceiling, Gem 41-1 1,120 hp, crew 3, BAAC markings)
- https://pimaair.org/designation/ah-7/ (fetched; same XZ185 figures)
- https://fragoutmag.com/g-lynx-35-years-of-an-unrivalled-speed-record/ (fetched; G-LYNX record details, crew, Heritage Award)
- https://en.wikipedia.org/wiki/BERP_rotor (search snippet only; BERP tip sweep)
- https://en.wikipedia.org/wiki/702_Naval_Air_Squadron (search result only; cat badge, motto "Cave Ungues Felis")
- https://www.globalsecurity.org/military/world/europe/lynx-specs.htm (HTTP 402, not retrieved; search snippet only: 4 main blades, 4 tail blades)
- https://uk.leonardo.com/en/news-and-stories-detail/-/detail/apprentice-restore-world-record-breaking-g-lynx (search result only)
- https://migflug.com/?p=30958 (search result only; low-quality aggregator, used only for the Black Cats 2001 origin and "grey and black" cross-check)

Three-view drawings: none found in the sources I could fetch. Not verified.

### Known gaps

- **Fuselage width and height** (cabin and nose): not printed in any source I could fetch. Station table in 2d is est.
- **Blade chord** (main rotor): not found. Est. 0.35 m.
- **Main rotor rotation direction** (from above): not found.
- **Tail rotor side** (port or starboard): not found.
- **Tail rotor hub height and x position:** not found. Est.
- **Hub height and x position of main rotor:** not found. Est.
- **Engine housing positions and exhaust detail:** not found. Est.
- **Skid track, skid length, skid height:** not found. Est.
- **Stub wing or tailplane:** none on production Lynx per Wikipedia. Treated as none.
- **G-LYNX Gem 60 power rating:** not found.
- **G-LYNX livery (colours and markings):** not found. Est. white only.
- **Black Cats exact livery split:** colours "grey and black" [src], but which parts are which, and the cat artwork, not found. Hexes est.
- **Blue Eagles livery colours:** not found.
- **Navy HAS.3 full dimensions and wheeled Navy version:** not checked.
- **Sound design:** no source, all (est.).
- **Max speed:** AH.7 184 mph [src: pimaair] vs Wikipedia "not stated". Use pimaair value.
- **Service entry year:** 1977, 1978 or 1979 depending on source.
