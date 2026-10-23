# Sikorsky Raider X (and S-97 Raider, Sikorsky X2): research notes for a procedural 3D hangar model

Tags: **[src]** = from a fetched source (URLs in section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate. Units metres unless stated. Raider X is only partly published; the S-97 is the best-documented sibling and is used where Raider X dimensions are missing.

Important naming note: Wikipedia calls the Raider X the **S-102**. The S-97 and X2 are separate flying aircraft.

---

## 1. Identity

**Raider X** (Sikorsky Raider X, S-102)
- **Maker:** Sikorsky Aircraft (Lockheed Martin). Fuselage was contracted to Swift Engineering. [src: Wikipedia Sikorsky_Raider_X]
- **Role:** Reconnaissance and attack compound helicopter, built for the US Army's FARA competition. [src: Wikipedia]
- **Announced:** 14 Oct 2019 at the AUSA meeting. [src: Wikipedia; Vertical Magazine 2019]
- **First flight:** Not stated in sources. The prototype was powered up in April 2024 with no flight plans. [src: Wikipedia]
- **In service:** Never. Prototype only. Cancelled with FARA (see section 10).
- **Crew:** Two, side-by-side seats. [src: Wikipedia; Vertical Magazine]

**S-97 Raider** (flying predecessor)
- **Maker:** Sikorsky Aircraft (Lockheed Martin). [src: Wikipedia Sikorsky_S-97_Raider]
- **First flight:** 22 May 2015. [src: Wikipedia]
- **Crew:** Pilot seating is side-by-side. The infobox gives 0–2 pilots; the design text says a two-person flight crew. [src: Wikipedia]
- **Built:** Infobox says 3; text describes 2 prototypes. Unresolved. [src: Wikipedia]

**Sikorsky X2** (speed demonstrator)
- **Maker:** Sikorsky Aircraft / Schweizer Aircraft. [src: Wikipedia Sikorsky_X2]
- **First flight:** 27 Aug 2008, Horseheads, New York. [src: Wikipedia]
- **Retired:** 14 Jul 2011, after 23 test flights. Displayed at the Steven F. Udvar-Hazy Center, Chantilly, Virginia, from Oct 2016. [src: Wikipedia]
- **Crew:** Two. [src: Wikipedia]

### Kid-friendly voice lines (8 lines, each under 12 words)

1. "It has two rotors, one on top of the other!" (9 words). Coaxial main rotor. [src: Wikipedia Raider X; Vertical Magazine]
2. "Its two rotors turn in opposite directions!" (8 words). Counter-rotating. [src: Wikipedia Sikorsky X2 ("contra-rotating")]
3. "A big propeller in back pushes it forward!" (8 words). Pusher propulsor. [src: Vertical Magazine ("aft pusher propulsor"); Wikipedia S-97 (pusher propeller)]
4. "Two pilots sit side by side in its cockpit!" (8 words). [src: Wikipedia Raider X; Vertical Magazine]
5. "It was built to scout ahead, then attack!" (8 words). Reconnaissance and attack role. [src: Wikipedia Raider X]
6. "It is built to fly faster than most helicopters!" (9 words). The design target is above 250 knots, though this is expected, not measured. [src: Wikipedia Raider X] (Wording is a design goal, so it is phrased as "built to".)
7. "Its ancestor, the X2, flew 250 knots in 2010!" (9 words). Test pilot Kevin Bredenbeck, 15 Sep 2010. [src: Wikipedia Sikorsky X2]
8. "Its rotors are as wide as a school bus is long!" (10 words). Raider X rotor is 12 m; a school bus is about 12 m long (est. comparison, bus length not sourced). [src: Wikipedia Raider X rotor; bus length est.]

Fiction framing is not needed. These are all about a real helicopter.

---

## 2. Geometry for procedural modelling

### 2a. Overall

| Item | Raider X | S-97 Raider | X2 |
|---|---|---|---|
| Fuselage length | not published | **11 m** (35 ft) [src: Wikipedia S-97]; 11.0–11.2 m in other sources [src: Air Recognition; Sprinkle] | not published |
| Height | not published | not listed [src: Wikipedia] | not published |
| Width (fuselage) | not published; "widened" to fit internal weapons [src: Vertical Magazine] | 4.8 m [src: Air Recognition] (est. for cabin) | not published |
| Overall rotor span (tip to tip, coaxial) | **12 m** per rotor (39 ft; 11.9 m) [src: Wikipedia; Vertical Magazine] | 10 m per rotor (34 ft) [src: Wikipedia] | 8.05 m per rotor (26 ft 5 in) [src: Wikipedia] |
| Stub wing span | none | none published | none |
| Tail | pusher propeller at tail; no separate tail rotor | same | same |

Scale ladder (derived):
- Raider X rotor / S-97 rotor = 12 / 10 = **1.2** (derived). Vertical Magazine says the Raider X is "20 percent larger" than the S-97, which matches. [src]
- Raider X rotor / X2 rotor = 12 / 8.05 = **1.49** (derived).

**Raider X length (est.):** The S-97 is ~11 m. If Raider X is 20% larger overall (Vertical Magazine), the length is about **13 m (est.)**. Not sourced.

### 2b. Main rotors

- **Count:** 2 coaxial rotors on one mast, one above the other. [src: Wikipedia Raider X; Vertical Magazine]
- **Blade count per rotor:**
  - Raider X: **not published** (gap).
  - S-97: **not listed** in infobox (gap).
  - X2: **4 blades per rotor, 8 total**. [src: Wikipedia Sikorsky X2]
- **Diameter:** Raider X 12 m (39 ft) per rotor [src]; S-97 10 m (34 ft) [src]; X2 8.05 m (26 ft 5 in) [src].
- **Rotation:** Counter-rotating (contra-rotating). [src: Wikipedia X2]. Rotation direction seen from above is not stated for Raider X. (est.) Use top rotor clockwise and bottom counter-clockwise when viewed from above, so the two blades oppose torque.
- **Disc area (X2 only):** 548 sq ft (50.9 m²) for one rotor set. [src: Wikipedia X2]. Raider X and S-97 disc area not published.
- **Hub / mast height above ground:** not published for any of the three (gap).
- **Hub position along fuselage (x from nose):** not published (gap). (est.) Place the mast just aft of the cockpit, about one-third of the fuselage length from the nose.
- **Blade chord:** not published (gap). (est.) about 0.5 m at mid-span for a 12 m rotor.
- **Rotor speed (X2 data):** 446 RPM, dropping to 360 RPM above 200 knots to keep tip speed below Mach 0.9. [src: Wikipedia X2]

### 2c. Anti-torque and propulsion

- **Anti-torque:** Coaxial counter-rotation. **No tail rotor** on Raider X, S-97, or X2. [src: Wikipedia X2 and S-97 specs list no tail rotor]
- **Pusher propeller:**
  - Raider X: a single "aft pusher propulsor" [src: Vertical Magazine]. Diameter and blade count are **not published** (gap).
  - S-97: 1 × 6-blade, variable-pitch, clutchable pusher propeller, **2.1 m (7 ft) diameter** [src: Wikipedia S-97]. Air Recognition also gives 2.13 m [src].
  - X2: 6-blade pusher; diameter not stated [src: Wikipedia X2].

### 2d. Fuselage stations

**Not sourced.** No three-view drawing was fetched. The brief asks for ~8 cross-section stations, and I could not provide real values. For a procedural start, use the S-97 length and rough proportions as (est.):
- Nose at x = 0, tail boom end at x = 11 (S-97 scale; Raider X ~13 (est.)).
- Cockpit: two side-by-side seats, canopy roughly from x = 0.5 to x = 3.0 (est.).
- Cabin/weapon bay widest at x = 3–6 (est.; the Raider X fuselage widened to add internal weapon storage [src: Vertical Magazine]).
- Pusher propeller at the tail, x ≈ 11–12 (est.).

Engines: single turboshaft, mounted in the fuselage (not nacelles). (est.) Place it on the top-rear of the fuselage with the exhaust aft.

### 2e. Tail surfaces, stub wings, landing gear

- **Tail fin / stabiliser:** not published (gap).
- **Stub wings:** not published as a feature (gap). Weapons carried internally in the widened fuselage [src: Vertical Magazine] and on external hardpoints for the S-97 [src: Lockheed Martin].
- **Landing gear:** not stated for any of the three (gap). (est.) Skids are common on this class of helicopter. The S-97 is a light helicopter with skid-type gear in most photos (est., not verified).

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two rotors stacked on one mast**, coaxial and counter-rotating, with no tail rotor.
2. **Pusher propeller at the very back** of the tail boom, the signature of the compound design.
3. **Slim, small two-seat cockpit** side by side (sideways seating, not tandem).
4. **Compact fuselage with an open tail boom**, shorter than most attack helicopters.
5. **Wider fuselage on the Raider X** than the S-97 (added internal weapon storage). [src]

---

## 4. Paint & liveries

**Gap.** I did not find sourced livery descriptions or colour data for the Raider X, S-97, or X2 in the fetched sources. Per the brief, I am not inventing real schemes or hex values.

Documented facts that matter for paint:
- The S-97 was used as an **80% scale model of the Raider X** [src: Vertical Magazine]. Its appearance is closest to the Raider X.
- The X2 is retired and displayed at the Udvar-Hazy Center, Chantilly, Virginia [src: Wikipedia]. Its museum finish is not described in the sources.

**Suggested ladder (not sourced, placeholder):** the brief asks for a free default, three upgrades, and one Legendary. Until real colour data is found:
- Free default: matte grey (est. hex #5E6670).
- Upgrade 1: desert tan (est. #B9A27A).
- Upgrade 2: olive drab (est. #4B5A3A).
- Upgrade 3: gloss white with red stripe (est. #F2F2F2 / #C0392B).
- Legendary: X2 test-finish scheme, once a photo is found (gap).

All hex values are estimates, not from any source.

---

## 5. Armament & stores

Sources cover the S-97 and the Raider X's intended loadout. Raider X armament is not separately dimensioned.

- **Guns:** .50 cal gun with 500 rounds; a 7.62 mm gun also listed [src: Wikipedia S-97; Lockheed Martin].
- **Rockets:** 7-shot rocket pod(s); 2.75 in rockets [src: Wikipedia S-97; Lockheed Martin].
- **Missiles:** Hellfire missiles [src: Lockheed Martin].
- **Internal storage:** The Raider X's widened fuselage was for internal weapons storage [src: Vertical Magazine].
- **Hardpoint positions:** not published (gap).
- **Door guns, hoists, cargo hooks:** not in sources (gap).

### Kid-friendly weapons/stores mod ladder (4 steps, no violence, "hits" framed as tools)
1. **Free:** no extra gear.
2. **Rocket pod:** 7 rockets in a pod on the side.
3. **Gun:** a .50 cal gun for the front.
4. **Hellfire:** missiles tucked in the body, the top upgrade.

---

## 6. Engines

| Aircraft | Engine | Power | Source |
|---|---|---|---|
| Raider X | 1 × GE T901 turboshaft | 3,000 shp (2,200 kW) | [src: Wikipedia] |
| S-97 | 1 × GE YT706 | 2,600 shp (1,900 kW) | [src: Wikipedia] |
| X2 | 1 × LHTEC T800-LHT-801 | 1,800 shp (1,300 kW) | [src: Wikipedia] |

- **Engine count:** 1 for all three. (derived)
- **Exhaust:** Not described in sources (gap). (est.) Top-rear exhaust, aft of the mast.
- **Speed:**
  - S-97: cruise 250 mph (220 kn); never exceed 280 mph (240 kn). [src: Wikipedia]
  - X2: 290 mph (250 kn) level flight; 300 mph (260 kn) shallow dive. [src: Wikipedia]
  - Raider X: expected above 250 kn, not measured. [src: Wikipedia]
- **Speed fact:** The X2 reached 250 knots in level flight, a speed the sources describe as far above a conventional helicopter's typical cruise. [src: Wikipedia X2] Use the 250-knot figure, not a "twice as fast" claim, which these sources do not give.

---

## 7. Other cool mods specific to this helicopter

- **Pusher prop reverse:** The Lockheed Martin page says the propeller can reverse thrust to slow descent. [src: Lockheed Martin]
- **Clutchable propeller:** The S-97 pusher propeller is "clutchable" (can be disengaged). [src: Wikipedia] Useful as a mod ("prop can switch off").
- **Variable-pitch propeller:** Same source. [src]
- **Fuel:** S-97 has an optional internal auxiliary fuel tank for extended range. [src: Lockheed Martin]
- **Weapon bay:** Raider X internal weapon storage (open-bay mod). [src: Vertical Magazine]
- **Searchlight / rotor-tip lights / winch / sling load:** not in sources (gap).

---

## 8. Sound

(est.) These are not from a source; they are from typical coaxial and pusher-prop helicopter sound.
- Low, two-layered rotor thump with a steady beat (coaxial rotors slightly out of sync).
- Higher-pitched turbine whine from the single engine, rising with throttle.
- A sharp prop "whoosh" from the pusher at the back, more like an airplane than a helicopter.

---

## 9. Fraction-friendly facts

- **Rotors:** 2 (one on top, one below) [src]. So each rotor is **one half** of the rotor system.
- **Blades (X2):** 4 per rotor, 8 total. Each rotor is **one half** of the blades, and one blade is **one eighth** of the total. [src: X2]
- **Blades (S-97 / Raider X):** not published (gap). Do not put a number on this.
- **Pusher propeller blades (S-97):** 6. One blade is **one sixth** of the propeller. [src]
- **Engines:** 1. [src]
- **Crew seats:** 2, side by side. Each seat is **one half** of the crew. [src]
- **Wheels / doors / hardpoints:** Not published (gap).

---

## 10. Reference sources

URLs used:
- Wikipedia, Sikorsky Raider X (S-102): https://en.wikipedia.org/wiki/Sikorsky_Raider_X
- Wikipedia, Sikorsky S-97 Raider: https://en.wikipedia.org/wiki/Sikorsky_S-97_Raider
- Wikipedia, Sikorsky X2: https://en.wikipedia.org/wiki/Sikorsky_X2
- Vertical Magazine, "Sikorsky reveals Raider X for Army's FARA program" (14 Oct 2019): https://verticalmag.com/news/sikorsky-reveals-raider-x-for-armys-fara-program/
- Vertical Magazine, "Raider X compound fast-attack helicopter 60% complete": https://verticalmag.com/news/raider-x-compound-fast-attack-helicopter-60-complete/ (search snippet only, not fetched)
- Lockheed Martin, S-97 Raider product page: https://lockheedmartin.com/en-us/products/s-97-raider.html
- DefenseScoop, "Army FARA helicopter cancelled" (8 Feb 2024): https://defensescoop.com/2024/02/08/army-fara-helicopter-cancelled/ (search snippet only)
- Janes, "US Army cancels FARA and UH-60V": https://www.janes.com/defence-news/defence/latest/us-army-cancels-fara-and-uh-60v-in-revamp-of-aviation-acquisition-intends-to-purchase-additional-uh-60ms-and-ch-47fs (search snippet only)
- Air Recognition, S-97 Raider data sheet (search snippet only): https://www.airrecognition.com/index.php/world-air-force-aircraft/north-america/united-states-air-force/united-states-american-us-air-force-usaf-helicopter-technical-data-sheet-specifications-intelligence-description-information-identification-pictures-photos-images-video/2249-s-97-raider-light-tactical-helicopter.html
- Sprinkle, S-97 N971SK (search snippet only): https://sprinkle.com/aircraft/N971SK
- Helihub, X2 250-knot press item (search snippet only): https://www.helihub.com/?p=23117

Three-view drawings: **none found** in the fetched sources.

### Known gaps

1. **Raider X** length, height, blade count, blade chord, hub height, hub x-position, pusher propeller diameter, first flight date, and livery: not found in any fetched source.
2. **S-97** height, blade count, landing gear, and livery: not listed.
3. **X2** length, height, landing gear, and pusher propeller diameter: not stated.
4. **Hardpoint positions** for all three: not published.
5. **Source conflicts:** S-97 build count (3 in infobox vs 2 prototypes in text); S-97 weight (MTOW 11,000 lb per Wikipedia vs max gross 11,400 lb per Lockheed Martin); X2 weight (infobox MTOW 5,300–6,000 lb, with an internal inconsistency in wing loading and power/mass figures).
6. **FARA status:** Army announced cancellation 8 Feb 2024, effective end of fiscal 2024 [src: DefenseScoop snippet; Wikipedia]. Raider X was powered up in April 2024 with no flight plans [src: Wikipedia]. Whether the FARA wind-down used those funds is not confirmed.
7. **Raider X weight and power:** the weight (14,000 lb, expected) and power (3,000 shp) are sourced, but Vertical Magazine's "40-ft rotor disc" wording conflicts with the 39-ft figure. Use 39 ft (12 m).
