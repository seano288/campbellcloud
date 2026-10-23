# Sikorsky CH-53E Super Stallion: research notes for a procedural 3D hangar model

Conventions: [src] = from a fetched or searched source (see section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, read from memory of photos or general layout, not from a fetched source. Where sources disagree, both values are given. Metric is primary; imperial is shown only where a source printed it.

Source notes: the NAVAIR product page and the navy.mil fact file both returned HTTP 403 on fetch, so their figures come from search snippets only. Wikipedia figures were pulled through a summarising fetch, so treat exact decimals as [src] but re-check if they matter for a final model.

---

## 1. Identity

- **Full name:** Sikorsky CH-53E Super Stallion. [src: Wikipedia]
- **Designations:** CH-53E (USMC heavy-lift transport). The Navy's airborne mine countermeasures version is the MH-53E Sea Dragon (separate type, same family). [src: Wikipedia]
- **Nicknames:** "Super Stallion" is the name used in every source checked. No other nickname was verified; Known gap.
- **Maker:** Sikorsky Aircraft. [src: Wikipedia summary] (Sikorsky later became part of Lockheed Martin in 2015; this is general knowledge, not from a fetched source.)
- **First flight:** Prototype YCH-53E 1 March 1974. First production CH-53E flight December 1980. [src: Wikipedia]
- **In service:** February 1981 (infobox). [src: Wikipedia] The CH-53E was developed from the earlier CH-53 Sea Stallion family, mainly by adding a third engine and a seventh main-rotor blade. [src: navy.mil search snippet]
- **Role:** Heavy-lift helicopter: troop transport, external sling loads, and recovery. [src: Wikipedia]
- **Crew:** Sources disagree. Wikipedia lists 5 (2 pilots, 1 crew chief/right gunner, 1 left gunner, 1 tail gunner). [src: Wikipedia] The NAVAIR search snippet lists 4 (pilot, copilot, crew chief, mechanic/gunner). [src: navair.navy.mil search snippet] Use 5 in-game; note the conflict in a voice line only if needed. Cockpit seats are side-by-side (2 pilots, front). (est. for seating layout)

### Kid-friendly voice lines

Each under 12 words, each checked against a source.

1. "Its big rotor has seven blades, all spinning together!" (9 words) [src: Wikipedia, seven-blade main rotor]
2. "It has three big engines to lift heavy loads!" (8 words) [src: Wikipedia, 3 x GE T64]
3. "It can carry 37 soldiers inside its big belly!" (8 words) [src: Wikipedia, 37 troops with folding seats]
4. "Its rotor is as wide as two school buses, end to end!" (11 words) (derived: 24.08 m rotor, school bus about 12 m, est. bus length) [src: Wikipedia rotor diameter; bus length est.]
5. "It can drink fuel from another plane while flying!" (9 words) [src: Wikipedia, forward in-flight refuelling probe]
6. "Its tail rotor stops the big rotor spinning it around!" (9 words) [src: Wikipedia, tail rotor counteracts main rotor torque]
7. "It lifts heavy loads hanging from a strong cable underneath!" (9 words) [src: Wikipedia, 36,000 lb external hook]
8. "It can fly over 300 kilometres every hour!" (7 words) [src: naval-technology.com, max level speed 315 km/h]

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | Imperial as printed | Source |
|---|---|---|---|
| Overall length, rotors turning | **30.19 m** | 99 ft 0.5 in | [src] Wikipedia; naval-technology 30.19 m |
| Fuselage length (nose to tail) | **22.35 m** | not printed | [src] naval-technology |
| Height, top of main-rotor hub area (overall) | **8.46 m** (Wikipedia) | 27 ft 9 in | [src] Wikipedia |
| Height, alt. figure | 8.66 m | 28 ft 5 in (Navy fact file snippet); 28 ft 4 in (NAVAIR snippet) | [src] search snippets; conflict |
| Height to top of turning tail rotor | 5.32 m | not printed | [src] naval-technology |
| Fuselage width (body) | **2.69 m** | not printed | [src] naval-technology (single source) |
| Stub-wing span | **none** (no wings; sponsons only) | n/a | [src] general configuration, see sponsons below |
| Sponson / overall width | not sourced in this session | | Known gap |
| Main rotor diameter | **24.08 m** | 79 ft 0 in | [src] Wikipedia; naval-technology |
| Main rotor disc area | 460 m² | 4,900 sq ft | [src] Wikipedia |

### 2b. Main rotor

- **Count:** 1 (single main rotor with anti-torque tail rotor). [src]
- **Diameter:** 24.08 m (79 ft). [src]
- **Blade count:** 7. [src: Wikipedia, navy.mil snippet, naval-technology] Each blade is 1/7 of the rotor disc.
- **Blade chord:** not sourced. (est.) about 0.6 to 0.7 m for a heavy-lift blade of this size; treat as a model parameter, not a fact. Known gap.
- **Rotation seen from above:** **Not verified.** No fetched source gave the direction. (est.) US single-rotor helicopters of this family normally turn counterclockwise seen from above; check against a Sikorsky manual or a clear top-view photo before relying on it.
- **Hub height above ground:** not sourced. (est.) hub about 5.5 to 6.0 m above ground, because the overall height is 8.46 m and the top of the hub sits below the tallest point of the mast fairing. Known gap for exact value.
- **Hub position along fuselage (x from nose):** not sourced. (est.) x about 11 to 12 m, roughly over the middle of the cabin, slightly aft of centre of the 22.35 m fuselage. Known gap.

### 2c. Anti-torque: tail rotor

- **Type:** Conventional tail rotor on a tail pylon, not a fenestron or NOTAR. [src: Wikipedia summary says the tail rotor is tilted from vertical]
- **Diameter:** 6.1 m. [src: naval-technology]
- **Blade count:** 4. [src: SKYbrary search snippet, "four-blade tail rotor"; re-check, because one source describes it only as "tail rotor"]
- **Canting:** The tail rotor is canted 20 degrees from vertical so it gives some lift in hover while countering main-rotor torque. [src: search snippet, Wikipedia summary, S-80 development note]
- **Height / x position:** not sourced. (est.) hub about 4.5 to 5.0 m above ground, at the rear of the boom near x about 21 to 22 m. Known gap for the exact values.
- **Side:** not sourced. Known gap; verify with a three-view before fixing the side in the model.

### 2d. Fuselage stations (all est. unless noted)

Station x is measured from the nose. Width and height are the body (not the sponsons). Centre z is the height of the body centre above ground. Cabin figures [src] are noted separately.

| Station | x (m) | Width (m) | Height (m) | Centre z (m) | Note |
|---|---|---|---|---|---|
| S1 nose | 0.0 | 1.2 | 1.6 | 2.0 | (est.) pointed nose, cockpit glazing above |
| S2 cockpit rear | 3.0 | 2.4 | 2.6 | 2.3 | (est.) |
| S3 cabin front | 7.0 | 2.69 | 2.8 | 2.5 | width [src]; height est. |
| S4 cabin mid | 11.0 | 2.69 | 2.9 | 2.6 | (est.) above the rotor hub |
| S5 cabin rear | 15.0 | 2.4 | 2.6 | 2.6 | (est.) |
| S6 ramp / boom | 18.0 | 1.8 | 2.3 | 2.6 | (est.) |
| S7 tail boom | 20.5 | 1.2 | 1.6 | 2.8 | (est.) |
| S8 tail end | 22.35 | 0.6 | 1.0 | 3.0 | fuselage end [src]; rest est. |

Cabin interior [src: naval-technology]: 9.14 m long, 2.29 m wide, 1.98 m high. Use these as the inner cabin box.

- **Engine housings:** 3 General Electric T64-GE-416 engines [src: Wikipedia]. Two engines sit side by side above the aft cabin in the centre engine nacelle position, and the third sits in a separate position on the top. (est.) Exhausts point rearward and slightly upward. Exact layout is a known gap; check a three-view.
- **Tail boom length and diameter:** not sourced. Known gap. (est.) boom about 9 to 10 m long from the ramp, diameter about 1.2 m near the tail.
- **Cockpit canopy:** (est.) a flat-faced glazed cockpit with a windshield in three or four panes, common to the family.

### 2e. Top and side outline (est., from memory of three-views)

Half top-view outline, x from nose, y from centreline (m), est.:

| x (m) | y half-width (m) |
|---|---|
| 0.0 | 0.0 |
| 3.0 | 1.2 |
| 7.0 | 1.35 |
| 15.0 | 1.2 |
| 20.5 | 0.6 |
| 22.35 | 0.0 |

Side-view outline (x, z in m, est.): nose (0, 2.0), cockpit top (3.0, 3.6), cabin roof (11.0, 4.0), tail top (20.5, 4.0), tail tip (22.35, 3.0). Use these only as a shape guide.

### 2f. Tail surfaces

- **Vertical fin:** A larger vertical tail was added in production, replacing the low symmetric horizontal tail of the YCH-53E prototype. [src: Wikipedia]
- **Horizontal stabiliser:** High-mounted horizontal surface. The inboard part is perpendicular to the tail rotor and the outboard part is canted 20 degrees to horizontal, which is the gull-wing shape your brief describes. [src: Wikipedia summary, which marks this as needing a citation]. The brief's word "gull-wing" is not used in any fetched source; the geometry matches it, but treat the shape as derived from the canting description.
- **Span:** not sourced. Known gap. (est.) about 3.5 to 4.5 m total span.
- **Chord:** not sourced. (est.) about 1 m.
- **Endplates:** not sourced. Known gap.

### 2g. Landing gear

- **Layout:** (est.) tricycle layout with a nose gear and main gear. Not verified. Known gap.
- **Wheel size and track:** not sourced. Known gap.
- **Retractable:** not sourced. (est.) fixed. Known gap.
- **Sponsons:** Each side has a sponson that houses fuel and carries the main gear or stabilises the aircraft. (est.) Sponson fuel: forward sponson bladder 1,192 litres each [src: naval-technology].

---

## 3. Distinctive features checklist (most recognisable first)

1. **Seven-blade main rotor.** The single most important feature; it is what sets the CH-53E apart from the CH-53 Sea Stallion, which had six blades. [src: Wikipedia, navy.mil snippet]
2. **Three-engine layout** on the top of the fuselage behind the rotor. [src]
3. **Large rear cargo ramp** that opens to the tail. (est.)
4. **Canted tail rotor** on the tail pylon. [src]
5. **High-mounted horizontal stabiliser with the outboard part canted 20 degrees.** [src]
6. **Sponsons on each side** holding fuel. [src]
7. **Forward-extending refuelling probe** on the nose. [src: Wikipedia]
8. **Tall, boxy body with a wide cabin.** (est.)

---

## 4. Paint & liveries

Hex values are all **(est.)** from memory of photos. Verify against photos before the final model.

Real schemes (names given where I am confident; otherwise described generically):

1. **USMC tactical grey-green (two-tone).** Base about #5F6452 (est.), lighter panels about #8A8F7C (est.), dark markings about #2E3024 (est.). Marine Corps tactical helicopters commonly use low-visibility greys and olive tones. Colours go on the whole airframe, with stencilled markings on the boom.
2. **USMC overall grey (low-visibility, later years).** Base about #7D8176 (est.), with dark grey underside about #4A4D47 (est.). Used on deployed aircraft.
3. **USMC squadron markings.** Unit tail codes and squadron colours on the tail pylon, typically in white or yellow on green (est.). Specific squadron names not verified in this session. Known gap.
4. **Navy grey (MH-53E-style, adjacent family).** Light grey about #A7ABA6 (est.) with dark grey about #3B3F3D (est.). Shows the family look even though it is a different variant.
5. **Demonstration / airshow.** Clean grey with bright red stripe on the tail boom (est.), used for public display. Not a documented scheme; treat as a game skin.

Suggested mod ladder:
- **Free default:** Tactical grey-green (scheme 1).
- **Upgrade 1:** Overall low-vis grey (scheme 2).
- **Upgrade 2:** Squadron tail markings (scheme 3) with a choice of colour.
- **Upgrade 3:** Navy grey (scheme 4) with a gold stripe.
- **Legendary:** Airshow demo (scheme 5) with a glossy finish and red stripe.

---

## 5. Armament & stores

- **Side guns:** Two 0.50-calibre XM218 machine guns, one on each side through the side windows. [src: naval-technology]
- **Ramp gun:** One ramp-mounted GAU-21 0.50-calibre machine gun. [src: naval-technology]
- **Rockets, missiles:** none. [src: no source lists these for the CH-53E; this is the standard configuration]
- **Hardpoints:** none on the stub wings (no wings). External loads are carried on the cargo hook. [src: Wikipedia, external payload 36,000 lb]
- **Cargo hook:** 1 centre hook, rated 36,000 lb (16,329 kg) external load. [src: Wikipedia]
- **Hoists:** not sourced for the CH-53E specifically. Known gap. (est.) rescue hoist fitted on some variants.
- **Door guns:** side windows [above]. Ramp gun [above].

### 4-step kid-friendly weapons/stores mod ladder

1. **Free:** Plain hull, no guns.
2. **Tier 1 "Helper":** A cargo net swing under the belly for a sling load.
3. **Tier 2 "Guard":** Two side machine guns (XM218) in the windows, shown as short barrels.
4. **Tier 3 "Super Lifter":** Ramp-mounted gun plus a big cargo hook with a glowing hook light.

---

## 6. Engines

- **Count:** 3. [src: Wikipedia]
- **Type:** General Electric T64-GE-416 turboshaft (also listed as T64-GE-419 or T64-GD-416 in some sources). [src: Wikipedia, navy.mil snippet, Military.com snippet; conflict on suffix]
- **Power:** 4,380 shp each (3,270 kW). [src: Wikipedia; naval-technology gives 3,266 kW, which matches]
- **Exhaust positions:** (est.) at the rear of the engine nacelles on top of the fuselage, pointing rearward and slightly up. Known gap for the exact layout.
- **Top speed:** 170 knots (about 315 km/h). [src: Wikipedia 170 kn; naval-technology 315 km/h]. Cruise 150 kn (278 km/h). [src]
- **Speed or lift fact:** Max all-up weight 73,500 lb (33,339 kg) [src: Wikipedia], and the aircraft can lift up to 36,000 lb (16,329 kg) on the external hook [src]. (derived) that is about 49% of its own gross weight.

---

## 7. Other cool mods

- **Searchlight:** (est.) a bright lamp under the nose or cabin, used for night recovery. Not sourced.
- **Rotor-tip lights:** (est.) red and white tip lights on the blade tips.
- **Winch:** (est.) rescue hoist under the cabin door. Known gap for placement.
- **Sling load:** The big hook under the belly. Shown as a cargo box or Humvee on a cable. [src: hook rating]
- **Cabin light glow:** (est.) lit cabin windows at night, with the ramp open to show troops.
- **Refuelling probe extend:** A probe that swings out from the nose and clicks into place. [src: forward-extendable probe, Wikipedia]
- **Tail-rotor spin:** Tail rotor turns with a visible blur as a flourish. (est.)

---

## 8. Sound

Words for a sound designer:

- **Main blade slap:** a low, heavy "whup... whup... whup" at a slow rate, lower than the Black Hawk because the rotor turns slower and the blades are bigger. (est.)
- **Seven-blade thrum:** A deep, even beat with a faint extra tick from the seventh blade, sounding fuller than a four-blade rotor. (est.)
- **Engine whine:** A high, steady turbine whine, layered over the rotor, rising with power. Three engines mean a thicker, layered whine. (est.)
- **Tail rotor:** A faster, higher "wheee-wheee" buzz from the tail, under the main rotor sound. (est.)
- **Hover:** A rolling thump with a deep rumble underneath, from the three engines. (est.)

---

## 9. Fraction-friendly facts

- **Blades per rotor:** 7 blades, so each blade is 1/7 of the rotor. [src: 7 blades]
- **Rotors:** 1 main rotor plus 1 tail rotor, so 2 rotors in total. Each rotor is half of the total rotor count. (derived)
- **Engines:** 3 engines, so each engine is one third of the power. [src: 3 engines]
- **Crew seats:** 5 crew (Wikipedia), so one crew member is one fifth of the crew. (derived, source conflict noted in section 1)
- **Side guns:** 2 side guns plus 1 ramp gun, so 3 guns in total; the two side guns are two thirds. (derived)
- **Troops:** 37 seats, so 37 troops. [src] (A centre row raises it to 55.) [src]
- **Cargo hooks:** 1 hook, so the external load hangs from one point. [src]
- **Refuelling probe:** 1 probe. [src]
- **Tail rotor blades:** 4, so each tail blade is one quarter of the tail rotor. [src: SKYbrary snippet; verify]
- **Wheels:** not sourced. Known gap for counting.
- **Doors:** not sourced. Known gap.

---

## 10. Reference sources

URLs used:
- https://en.wikipedia.org/wiki/Sikorsky_CH-53E_Super_Stallion (WebFetch summary; main source for dimensions, weights, engines, crew, troops, dates, refuelling probe, tail description)
- https://www.naval-technology.com/projects/ch53e/ (WebFetch; rotor, tail rotor diameter, fuselage and cabin dimensions, sponson fuel, armament, speed)
- https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2166570/ch-53e-super-stallion/ (search snippet only; the page returned HTTP 403 on fetch)
- https://www.navair.navy.mil/product/CH-53E-Super-Stallion (search snippet only; HTTP 403 on fetch)
- https://skybrary.aero/aircraft/h53s (search snippet only; four-blade tail rotor)
- https://365.military.com/equipment/ch-53e-super-stallion (search snippet only; engine suffix)
- https://history.navy.mil/research/histories/naval-aviation-history/naval-aircraft/current-aircraft-inventory/ch-53d-sea-stallion.html (search result only, not fetched)

Three-view drawings: none fetched in this session. Known gap.

Mentioned for the CH-53K section (section 11): https://en.wikipedia.org/wiki/Sikorsky_CH-53K_King_Stallion; https://www.thisdayinaviation.com (search snippet, sponson width and rotor diameter); https://www.sldinfo.com/wp-content/uploads/2016/03/CH-53K-Facts-v27Jan16.pdf (search result, not fetched).

### Known gaps

- Main rotor rotation direction (seen from above): not verified.
- Fuselage width including sponsons, and sponson shape.
- Tail boom length and diameter.
- Horizontal stabiliser span, chord, and endplates.
- Tail rotor hub height and x position.
- Hub height and x position of main rotor.
- Landing gear type, wheel size, track, retractability.
- Hoist and door layout.
- Blade chord.
- Exact engine exhaust and nacelle layout.
- Squadron-specific markings and named USMC squadron schemes.
- Initial operational capability date for the CH-53E (not given in the fetched source).
- Crew count conflict: 5 (Wikipedia) versus 4 (NAVAIR snippet).
- Overall height conflict: 8.46 m (Wikipedia) versus 8.66 m (Navy fact file snippet).
- Engine suffix conflict: GE-416, GE-419, GD-416 (sources disagree).
- Production count conflict: 172 (infobox), 177 (text), 234 (Military Wiki mirror). Not needed for the model.

---

## 11. CH-53K King Stallion: what changed

The CH-53K is the newer heavy-lift successor. It is a separate type but shares the seven-blade rotor and the general layout, so the CH-53E model can be reused with edits.

### 11a. Dimensions compared

| Item | CH-53E | CH-53K | Note |
|---|---|---|---|
| Length, rotors and tail unfolded | 30.19 m (99 ft 0.5 in) | 30 m (99 ft) | [src] both; same overall length within rounding |
| Height | 8.46 m (27 ft 9 in) Wikipedia; 8.66 m Navy snippet | 8.66 m (28 ft 4.9 in) | [src] K height; E conflict noted above |
| Fuselage width | 2.69 m (body only) [src: naval-technology] | 5.33 m (17 ft 6 in) across the sponsons [src: Wikipedia; ThisDayInAviation search] | The K figure is the sponson overall width, so it is not a body-to-body comparison |
| Main rotor diameter | 24.08 m (79 ft) [src] | 24.08 m (79 ft) [src: ThisDayInAviation search, Sikorsky-era fact sheet snippet] | Same rotor size |
| Main rotor blades | 7 [src] | 7 (composite) [src] | K blades are composite |
| Cabin length | 9.14 m [src] | 9.1 m (30 ft) [src] | Nearly identical |
| Cabin width | 2.29 m [src] | 2.6 m (8 ft 7.2 in) [src] | K cabin is about 0.3 m wider (derived) |
| Cabin height | 1.98 m [src] | 2.0 m (6 ft 6 in) [src] | Nearly identical |
| Empty weight | 15,071 kg (33,226 lb) [src] | 19,903 kg (43,878 lb) [src] | K is about 32% heavier empty (derived) |
| Max gross weight | 33,339 kg (73,500 lb) [src] | 39,916 kg (88,000 lb) with external load [src] | K max about 20% heavier (derived) |
| Internal payload | 14,515 kg (32,000 lb) [src] | 15,876 kg (35,000 lb) [src] | |
| External hook, centre | 16,329 kg (36,000 lb) [src] | 16,329 kg (36,000 lb) [src] | Same centre hook rating |
| External hook, fore and aft | not sourced | 11,431 kg (25,200 lb) each [src] | K adds two more hooks |
| Crew | 5 (Wikipedia) [src] | 4 [src] | Conflict noted for E |
| Troops or passengers | 37 (55 with centre row) [src] | 30 [src] | |
| Max speed | 170 kn (315 km/h) [src] | cruise 170 kn (310 km/h) [src]; max not given | |
| Range | 1,000 km [src] | 850 km [src] (combat range 200 km) | K is shorter |
| Service ceiling | 5,640 m [src] | 4,900 m (16,000 ft) [src] | K lower |

### 11b. Engines

| Item | CH-53E | CH-53K |
|---|---|---|
| Count | 3 [src] | 3 [src] |
| Type | GE T64-GE-416 [src] | GE T408 (GE38-1B) [src] |
| Power each | 4,380 shp [src] | 7,500 shp [src] |
| Ratio (derived) | 1.00 | about 1.71 (K engines are about 71% more powerful each) |

Engine power changes are one of the main upgrades. The CH-53K's engines are 7,500 shp each (derived: about 22,500 shp in total, versus 13,140 shp for the E). The CH-53K's max speed is not stated on the fetched page; only the cruise speed of 170 kn (310 km/h) is given. [src]

### 11c. What changed visibly

Ordered by how easy each is to see in a model or a picture:

1. **Sponsons:** redesigned, shorter composite sponsons. They narrow the footprint for shipboard service, and the sponson overall width is 5.33 m [src: Wikipedia, ThisDayInAviation]. The fetched Wikipedia page says the footprint is about the same as the CH-53E; the wording is partly in conflict, so check against a three-view before modelling the exact sponson length.
2. **Rotor blades:** composite blades, a new elastomeric hub, and a split-torque gearbox with quill shafts. [src: Wikipedia] Visually the blades look similar, so this is mainly a hidden change.
3. **Tail rotor pylon:** built by a different subcontractor, with a tail rotor and driveshaft that had deficiencies in test. [src: Wikipedia] The fetched page does not describe a shape change; treat the K tail as "same layout, new pylon" for modelling (est.).
4. **Cockpit:** digital glass cockpit with fly-by-wire controls and haptic cueing. [src: Wikipedia summary] This is visible through the canopy only as a different panel layout.
5. **Cabin:** wider and slightly longer, able to take a Humvee internally. [src: Wikipedia summary]
6. **Pallets:** can carry two 463L master pallets. [src: Wikipedia summary]
7. **Gross weight and lift:** the K is 88,000 lb max versus 73,500 lb for the E, with a 35,000 lb external payload versus 27,000 lb for the E at the same 110 nmi radius. [src: Wikipedia summary]

### 11d. Dates

- **First flight:** 27 October 2015. [src: Wikipedia]
- **First delivery to USMC:** 16 May 2018. [src: Wikipedia]
- **Initial operational capability:** 22 April 2022. [src: Wikipedia]
- **Status:** in production. [src: Wikipedia]

### 11e. Known gaps for the CH-53K

- Main rotor rotation direction (not stated).
- Sponson exact length and shape.
- Tail rotor canting and tail shape changes (not described).
- Max speed (only cruise given).
- Gear layout and wheel size.
- Refuelling probe: the fetched page does not say whether the K has one. Do not assume it does.
- Cabin door and ramp dimensions beyond the cabin box.

### 11f. Model guidance

Build the K as the E model with: longer and wider sponsons (use 5.33 m overall width), two extra external hook points (fore and aft), and a different engine intake and exhaust shape (est.). Keep the same seven-blade rotor and 24.08 m diameter.

---

## Summary notes

- The CH-53E is recognisable by its seven-blade rotor, three-engine top layout, and canted tail rotor.
- The CH-53K looks similar at a glance but has wider sponsons and composite blades on the same 24.08 m rotor.
- Most dimensions are sourced; landing gear, tail boom, rotor direction, and hub position are gaps.
