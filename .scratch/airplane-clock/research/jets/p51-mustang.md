# North American P-51D Mustang: research notes

Scope: P-51D primary, with B/C differences. Target: procedural three.js model in a kids' hangar game.

Legend:
- Plain numbers come from a cited source (see section 10).
- **(est.)** = my estimate or unverified background. Replace with drawing-measured values before shipping.
- Units: metres are primary; original imperial figures are kept where the source gives them.

---

## 1. Identity

- **Full name:** North American P-51D Mustang (NAA designation NA-122 (est.), USAAF "P-51D-15-NA" and similar block codes for production batches).
- **Nicknames:** "Mustang", "Stang", "Cadillac of the Skies" (popular nickname, not verified here), "Red Tails" (for the 332nd FG aircraft, not the type).
- **Maker:** North American Aviation, Inc., Inglewood, California (US). Dallas-built variant was the P-51K.
- **Era:** Designed 1940 (first flight of NA-73 prototype, 26 Oct 1940 (est.)). P-51D entered combat in late 1944 (Wikipedia: "P-51Ds supplemented P-51Bs and P-51Cs from mid-1944").
- **Role:** Long-range escort fighter, later fighter-bomber and ground attack.
- **Crew:** 1 pilot.
- **Engine (D):** Packard V-1650-7 (licence-built Rolls-Royce Merlin 66 type).

### Kid-friendly voice lines (under 12 words each)

1. "I can fly over four hundred miles per hour!"
   (Source: top speed 437 mph at 25,000 ft, WRG page.)
2. "My engine has twelve cylinders and a loud, roaring voice!"
3. "My bubble window lets pilots see all around!"
   (Source: Wikipedia variants page, D introduced the bubble canopy.)
4. "I flew with the bombers to keep them safe!"
   (Escort role; general knowledge, not separately verified.)
5. "I was built to fly far, far away!"
   (Range 1,650 mi with external tanks, WRG page.)

---

## 2. Geometry for procedural modelling

### 2.1 Overall (sourced)

| Item | Value | Source |
|---|---|---|
| Length | 32 ft 3 in = **9.83 m** | WRG page (also Wikipedia infobox) |
| Wingspan | 37 ft 0 in = **11.28 m** | WRG page |
| Height (tail on ground) | 13 ft 4.5 in = **4.08 m** | WRG page (another listing gives 13 ft 8 in / 4.17 m, a discrepancy) |
| Wing area | 235 sq ft = **21.83 m²** | WRG page (VT slides say 233 sq ft) |
| Empty weight | 7,635 lb = 3,465 kg | WRG page |
| Loaded weight | 9,200 lb = 4,175 kg | WRG page |
| Max takeoff | 12,100 lb = 5,490 kg | WRG page |
| Aspect ratio | ~5.9 (computed from span 37 ft and chord values) | VT PDF snippet (secondary) |

### 2.2 Fuselage

- **Construction:** three-section semi-monocoque, 24S aluminium (Wikipedia).
- **Nose / spinner:** Four-blade Hamilton Standard propeller on a rounded spinner (cuffed blades on early D, uncuffed later). Spinner shape is **(est.)** as an ogive, roughly 0.45 m diameter at the base, tip at x=0.
- **Propeller diameter:** 11 ft 2 in = **3.40 m** (Wikipedia variants page for B/C, armedconflicts.com for 3,400 mm). Assume same for D (**est.** that D is identical).
- **Propeller centre height:** **(est.)** about 2.0 m above ground on tail-wheel stance (do not use for other attitudes).

#### Cross-section stations (est.)

Stations are % of length from nose, with full width and height in metres. Derived from typical P-51 proportions and only roughly checked against the overall 9.83 m length; refine from a drawing.

| Station (% length) | x (m) | Width (m) | Height (m) | Notes |
|---|---|---|---|---|
| 0% | 0.00 | 0.00 | 0.00 | Spinner tip |
| 4% | 0.39 | 0.45 | 0.45 | Spinner base / cowl ring |
| 10% | 0.98 | 0.70 | 0.85 | Engine cowl max |
| 20% | 1.97 | 0.90 | 1.10 | Cowl behind firewall |
| 30% | 2.95 | 1.00 | 1.25 | Ahead of wing LE |
| 35% | 3.44 | 1.05 | 1.30 | Wing root LE |
| 45% | 4.42 | 1.00 | 1.25 | Canopy start (see below) |
| 55% | 5.41 | 0.85 | 1.05 | Radiator scoop front |
| 65% | 6.39 | 0.65 | 0.90 | Scoop rear; aft fuselage narrowing |
| 75% | 7.37 | 0.45 | 0.70 | Canopy end region |
| 85% | 8.36 | 0.30 | 0.55 | Tail cone |
| 95% | 9.34 | 0.22 | 0.45 | Tail cone |
| 100% | 9.83 | 0.14 | 0.35 | Tail end |

#### Canopy (bubble, D)

- **Start:** ~40-45% of length (est.), where the rear fuselage drops to the faired canopy base.
- **End (rear of bubble):** ~72-76% of length (est.).
- **Shape:** teardrop, cut down behind the pilot's head. Canopy highest point near 52-55% (est.). Height above fuselage about 0.5-0.6 m (est.).
- **Frame:** the D bubble has a thin metal frame with a sliding section. B/C canopy was a flat-sided "razorback" hood, framed, which could not open in flight (Wikipedia variants page).

#### Radiator belly scoop (est.)

- **Position:** centred under the fuselage, starting just behind the wing trailing edge (est. x ≈ 5.5 m, 56% of length) and extending aft to around x ≈ 6.7 m (68% of length).
- **Size:** roughly 1.0-1.2 m long, 0.45-0.55 m deep below the fuselage line (est.).
- **Shape:** a "chin" intake with a fairing that tapers into the fuselage. Front lip is rounded, outlet is a flat aft-facing slot.
- **Internal:** a single ducted water and oil radiator assembly (Wikipedia). The scoop is a visual cue more than a functional one for the game.

### 2.3 Wings (laminar flow)

- **Airfoil:** NAA/NACA 45-100 laminar-flow section (Wikipedia, tested at U. Washington Kirsten Wind Tunnel). VT slides say "NACA 6-series". Use 45-100 for the procedural profile, as an approximation.
- **Root chord:** 8.48 ft = **2.58 m** (VT PDF, secondary source).
- **Tip chord:** 3.87 ft = **1.18 m** (VT PDF, secondary source).
- **Taper ratio:** ~0.46 (computed from the above).
- **Tip shape:** rounded/square-ish, tip chord is the tip, no tip tanks, no wing fences. Some D wings have a slight extra chord near the root. Use a straight taper.
- **Leading-edge sweep:** effectively zero at the quarter chord (stunthanger forum, secondary). Leading edge sweeps slightly back, trailing edge sweeps forward more strongly. Estimate: leading-edge sweep ~2-3° (est.), trailing-edge sweep ~-6 to -8° (est.).
- **Position along fuselage:**
  - Root leading edge at ~35% of length (x ≈ 3.44 m, est.).
  - Root trailing edge at ~60% of length (x ≈ 5.9 m, est.; root chord 2.58 m).
  - Wing spans roughly 35-60% of length.
- **Mount:** low-wing monoplane, wing root sits on the lower fuselage. Wing-to-fuselage fillet is shallow.
- **Dihedral:** **(est.) about 3°** per panel (outer panels). Not verified. Check drawings before use.
- **Thickness (est.):** about 15% at the root and about 9% at the tip (unverified).
- **Washout:** from the DCS forum, root +0.25° to tip -0.85° (~1.1° total, secondary).
- **Wing tip position:** ~5.64 m from centreline (half of 11.28 m span).
- **Landing gear wells:** the main gear retracts inward into wing roots, under the wing.

### 2.4 Tail

- **Vertical fin:** **(est.)** height about 2.4-2.6 m above the fuselage line, root chord about 1.5 m, tip about 0.7 m, with a rounded top. Leading edge swept back by ~35-40° (est.). The D fin is narrower at the top than the B/C fin. The rudder is large and balanced, with the horn balance (NACA flight-test report, rudder area 1.91 ft² horn balance per search result).
- **Dorsal fin fillet (D):** a fillet ahead of the fin, added in the field to D-5 aircraft and standard from P-51D-10-NA onward. Straight, low, tapering into the fuselage spine just aft of the canopy. Height (est.) about 0.35 m above the fuselage spine, length about 1.0 m.
- **Horizontal stabiliser (est.):** span about 4.5 m (half-span about 2.25 m), root chord about 1.3 m, tip chord about 0.8 m. Mounted on the fuselage at about 90% of length, low, roughly at fuselage centreline.
- **Elevator:** full-span, hinged behind the stabiliser.
- **Tail wheel:** fixed, small, under the tail cone.

### 2.5 Landing gear basics

- **Type:** conventional (tail-wheel) gear.
- **Main gear:** single wheel per leg, retracts inward into the wing. Track width (est.) about 3.3-3.5 m.
- **Tail wheel:** fixed.
- **Stance:** tail-wheel aircraft sits nose-up. Use this for the hangar pose.
- **Wheel size:** (est.) main wheel diameter about 0.8 m.

### 2.6 Top-view half-outline (x = metres from spinner tip, y = half-width)

Points go around the planform from nose to tail, along the starboard half (y positive = outboard). Mirror for port. Wing and tail are included. All est. except the span and root and tip chord figures, which are from the sources above.

```
(0.00, 0.00)   spinner tip
(0.39, 0.22)   spinner base
(0.98, 0.35)   cowl
(1.97, 0.45)   cowl rear
(2.95, 0.50)   fuselage
(3.44, 0.52)   wing root LE
(3.90, 5.64)   wing tip LE (est.)
(5.10, 5.64)   wing tip TE (est.)
(5.90, 0.52)   wing root TE (est.)
(6.39, 0.48)   fuselage
(7.37, 0.40)   fuselage
(8.36, 0.28)   tail cone
(8.70, 0.22)   tail cone to stab root
(8.75, 2.25)   stabiliser LE tip (est.)
(9.40, 2.25)   stabiliser TE tip (est.)
(9.45, 0.18)   stabiliser root TE
(9.83, 0.14)   tail end
```

### 2.7 Side-view outline (x = metres from spinner tip, z = metres above fuselage reference line)

Fuselage reference line is the horizontal datum, and the aircraft's trim attitude is not included. All values est.

**Top profile (z up):**

```
(0.00,  0.00)   spinner tip
(0.39,  0.22)   spinner top
(0.98,  0.42)   cowl top
(1.97,  0.55)   cowl top
(2.95,  0.62)   fuselage top ahead of canopy
(3.44,  0.66)   wing root LE
(4.42,  0.75)   canopy start
(5.41,  0.92)   canopy rising
(6.00,  1.10)   canopy top
(6.40,  1.25)   canopy top
(7.00,  1.20)   canopy end
(7.37,  1.05)   canopy end
(7.80,  0.90)   dorsal fillet start
(8.36,  0.70)   tail cone top
(8.90,  0.95)   fin LE base
(9.30,  1.80)   fin LE top
(9.60,  2.40)   fin top
(9.83,  1.90)   fin TE
```

**Bottom profile (z up, negative below datum):**

```
(9.83, -0.10)   tail end bottom
(9.40, -0.25)   tail cone bottom
(8.36, -0.35)   tail cone bottom
(7.37, -0.40)   fuselage bottom
(6.67, -0.48)   scoop rear lip
(6.40, -0.52)   scoop bottom
(5.90, -0.45)   scoop front lip
(5.41, -0.42)   fuselage bottom
(4.42, -0.42)   fuselage bottom
(3.44, -0.52)   wing root bottom (wing sits here)
(2.95, -0.50)   fuselage bottom ahead of wing
(1.97, -0.42)   cowl bottom
(0.98, -0.30)   cowl bottom
(0.39, -0.18)   spinner bottom
(0.00,  0.00)   spinner tip
```

---

## 3. Distinctive features checklist (most important first)

1. **Bubble canopy on a cut-down fuselage (D).** Teardrop glass behind the pilot, fuselage behind it drops sharply. This is the single most recognisable cue of the D, and it separates it from the B/C razorback.
2. **Long, narrow-chord laminar wing with a pronounced taper**, shown from above and the front. Low mounted on the fuselage.
3. **Belly radiator scoop under the aft fuselage**, just behind the wing trailing edge. A bump that reads as "Mustang" at a glance.
4. **Dorsal fin fillet** ahead of the vertical fin (D-10 onward). Absent on early B/C and on D-5 before the field fix.
5. **Four-blade Hamilton Standard prop with a rounded spinner.** Stubby compared to a Spitfire or Bf 109.
6. **Six .50 cal guns**, three in each wing, clearly visible on the wing leading edge as a row of gun ports (D). B/C had four.
7. **Tail wheel stance, nose up.** The aircraft looks purposeful in a hangar because of the stance.
8. **Large, squared rudder with the balance horn**, tall and blocky from the side.
9. **Wing hard points** under each wing for drop tanks (typically 108 gal or 110 gal) and HVAR rockets.
10. **Sleek, slim overall proportion.** Clean-looking, no cowl flaps (use small flap detail only).

---

## 4. Paint and liveries

### 4.1 Real schemes (6-10)

Hex colours are **(est.)**. They are approximations of WWII photo appearance and must be checked against a colour reference before use. The sources did not give hex values.

1. **Natural metal (bare metal finish, "NMF")**
   - Description: polished aluminium, most common finish on D-model late-war aircraft, and the look of the Mustang's most famous photos.
   - Main: #C9CDD0 (est.). Secondary: #A8ADB1 (est.) for panel lines. Accent: #1B1B1B (est.) for the canopy surround and rudder. Markings: US star-and-bar (white/blue/red).
   - Source for the existence of bare-metal D-models: Wikipedia and VT context (general knowledge).

2. **Olive drab (OD) and neutral grey**
   - Description: earlier camouflage on P-51s, with OD upper surfaces and neutral grey lower.
   - Main (upper): #4B5320 (est.). Secondary (lower): #8E9B9E (est.). Accent: #222222 (est.). Markings: US star-and-bar.

3. **Tuskegee Airmen, 332nd Fighter Group "Red Tails"**
   - Description: all-red tail, in use from 1944-45. Group was known during the war as the "Red Tails". One restored D, "Tall in the Saddle", is repainted in the original 332nd scheme (search result).
   - Main: natural or olive aluminium (est.). Secondary: red tail. Accent: #C8102E (est.) red. Markings: star-and-bar.
   - Tail hex: #B5121B (est.), a deeper red for the rudder and tailplane.

4. **Invasion stripes (D-Day era)**
   - Description: black-and-white stripes on wings and fuselage for D-Day recognition in June 1944. Common on P-51B/C and early D.
   - Main: OD or natural metal (est.). Secondary: #FFFFFF (est.). Accent: #111111 (est.). Stripe pattern: three bands on the wings and fuselage, the number used depends on the unit.

5. **78th Fighter Group checkerboard nose ("Big Beautiful Doll", Lt. John D. Landers)**
   - Description: black-and-white checkerboard on the nose, black rudder. Landers's sources also show the wing-tip checks and a 361st FG post-war livery (blue rudder/canopy surround, yellow nose) per the Modelingmadness/IPMS reviews.
   - Source: Modelingmadness Lifelike 48-051 review, treefrogtreasures.com (serial 44-72218, WZ-I code, 78th FG, Duxford 1945).
   - Main: natural metal (est.). Secondary: #111111 (est.) black. Accent: #FFFFFF (est.) white. Markings: checkerboard on the nose, star-and-bar.

6. **357th Fighter Group, yellow nose ("Yellow Nose" / "Yellow Nose Gang")**
   - Description: yellow nose with red and yellow markings on tailplane. Early D aircraft had the standard white nose and tailplane bands. Nose art was common.
   - Source: modeling sources (search result). The 357th is credited as the top scoring FG with P-51Ds of the 8th USAAF (search result, secondary).
   - Main: natural metal or OD (est.). Secondary: yellow #F2C200 (est.). Accent: red #C8102E (est.).

7. **Reno air racer, "Strega" (name only; racing livery not verified)**
   - Description: a clipped-wing, polished Reno racing Mustang. Racing Mustangs were modified (cut-down canopy, cut wings, cooler inlets). Strega was one of the famous named racers. Design details not verified this session.
   - Main: polished bare metal (est.). Accent: #E5A000 (est.) gold stripe. Markings: race numbers.

8. **Big Beautiful Doll (Lt. John Landers)** — covered above under 78th FG. Sources disagree on Landers's earlier aircraft, all named "Big Beautiful Doll". The name also appears on the Saving Private Ryan replica (Old Flying Machine Company, wears 78th FG markings).

9. **"Man O' War" (355th FG, Pacific theatre)**
   - Description: named Mustang with a painted horse-and-rider or emblem (search result mentions a Man O' War scheme, details not verified).
   - Main: natural metal (est.). Accent: red and blue (est.).

10. **Louisiana Kid (P-51D-25-NA, Degerfeld 2016 display)**
   - Description: a restored D, shown at Degerfeld airfield in 2016 (Wikipedia variants page). Scheme not described.
   - Main: natural metal (est.).

### 4.2 Mod ladder for the game

| Rung | Name for kids | Scheme | Notes |
|---|---|---|---|
| Free default | "Shiny Silver Star" | Natural metal, US star-and-bar | Starter paint, always unlocked. |
| Rung 1 | "Army Green Adventure" | Olive drab and neutral grey | Earned with first Bolts milestone. |
| Rung 2 | "Red Tail Hero" | 332nd Tuskegee scheme, red tail | Unlock with a streak of correct times. Tie to a story about the Tuskegee Airmen, kid-appropriate. |
| Rung 3 | "Checkerboard Champ" | 78th FG checkerboard nose | Unlock by completing all clock levels. |
| Legendary | "Rainbow Thunder" | Fantasy: shimmering rainbow stripes over bare metal, gold star | Not historical, label clearly. |

---

## 5. Armament and stores

### 5.1 Real loadouts (sourced)

- **Guns:** six .50 cal (12.7 mm) AN/M2 Browning machine guns (WRG page). Total ammunition 1,880 rounds (WRG page). Three per wing on the D, four on B/C (Wikipedia variants page says B/C had four, two per wing).
- **Hard points:** the WRG page says "2 hardpoints for up to 2,000 lb (907 kg) of bombs". Other references show two bombs under the wings (**verify** exact count; this is the sourced figure).
- **Rockets:** "6 or 10× T64 5.0 in (127 mm) H.V.A.R rockets" (WRG page, P-51D-25 and P-51K-10 onward).
- **Drop tanks:**
  - 108 US gal (410 L) (Wikipedia photo caption, P-51D).
  - 110 US gal (420 L) (Wikipedia, used over Europe).
  - 165 US gal (620 L) (Wikipedia, used for Japan).
- **Fuselage fuel tank:** 85 US gal (320 L) behind the pilot, added to P-51B-10 (Wikipedia). Some D-models also used it, which worsened handling.
- **Internal fuel for D:** not given in the sources I read (**unknown**).

### 5.2 Hard point positions (est.)

- Wing hard points: one under each wing at about 40% semi-span (est.), approximately x ≈ 4.5 m (est.), just under the wing.
- Drop tanks mount on the same points as the bombs.
- Gun ports: row of six ports along the wing leading edges (est. at about 30% semi-span and 60% semi-span).

### 5.3 Mod ladder (kid-friendly names)

| Rung | Name | Loadout | Animation |
|---|---|---|---|
| Free default | "Six Sparkle Guns" | Six .50 cal guns, no stores | Muzzle flash (small) on fire. |
| Rung 1 | "Pop-Pop Bombs" | Two small bombs under the wings | Bombs drop when triggered. |
| Rung 2 | "Rocket Rainbow" | Six HVAR rockets (three per wing, est.) | Rockets fire with a trail. |
| Rung 3 | "Extra Fuel Friend" | Drop tanks (108 gal) | Tanks drop off in a puff. |
| Legendary | "Star Shooter" | Fantasy: twinkle-star bombs and sparkle rockets | Fantasy, label clearly. |

---

## 6. Engines and propulsion

### 6.1 Real engines

- **P-51D:** Packard V-1650-7 (licence-built Rolls-Royce Merlin 66). Liquid-cooled supercharged V-12 (WRG page).
- **Power:** 1,490 hp (WRG page, rating not given). War emergency power (WEP) 1,720 hp (search snippet, secondary, Wikipedia says 1,720 at WEP per search summary).
- **Propeller:** four-blade Hamilton Standard, constant-speed. Diameter 11 ft 2 in = 3.40 m (Wikipedia variants page). Cuffed blades early, uncuffed later.
- **P-51K (Dallas-built):** 11 ft Aeroproducts propeller (Wikipedia variants page).
- **Earlier P-51A:** Allison V-1710-81 (background knowledge, not verified this session). Early Mustang I (RAF) also Allison.
- **B/C:** Packard V-1650-3 early, V-1650-7 on later B-10 and most C.
- **Two-stage supercharger:** the Merlin 60 series in the B/C had two-stage intercooled supercharging (Wikipedia). The D used the V-1650-7 (Merlin 66).

### 6.2 Exhaust stacks

- **Look (est.):** short, individual exhaust stacks along both sides of the engine cowl, angled rearward. Pale grey-brown staining at the ends. Each pipe is about 0.2 m long, 0.04 m diameter (est.).
- **Night flame:** real Merlins produced visible flame at night, most visible on the stacks at high power settings. Use an orange-yellow emissive cone at each stack (est.).

### 6.3 Engine mod ladder

| Rung | Name | Change | Visual |
|---|---|---|---|
| Free default | "Merlin Thunder" | Packard V-1650-7, 1,490 hp | Stock stacks, grey. |
| Rung 1 | "Turbo Whistle" | WEP setting, 1,720 hp | Brighter stack glow when throttled up. |
| Rung 2 | "Cloud Racer" | Reno racing engine: polished cowl, extra cooler inlet | Shiny cowl; wind smear on the cowl. |
| Rung 3 | "Night Flame" | Extra-bright stack flames | Flame cones animate at night. |
| Legendary | "Dragon Breath" | Fantasy: rainbow sparkle exhaust, gold spinner | Fantasy, label clearly. |

---

## 7. Other cool mods specific to this aircraft (4-8)

1. **Nose art (decal swap on the nose):** choose from simple cartoon animals or stars. Animates on hover (a small wiggle). Based on the nose-art tradition of the 357th and 78th FG.
2. **Mission marks (not kill marks):** stars or small icons painted under the cockpit, one per "level completed". Kid-friendly alternative to historical kill markings. Shown as a row of small stars that light up.
3. **Canopy mod:** bubble canopy opens (slides back) when the aircraft is parked. Canopy frame colour choice. Animates on tap.
4. **Prop colour and spinner:** tint the spinner (red, yellow, blue) and blade tips (black on some units, est.). Prop spins when the engine starts.
5. **Smoke system for air shows:** coloured smoke trail (white, red, blue) from wing-tip or tail. Trail fades behind the aircraft. Uses particles.
6. **Racing mod ("Reno Racer"):** clipped wings (shorter span, est.), polished bare metal, race number decal. Shows a speed streak effect.
7. **Dorsal fin toggle:** show the D-10 fillet or the earlier D-5 version. Cosmetic only.
8. **Tail wheel and gear animation:** gear retracts in the hangar when the player taps the wheel. Gear doors animate.

---

## 8. Sound

- **Character:** Merlin-family V-12 roar, with a distinctive supercharger whine (search results: Mustang has "unmistakable roaring, whistling sound", anecdotal). The Packard supercharger drive is said to add a sharper whine than the Spitfire's throatier growl (forum, anecdotal).
- **Synthesis notes (est.):**
  - Base: a 12-cylinder firing frequency. At ~2,700 rpm, firing frequency is 2,700 x 6 / 60 = 270 Hz (est.; V-12 four-stroke fires 6 times per crank revolution). Use 180-300 Hz tonal band.
  - Supercharger whine: a high tone about 1.5-2x the firing frequency, rising with throttle (est.).
  - Exhaust: mid-band crackle layer, short noise bursts on throttle changes.
  - Idle: low, rough, around 800-900 rpm (est.). Full power: deeper and fuller.
  - Night flame: add a short popping layer on throttle-down (backfire; a flight-sim sound pack mentions backfire effects, search result).
- **Web Audio plan:** sawtooth or triangle oscillator at firing frequency, lowpass filter, a bandpass noise for the whine, a short noise burst gated for exhaust crackle.
- **Sample source:** a commercial P-51 sound library (Sonniss) exists, 94 files, 96 kHz 24-bit. Licence not checked, so do not ship without checking.

---

## 9. Openly licensed 3D models

Searches for Sketchfab and Poly Pizza turned up no suitable openly licensed P-51 model. Results below are verified by fetching the page.

1. **OpenGameArt: P51 Mustang (James Jackaman)**
   - URL: https://opengameart.org/node/11402
   - Licence (as stated on page): **CC-BY 3.0**.
   - Format: ZIP (P51.zip, 18.7 MB), file types inside not named on the page.
   - Polygon count: **12,258 faces** (as stated on the page).
   - Quality notes: UV-unwrapped and textured, WWII fighter. Page does not mention landing gear, a propeller, or a cockpit. Requires attribution to James Jackaman. Probably too rough for the game without rework. Likely requires full attribution in-game.

2. **Wikimedia Commons: North American P-51D EG-0068-01.svg (NASA)**
   - URL: https://commons.wikimedia.org/wiki/File:North_American_P-51D_EG-0068-01.svg
   - Licence (as stated on page): **public domain** in the US, "solely created by NASA" (Tom Tschida, 4 Feb 1998, NASA Dryden gallery).
   - Format: SVG, 348 x 238 px nominal (scalable).
   - Polygon count: N/A (2D drawing).
   - Quality notes: this is a **three-view orthographic drawing** (file page categories). Useful as a drawing reference to measure against, not a 3D model. Hidden category suggests orientation classification is still under review (check the drawing itself before relying on it).

3. **TurboSquid: P-51 Mustang low poly (JonLundy3D)** — **not verified**. Found via search only. Paid ($10 standard licence), 1,100 polygons, 1024 texture, separate landing gear and propeller objects. Licence says "Editorial Uses Only" in the listing header; not suitable without checking. Not fetched.

4. **CGTrader: P-51 Mustang (historic aircraft listing)** — **not verified**. Royalty-free licence per search snippet; not fetched.

5. **Unity Asset Store: WW2 US Fighter Aircraft P51 Mustang** — **not verified**. Listing says PBR textures, 2048 texture, no interiors, no animations, no sounds. Unity asset licence, not usable in a web game without a different licence check.

**Summary:** no open-licence (CC0/CC-BY) P-51 3D model verified as suitable. Use the NASA SVG drawing for measuring, and build the fuselage and wing procedurally from the numbers in section 2.

---

## 10. Reference sources

### Verified (fetched this session)

- Wikipedia, North American P-51 Mustang: https://en.wikipedia.org/wiki/North_American_P-51_Mustang (engine, armament, fuel, B/C vs D; spec table not reached in first 300,000 characters).
- Wikipedia, P-51 variants: https://en.wikipedia.org/wiki/North_American_P-51_Mustang_variants (B/C vs D canopy, armament, dorsal fin, propeller, named aircraft).
- Warbirds Resource Group, P-51 specifications: https://www.warbirdsresourcegroup.org/URG/p51mustang_specifications.html (dimensions, weights, engine power, speed, armament, rockets, range).
- Virginia Tech P-51D analysis slides: https://archive.aoe.vt.edu/mason/Mason_f/P51DMustang.pdf (chord values; PDF is image-only, figures from search snippet, secondary).
- Wikimedia Commons, NASA three-view SVG: https://commons.wikimedia.org/wiki/File:North_American_P-51D_EG-0068-01.svg (licence, author, size).
- Wikimedia Commons, P-51 category: https://commons.wikimedia.org/wiki/Category:North_American_P-51_Mustang
- OpenGameArt P51 Mustang: https://opengameart.org/node/11402 (licence, faces).
- NASA Dryden gallery (linked from Commons): http://www.dfrc.nasa.gov/Gallery/Graphics/P-51D/

### Search results only (not fetched in full)

- Stunthanger wing geometry forum: https://stunthanger.com/smf/stunt-design/wing-profile (sweep, secondary).
- DCS forum, P-51 roll rate and airfoil discussion: https://forum.dcs.world/topic/114345-dora-roll-rate-and-turning-rate-true-to-real-life-data/page/6 (airfoil and washout, secondary, informal).
- Modelingmadness Lifelike 48-051 review (78th FG markings): https://mail.modelingmadness.com/scott/decals/lifelike/ll48051.htm
- IPMS USA review, Big Beautiful Doll: https://reviews.ipmsusa.org/review/north-american-p-51-mustang-pt5-big-beautiful-doll-special
- American Air Museum, 44-72218: https://americanairmuseum.com/media/2800
- Treefrog Treasures, 44-72218 print: https://treefrogtreasures.com/p-39887-north-american-p-51d-mustang-usaaf-78th-fg-44-72218-big-beautiful-doll-john-landers-raf-duxford-england-1945.aspx
- Armedconflicts.com (Czech page, 3,400 mm propeller): https://www.armedconflicts.com/-t58942
- Eduard info, P-51D markings: https://info.eduard.com/en/01-2024-1/markings-for-p-51d-5-mustang-1-48
- Sonniss P-51 sound library: https://sonniss.com/sound-effects/p-51-mustang-sound-library/

### Not reached

- National Museum of the USAF fact sheet: returned HTTP 403.
- Poly Pizza P-51 search: returned HTTP 503.
- Sketchfab search: no P-51 aircraft model appeared in the results page.
- Aviastar P-51 tail dimensions: not found in search.

### Still needed before shipping

- Wing dihedral and thickness ratio (est. values used).
- Tail (fin and tailplane) dimensions (est. values used).
- Fuselage stations (est. values used). Measure from a three-view.
- Internal fuel capacity for D.
- Hex colours for every livery (all est.).

---

## Summary of verified vs est.

- **Verified (cited):** overall length, wingspan, height, wing area, weights, engine, 1,490 hp, 1,720 hp WEP (search), prop diameter 3.40 m, six .50 cals, 1,880 rounds, HVAR rockets, drop tank sizes, D bubble canopy, dorsal fin from D-10, root and tip chord (secondary), airfoil name, 78th FG and 332nd and 357th basics.
- **Estimated (est.):** every fuselage station, canopy stations, radiator scoop, wing dihedral and thickness, tail, all colour hex values, sound parameters, hard point positions.
