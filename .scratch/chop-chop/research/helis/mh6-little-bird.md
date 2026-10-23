# Boeing MH-6 / AH-6 Little Bird: research notes for a procedural 3D hangar model

Conventions: [src] = from a fetched or searched source (see section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, read off nothing I could verify. Where sources disagree, both values are given. Imperial figures are converted to metric. Hex colours are (est.).

**Source quality warning.** The Wikipedia "MH-6 Little Bird" article is internally inconsistent (its wingspan line is the rotor diameter, and its lead mixes OH-6 and MD 530 data). Where it conflicts with the MD 530F-based spec sheets and the PBS page, I have preferred the spec-sheet figures and said so. Boeing's AH-6 product page gives no dimensions, weights, or crew. The USASOC 160th fact sheet (the best official source for seating) would not load.

---

## 1. Identity

- **Full name:** Boeing MH-6 Little Bird and AH-6 Little Bird. Army designations are AH-6 (attack) and MH-6 (mission/transport). Current variants are listed as AH/MH-6M ("Mission Enhanced Little Bird", MELB) and AH/MH-6J. [src Wikipedia MH-6, Wikipedia AH-6]
- **Nicknames:** "Little Bird" is the operational name. "Killer Egg" is an informal nickname for the family, and the search snippets say "Killer Eggs" when armed. **Do not use in voice lines (per brief).** The "Flying Egg" nickname also appears for the original Hughes 369 [src search snippet]. Unit nickname: the Night Stalkers (160th Special Operations Aviation Regiment, Airborne).
- **Maker:** Hughes Helicopters (Model 369 design), then McDonnell Douglas Helicopter Systems, then MD Helicopters, now Boeing (Boeing Rotorcraft Systems / Boeing Defense). [src Wikipedia MH-6; FAS DoD-101 page]
- **Origin:** Built on the MD 500 / MD 530 family, descended from the Hughes OH-6 Cayuse. [src Wikipedia MH-6; FAS DoD-101 OH-6 page]
- **First flight:** Hughes Model 369 prototype (later YOH-6A) on 27 February 1963 [src Wikipedia MH-6]. The MELB demonstrator flew 20 September 2006 [src Wikipedia A/MH-6X]. Note: a search snippet also says the YOH-6A set 22 world records on 26 March 1966 [src AFTC page, search only]. The Hughes Model 369 won the Army light observation helicopter (LOH) competition [src search snippet].
- **In service:** The "Little Bird" entered special operations use around 1980 (Task Force 160 formed for Operation Credible Sport, the 1980 hostage-rescue planning) [src Wikipedia MH-6 infobox; search snippet]. Current users: US Army Special Operations Aviation (160th SOAR, Fort Campbell); Royal Jordanian Air Force; Saudi Arabian National Guard; Royal Thai Army; Republic of Korea Army [src Wikipedia A/MH-6X, Wikipedia MH-6].
- **Role:** Light attack and reconnaissance (AH) and special operations transport and insertion (MH). Boeing's page lists light attack, anti-armour, reconnaissance, security escort, troop insertion and extraction, and combat search and rescue for the AH-6 [src Boeing product page].
- **Crew:** 2 pilots (one pilot in the front; the MH-6 is the same). Wikipedia lists "Crew: 2" [src Wikipedia MH-6]. The A/MH-6X article says "1-2" [src Wikipedia A/MH-6X]. The MH-6 transports troops on outboard benches, so a crew chief is not needed on the bench.

### Kid-friendly voice lines (8, each under 12 words)

1. "This helicopter can carry six soldiers, three on each side!" (11 words). Source: Wikipedia MH-6, outboard benches up to three operators per side; "up to six passengers".
2. "Its big spinning rotor has five long blades!" (8 words). Source: MD Helicopters MD 530F product spec (2023) and airforce-technology profile, main rotor is five blades. The Wikipedia MH-6 says newer MH-6M has six blades. **Use the five-blade line only if a six-blade variant is not the default.**
3. "It can zoom at about 280 kilometres every hour!" (8 words). Source: Wikipedia MH-6, maximum speed 152 knots (282 km/h).
4. "Its skinny legs are called skids, not wheels!" (7 words). Source: PBS FRONTLINE (skid track), Wikipedia MH-6 (skids). True: the fuselage sits on skids.
5. "Its one engine makes 425 horsepower!" (6 words). Source: Wikipedia MH-6, Allison 250-C30 derated to 425 shp for takeoff.
6. "Its side wings can hold rockets and machine guns!" (9 words). Source: Wikipedia MH-6 (AH-6 armament: LAU-68 rocket pods, .50 or 7.62 guns on pylons).
7. "The Night Stalkers fly these helicopters in the dark!" (9 words). Source: Wikipedia MH-6 ("missions are usually at night"). Note: "Night Stalkers" is the unit nickname, not the helicopter's.
8. "Only two pilots are needed to fly this helicopter!" (9 words). Source: Wikipedia MH-6 "Crew: 2". Frame as "two pilots fly it", not "only".

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | Source / note |
|---|---|---|
| Overall length, rotors turning | **9.8-9.9 m** (9.94 m on Wikipedia MH-6 and MELB; 9.8 m on MD 530 spec) | [src] Wikipedia MH-6 gives 32 ft 7.2 in. FAS spec: 9.8 m (530). PBS gives 28 ft 6 in (8.69 m) for a 520N-based page; treat as the older 500-series figure, not the MH-6. |
| Fuselage length (nose to tail-boom root, no rotors) | **7.3-7.5 m** | [src] Wikipedia MH-6: 24 ft 7.2 in (7.50 m). FAS MD 530: 7.3 m. PBS: 25 ft (7.6 m). |
| Main rotor diameter | **8.33-8.38 m** (radius about 4.17 m) | [src] Wikipedia MH-6 8.352 m; MD 530F spec 8.38 m (airforce-technology), 8.3 m (FAS); 8.1 m on a game wiki (rejected). |
| Overall width (fuselage) | **1.40 m** | [src] Wikipedia MH-6 "Width: 4 ft 7.2 in (1.402 m)". This is the fuselage width at the widest point, not the bench width. |
| Height to top of rotor head / motor head (skids on) | **3.02 m** | [src] PBS: 9 ft 10.75 in. Wikipedia MH-6 gives 2.67 m (8 ft 9 in). Use 3.0 m. |
| Height to top of mast-mounted sight (530) | **3.4 m** | [src] FAS MD 530 spec. Only for the mast-sight version. |
| Skid track (lateral, centre to centre) | **1.98 m** (6 ft 6 in) | [src] PBS. |
| Stabiliser span (horizontal tail) | **2.07 m** (6 ft 9.5 in) | [src] PBS. Wikipedia's "wingspan 8.33 m" is the rotor diameter, mislabelled. |
| Stub-wing / outrigger span (AH-6 side pylons) | **not published** | [gap] No source gives the pylon span. See gaps. |
| Wing area | **not reliable** | Wikipedia A/MH-6X gives 54.6 m² (587.5 sq ft). That value is the rotor disc area, not a wing (derived from 8.33 m: pi x 4.17² = 54.6 m²). Treat as the rotor disc. |

Use for in-game scale: **the body is about 7.4 m long, the rotor is about 8.35 m across, the skids are about 2.0 m apart, and the whole thing stands about 3 m tall.**

### 2b. Main rotor

- **Count:** 1 main rotor (single, on the mast). [src Wikipedia MH-6]
- **Diameter:** 8.33-8.38 m. Radius about 4.17 m (derived).
- **Blade count:** **5** on the MD 530F basis [src MD Helicopters MD 530F product spec 2023, search snippet; airforce-technology profile]. Wikipedia MH-6 says the newest MH-6M has **6** blades on a single main rotor, with a **4-blade tail rotor** [src Wikipedia MH-6]. The MD 564 (a six-blade 530F derivative) also has a 4-blade tail rotor [src search snippet]. **Conflict:** I could not confirm the MH-6M six-blade claim from a second source. Mark the default as 5 blades and the MH-6M as 6 (unverified).
- **Blade section:** NACA 0012 [src Wikipedia MH-6].
- **Blade chord:** not published. (est.) about 0.25 m at 4 m radius, tapering. Derived from the disc area of 54.6 m² is not possible without blade area.
- **Rotation (seen from above):** **counter-clockwise**, the normal for a single-rotor MD 500-family helicopter with a tail rotor. Not verified in a source. (est.)
- **Hub / mast height:** the top of the motor head is at 3.02 m (PBS). Hub height about 2.8 m above ground, est. from the same figure.
- **Hub x position:** the rotor mast sits over the cabin, est. about 2.5 m from the nose (est.). Not verified.
- **Folding:** the MD 530F rotor blades are foldable [src MD 530F, search snippet]. Blades fold for transport.

### 2c. Anti-torque (tail rotor)

- **Type:** conventional tail rotor on a tail boom. Not a fenestron or NOTAR. [src FAS: tail rotor 1.4 m]
- **Diameter:** 1.4 m (FAS MD 530 spec) or 1.55 m (airforce-technology). Use 1.4-1.55 m. [src]
- **Blades:** **2** per airforce-technology profile [src]. The Wikipedia MH-6M claim is **4 blades** (unverified, conflicts). Use 2 blades for the default, 4 for the MH-6M (unverified).
- **Side of the boom:** not verified. The MD 500 family is generally drawn with the tail rotor on the **port (left)** side of the boom when viewed from behind. Not confirmed here. (est.)
- **Tail rotor height and x:** not published. (est.) hub about 1.0 m above ground, x about 6.5 m from the nose at the boom end (est.).
- **Anti-torque type:** conventional tail rotor (no fenestron, NOTAR, or pusher).

### 2d. Fuselage

- **Engines:** 1 turboshaft. Allison 250-C30 (or T63-A-5A/700 on earlier OH-6 family) [src]. The turbine exhaust exits at the rear of the top cowling (est.).
- **Engine housings:** single engine, centred over the cabin, est. mounted behind the cabin and above the cargo bay. Not dimensioned.
- **Cockpit canopy:** bubble-type glass cockpit canopy with a forward-sloped windscreen (est.) and the sensor/FLIR turret on the nose or mast (est.). The MD 530 series has a fully glazed bubble cockpit; the Little Bird uses that standard shape. [src FAS: "glass cockpit"]
- **Fuselage cross-section table (est.):** not sourced. Use the length and width above:

| Station x from nose (m) | Width (m) | Height (m) | Centre z above ground (m) | Note |
|---|---|---|---|---|
| 0.0 | 0.20 | 0.50 | 1.00 | nose (est.) |
| 1.0 | 1.00 | 1.20 | 1.20 | canopy (est.) |
| 2.0 | 1.40 | 1.60 | 1.40 | widest, cabin (est.) |
| 3.0 | 1.40 | 1.60 | 1.45 | cabin/bench (est.) |
| 4.0 | 1.30 | 1.50 | 1.50 | cabin rear (est.) |
| 5.0 | 1.00 | 1.20 | 1.60 | engine deck (est.) |
| 6.0 | 0.60 | 0.90 | 1.80 | boom start (est.) |
| 7.4 | 0.30 | 0.40 | 2.00 | boom end (est.) |

- **Tail boom:** length about 4.5 m from the cabin rear (est.), diameter about 0.3-0.4 m (est.). Not sourced.

### 2e. Top and side outlines

Not sourced to coordinates. Use the fuselage table above and mirror it for the top view (est.). Side view: nose round, cabin deep, boom tapering to the tail, skids flat below.

### 2f. Tail surfaces

- **Horizontal stabiliser:** span 2.07 m (PBS) [src]. Chord and position not sourced. (est.) chord about 0.35 m, at x about 6.8 m, z about 1.9 m.
- **Vertical fin:** height above boom not sourced. Wikipedia's "height to top of tailfins" is 5.0 m (Wikipedia MH-6) but that is for the MD 500 family and conflicts with the 3.0 m height above. **Not reliable.**
- **T-tail:** the brief says T-tail. I could not confirm a T-tail on the MH-6 from a source. The stabiliser span above implies a horizontal stabiliser on the boom, but I have no three-view to check the T-arrangement. **Unverified.**

### 2g. Stub wings and side outriggers

- The MH-6 has **no fixed stub wing**. The AH-6 carries weapons on side outrigger "planks" (pylons) and the MH-6 carries troops on outboard benches. [src PBS: "people plank"; Wikipedia AH-6]
- **Span:** not published. (est.) pylons extend about 0.6 m out from each side of the cabin at about z 1.2 m.
- **Hardpoints per side:** 2 (est.). Wikipedia AH-6 lists 2 rocket pods and 2 guns, so 2 hardpoints per side are plausible (est.).
- **Wingtip stations:** the rocket pods and gun pods sit on the outside of the planks (est.).

### 2h. Landing gear

- **Skids:** tubular skids, not wheels. [src PBS; Wikipedia MH-6]
- **Track:** 1.98 m (6 ft 6 in) centre to centre [src PBS].
- **Skid height:** not sourced. (est.) 0.35 m clear of ground.
- **Skid length:** not sourced. (est.) about 3.0 m, running along the cabin underside.
- **Retractable?** No, fixed skids. [src: skid-mounted gear on the MD 500 family]

---

## 3. Distinctive features checklist (most recognisable first)

1. **Small bubble cockpit and round, egg-shaped body.** Always visible. (est.) the glazed bubble is the first recognisable element.
2. **Outside benches on the sides (MH-6).** Soldiers sit on benches out on each side, with feet on skids. [src PBS "people plank", Wikipedia MH-6]
3. **Side outrigger planks (AH-6)** with rocket pods and guns on the outside. [src Wikipedia AH-6, PBS]
4. **Big five-blade rotor, much wider than the body.** Rotor is about 8.35 m across; body is 7.4 m long. [src MD 530F, Wikipedia]
5. **Skids, no wheels.** [src PBS]
6. **Single engine, tail boom with a small tail rotor.** [src FAS]
7. **Dark or matte paint** on special-operations aircraft (est.). Not sourced.
8. **Lots of exterior sensors** on the nose (MH-6M/AH-6M) (est.). Not dimensioned.

---

## 4. Paint and liveries

Schemes below are **all hex values (est.)** from memory and typical SOF paint. I have not verified colour sources. Do not treat as exact.

1. **Army special operations, grey** (est.): base #5E6464 (est.), dark grey #3A3F3F (est.), black trim #1E1E1E (est.). Used on the 160th SOAR MH-6/AH-6 fleet. The common dark-grey low-visibility scheme (est.).
2. **Army special operations, green-brown** (est.): olive #5A5C3A (est.), dark brown #3E3323 (est.), tan #A38D5E (est.). Desert-style schemes used on the Night Stalkers' overseas deployments (est.).
3. **Boeing demonstrator, white** (est.): white #F4F4F2 (est.), blue #1F4E8C (est.), black tail #1E1E1E (est.). Boeing marketing and export show aircraft (est.).
4. **Royal Thai Army, green** (est.): base #4D6B3A (est.), white #F4F4F2 (est.). Export colours (est.).
5. **Royal Jordanian Air Force, desert** (est.): sand #C6B07A (est.), tan #A38D5E (est.), dark brown #3E3323 (est.). Export colours (est.).

**Suggested mod ladder** (paint):
- **Free default:** dark grey, with black skids and tan stripes (est.).
- **Upgrade 1, Desert:** tan base with brown stripes.
- **Upgrade 2, Green-brown:** olive and brown.
- **Upgrade 3, Demonstrator:** white and blue with a black tail.
- **Legendary, Night Stalker:** matte black with a glowing orange mission badge (est.) and extra glossy canopy trim.

---

## 5. Armament and stores

- **Guns (AH-6):** 2 x 7.62 mm M134 minigun pods, or 2 x .50 cal (12.7 mm) GAU-19 guns. Mounted on the outboard planks, one per side. [src Wikipedia MH-6 and AH-6]
- **Rockets (AH-6):** 2 x LAU-68D/A seven-tube pods, firing 2.75 in (70 mm) Hydra 70 rockets. One pod per side. [src Wikipedia MH-6; FAS]
- **Missiles (AH-6):** 2 or 4 x AGM-114 Hellfire anti-tank missiles, and 2 or 4 x FIM-92 Stinger air-to-air (ATAS). [src Wikipedia MH-6, FAS]
- **Door or side guns:** none, the MH-6 benches carry troops instead.
- **Hoists:** none. [gap] No source for a hoist.
- **Cargo hooks / sling load:** not on the basic MH-6. [gap]
- **Hardpoints:** 2 per side on the planks (est.). Hellfire rails on the outside of each plank (est.).

### 5b. Four-step kid-friendly weapons and stores mod ladder

1. **Step 1, Bench seats (MH-6 default):** up to 6 soldiers on outboard benches. The helicopter is a taxi, not a weapon.
2. **Step 2, Guns:** add 2 x minigun pods (7.62 mm), one per side. Tap to fire (game mechanic only).
3. **Step 3, Rockets:** add 2 x seven-tube rocket pods (70 mm). Show 14 rocket tubes in total (2 pods x 7 tubes, derived).
4. **Step 4, Missiles:** add 4 x Hellfire missiles on the planks. Show 4 total (derived). No kill language in voice lines.

---

## 6. Engines

- **Count:** 1 turboshaft. [src Wikipedia MH-6]
- **Type:** Allison 250-C30, or the T63-A-5A/700 on earlier OH-6 family aircraft. [src Wikipedia MH-6; FAS]
- **Power:** 425 shp (317 kW) takeoff, derated; 375 shp at maximum continuous. [src Wikipedia MH-6]
- **Exhaust:** the turbine exhaust is at the top rear of the engine deck, exits rearward and upward (est.).
- **Top speed:** 152 knots (175 mph, 282 km/h) never-exceed or max [src Wikipedia MH-6; PBS 152 kn].
- **Cruise:** 135 knots (155 mph, 250 km/h) [src Wikipedia MH-6].
- **Range:** 232 nmi (430 km) at 5,000 ft [src Wikipedia MH-6]. Boeing's AH-6 page gives a maximum range of 179 nmi (332 km) [src Boeing]. The 2025 USSOCOM Fact Book gives 250 nmi unrefuelled [src search snippet]. These differ by configuration.
- **Fact:** the MH-6 cannot refuel in the air, so it has limited range. [src search snippet]
- **Lifting:** service ceiling 18,700 ft (5,700 m) [src Wikipedia MH-6] or 20,000 ft (6,096 m) [src Boeing].

**Fraction-friendly speed fact:** top speed 152 knots, cruise 135 knots, so cruise is about 89% of top speed (derived: 135/152 = 0.888).

---

## 7. Other cool mods

- **Searchlight:** the Little Bird can carry a searchlight on the nose or side (est.). Not sourced.
- **FLIR / sensor turret:** the MH-6J/M carries an infrared sensor ball under the nose [src Wikipedia MH-6, "FLIR"] (est. for position).
- **Rotor-tip lights:** no source. (est.) a red tip light for a mod.
- **Winch:** none on the basic MH-6. [gap]
- **Sling load:** none on the basic MH-6. [gap]
- **IR suppressors:** not sourced. Night operations are the main use. (est.)
- **Glass cockpit:** the MELB has a glass cockpit [src Wikipedia A/MH-6X, Boeing "glass cockpit" on AH-6]. Good as a "computer screen" mod.
- **Night goggles mod:** night vision goggles fitted to crew (est.).

---

## 8. Sound

- **Engine:** a high, whining turbine whistle from the Allison 250-C30, rising as the engine spools up (est.).
- **Rotor:** a fast, low, thumping chop from the five-blade rotor, the "whop-whop" of a light helicopter at about 4-5 blades per second (est.; rotor speed not sourced). Use a short slap at the blade passing frequency: 5 blades x rotor rpm (est.).
- **Tail rotor:** a higher-pitched whine, separate from the main rotor (est.).
- **Feel:** light and fast. The fuselage is small, so the sound is brighter and less bassy than a Black Hawk (est.).
- **Synth recipe:** white noise through a bandpass around 2 kHz for the whine, plus a 5-pulse-per-rev thump at about 8 Hz for the blade slap (est.; rotor rpm not verified).

---

## 9. Fraction-friendly facts

- **Blades on the main rotor:** 5 (default) or 6 (MH-6M, unverified). So each main blade is **one fifth** of the rotor (derived). For the MH-6M, one sixth.
- **Tail rotor blades:** 2 (airforce-technology), so each tail blade is one half of the tail rotor (derived). MH-6M: 4 blades (unverified), one quarter each.
- **Rotors:** 2 total (1 main + 1 tail). So the tail rotor is one half of the rotor count (derived).
- **Engines:** 1, so one engine is the whole power plant.
- **Pilots (crew):** 2. So each pilot is one half of the crew (derived).
- **Passengers on outboard benches:** up to 6, so 3 per side. Each side bench holds half the passengers (derived).
- **Benches:** 2 (one per side). Each bench is one half of the troop seats (derived).
- **Outrigger planks:** 2 (one per side). Each plank is one half of the weapons (derived).
- **Skids:** 2. Each skid is one half of the landing gear (derived).
- **Rocket pods:** 2 x 7 tubes = 14 rocket tubes total (derived).
- **Minigun pods:** 2, so 2 guns total.
- **Hellfire missiles:** 4 (maximum), so one quarter per corner of the aircraft (derived).
- **Doors:** the basic MH-6 has side doors? Not sourced. (gap) Do not use this as a fraction fact.

---

## 10. Reference sources

Fetched or searched sources used:

- Wikipedia, "MH-6 Little Bird" (MD Helicopters, OH-6 family): https://en.wikipedia.org/wiki/MH-6_Little_Bird (fetched; the article is internally inconsistent and has a wingspan error; cross-checked)
- Wikipedia, "Boeing AH-6" (A/MH-6X and AH-6 variants): https://en.wikipedia.org/wiki/Boeing_AH-6 (fetched; the MELB article also has an unresolved Houthi shoot-down claim, not used)
- Boeing, AH-6 Little Bird product page: https://www.boeing.com/defense/military-rotorcraft/ah-6-little-bird (fetched; no dimensions, weights, crew, or rotor count)
- FAS DoD 101, OH-6 page (MD 500/530 spec figures): https://man.fas.org/dod-101/sys/ac/oh-6.htm (fetched; figures are for the MD 500 and MD 530, not the Little Bird directly)
- PBS FRONTLINE, "Ambush" weapons page (Little Bird A/MH-6, dimensions and skid track): https://www.pbs.org/wgbh/pages/frontline/shows/ambush/weapons/lbird.html (fetched)
- MD Helicopters, MD 530F product spec 2023: https://www.mdhelicopters.com/wp-content/uploads/2023/04/MD_530F_Product_Spec-2023.pdf (fetch failed, binary PDF; five-blade rotor from search snippet only)
- Airforce-technology, MD 530F profile (five-blade rotor, two-blade tail rotor, 8.38 m rotor, 1.55 m tail): https://www.airforce-technology.com/?p=4589 (search snippet only)
- Archived USASOC 160th SOAR "Little Bird" fact sheet (2016 archive): https://webarchive.library.unt.edu/web/20161019194520/http:/www.soc.mil/USASOCHQ/Public%20Affairs/Fact%20Sheets/160th_LittleBird.pdf (fetch failed: certificate rejected; not verified)
- Army Special Operations Aviation history (ARSOF history, Task Force 160 origins): https://arsof-history.org/articles/v2n2_tf160_page_1.html (search snippet only)
- TWZ and Yahoo News, Night Stalkers and MH-6 operations (2026 reporting): https://www.twz.com/air/night-stalker-mh-6-little-birds-ability-to-appear-out-of-nowhere-highlighted-in-tanker-raid.md (search snippet only; low authority)

**Three-view drawings:** none found in searches. Dimensions for stations and planks are (est.).

### Known gaps

- **Fuselage cross-sections:** no source for widths or heights at stations. Table in 2d is my estimate.
- **Blade chord and rotor rpm:** not published. Blade-slap frequency and blade chord are estimates.
- **Stub-wing / plank span and hardpoint positions:** not published for the AH-6.
- **Tail rotor side and tail rotor x-position:** not verified.
- **T-tail:** the brief says T-tail; not confirmed from any source I could fetch. The stabiliser span (2.07 m, PBS) is the only tail-surface figure.
- **Vertical fin height and tail boom length:** not sourced.
- **Skid height and skid length:** not sourced.
- **MH-6M six-blade rotor and four-blade tail rotor:** only from Wikipedia, not confirmed. The MD 530F spec sheet says five blades (search snippet). Conflict unresolved.
- **Crew seating (side-by-side vs tandem):** not sourced. Likely side-by-side on the MD 500 family (est.).
- **Outboard bench layout and bench span:** only the "three per side" figure, from Wikipedia. The 160th fact sheet would confirm this but would not load.
- **Paint hex values:** all (est.). No official colour spec was found.
- **Hoists, winches, sling loads:** none found on the basic MH-6.
- **Name origin for "Little Bird":** the size-comparison account (versus UH-60A and CH-47C) comes from one search snippet, and no source names who coined it. Treat as unverified.
- **Killer Egg nickname:** search snippets and Wikipedia mention it; not used in voice lines per brief.
- **Wikipedia MELB wing area (54.6 m²):** this equals the rotor disc area, not a wing. Not used as a wing.
- **Range figures:** three sources give different values (430 km, 332 km, 250 nmi unrefuelled).
