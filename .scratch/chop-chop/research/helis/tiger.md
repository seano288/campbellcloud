# Eurocopter (Airbus Helicopters) Tiger: research note

Tags: **[src]** = from a fetched/search source (see section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate. Units: metres unless stated. Where sources disagree, both values are given.

Searches on 2026-10-23. The English Wikipedia page was fetched but was truncated, so some items come from the first 100k characters only. The Tiger has no free 3D model here. All geometry below is for building in code.

---

## 1. Identity

- **Full name / designations:** Eurocopter Tiger; Tigre (French and Spanish); Tiger (German); designation **EC665** (Airbus Helicopters). [src: Wikipedia; aerospaceweb]
- **Variants named in sources:** HAP (French, *Hélicoptère d'Appui Protection*, escort/scout); HAD (French and Spanish, *Hélicoptère d'Appui Destruction*, the attack version, the one seen in most recent imagery); UHT (German *Unterstützungshubschrauber Tiger*, mast-mounted sight); ARH (Australian Armed Reconnaissance Helicopter); KHT (German, no gun turret). [src: Wikipedia; aerospaceweb]
- **Maker:** Eurocopter (now Airbus Helicopters), a Franco-German-Spanish programme. [src: Wikipedia, title/intro]
- **First flight:** 27 April 1991 per the Wikipedia infobox. The Wikipedia Variants section says 29 April 1991 for PT1; the Development section says 27 April 1991. Sources differ by a few days, and the year is consistent. [src: Wikipedia; boldentrance says 1991]
- **Prototypes (Wikipedia):** PT2 22 April 1993; PT3 19 November 1993; PT4 15 December 1994; PT5 21 February 1996. [src: Wikipedia]
- **In service:** Infobox says 2003. First Australian ARH delivery 15 December 2004; first French delivery 18 March 2005; first German delivery 6 April 2005; Spanish HAD deliveries from 2007. [src: Wikipedia]
- **Role:** Anti-tank attack, escort, scout, and fire support. [src: Wikipedia; aerospaceweb]
- **Crew:** 2, tandem seats (pilot in front, gunner or weapon systems officer behind). The "glass cockpit" is described as tandem. [src: Wikipedia; aerospaceweb]
- **Operators (current):** France (French Army, ALAT), Germany (German Army), Spain (Spanish Army). [src: Wikipedia]
- **Former:** Australia (Australian Army, 1st Aviation Regiment). The Australian Army announced the retirement on 23 September 2026. The 1st Aviation Regiment planned a sundown ceremony in Darwin on 30 September 2026, marking 20 years of Tiger service and the move to the AH-64E Apache. Wikipedia says all aircraft were retired as of 30 September 2026. One source says 22 helicopters cost A$1.1 billion. [src: theaviationist; australianaviation; migflug; Wikipedia]

### Kid-friendly voice lines

Each is true, under 12 words, and the source is noted.

1. "Tiger has two engines to help it fly really fast!" [src: Wikipedia engine count]
2. "Tiger's big rotor is thirteen metres across, wide as a bus is long." (A typical bus is about 12 m long, est.; rotor 13 m [src: Wikipedia; aerospaceweb].)
3. "Tiger's main rotor has four big blades, spinning round and round!" [src: Wikipedia, "four-bladed hingeless main rotor"]
4. "Two pilots sit in Tiger, one behind the other, like a train." [src: Wikipedia; aerospaceweb, "tandem"]
5. "Tiger has a spinning gun under its nose, called a turret!" [src: aerospaceweb; Wikipedia, chin turret]
6. "In the movie GoldenEye, a Tiger helicopter was stolen from a ship!" [src: boldentrance; search result, fiction framing]
7. "Tiger can fly about 290 kilometres every hour!" [src: Wikipedia, 290 km/h with mast]
8. "Tiger has an eye on top of its rotor to see far away." [src: aerospaceweb, mast-mounted sight]

---

## 2. Geometry for procedural modelling

### Overall

| Item | Value | Tag | Source |
|---|---|---|---|
| Fuselage length, nose to tail (Wikipedia) | 13.85 | [src] | Wikipedia (infobox/dimensions) |
| Fuselage length, UHT (ignoring rotors) | 14.08 | [src] | aerospaceweb |
| Fuselage length, HAP (ignoring rotors) | 15.00 | [src] | aerospaceweb |
| Length with rotors turning | 15.80 | [src] | aerospaceweb |
| Height to top of rotor head | 3.84 (Wikipedia, without top-mounted sensors); 3.81 (aerospaceweb) | [src] | Wikipedia; aerospaceweb |
| Height to top of tail rotor | 4.32 | [src] | aerospaceweb |
| Height to top of mast-mounted sight (Osiris) | 5.20 | [src] | aerospaceweb |
| Fuselage width | **not found** | gap | |
| Stub-wing span | 4.52 | [src] | aerospaceweb |

**Conflict note:** the Wikipedia length (13.85) and the aerospaceweb UHT length (14.08) differ by 0.23. The HAP length (15.00) is ignored-rotors and variant-dependent.

### Main rotor

- **Count:** 1 (single main rotor). [src]
- **Diameter:** 13.00 m (42 ft 8 in). [src: Wikipedia; aerospaceweb]
- **Disc area:** 132.75 m². (derived check: pi x 6.5^2 = 132.73, consistent) [src: Wikipedia]
- **Blades:** 4. Hingeless (composite) rotor. [src: Wikipedia]
- **Blade chord:** not found (gap). (est.) A chord of about 0.5 m fits a 13 m four-blade rotor, but I have no source.
- **Direction of rotation seen from above:** not found (gap).
- **Hub height above ground:** about 3.8 (est.), since height to top of rotor head is 3.84 [src] and the hub sits just below it.
- **Hub x from nose:** not found (gap). (est.) The rotor hub sits roughly over the cockpit, near the front third of the fuselage.

### Anti-torque

- **Tail rotor:** conventional, not fenestron. Top of tail rotor is at 4.32 m [src: aerospaceweb]. Diameter, blade count, side and x position: **not found** (gap).
- **Fenestron, NOTAR, pusher:** none reported.

### Fuselage

- **Layout:** tandem two-seat, "glass cockpit", fuselage with one single-section composite tail boom. [src: Wikipedia]
- **Station widths/heights (8 stations):** not found (gap). The Tiger has a slim, bulb-like nose with a chin turret under the cockpit. Use the side-view points below to shape it.
- **Tail boom:** single composite section. Length and diameter not found (gap).
- **Engines:** 2 turboshafts, one either side of the top of the fuselage, with exhausts at the rear of the engine housings (est., typical twin-engine helicopter layout; engine exhaust positions not found in sources).
- **Cockpit canopy:** single-piece glazed tandem canopy (est.); the Wikipedia article doesn't describe it.

### Side-view outline (est. from typical three-view; no fetched three-view available)

Approximate points (x from nose, y height above ground, both est.):

- Nose tip (0.0, 1.9)
- Chin turret bottom (0.5, 1.2)
- Cockpit top (2.0, 2.7)
- Rotor mast top (5.2, 3.84) [src for height]
- Engine top rear (9.0, 3.0) (est.)
- Tail boom top (13.0, 2.5) (est.)
- Tail fin top (13.85, 3.6) (est., tail rotor top 4.32 [src] is the highest point at the tail)

### Top-view half outline

Est. only. Half-width about 0.8 at the cockpit and about 0.6 at the tail boom (est.), with the fuselage widest around the engine housings at about 1.0 (est.).

### Tail surfaces

- **Vertical fin:** present (est.); span and chord not found (gap).
- **Horizontal stabiliser:** not found (gap).
- **Endplates:** not found (gap).

### Stub wings

- **Span:** 4.52 [src: aerospaceweb]
- **Hardpoints:** 2 per side, 4 total. Inner and outer stations per side. [src: aerospaceweb; Wikipedia]
- **Wingtip stations:** the outer hardpoints sit at the wingtips (est.).

### Landing gear

- **Type:** not found in sources (gap). Wheels or skids, retractable or fixed: not stated.
- **Track and height:** not found (gap).

---

## 3. Distinctive features checklist (most recognisable first)

1. **Chin turret under the nose** with a 30 mm cannon. [src]
2. **Mast-mounted sight (Osiris) on top of the rotor** on the UHT, sticking up above the rotor. [src: aerospaceweb; Wikipedia]
3. **Stub wings with missiles and rocket pods.** [src]
4. **Tandem two-seat glass cockpit**, one seat behind the other. [src]
5. **Four-blade rotor**, hingeless and composite. [src]
6. **Slim, angular black or grey body** with the exhaust hidden at the back. (est.)
7. **Two turboshaft engines.** [src]

---

## 4. Paint & liveries

Sources found only standard camouflage and one 2024 special. Hex values are est. unless noted. I found no verified tiger-stripe livery on a Tiger helicopter from the Tiger Meet.

1. **Standard ALAT camouflage (French Army), free default.** Brown and sand, green and grey patches. The source says the aircraft wore "the standard ALAT camouflage pattern." [src: afterburner.com.pl; scramble forum]
   - Colours (est.): sand #C2A878, olive #6B6B3A, dark brown #5A4632, black #1E1E1E. Canopy black, rotor blades grey #8A8A8A.
2. **German Army (Heer) UHT, green-tan camouflage.** (est.) Dark green #4A5A3A, tan #B39B6E, black #1E1E1E. The mast sight is grey #7A7A7A.
3. **Spanish Army HAD, green camouflage.** (est.) Olive #5F6B3F, dark green #354430, tan #B9A77A.
4. **Tiger Fury (2024 NATO Tiger Meet, Schleswig).** The HAD aircraft BIE carried an extra livery with "irregular orange and black scrapes and the tiger head." [src: afterburner.com.pl; the scrape pattern is from a secondary source] Colours (est.): orange #E5731F, black #1E1E1E, sand base #C2A878. Orange scrapes across the tail and body, a tiger head on the nose. This is the closest to a tiger-stripe scheme I found.
5. **Australian ARH (retired 2026).** (est.) Grey and dark green; the Australian Army livery is not in my sources.

### Suggested mod ladder

- **Free default:** ALAT standard camouflage (sand, olive, brown).
- **Upgrade 1:** German UHT green-tan.
- **Upgrade 2:** Spanish HAD green.
- **Upgrade 3:** Tiger Fury orange and black tiger scrape.
- **Legendary:** Sleek black GoldenEye prototype. The source describes the film aircraft as "sleek, black, wasp-like." [src: boldentrance] It's fiction-inspired, not a real livery.

---

## 5. Armament & stores

- **Gun:** one 30 mm GIAT cannon (described as GIAT AM-30781 in aerospaceweb), in a chin turret under the nose. Up to 450 rounds (Wikipedia) or 150-450 (aerospaceweb). [src]
- **Hardpoints:** 4 total, 2 inner and 2 outer (one of each per wing). [src]
- **Inner hardpoints (Wikipedia):** gun pods, autocannon pods, rocket pods, or anti-tank missiles (Hellfire, Spike-ER, PARS 3 LR, HOT-3), depending on operator. [src]
- **Outer hardpoints (Wikipedia):** Mistral or Stinger air-to-air missiles, or rocket pods, depending on operator. [src]
- **Anti-tank:** up to 8 missiles total (Trigat, HOT-2, HOT-3, TOW-2). [src: aerospaceweb]
- **Air-to-air:** up to 4 Mistral or Stinger. [src: aerospaceweb]
- **Rockets:** up to 2 rocket pods (68 mm or 70 mm). [src: aerospaceweb]
- **Other pods:** 12.7 mm gun pod or 20 mm gun pod. [src: aerospaceweb]
- **Bombs:** none. [src: aerospaceweb]
- **Door guns, hoists, cargo hooks:** not fitted (est., no source). Not reported.

### 4-step kid-friendly weapons/stores ladder

1. **Chin gun only.** "Tiger's chin gun is one turret, one cannon!" (fire-control: the 30 mm chin gun alone)
2. **Add rocket pods** under the stub wings (up to 2 pods, 68 mm or 70 mm).
3. **Add air-to-air missiles** (Mistral or Stinger, up to 4).
4. **Full load** of anti-tank missiles (up to 8, Hellfire/HOT/TOW style) plus the chin gun.

---

## 6. Engines

- **Count:** 2. [src]
- **Type:** MTR390 turboshaft (Wikipedia: MTR390-E; aerospaceweb: MTR 390 by MTU/Turbomeca/Rolls-Royce). [src]
- **Power:** Wikipedia gives 1,092 kW (1,464 shp) each. aerospaceweb gives 2,570 shp (1,916 kW) total. These don't agree: 2 x 1,464 = 2,928 shp (derived), so the aerospaceweb total looks like a different rating. [src, conflicting]
- **Exhaust positions:** not found (gap). (est.) Rear of each engine housing on top of the fuselage.
- **Top speed:** 290 km/h with the rotor mast (Wikipedia); 315 km/h without it (Wikipedia). aerospaceweb gives 320 km/h clean at altitude and 280 km/h armed. [src]
- **Cruise speed:** 230 km/h (aerospaceweb). [src]
- **Lifting fact:** Max take-off weight is 6,000 kg (aerospaceweb) or 6,600 kg (Wikipedia). [src, conflicting] The Tiger's weight is about 1,000 kg more than the Wikipedia empty weight (derived).

---

## 7. Other cool mods

- **Mast sight (Osiris):** optical TV, thermal camera, laser rangefinder/designator, on top of the rotor. [src: Wikipedia]
- **Chin turret:** the 30 mm gun is a gimbal turret under the nose. [src]
- **Stub-wing rocket pods:** glowing rocket trails are a fun mod, fiction-style. (est.)
- **Rotor-tip lights:** no source; plausible mod (est.).
- **Searchlight, winch, sling load, IR suppressors:** not standard on the Tiger per my sources (gap). The Tiger has "reduced IR signature" per one secondary source. [src: boldentrance, secondary]

---

## 8. Sound

No recorded audio was fetched. These are est. descriptions to guide a sound designer.

- **Blade slap:** a low "whup-whup" from the four blades, slower than a light helicopter's. (est.)
- **Engines:** two turboshafts give a high whine that rises at take-off, then settles into a steady hum in cruise. (est.)
- **Chin gun:** a fast "brrrrt" with a heavy, quick cadence (30 mm cannon). (est.)
- **Mast sight:** a faint electric whirr when the sensor slews. (est.)

---

## 9. Fraction-friendly facts

- **Rotor blades:** 4 on the main rotor, so each blade is one quarter of the rotor.
- **Engines:** 2, so each engine is half of the power.
- **Crew seats:** 2, so each pilot sits in one half of the cockpit.
- **Stub wings:** 2, each with 2 hardpoints, so 4 hardpoints total. Each hardpoint is one quarter of the stores.
- **Hardpoint roles:** 4 hardpoints, and the outer two carry air-to-air missiles or rocket pods (2 out of 4 is one half).
- **Gun:** 1 chin cannon, one whole turret.
- **Wheels:** not found (gap), so no wheel count.
- **Doors:** not found (gap).

---

## 10. Reference sources

- Wikipedia, Eurocopter Tiger: https://en.wikipedia.org/wiki/Eurocopter_Tiger (fetched; truncated at 100k of 152k characters; infobox and dimensions read)
- aerospaceweb, Tiger data: https://aerospaceweb.org/aircraft/helicopter-m/tiger/
- Aeropedia, Eurocopter Tiger (search hit, not fetched): https://aeropedia.com.au/content/eurocopter-tiger/
- FAS DoD 101, tiger (search hit, not fetched): https://man.fas.org/dod-101/sys/ac/row/tiger.htm
- Flugzeuginfo, EC655 Tiger (search hit, not fetched): https://www.flugzeuginfo.net/acdata_php/acdata_tiger_en.php
- NATO Days, EC665 Tiger (search hit, not fetched): https://www.natodays.cz/en/assets/ec665-tiger
- boldentrance, Tiger in GoldenEye (fetched): https://boldentrance.com/the-eurocopter-tiger-in-goldeneye-disentangling-reality-from-fiction/
- James Bond Wiki, Eurocopter Tiger (search hit): https://jamesbond.fandom.com/wiki/Eurocopter_Tiger
- Afterburner, EC-665 Tigre HAD (search hit, contains Tiger Fury 2024 note): https://afterburner.com.pl/eurocopter-ec-665-tigre-had/
- The Aviationist, Australian Army retires Tiger (search hit): https://theaviationist.com/2026/09/25/australian-army-to-retire-its-tiger-attack-helicopters/
- Australian Aviation, Defence to retire Tiger (search hit): https://australianaviation.com.au/2026/04/defence-to-retire-tiger-helicopters-by-end-of-this-year/
- Migflug, Why Australia gave up on the Tiger (search hit): https://migflug.com/afterburner/?p=24907612
- NATO Tiger Association tiger-paint page (fetched, no helicopter schemes): https://natotigers.org/tiger-news/tiger-paint
- Three-view drawings: none fetched. Side and top outlines in section 2 are est.

### Known gaps

- Fuselage width, and fuselage width at 8 stations.
- Tail rotor diameter, blade count, side, and x position.
- Tail boom length and diameter.
- Landing gear type, track, height, and whether it retracts.
- Blade chord; rotor direction of rotation; hub x position.
- Engine exhaust positions.
- Stub wing chord and wingtip stations.
- Horizontal stabiliser and vertical fin dimensions.
- Door guns, hoists, and cargo hooks (none reported).
- A verified tiger-stripe or Tiger Meet livery on a Tiger helicopter. The only one found is the 2024 Tiger Fury scheme on a HAD, from a secondary source, not a photo caption or official release.
- Conflicting figures: length (13.85 vs 14.08), weight (empty 3,060 vs 3,300; MTOW 6,600 vs 6,000), engine power (1,464 shp each vs 2,570 shp total), and first flight day (27 vs 29 April 1991).
- Whether any Australian ARH airframes were kept or preserved after 2026 retirement.
