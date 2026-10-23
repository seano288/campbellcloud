# Bell AH-1Z Viper (with AH-1G HueyCobra and SuperCobra notes): research for a procedural 3D hangar model

Tags: **[src]** = from a fetched or searched source (cited in section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate, read off general knowledge or a photo, not verified. Where sources disagree, both values are given. Units are metres unless marked otherwise.

Model note: the brief asks for the AH-1Z (four-blade rotor). Where the AH-1G (two-blade rotor, classic Cobra look) differs, its figures are given in a parallel column or a separate line.

---

## 1. Identity

- **Full name:** Bell AH-1Z Viper. Also called "Zulu Cobra" [src: Wikipedia AH-1Z]. Test/prototype designation: AH-1(4B)W Viper [src: Wikipedia AH-1Z via search snippet].
- **Cobra family names:** AH-1G HueyCobra (US Army, Vietnam era), AH-1J SeaCobra, AH-1T, AH-1W SuperCobra (USMC twin-engine), AH-1Z Viper (USMC) [src: Wikipedia AH-1 Cobra; Wikipedia AH-1 SuperCobra].
- **Maker:** Bell Helicopter [src: Wikipedia AH-1Z].
- **First flight:** AH-1Z, 8 December 2000 [src: Wikipedia AH-1Z]. AH-1G prototype (Model 209), 7 September 1965 [src: Wikipedia AH-1 Cobra].
- **In service:** AH-1Z, Marine Corps service entry 30 September 2010 per the infobox; the USMC declared combat readiness in September 2010 [src: Wikipedia AH-1Z]. AH-1G, first US Army service June 1967 [src: Wikipedia AH-1 Cobra]. USMC withdrew the last AH-1W in October 2020 [src: Wikipedia AH-1 SuperCobra].
- **Role:** Attack (gunship) helicopter. The Army Aviation Museum curator calls the AH-1 "the world's first purpose-built attack helicopter" [src: army.mil article 198493].
- **Crew:** Two. Pilot and co-pilot/gunner (CPG) [src: Wikipedia AH-1Z]. The seating order (CPG front, pilot rear) is (est.), not verified in a fetched source.

### Kid-friendly voice lines (each under 12 words)

1. "Its main rotor has four blades, like a giant fan!" (9 words). True: four-blade composite rotor [src: navy.mil fact file, via search snippet].
2. "Its rotor is wider than three cars parked end to end!" (10 words). Rotor 48 ft [src: Wikipedia AH-1Z], car length about 15 ft (est.). Derived comparison; check against a car length before voicing.
3. "It has two engines, so it has a backup engine!" (9 words). Two GE T700 engines [src: Wikipedia AH-1Z].
4. "Its top speed is more than 200 miles per hour!" (9 words). Never-exceed speed 222 kn = 255 mph [src: Wikipedia AH-1Z]. Max airspeed 210 kn = 242 mph [src: army-technology]. Both are over 200 mph.
5. "Its nose gun spins its barrels really, really fast!" (9 words). Three-barrel rotary 20 mm M197 cannon [src: Wikipedia AH-1Z].
6. "Cobra helicopters flew in a war, long before you were born!" (10 words). AH-1G entered Vietnam 1967 [src: army.mil 198493]. Frame as history, not violence.
7. "The first Cobra took off in 1965!" (7 words). AH-1G prototype first flight 7 September 1965 [src: Wikipedia AH-1 Cobra].
8. "It carries a pilot and a gunner, two crew in all!" (10 words). Two crew [src: Wikipedia AH-1Z].

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | AH-1Z (Viper) | AH-1G (HueyCobra, classic look) | Source / note |
|---|---|---|---|
| Overall length, rotors turning | **17.75 m** (58 ft 3 in) | 16 m (53 ft) | [src] Wikipedia AH-1Z; [src] Wikipedia AH-1 Cobra |
| Fuselage length | not given for AH-1Z (see gaps) | **13.5 m** (44 ft 5 in) | [src] Wikipedia AH-1 Cobra |
| Height (overall) | **4.37 m** (14 ft 4 in) | 4.11 m (13 ft 6 in) | [src] Wikipedia AH-1Z; [src] Wikipedia AH-1 Cobra |
| Fuselage width (over stub wings) | not given for AH-1Z | **3.15 m** (10 ft 4 in) | [src] Wikipedia AH-1 Cobra |
| Stub-wing span | **3.28 m** (candidate, see gaps) | 3.28 m family figure; 3.343 m prototype | AH-1Z: [src] army-technology (page text does not clearly say which variant). AH-1G: [src] search results, warbirds/globalsecurity-type data |

Note on AH-1Z length: the 17.75 m is the overall figure with rotors. The AH-1W fuselage alone is 14 m (45 ft 7 in) [src: Wikipedia AH-1 SuperCobra]. The AH-1Z fuselage is probably close to that (est.), since the Viper keeps the SuperCobra fuselage with a longer stub wing and larger rotor.

Weights (for reference, not required for geometry):
- AH-1Z empty weight 10,200 lb (4,630 kg) [src: army-technology; Wikipedia AH-1Z].
- AH-1Z max takeoff weight: **conflict.** Wikipedia table gives 14,750 lb (6,690 kg); Wikipedia text and army-technology give about 18,500 lb (8,390 kg) [src]. Use 18,500 lb if a weight is needed, with a note.
- AH-1G empty 5,810 lb (2,635 kg); max takeoff 9,500 lb (4,309 kg) [src: Wikipedia AH-1 Cobra].

### 2b. Main rotor

| Item | AH-1Z Viper | AH-1G HueyCobra |
|---|---|---|
| Number | 1 (single) | 1 (single) |
| Blades | **4**, hingeless bearingless composite [src: navy.mil snippet; army-technology] | **2**, "door-hinge" teetering rotor [src: search results, Model 540 rotor] |
| Diameter | **14.6 m** (48 ft) [src: Wikipedia AH-1Z; army-technology] | **13.4 m** (44 ft) [src: Wikipedia AH-1 Cobra] |
| Disc area | 168.0 m² (1,808 sq ft) [src: Wikipedia AH-1Z] | 141 m² (1,520 sq ft) [src: Wikipedia AH-1 Cobra] |
| Blade chord | **not found** (see gaps). Est. 0.5 m to 0.6 m | 0.686 m (2 ft 3 in) [src: search results] |
| Blade section | not found | NACA 0009.3 mod [src: Wikipedia AH-1 Cobra] |
| Rotation (seen from above) | not found in sources. (est.) **counter-clockwise** from above, as with most US single-rotor helicopters. Verify. | (est.) same as AH-1Z |
| Hub / mast height above ground | not found. Est. about 3.5 m to 4.0 m (ties to 4.37 m overall height) | not found. Est. about 3.3 m to 3.6 m |
| Hub position along fuselage (x from nose) | (est.) about 3.5 m to 4.5 m, just aft of the cockpit | (est.) about 4.0 m to 4.5 m |

Derived: the AH-1Z disc is about 14% larger in area than the AH-1G disc (168.0 / 141 = 1.19, so about 19% larger) (derived). Check: 168.0 / 141.0 = 1.19.

### 2c. Anti-torque

- **AH-1Z tail rotor:** four blades [src: navy.mil snippet, "four-bladed tail rotor"]. Diameter **not found** (see gaps). Side of tail boom: (est.) the port (left) side, with the tail rotor on the left of the boom as viewed from behind. Verify. Height and x not found.
- **AH-1G tail rotor:** two blades [src: search results, two-blade tail rotor]. Diameter conflicts between sources: 2.59 m (prototype, 8 ft 6 in) [src: search] and 2.97 m (9 ft 9 in) (family-level, probably production) [src: search]. Use **2.97 m** (est. production value), with a note.
- No fenestron, NOTAR, or pusher prop on either variant.

### 2d. Fuselage

- **Cross-section stations (8 stations, nose to tail):** Not found in any fetched source. The Viper's narrow, tapered nose and deep slim fuselage are a visual feature, so get these from a three-view before modelling. (est.) Suggested starting values for AH-1Z, x from nose, width / height / centre-z above ground:
  - x 0.0 m: width 0.25, height 0.35, z 2.2 (nose tip, est.)
  - x 1.5 m: width 0.9, height 1.1, z 2.2 (gun turret area, est.)
  - x 3.0 m: width 1.2, height 1.4, z 2.3 (cockpit, est.)
  - x 4.5 m: width 1.3, height 1.6, z 2.4 (engine area, est.)
  - x 6.0 m: width 1.1, height 1.5, z 2.5 (aft cockpit / transmission, est.)
  - x 7.5 m: width 0.8, height 1.1, z 2.6 (tail boom join, est.)
  - x 9.0 m: width 0.45, height 0.5, z 2.7 (tail boom, est.)
  - x 12.0 m: width 0.25, height 0.25, z 2.8 (tail end, est.)
- **Tail boom:** length and diameter not found in sources. (est.) about 0.5 m diameter, running about 6 m to 7 m from the join to the tail rotor.
- **Engines:** Two, side by side on top of the rear fuselage, exhaust out the rear top (est.). Exact positions not found.
- **Cockpit canopy:** Tandem, stepped. Front seat (CPG) and rear seat (pilot) both have a bubble canopy (est.). Check against photos.

### 2e. Side and top outlines

Not given. Build from a three-view before coding. Known anchor points: overall height 4.37 m [src], length 17.75 m with rotors [src], main rotor hub roughly 2/3 of the way from the nose (est.).

### 2f. Tail surfaces

- **Vertical fin:** not found in any source. (est.) single tall fin on the tail with a tail rotor on the left side.
- **Horizontal stabiliser:** not found. (est.) small, with a tip plate, mounted on the tail boom.

### 2g. Stub wings

- **Span:** 3.28 m is the only number found for the Viper, from army-technology's SuperCobra page [src]. Wikipedia says the AH-1Z stub wings are "of substantially longer span than those of the preceding SuperCobra" [src], which means the Viper span should be longer than the AH-1W's, and the AH-1W figure is 3.28 m [src: Wikipedia AH-1 SuperCobra]. **Conflict, so treat 3.28 m as the AH-1W value.** Use about 3.8 m to 4.0 m for the AH-1Z (est.), until a three-view confirms.
- **Hardpoints:** six pylon stations total, three per side [src: Wikipedia AH-1Z "6 total pylon stations on stub wings"]. (derived: 6 / 2 = 3 per wing.)
- **Wingtip stations:** outboard station on each wing carries an AIM-9 Sidewinder [src: Wikipedia AH-1Z].
- **AH-1G stub wing:** span 3.28 m family figure; prototype 3.343 m [src: search results]. The AH-1G stub wing had two hardpoints per side in the usual configuration (est.). Not verified.

### 2h. Landing gear

- **Type:** Skids, not wheels [src: general knowledge for both Cobras, (est.) if no fetched source states it]. Both AH-1G and AH-1Z use skid landing gear.
- **Skid length, track, height:** not found. (est.) skid track about 2.6 m, skid length about 4.5 m, height to skid bottom about 0.6 m. Check against photos.
- **Retractable:** no. Fixed skids on both.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Narrow, slim tandem fuselage with a tall, pointed nose.** The "snake" silhouette. Two crew, one behind the other.
2. **Stub wings with wingtip Sidewinder rails.** Stubby, with missiles on the tips and rockets and Hellfires on the wing pylons.
3. **Chin turret with the three-barrel 20 mm Gatling cannon.** Sits under the nose.
4. **Four-blade main rotor (AH-1Z) versus two-blade (AH-1G).** The Viper's big rotor with four blades is the most important difference from the classic Cobra.
5. **Two engines side by side, sitting high on the back.** Twin-engine silhouette, unlike the single-engine AH-1G.
6. **Skid landing gear, fixed.**
7. **Four-blade tail rotor on the tail boom's left side (AH-1Z).**

For a classic Cobra look: keep the single-engine AH-1G silhouette with a two-blade rotor and a slimmer, shorter fuselage. The AH-1G's cockpit and nose are the classic shape.

---

## 4. Paint and liveries

Colours are (est.) unless a source names them. Federal Standard (FS) numbers come from a model-kit review, not a Federal Standard chip chart.

### 4a. Real schemes

1. **AH-1Z, USMC Low-Vis Gray (current).** Overall gray. Kit review says the gray decals match FS 36375, "the color on most of the fuselage" [src: aeroscale kit review; hobby source]. FS 35237 is also named by a kit listing [src: scalemates, hobby source]. Hex (est.): #6B6F6E for the body gray, #3F4447 for the dark trim. Colour goes on the whole airframe. Gray is the default.
2. **AH-1Z, HMLA-169 "Vipers" shark mouth (Camp Pendleton).** Shark teeth on the nose, around the chin turret (est.). Academy 1:35 kit includes shark-mouth markings for HMLA-169, -369, and -469 Vipers [src: scalemates / Academy kit listing; hobby source, dated 2017–2018]. Squadron tail code "SN" and mascot Bak-Bak are from [src: Wikipedia HMLA-169]. Hex (est.): teeth white #F2F2F2 with red #B1231E outline, mouth interior dark red #5C1A14. Colour goes on the nose and chin turret area.
3. **AH-1Z, HMLA-269 "Gunrunners" No. 71 "sea snake" throwback.** Green, charcoal, and gray camouflage echoing the AH-1J/T SeaCobra and AH-1W SuperCobra schemes [src: TWZ, 22 November 2021]. Aircraft number 71 honours the squadron's 1971 founding [src: TWZ]. Hex (est.): green #4A5A3A, charcoal #33363A, gray #7A7D7A. Colours go on the whole airframe, camo pattern on top surfaces and sides.
4. **AH-1G, 174th Assault Helicopter Company "Sharks" (Vietnam).** Shark mouth on the nose, based on the Flying Tigers' P-40 design [src: Museum of Flight photo caption; the 1966 adoption date conflicts with the Cobra's 1967 delivery, so treat the date as unverified]. Hex (est.): olive drab base #5C5E3B, teeth white #E8E4D8 with red #A3262B outline. Colour goes on the nose.
5. **AH-1G, D Troop, 3/4 Cavalry "shark's teeth" (Vietnam).** Shark's mouth on the Cobra's nose [src: Centaurs in Vietnam veteran's account]. Same olive drab base as above (est.). Colour goes on the nose.
6. **AH-1G, 3rd Aviation Cavalry F Troop (1971–72).** Large sharkmouths [src: Art Scale Kit review, hobby source]. Olive drab base (est.).

Also seen: a Cobra with shark-teeth art and the name "Piece Maker" at Nui Dat in 1970 [src: Australian War Memorial, C2083708]. Use as a background detail, not a separate scheme.

### 4b. Suggested mod ladder

- **Free default:** AH-1Z Marine Corps low-vis gray, no markings, four-blade rotor. Starting point for the hangar.
- **Upgrade 1 (Shark Mouth):** HMLA-169 Viper shark mouth on the nose and chin turret.
- **Upgrade 2 (Sea Snake):** HMLA-269 No. 71 green/charcoal/gray camouflage. Fits the "retro" look.
- **Upgrade 3 (Classic Cobra):** AH-1G HueyCobra, two-blade rotor, single engine, olive drab with the 174th Sharks' shark mouth.
- **Legendary:** the AH-1G Sharks in full shark mouth, with a "Vietnam" tail number and a 1967 plaque. Do not name a real aircraft's serial; use a generic tail number.

---

## 5. Armament and stores

### 5a. AH-1Z

- **Gun:** one 20 mm M197 three-barrel rotary cannon in the A/A49E-7 chin turret, 750 rounds [src: Wikipedia AH-1Z; army-technology confirms M197 and 750 rounds].
- **Hardpoints:** six stations on the stub wings, 5,764 lb (2,615 kg) max payload [src: Wikipedia AH-1Z]. Three per side (derived).
- **Rockets:** 2.75 in (70 mm) Hydra 70 (unguided) or APKWS II (guided), up to 76 unguided or 38 guided rockets total [src: Wikipedia AH-1Z]. 127 mm Zuni rockets also carried [src: army-technology].
- **Missiles:**
  - AIM-9 Sidewinder: one on each outboard wingtip station, two total [src: Wikipedia AH-1Z]. Army-technology lists "six AIM-9" as a maximum load [src].
  - AGM-114 Hellfire: up to 16 [src: Wikipedia AH-1Z; army-technology].
  - AGM-179 JAGM: up to 8 [src: Wikipedia AH-1Z].
  - TOW: carried on earlier Cobras [src: army-technology].

### 5b. AH-1G

- **Turret:** M28 turret under the nose with two 7.62 mm miniguns or two M129 40 mm grenade launchers [src: Wikipedia AH-1 Cobra].
- **Rockets:** 2.75 in (70 mm) rockets in M158 (7-rocket) or M200 (19-rocket) pods [src: Wikipedia AH-1 Cobra].
- **Other:** M18 minigun pod, or XM35 with XM195 20 mm cannon [src: Wikipedia AH-1 Cobra].

### 5c. Kid-friendly four-step weapons and stores mod ladder

1. **Start:** the three-barrel gun in the nose, no missiles.
2. **Rockets:** add 7 rocket tubes on each side (est. 7-round pods [src: AH-1G M158 pod data]). Count the pods.
3. **Wingtip Sidewinders:** add two Sidewinder missiles, one on each wingtip [src: Wikipedia AH-1Z].
4. **Full load:** Hellfire missiles on the stub-wing pylons, up to 16 total [src: Wikipedia AH-1Z]. Count every missile.

Avoid "kill" or "destroy" language. Use "helps soldiers" or "helps the team" for missions.

---

## 6. Engines

- **AH-1Z:** two General Electric T700-GE-401C turboshaft engines [src: Wikipedia AH-1Z]. Power: 1,800 shp each [src: Wikipedia AH-1Z]. Army-technology gives 3,380 hp in its table and 3,600 shp combined in its text [src]; these conflict. Use 1,800 shp each as the sourced per-engine value.
- **AH-1G:** one Lycoming T53-L-13 turboshaft [src: Wikipedia AH-1 Cobra]. Power: 1,100 hp [src: Wikipedia specs]. Wikipedia variants section says 1,400 shp [src]; conflict, use 1,100 hp as the spec-table value.
- **Exhaust positions:** not in sources. (est.) AH-1Z exhausts out the rear top of the fuselage, one per engine. AH-1G exhaust out the rear top, one.
- **Top speed:** AH-1Z never-exceed 222 kn (255 mph, 411 km/h); cruise 160 kn (180 mph, 300 km/h) [src: Wikipedia AH-1Z]. AH-1G max speed 149 kn (171 mph, 276 km/h); never-exceed 190 kn (220 mph, 350 km/h) [src: Wikipedia AH-1 Cobra].
- **Range:** AH-1Z 370 nmi (430 mi, 690 km); combat range 125 nmi with 2,500 lb payload [src: Wikipedia AH-1Z]. AH-1G 310 nmi (360 mi, 570 km) [src: Wikipedia AH-1 Cobra].
- **Lifting fact:** The AH-1Z's rotor disc is about 19% larger in area than the AH-1G's, so it lifts a heavier load (derived from 168.0 m² and 141 m²). AH-1Z maximum payload 5,764 lb (2,615 kg) on hardpoints [src].

---

## 7. Other cool mods (specific to this helicopter)

- **Chin-turret glow:** the three-barrel gun turret with a soft glow when it "spins up" (game-only, est.).
- **Wingtip Sidewinder rails:** lit, or with a "ready" light when armed (game-only, est.).
- **Rotor-tip lights:** navigation lights on the blade tips, red and green (est. for the Viper, not verified).
- **Tandem cockpit canopy lift:** the canopy opens up, showing both seats (game-only).
- **Searchlight:** not a known Viper feature. Do not model as real.
- **Rocket-pod count display:** a number on each pod to show how many rockets are loaded (game-only).
- **Shark-mouth reveal:** a nose-art swap that adds the teeth (game-only, based on the real schemes above).

---

## 8. Sound

- **Blade slap:** a steady "whup-whup-whup" with four blades. Four blades per rotor give a faster, more even beat than the AH-1G's two-blade rotor (est.).
- **Turbine whine:** a high-pitched whine from two T700 engines, rising with throttle. AH-1G: a single, deeper turbine hum (est.).
- **Gun:** a fast, rattling "brrrrrp" from the three-barrel cannon, slower than a minigun (est.).
- **Rockets:** a short "whoosh-thump" when fired (est.).
- **Idle:** a steady, low hum with a high whine on top (est.).

All sound descriptions are (est.), not from a source. Verify with a recording before finalising.

---

## 9. Fraction-friendly facts

- **Blades per rotor:** AH-1Z main rotor has 4 blades, so each blade is one quarter of the rotor (derived). AH-1Z tail rotor also has 4 blades, so each tail-rotor blade is one quarter.
- **AH-1G main rotor has 2 blades,** so each blade is one half of the rotor (derived).
- **Rotors:** 2 (one main, one tail) on each variant.
- **Engines:** 2 on the AH-1Z, so each engine is one half of the power plant (derived). 1 on the AH-1G, so the single engine is the whole power plant.
- **Crew seats:** 2, so each crew member is one half of the crew (derived).
- **Hardpoints:** 6 on the AH-1Z stub wings, so 3 per side (derived). Two Sidewinders at the wingtips are 2 out of 6, which is one third of the hardpoints (derived).
- **Chin gun:** 1 turret with 3 barrels (sourced: M197 three-barrel cannon).
- **Rocket tubes:** on the AH-1G, the 7-rocket pod is 7 rockets, and 19-rocket pod is 19 (sourced).

---

## 10. Reference sources

### URLs used (fetched or searched)

- https://en.wikipedia.org/wiki/Bell_AH-1Z_Viper (fetched; specs, history, nickname "Zulu Cobra")
- https://en.wikipedia.org/wiki/Bell_AH-1_Cobra (fetched; AH-1G specs, Vietnam service, AH-1 lineage)
- https://en.wikipedia.org/wiki/Bell_AH-1_SuperCobra (fetched; AH-1W specs, USMC retirement October 2020, HMLA squadrons)
- https://en.wikipedia.org/wiki/HMLA-169 (fetched; squadron history, tail code SN, mascot Bak-Bak, AH-1Z use)
- https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2160217/ah-1z-viper-and-uh-1y-venom-helicopters (search snippet only; fetch returned HTTP 403; four-blade rotor and dimensions)
- https://www.army-technology.com/projects/supcobra/ (fetched; Viper dimensions, four-blade rotor, 210 kt, stub span 3.28 m)
- https://www.helis.com/database/model/AH-1Z-Viper/ (search snippet; disc area 168 m²)
- https://www.helis.com/database/model/AH-1G-Cobra/ (search snippet; no detail fetched)
- https://www.army.mil/article/198493 (search snippet; Vietnam Cobra, 1,100 delivered, world's first purpose-built attack helicopter)
- https://digitalcollections.museumofflight.org/items/show/33335 (search snippet; 174th Sharks, Flying Tigers link)
- https://www.centaursinvietnam.org/WarStories/WarEssays/EAudShark'sTeethTale.html (search snippet; D Troop 3/4 Cav shark's teeth)
- https://www.awm.gov.au/collection/C2083708 (search snippet; "Piece Maker" shark teeth, Nui Dat 1970)
- https://www.keymodelworld.com/article/art-scale-kit-132-bell-ah-1g-cobra-decals-icm-kit (search snippet; F Troop 3rd Aviation Cavalry, hobby source)
- https://www.twz.com/43232/this-marine-ah-1z-viper-looks-amazing-in-a-throwback-sea-cobra-paint-scheme (fetched; HMLA-269 No. 71 sea snake scheme, 22 November 2021)
- https://aeroscale.kitmaker.net/review/11069/index.htm (search snippet; FS 36375 gray, hobby source)
- https://www.scalemates.com/kits/academy-12127-ah-1z--1121831 (search snippet; Academy 1:35 kit with HMLA-169/369/469 shark mouths, FS 35237, hobby source)
- https://www.globalsecurity.org/military/systems/aircraft/ah-1-specs.htm (search snippet; AH-1G prototype stub wing 3.343 m)
- https://vietnam.warbirdsresourcegroup.org/ah1cobra-specs.html (search snippet; AH-1G rotor and tail-rotor data)
- https://thedefensepost.com/2026/06/26/ah-1z-viper-guide/ (search snippet; not fetched)

### Three-view drawings

None found in this pass. Recommend searching for a Viper three-view on a NAVAIR or Wikimedia Commons page, then reading stub span, fuselage stations, and rotor hub height from it.

### Known gaps

- **AH-1Z stub-wing span:** not found. Only 3.28 m, which is listed for the AH-1W. Estimate 3.8 m to 4.0 m (est.).
- **AH-1Z main rotor blade chord:** not found. Est. 0.5 m to 0.6 m.
- **AH-1Z tail rotor diameter, position, height:** not found. Est. 2.6 m to 3.0 m, to match the AH-1G.
- **AH-1Z fuselage length (nose to tail, without rotors):** not found. 17.75 m is the overall length with rotors.
- **AH-1Z cross-section stations:** not found. The values in section 2d are (est.).
- **AH-1Z top view and side view outlines:** not found.
- **AH-1Z rotor rotation direction, hub height, hub x-position:** not found in sources. Estimates only.
- **AH-1Z exhaust positions, engine positions:** not found.
- **AH-1Z maximum takeoff weight:** conflict, 14,750 lb (table) versus 18,500 lb (text).
- **AH-1Z engine power:** conflict, 1,800 shp (Wikipedia) versus 3,380 hp table value (army-technology).
- **AH-1G tail-rotor diameter:** conflict, 2.59 m (prototype) versus 2.97 m (family figure).
- **AH-1G engine power:** conflict, 1,100 hp (spec table) versus 1,400 shp (variant text).
- **AH-1Z USMC gray FS number:** FS 36375 and FS 35237 come from model-kit reviews only. FS 36231 (the number I first thought of) was not confirmed in any source.
- **Shark-mouth origin date for the 174th Sharks:** the Museum of Flight caption says early 1966, before the Cobra's 1967 delivery. Unresolved.
- **Crew seating order (CPG front, pilot rear):** not verified in a fetched source.
- **Sound descriptions:** all (est.). No recording or sound source checked.
- **Landing-gear dimensions:** not found.
