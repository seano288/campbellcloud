# Bell Boeing V-22 Osprey: research notes for a procedural 3D hangar model

Conventions: all dimensions are sourced unless marked **(est.)**. Where sources disagree, both values are given. Imperial figures are converted to metric as the sources print them. Colour hex values are approximations and are marked (est.) unless noted.

Primary sources used are listed in section 10. Short tags used below: [WIKI] Wikipedia, [BOEING] Boeing product page, [NHHC] Navy Naval Aviation History page (snippet only, see section 10), [GS] GlobalSecurity (search snippet only, page returned HTTP 402), [FORUM] forum or hobby page, [EST] my estimate.

---

## 1. Identity

- **Full name:** Bell Boeing V-22 Osprey (Bell-Boeing V-22 Osprey on Wikipedia).
- **Designations:** MV-22B (USMC assault transport), CV-22B (USAF, Special Operations), CMV-22B (USN carrier onboard delivery). Pre-production: V-22 / V-22A. [WIKI]
- **Nicknames:** "Osprey" is the usual name. Marines sometimes call it the "Ospry" or "Vertibird" in informal talk (unverified, do not use in-game).
- **Maker:** Bell Helicopter (now Textron) and Boeing (Boeing Rotorcraft Systems). Bell is responsible for the wing/nacelle/rotor system and ramp; Boeing for the fuselage. [GS search snippet]
- **Era:** First flight 19 March 1989 in helicopter mode; 14 September 1989 in airplane mode (one source gives 1988, judged wrong). Marine Corps MV-22 initial operational capability 13 June 2007. Air Force fielding 2009. Japan (JGSDF) first delivery 2020 at Camp Kisarazu (one source says May 2020; July 10, 2020 is the more common date). [WIKI, search snippets]
- **Role:** Tiltrotor VTOL transport. Takes off and lands like a helicopter, flies like a turboprop plane.
- **Crew:** Cockpit seats per variant: 2 pilots (MV), 3 (CV), 2 (CMV). [BOEING] Wikipedia lists 3-4 crew (pilot, copilot, and 1-2 crew chiefs/loadmasters/gunners). [WIKI] Use 2 pilots plus 1-2 crew chiefs in-game.
- **Passengers:** Up to 24 troops seated, 32 floor-loaded. [WIKI, BOEING]

### Kid-friendly voice lines (each under 12 words, checked against sources)

1. "It can fly like a plane AND land like a helicopter!" (11 words) - true: VTOL tiltrotor.
2. "Its engines tilt up, so it can take off straight up!" (10 words) - true: nacelles rotate to 90° for helicopter mode.
3. "It can carry 24 people, all in one ride!" (9 words) - true: 24 seated troops.
4. "Its two spinning rotors are as long as a school bus!" (10 words) - rotor diameter about 38 ft, a school bus is about 35-40 ft (est. comparison).
5. "It flies almost twice as fast as a helicopter!" (9 words) - Boeing says "nearly twice" a helicopter's speed, [BOEING].

---

## 2. Geometry for procedural modeling

### 2a. Overall dimensions (table)

| Item | Value (metric) | Imperial as printed | Source / note |
|---|---|---|---|
| Fuselage length (nose to ramp) | **17.47-17.48 m** | 57 ft 4 in (Wiki); 57.3 ft (Boeing) | [WIKI] [BOEING] |
| Length, stowed (folded) | 19.09 m (Wiki) / 19.2 m (Boeing) | 62 ft 7.6 in (Wiki); 63 ft (Boeing); 62 ft 7 in (NHHC) | sources differ by ~0.1 m |
| Wingspan (wing tip to wing tip, excluding rotors) | **13.97 m** | 45 ft 10 in | [WIKI] also a CV-22 sheet (search snippet) |
| Width with rotors turning (rotor tip to rotor tip) | **25.8 m** (half = 12.9 m) | 84.6 ft (Boeing/GS); 84 ft 7 in (GS); 83 ft 8 in (NHHC); 84.5 ft (aerospaceweb) | sources differ; use 25.8 m |
| Width stowed (rotors folded) | 5.6 m | 18.4 ft | search snippet on spec sheet |
| Height, nacelles vertical (helicopter mode, top of rotor/nacelle) | **6.73 m** | 22 ft 1 in (Wiki); 22.1 ft (Boeing) | [WIKI] [BOEING] |
| Height to top of tail fins / stabilizer | 5.0 m (Wiki, "top of tailfins") / 5.5 m (Boeing, "stabilizer") | 17 ft 7.8 in / 17.9 ft | sources differ |
| Wing area | **28.00 m²** (Wiki) | 301.4 sq ft | a CV-22 sheet (search snippet) gives 382 sq ft; treat as unresolved, use 28.0 m² |
| Average wing chord (derived) | ~2.00 m | | [EST] 28.00 m² / 13.97 m = 2.00 m |
| Empty weight | 14,432 kg | 31,818 lb (Wiki); other sources 33,140 lb (GS snippet) | differs by config |
| Gross weight | 17,917 kg | 39,500 lb | [WIKI] |
| Max take-off, VTOL | 23,859 kg | 52,600 lb | [WIKI] [BOEING] |
| Max take-off, STOL | 25,855 kg | 57,000 lb | [WIKI] |

Use for in-game scale: **the fuselage is 17.5 m long; the wing span is 14 m; the rotor span is 25.8 m.** The rotors are nearly twice the wing span, which is the most important proportion to get right.

### 2b. Rotors (proprotors)

- **Count:** 2, one per nacelle, at each wing tip. [WIKI]
- **Diameter:** 11.6 m per rotor (38 ft 1 in per Wiki; 38.1 ft per Boeing). Rotor radius = **5.8 m**. [WIKI] [BOEING]
- **Blades:** **3 per rotor**, 3-bladed. [WIKI] (One search snippet, citing Helis, said "six blades per rotor" in total; this is consistent with 3 + 3 for the two rotors, not 6 each.)
- **Disc area:** 2,268 sq ft (210.7 m²) for both rotors combined (Wiki). Per rotor: about 1,134 sq ft (105.4 m²) [EST, half of Wiki total].
- **Blade area:** 261.52 sq ft (24.30 m²) per rotor (fact sheet snippet). [search snippet]
- **Average blade chord (derived, est.):** 24.30 m² / (3 blades × 5.8 m) ≈ **1.40 m** (~55 in, ~4.6 ft). This is a back-of-envelope estimate, not a published value. The real chord is taper-varying; use a linear taper from ~1.7 m at root (est.) to ~1.0 m at tip (est.).
- **Airfoil:** One university analysis models the blade section as NACA 63-212 with about -35° geometric twist root to tip. [search snippet, student work, low authority]. A NASA/AHS paper cites an effective twist of 47.5° over a 228.5 in radius. These measure different things; for modelling, use **about 35° total twist root to tip (est.)**.
- **Blade radius:** 5.8 m (tip radius, from diameter).
- **Spinner / hub:** Not dimensioned in sources. [EST] Hub spinner radius about 0.35 m (est.), a short cone at the hub.
- **Blade folding:** Rotors fold to stow in about 90 seconds. [WIKI]. Blades fold toward the nacelle rear to lie along the wing (est.: fold is a 90° rotation of each blade about the hub, in the rotor plane).

### 2c. Nacelles

- **Engines:** 2 Rolls-Royce AE 1107C Liberty. US designation T406-AD-400. [WIKI]
- **Nacelle diameter:** not found in sources. [EST] 1.1-1.3 m near the engine bulge (est.).
- **Nacelle length (engine + gearbox + pylon):** not found. [EST] about 6.0 m from rotor hub to the trailing end (est.).
- **Tilt pivot:** The nacelle and rotor pivot as one unit at the **wing tip**, on the wing's spanwise axis (est.; the wing tip is where the pivot is physically located). The pivot is at the nacelle's mid-length, approximately on the wing tip chord line (est.).
- **Tilt range (Wiki):**
  - 0° = nacelles vertical (helicopter mode, takeoff/landing), up to 90° in as little as 12 seconds.
  - 0-45° = STOL operations (about 45° for short takeoff).
  - 80° = "80 Jump" takeoff (Wiki).
  - 90° = airplane mode, nacelles horizontal, pointing forward.
  - Up to 97.5° = rearward flight (Wiki).
  - Caution: the source's 90°/0° sense is "nacelles rotate forward 90°", so **0° is vertical and 90° is horizontal**, the reverse of a pure helicopter-to-plane angle label. Use: `tilt = 0 (vertical/hover)` → `90 (horizontal/forward flight)`, with `97.5` for rearward.

### 2d. Wing

- **Position:** High-mounted wing on top of the fuselage. [WIKI, consistent with the picture] Wing root sits roughly at the cabin centre (est.: wing root leading edge at fuselage x ≈ 6.0 m from nose; est.).
- **Span:** 13.97 m (45 ft 10 in). Half-span 6.98 m.
- **Mean chord:** ~2.0 m (derived from 28.0 m² / 13.97 m). Root chord est. 2.4 m, tip chord est. 1.6 m (est.), giving ~2.0 m average.
- **Sweep:** The user brief says ~6° forward sweep. **Not verified** in any source I could fetch; treat as an unconfirmed brief figure. If used: leading edge tip is forward of root by 7.0 × tan(6°) = **0.74 m**.
- **Stowage:** The whole wing rotates 90° about the fuselage's long axis to lie parallel with the fuselage (Wiki: "wing rotates to align front-to-back with the fuselage"). In stowed config the wing is folded (rotated) rather than folded in two. The nacelles also rotate to stow. [WIKI]
- **Stowed width:** 5.6 m (18.4 ft) per the stowed-width figure, which includes the stabilizer span in one snippet. [search snippet; ambiguous]

### 2e. Tail

- **Configuration:** H-tail (horizontal stabilizer with a vertical fin at each tip). [WIKI, standard for V-22]
- **Stabilizer span (tip to tip):** about 5.6 m (est. from "stabilizer 17.9 ft" context is unclear; treat the 5.6 m as the horizontal stabilizer span, est.).
- **Vertical fins:** Two fins, one at each tip of the stabilizer. Height above stabilizer est. 1.5-2.0 m (est.). Fin chord est. 1.2 m (est.).
- **Overall tail height:** 5.0 m to top of fins (Wiki), 5.5 m (Boeing "stabilizer"). Use 5.2 m (est. midpoint).

### 2f. Fuselage

- **Cabin (internal, from NAVAIR figures quoted by a secondary source):** length 24.17 ft (7.37 m) max; width 5.92 ft (1.80 m) max; height 6.00 ft (1.83 m) max. [FORUM via popasmoke]
- **Cargo space (Navy excerpt):** 200 in × 68 in × 66 in (508 × 173 × 168 cm). [FORUM]
- **Cabin volume:** about 858 cu ft (24.3 m³) (George Curtis 2003, citing periscope1.com). [FORUM]
- **Outer fuselage width:** not found. [EST] about 2.3 m (half-width ~1.15 m) (est.). Cabin is 1.8 m wide internally, so outer skin plus floor/sidewall ~ 0.25 m each side.
- **Outer fuselage height (cabin roof to floor):** not found. [EST] about 2.5 m (est.), 1.8 m cabin + floor and roof structure.
- **Cross-section shape:** Boxy, rounded-corner rectangle (est.). Top is slightly flatter; bottom is flat with sponsons.
- **Nose:** Rounded, slightly pointed, with the cockpit windscreen.
- **Refuelling:** Sources describe a **roll-on/roll-off tanker kit** (hose/drogue, up to 12,000 lb fuel) that deploys from the rear ramp, which must be open to extend the hose (Wiki). A Wiki photo caption shows a CV-22 connecting to a refuelling probe, but **the position and shape of a nose probe are not verified**. For the in-game model, a nose probe is (est.) a short cylinder about 0.6 m long, 0.04 m radius, on the nose, and it is optional. Prefer the ramp hose as the sourced refuelling cue.
- **Cockpit glazing:** Not dimensioned in sources. [EST] windscreen spans fuselage x ≈ 0.6 m to 2.4 m (est.), top z ≈ 1.6 m (est.), with side windows to x ≈ 3.5 m (est.).
- **Side sponsons:** Two sponsons on the fuselage sides. CMV-22B uses "larger external sponsons" carrying extra fuel bladders (Wiki); this is listed as its only external difference. [WIKI] Standard sponsons house main landing gear and fuel (est.; common description, not confirmed in the sources I fetched). Sponson position est. at x ≈ 9.0-11.5 m from nose (est.), width about 0.7 m out from the fuselage side (est.), height about 1.0 m (est.).
- **Rear ramp:** Opens to the rear, down (est.). Rappelling and hoisting happen through the ramp because rotorwash usually prevents using the starboard door in hover [WIKI]. Ramp must be open to extend the refuelling hose (Wiki). **Ramp size: not verified.** One forum quote gives the H-46-era rear opening as 6 ft × 6 ft (1.83 m × 1.83 m); the V-22's ramp is comparable (est.). Use 1.8 m wide × 1.8 m high opening (est.).
- **Landing gear:** Tricycle layout (nose wheel + two main gear). Main gear retract into the fuselage sponsons (est.). Nose gear under the forward fuselage (est., typical tricycle).

### 2g. Top-view outline (half, one side)

x = metres from nose (x = 0), y = half-width outward from centreline. All est. except where the source says so.

**Fuselage (half-width, nose to tail)**

```
(x, y)
(0.00, 0.00)   nose tip
(0.30, 0.50)
(0.80, 0.85)
(1.50, 1.05)
(2.50, 1.15)
(4.00, 1.18)
(8.00, 1.18)
(12.00, 1.18)
(14.50, 1.10)
(15.80, 0.90)
(16.80, 0.60)
(17.47, 0.30)  rear ramp corner
(17.47, 0.00)  tail centreline (ramp edge)
```

**Wing (half, root to tip)**

```
(6.00, 1.18)   wing leading edge at root
(5.26, 6.98)   wing leading edge at tip (6° forward sweep, est.)
(6.86, 6.98)   wing trailing edge at tip (chord 1.6 m, est.)
(8.40, 1.18)   wing trailing edge at root (chord 2.4 m, est.)
```

**Nacelle + rotor (half, plan view, est.)**

```
(5.30, 6.98)   rotor hub line
(5.30, 12.90)  rotor tip (radius 5.8 m, outward from centre 6.98 + 5.8 = 12.8 m)
(4.50, 7.80)   nacelle front (est.)
(10.50, 7.80)  nacelle rear (est.)
```

Note: the rotor disc is seen edge-on from above; in plan view it is a line of length 2 × 5.8 m centred on the hub, lying in the plane x = 5.3 m, so the rotor span is drawn as a line from y = 6.98 - 5.8 = 1.18 to 12.8 m only in helicopter mode. In airplane mode the disc is a vertical circle in the plane of the nacelle. Model both.

**Tail (H-stabilizer, half)**

```
(15.20, 1.20)   stabilizer root LE
(15.20, 2.80)   stabilizer tip LE (span 5.6 m, est.)
(16.80, 2.80)   stabilizer tip TE (chord 1.6 m, est.)
(17.10, 1.20)   stabilizer root TE
```

Vertical fin (plan, est.): fin root at y = 2.80, chord 1.2 m, x from 15.9 to 17.1.

### 2h. Side-view outline (fuselage, est.)

x = metres from nose, z = height above ground (z = 0 at ground). Top outline, nose to tail (est.):

```
(x, z)  TOP
(0.00, 1.10)   nose tip
(0.50, 1.40)
(1.50, 1.70)
(3.00, 2.00)   windscreen top
(4.50, 2.20)
(6.00, 2.25)   cabin roof
(9.00, 2.25)
(12.00, 2.25)
(14.50, 2.10)
(16.00, 1.90)
(17.00, 1.80)
(17.47, 1.60)  ramp top
```

Bottom outline, tail to nose (est.):

```
(x, z)  BOTTOM
(17.47, 0.80)  ramp bottom edge
(16.50, 0.70)
(15.00, 0.80)
(12.00, 0.90)
(9.00, 0.90)   sponson bottom
(6.00, 0.80)
(3.00, 0.70)
(1.20, 0.60)
(0.30, 0.80)
(0.00, 1.10)   nose tip (closes outline)
```

Wheels: nose wheel at x ≈ 2.5 m, main gear at x ≈ 10.0 m, both reach z = 0 (est.).

Wing and nacelle side view (est.): wing top at z ≈ 2.5 m (est.), nacelle/rotor hub at the wing tip at z ≈ 2.6 m (est.) when in airplane mode. In helicopter mode the rotor disc is horizontal above the wing tip, top of disc at z = 6.73 m (per the Wiki/Boeing overall height).

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two big rotors on wing tips that tilt.** The signature; nacelles rotate between vertical and horizontal.
2. **Stubby, high wing with rotors bigger than the wingspan.** Rotor span 25.8 m vs wing span 14 m.
3. **Thick round nacelles with a short, fat pylon** on each wing tip.
4. **H-tail with two upright fins** at the tail-plane ends (not a single fin).
5. **Boxy, slab-sided cabin fuselage** with a flat bottom, plus side sponsons.
6. **Rear loading ramp** that opens to the back (hangs down, opens for hoist/rappel).
7. **Tricycle landing gear with the fuselage sitting close to the ground.**
8. **Machine gun on the ramp (M240 or .50 cal M2) and a remote turret under the belly (IDWS).**
9. **Nose refuelling probe** (est., unverified detail).
10. **Stowed config:** rotors fold and wing rotates along the fuselage (rare silhouette, good for a "fold" animation).

---

## 4. Paint & liveries

**Colour caution:** Hex values below are my approximations from the Federal Standard names, **(est.)**, not verified paint chips. Use them as art direction, not as authority. FS 36320 "Dark Ghost Grey" is confirmed as a Marine Corps tactical scheme colour in one source; the FS 36118 colour is not confirmed by any source I fetched.

### 4a. Real schemes (6 listed; 2 are unverified)

1. **USMC Tactical grey (default).**
   - Description: Standard MV-22B tactical grey, low-visibility, two-tone grey.
   - Source: a search snippet says FS 36320 Dark Ghost Grey is the third colour of the "Tactical Paint Scheme applied to the USMC MV-22 Osprey". [search snippet]
   - Hex (est.): main **#6B6E6A** (Ghost-grey family), secondary **#8A8D88**, accent **#3A3D3A** (dark), markings **#E8E8E8** (white stencil), (est.).
   - Caution: FS 36118 and the exact two-tone pattern are not verified.

2. **HMX-1 (Marine One squadron) dark green.**
   - Description: The squadron's MV-22s get HMX-1's dark green scheme on the nacelles, tail and fuselage, but **without the white tops** used on the VH-3D and VH-60N presidential helicopters. This is worth noting because "white top" is a helicopter feature, not an Osprey one. [search snippets: military.com, TWZ, Foreign Policy]
   - Hex (est.): main **#3F4A2F** (dark green), secondary **#6B6E6A** (grey underside), accent **#D9B44A** (gold seal, est.), markings **#FFFFFF**.

3. **Navy CMV-22B carrier onboard delivery (COD).**
   - Description: Navy high-visibility scheme for non-combatant identification; early examples carried a light grey and white scheme like the C-2 Greyhound it replaces, per TWZ. [search snippets]
   - Hex (est.): main **#D6D9DC** (light grey), white **#FFFFFF**, accent **#E06B1A** (hi-viz orange, est.), markings **#1D2B4F** (Navy blue, est.).
   - Note: The Navy's exterior markings were applied with a different paint process, and a laser-projection revamp is planned. [search snippet]

4. **USAF CV-22B (AFSOC).**
   - Description: Low-visibility grey, typical of AFSOC special operations. **Not verified from a source** in my searches; general knowledge only.
   - Hex (est.): main **#4B4F52** (dark grey), secondary **#2B2E30** (darker grey), markings **#A7A9AC**.

5. **JGSDF (Japan Ground Self-Defense Force).**
   - Description: Japan's Ospreys were delivered to Camp Kisarazu from 2020. **Colour scheme not found in my searches.** Use only as a mod concept, not a claim about the real paint.
   - Hex (est., concept only): main **#5C6B54** (olive grey-green), secondary **#8C9A84**, markings **#FFFFFF**.

6. **Early test / "white" prototype (concept only).**
   - Description: Prototype V-22s from 1989 (XV-15 lineage) were flown in test colours; I did not verify the scheme.
   - Hex (est., concept only): main **#F2F2F2**, accent **#B0B0B0**.

### 4b. Squadron markings

- Unit tail codes and squadron emblems vary by squadron. Verify individual squadron markings through DVIDS or a squadron photo before naming a real squadron in-game. Not verified here.

### 4c. Mod ladder (paint/livery)

- **Free default:** USMC Tactical grey (#1, real).
- **Rung 1 "Forest Friend":** HMX-1 dark green (#2, real). Kid-friendly name: "Forest Friend Green".
- **Rung 2 "Helper Orange":** Navy CMV-22B hi-viz / light grey and accent (#3, real). Name: "Helper Orange".
- **Rung 3 "Night Ninja":** USAF CV-22B dark grey, low visibility (#4, real but verify). Name: "Night Ninja Grey".
- **Legendary "Rainbow Rotor":** a fantasy livery with star/rainbow stripes on the wing and blade tips. Not a real scheme; no hex authority needed.

---

## 5. Armament & stores

### 5a. Real systems

- **Ramp gun:** One **7.62 mm M240** or **.50 cal (12.7 mm) M2** mounted on the rear loading ramp. The ramp must be open for the gun to fire. [WIKI, FORUM] The GAU-21 (search brief) is **not** mentioned in the Wikipedia article; treat the GAU-21 as unconfirmed.
- **Interim Defensive Weapon System (IDWS):** BAE-developed remote-operated belly turret. Weighs **800 lb (360 kg)**. Installed on about half the V-22s deployed to Afghanistan in 2009. [WIKI]
  - Gun: a **GAU-17 7.62 mm three-barrel minigun** (Gizmodo, Naval-Technology). [search snippets]
  - Rotation: 360° (Gizmodo). Rate of fire quoted as 3,000 rounds/min (Gizmodo); a forum post gives 2,000-6,000 rounds/min. **Treat as unverified; use "very fast" in-game.**
  - Operator: co-pilot (Gizmodo) or gunner (forum). Disagreement; irrelevant for the game.
  - Contract: BAE $14.2 M mission kits (Dec 2010), $31.3 M 2012 modification (Defense Industry Daily snippet).
  - Also described as the "Remote Guardian System" (RGS) with two retractable turrets. [search snippet, Military Periscope]
- **Pylon option:** A pylon can carry up to 300 lb (140 kg) of munitions (search snippet, a GAU-19 nose gun was studied). Not a fitted system.
- **Rescue hoist:** A "600 lb hoist" on the ramp was proposed for the casualty-evacuation configuration (Wiki). Hoist is part of the ramp area; in-game it can be a short cable and winch above the ramp.

### 5b. Cargo and payload

- **Internal cargo:** up to **20,000 lb (9,100 kg)**. [WIKI]
- **External sling loads:** up to **15,000 lb (6,800 kg)** on a dual hook under the fuselage. [WIKI]
- **Troops:** 24 seated; 32 floor-loaded (Wiki).
- **Vehicles:** Humvee-class vehicles fit in the cabin (general knowledge; not verified in sources).
- **Extra fuel:** Roll-on/roll-off fuel bladders in the cabin: up to **12,000 lb** of fuel (Wiki). [WIKI]
- **Sponson fuel:** CMV-22B uses larger external sponsons with extra fuel bladders (Wiki).

### 5c. Payload / armament mod ladder (5 steps)

1. **Free default: "Cargo Ready".** Empty cabin with a few seats and the ramp gun stowed. Fits the baseline story.
2. **Rung 1: "Sky Bucket".** External sling load: a cargo net or a bucket. Under-belly hook with a swinging load (uses the 15,000 lb dual-hook rule; in-game, a small crate or bucket).
3. **Rung 2: "Rescue Hook".** Rescue hoist and a litter (stretcher) on the ramp; winch animation.
4. **Rung 3: "Turret Buddy".** IDWS belly turret (remote gun) with a small swivel animation.
5. **Legendary: "Super Cargo".** Multiple external loads, a fantasy "Bolt Cannon" or water-drop bucket; a Legendary fantasy stamp on the ramp gun.

---

## 6. Engines & propulsion

### 6a. Real engines

- **Engine:** 2 × **Rolls-Royce AE 1107C Liberty**, US designation **T406-AD-400**. [WIKI, BOEING]
- **Power:** **6,150 hp** (4,590 kW) max per engine at 15,000 rpm at sea level (Wiki). Boeing lists 6,150 shaft horsepower (4,586 kW). 5,890 hp max continuous (Wiki).
- **Power upgrades (Wiki):**
  - Block 3: +17% power.
  - Block 4 (planned): up to +26%, "close to 10,000 shp (7,500 kW)".
- **Interconnect drive shaft:** Both engines are linked by a **cross-shaft**, so one engine can drive both rotors if the other fails (standard V-22 feature; general knowledge, consistent with "two engines, one drive shaft" design). [EST: not explicitly quoted in the fetched sources; known V-22 design.]
- **IR suppressors:** The exhaust has an infrared suppressor. [EST, general knowledge; not in fetched sources]
- **Rotor speed:** Not in fetched sources.
- **Gearbox:** Nacelle-mounted proprotor gearbox at the wing tip.
- **Max speed:** **275 kn** (509 km/h) per Wiki; 305 kn (565 km/h) at 15,000 ft. Software raised the limit from 250 to 270 kn (Wiki). Service ceiling 25,000 ft (Wiki). Rate of climb 2,320-4,000 ft/min.
- **Range:** Combat range 390 nmi; ferry range 2,230 nmi (Wiki). Operational range 1,100 nmi (search snippet).

### 6b. Engine/rotor mod ladder (5 steps)

1. **Free default: "Realistic Tilt".** Two AE1107C engines at 6,150 hp each. Rotors at standard speed. Nacelle tilt 0-90°.
2. **Rung 1: "Block 3 Boost".** Same geometry, +17% power. Visual: slightly faster rotor spin, brighter exhaust glow.
3. **Rung 2: "Block 4 Boost".** Up to +26% power. Visual: exhaust trails.
4. **Rung 3: "Turbo Blades".** Blades get a bright edge stripe and a faster spin; no geometry change.
5. **Legendary: "Rainbow Rotors".** Fantasy: rotors leave a rainbow trail and the nacelles shimmer. Explicitly fantasy.

---

## 7. Other cool mods specific to this aircraft

1. **Nacelle tilt (signature animation).** Nacelles rotate 0° (vertical, helicopter mode) → 90° (horizontal, airplane mode) in 12 s (Wiki). Also 45° STOL and 80° "Jump" takeoffs, and 97.5° rearward. Animate the nacelle + rotor as one unit around the wing-tip pivot.
2. **Rear ramp opening.** Ramp hinges at the tail and swings down. Used for hoist, rappel and the refuelling hose. Opens on the "rescue" or "unload" action.
3. **Wing stow and blade fold.** Wing rotates 90° about the fuselage axis to lie along it. Rotors fold in about 90 s (Wiki). Animate a three-step sequence: nacelles to vertical, blades fold, wing rotates.
4. **Rescue hoist.** Winch on the ramp with a cable and a litter or basket (Wiki: 600 lb hoist). Animate the cable length.
5. **Searchlight.** Not in the fetched sources; general-knowledge option only. Place a small light under the nose, pivot to point down. Label as a gameplay addition, not a real feature.
6. **Refuelling probe.** Nose probe (est.) that extends and retracts. Also the roll-on refuel kit (12,000 lb, hose to 250 kn, Wiki) can be shown as a hose from the ramp.

---

## 8. Sound

- **What it sounds like:** A deep, low-frequency **thump** or **throb**, described as "beating of drums" by residents near Lincolnshire, UK, and as a distinctive "pop pop" by a forum commenter. [search snippets]
- **Technical term:** The Army noise dictionary describes "blade slap" as a distinctive **low-frequency throbbing**, louder in descent, manoeuvring and high-speed cruise. [search snippet, forum-quoted]
- **Synth recipe (est.):**
  - Main thump: a sine or triangle oscillator at **8-12 Hz** (blade-passing frequency, est.) with an envelope that spikes on each blade (3 blades per rotor, so ~3 × rotor rev/s pulses; rotor rev/s est. 3-4 Hz → 9-12 Hz pulses).
  - Add low-pass filtered noise (100-400 Hz, est.) for the rotor "whoosh".
  - Engine whine: sawtooth or bandpass noise at 400-1,000 Hz (est.).
  - Keep the main thump dominant at low volume so it does not get harsh for a 6-year-old.
- **Caution:** The acoustic detail above is qualitative, from anecdotal descriptions. No spectrogram source was fetched.

---

## 9. Openly licensed 3D models

**Result: none suitable found and verified.** Details:

1. **Sketchfab:** Could not verify via search. A Sketchfab search page returned empty content (could not render). Search snippet showed a creator profile (sketchfab.com/berne) with a "Boeing/Bell V-22 Osprey" model, licence not shown. **Not verified; do not use until licence is checked on the model page.**
2. **Poly Pizza:** Searching "osprey" returned 29 results, all birds (Poly by Google "Osprey" is the bird). **No V-22 model found.** Poly Pizza is not a source for this aircraft.
3. **Free3D (CoSwiz "Osprey V22"):** about **10,600 polygons**, listed as not game-ready, FBX and OBJ formats, **no licence stated** in the snippet. Not usable without checking the licence; free3d's royalty-free terms are not CC0/CC-BY.
4. **Free3D "V-22 Osprey (USAF)" (ID 8503) and "MV-22 Osprey US Marines" (ID 9699):** listed, licence not verified. Free3D's "Royalty Free License" is not CC-BY/CC0.
5. **TurboSquid MV-22 model ($299, editorial use only):** Not free, not CC.

**Not searched / not verified:**
- NASA 3D Resources (nasa3d.arc.nasa.gov): search did not surface a V-22 model. Not confirmed present.
- Smithsonian 3D: not confirmed present.
- Wikimedia Commons: no V-22 three-view drawing SVG found; only photos.

**Recommendation:** Model procedurally in code (as planned). Use the dimensions in section 2 and the reference drawings in section 10 as a scale check.

---

## 10. Reference sources

### Primary (used for numbers)

- Wikipedia, Bell Boeing V-22 Osprey (spec section, performance, variants, IDWS, tilt, ramp, refuelling): https://en.wikipedia.org/wiki/Bell_Boeing_V-22_Osprey
- Boeing V-22 Osprey product page (fuselage 57.3 ft, nacelles 22.1 ft, rotor 38.1 ft, AE1107C 6,150 shp, 52,600 lb VTOL MTOW): https://www.boeing.com/defense/military-rotorcraft/v-22-osprey
- Naval Aviation History, V-22 Osprey page (fuselage 57 ft 4 in, stowed 62 ft 7 in, rotor-turning width 83 ft 8 in; only seen via search snippet, fetch returned a certificate error): https://www.history.navy.mil/research/histories/naval-aviation-history/naval-aircraft/current-aircraft-inventory/v-22-osprey.html
- NAVAIR MV-22B Osprey product page (HTTP 403 on fetch, not read): https://www.navair.navy.mil/product/MV-22B-Osprey
- Fact sheet (popasmoke, search snippet; PDF had no extractable text): https://www.popasmoke.com/misc/V22factsheet.pdf
- Popasmoke V-22 cabin size page (NAVAIR cabin figures, Navy cargo-space excerpt, George Curtis 2003): https://www.popasmoke.com/notam/mv-22-osprey/v-22-cabin-size/

### Secondary (search snippets or fetched, lower authority)

- GlobalSecurity V-22 specs (HTTP 402 on fetch; search snippet only): https://www.globalsecurity.org/military/systems/aircraft/v-22-specs.htm
- Aerospaceweb V-22 data (HTTP 500 on fetch; search snippet only): https://aerospaceweb.org/aircraft/transport-m/v22/
- Helis.com V-22 database: https://www.helis.com/database/model/325/
- Gizmodo, IDWS: https://gizmodo.com/5940458/the-v-22-ospreys-new-belly-gun-rotates-360-degrees-to-fire-3000-rounds-a-minute
- Naval-Technology, V-22 (RGS, GAU-17): https://www.naval-technology.com/projects/v22/
- Military Periscope, Remote Guardian System: https://www.militaryperiscope.com/weapons/artilleryguns/aircraft-guns/remote-guardian-system/
- Defense Industry Daily, IDWS contract: https://www.defenseindustrydaily.com/?p=4618
- Military.com, HMX-1 Osprey VIP kits: https://www.military.com/defensetech/2011/08/30/hmx-1s-mv-22s-getting-vip-kits
- TWZ, Navy CMV-22 first image: https://www.twz.com/31430/behold-the-first-image-of-a-navy-cmv-22-osprey-that-will-replace-the-c-2-greyhound
- The Aviationist, CMV-22B maintenance: https://theaviationist.com/2024/11/14/first-cmv-22-planned-maintenance/
- Naval News, first V-22 to JGSDF: https://www.navalnews.com/?p=14560
- Grimsby Telegraph, Lincolnshire Osprey noise: https://www.grimsbytelegraph.co.uk/news/local-news/v22-osprey-noise-mystery-lincolnshire-3088837
- Free3D, Osprey V22 (CoSwiz): https://free3d.com/3d-model/osprey-v22-4642.html
- Poly Pizza search (osprey): https://poly.pizza/search/osprey

### Three-view drawings (for the user to check scale)

- The Blueprints, Bell Boeing V-22 vector drawing (paywalled vector, low-res preview): https://the-blueprints.com/blueprints/helicopters/bell/66591/view/bell-boeing_v-22_osprey
- The Blueprints, alternative listing: https://the-blueprints.com/blueprints/helicopters/bell/27136/view/bell_boeing_v-22_osprey
- Official three-view from NAVAIR or Boeing: not found in my searches. Check NAVAIR fact sheet (blocked, HTTP 403) or Boeing press kit.

### Known gaps (not found, do not invent)

- Nacelle diameter and length, wing chord distribution, blade chord distribution, spinner size.
- Ramp exact dimensions and opening mechanism for the V-22 (the 6 ft × 6 ft figure is an H-46 forum quote).
- Sponson exact size and whether they house gear (common description, not confirmed).
- Refuelling probe position (nose probe is est.).
- Wing sweep 6° (brief figure; unverified).
- Japanese JGSDF paint scheme and AFSOC CV-22 scheme (not verified).
- Wing area discrepancy: 28.0 m² (Wiki) vs 382 sq ft (35.5 m²) on a CV-22 sheet.
