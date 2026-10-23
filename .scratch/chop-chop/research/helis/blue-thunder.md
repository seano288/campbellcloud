# Blue Thunder (Aérospatiale SA 341G Gazelle, modified for the 1983 film)

Tags: **[src]** = from a fetched or searched source (see section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate, not sourced. **[fiction]** = invented for the film or TV show, not real.

Note on sources: the film's helicopter is real-world built from a real Gazelle, but the on-screen features (whisper mode, Nitesun lights, cannon, armour) are [fiction] unless stated otherwise. Several sources disagree on details; these are called out inline.

---

## 1. Identity

- **Name:** Blue Thunder (the film's fictional police helicopter). Real airframes: **Aérospatiale SA 341G Gazelle** [src: https://en.wikipedia.org/wiki/Aérospatiale_Gazelle]. Registrations N51BT and N52BT; serials 1066 and 1075, both built 1973 [src: https://en.wikipedia.org/wiki/Blue_Thunder_(helicopter)].
- **Nicknames:** none sourced.
- **Maker:** Aérospatiale (French; the Gazelle family, designation SA 341/342). Film modifications by Cinema Air, Carlsbad, California [src: Blue_Thunder_(helicopter) page].
- **Gazelle first flight:** 7 April 1967, prototype SA.340 [src: Wikipedia Gazelle infobox; https://www.thisdayinaviation.com/tag/aerospatiale-sa-341-gazelle/].
- **Film:** *Blue Thunder*, released in the US 13 May 1983 (West Germany 5 February 1983) [src: https://en.wikipedia.org/wiki/Blue_Thunder_(film)].
- **TV series:** *Blue Thunder*, 11 episodes in 1984; cancelled after one season [src: Blue_Thunder_(helicopter) page; slashgear].
- **Role (real):** light utility helicopter [src: Wikipedia Gazelle]. **Role (film):** police surveillance [fiction].
- **Crew (real):** "1 or 2" [src: Wikipedia Gazelle specifications]. **Crew (film):** pilot Murphy plus a non-pilot second officer, Lymangood [fiction].
- **Seating arrangement (real):** not confirmed by my sources. (See Known gaps.)

### Kid-friendly voice lines

1. "Its main rotor is ten and a half metres wide!" [src: Wikipedia Gazelle, rotor 10.5 m]
2. "Its main rotor has three blades that spin around and around!" [src: thisdayinaviation, three-bladed main rotor]
3. "Its tail has a hidden fan with thirteen blades inside!" [src: thisdayinaviation, 13-blade fenestron in the fin]
4. "It can zoom faster than three hundred kilometres every hour!" [src: Wikipedia Gazelle, max speed 310 km/h at sea level; "max" means top speed, so "can" is accurate]
5. "Two real flying helicopters were built to play Blue Thunder!" [src: Blue_Thunder_(helicopter) page, two flying airframes]
6. "The real helicopter was built in France in nineteen seventy-three!" [src: Blue_Thunder_(helicopter) page, serials built 1973]
7. "In the movie, this helicopter had a super quiet whisper mode!" [fiction, framed as the movie]
8. "In the movie, its chin had a six-barrelled cannon!" [fiction, framed as the movie]

---

## 2. Geometry for procedural modelling

All real-aircraft values are metres unless noted. Imperial values in sources converted.

### Overall
- **Length, fuselage:** 9.533 m [src: thisdayinaviation tag page, "The fuselage was 9.533 meters (31 feet, 3.31 inches) long."]
- **Length with rotors turning:** 11.97 m [src: Wikipedia Gazelle, "11.97 m (39 ft 3 in) including rotor"; thisdayinaviation gives 11.972 m].
- **Height overall:** 3.15 m [src: Wikipedia Gazelle, "3.15 m (10 ft 4 in) overall"].
- **Height to top of rotor hub:** not sourced. (est.) Hub sits a little below the blade-tip top, so roughly 2.8 to 2.9 m above ground (est.). Use 2.85 m as a starting point.
- **Fuselage width:** not sourced. (est.) Use roughly 1.5 m for the cabin, from general Gazelle photos. Not verified.
- **Stub-wing span:** none sourced. The Gazelle is a helicopter with no fixed wings in any source I read. (est.) No stub wings; if the game wants them for the film version, add none.
- **Empty weight:** 917 kg; **max takeoff weight:** 1,800 kg [src: Wikipedia Gazelle].

### Main rotor
- **Count:** one, single main rotor with tail anti-torque (fenestron) [src: thisdayinaviation].
- **Diameter:** 10.5 m [src: Wikipedia Gazelle, "Main rotor diameter: 10.5 m (34 ft 5 in)"]. Note: thisdayinaviation gives "10,500 meters" in one line, which is a typo; the imperial figure matches 10.5 m [src].
- **Blade count:** 3 [src: thisdayinaviation, "a new three-bladed, composite, semi-rigid main rotor"].
- **Blade chord:** not sourced. (est.) About 0.3 m near the root taper; not verified.
- **Rotation as seen from above:** clockwise [src: thisdayinaviation].
- **Normal operating speed:** 378 rpm, plus or minus 12 [src: thisdayinaviation].
- **Hub height above ground:** (est.) about 2.85 m (see Overall).
- **Hub x-position from nose:** not sourced. (est.) The mast sits roughly over the middle of the cabin, about 3.5 m from the nose.

### Anti-torque: fenestron (no conventional tail rotor)
- **Type:** fenestron, a shrouded fan in the vertical fin [src: Wikipedia Gazelle; thisdayinaviation].
- **Diameter:** 0.695 m [src: thisdayinaviation, "The rotor has a diameter of 0.695 meters (2 feet, 3.36 inches)."]. (Unverified; one search excerpt of an FAA table lists a figure of 2.44 in an unlabelled column that I could not confirm as fenestron diameter.)
- **Blade count:** 13 [src: thisdayinaviation, "The 13-blade fenestron is enclosed in a duct in the vertical fin."]
- **Rotation:** counter-clockwise, seen from the left [src: thisdayinaviation].
- **Height and x-position:** not sourced. (est.) Fin fan centre roughly 2.2 m above ground and about 8.5 m aft of the nose, near the tail end of the fuselage.
- **Pusher propeller:** none.

### Fuselage cross-sections (stations, nose to tail)
- Not sourced. I did not get a three-view drawing or a station table in this research pass. Recommend deriving stations from a Gazelle three-view (see Known gaps). If forced to start from the overall envelope (est.):

| Station | x from nose (m, est.) | Width (m, est.) | Height (m, est.) | Centre z above ground (m, est.) |
|---|---|---|---|---|
| Nose tip | 0.0 | 0.3 | 0.6 | 1.5 |
| Nose-cockpit | 1.0 | 1.3 | 1.5 | 1.7 |
| Cabin front | 2.5 | 1.5 | 1.9 | 1.9 |
| Cabin rear | 5.0 | 1.5 | 1.9 | 1.9 |
| Engine deck | 6.0 | 1.2 | 1.2 | 2.7 |
| Tail-cone start | 7.5 | 0.8 | 0.8 | 2.4 |
| Fin base | 9.5 | 0.4 | 1.8 | 2.4 |

(est.) Table is a placeholder, not a fit to any photo.

### Tail boom, engine housings, canopy
- **Tail boom:** none; the fenestron sits in the fin at the rear of the fuselage [src: Wikipedia Gazelle].
- **Engine:** one Turbomeca Astazou IIIA turboshaft, 440 kW (590 hp) [src: Wikipedia Gazelle]. Housing and exhaust position not sourced (est.: top rear of the fuselage, exhaust out the rear-top).
- **Cockpit canopy:** (real Gazelle) bubble-type, not sourced; (est.) rounded bubble. (film) "Apache-style canopies" [src: Blue_Thunder_(helicopter) page]; the cockpits were "tweaked to make them look a little more angular and militaristic" [src: slashgear].

### Top-view half outline and side-view outline
- Not produced: no reliable three-view was in my sources. Recommend tracing a Gazelle three-view from a manufacturer or museum page (see Known gaps).

### Landing gear
- **Type:** skids [src: thisdayinaviation; Wikipedia category "Aircraft with skid landing gear"].
- **Film:** "the skids were replaced with shorter models" [src: slashgear].
- **Real prototype:** used the engine, drive train, tail rotor and landing skids of an Alouette II [src: thisdayinaviation]. (Prototype only; the production Gazelle skid dimensions are not sourced.)
- **Track, skid length, height:** not sourced. (est.) Track about 2.4 m, skid length about 3.0 m, skid height about 0.4 m. Not verified.
- **Retractable:** no.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Black body with the number on the side** [src: slashgear: "both bodies were given a striking black paint job"]. The film numbering is not sourced; the MacGyver episode changed the number from "02" to "51" [src: Blue_Thunder_(helicopter) page].
2. **Bulky armoured nose and canopy** [fiction, film]: "bolt-on parts and Apache-style canopies" [src: Blue_Thunder_(helicopter) page]; "1 inch (25 mm) NORDOC-NATO armor" [fiction, from the film's own description].
3. **Chin turret with a six-barrel 20 mm rotary cannon** [fiction, film]: "chin turret with an electric 20 mm six-barrel rotary cannon" [src: Blue_Thunder_(helicopter) page]; slashgear calls it "a front-mounted electric cannon" [src]. The turret description is a film detail; I found no real Gazelle with a chin turret.
4. **Twin cheek-mounted Nitesun spotlights** [fiction].
5. **Fenestron tail** (real) [src]: 13 blades inside the fin, no open tail rotor. This is the shape kids can recognise on a real Gazelle.
6. **Rotor: three blades** (real) [src].
7. **Angular cockpit** [src: slashgear, the film cockpits were made "more angular and militaristic"].
8. **Video dome / cameras under the nose** [fiction, film: "an airborne TV camera with 100:1 zoom and night vision" plus an infrared thermograph; source: Blue_Thunder_(helicopter) page].

---

## 4. Paint and liveries

Important: **the film helicopter was black, not dark blue or grey.** The only source that describes its paint says "a striking black paint job" [src: slashgear]. The Wikipedia page gives no colour for the film scheme. A fan-forum post mentions a "very dark blue over black" scheme, but it describes a fictional LAPD variant, not the film aircraft, so I did not use it as a film scheme [unverified forum post: https://www.therpf.com/forums/threads/blue-thunder-helicopter-paper-model.334323 ; search result summary]. Hex values below are (est.) from my reading of the description, not from photographs.

1. **Film scheme (1983 film), black** [src: slashgear]. Hex: body (est.) #141414 near-black; trim (est.) #0A0A0A. Colours cover the whole airframe and canopy frames; canopy glass stays dark tint (est.) #1E2A33.
2. **MacGyver pilot (c. 1985)** [src: Blue_Thunder_(helicopter) page]: "a different paint job", colour not stated. Microphones and video package removed; number changed from "02" to "51". Hex: not sourced. (est.) Use a grey-blue #4A5560 as a placeholder; label it "unverified" in-game.
3. **Amerika miniseries (TV, mid-1980s)** [src: Blue_Thunder_(helicopter) page]: "black with red tail stripe and numbering", missile launchers on the pylons. Hex: black (est.) #141414; red stripe (est.) #B22222; numbers white (est.) #F2F2F2.
4. **Real N51BT / N52BT (registered civil aircraft)** [src]: registrations painted as the registration on the side and tail. Hex not sourced; (est.) use the same black scheme with white registration letters #F2F2F2.
5. **Fan-forum "LAPD" variant** (fictional, unverified): very dark blue over black (est.) #0E1A33 over #141414. Use only as a Legendary-tier mod with a note that it is a fan-made look, not a film fact.

### Suggested mod ladder (paint)
- **Free default:** black, with white registration numbers (scheme 1 / 4). [src: black body; registration on side]
- **Upgrade 1 (Amerika stripe):** black body with red tail stripe and white numbers (scheme 3). [src]
- **Upgrade 2 (MacGyver grey-blue):** grey-blue (est.) on the body, number 51 (scheme 2). [src: different paint; colour unverified]
- **Upgrade 3 (sensor pod):** add twin Nitesun lights and the top camera dome in matte grey (est.). [fiction: spotlights and camera]
- **Legendary:** dark blue over black (fan-made LAPD look, scheme 5). [fiction / unverified]

---

## 5. Armament and stores

- **Gun:** chin turret, six-barrel electric rotary 20 mm cannon, 4,000 rounds per minute, aimed with the "Harrison" helmet and "Harrison Fire Control System" [fiction, film; source: Blue_Thunder_(helicopter) page].
- **Turret position:** chin, under the nose, centred (est.) at x = 1.0 m from nose, z = 1.2 m above ground. [fiction placement]
- **Rockets, missiles:** none in the film. Missile launchers on the pylons in the *Amerika* miniseries [src: Blue_Thunder_(helicopter) page].
- **Door guns, hoists, cargo hooks:** none sourced for the film. (Real Gazelle variants may carry hoists or pylons; not verified.)
- **Hardpoints:** two pylons, one each side (est.) for missile launchers in the TV-series look [src for pylons existing: Blue_Thunder_(helicopter) page; positions est.].
- **Armour:** 25 mm NORDOC-NATO armour [fiction, film].

### Four-step kid-friendly weapons/stores mod ladder
1. **Free:** no weapon; just the black body, a spotlight pair in the "fiction" look, and the camera dome.
2. **Step 1 (Camera):** add the top camera dome and the cheek-mounted spotlights [fiction].
3. **Step 2 (Chin cannon):** add the chin turret with a six-barrel cannon [fiction], with a cannon sound that is not explosive.
4. **Step 3 (Pylon launchers):** add two pylon launcher pods, the Amerika look [src].
5. **Legendary:** all of the above plus the dark-blue LAPD paint (see section 4).

(Kid-friendly note: keep any weapons as "sound-only, no damage" and phrase them as "the cannon spins!" or "the camera zooms!" rather than destroy or kill language.)

---

## 6. Engines

- **Count:** one [src: Wikipedia Gazelle].
- **Type:** Turbomeca Astazou IIIA turboshaft, 440 kW (590 hp) [src: Wikipedia Gazelle].
- **Exhaust:** not sourced. (est.) Top rear of the engine deck, exhaust out the rear-top.
- **Top speed:** 310 km/h (190 mph, 170 kn) at sea level, Vne [src: Wikipedia Gazelle; thisdayinaviation gives 310 km/h (168 knots)]. thisdayinaviation says this made it "the fastest light helicopter produced at the time" [src].
- **Range:** 361 km at sea level with maximum fuel [src: Wikipedia Gazelle].
- **Fact about speed or lift:** the fenestron is "safer, as it was protected from ground strikes or from ground personnel walking into it" [src: thisdayinaviation]. Film "turbine boost" for speed is [fiction].

---

## 7. Other cool mods (specific to Blue Thunder)

- **Whisper mode:** a silent flight mode that "all but eliminated the vehicle's operation noise" [fiction, slashgear; Wikipedia: "'whisper mode' granted it the ability to operate in silence"].
- **Turbine boost:** a speed boost used for the 360-degree loop in the film [fiction; source: Blue_Thunder_(helicopter) page]. Note: the loop was flown by a radio-controlled model, not a full-size aircraft [src: Blue_Thunder_(helicopter) page].
- **Twin Nitesun spotlights** on the cheeks [fiction].
- **Infrared thermograph and night-vision TV camera** with 100:1 zoom [fiction].
- **Video recorder:** ¾-inch (19 mm) videotape in a belly locker [fiction].
- **Long-range microphones** that the film says could pick up "a mouse fart at two thousand feet" [fiction, source: Blue_Thunder_(helicopter) page]. Kid-appropriate note: use "a tiny mouse sound from far away" in game text.
- **Rotor-tip lights, winch, sling load, IR suppressors:** not sourced for Blue Thunder.

---

## 8. Sound

- **Real Gazelle:** the fenestron has a higher, whining tone than an open tail rotor (est.). The main rotor at 378 rpm with three blades gives a rhythmic "thump-thump" at low speed (est.). Not verified against recordings.
- **Film version (whisper mode):** near silence, with only a faint wind and turbine whistle; the film's own description is that operation noise was "all but eliminated" [fiction].
- **Film cannon:** a fast electric whirr with each burst (est.), not explosive.
- **Synth suggestions (est.):** main rotor as a 3-pulse per revolution amplitude modulation at 6.3 Hz (378 rpm / 60 = 6.3 rev/s, times 3 blades = 18.9 Hz blade-pass; use 18.9 Hz as the blade-slap fundamental). Fenestron as a 13-pulse at 6.3 × 13 ≈ 82 Hz whine, with a high-pass overtone. (derived; est. for tone.)

---

## 9. Fraction-friendly facts

- **Main rotor blades:** 3, so each blade is one third of the rotor (derived).
- **Fenestron blades:** 13 (a prime number), so each blade is 1/13 of the fan; no halves or quarters in that count (derived).
- **Real helicopters used in the film:** 2 flying airframes + 1 static model = 3 total, so 2 of 3 flew (derived) [src: Blue_Thunder_(helicopter) page].
- **Engines:** 1, so the whole power is from one engine (derived).
- **Crew (real):** 1 or 2 seats used [src]. Film crew: pilot and observer = 2 people (fiction).
- **Rotors:** 1 main + 1 fenestron = 2 rotors total (derived).
- **Chin cannon barrels:** 6 [fiction], so each barrel is one sixth of the cannon (derived).
- **Wheels:** 0. Skids: 2 (derived from skid landing gear).

---

## 10. Reference sources

Used (with what each supports):
- https://en.wikipedia.org/wiki/Aérospatiale_Gazelle: specifications (length 11.97 m, height 3.15 m, rotor 10.5 m, empty and max weight, 310 km/h, 361 km range, Astazou IIIA 440 kW), crew 1 or 2, first flight 7 April 1967, fenestron description.
- https://en.wikipedia.org/wiki/Blue_Thunder_(film): film release dates (13 May 1983 US, 5 February 1983 West Germany), "Turbine boost", "whisper mode", "NORDOC-NATO armor" and sensors.
- https://en.wikipedia.org/wiki/Blue_Thunder_(helicopter): real airframes (serials 1066 and 1075, built 1973, N51BT and N52BT), Cinema Air conversion, Apache-style canopies, chin turret 20 mm six-barrel cannon, Nitesun spotlights, MacGyver and Amerika variations, static model.
- https://www.thisdayinaviation.com/tag/aerospatiale-sa-341-gazelle/: 3-bladed main rotor, clockwise from above, 378 rpm, 13-blade fenestron (counter-clockwise seen from the left), fuselage 9.533 m, overall length 11.972 m, skid landing gear (Alouette II prototype), 310 km/h "fastest light helicopter".
- https://slashgear.com/1666499/blue-thunder-helicopter-history/ : "a striking black paint job", "more angular and militaristic" cockpit, "the skids were replaced with shorter models", TV series 11 episodes, cancelled after one season.
- https://www.therpf.com/forums/threads/blue-thunder-helicopter-paper-model.334323 : fan-forum mention of dark blue over black (fictional LAPD variant, not used as film fact).

Other pages seen in search (not read in full): fantastic-plastic.com (Blue Thunder model), cybermodeler.com (kit), ulsteraviationsociety.org (Gazelle history), helicopterforum.verticalreference.com (Blue Thunder topic).

Not reachable: https://en.wikipedia.org/wiki/Aérospatiale_Gazelle_in_fiction returned 404.

### Known gaps
- **Skid track, skid length and height** for the production Gazelle: not found.
- **Fuselage width and cabin cross-sections** at 8 stations: not found. No three-view drawing was read.
- **Hub x-position and hub height:** not sourced (estimates given above).
- **Tail fenestron height, x-position and diameter confirmation:** 0.695 m from one source; FAA table excerpt suggests 2.44 (unlabelled, unverified).
- **Blade chord and blade profile:** not sourced.
- **Engine exhaust position and housing shape:** not sourced.
- **Real seating layout** (side-by-side or tandem): not confirmed.
- **Film paint hex values:** none sourced; all hex values are (est.) from the description "black".
- **Conflict:** the user's brief said "dark blue/grey paint". Sources say the film helicopter was black. Dark blue appears only in a fan-made LAPD look.
- **Conflict:** the chin turret is described as a "chin turret" by Wikipedia but as "front-mounted" by slashgear. Treated as fiction either way.
- **Conflict:** Wikipedia infobox gives "Number built: 1" while the body text describes two flying airframes plus a static model. Body text used.
- **Weight of the film version:** modifications made the aircraft "so heavy that filmmakers needed tricks" [src: Blue_Thunder_(helicopter) page]; the added weight is not quantified.
