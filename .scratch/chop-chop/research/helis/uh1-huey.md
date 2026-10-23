# Bell UH-1 Iroquois "Huey": research notes for a procedural 3D hangar model

Conventions: [src] = from a fetched or searched source (cited in section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, read off general knowledge or photos, not confirmed. Where sources disagree, both values are given. Imperial figures are converted to metric. Model variant: **UH-1H** (Vietnam-era Army workhorse). The **UH-1Y Venom** is noted as the four-blade later update.

Source quality note: the UH-1H numbers below come mostly from museum, aviation-reference and fan sites, not an official Bell or Army spec sheet. Treat them as close, not exact.

---

## 1. Identity

- **Full name:** Bell UH-1 Iroquois. Pre-1962 designation HU-1 (Bell Model 204 / 205 family). [src: Wikipedia, via fetch]
- **Nicknames:** "Huey" (from the original HU-1 designation; the name stuck after the 1962 change to UH-1). Bell cast the nickname onto the anti-torque pedals. [src: Wikipedia, via fetch]. "Slick" (unarmed transport), "Gunship" (armed, "Cobra" was the AH-1 successor, not a Huey). The Iroquois name comes from the Native American nations. [src: Wikipedia]
- **Maker:** Bell Helicopter (Bell Aircraft / Bell Helicopter Company, Fort Worth/Hurst, Texas). [src: Wikipedia]
- **First flight:** XH-40 prototype (Bell Model 204) on 20 October 1956. [src: Wikipedia, via fetch]
- **Model 205:** first flight 1961 (Bell 205 / UH-1D longer-cabin family). [src: Museum of Flight page, via fetch]
- **In service:** Introduced 1959 (infobox). HU-1A first went to the 101st and 82nd Airborne Divisions and the 57th Medical Detachment. Hueys reached South Vietnam in March 1962. [src: Wikipedia, via fetch]
- **Production:** Production of the UH-1H ran 1967 to 1986 (variant production span). [src: fas.org, via fetch] Overall Huey production exceeded 9,000 aircraft. [src: fas.org, via fetch] (The exact UH-1H-only count is a gap; see section 10.)
- **Role:** Utility transport, medevac, and gunship. Two-blade rotor, turbine engine.
- **Crew:** 2 pilots (pilot and co-pilot). Passenger/troop load: up to 13 troops in the UH-1D (the UH-1H is "identical to the UH-1D" apart from its engine). [src: fas.org, via fetch]. Door gunners fly in the cabin doorways, usually 1 per side.
- **Medevac version:** UH-1V carried 6 stretchers and 1 medical attendant. The UH-1N medevac role supported up to 6 litter patients and 1 attendant. [src: fas.org, via fetch]

### Kid-friendly voice lines (8, each under 12 words)

1. "The Huey is called the Iroquois, and friends call it Huey!" (11 words). Source: Wikipedia [src] (names: Iroquois, Huey).
2. "It can fly carrying soldiers, and it has sliding doors!" (9 words). Source: AOPA Pilot 2014 [src] (large sliding cabin doors); fas.org [src] (troop carrying).
3. "Its first flight was in 1956, a very long time ago!" (10 words). Source: Wikipedia [src] (first flight 20 October 1956). Note: "a very long time ago" is a spoken framing (derived from the date), not a fact from the source.
4. "Its big rotor is as wide as a small house!" (9 words). Source: Wikipedia / aeropedia [src] (rotor 14.6 m, about 48 ft). "Small house" is a spoken comparison (est.).
5. "Hueys flew in the war, carrying helpers to save people!" (10 words). Source: fas.org [src] (medevac version carried stretcher patients). Keep the wording gentle; no fighting words.
6. "Its two spinning blades make a big whop-whop sound!" (9 words). Source: sound is general knowledge, not sourced in this research (est.). Use with care; see section 8.
7. "A Huey has two pilots, one captain and one co-pilot!" (10 words). Source: fas.org [src] (crew of two). "Captain" is spoken framing (est.).
8. "Its name starts with HU, which is where Huey came from!" (11 words). Source: Wikipedia [src] (Huey nickname from HU-1 designation).

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions (UH-1H, with conflicts shown)

| Item | Value (metric) | Imperial as printed | Source / note |
|---|---|---|---|
| Overall length (nose to tail, rotor not turning) | **17.4 m** (57 ft 1.5 in) | 57 ft 1.5 in | aeropedia [src] |
| Fuselage length (nose to tail boom end, excluding rotor) | **12.65 m** (41 ft 6 in) | 41 ft 6 in | aeropedia [src] |
| Overall length, Wikipedia (UH-1 page for UH-1Y comparison) | 17.78 m (58 ft 4 in) | 58 ft 4 in | Wikipedia UH-1Y [src] (different variant) |
| Height (to top of rotor head, incl. tail rotor) | **4.39 m** (14 ft 4.5 in) | 14 ft 4.5 in | aeropedia [src]. Also "4.4 m including tail rotor" [src] |
| Height, Museum of Flight | ~4.27 m (14 ft) | 14 ft | Museum of Flight [src] |
| Main rotor diameter | **14.63 m** (48 ft) | 48 ft | aeropedia [src]; Museum of Flight [src] |
| Main rotor radius | **7.32 m** (derived) | 24 ft | (derived) |
| Width over skids | **2.908 m** (9 ft 6.5 in) | 9 ft 6.5 in | Wikipedia UH-1 article, width line [src]. Variant not specified; use as UH-1H estimate |
| Stub wing span | **none** (UH-1H has no stub wings) | | (est.) general knowledge; the research did not find any source saying otherwise |

**In-game scale:** the rotor disc is about 14.6 m across, and the fuselage is about 12.7 m long (derived). The rotor is roughly the same width as the fuselage length. The skids are about 2.9 m apart. The tail boom is long and thin.

### 2b. Main rotor

- **Count:** 1 (single main rotor on top).
- **Diameter:** 14.63 m. Radius 7.32 m. [src]
- **Blades:** **2 main blades**, semi-rigid, with a stabiliser bar. [src: Wikipedia, "two-bladed semi-rigid design that shares features with the Bell 47, including a damped stabilizer bar"]. The UH-1Y (section 5) has four blades. [src: Wikipedia UH-1Y]
- **Blade chord:** not sourced. (est.) about 0.5 m at the root tapering to about 0.4 m at the tip for a UH-1 blade. Mark as est.
- **Turns:** Counterclockwise seen from above, the usual US helicopter convention. (est.) Not confirmed by any fetched source. The research did not verify the turn direction.
- **Hub height above ground:** top of rotor head is about 4.39 m (aeropedia total height, derived). Hub centre is about 3.9 m above ground (est.).
- **Hub position along fuselage (x from nose):** about 2.6 m (est.), slightly aft of the cockpit and above the cabin roof. The mast sits over the cabin, not over the tail boom.

### 2c. Anti-torque: tail rotor

- **Type:** tail rotor (not fenestron, not NOTAR). [src: Wikipedia UH-1 family]
- **Side:** The sources disagree about the side, and forum sources describe a 1954 switch from the left side to the right side of the fin. The sources do not clearly say which side the UH-1H has. (est.) right side of the fin, pushing against the boom; mark as **unverified**.
- **Diameter:** not sourced. (est.) about 2.4 m (about 8 ft).
- **Blades:** not sourced. (est.) 2 blades, no twist (a forum post said the blades had no twist). Mark as est.
- **Height:** about 2.6 m above ground (est.), at the end of the boom.
- **x from nose:** about 12 m (est.), at the end of the tail boom.

### 2d. Fuselage stations (est. from general UH-1 proportions and the 2.9 m skid width; no three-view was fetched)

| Station | x from nose (m) | Width (m) | Height (m) | Centre z above ground (m) |
|---|---|---|---|---|
| 1 nose / windscreen | 0.0 | 0.4 | 0.6 | 1.6 |
| 2 cockpit front | 0.8 | 1.6 | 1.6 | 1.9 |
| 3 cockpit rear | 2.0 | 1.7 | 1.9 | 2.1 |
| 4 cabin front | 3.5 | 1.8 | 2.1 | 2.2 |
| 5 cabin door (main) | 5.0 | 1.8 | 2.2 | 2.2 |
| 6 cabin rear | 7.5 | 1.7 | 2.0 | 2.2 |
| 7 boom junction | 9.0 | 0.9 | 0.9 | 2.4 |
| 8 tail boom end | 12.6 | 0.4 | 0.4 | 2.6 |

- **Tail boom:** about 9 m long from the boom junction to the tail (est.), tapering to about 0.4 m in diameter at the end (est.).
- **Engine housing:** single turboshaft engine, mounted on top of the cabin behind the cockpit and above the cabin roof. (est.) Engine count 1.
- **Engine exhaust:** exits the top of the rear fuselage, angled upward toward the tail (est.).
- **Cockpit canopy:** bubble-like windscreen with a large curved front, plus side windows and sliding doors on each side (est.).
- **Doors:** large sliding cabin doors on each side of the cabin (AOPA Pilot 2014 [src]).

### 2e. Top-view and side-view outlines (est. from general knowledge, not from a fetched three-view)

- **Side view (x, y in metres, nose at x=0, ground at y=0):** (0, 1.6), (0.8, 2.3), (2.0, 2.6), (3.5, 2.8), (5.0, 2.8), (7.5, 2.6), (9.0, 2.4), (12.6, 2.6), (12.6, 2.7), (9.0, 2.9), (7.5, 3.1), (3.5, 3.2), (0, 2.2)
- **Top view, half outline (x, y; y positive = right side):** (0, 0), (0.8, 0.8), (2.0, 0.9), (5.0, 0.9), (7.5, 0.85), (9.0, 0.45), (12.6, 0.2)

These are est. only, meant as starting points for the lofted cross-sections.

### 2f. Tail surfaces

- **Vertical fin:** on the tail boom, with the tail rotor mounted on it. (est.) height about 1.5 m, chord 1.0 m.
- **Horizontal stabiliser:** none on the UH-1H. The UH-1Y does not have one either (est.).
- **Endplates:** none.

### 2g. Stub wings

- **Wings:** none on the UH-1H. The UH-1 "Gunship" variants use weapons pods on pylons on the sides of the cabin instead. Pylon / hardpoint positions are section 5.

### 2h. Landing gear

- **Type:** **skids** (two long skid tubes). [src: Wikipedia]
- **Skid track (width between skids):** about 2.9 m. [src: width over skids, 2.908 m, Wikipedia]
- **Skid length:** not sourced. (est.) about 4.0 m long.
- **Skid height above ground:** not sourced. (est.) about 0.4 m at the skid tubes.
- **Retractable:** no. Fixed skids.
- **Wheels:** none (optional wheels or float kits not sourced).

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two-blade main rotor with the stabiliser bar.** The long, thin, teetering blades and the bar on top of the rotor head. [src: Wikipedia]
2. **Bubble-like front, big sliding side doors, and open cabin.** [src: AOPA, Wikipedia]
3. **Long, thin tail boom with a tail rotor at the end.** (est.)
4. **Skids, not wheels.** The two skid tubes are the signature stance on the ground. [src]
5. **Olive drab paint** (Army Vietnam scheme). [src: forum, see section 4]
6. **Red cross markings on medevac Hueys** (red cross on the doors and nose). [src: Patriots Point, veteran accounts]
7. **Door gunners leaning out the open doors.** [src: Wikipedia]
8. **Single engine on top of the cabin, behind the cockpit.** (est.)

---

## 4. Paint & liveries

Hex values are est. unless noted. Olive drab is the Vietnam-era Army colour; forum sources give it as FS 34087 (one post says FS 14087, probably a typo). FS 34087 is flat olive drab, not gloss.

1. **Army Vietnam "slick" (158th Assault Helicopter Battalion, 1970-72).** Flat olive drab body, black tail numbers and small markings, grey-black skids (est.). Based on the Museum of Flight's restoration (UH-1H, serial 69-15140), which the museum says was returned to its 158th AHB appearance. Hex: olive drab **#4B5320** (est.), black **#1A1A1A** (est.), skids **#3A3A3A** (est.). [src: Museum of Flight]
2. **Medevac "Dust-Off" (Vietnam).** Olive drab body with a **red cross on a white square panel** on each cargo door and the nose. The Patriots Point artifact describes a red-and-white International Red Cross flag on both bay doors. Hex: olive drab **#4B5320** (est.), red cross **#C8102E** (est.), white panel **#F2F2F2** (est.). [src: Patriots Point, veteran accounts via search]. **Conflict:** a Georgia Southern paper says medevac Hueys were painted white, not green. This is not resolved. Use olive drab for the in-game default (it matches the Patriots Point artifact).
3. **Early Vietnam gloss OD (high-visibility).** Some early aircraft were gloss olive drab, which was later replaced by flat OD. Hex: gloss olive drab **#5A6330** (est.), with a slight sheen. [forum, low confidence]
4. **Alaska National Guard (Search and Rescue / utility, to 1994).** The museum's UH-1H served with the Alaska National Guard until 1994 and then with King County Sheriff's Office Search & Rescue until 2003. Paint not described. [src: Museum of Flight] **Gap:** colours unknown; do not use in-game without a photo.
5. **Modern-era (UH-1Y Venom, USMC).** Grey or tan (est.); not researched. Keep as a gap (see section 10).

### Suggested mod ladder (paint)

- **Free default:** Army olive drab with black tail numbers (scheme 1).
- **Upgrade 1 - Dust-Off:** medevac red cross on the doors and nose (scheme 2).
- **Upgrade 2 - Gloss High-Vis:** early gloss olive drab with bright number stripes (scheme 3).
- **Upgrade 3 - Search and Rescue:** the Alaska Guard look, with bright markings (scheme 4). Colour to be confirmed.
- **Legendary - Golden Huey:** gold-tinted rotor hub and skids (fantasy, not a real scheme).

---

## 5. Armament & stores

- **Door guns:** M60 (7.62 mm) pintle mounts on each side of the cabin, operated by the door gunners. [src: Wikipedia (door gunner), search snippet]. Earlier M1919A4 .30-cal guns were used before the M60. [src]
- **Gunship option:** the M134 minigun (7.62 mm) on a pintle mount was used on the Gunship variant (UH-1C/UH-1H gunship roles). [src: fas.org, via fetch] (the Nighthawk variant; M134 mounting is in that source).
- **Rocket pods:** 2.75-inch (70 mm) rocket pods on pylons on the sides of the cabin (gunship roles). [src: Wikipedia UH-1 armament list, search snippet]
- **Hoist:** rescue hoist on the cabin door, used by search and rescue crews (est.). Not confirmed by a fetched source.
- **Cargo hook:** external cargo hook under the belly (est.), general UH-1 capability.
- **Hardpoints:** 2 pylons on the sides of the cabin for rocket pods or guns (gunship roles). (est.)

### Weapons and stores mod ladder (4 steps, kid-friendly)

1. **Basic:** no guns (Slick, a helper transport).
2. **Door gunner:** one friendly door gun on each side, with a soft gun sound.
3. **Rocket pods:** two rocket pods on the sides, shown as "fireworks" (no harm wording).
4. **Gunship:** minigun and rocket pods together, with a "helper" voice line.

---

## 6. Engines

- **Count:** 1.
- **Type:** Lycoming T53-L-13 (T53-L-13B) turboshaft. [src: aeropedia, fas.org]
- **Power:** **1,400 shp** (shaft horsepower). [src: fas.org, aeropedia]
- **Exhaust:** top of the rear fuselage above the boom, angled upward (est.).
- **Top speed:** **135 mph** (about 117 kn, 217 km/h) max; **125 mph** cruise. [src: Museum of Flight, via fetch]
- **Range:** **315 miles** (about 507 km). [src: Museum of Flight, via fetch]
- **Fact for kids:** The Huey's rotor is about as long as a school bus is long. (est. comparison). A better one: 1,400 horsepower is about the same as 1,400 "horses" pulling at once (derived).

---

## 7. Other cool mods

- **Sliding doors:** open and close on the side, with a gunner leaning out. [src: AOPA]
- **Searchlight:** a bright light under the nose, for night search and rescue (est.; not confirmed).
- **Rescue hoist:** a winch on the cabin door, which lowers a rescue basket (est.).
- **Litter kit:** stretchers inside the cabin for medevac (UH-1V / UH-1N carried 6 litters). [src: fas.org]
- **Cargo sling:** a belly hook with a sling load (est.).
- **Rotor-tip lights:** red and green tip lights on the blade tips (est.).
- **UH-1Y Venom update (for later):** four-blade rotor, two GE T700 engines, longer cabin. [src: Wikipedia UH-1Y, via fetch]

---

## 8. Sound

- **Main sound:** a deep, steady "whop-whop" from the two blades as they slap the air. (est.; the research did not find a source describing the sound, see section 10.)
- **Engine:** a high turbine whine from the Lycoming T53 turboshaft, rising as the engine spins up. (est.)
- **Door gunners:** a rattling M60 burst (for gun mods only, soft in a kid game).
- **Sound designer tip:** a low-pass filtered pulse train at about 5 to 6 Hz per blade pass for the rotor, with a higher whine layered on top. (est.; blade count is 2, so the blade-pass frequency is 2 times the rotor speed.)

---

## 9. Fraction-friendly facts

- **Main rotor blades:** 2, so each blade is one half of the rotor. (derived from 2 blades, [src])
- **Blades in the whole helicopter:** 2 main blades + about 2 tail blades (est.) = 4 blades total. (est.)
- **Rotors:** 2 rotors (1 main and 1 tail). 1 main rotor is one half of the pair. (derived)
- **Wheels:** 0 wheels; 2 skids. Each skid is one half of the landing gear. (derived)
- **Doors:** 2 sliding side doors, so each door is one half of the cabin. (derived)
- **Crew seats:** 2 pilot seats, so each pilot is one half of the crew. (derived)
- **Door guns:** 2 door guns, one on each side. (derived)
- **Engines:** 1 engine, so 1 whole. (derived)
- **Rotor blade count on UH-1Y:** 4, so a Venom has twice as many main blades as a Huey. (derived)

---

## 10. Reference sources

### URLs used
- [Wikipedia: Bell UH-1 Iroquois](https://en.wikipedia.org/wiki/Bell_UH-1_Iroquois) (fetched; Huey nickname, first flight, introduction, skid width, tail rotor history)
- [Wikipedia: Bell UH-1Y Venom](https://en.wikipedia.org/wiki/Bell_UH-1Y_Venom) (fetched; four-blade rotor, engines, first flight 20 December 2001, service entry 8 August 2008)
- [FAS Military DOD 101: UH-1](https://man.fas.org/dod-101/sys/ac/uh-1.htm) (fetched; crew, troops, engine, medevac roles, production)
- [Museum of Flight: Bell UH-1H Iroquois "Huey"](https://www.museumofflight.org/exhibits-and-events/aircraft/bell-uh-1h-iroquois-huey) (fetched; dimensions, weights, speeds, 158th AHB history, Alaska Guard service)
- [Aeropedia: Bell UH-1 Iroquois](https://aeropedia.com.au/content/bell-uh-1-iroquois/) (search snippet; rotor 14.63 m, length 17.4 m, height 4.39 m, engine)
- [Patriots Point: UH-1 Iroquois Huey](https://www.patriotspoint.org/artifacts-archives/uh-1-iroquois-huey) (search snippet; olive drab with Red Cross flag on bay doors)
- [Military Mark: Air-Ambulance / Dust-Off MEDIVAC RVN](https://themilitarymark.com/us-army-in-vietnam-war/blog-post-title-four-gb4nf-8mzxa-65t74) (search snippet; medevac markings)
- [Scrogginsaviation: UH-1H MedEvac one-sheet (2022)](https://scrogginsaviation.com/wp-content/uploads/2023/07/UH-1H-MedEvac-onesheet-SCROGGINS-2022.pdf) (search result, not fetched)
- [Georgia Southern: Dust-Off predictors of medevac losses](https://scholars.georgiasouthern.edu/en/publications/dust-off-predictors-of-american-medevac-losses-during-the-vietnam-3/) (search snippet; claims white medevac paint, which conflicts with other sources)
- [Forum: Huey Color (FineScale)](https://forum.finescale.com/t/huey-color/213749) (search snippet; FS 34087, flat OD, gloss OD, low confidence)
- [AOPA Pilot, March 2014](https://www.nxtbook.com/nxtbooks/aopa/pilot_201403/index.php?startid=45) (search snippet; sliding doors)
- [Wikipedia: Door gunner](https://en.wikipedia.org/wiki/Door_gunner) (search snippet; M60 and M1919 door guns)
- [Warbird Information Exchange: tail rotor thread](https://warbirdinformationexchange.org/phpBB3/viewtopic.php?p=634478) (search snippet; tail rotor side change)
- [Aeropedia: Bell 204 and 205 civil](https://aeropedia.com.au/content/bell-204-and-205-civil-aircraft/) (search result, not fetched)
- [Technical Specifications, heritageflight.org](https://heritageflight.org/?p=1348) (search result, not fetched)
- [Helicopter Specifications: UH-1H, fairlifts.com](https://www.fairlifts.com/helicopters/specifications/helicopter-specifications-uh-1h/) (search result, not fetched)

### Three-view drawings found
- **None fetched.** No three-view or blueprint for the UH-1H was retrieved. All stations and outlines in section 2d and 2e are est. Good places to look: Wikipedia Commons "Bell UH-1 Iroquois three-view", and Army TM 55-1520-210-10 (UH-1H technical manual).

### Known gaps
- **Blade chord and taper:** not sourced. Estimate only.
- **Tail rotor:** side, diameter, blade count, and height are not confirmed. Sources conflict on the side (left vs right).
- **Main rotor turn direction:** not confirmed. Counterclockwise from above is est.
- **Blade slap / whop sound:** no source found in this research. Sound section is est.
- **Medevac paint colour:** sources conflict (olive drab with red cross vs white).
- **Gross weight for UH-1H:** the Museum of Flight gives 9,040 lb (4,100 kg). The fas.org page gives a UH-1D max takeoff of 10,500 lb. These are different aircraft or configs. Not resolved; use 4,100 kg as the museum figure.
- **Max gross and empty for UH-1H (metric):** museum gives empty 5,215 lb (2,366 kg). Not cross-checked.
- **UH-1H production count:** not found; only the total Huey production (over 9,000) is sourced.
- **Skid length and height:** not sourced.
- **Hub height:** derived from total height only; the hub centre is est.
- **Door gunner mounts on the UH-1H:** the fas.org page describes UH-1D mounts; UH-1H likely the same (est.).
- **Alaska Guard paint scheme:** not described.
- **UH-1Y Venom paint and stub hardpoints:** not researched in depth. The Wikipedia page says 2 external stations for rockets and pintle mounts, and does not mention wing stubs.
