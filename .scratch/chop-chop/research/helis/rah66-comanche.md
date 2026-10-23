# Boeing-Sikorsky RAH-66 Comanche: research notes for a procedural 3D hangar model

Tags: **[src]** fetched/search source (see section 10), **(derived)** arithmetic on sourced numbers, **(est.)** my estimate. Where sources conflict, both values are given. Units metres unless noted.

Note on sourcing: the Wikipedia figures below come from a summarising fetch (not a raw copy of the page), so treat them as [src] but re-check against the live article before hard-coding. Several search results were forum or modelling-blog posts, which I have not used as authority.

---

## 1. Identity

- **Full name:** Boeing-Sikorsky RAH-66 Comanche (Boeing/Sikorsky on Wikipedia). [src]
- **Nickname:** None found in the sources. Do not invent one. "Comanche" is the name.
- **Maker:** Boeing and Sikorsky, a joint team; Sikorsky did the build at its Connecticut facility. [src: Wikipedia, rollout at Sikorsky production facility]
- **First flight:** 4 January 1996, flown by Bob Gradle and Rus Stiles, 39 minutes. [src: Wikipedia]
- **In service:** Never. Prototype only. The programme was cancelled 23 February 2004, with about US$6.9 billion spent. [src: Wikipedia]
- **Role:** Armed reconnaissance and light attack helicopter, stealth-shaped, designed to find and attack targets while hard to spot by radar. [src: Wikipedia, Design section]
- **Crew:** Two. [src: Wikipedia specifications]
  - Seating arrangement (tandem vs side-by-side) **not confirmed** in any source I fetched. See Known gaps.

### Kid-friendly voice lines (8, each under 12 words, each checked against a source)

1. "Its main rotor has five blades that spin together!" (9 words) [src: Wikipedia, five-blade all-composite main rotor]
2. "It was built to be hard for radar to spot!" (9 words) [src: Wikipedia, stealth design]
3. "Its gun tucks away under its nose when it is not needed!" (11 words) [src: Wikipedia, gun retracts under a fairing]
4. "Its two engines together make about three thousand horsepower!" (9 words) [src: Wikipedia, 1,563 shp each (derived: about 3,126 total)]
5. "Its weapons hide in bays inside its belly!" (7 words) [src: Wikipedia, internal weapon bays]
6. "It can fly over two hundred miles per hour!" (8 words) [src: Wikipedia, max 175 kn = 201 mph]
7. "Only two of these helicopters were ever built!" (8 words) [src: Wikipedia, two prototypes built]
8. "It first took to the sky in January 1996!" (8 words) [src: Wikipedia, first flight 4 January 1996]

Fiction note: no TV-show framing is needed. Every line is about the real helicopter.

---

## 2. Geometry for procedural modelling

### 2a. Overall

| Item | Value | Source / tag |
|---|---|---|
| Fuselage length (nose to tail, Wikipedia spec) | **14.28 m** (46 ft 10.25 in) | [src] Wikipedia Specifications |
| Fuselage length, Design section | 13 m ("43 feet (13 m) long") | [src] Wikipedia Design; **conflicts** with 14.28 m. Use 14.28 m for the model, mark 13 m as alt. |
| Fuselage width (max) | **2.04 m** (6 ft 8.25 in) | [src] Wikipedia |
| Height (overall) | **3.37 m** (11 ft 0.75 in) | [src] Wikipedia |
| Main rotor diameter | **12.19 m** (40 ft) | [src] Wikipedia; radius 6.10 m (derived) |
| Main rotor disc area | 116.8 m² (1,257.14 sq ft) | [src] 1,257.14 sq ft converted (derived) |
| Stub wing span | **not found** | Known gap |
| Length with rotors turning | not found | Gap; use fuselage length plus a small overhang (est.) |

Scale check (derived): the rotor is 12.19 m across, about 85% of the fuselage length (14.28 m). That is a much shorter rotor than the 25.8 m Osprey rotor span in the sibling note, so keep the Comanche rotor visibly smaller than the Osprey's.

### 2b. Main rotor

- **Count:** One main rotor. [src: single-rotor helicopter]
- **Blades:** **5**, all-composite. [src: Wikipedia Design]
- **Diameter:** 12.19 m. Radius 6.10 m. [src]
- **Blade chord:** not found. Est. ~0.4 m at mid-span for a five-blade composite rotor (est.). Model with a linear taper.
- **Direction seen from above:** not confirmed. US single-rotor helicopters typically turn counter-clockwise seen from above (est., not sourced). Mark as an assumption.
- **Hub/mast height above ground:** not found. Overall height 3.37 m [src] is the top of the rotor system or the top of the fuselage; the hub is slightly below the top (est. hub ~2.9 m above ground).
- **Hub x-position from nose:** not found. Est. roughly at the cabin centre, about 0.5 of fuselage length from the nose (est.).

### 2c. Anti-torque

- **Fenestron (ducted tail fan) in the fin**, not an open tail rotor. [src: Wikipedia Specifications, "fenestron tail rotor"] The Design section calls it a "canted" tail rotor assembly. [src]
- **Diameter, blade count, x position:** not found. Est. diameter ~1.4 m, a bladed fan inside a duct in the fin (est.). Put it in the tail fin, not on a boom.
- **Side:** fin on the tail, centreline (est.).
- **Pusher propeller:** none. [src: no pusher prop in any source]
- **NOTAR:** no.

### 2d. Fuselage

- **Shape:** faceted stealth fuselage, angled planes instead of smooth curves. [src: Wikipedia Design]
- **Engine housings:** two LHTEC T800 engines. Positions and exhaust directions not found. Est. both in the rear fuselage, exhaust out the top or sides (est.).
- **Cockpit canopy:** shape not found in sources. Est. a single bubble-style canopy over the crew (est.).
- **Station table (8 stations):** not found in sources. Build from a three-view. The max width 2.04 m and height 3.37 m [src] are the only fixed cross-section numbers.
- **Top-view and side-view outline points:** not available from sources. Est. from memory of the common three-view; do not hard-code until checked.

### 2e. Tail surfaces

- Vertical fin houses the fenestron. Fin height/chord: not found.
- Horizontal stabiliser: not found.

### 2f. Stub wings (optional, "EFAMS" not confirmed)

- Optional **stub wings** carry external stores. [src: Wikipedia, optional stub wings]
- Span, chord, hardpoints per side: span not found. Hardpoints: the stub-wing load is 8 Hellfire, 16 Stinger, or 56 Hydra 70 rockets total. [src] Per-side split not stated.
- The designation "EFAMS" (enhanced fire support aircraft) was **not found** in any source. Do not use it in-game.

### 2g. Landing gear

- **Type:** Tricycle-style wheeled landing gear? Not confirmed. The sources I read did not describe the undercarriage. Est. retractable tricycle or skid-style (est.; **unsourced, do not rely on**).
- Gear is a gap. Find a three-view or the Army's fact page before modelling.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Faceted stealth fuselage**: angled flat panels, no smooth curves. [src]
2. **Chin turret gun under the nose**, retracts into a fairing. [src]
3. **Fenestron** tail fan in the fin, not an open tail rotor. [src]
4. **Internal weapon bays** in the belly. [src]
5. **Five-blade main rotor.** [src]
6. **Optional stub wings** for extra weapons (with a radar-signature cost). [src]
7. Sleek, low profile: height 3.37 m, fuselage width 2.04 m. [src]

---

## 4. Paint & liveries

Sources give no authoritative colour. The only colour claim I found is a modelling blog saying the prototypes were **light olive green**, and a second build using **Vallejo US Olive Drab** to match a kit's FS code. Neither is a museum or manufacturer source. Treat all hex values below as **(est.)**.

| # | Scheme | Hex (est.) | Where colours go | Tag |
|---|---|---|---|---|
| 1 | Prototype light olive (blog claim) | #7A8058 body, #5A5F3F panels | whole airframe | (est.) hex; colour name from modelling blog [src, weak] |
| 2 | Olive drab, kit-matched (Vallejo US Olive Drab) | #5E6046 body | whole airframe | (est.) |
| 3 | Dark stealth grey (est.) | #4A4F52 body, #2C3033 canopy | whole airframe, dark glass | (est.) |
| 4 | Museum display, current (est.) | #6F7360 body | whole airframe, weathered | (est.); current paint not verified |

Mod ladder (suggested): **free default = scheme 2 (olive drab)**. Three upgrades: scheme 1 (light olive), scheme 3 (stealth grey), a gloss-canopy finish. **Legendary: scheme 4 weathered museum look, with a gold "Prototype" tail number.** The tail numbers 94-0327 and 95-0001 are sourced [src] and can be painted on as small text.

---

## 5. Armament & stores

- **Gun:** 20 mm three-barrel **XM301 rotary cannon** in a chin turret. Rearward-pointing and retracts under a fairing to lower radar signature. Capacity **500 rounds**. [src: Wikipedia Design and Specifications]
- **Internal bays** (belly), total options: **6 AGM-114 Hellfire**, **12 AIM-92 Stinger**, or **24 Hydra 70 2.75 in rockets**. [src]
- **Stub wings** (optional, external): **8 Hellfire**, **16 Stinger**, or **56 Hydra 70 rockets**. [src]
- **Door guns, hoists, cargo hooks:** none. Not a transport aircraft. [src: no mention]
- **Hardpoint positions:** stub wing per side not given. Est. one pair of stub wings on the fuselage sides (est.).

### 4-step kid-friendly weapons/stores ladder

1. **Start:** chin gun only. Fires 500 rounds.
2. **Missiles:** add 6 Hellfire missiles in the belly bays (sourced max).
3. **Rockets:** swap to 24 Hydra rockets in the belly bays (sourced max).
4. **Wing stores:** fit the stub wings with 8 Hellfire or 56 rockets (sourced max; warn that wings "make it easier to spot", which is true per the source).

---

## 6. Engines

- **Count:** 2. [src]
- **Type:** LHTEC T800-LHT-801 turboshaft. [src]
- **Power:** **1,563 shp each** (1,166 kW). [src] Upgraded from the earlier 1,340 shp T800-800, about 17% more. [src]
- **Exhaust positions:** not found. Est. in the rear fuselage (est.).
- **Top speed:** **175 knots** (201 mph, 324 km/h) without mast radar. With mast radar: 166 kn. [src]
- **Fact:** the Comanche flies over **200 miles per hour** (derived: 175 kn ≈ 201 mph). [src]

---

## 7. Other cool mods (specific to Comanche)

- **Chin gun swivel:** the turret can point rearward and retract, a neat animation to show. [src]
- **Fenestron spin:** show the tail fan spinning inside the fin. [src]
- **Mast radar:** an optional mast-mounted radar. Mentioned in Wikipedia figures (speed with/without mast radar). [src; the radar mast's geometry is a gap]
- **Stealth glow:** dark glass canopy and a faceted-panel highlight. (est.)

---

## 8. Sound

- A ducted tail fan gives a high, steady whine rather than the open-rotor slap of a normal tail rotor (est., from the fenestron design).
- Five main blades give a deeper, slower thump than a four-blade rotor (est.).
- Two turboshafts add a high turbine whistle (est.).
- Sound design guess: a 5-blade thump at low pitch, a fenestron whine on top, and a quick gun burst from the chin turret (est.).

---

## 9. Fraction-friendly facts

- **5 main rotor blades**, so each blade is one fifth of the rotor. [src]
- **2 engines**, so each engine is half the power. [src]
- **1 chin gun**, out of the whole machine's weapons. [src]
- **2 crew** seats, so each crew member is one half of the crew. [src]
- **2 prototypes built**, so each one is one half of the fleet. [src]
- **6 Hellfires** in the internal bays: each bay holds one sixth of the load. [src]
- **24 Hydra rockets** in the belly: a quarter of 24 is 6. [src + derived]
- **8 stub-wing Hellfires**: half of the 16 Stingers that the wings can carry. [src + derived]
- **2 museum serials** (94-0327 and 95-0001): both prototypes preserved, so 2 of 2. [src]

---

## 10. Reference sources

### URLs used

- Wikipedia, Boeing/Sikorsky RAH-66 Comanche (fetched, summarised): https://en.wikipedia.org/wiki/Boeing/Sikorsky_RAH-66_Comanche
- Jalopnik, "The Army Spent $6.9 Billion On Stealth Helicopters That Basically Just Went To A Museum" (fetched): https://jalopnik.com/2237337/army-spent-7-billion-dollars-stealth-rah-66-comanche-helicopter-prototypes-never-saw-action
- Army.mil, "Comanche on display: On museum floor for limited time" (17 Feb 2017, fetched): https://www.army.mil/article/182726/
- Search-only (not fetched): National Interest, "RAH-66: Why America's Comanche Stealth Helicopter Failed": https://nationalinterest.org/node/207969
- Search-only (not fetched): Fighter Sweep, "The Unfortunate Demise of the Army's RAH-66 Comanche": https://fightersweep.com/12805/the-unfortune-demise-of-the-armys-rah-66-comanche/
- Modelling forum, light-olive and olive-drab colour claims (search snippet, weak, not used as authority): https://forum.finescale.com/t/rah-66-comanche/255788

### Where the two prototypes are

- Serials **94-0327** (first flew 4 Jan 1996) and **95-0001** (second prototype, first flew 30 Mar 1999). [src: Wikipedia]
- **U.S. Army Aviation Museum, Fort Rucker (formerly Fort Novosel), Alabama.** [src: Jalopnik; search snippets]
- **Conflict:** Jalopnik (2026 article) says **both** prototypes are on display, with serial numbers 95-00001 and 94-0327. The Army.mil article (Feb 2017) says **one** Comanche is on temporary display, having been in storage, and that the museum planned to replace it with an AH-64 Apache. Army.mil also calls it "one of only two" that were built and flew. The two sources are from different years and can both be partly right, so **current display status is unverified**. Check the museum's own site before using it as fact.
- Which serial is on display, and which one is the other museum airframe: **not resolved**.
- The Wikipedia summary says "both airframes are on display" but does not say where each is. [src]

### Known gaps

1. **Stub wing span and chord** not found in any fetched source.
2. **Length with rotors turning, hub height, hub x-position** not found.
3. **Tail fenestron diameter and blade count** not found.
4. **Crew seating arrangement** (tandem vs side-by-side) not confirmed.
5. **Landing gear type and wheel positions** not found.
6. **Colour schemes:** no authoritative source. All hex values are estimates.
7. **EFAMS designation** not found in any source. Do not use in-game.
8. **Current prototype display** unresolved (Jalopnik vs Army.mil 2017).
9. **Three-view drawing** not found. No station table or outline points available from sources.
10. **Wikipedia Design section says 13 m long, Specifications says 14.28 m.** Unresolved; use 14.28 m.
