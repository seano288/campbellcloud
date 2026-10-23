# Kamov Ka-52 "Alligator" (and Ka-50 "Black Shark")

Tags: **[src]** = from a fetched/search source (see section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate, not sourced. Units: metres unless stated.

Conflict note: sources disagree on several numbers (Ka-52 length, height, weight, engine, top speed). Where they do, every value is listed with its source rather than picking one.

---

## 1. Identity

- **Full name:** Kamov Ka-52 "Alligator" (Ka-52 is the two-seat version). Ka-50 "Black Shark" is the single-seat parent. [src: Wikipedia Ka-50 and Ka-52 pages, via WebFetch]
- **NATO reporting names:** Ka-50 = Hokum-A; Ka-52 = Hokum-B. [src: armedconflicts.com/topic/view/872, search result]
- **Nicknames:** Ka-50 "Black Shark" (Chyornaya akula); Ka-50 also called "Werewolf" after a werewolf image on its rudder at Farnborough; Ka-50N "Night Shark"; Ka-52K "Katran"; Ka-52 in Egypt, proposed "Nile Crocodile". [src: Wikipedia Ka-50 page, WebFetch]
- **Maker:** Kamov design bureau; Ka-50 built by the Progress company in Arsenyev. [src: Wikipedia Ka-50 spec section, WebFetch]
- **First flight:** Ka-50 on 17 June 1982; Ka-52 on 25 June 1997. [src: Wikipedia Ka-50 and Ka-52 infobox, WebFetch]
- **In service:** Ka-50 fielded with the Russian army from 28 August 1995 [src: Wikipedia Ka-50 infobox]. Ka-52 entered service in May 2011 [src: Wikipedia Ka-52 text, WebFetch].
- **Role:** Attack helicopter (anti-tank, ground attack). [src: general, Wikipedia]
- **Crew:** Ka-52 = **2 seats, side-by-side** cockpit (pilot and navigator-operator). [src: SkyBrary "two-seat side-by-side cockpit", WebFetch; ru.wikipedia Ka-52, WebFetch]. Ka-50 = **1 seat**. [src: Wikipedia Ka-50 spec]
- **Production:** Ka-50 about 18-19 built; Ka-52 more than 196 built. [src: Wikipedia Ka-50/Ka-52 infobox, WebFetch]

### Kid-friendly voice lines

Each line is true and under 12 words. Source noted.

1. "Alligator has two rotors stacked on top of each other!" (coaxial rotors, [src: SkyBrary Ka-52, WebFetch])
2. "It has no tail rotor at all, so it flies differently!" (Ka-50 page: coaxial design removes the need for a tail rotor [src: Wikipedia Ka-50, WebFetch])
3. "Each of its rotors is about fourteen and a half metres across!" (14.5 m each [src: flugzeuginfo Ka-52, WebFetch; Wikipedia Ka-50])
4. "Its two seats sit side by side, like seats in a car." ([src: SkyBrary Ka-52, WebFetch])
5. "Before the pilot escapes, the rotor blades blow off first!" ([src: Wikipedia Ka-50 ejection seat section, WebFetch])
6. "Its ejection seat works at all heights and speeds!" (Ka-50 page wording: "at all altitudes and speeds" [src: Wikipedia Ka-50, WebFetch]. NOTE: ru.wikipedia gives a 0 to 4100 m range for the K-37-800M, so the "all heights" claim is disputed. Prefer line 5 if unsure.)
7. "Its two engines together have almost five thousand horsepower!" (2 × 2,400 shp = 4,800 shp, derived [src: Wikipedia Ka-50, WebFetch; ru.wikipedia Ka-52])
8. "Its top speed is over three hundred kilometres an hour!" (Ka-50 max 315 km/h [src: Wikipedia Ka-50, WebFetch]. Ka-52 sources differ: 300 km/h [src: ru.wikipedia] and 350 km/h [src: flugzeuginfo]. Only the Ka-50 figure is >300 in all cases, so line 8 is safe for Ka-50 only.)

---

## 2. Geometry for procedural modelling

### Overall
- **Length, rotors turning:** 16.00 m (52 ft 6 in). [src: flugzeuginfo Ka-52; Wikipedia Ka-50; aerospaceweb Ka-50 "rotors turning"]
- **Length, rotors not turning / fuselage length:** Ka-52 fuselage 13.53 m [src: flugzeuginfo Ka-52]. Other values: 13.50 m [src: SkyBrary Ka-52]; 14.2 m [src: ru.wikipedia Ka-52]. Ka-50 "ignoring rotors" 15.00 m [src: aerospaceweb Ka-50]. **Use 13.5 m for the fuselage (derived from the two closest sources)**, then check against a three-view.
- **Height (to top of rotor head):** 4.93 m (16 ft 2 in) on Ka-50 [src: Wikipedia Ka-50; aerospaceweb Ka-50 "to top of rotor head"]. Ka-52 values: 4.95 m [src: flugzeuginfo]; 5.0 m [src: ru.wikipedia]; 4.9 m [src: airforce-technology.com, search result]; 5.40 m [src: SkyBrary Ka-52, an outlier]. **Use about 4.95 m.**
- **Fuselage width:** not found in any source. The ru.wikipedia width field is empty. The 7.34 m figure that one armedconflicts table labels "Fuselage Width" is actually the stub-wing span (see below). (est.) about 1.6 m or less, judging from photos; not verified.
- **Stub-wing span:** 7.34 m (24.08 ft). [src: aerospaceweb Ka-50 labels it "Wingspan"; Revell CM 04483 kit manual lists Spannweite 7,34 m for Ka-52, search result]. SkyBrary lists "Wingspan 14.50 m", which is almost certainly the rotor diameter and not a wing; do not use it.

### Main rotors (two, coaxial, contra-rotating)
- **How many:** Two rotors, one above the other on the same mast. Ka-52 has **twin coaxial three-blade rotors**. [src: SkyBrary Ka-52, WebFetch; Wikipedia Ka-50 "3-bladed contra-rotating main rotors"]
- **Diameter (each rotor):** 14.5 m (47 ft 7 in). Both rotors are the same size. [src: Wikipedia Ka-50 "2 × 14.5 m"; flugzeuginfo Ka-52 14.50 m; ru.wikipedia Ka-52 14.5 m]. Other values: 14.45 m [src: armedconflicts.com, search result]; 14.43 m [src: search result].
- **Rotor disc area (one rotor):** 165.1 m² [src: flugzeuginfo Ka-52]. (derived: π × 7.25² = 165.1). Ka-50 total "main rotor area" 330.3 m² [src: Wikipedia Ka-50] = 2 × 165.1 (derived).
- **Blades per rotor:** 3 (so 6 blades in total). [src: flugzeuginfo "rotor blades 3/3"; Wikipedia Ka-50]
- **Blade material:** polymer blades (Ka-50). [src: Wikipedia Ka-50 "polymer blades"]
- **Blade chord:** not found. (est.) about 0.4 to 0.5 m. Not verified.
- **Direction of spin:** The rotors are counter-rotating (one spins the opposite way to the other). [src: Wikipedia Ka-50 "contra-rotating"]. **Which rotor turns which way seen from above was not found in any source** (gap).
- **Mast/hub height and disc heights:** see the dedicated subsection below.

### Rotor disc heights (both discs)

**This was the specific request, and no source gives it.** No source gives the hub height above ground, the spacing between the two rotors, or the height of either disc. The searches and fetches for these all came up empty (ru.wikipedia, SkyBrary, flugzeuginfo, aerospaceweb, a combined search).

What is known and sourced:
- The overall height to the **top of the rotor head** is 4.93 to 4.95 m [src: Wikipedia Ka-50; aerospaceweb Ka-50]. The upper rotor sits at the top of the mast, so its disc is at or just below the top of the rotor head.

My estimates (est., not verified, treat as placeholders):
- **Upper rotor disc height:** about **4.7 m** above ground, at the rotor head (est.; top of the head is 4.93 m).
- **Lower rotor disc height:** about **4.0 m** above ground (est.), roughly 0.6 to 0.9 m below the upper disc. Plausible range 3.8 to 4.3 m.
- **Gap between the two discs:** about 0.6 to 0.9 m (est.), not sourced.
- The "top of rotor head" definition means a real photo or three-view should confirm these before modelling. A quick check on a Ka-52 three-view would settle it.

### Anti-torque
- **Tail rotor:** none. The coaxial design removes the need for one. [src: Wikipedia Ka-50 "removes the need for a tail rotor"]. The source adds that a tail rotor can use up to 30% of engine power (a claim from the Wikipedia Ka-50 page).
- **Fenestron, NOTAR, pusher prop:** none.

### Fuselage
- **Cross-sections at ~8 stations:** not found in any source. (est.) Build from a side and top view when a three-view is available.
- **Overall proportions:** slim, long, low, with a broad nose. (est.)
- **Tail boom:** not load-bearing. A Ka-50 lost its tail in testing and returned to base. A video dated 19 June 2023 shows a Ka-52 losing its tail. [src: Wikipedia Ka-50 and Ka-52 text, WebFetch]. Tail boom length and diameter: not found (gap).
- **Engine housings:** two engines, side by side, mounted above the fuselage, one each side. Exhaust direction: not verified (gap; est. rear/up).
- **Cockpit canopy:** two-seat side-by-side canopy on the Ka-52. Shape: not found (gap).
- **Top-view and side-view (x, y) outlines:** not found. Requires a three-view; not attempted (gap).

### Tail surfaces
- **Vertical fin:** present; height and area not found (gap).
- **Horizontal stabiliser:** span, chord and position not found (gap).

### Stub wings
- **Span:** 7.34 m (24.08 ft). [src: aerospaceweb Ka-50; Revell CM 04483 Ka-52 kit manual]
- **Hardpoints:** 6 under-wing hardpoints, plus 2 wingtip stations on the Ka-50. [src: Wikipedia Ka-50 spec]. The ru.wikipedia Ka-52 page says 6 hardpoints (4 on early aircraft). **Use 6 under-wing hardpoints in total, 3 per wing (est. split); wingtip stations on the Ka-50 only.**

### Landing gear
- **Type:** Fixed tricycle? Not verified. Sources did not describe it. (gap; est. skids or fixed wheels, retractable? unknown). This needs confirming before modelling.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two rotors stacked on one mast** (coaxial). This is what makes it instantly unlike a normal helicopter. [src: SkyBrary; Wikipedia]
2. **No tail rotor**: a short, bare tail boom with nothing spinning on the back. [src: Wikipedia Ka-50]
3. **Two seats side by side**, with a wide cockpit canopy (Ka-52). [src: SkyBrary]
4. **Stubby stub wings** with pods on the ends (Ka-50 has wingtip stations). [src: Wikipedia Ka-50]
5. **Chin/nose gun**: the 30 mm 2A42 cannon sits under the nose. Position not verified in a source; (est.) nose-mounted. [src: Wikipedia Ka-50 gives the cannon, not its position]
6. **Long slim body with a low, wide nose**. (est.)
7. **Rockets and missile rails on the wings**, with the wing-mounted anti-tank missiles. [src: Wikipedia Ka-50]

---

## 4. Paint and liveries

**Not researched in this pass.** The brief asks for 4 to 6 real schemes with hex colours; I did not search for these, so the list below is my estimate and needs a real reference before use.

Estimated schemes (est., hex values are guesses):
1. **Russian Army service, green-brown camouflage:** olive/dark green `#4B5320` (est.), brown `#6B4F2A` (est.), tan `#A08A5A` (est.). Typical on Ka-52 in service.
2. **Dark black Ka-50 "Black Shark" demo:** matte black `#1B1B1B` (est.), with a white nose stripe (est.). Ka-50 and display aircraft.
3. **Night-ops grey:** dark grey `#3A3F44` (est.).
4. **Export or Egypt paint:** tan and sand `#C8B68A` (est.); no source checked.

Suggested mod ladder (suggested):
- **Free default:** Russian army green-brown camouflage.
- **Upgrade 1:** Black Shark matte black.
- **Upgrade 2:** Night grey.
- **Upgrade 3:** Desert tan (export).
- **Legendary:** the "werewolf" theme, after the werewolf image on a Ka-50 rudder shown at Farnborough [src: Wikipedia Ka-50 nickname note]. Colours not verified.

---

## 5. Armament and stores

- **Main gun:** one 30 mm Shipunov 2A42 cannon, 460 rounds. [src: Wikipedia Ka-50 spec; ru.wikipedia Ka-52]. Position: under the nose, (est.); not verified in a source.
- **Gun pods (Ka-52):** two UPK-23-250 pods, each with a 23 mm GSh-23L gun, 250 rounds each. [src: ru.wikipedia Ka-52, WebFetch]
- **Anti-tank missiles:** up to 12 Vikhr (Ka-50 spec). [src: Wikipedia Ka-50 body text]. Plus 2 LMUR (laser-guided missile) on the Ka-50. [src: Wikipedia Ka-50]
- **Air-to-air:** Igla-V (Ka-52). [src: ru.wikipedia Ka-52]
- **Rockets:** S-8 and S-13 unguided rocket pods. [src: Wikipedia Ka-50 body]
- **Bombs:** free-fall bombs. [src: ru.wikipedia Ka-52]
- **Countermeasures pods.** [src: Wikipedia Ka-50 body]
- **Hardpoints:** 6 under-wing hardpoints plus 2 wingtip points (Ka-50). [src: Wikipedia Ka-50 spec]. Max stores load 2,000 kg (Ka-50) [src: Wikipedia Ka-50]; ru.wikipedia gives 2,800 kg (6 points) and 2,000 kg (4 points).

### 4-step kid-friendly weapons ladder
1. **Cannon:** the 30 mm cannon, described to a kid as "a big gun".
2. **Rocket pods:** S-8 and S-13 rocket pods on the wings.
3. **Gun pods:** the 23 mm gun pods.
4. **Missiles:** the Vikhr missile rails for the Legendary tier.

(No gore or kill language; use "it has a big gun" and "it carries rockets".)

---

## 6. Engines

- **Count and type:** 2 turboshaft engines. Ka-50: Klimov VK-2500. Ka-52: sources disagree. Wikipedia says the VK-2500 was introduced on the Ka-52 [src: Wikipedia Ka-52]; flugzeuginfo says TV3-117VMA [src: flugzeuginfo Ka-52]; SkyBrary says TV3-117VK [src: SkyBrary Ka-52]. Use the VK-2500 for the Ka-52 unless a better source appears.
- **Power per engine:** 1,800 kW (2,400 shp) for the VK-2500 [src: Wikipedia Ka-50]; 1,638 kW (2,197 shp) for the Ka-52 per flugzeuginfo; 1,660 kW (2,226 shp) per SkyBrary. ru.wikipedia says 2,400 shp takeoff, 2,700 shp emergency. **Use 2,400 shp each on the Ka-52.**
- **Exhaust positions:** not verified (est.: rear-upper, above the tail boom).
- **Top speed:** Ka-50 315 km/h (196 mph) [src: Wikipedia Ka-50]. Ka-52: 300 km/h maximum [src: ru.wikipedia]; 350 km/h [src: flugzeuginfo]; 190 kt cruise [src: SkyBrary].
- **Fact:** A coaxial rotor pair needs no tail rotor, which can use up to 30% of engine power [src: Wikipedia Ka-50 body text].

---

## 7. Other cool mods

- **Rotor-tip or nav lights:** none verified (gap).
- **Searchlight, winch, sling load:** none verified (gap).
- **IR suppressors:** not verified (gap).
- **Cannon pods and rocket pods** (see section 5).
- **Ejection-seat rotor-blade blowoff:** a fun visual effect for the Legendary tier. Sourced: the explosive charges blow off the rotor blades before ejection [src: Wikipedia Ka-50]. Keep it cartoon-soft: "the blades pop off first".

---

## 8. Sound

- **Coaxial twin rotors:** two overlapping blade-chop tones, one slightly out of step with the other, creating a "wup-wup" beat. (est.; no source)
- **Engines:** two turboshafts, a rising whine on spool-up and a soft roar at speed. (est.)
- **Blade slap:** present at low speed; described qualitatively only. (est.)
- **Pitch:** a fairly deep, heavy thrum from 14.5 m rotors. (est.)

---

## 9. Fraction-friendly facts

- **Rotors:** 2 rotors, so each rotor is one half of the lift system. [derived]
- **Blades:** 3 blades per rotor, 6 blades in total. Each rotor's blades are one third of that rotor. Each blade is one sixth of the whole set. [derived from flugzeuginfo and Wikipedia Ka-50]
- **Seats:** 2 seats in the Ka-52 (one half is the pilot seat, one half the operator seat). [src]. Ka-50: 1 seat.
- **Engines:** 2 engines, so each engine is one half of the power. [src]
- **Tail rotors:** 0. It has no tail rotor at all. [src: Wikipedia Ka-50]
- **Hardpoints:** 6 under-wing plus 2 wingtip points (Ka-50) = 8 stores points. (derived)
- **Gun:** 1 cannon with 460 rounds. (src)
- **Gun pods (Ka-52):** 2 pods, each 250 rounds. (src)
- **Stub wings:** 2 wings. (src)

---

## 10. Reference sources

Fetched or searched in this pass:

- Wikipedia, Ka-50 article: https://en.wikipedia.org/wiki/Kamov_Ka-50 (spec section, ejection seat, coaxial notes, first flight, production)
- Wikipedia, Ka-52 article: https://en.wikipedia.org/wiki/Kamov_Ka-52_Alligator (first flight, service entry, production; spec section covers the Ka-50 only)
- Wikipedia, Ka-52 (URL form without "Alligator"): https://en.wikipedia.org/wiki/Kamov_Ka-52 (returned Ka-50 spec, not used)
- Russian Wikipedia, Ka-52: https://ru.wikipedia.org/wiki/Ка-52 (spec table in Russian, ejection seat K-37-800M altitude range)
- Flugzeuginfo, Ka-52 (EN): https://www.flugzeuginfo.net/acdata_php/acdata_ka52_en.php (dimensions, rotor area, engines, weights)
- Flugzeuginfo, Ka-50 (EN): https://www.flugzeuginfo.net/acdata_php/acdata_ka50_en.php (search result only, not fetched)
- SkyBrary, Ka-52: https://skybrary.aero/aircraft/ka52 (two-seat side-by-side cockpit, twin coaxial three-blade rotor, engines, dimensions)
- Aerospaceweb, Ka-50: https://aerospaceweb.org/aircraft/helicopter-m/ka50 (length, height to top of rotor head, stub wing span 7.34 m, disc area)
- ArmedConflicts, Ka-52: https://www.armedconflicts.com/topic/view/872 (search result; 14.45 m rotor; 7.34 m labelled fuselage width, which is wrong)
- Army Recognition, Ka-52: https://armyrecognition.com/military-products/air/helicopters/attack-helicopters/ka-52-alligator-hokum-b-kamov (attempted; spec not returned, WebFetch gave an unrelated page)
- Revell kit manual CM 04483 (Ka-52 span 7.34 m): https://downloads.revell.de/Manuals-Modelkits/CM_04483.pdf (search result, redirected, not fully read)
- NNU page: https://www3.nnu.edu/ka-52-alligator-attack-helicopter_88802.html (search result, self-contradictory, not used)

Three-view drawings: none found in this pass.

### Known gaps

1. **Rotor disc heights (upper and lower), hub height above ground, and the gap between the two rotors.** The main request. Not in any source. Estimates above are labelled (est.). A three-view or side photo with a ruler would settle it.
2. **Which rotor spins which way seen from above.** Not found.
3. **Fuselage width and fuselage cross-sections at ~8 stations.** Not found.
4. **Ka-52 fuselage length, height, and weights disagree across sources.** Use values above but verify.
5. **Ka-52 engine model disagrees** (VK-2500 vs TV3-117VMA vs TV3-117VK). Not resolved.
6. **Top speed for the Ka-52** disagrees (300 vs 350 km/h). Not resolved.
7. **Tail boom length, vertical fin, horizontal stabiliser.** Not found.
8. **Landing gear type** (fixed or retractable, wheels or skids). Not found.
9. **Canopy shape, nose sensor position, exhaust positions.** Not found.
10. **Liveries and hex colours.** Not researched; estimates only.
11. **Blade chord.** Not found.
12. **Stub-wing span** is 7.34 m from two sources, but SkyBrary's 14.50 m "wingspan" is probably the rotor and was ignored.
13. **Ejection seat altitude range** disputed: "all altitudes" (Wikipedia Ka-50) vs 0 to 4100 m (ru.wikipedia). Not resolved.
14. **Sound description** is from general knowledge, not a source.
