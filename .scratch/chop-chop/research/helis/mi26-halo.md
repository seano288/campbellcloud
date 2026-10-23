# Mil Mi-26 "Halo": research notes for a procedural 3D hangar model

Conventions: [src] = fetched or search-snippet source (URLs in section 10). (derived) = arithmetic on sourced numbers. (est.) = my estimate, read off nothing I could fetch. Where sources disagree, both values are given. Colour hex values are all (est.) because I could not find a colour-specified source. Units: metres unless stated.

Source-quality note: the Wikipedia article was the best source. The manufacturer (Rostvertol / Russian Helicopters) and Mil design bureau pages were not reachable in this pass, so numbers that only one secondary site gives are flagged.

---

## 1. Identity

- **Full name:** Mil Mi-26 (NATO reporting name **"Halo"**). [src Wikipedia]
- **Variants (selected):** Mi-26T (civil cargo), Mi-26TP (firefighting, 15,000 L internal fire-retardant tank) [src Wikipedia], Mi-26TC/TS (civil cargo; Mi-26TC shown fighting fires over Athens) [src Wikipedia], Mi-26MS (medical evacuation) [src Wikipedia], Mi-26T2V (Russian military modernisation, first flight August 2018) [src Wikipedia].
- **Maker:** Mil Moscow Helicopter Plant, production by Rostvertol (Rostov-on-Don). Design bureau: Mil. [src Wikipedia; Rostvertol name from search snippets]
- **First flight:** 14 December 1977. [src Wikipedia]
- **First production aircraft rolled out:** 4 October 1980. [src Wikipedia]
- **In service:** Infobox says 1983; article text says in Soviet military and commercial service "by 1985". (Source conflict, both given.) [src Wikipedia]
- **Production:** over 300 built (per infobox, as of the article's date). [src Wikipedia]
- **Role:** Heavy-lift transport helicopter. Largest helicopter to enter serial production, per Wikipedia (second only to the experimental Mil V-12 in size and weight). [src Wikipedia]
- **Crew:** 5 total: 2 pilots, 1 navigator, 1 flight engineer, 1 flight technician (Wikipedia) or loadmaster (FAS). Sources differ on the fifth role. [src Wikipedia; src FAS]
- **Passengers / payload:** 90 troops, or 60 stretchers; cargo up to 20,000 kg. [src Wikipedia]

### Kid-friendly voice lines (each under 12 words)

1. "It's the biggest helicopter ever built to fly in big numbers!" (11 words). Source: Wikipedia, "largest helicopter to enter serial production."
2. "It has eight blades on its big spinning rotor!" (8 words). Source: Wikipedia, eight-blade main rotor.
3. "It can carry ninety people, or sixty on stretchers!" (9 words). Source: Wikipedia, capacity.
4. "It once lifted a whole Chinook helicopter off a mountain!" (10 words). Source: Wikipedia, 2002 Afghanistan recovery of an MH-47E. True, but it was a lift from a mountain in Afghanistan, not a rescue of a grounded aircraft in America.
5. "It can lift almost twenty thousand kilograms of cargo!" (9 words). Source: Wikipedia, 20,000 kg cargo. Use "almost" because 20,000 is the stated figure; say "twenty thousand" if preferred.
6. "It flies nearly three hundred kilometres every hour!" (8 words). Source: Wikipedia, max speed 295 km/h.
7. "It set a record for lifting over fifty-six tonnes!" (9 words). Source: Wikipedia, FAI record 56,768.8 kg to 2,000 m, set 1982.
8. "Its back doors open wide, like a giant clamshell!" (9 words). Source: brief (clamshell rear doors), consistent with FAS "rear doors and ramp". Verify before final use.

---

## 2. Geometry for procedural modelling

### 2a. Overall

| Item | Value | Source / note |
|---|---|---|
| Fuselage length (nose to tail, no rotors) | **33.5 m** (FAS) | [src FAS]. Overall length 33.8 m (111 ft) (FAS), same source. |
| Length with rotors turning | **40.0 m** (FAS, aerocorner-type listings) | [src FAS] |
| Length (Wikipedia spec line) | **40.025 m** (131 ft 4 in), no rotor qualifier | [src Wikipedia]. **Conflicts** with FAS (33.5 m / 40 m). Likely the Wikipedia figure is the with-rotors value. Use 40.0 m as the rotor-turning length and 33.5 m as the hull length. |
| Height (to top of rotor hub/top of fuselage) | **8.145 m** (26 ft 9 in) [src Wikipedia]; **8.1 m** [src FAS] | Hub height not sourced. |
| Fuselage width (max) | **8.2 m** (rotor-to-rotor/body width? FAS "Width: 8.2 m") | [src FAS]. Note: this is likely the overall span including stub wings or the rotor-hub area; treat as an overall planform width, not hull width, until checked. |
| Stub-wing span | not found | Gap. |

### 2b. Main rotor

- **Count:** 1 (single main rotor with tail rotor). [src Wikipedia]
- **Diameter:** **32 m** (105 ft). [src Wikipedia; src FAS]
- **Blade count:** **8**. [src Wikipedia; src FAS]
- **Blade chord:** not found. Gap. (est. 1.0 m: a 0.4-chord-to-radius estimate from typical heavy-lift blades; mark as est. if used.)
- **Main rotor area:** 804.25 m². [src Wikipedia] (derived check: pi x 16^2 = 804.25 m², matches.)
- **Blade sections:** TsAGI 12% at root, TsAGI 9% at tip. [src Wikipedia]
- **Rotation (seen from above):** not found in fetched sources. Gap. (For a Mi-series single main rotor, the convention is counter-clockwise from above; mark as est. until checked.)
- **Hub height above ground:** not found. Gap. (est. ~3.5 m from the 8.15 m overall height and the typical rotor-hub position; mark est.)
- **Hub x position from nose:** not found. Gap. (est. the hub sits roughly over the cabin centre, about x = 12 to 14 m from the nose; mark est.)

### 2c. Anti-torque (tail rotor)

- **Type:** conventional tail rotor (not fenestron, not NOTAR). [src FAS, search snippet]
- **Side:** **right side** of the tail. [src FAS: "large rotor on right side"] Other sources not checked. Confirm before modelling.
- **Diameter:** **7.6 m**. [src FAS; search snippet agrees]
- **Blades:** **5**. [src FAS; search snippet]
- **Height and x position:** not found. Gap. (est. hub near the top of the tail boom; mark est.)
- **Pusher propeller:** none.

### 2d. Fuselage

- **Cargo cabin:** floor length **12 m** (FAS) or 12.1 m (aerocorner-type listing); width **3.3 m** (FAS) / 3.25 m (other listing); height **2.9 to 3.2 m**, varying (FAS); one listing gives 3.17 m. [src FAS; search snippet]
- **Cross-section stations (8 stations, nose to tail):** not found. Gap. Modelling needs three-view drawings; none were fetched. Use the cargo cabin numbers above for the mid-fuselage and est. a tapering nose and tail.
- **Tail boom:** not found. Gap.
- **Engine housings:** 2 turboshafts; the nacelle positions are not sourced. Gap. Each engine is mounted above the rear cabin, in a fairing on top of the fuselage. (est., from the usual Mi-26 layout; mark est.)
- **Cockpit canopy shape:** not found. Gap.
- **Rear loading:** a large rear ramp with clamshell doors that open for drive-on loading. [src brief; FAS mentions rear doors and ramp] Door dimensions not found.
- **Landing gear struts:** hydraulically adjustable, which helps the rear ramp sit level. [src FAS]

### 2e. Tail surfaces

- Vertical fin, horizontal stabiliser, endplates: not found. Gaps. (The Mi-26 has a tall fin and a stabiliser at the tail, but no span or chord was sourced.)

### 2f. Stub wings

- Not found. The Mi-26 has no fixed wings of note (it is a fully rotor-supported helicopter); no stub-wing span is sourced. Hardpoints: none reported.

### 2g. Landing gear

- **Type:** fixed **tricycle** landing gear, with a retractable tailskid that lets the aircraft approach the rear doors unobstructed. [src FAS]
- **Wheel size, number per unit, main track, wheelbase, nose-wheel position:** not found. Gap. (est. main-gear track around 6 m, based on 8.2 m overall width; mark est.)
- **Retractable:** no. The gear is fixed. [src FAS, "fixed tricycle"]

---

## 3. Distinctive features checklist (most recognisable first)

1. **Eight-blade main rotor and huge rotor disc (32 m).** [src Wikipedia]
2. **Rear clamshell ramp / doors** for drive-on cargo. [src brief; FAS]
3. **Massive body with two engines on top of the rear fuselage.** Two-engine layout, not four. [src Wikipedia, FAS]
4. **Tricycle landing gear with a retractable tailskid.** [src FAS]
5. **Five-blade tail rotor on the right side of the tail.** [src FAS]
6. **Sheer size: 32 m rotor and 33.5 m hull, the largest helicopter in serial production [src Wikipedia].** Recognise it by its height and bulk beside other helicopters.

---

## 4. Paint and liveries

No source gave colour specifications. Every hex value below is (est.). Confirmed operators and registrations come from search snippets and the Wikipedia list.

1. **Aeroflot (Soviet national carrier), CCCP registration.** Known example: CCCP-06141, shown at Farnborough 1984; CCCP-06029, shown in Aeroflot markings in Papua New Guinea. [src aeropedia photo caption; src thisdayinaviation search snippet]. Colours (est.): white body #F2F2F2, red cheatline and rotor-hub red #C8102E, blue accent #1F3A93, dark grey landing gear #4A4A4A. Red goes on the cheat stripe and the Aeroflot logo; blue on the lower body band; white on the main body.
2. **UTair (Russian civil operator).** Registration RA-06121 [src helis.com database search snippet]. Colours: not sourced. (est.) white body with a blue-and-red stripe. Use the same white base as Aeroflot for the default mod.
3. **Sportsflite / Afghan 2002 recovery lease.** The civilian Mi-26 leased to recover the MH-47E from Afghanistan (Operation Anaconda context) [src Wikipedia; src search snippet]. Colours: not sourced. Suggest a plain white civil scheme with a black tail (est.) as a "lease" livery. Hex: white #F2F2F2, black #1A1A1A.
4. **Chinese firefighting Mi-26TC (China Flying Dragon).** Third Mi-26TC sold to China by Rostvertol, expected for firefighting [src AIN search snippet]. Colours: not sourced. Suggest a red fire-service scheme (est.): red #C62828 body with white, and a yellow stripe #F9A825 on the rotor-blade tips.
5. **Russian Emergency Ministry (MChS) firefighting Mi-26TP.** Fire-retardant tank variant (15,000 L internal tank) [src Wikipedia]. Colours: not sourced. (est.) red #B71C1C with a white belly and black rotor blades.

### Suggested mod ladder

- **Free default:** plain white civil Mi-26 (white #F2F2F2 body, grey #4A4A4A gear, black rotor tips #1A1A1A). Matches the Aeroflot-era base and needs no sourcing.
- **Upgrade 1, Aeroflot CCCP:** red cheatline (#C8102E), blue lower band (#1F3A93), Aeroflot logo as a flat decal.
- **Upgrade 2, Firefighting Mi-26TP:** red body (#C62828), white belly, yellow blade tips (#F9A825).
- **Upgrade 3, Afghan lease:** white body with black tail and a "Sportsflite" text decal (text not sourced; say "lease" in the voice line rather than reading text).
- **Legendary, Halo Heavy:** gold trim (#FFC107) on the rotor hubs and cargo ramp, plus a rotor-tip light set (see section 7).

---

## 5. Armament and stores

- **Gun turret / door guns:** none reported for civil and cargo variants. The military Mi-26 (Russian Aerospace Forces) carried door guns and hard-points in some sources, but no positions were confirmed. Gap.
- **Rockets, missiles, hoists:** not found. Gap.
- **Cargo hook / sling:** the Mi-26 carries external loads, as shown by the 2002 Chinook recovery [src Wikipedia]. Hook position not sourced. Gap.
- **Hardpoints:** not sourced.

### 4-step kid-friendly stores ladder

1. **Cargo sling (default):** a single cargo net hanging below the belly, with the cargo load shown as a box.
2. **Chinook lift:** a second load (a small Chinook model) hung on the hook, to match the 2002 recovery.
3. **Fire bucket:** a water bucket hung on the hook, to match the firefighting role (underslung bucket, per search snippet).
4. **Stretcher rack:** stretchers on the cargo floor (60 stretchers, [src Wikipedia]), for the medical variant.

---

## 6. Engines

- **Count:** 2. [src Wikipedia; src FAS]
- **Type:** turboshaft. Name conflicts: "Progress D-136" in the Wikipedia spec text; "Lotarev D-136" in the link. [src Wikipedia] (The D-136 is built by ZMKB Progress, named after the Lotarev design bureau. Use "D-136" in the mod text.)
- **Power:** **11,400 shp each** (8,500 kW each). [src Wikipedia; src FAS]
- **Exhaust positions:** not found. Gap. Engine housings sit on top of the rear fuselage.
- **Top speed:** **295 km/h** (183 mph, 159 kn). [src Wikipedia; src FAS]
- **Cruise speed:** 255 km/h. [src Wikipedia; src FAS]
- **Fact about lifting:** the FAI record for the greatest mass lifted by a helicopter to 2,000 m is **56,768.8 kg** (125,000 lb), set in 1982 [src Wikipedia]. Derived: that is about 2.8 times the 20,000 kg cargo capacity (derived).

---

## 7. Other cool mods

- **Rotor-tip lights:** red and green tip lights on the 8 blade tips (fraction-friendly: 8 tips).
- **Clamshell ramp open/close:** animated doors that open to reveal the cargo box (see distinctive features #2).
- **Winch / sling load:** hook beneath the belly, shown as a cable with a cargo net.
- **Landing-gear extend:** the adjustable struts lower the nose and ramp (FAS: "hydraulically adjusted").
- **Tail skid retract:** the tailskid folds away on approach (FAS).
- **Searchlight:** not sourced for this variant. Skip or mark est.

---

## 8. Sound

- Rotor: a deep, slow thump at roughly the 8-blade blade-pass rate. With 8 blades, the thump is heavier than a 4-blade rotor (est.).
- Tail rotor: a higher whine from 5 blades, a second, higher pulse (est.).
- Engines: two turboshaft whines, pitched above the rotor thump, with a deep, rumbling hum (est.).
- Overall: a heavy, low, rolling thunder that gets louder on approach, with two layers (the tail rotor whine on top of the rotor thump) (est.).

---

## 9. Fraction-friendly facts

- **Main rotor blades: 8.** Each blade is 1/8 of the rotor. (sourced count)
- **Tail rotor blades: 5.** Each tail blade is 1/5 of the tail rotor. (sourced count)
- **Rotors: 2 in total** (1 main + 1 tail). The main rotor is 1/2 of the rotors. (derived)
- **Engines: 2.** Each engine is 1/2 of the power. Each makes 11,400 shp, so the total is 22,800 shp. (derived)
- **Crew: 5.** 2 pilots, so 2/5 of the crew are pilots (derived).
- **Troops: 90 seats.** 60 on stretchers, so 60 is 2/3 of 90 (derived).
- **Cargo: 20,000 kg.** Half of the FAI record is 28,384 kg (derived).
- **Doors: 1 main rear clamshell ramp** (two halves, so 2 doors in one clamshell (est.)).
- **Landing gear: tricycle, 3 gear legs (nose, two mains) plus the retractable tailskid (4 contact points).** Wheel counts per leg not sourced.

---

## 10. Reference sources

### URLs used
- Wikipedia, Mil Mi-26: https://en.wikipedia.org/wiki/Mil_Mi-26 (fetched; main source for identity, service dates, crew, capacity, weights, engines, speeds, FAI record, Chinook 2002 recovery, variants)
- FAS, Mil Mi-26 (DOD 101 Systems, ROW): https://man.fas.org/dod-101/sys/ac/row/mi-26.htm (fetched; tail rotor side and diameter, 5-blade tail rotor, cabin dimensions, tricycle gear with retractable tailskid, fuselage length 33.5 m, width 8.2 m)
- Aeropedia, Mil Mi-26 Halo: https://aeropedia.com.au/content/mil-mi-26-halo/ (fetched; only the CCCP-06029 Papua New Guinea photo caption, no colour data)
- AirRecognition, Mi-26 (redirected to a different domain, not followed): https://www.airrecognition.com/index.php?id=1693
- Search snippets (not fetched): Smithsonian Air & Space "We Haul It All" https://www.smithsonianmag.com/air-space-magazine/we-haul-it-all-10713658/ ; AIN "China Takes Firefighting Mi-26TC" https://ainonline.com/aviation-news/business-aviation/2010-12-28/china-takes-firefighting-mi-26tc ; helis.com RA-06121 UTair https://www.helis.com/database/cn/37482 ; ThisDayInAviation Farnborough 1984 CCCP-06141 https://www.thisdayinaviation.com/?p=44075 ; Aerocorner Mi-26 https://aerocorner.com/aircraft/mil-mi-26 ; GlobalSecurity Mi-26 specs https://www.globalsecurity.org/military/world/russia/mi-26-specs.htm ; Armyrecognition Mi-26 Halo https://www.armyrecognition.com/military-products/air/helicopters/transport-helicopters/mil-mi-26-halo

### Three-view drawings found
- None fetched. Gap: a three-view is still needed for the fuselage cross-sections, nacelle positions, tail surfaces and gear positions.

### Known gaps
- Fuselage length: Wikipedia 40.025 m vs FAS 33.5 m hull / 40 m rotor-turning. Needs a three-view to settle.
- Main rotor blade chord, rotation direction, hub height and hub x position: not sourced.
- Fuselage cross-sections (8 stations), tail boom size, cockpit canopy shape, engine nacelle x positions and exhaust directions: not sourced.
- Tail rotor height and x position: not sourced.
- Vertical fin, horizontal stabiliser, stub wings: not sourced.
- Landing gear: wheel sizes, track, wheelbase: not sourced. Tricycle gear confirmed by FAS only.
- Liveries: no colour specification found for Aeroflot, UTair, Sportsflite, China, or MChS schemes. All hex values are estimates.
- Weapons: door guns and hardpoints for the military variant not confirmed.
- Sound: no sourced audio data.
- Rotor direction: not sourced.
- Chinook lift date: the brief says "once carried a Chinook"; sources date it to 2002 (and a second recovery later in 2002), not 1990s. Search found no 1990s case.
</content>
