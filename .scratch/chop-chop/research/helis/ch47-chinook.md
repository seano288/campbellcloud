# Boeing CH-47F Chinook: research notes for a procedural 3D hangar model

Conventions: [src] = from a fetched or search source (cited in section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate. Imperial figures are converted to metric; where sources disagree, both values are given. Colour hex values are all (est.).

Short source tags: [WIKI] Wikipedia "Boeing CH-47 Chinook" (fetched). [WIKI-MH] Wikipedia "Boeing MH-47" (fetched). [WIKI-UK] Wikipedia "Boeing Chinook (UK variants)" (fetched). [MINDEF] Singapore MINDEF CH-47F fact sheet (fetched). [MIG] migflug.com spec page (search snippet only, secondary, mixed-language duplicates). [BOEING-S] Boeing product page (search snippet only; the fetch was redirected and not followed).

---

## 1. Identity

- **Full name:** Boeing CH-47 Chinook. Current production variant: CH-47F (Block II). [WIKI]
- **Designations:** CH-47F (US Army, current), MH-47G (US Army Special Operations, 160th SOAR "Night Stalkers"), CH-47D/ MH-47E/ MH-47D (earlier), HC.6 / HC.6A (RAF), CH-47J/JA (Japan, built under licence by Kawasaki). [WIKI] [WIKI-UK] [WIKI-MH]
- **Nicknames:** "Chinook" (named after the Chinook people of the Pacific Northwest). [WIKI] Soldiers and fans call its sound "the wokka" or "wocka" (informal, see section 8). Informal, do not use in-game as a name.
- **Maker:** Originally Vertol (Piasecki/Vertol, later Boeing Vertol); now Boeing Defense, Space & Security. [WIKI]
- **First flight:** 21 September 1961. [WIKI]
- **In service:** 1962 (US Army). [WIKI] Over 1,200 built as of 2012. [WIKI, search snippet]
- **RAF service:** first UK Chinook HC.1 entered RAF service in late 1980 (text says December 1980; infobox 22 November 1980, conflict). Current UK type HC.6 (CH-47F-derived). [WIKI-UK]
- **Role:** Medium-to-heavy-lift tandem-rotor transport helicopter. Second-heaviest-lifting Western heavy-lift helicopter after the Sikorsky CH-53. [WIKI]
- **Crew:** 3 (pilot, copilot, flight engineer or loadmaster). [WIKI] Cockpit seats side-by-side for pilot and copilot: not confirmed in any fetched source (est., see gaps).

### Kid-friendly voice lines (8, each under 12 words)

1. "Two rotors, one front and one back, and no tail rotor!" (11 words) - Source: [WIKI] counter-rotating rotors eliminate the need for an anti-torque (tail) rotor. True.
2. "Each giant rotor is about 18 metres across!" (8 words) - Source: [WIKI] 2 x 60 ft (18 m) rotor diameter; [MINDEF] 18.29 m. True.
3. "It can carry up to 55 soldiers inside its big belly!" (11 words) - Source: [WIKI] "33-55 troops". True (up to 55).
4. "Two strong engines lift this giant helicopter off the ground!" (10 words) - Source: [WIKI] 2 x Lycoming T55-GA-714A turboshafts. True.
5. "It can lift heavy loads hanging from underneath!" (8 words) - Source: [MINDEF] up to 12,700 kg of underslung cargo. True.
6. "It has a wide ramp at its back to load up!" (10 words) - Source: [WIKI] "a wide loading ramp located at the rear of the fuselage". True.
7. "It can fly up to 310 kilometres in one hour!" (9 words) - Source: [WIKI] top speed 170 kn (200 mph, 310 km/h). True as a top speed.
8. "It has three blades on each giant rotor!" (8 words) - Source: [WIKI] three-blade rotors; [MIG] "three blades per rotor". True.

(Fiction note: no fictional Chinook role was checked. These lines are about the real helicopter only.)

---

## 2. Geometry for procedural modelling

### 2a. Overall dimensions

| Item | Value (metric) | Imperial as printed | Source / note |
|---|---|---|---|
| Overall length, rotors turning (nose to rear of rotor/ramp envelope) | **30.14 m** | 98 ft 10.7 in | [WIKI] (also [MINDEF] 30.14 m) |
| Fuselage length, nose to ramp (not including rotors) | **15.60 m** (preferred) | 51 ft 2 in | [MIG]. Alternative 15.88 m from a [BOEING-S] snippet. (derived) 51 ft 2 in = 15.60 m, so 15.60 m is the value that matches the imperial figure. Use 15.60 m. |
| Overall height (to top of rotor head, probably) | **5.685 m** | 18 ft 7.8 in | [WIKI] ([MINDEF] 5.68 m). Exact reference point not stated. |
| Fuselage width (body) | **3.78 m** | 12 ft 5 in | [MIG] (secondary). |
| Overall width across sponsons (fuel pods) | **5.34 m** | 17 ft 6 in | [MIG] (secondary). Check: 17 ft 6 in = 5.33 m, consistent. |
| Cabin/cargo compartment | 9.30 x 2.29 x 1.98 m (L x W x H) | 30 ft 6 in x 7 ft 6 in x 6 ft 6 in | [MIG]. Imperial and metric agree. |
| Wings | None. The Chinook has no fixed stub wings. | | Not mentioned in any fetched source; general knowledge (est.). Do not model stub wings. |
| Empty weight | 11,148 kg | 24,578 lb | [WIKI] (also [MINDEF] "basic weight" 11,148 kg) |
| Gross / max takeoff weight | **24,494 kg** (Wikipedia gross 54,000 lb) or **22,680 kg** ([MINDEF] max takeoff) | 54,000 lb | Sources conflict. Use 24,494 kg as the Wikipedia figure; record the MINDEF figure too. |
| Payload | 10,886 kg (24,000 lb) [WIKI]; up to 12,700 kg underslung [MINDEF] | | Two different payload figures. Both are sourced. |

Use for in-game scale: **rotor span is 18.29 m per rotor, the overall length with rotors is 30.14 m, and the fuselage is 15.60 m long.** The rotor discs overlap, so the length with rotors (30.14 m) is much less than two rotor diameters placed end to end (36.6 m) (derived; [MIG] confirms the overlap).

### 2b. Main rotors

- **Count:** 2 main rotors, tandem (one forward, one aft). [WIKI]
- **Arrangement:** Counter-rotating. The rotor discs overlap. [WIKI] [MIG] The Chinook rotors are **tandem with overlapping discs, not intermeshing**. Searches did not support a claim that the blades physically interleave (see gaps). Model as two overlapping discs, tilted/ offset so they don't collide.
- **Diameter:** 18.29 m per rotor (60 ft). [WIKI] [MINDEF] [MIG]
- **Radius:** 9.145 m (derived).
- **Disc area:** 262.6 m² per rotor (derived: pi x 9.145^2); 525.3 m² total for both discs [MIG]. (derived check: 2 x 262.6 = 525.2.)
- **Blades per rotor:** **3** (fully articulated). [WIKI] [MIG]. Total 6 blades on the aircraft (derived).
- **Blade chord:** Not found. (est.) ~0.6 m mid-span from photos. Use a linear taper if needed.
- **Blade section:** UK variant page gives blade root "Boeing VR-7" and tip "Boeing VR-8" for the HC.6A. [WIKI-UK] US blades: composite blades were introduced with the CH-47D. [WIKI]
- **Turn direction (seen from above):** Counter-rotating. Which rotor turns which way was not found in any source. Gap.
- **Hub/mast height above ground:** Not found. Overall height is 5.685 m [WIKI], which probably reaches the top of the rotor head. (est.) hub centre ~4.9 m above ground.
- **Hub position along fuselage (x from nose):** Not found. (est.) forward hub at x ~ 3 m, aft hub at x ~ 12.5 m, roughly over the forward and aft pylons. Verify against a three-view before using.

### 2c. Anti-torque

- **Tail rotor:** None. Counter-rotating rotors remove the need for an anti-torque rotor. [WIKI]
- **Fenestron, NOTAR, pusher prop:** None.

### 2d. Fuselage

- **Cross-section stations (~8 points, nose to tail):** Not found in any fetched source. The fuselage is a long box with a rounded nose and a wide rear ramp, with sponsons along the sides. (est.) cabin cross-section ~2.3 m wide (matching cargo bay 2.29 m [MIG]), ~2.0 m high cargo bay (1.98 m [MIG]), with the cabin body 3.78 m wide overall [MIG]. Station heights and z-centres: gap.
- **Engine housings:** 2 engines (Lycoming T55-GA-714A turboshafts). [WIKI] Position on the fuselage (above the aft cabin, exhaust direction): not found. (est.) the engines sit on top of the fuselage behind the cabin, exhausting rearwards/upwards. Verify.
- **Cockpit canopy:** Glass cockpit on CH-47F (digital). [WIKI] Canopy shape not dimensioned: gap.
- **Tail boom:** None. The Chinook has a short fuselage with the ramp at the rear, no tail boom.
- **Top/side outline points:** Not produced. Derive from the 15.60 m fuselage, 5.685 m height and the rear ramp; verify on a three-view.

### 2e. Tail surfaces

- **Vertical fin:** Not dimensioned in any source. Gap.
- **Horizontal stabiliser:** Not dimensioned. Gap.
- **Endplates:** None found.

### 2f. Fuel sponsons (side pods)

- Two sponsons, one each side, running most of the fuselage length. [MIG] [aeroscale forum, weak]
- Internal fuel roughly 4,088 litres (1,080 US gal) in the sponsons on the CH-47F Block II. [MIG] (secondary).
- Block II combines the three fuel cells in each sponson into one larger cell. [WIKI] This saves 90 kg (200 lb).
- MH-47E and MH-47G carry more fuel in enlarged sponsons. [MIG]
- Singapore CH-47SD has extended-range tanks. [WIKI]

### 2g. Landing gear

- **Layout:** Four-wheel fixed landing gear (two units). [aeroscale forum, airvectors-related snippet; weak] Early CH-47A used dual wheels on the front unit and single steerable wheels at the rear. [airvectors, search snippet]. The current arrangement (front/rear unit wheel count) is not confirmed.
- **Wheel size, track, tandem spacing:** Not found. Gap.
- **Retractable?** No. Fixed gear, per the sources above.
- **Skids:** None. (The Chinook uses wheels.)

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two rotors, one at the front and one at the back, with no tail rotor.** Must be right: this is the single most recognisable feature.
2. **Tall, boxy fuselage with a wide rear loading ramp.** [WIKI]
3. **Two overlapping rotor discs with three blades each.** [WIKI] [MIG]
4. **Side fuel sponsons running along the fuselage.** [MIG]
5. **Two engines on top of the fuselage, aft of the cabin.** [WIKI] (position est.)
6. **Four fixed wheels.** [aeroscale forum, weak] Verify before finalising.
7. **Cabin windows along the sides; the cockpit at the nose with a glass canopy.** (est., from general knowledge)
8. **Pintle-mounted machine guns in the rear door areas.** [WIKI] (see section 5)

---

## 4. Paint and liveries

No single authoritative paint spec was found for any Chinook scheme. Colours below are all (est.). Schemes are described in words from the sources, with the sources noted.

1. **US Army service (default olive/green).** Overall olive-drab or "Army green" with black anti-glare panel. Hex (est.): body #4E5B3B; darker tone for lower panels #3A4330; cockpit glass #2B3138. Colours go on fuselage sides and tail; sponsons match the fuselage; rotor blades in a light grey (est.) #B8BDB8.
2. **RAF HC.6 grey (service grey).** Mid-grey overall, with dark grey on upper surfaces. Hex (est.): body #7D8489; upper #4C5359; black anti-glare (est.) #22262A. Source: existence of RAF grey schemes [WIKI-UK] (colours est.).
3. **JGSDF three-colour (Japan, CH-47J/JA).** Three-colour camouflage of green, brown and black for low-level flying over inland terrain. [trafficnews.jp search snippet; Japanese, secondary] Hex (est.): green #5C6B47, brown #6E5A3F, black #1E1E1E. Winter camouflage variant with white also exists per a flight-sim listing (weak). Hex (est.) white #E8E8E4.
4. **MH-47G Night Stalker (black special operations).** Mostly black with grey and dark tones on the fuselage. [Brothers Brick, hobby; low authority] Hex (est.): black #1A1C1F, dark grey #3B3F44. Refuelling probe and sponsons in black (est.).
5. **RAF 40th anniversary (Legendary).** A commemorative scheme was painted on ZD984 to mark 40 years of RAF Chinook service. [RAF, search snippet] The exact design is not in the search results. (est.) Use a two-tone blue-grey with a gold stripe, hex blue-grey #5A6E82, gold #C8A24A, for the Legendary mod. The colours are invented for the game, not from the aircraft.

**Suggested mod ladder:**
- **Free default:** US Army olive (scheme 1).
- **Upgrade 1:** RAF grey (scheme 2).
- **Upgrade 2:** JGSDF three-colour (scheme 3).
- **Upgrade 3:** Night Stalker black (scheme 4).
- **Legendary:** RAF 40th anniversary commemorative (scheme 5), gold trim.

---

## 5. Armament and stores

- **Door/side guns:** Up to 3 pintle-mounted medium machine guns (7.62 mm M240 / FN MAG, or M134 Minigun). [WIKI] Mount positions: the rear ramp and side doors (est.); exact mount points not sourced.
- **MH-47G Block II:** armed with two 7.62 mm M134 Miniguns and two M240 machine guns. [WIKI-MH] Positions not stated.
- **HC.6A (RAF):** 2 x M134 Miniguns and 1 x M60 machine gun. [WIKI-UK]
- **Rockets, missiles:** None on standard CH-47F. Not found for any variant. Do not model.
- **Hardpoints:** No fixed wing hardpoints (no wings). Stores are mounted on pintles at the doors and ramp.
- **Cargo hook:** Underslung cargo hook for up to 12,700 kg. [MINDEF]
- **Hoist:** Not sourced. Gap.

**Kid-friendly 4-step weapons/stores mod ladder:**
1. **Clean:** no guns, just the cargo hook.
2. **One door gun:** a single pintle machine gun on a side door. [WIKI]
3. **Three pintle guns:** up to three machine guns. [WIKI]
4. **Legendary Night Stalker:** two miniguns and two M240s (MH-47G style). [WIKI-MH]

---

## 6. Engines

- **Count and type:** 2 x Lycoming T55-GA-714A turboshaft engines. [WIKI] [MINDEF-aligned via Wiki spec section]
- **Power:** 4,733 shp (3,529 kW) each. [WIKI] A [BOEING-S] snippet gives 4,777 shp each; another source gives 4,733. Use 4,733 shp (Wikipedia).
- **Exhaust positions:** Not found. (est.) engines are on top of the fuselage aft of the cabin, with exhaust rearward. Gap.
- **Top speed:** 170 kn (200 mph, 310 km/h). [WIKI] [MINDEF] (MINDEF says 170 kts.)
- **Range:** 400 nmi (460 mi, 740 km). [WIKI] [MINDEF] (>400 nm)
- **Service ceiling:** 20,000 ft (6,100 m). [WIKI]
- **Fact about speed/lifting:** A Chinook can lift 12,700 kg hanging underneath, which is more than its own empty weight (derived: 12,700 kg vs 11,148 kg empty). [MINDEF] [WIKI]

---

## 7. Other cool mods specific to this helicopter

- **Refuelling probe (MH-47G):** The MH-47G Block II has in-flight refuelling capability. [WIKI-MH] A refuelling probe is shown on the MH-47E in a photo caption [WIKI-MH]. Janes-search snippet describes an extendable probe on the MH-47G. [search snippet; low detail] Probe location: gap.
- **Terrain-following radar and FLIR (MH-47G Block II):** Forward-looking infrared and terrain-following radar. [WIKI-MH]
- **Defensive aids suite (MH-47G):** [WIKI-MH]
- **Open rear ramp:** The rear ramp is wide and can be lowered. [WIKI]
- **Cargo hook (underslung load):** 12,700 kg underslung. [MINDEF]
- **Searchlight, rotor-tip lights, winch:** Not sourced for the CH-47F. Model as game-only ideas (no source). Do not present as real.

---

## 8. Sound

- **Character:** A deep, rhythmic "wokka" or "wocka" thump from the twin rotors, heard as one overlapping pulse. [search snippets: British Army and informal sources, low authority]
- **Mechanism:** Blade-vortex interaction, where a passing blade hits the wake of another. [search snippet, NASA-derived; applied to tandem layout by inference]
- **Sound-designer notes (est.):** Two overlapping blade-pass tones, each about 3 pulses per rev per rotor (3 blades). Low-frequency double thump, with the two rotors out of phase so they make a "wok-wok" beat. Add a high slap on approach or descent. Idle turbine whine under the rotor noise, from the two T55 engines.
- **Blade slap:** A sharp impulsive "slap" can occur when a blade's tip vortex hits another blade, mostly in descent, turning or slowing flight. [NASA search snippet]

---

## 9. Fraction-friendly facts

- **2 rotors**, one front and one back. Each rotor is **1/2** of the rotor set.
- **3 blades per rotor**, so each blade is **1/3** of its rotor. Total **6 blades** across both rotors, so each blade is 1/6 of the blades.
- **2 engines**, so each engine is **1/2** of the power.
- **4 wheels** (fixed gear; [weak source]). Verify before using.
- **3 crew** (pilot, copilot, flight engineer or loadmaster). So the flight engineer is 1/3 of the crew. [WIKI]
- **2 sponsons** (side fuel pods), so each is 1/2 of the side fuel. [MIG]
- **1 rear ramp**. [WIKI]
- **Up to 3 pintle guns**. [WIKI] Each gun is 1/3 of the guns.
- **Up to 55 troops**. [WIKI] 55 seats, so 11 is 1/5 of the seats (derived).

---

## 10. Reference sources

URLs used (fetched unless marked as search snippet):
- https://en.wikipedia.org/wiki/Boeing_CH-47_Chinook (fetched; spec section read from the second page of the article; general description and blade/rotor/fuel/ramp text)
- https://en.wikipedia.org/wiki/Boeing_MH-47 (fetched; MH-47G section)
- https://en.wikipedia.org/wiki/Boeing_Chinook_(UK_variants) (fetched; HC.6/HC.6A specs, blade sections, service dates)
- https://www.mindef.gov.sg/news-and-events/latest-releases/11apr24_fs/ (fetched; Singapore CH-47F fact sheet: 30.14 m length, 18.29 m rotor, 5.68 m height, 170 kts, 11,148 kg basic, 22,680 kg max takeoff, 12,700 kg underslung)
- https://migflug.com/aircraft/ch-47-chinook/ (search snippet only; secondary and mixed-language; fuselage 15.60 m, width 3.78 m, sponsons 5.34 m, cargo bay, disc area 525.3 m², three blades, fuel 4,088 L)
- https://www.boeing.com/defense/ch-47-chinook/ (redirect, not followed; figures from search snippet only: fuselage 15.88 m, 4,777 shp)
- https://aerocorner.com/aircraft/boeing-mh-47g-chinook/ (search snippet only; 4,733 shp)
- https://airvectors.net/avch47_2.html (search snippet only; sponson and early wheel details; direct fetch returned 404)
- https://www.arrse.co.uk/wiki/Chinook (search snippet only)
- https://www.raf.mod.uk/news/articles/raf-chinook-helicopter-celebrates-40th-anniversary-with-new-colour-scheme/ (search snippet only; 40th anniversary scheme on ZD984)
- https://trafficnews.jp/post/99737 (search snippet only; JGSDF three-colour camouflage)
- https://www.brothers-brick.com/tag/chinook/ (search snippet only; MH-47 black, hobbyist)
- https://en.wikipedia.org/wiki/Chinook_Display_Team (search snippet only)
- https://www.centennialofflight.net/essay/Dictionary/heli_rotor_config/DI54.htm (search snippet only; rotor configurations)
- https://ntrs.nasa.gov/citations/19870001317 (search snippet only; blade-vortex interaction and blade slap)
- https://www.janes.com/defence-intelligence-insights/defence-news/us-army-awards-final-production-contract-for-four-special-mission-chinooks (search snippet only; MH-47G probe)

Three-view drawings: none found. A three-view from a reliable source is still needed for station geometry, hub positions and tail surfaces.

### Known gaps

- **Cross-section stations (8 points)**, fuselage z-centre, canopy shape: not found.
- **Hub/mast height above ground** (only overall height 5.685 m known) and **hub x-positions** along the fuselage: not found.
- **Blade chord** and **blade taper**: not found.
- **Rotation direction** of each rotor seen from above: not found.
- **Rotor overlap geometry** (mast tilt, height offset between fore and aft rotors): not found. Searches did not support "intermeshing" blades; treat the Chinook as tandem with overlapping discs.
- **Tail surfaces** (vertical fin, horizontal stabiliser): not found.
- **Landing gear**: wheel size, track width, tandem spacing, and current wheel count: not confirmed.
- **Engine housing positions, exhaust direction**: not found.
- **Fuselage length conflict**: 15.60 m [MIG] vs 15.88 m [BOEING-S]. Use 15.60 m (matches 51 ft 2 in).
- **Weight conflict**: max takeoff 24,494 kg [WIKI gross] vs 22,680 kg [MINDEF]. Record both.
- **Payload conflict**: 10,886 kg [WIKI] vs 12,700 kg underslung [MINDEF]. Both sourced, different measures.
- **Engine power conflict**: 4,733 shp [WIKI] vs 4,777 shp [BOEING-S]. Use 4,733 shp.
- **HC.1 service date conflict**: December 1980 (text) vs 22 November 1980 (infobox) [WIKI-UK].
- **MH-47G refuelling probe**: location and geometry not found.
- **Livery hex values**: all est. No official paint spec found for any scheme. RAF 40th anniversary design details not found.
- **Hoist, winch, searchlight**: not sourced for CH-47F.
- **Blade chord and blade count** for MH-47G or HC.6A: not separately confirmed (HC.6A blade sections only).
