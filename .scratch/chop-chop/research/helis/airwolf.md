# Airwolf (TV show helicopter): research notes for a procedural 3D hangar model

Tags: **[src]** = from a fetched or searched source (see section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate. **[fiction]** = on-screen or fan-invented, not a real-world fact. Units: metres unless stated.

Important: the TV Airwolf is fiction. The real aircraft was a civilian Bell 222 with cosmetic film modifications. Keep those two things separate in the game.

---

## 1. Identity

- **Fictional name:** Airwolf (the TV show's helicopter). [src: Wikipedia "Airwolf", https://en.wikipedia.org/wiki/Airwolf]
- **Real base aircraft:** Bell 222 (civilian, twin-engine, two-blade main rotor). Registration **N3176S**, serial **47085**, owned during filming by Jetcopters, Inc., Van Nuys, California. [src: Wikipedia "Airwolf"; SlashGear, https://www.slashgear.com/1908349/airwolf-tv-show-real-helicopter-bell-222]
- **Variant:** SlashGear calls it a Bell 222A, "one of the last 222A models built by Bell." Other sources say "sometimes unofficially called a Bell 222A." [src: SlashGear; Wikipedia "Airwolf"]
- **Maker:** Bell Helicopter (Textron). The show's look was designed by Andrew Probert. [src: Wikipedia "Airwolf"; search snippet]
- **Base type first flight:** Bell 222 is a 1980s design. Bell built 188 Bell 222-series helicopters between 1980 and 1991. [src: SlashGear] Wikipedia "Airwolf" gives a first-flight year of 1983 for the flying airframe, tagged [citation needed]. Treat as unverified.
- **In service:** Not applicable as a TV prop. Real Bell 222s were civil and air-ambulance or charter aircraft. The Airwolf airframe served as a German air ambulance (see section 10 history). [src]
- **Role:** Fictional: a stealth-style fighter-helicopter. Real: civil utility helicopter, unarmed.
- **Crew (real):** Pilot plus one front passenger seat; up to 10 people total at maximum. [src: Wikipedia "Bell 222"]
- **Crew (fiction):** [fiction] The show's pilot and crew are not covered by the sources I fetched. Gap; do not state a show pilot name.

### Kid-friendly voice lines (8 lines, each under 12 words)

1. "Its rotor has just two blades, so each blade is half!" (11 words). Source: Bell 222 two-blade rotor [src: Wikipedia "Bell 222"].
2. "The real Airwolf was a Bell 222, a civilian helicopter!" (10 words). Source: [src: Wikipedia "Airwolf"; SlashGear].
3. "The real helicopter has two turbine engines!" (7 words). Source: two Lycoming LTS101 turboshafts [src: Wikipedia "Bell 222"].
4. "The real helicopter can carry up to ten people!" (9 words). Source: max 10 seats including pilot [src: Wikipedia "Bell 222"].
5. "The real helicopter cruises at about 246 kilometres per hour!" (9 words). Source: 133 knots cruise [src: Wikipedia "Bell 222"].
6. "In the TV show, Airwolf flew super fast, like a jet!" (11 words). [fiction] The speed claim is from the show, not a real aircraft spec.
7. "In the TV show, Airwolf had secret guns that popped out!" (11 words). [fiction] Guns and popping-out are on-screen, not real.
8. "The real helicopter later flew as an air ambulance in Germany!" (11 words). Source: [src: SlashGear; Wikipedia "Airwolf"].

---

## 2. Geometry for procedural modelling

### 2a. Overall (real Bell 222, sourced)

| Item | Value | Source / note |
|---|---|---|
| Fuselage length (no rotors) | **12.85 m** (42 ft 2 in) | [src: Wikipedia "Bell 222"] |
| Overall height | **3.56 m** (11 ft 8 in) | [src: Wikipedia "Bell 222"] |
| Main rotor diameter | **12.12 m** (39 ft 9 in) | [src: Wikipedia "Bell 222"]. The same table also lists 12.80 m (42 ft); the page does not map it to a model. Use 12.12 m. |
| Main rotor radius | 6.06 m | (derived) 12.12 / 2 |
| Rotor length with blades turning | 12.12 m (same as diameter) | (derived) |
| Main rotor disc area | ~115 m² | (derived) pi x 6.06^2 |
| Stub-wing span | none found (real 222) | Gap: see section 10 |
| Empty weight | 2,200 kg (4,860 lb) | [src: Wikipedia "Bell 222"] |
| Max takeoff weight | 3,670 kg (8,100 lb), external-load ops | [src: Wikipedia "Bell 222"] |

Note: the Wikipedia "Bell 222" spec table is for the 222 model. Airwolf's airframe was a 222A, which may differ slightly. Use these as the baseline and mark the difference as est.

### 2b. Main rotor

- **Count:** single main rotor. [src: Wikipedia "Bell 222"]
- **Blades:** **2**. [src: Wikipedia "Bell 222": "Main rotor has two blades."]
- **Diameter:** 12.12 m. [src: Wikipedia "Bell 222"]
- **Blade chord:** not found. Gap. (est.) a narrow chord for a two-blade light helicopter, around 0.3 m, but unverified.
- **Rotation (seen from above):** not confirmed. Gap. Common for US single-rotor helicopters is counter-clockwise from above, but I have not verified this for the Bell 222.
- **Hub/mast height above ground:** not found directly. (est.) about 2.5 to 3.0 m, read from the 3.56 m overall height. Gap for a verified number.
- **Hub x-position from nose:** not found. (est.) roughly over the cabin, about 40% to 50% of fuselage length from the nose. Gap for a verified number.

### 2c. Anti-torque

- **Type:** tail rotor. [src: Wikipedia "Bell 222"]
- **Pusher:** the Wikipedia spec table calls it a "pusher type with two blades." [src: Wikipedia "Bell 222"]
- **Diameter, side, height, x-position:** not found. Gap.
- **Fenestron / NOTAR / pusher propeller:** none. [src: Wikipedia "Bell 222" for the tail rotor type]

### 2d. Fuselage

- **Engines:** two Lycoming LTS101-650C-3 turboshafts (Wikipedia spec table: 620 shp each). Later 222B: LTS101-750C-1. [src: Wikipedia "Bell 222"; SlashGear]
- **Engine position and exhaust direction:** not found. Gap. (est.) engines sit on top of the cabin, behind the main rotor mast. Verify on a three-view.
- **Cross-section stations (8):** not found. Gap. No fabricated station table. Get a Bell 222 three-view from a manufacturer or a museum.
- **Tail boom length and diameter:** not found. Gap.
- **Cockpit canopy:** not found in sources. Gap. The real 222 has a conventional front glass area; verify from a photo.
- **Cabin:** the spec table says pilot plus one passenger in front, with 4 to 6 in the main cabin depending on seat type. [src: Wikipedia "Bell 222"]

### 2e. Tail surfaces

- Vertical fin, horizontal stabiliser, endplates: none found in sources. Gap.

### 2f. Stub wings and show add-ons

- **Real 222:** no stub-wing span found in sources. Gap.
- **Show mock-up:** the sponson-mounted guns on the non-flying mock-up were non-firing props that used spark plugs and fuel to simulate firing. [src: Wikipedia "Airwolf"] (These are on the mock-up, not necessarily on the flying airframe.)
- **Wingtip guns:** [fiction] the flying airframe had retractable wingtip machine guns. [src: Wikipedia "Airwolf"]. The brief's "stub-wing gun pods" and "chain guns from wing roots" are not confirmed. Sources say wingtips, not wing roots. Use the sourced location.
- **Pod dimensions:** not found. Gap.

### 2g. Landing gear

- **Type:** not confirmed in sources. Gap. (est.) fixed skids, which is typical for the Bell 222 class. Verify.

---

## 3. Distinctive features checklist (most recognisable first)

1. **"Phantom gray" top with a pale pearl-gray underside.** [src: Wikipedia "Airwolf": top "Phantom Gray Metallic"; underside custom pearl gray, countershaded]. Note: the brief says "black-over-white/grey". Sources disagree on black; see section 4.
2. **Nose blister cowling.** [src: Wikipedia "Airwolf"; fiction as a weapon-like element]
3. **Wingtip guns on the side sponsons.** [fiction] [src: Wikipedia "Airwolf" for the wingtip guns]
4. **Belly rocket / "ADF Pod".** [fiction] Retractable belly launcher that rotates 180 degrees. [src: Wikipedia "Airwolf"]
5. **Intake shapes on the belly/sides.** [fiction] "Turbo thrusters" and "turbojet engines and intakes" are listed in the show's specs. [src: Wikipedia "Airwolf"]. No real aircraft has these.
6. **Nozzles / in-air refuelling nozzle.** [fiction] [src: Wikipedia "Airwolf"]. Brief's "turbo afterburner nozzles": sources do not confirm them as afterburners.
7. **Two-blade rotor.** [src: Wikipedia "Bell 222"] Real and easy to count.
8. **Tail rotor pusher.** [src: Wikipedia "Bell 222"]. Real, but hard for a kid to see.

---

## 4. Paint & liveries

Sources disagree. The brief says black-over-white/grey. Wikipedia "Airwolf" describes "Phantom Gray Metallic" on top and a pearl gray underside. Neither source gives a black lower or upper stripe in the text I fetched.

| # | Scheme | Colours | Hex (est.) | Where |
|---|---|---|---|---|
| 1 | Show scheme, top | Phantom Gray Metallic (DuPont Imron 5031X) [src] | #5A5F66 (est.) | Upper fuselage, boom, rotor cowl |
| 2 | Show scheme, underside | Pearl gray, countershaded [src] | #D9DCDF (est.) | Lower fuselage, belly, skids |
| 3 | Brief scheme: black over white | Black accents [brief, not verified] | #151515 (est.) | Upper nose, canopy frame. Mark as unverified. |
| 4 | Real operator: HSD (German air ambulance) | Repainted after filming. Colours not found. [src: Wikipedia "Airwolf"] | Gap | |
| 5 | Replica: Steven W. Stull replica, museum | Colours not found. [src: Wikipedia "Airwolf"] | Gap | |

Note: DuPont Imron 5031X is the paint code given for the phantom gray top. Keep the hex estimate separate from that code.

### Suggested mod ladder (paint)

- **Free default:** scheme 1 (phantom gray top, pearl gray underside).
- **Upgrade 1:** scheme 3 (black accents), only if the brief's black-over-white is confirmed by a photo.
- **Upgrade 2:** "Night Mode" darker grey, made up for the game (fiction, not a real livery).
- **Upgrade 3:** "Ambulance" (German HSD style): not verified; leave as a placeholder until colours are found.
- **Legendary:** "TV Airwolf" full show look, with the belly pod and wing guns shown in the same gray. [fiction styling]

---

## 5. Armament & stores

**Real Bell 222: unarmed.** Civilian helicopter, no guns, no hardpoints, no rockets. [src: Wikipedia "Bell 222"]

**Show (fiction):** the flying Airwolf and mock-up had:

- **Wingtip chain guns / machine guns:** retractable. [src: Wikipedia "Airwolf"]. Calibre per sources: "four .50 BMG chain guns and two 30 mm cannons" (Wikipedia "Airwolf" specs). Another search snippet gives "two 30 mm chain guns and one 40 mm cannon in each wing pod." Sources disagree; use "gun pods" with no calibre in-game.
- **Belly launcher ("ADF Pod"):** retractable, rotates 180 degrees to fire to the sides. [src: Wikipedia "Airwolf"]
- **Decoys:** "SunBurst" (anti-heat-seeker) and "Chaff" decoy launchers. [src: search snippet; not fetched]
- **Refuelling nozzle:** in-air refuelling intake. [src: Wikipedia "Airwolf"] (fiction)
- Not used: "chain gun is a trademark" claim from a search snippet. Unverified; do not use.

### Kid-friendly weapons/stores mod ladder (4 steps)

1. **Step 1, default:** no weapons; "A helicopter that flies people."
2. **Step 2, wing pods:** "Two wing pods that can pop out" (fiction, show style).
3. **Step 3, belly pod:** "A belly pod that spins around" (fiction).
4. **Step 4, decoys:** "Decoys that fool heat-seeking missiles" (fiction, show style).

Hardpoint positions: none on the real 222. Show: wing pods and belly pod, positions as above. Real missiles: none.

---

## 6. Engines

- **Real count:** 2. [src: Wikipedia "Bell 222"]
- **Real type:** Lycoming LTS101-650C-3 turboshaft (222), 620 shp each per spec table. 222B: LTS101-750C-1. [src: Wikipedia "Bell 222"; SlashGear]
- **Real exhaust position:** not found. Gap.
- **Real top speed:** cruise 133 knots (246 km/h). [src: Wikipedia "Bell 222"]
- **Show (fiction):** "turbo thrusters" able to exceed Mach 1. [src: Wikipedia "Airwolf"; fan-sourced] Not real. Keep it as a show-only claim.
- **Fact for kids:** "Two turbine engines work together to spin the big rotor!" (est. wording, general helicopter fact)

---

## 7. Other cool mods

- **Retractable wing guns:** show-only. (fiction)
- **Belly pod that spins 180 degrees:** show-only. (fiction)
- **Decoy launchers (SunBurst, Chaff):** show-only. [src: search snippet]
- **Rotor blade mods:** none documented. The real 222 has a two-blade rotor; no tip lights or searchlight found in sources. Gap.
- **Searchlight, winch, sling load:** the 222 has an external-load rating (8,100 lb max takeoff for external-load ops). [src: Wikipedia "Bell 222"]. No winch confirmed. Gap.

---

## 8. Sound

- **Real:** two Lycoming/Honeywell turboshaft engines. Expect a high turbine whine (est.) with a low two-blade rotor thump. Blade count is low, so the slap rate is lower than a four-blade rotor (est.).
- **Show:** the on-screen sound was the Airwolf theme plus added effects. No source found for the exact effects. Gap. For a synth, use: "turbine whine rising, then a low two-blade thump, with a bright 'shing' for the guns (est.)."

---

## 9. Fraction-friendly facts

- **Blades on the main rotor:** 2, so each blade is **one half** of the rotor. [src: Wikipedia "Bell 222"]
- **Rotors:** 1 main rotor, 1 tail rotor. [src: Wikipedia "Bell 222"]
- **Tail rotor blades:** 2, so one tail blade is one half of the tail rotor. [src: Wikipedia "Bell 222"]
- **Engines:** 2, so one engine is **one half** of the power. [src: Wikipedia "Bell 222"]
- **Crew/passenger seats:** pilot plus 1 front seat, up to 10 people total. [src: Wikipedia "Bell 222"] Ask: "If 10 people fly, what fraction is the pilot?" (derived: 1/10)
- **Show wing guns:** 2 wingtip guns (fiction). Quarter-type question: "2 guns, each one half of the pair" (fiction).
- **Belly pod:** 1 pod, fiction.

---

## 10. Real airframe history, sources, and known gaps

### Real airframe (sourced)

- **Serial:** 47085. Registration N3176S. [src: Wikipedia "Airwolf"; SlashGear]
- **Mock-up:** built from the body of the first Bell 222, serial **47001**. Modifications were applied to the mock-up first. [src: Wikipedia "Airwolf"]
- **During filming:** owned by Jetcopters, Inc., Van Nuys, California. [src: Wikipedia "Airwolf"; SlashGear]
- **After cancellation:** the show modifications were removed. Wikipedia "Airwolf": "the modifications were removed from the aircraft and are now owned by a private collector." [src] Whether the removed parts went to the collector is unclear.
- **1987:** sold to Hubschrauber-Sonder-Dienst (HSD), a German charter / air-ambulance firm. Registered **D-HHSD**. [src: SlashGear; Wikipedia "Airwolf"]
- **Crash:** 6 June 1992. Operating as an air ambulance. Three occupants killed. [src: Wikipedia "Airwolf"; SlashGear]. Accounts differ on details: Wikipedia "Airwolf" says "crashed into a mountain in fog"; SlashGear says it was flying from Berlin to Cologne, returned to Berlin Schoenefeld, and crashed into a wooded mountaintop in bad weather. Both agree on the date and three deaths.
- **Serial link:** Wikipedia "Airwolf" does not explicitly state that D-HHSD is serial 47085, only implies it. Treat as likely but unconfirmed. Check the FAA registry or Bell production list.
- **Replica:** built by Steven W. Stull from a non-flying Bell 222 using molds from the originals. Displayed at a Pigeon Forge museum, then Tennessee Museum of Aviation, then sold to a California collector. [src: Wikipedia "Airwolf"]. The replica came from a non-flying airframe, not the flying one.

### Sources

- Wikipedia "Bell 222": https://en.wikipedia.org/wiki/Bell_222 (fetched; spec values)
- Wikipedia "Airwolf": https://en.wikipedia.org/wiki/Airwolf (fetched; airframe, modifications, history). Note: the fetch returned a summary, not verbatim text.
- SlashGear, "What Helicopter Was TV's Airwolf Based On?": https://www.slashgear.com/1908349/airwolf-tv-show-real-helicopter-bell-222 (fetched; registration, owner, 1987 sale, crash)
- Search snippet only (page returned HTTP 402 when fetched): https://airwolf.fandom.com/wiki/Airwolf_(helicopter)/Bell-222A
- Search results only, not fetched: https://tnairmuseum.com/airwolf ; https://www.impdb.org/index.php/Airwolf_(TV_Series) ; https://hushkit.net/2024/08/23/would-the-airwolf-helicopter-have-worked-in-real-life-we-got-expert-analysis/
- Not fetched or available: imfdb.org (HTTP 403).
- Three-view drawings: none found. Gap.

### Known gaps

- **Three-view:** no verified three-view drawing found. All fuselage stations, widths, heights and tail dimensions are gaps.
- **Hub height and hub x-position:** not verified.
- **Rotation direction seen from above:** not verified.
- **Tail rotor side, diameter, height:** not verified.
- **Skids vs wheels:** not verified.
- **Stub wings (real 222):** not found; the show's wing pods are sourced only as "wingtip" guns.
- **Show paint:** sources give grey top and pale underside. "Black over white" from the brief is not confirmed.
- **Show paint hex values:** all estimated.
- **Show weapon calibres:** sources disagree (.50 BMG and 30 mm vs 30 mm and 40 mm).
- **Second on-screen Airwolf airframe:** not identified.
- **Real Bell 222 vs 222A vs 222B differences:** not resolved. Spec figures are from the Bell 222 page.
- **Crash location and details:** sources differ (mountain in fog vs wooded mountaintop, bad weather).
- **Engine exhaust positions and fuselage station widths:** not found.
- **Sound references:** no sources; estimates only.
