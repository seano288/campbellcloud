# Mil Mi-24 "Hind": research notes for a procedural 3D hangar model

Conventions: **[src]** = from a fetched or searched source (cited in section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate, not in any source. Where sources conflict, both values are given. Metric units throughout.

Modelled variant: Mi-24V / Mi-35 Hind-E (tandem double-bubble cockpit, four outer wing pylons). Other variants are described in section 3 and 4 so the model can switch them on.

Source-quality note: the Wikipedia article for the Mi-24 was fetched but its variant/camouflage sections were truncated in what I could read. Most dimensions come from aerospaceweb.org and a fan-site summary (migflug.com), which disagree in places. Conflicts are flagged below.

---

## 1. Identity

- **Full name:** Mil Mi-24 (NATO reporting name "Hind"). [src Wikipedia search]
- **Designations:** Mi-24A (izdeliye 245, first production), Mi-24D (export Mi-25), Mi-24V (Hind-E), Mi-24P (Hind-F), Mi-24PN, Mi-35 (export Mi-24V), Mi-35M. [src Wikipedia, aerospaceweb]
- **Nicknames:** "Krokodil" (Crocodile, from the camouflage). "Flying tank" (Soviet pilots' term). "Galina" / "Galya". "Drinking Glass" (Stakan), for flat glass panels on early cockpits. Mujahideen called it "Shaitan-Arba" (Satan's Chariot). [src Wikipedia]
- **Maker:** Mil design bureau, Soviet Union. [src Wikipedia]
- **First flight:** 19 September 1969 (tethered hover 15 September 1969). [src Wikipedia]
- **In service:** Mi-24A entered production 1970, initial operating capability 1971, accepted into the state arsenal 1972. [src Wikipedia]
- **Role:** Attack helicopter / gunship that also carries troops. Nicknamed "flying infantry fighting vehicle" in its brief. [src Wikipedia: "flying tank" and troop carrier role]
- **Crew:** 2 on the Mi-24D/V (pilot and weapons officer, tandem cockpits). [src aerospaceweb]. The Mi-24A carried 4 crew. [src aerospaceweb]. Hind-A variant list says 3 crew plus 8 troops. [src avhind/Wikipedia variant list]
- **Troops:** Up to 8 armed troops in the cabin. [src aerospaceweb, Wikipedia]

### Kid-friendly voice lines (each under 12 words)

1. "It carries eight soldiers inside its body!" (7 words). Source: 8 troops carried, [src aerospaceweb].
2. "It is a flying tank with two engines and wings!" (10 words). Source: "flying tank" nickname, [src Wikipedia].
3. "Its big rotor has five blades, like a hand's fingers!" (10 words). Source: 5 main-rotor blades, [src aerospaceweb].
4. "Its main rotor is almost as long as four cars!" (9 words). Source: rotor diameter 17.3 m [src aerospaceweb]; car length of about 4.5 m is (est.), so 17.3 m is about 3.8 car lengths (derived).
5. "It once zoomed faster than any helicopter had before!" (9 words). Source: speed record, 368.4 km/h, set by a modified Mi-24B on 21 September 1978 [src Wikipedia]. Note the record was later broken, so keep "once".
6. "Its tail rotor sits on the left side of the tail." (10 words). Source: moved to the left side on the production Mi-24A [src Wikipedia].
7. "Its wheels tuck up inside it when it flies!" (8 words). Source: retractable tricycle gear [src Wikipedia, "Flight characteristics"].
8. "Some versions have a big gun poking out of the side!" (10 words). Source: Mi-24P (Hind-F) has a fixed side-mounted twin-barrel 30 mm GSh-30K [src aerospaceweb].

---

## 2. Geometry for procedural modelling

### 2a. Overall

| Item | Value | Source / note |
|---|---|---|
| Fuselage length, nose to tail boom end (no rotors) | **17.50 m** (57 ft 5 in) | [src aerospaceweb]; Wikipedia list also gives 17.51 m |
| Length with rotors turning (main rotor tip fore to aft, approx.) | **21.35 m** | [src aerospaceweb] |
| Main rotor diameter | **17.30 m** (radius 8.65 m) | [src aerospaceweb, Wikipedia] |
| Height to top of main rotor head (hub) | **3.90 m** | [src aerospaceweb]. Conflicts with 5.47 m overall height quoted for a specific Mi-24A [src aerospaceweb variant note] |
| Height, tail rotor top (rotor-turning height) | **6.50 m** | [src aerospaceweb "21.33 ft (6.50 m) with rotors turning"], [src other summary "height (tail rotor): 6.5 m"] |
| Fuselage width (body, max) | **not sourced**; (est.) about **1.6 m** | Gap. Estimate from memory of Mi-24 three-views; needs a three-view check |
| Stub-wing span (tip to tip) | **6.54 m** (21 ft 5 in) | [src aerospaceweb]. Another source gives 6.5 m [src search]; one Mi-24A-specific source gives 6.66 m |
| Empty weight | 8,200 kg (Mi-24D); 8,340 kg (Mi-24V); 8,400 kg (Mi-24A) | [src aerospaceweb] |
| Normal take-off weight | 11,000 kg | [src aerospaceweb] |
| Maximum take-off weight | 12,000 kg | [src aerospaceweb] |

Scale rule for the model: **fuselage 17.5 m long, main rotor 17.3 m across (so the rotor is almost as long as the fuselage), stub wings 6.5 m across, hub about 3.9 m above ground.**

### 2b. Main rotor

- **Count:** 1 (single, top-mounted over the cabin on the mast). [src aerospaceweb]
- **Diameter:** 17.30 m. [src aerospaceweb]
- **Blade count:** **5**. [src aerospaceweb, Wikipedia "five-blade main rotor"]
- **Blade chord:** not sourced. (est.) about **0.55 m** (my guess for a 17.3 m five-blade rotor, not derived from a source). Use a taper from about 0.6 m at root to 0.35 m at tip (est.).
- **Blade material:** titanium. [src Wikipedia]
- **Direction seen from above:** not sourced in my reads. (est.) counter-clockwise, as on other Mil single-rotor helicopters such as the Mi-8. Verify before modelling.
- **Hub height above ground:** 3.90 m. [src aerospaceweb]
- **Hub position along fuselage (x from nose):** not sourced. (est.) about 0.9 m aft of the nose, roughly above the engine/cabin join. Use this as a starting point and check against a three-view.
- **Rotor tilt:** the main rotor is tilted 2.5 degrees to the right to counter the translating tendency. [src Wikipedia]

### 2c. Anti-torque (tail rotor)

- **Side:** **Left** on production models (Mi-24A and later). The pre-production Mi-24B test aircraft had it on the right. The tail rotor was moved and its rotation reversed, so the forward blade rises into the rotor downwash. [src Wikipedia; src search summary, which also says early Mi-24D prototypes kept the right-side rotor]
- **Diameter:** 3.91 m (12 ft 10 in). [src aerospaceweb]
- **Blades:** 3. [src aerospaceweb]
- **Hub height (rotor top):** about 6.5 m (rotor-turning height) [src aerospaceweb]; hub height not separately sourced. (est.) hub near 2.3 m above ground.
- **x from nose (hub):** not sourced. (est.) at the tail boom, about 14.5 to 15.5 m aft of the nose. Check against a three-view.
- **Other anti-torque aids:** the tail is asymmetric and gives side force at speed, which unloads the tail rotor. [src Wikipedia]
- **Fenestron/NOTAR:** none.

### 2d. Fuselage stations

Not sourced. Plan for stations (x in metres from nose), with (est.) values to be checked against a Mi-24 side three-view:

| x (m from nose) | Width (m) (est.) | Height (m) (est.) | z centre (m above ground) (est.) | Notes |
|---|---|---|---|---|
| 0.0 | 0.4 | 0.8 | 2.2 | nose, gunner bubble |
| 1.5 | 1.0 | 1.3 | 2.3 | forward cockpit, gunner |
| 3.0 | 1.5 | 1.6 | 2.4 | cockpit blends into cabin |
| 5.0 | 1.6 | 1.9 | 2.5 | cabin front, troop door zone |
| 7.5 | 1.6 | 2.0 | 2.6 | cabin, 8 troop seats |
| 10.0 | 1.5 | 1.9 | 2.7 | cabin rear, engine housing above |
| 12.5 | 1.0 | 1.4 | 2.6 | boom root |
| 15.0 | 0.5 | 0.6 | 2.5 | tail boom |
| 17.5 | 0.3 | 0.4 | 2.5 | tail end |

- **Tail boom:** length from the cabin to the tail end is roughly 6 m (est.). Diameter about 0.5 m (est.).
- **Engines:** 2 turboshafts, mounted top rear, side by side on the mast, exhausts pointing rearward and up. (est.). The exhaust placement was later judged a heat target and was corrected on the Mi-28. [src Wikipedia]
- **Engine model:** TV3-117VM. [src aerospaceweb]. Note: the Wikipedia design section names the Izotov TV3-177A (1,300 kW) as the basis for the design. [src Wikipedia] Use TV3-117VM for the Mi-24D/V.
- **Cockpit canopy (the signature shape):**
  - Hind-A/B (Mi-24A): single greenhouse cockpit with angular glazing. Early versions had flat glass panels ("Drinking Glass"). [src Wikipedia, migflug]
  - Hind-D onward: tandem "double bubble". Gunner sits low in a separate bubble in the extreme nose; the pilot sits higher, behind and above the gunner, looking over the gunner's head. Each has a rounded "bump" canopy. [src migflug search; src Czech government database summary]
  - Hind-D: two separate cockpits, one for pilot and one for gunner. [src aerospaceweb]

### 2e. Top-view and side-view outlines

Not sourced as coordinates. Plan: the side view is a long, low fuselage with the nose gunner bubble lower than the pilot bubble, a tall cabin, and a tapering tail boom with the fin on top. The top view is a slim body, widest at the cabin, with stub wings near the middle (about 45 percent of the fuselage length from the nose, est.).

### 2f. Tail surfaces

- **Vertical fin:** single, on top of the tail boom. Span and chord not sourced; est. about 2.4 m tall and 0.8 m chord at root (est.).
- **Horizontal stabiliser:** on the tail boom, not sourced. Est. span about 2.5 m, mounted on the boom (est.).
- **Asymmetric tail:** the tail is asymmetric to produce side force at speed. [src Wikipedia]

### 2g. Stub wings

- **Span:** 6.54 m tip to tip. [src aerospaceweb]
- **Chord:** not sourced. (est.) about 1.0 m at root.
- **Position:** mounted mid-fuselage on the cabin sides. [src Wikipedia]
- **Dihedral/anhedral:** **12 degrees anhedral** was added to counter Dutch roll above 200 km/h. [src Wikipedia]
- **Hardpoints:** 3 per wing, 6 total. [src Wikipedia "each with three hardpoints"; src aerospaceweb "six hardpoints"]
- **Wingtip stations:** Falanga missile pylons moved from the fuselage to the wingtips. [src Wikipedia]
- **Hind-E (Mi-24V) pylons:** the variant list says 4 outer wing pylons carry 8 Shturm (AT-6) missiles. [src aerospaceweb variant list]. The aerospaceweb spec table says up to 12 AT-6 on Mi-24V. The two figures conflict; use 8 for the model.

### 2h. Landing gear

- **Type:** retractable tricycle gear, with the gear tilted so the rotor stays level on the ground. [src Wikipedia]
- **Front leg:** double-tyred. [src Czech government database summary]
- **Retraction:** yes (retracted in flight). [src Wikipedia]
- **Wheel size and track:** not sourced. (est.) main wheels about 0.8 m diameter, track about 3.5 m, nose wheel about 0.5 m (est.).
- **Mi-35M difference:** one source says the Mi-35M has fixed landing gear. [src migflug search summary only; not confirmed elsewhere]

---

## 3. Distinctive features checklist (most recognisable first)

1. **Tandem double-bubble cockpit** with the gunner in a low nose bubble and the pilot behind and above him. This is the single most recognisable feature. (Hind-D onward)
2. **Stub wings with weapon pylons** (wingtip and inboard), angled slightly downward (12 degrees anhedral).
3. **Single five-blade main rotor** (large, almost as long as the fuselage).
4. **Tail rotor on the left side**, with 3 blades, of the production Mi-24A and later.
5. **Tall, chunky cabin** with side troop doors (the "flying tank" look).
6. **Retractable tricycle gear**, which is down on the ground and tucked up in flight.
7. **Side-mounted gun on the Hind-F (Mi-24P)**: a fixed twin-barrel 30 mm cannon.
8. **Greenhouse canopy** on the Hind-A (Mi-24A), with angular glass and flat panels.
9. **Two turboshaft engines** on top of the cabin, exhausts behind the rotor mast.
10. **Dark, mottled camouflage** (the Krokodil look).

---

## 4. Variants: how to tell them apart

| Variant (NATO) | Nose / cockpit | Guns | Wing pylons | Gear / other | Source |
|---|---|---|---|---|---|
| Mi-24A (Hind-A/B) | Greenhouse canopy, flat glass panels, single cockpit | Nose 12.7 mm A-12.7 (Hind-A) | 4 x 57 mm rocket pods, 4 x 9M17 Fleyta missiles on 2 rails (Hind-A) | Retractable tricycle gear; 4 crew, 8 troops | [src aerospaceweb variant list; src Wikipedia] |
| Mi-24D (Hind-D, export Mi-25) | Tandem double-bubble, gunner in nose bubble | Nose 12.7 mm four-barrel Yak-B / JakB-12.7 (1,470 rounds) | Rocket pods; SACLOS 9M17 Falanga missiles | Retractable tricycle gear | [src aerospaceweb; src migflug] |
| Mi-24V (Hind-E, export Mi-35) | Tandem double-bubble | Nose gun (some versions) | 4 outer wing pylons with 8 AT-6 Shturm missiles (1,500+ built) | Retractable tricycle gear | [src aerospaceweb variant list] |
| Mi-24P (Hind-F) | Tandem double-bubble | **Fixed side-mounted twin-barrel 30 mm GSh-30K** (750 rounds), replaces nose 12.7 mm gun | Similar to Hind-D | Retractable tricycle gear | [src aerospaceweb] |
| Mi-24VM | Shorter, lighter wings; updated avionics; 23 mm main gun | 23 mm | Shorter wings | Retractable tricycle gear | [src aerospaceweb variant list] |
| Mi-35M | Night-attack, upgraded avionics, GOES-342 targeting, night vision | Usually 23 mm (not confirmed) | Shorter and lighter wings (single source) | Fixed landing gear (single source) | [src migflug search summary] |
| Mi-35P | Chin turret NPPU-23 with twin GSh-23L cannon, OPS-24N-1L sight | Chin turret 23 mm | Standard | Retractable tricycle gear | [src aerospaceweb variant list] |
| Mi-24PN | Nose dome with TV and FLIR camera | GSh-23 | Standard | Retractable | [src aerospaceweb variant list] |

Notes:
- Mi-35M shorter and fixed-gear claims come from a single fan-site summary; treat as **unverified**. The aerospaceweb variant list ties "shorter and lighter wings" to the Mi-24VM, not the Mi-35M. The model should use shorter wings for Mi-35M only if a second source confirms it.
- Mi-24F (aerospaceweb): seven reinforcing ribs on the port side aft of the wing, IFF antenna moved to the oil cooler. This is a subtle visual cue (est.).
- The Hind-D and Hind-E canopies both use the double-bubble; the easiest visual test is the nose gun and the wing pylons. Hind-E has 4 outer wing pylons. Hind-F has the side gun.

---

## 5. Paint and liveries

Sources give only a few colour facts. The hex colours below are all (est.) unless noted.

1. **Soviet Krokodil (standard camouflage, Soviet Air Force):** green and brown mottled pattern over a grey or sandy base, from the "Krokodil" nickname [src Wikipedia]. (est.) colours: dark olive #4B5320, brown #6B4F2A, dark green #3E4A2F, base grey-sand #9C9575. Colours on fuselage top, upper wings, and tail boom. Underside a lighter grey-blue (est.) #8A9A9F.
2. **Afghan desert (Soviet-era export, Afghan Air Force):** sand and tan base, brown and grey blotch pattern. Colours used by Soviet and Afghan air forces in the Afghan war (est.). Base #C2B280, blotch #7A6A4A, dark line #4A3F2F.
3. **Polish Air Force (Mi-24D, three-colour camouflage):** a forum source says Polish Hinds were delivered in the late 1970s or early 1980s in a three-colour camouflage, and were later repainted solid green for missions in Iraq and Afghanistan. [src forum, low authority]. The pattern is not described; I could not confirm a "Tiger" scheme name for the Polish Air Force. (est.) colours: green #4A5D3A, brown #6B5A3E, sand #B9A77A. Tail-rotor warning text was first in Russian and later repainted in Polish.
4. **Czech Air Force "Splinter/Tiger" demo scheme:** a paint-mask kit exists for a "Splinter/Tiger" Czech Mi-24 demo scheme. [src search: the48ers paint-mask listing]. This is a Czech scheme, not a Polish one. (est.) colours: dark green #33402A, black #1E1E1E, tan #B19B6A.
5. **Mi-35M4 AH-2 Sabre (Brazilian Air Force, Israeli-upgraded):** Brazilian export variant named in the aerospaceweb variant list [src]. I found no source for its paint scheme, so it is a gap (no colours given).

### Suggested mod ladder

- **Free default:** Soviet Krokodil (green and brown mottle, grey-sand base).
- **Upgrade 1, Desert:** Afghan desert sand and tan blotch.
- **Upgrade 2, Polish green:** solid dark green, from the Polish Hind-D later repaint.
- **Upgrade 3, Czech Splinter:** Czech "Splinter/Tiger" demo scheme.
- **Legendary: "Satan's Chariot"**: Mujahideen-era name, shown as a dark matte body with a red star. (Name source: Wikipedia. Colour scheme is (est.), not a documented livery.)

Kid-friendly note: the "Tiger" names come from the Czech paint-mask listing and a forum; the Polish "tiger meet" scheme could not be confirmed, so label the Czech one "Splinter/Tiger" and keep Polish as "Polish green".

---

## 6. Armament and stores

- **Nose gun (Mi-24D and earlier):** 12.7 mm JakB-12.7 four-barrel (1,470 rounds). [src aerospaceweb]. Hind-A nose gun was a 12.7 mm A-12.7 (Afanasev). [src aerospaceweb variant list]
- **Side gun (Mi-24P, Hind-F):** fixed side-mounted twin-barrel 30 mm GSh-30K (750 rounds). [src aerospaceweb]. In the model, put this on the port (left) side forward of the wing, in a fixed mount.
- **Chin turret (Mi-35P):** NPPU-23 with twin GSh-23L 23 mm. [src aerospaceweb variant list]
- **Rockets:** 57 mm S-5 and 80 mm S-8 rocket pods on underwing pylons. The 80 mm S-8 was the preferred rocket. [src Wikipedia, aerospaceweb]
- **Missiles:** 9M114 Shturm (AT-6 Spiral) on the Mi-24V (up to 8 on four pylons; spec table says up to 12). [src aerospaceweb, Wikipedia]. Falanga (AT-2) on the Mi-24D.
- **Bombs:** up to 4 FAB-250 or 2 FAB-500 on the stub wings. [src aerospaceweb]
- **Hardpoints:** 3 per stub wing (6 total). Wingtip stations used for Falanga pylons. [src Wikipedia]
- **Door gun:** a machine gun in a window port covered the rear. [src Wikipedia]
- **Hoists/cargo hooks:** not sourced in my reads.

### 4-step kid-friendly weapons and stores ladder

1. **Rocket pods** (soft rockets, 4 pods): "Four rocket pods on the wings!"
2. **Missile pylons** (4 outer pylons, 8 missiles): "Eight missiles on its wings for big targets!" (Frame as target practice, not destruction.)
3. **Side cannon** (Hind-F): "A big gun on its side!"
4. **Chin turret** (Mi-35P): "A turret under its nose that turns!"

---

## 7. Engines

- **Count:** 2 turboshafts. [src aerospaceweb, Wikipedia]
- **Type:** TV3-117VM (Mi-24D/V). [src aerospaceweb]. Design source: Izotov TV3-177A at 1,300 kW (1,700 hp). [src Wikipedia]
- **Power per engine:** 2,225 shp (1,660 kW). [src aerospaceweb]
- **Exhaust positions:** top rear of the cabin, exiting rearward. (est.)
- **Top speed:** 335 km/h at sea level (210 mph). [src aerospaceweb]. Cruise 295 km/h (185 mph). [src aerospaceweb]
- **Speed record fact:** a modified Mi-24B "A-10" set an absolute helicopter speed record of 368.4 km/h (228.9 mph) on 21 September 1978, which stood until 1986. [src Wikipedia]
- **Range:** 450 km (240 nm); ferry range 1,125 km (605 nm). [src aerospaceweb]

---

## 8. Other cool mods

- **Searchlight:** not sourced. (est.) a small nose lamp under the gunner's bubble.
- **Night targeting dome:** Mi-24PN has a nose dome with TV and FLIR camera. [src aerospaceweb]. Use this on the "Night Hind" mod.
- **Chin turret:** Mi-35P NPPU-23 with twin 23 mm. [src aerospaceweb]
- **Rotor-tip lights:** not sourced.
- **Cargo/troop door:** side troop doors on the cabin, for 8 seated troops. [src aerospaceweb]
- **Tail-rotor warning text:** the reading "Dangerous" in Russian (the forum says the original was Russian, repainted Polish later). Fun detail for a sticker.

---

## 9. Sound

Not sourced. (est.) Two turboshafts give a steady high whine that rises on take-off, and a low thumping blade slap from the five-blade main rotor, deeper than a four-blade helicopter. The tail rotor gives a higher, thinner whirr from the left side. In words a sound designer could synthesise: "wup-wup-wup at about 5 to 6 Hz for the main rotor (est.), with a whine of two turboshafts above it, and a high whirr from the tail on the left."

---

## 10. Fraction-friendly facts

- **Main rotor blades:** 5, so each blade is one fifth of the main rotor. [src aerospaceweb]
- **Tail rotor blades:** 3, so each tail blade is one third of the tail rotor. [src aerospaceweb]
- **Engines:** 2, so one engine is one half of the power. [src aerospaceweb]
- **Stub wings:** 2, so each wing is one half of the wings.
- **Hardpoints:** 6 total (3 per wing), so each wing carries one half of the hardpoints. [src Wikipedia]
- **Troops:** 8 seats, so 1 in 8 soldiers is one eighth of the troops. [src aerospaceweb]
- **Crew:** 2 pilots on the D/V (one pilot, one weapons officer). [src aerospaceweb]
- **Landing wheels:** 3 retractable (1 nose, 2 main). [src Wikipedia]
- **Gunner bubble vs pilot bubble:** 2 bubbles on the canopy, so each is one half of the cockpit. [src migflug]
- **Missiles:** 8 Shturm on 4 outer pylons, so each pylon carries 2 missiles, which is one quarter of the missiles (derived).

---

## 11. Reference sources

Sources used:
- Wikipedia, "Mil Mi-24": https://en.wikipedia.org/wiki/Mil_Mi-24 (fetched; variant and camouflage sections truncated)
- Wikipedia, "List of Mil Mi-24 variants": https://en.wikipedia.org/wiki/List_of_Mil_Mi-24_variants (fetched; no dimensions)
- aerospaceweb.org, Mi-24: https://aerospaceweb.org/aircraft/helicopter-m/mi24 (fetched; main spec source)
- migflug.com, Mi-24 Hind: https://migflug.com/aircraft/mi-24-hind/ (fetch returned HTTP 403; facts used from search summary)
- Search summary of Mi-24 dimensions (aerospaceweb, globalsecurity, airvectors, helis.com): https://www.globalsecurity.org/military/world/russia/mi-24-specs.htm, https://airvectors.net/avhind_1.html, https://www.helis.com/database/model/808/
- Czech Ministry of Defence aircraft database: https://acr.mo.gov.cz/scripts/detail.php?id=38157 (search summary only)
- Army.mil "Satan's Chariot": https://www.army.mil/article/11874/satans_chariot (fetch returned HTTP 500; not used)
- Paint-mask listing (Czech Splinter/Tiger): https://the48ers.com/splinter-tiger-camo-mi-24-4011-czech-af-paint-mask-set.html
- Forum on Polish Hind camouflage: https://forum.finescale.com/t/mil-24d-hind-helicopter-crew-uniform-colors/243122 (low authority)

Three-view drawings: none fetched. Recommended next step: a Mi-24D side three-view (for fuselage width, hub position, tail rotor position and stub-wing chord).

### Known gaps

- **Fuselage width and stations:** no source; all (est.).
- **Main rotor spin direction:** not verified (est. counter-clockwise).
- **Main rotor hub x position and tail rotor x position:** not sourced.
- **Blade chord:** not sourced.
- **Stub-wing chord:** not sourced.
- **Fin and tailplane dimensions:** not sourced.
- **Wheel sizes and track:** not sourced.
- **Polish "Tiger" scheme:** could not be confirmed. Only a Czech "Splinter/Tiger" demo scheme and a forum note about three-colour Polish Hinds were found.
- **Mi-35M shorter wings and fixed gear:** single fan-site source, unverified.
- **Hind-A vs Hind-D nose gun:** sources disagree on whether the Mi-24A had the nose gun (Wikipedia variant list says the Mi-24A lacked the four-barrel Yak-B nose gun; aerospaceweb says Hind-A had a 12.7 mm A-12.7).
- **Height:** 3.90 m (rotor head) vs 5.47 m (overall, a specific Mi-24A). Use 3.90 m for the hub.
- **Engine name:** TV3-177A (Wikipedia design) vs TV3-117VM (aerospaceweb spec). Use TV3-117VM for the model.
- **Sound:** no source.
- **Hoists and cargo hooks:** no source.
- **Searchlight and rotor-tip lights:** no source.
