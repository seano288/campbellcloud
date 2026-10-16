# Lockheed Martin F-35 Lightning II — research for procedural 3D hangar model

Scope: F-35A (primary), with F-35B (STOVL) and F-35C (carrier) differences.
Convention: every number is either sourced (source listed in section 10) or marked **(est.)**.
Units: metres unless stated. Coordinates: x = 0 at nose tip, increasing aft; y = half-width outward; z = height above fuselage centreline (not ground) unless stated.

Source-quality note: the Lockheed Martin official spec page (f35.com) returned 404 and the Lockheed variant sheet (view.ceros.com) did not render text. Overall dimensions below come from Singapore MINDEF and Australian Defence fact pages, which agree with each other. Treat fine geometry (fuselage stations, DSI, canopy, bays) as estimates until checked against a three-view drawing.

---

## 1. Identity

- **Full name:** Lockheed Martin F-35 Lightning II (Joint Strike Fighter programme).
- **Nicknames:** "Lightning II" (official), "JSF" (Joint Strike Fighter programme name). No other nickname was verified; use "Lightning II" in the game.
- **Maker:** Lockheed Martin Aeronautics (prime). Engine: Pratt & Whitney (F135). Lift system (F-35B): Rolls-Royce.
- **Era:** Fifth-generation stealth multirole fighter. Designed 1990s–2000s, first flight 15 December 2006 (F-35A, AA-1, pilot Jon S. Beesley) — Wikipedia.
- **Service entry:** F-35B 31 July 2015 (USMC); F-35A 2 August 2016 (USAF); F-35C 28 February 2019 (USN) — Wikipedia infobox.
- **Role:** Multirole: air-to-air, strike, reconnaissance, electronic warfare-support. Stealth attack aircraft.
- **Crew:** 1 (single seat). Pilot only.
- **Variants:**
  - **F-35A** — conventional take-off and landing (CTOL), USAF primary, most common.
  - **F-35B** — short take-off/vertical landing (STOVL), USMC; has lift fan and swivel nozzle.
  - **F-35C** — carrier variant (CV), USN; larger wing with folding tips, tailhook, reinforced gear.

### Kid-friendly voice lines (all under 12 words, true)

1. "Look! I'm a super-secret stealth jet!"
2. "I can fly really, really fast, faster than sound!"
3. "I can go straight up and land like a helicopter!"
4. "My secret doors pop open to hide my missiles!"
5. "I'm the newest, coolest fighter jet in the sky!"

Checks: F-35B has vertical landing (Wikipedia). Stealth (general, Wikipedia). Supersonic: Mach 1.6 top speed (Wikipedia). Internal weapons bays (Wikipedia). Lines 4 and 5 are common-sense descriptors; "newest" is true for the era but relative — game copy can say "one of the newest".

---

## 2. Geometry for procedural modelling

### 2.1 Overall dimensions

| Quantity | F-35A | F-35B | F-35C | Source / note |
|---|---|---|---|---|
| Length | 15.7 m (51.4 ft) | ~15.6 m (est. from secondary) | ~15.7 m (est.) | A: MINDEF, Australian Defence. B: secondary spec sheet. C: not verified |
| Wingspan (wings extended) | 10.7 m (35 ft) | 10.7 m | ~13.1 m (folded tips out) | A/B: MINDEF, Wikipedia. C: model-kit page reproducing manufacturer's figure (lower reliability) |
| Height | 4.38 m (14.4 ft) | ~4.36 m | ~4.48 m | A: Lockheed spec sheet figure reproduced in MINDEF. Others secondary |
| Wing area | 42.7 m² (460 ft²) | (est.) ~42.7 m² | larger (est.) | A: MINDEF/search summary |
| Empty weight (lightest) | 13,300 kg (29,300 lb) | — | — | Wikipedia Design section ("lightest variant") |
| Top speed | Mach 1.6 (1,960 km/h; 1,220 mph) | same | same | Wikipedia |
| Supersonic dash | Mach 1.2 for 240 km (150 mi) without afterburner | — | — | Wikipedia |
| Structural g-limit | 9 g | 7 g | 7.5 g | Wikipedia (Design section) |
| Internal fuel | "more than double the F-16" (no figure found) | ~1/3 less than A (fuel volume sacrificed for lift fan) | (est.) | Wikipedia |

Game scale: use 15.7 m as the nominal length so the three.js model at 1 unit = 1 m matches real proportions. A 1/50 hangar scale (≈31 cm) is a good kid-friendly display size.

### 2.2 Fuselage (lofted cross-sections)

No verified station table was found. The table below is **(est.)**, built from the overall length and width of an F-35-class fighter. Verify against a three-view before shipping.

Stations as % of length (x = % × 15.7 m). Width = full width, height = full height at that station. z-centre is the fuselage centreline.

| Station % | x (m) | width (m) (est.) | height (m) (est.) | Note |
|---|---|---|---|---|
| 0% | 0.00 | 0.0 | 0.0 | Nose tip (point) |
| 5% | 0.79 | 0.35 | 0.30 | Stealth nose cone (blended, flattened) |
| 10% | 1.57 | 0.60 | 0.55 | Radome / nose section |
| 15% | 2.36 | 0.85 | 0.85 | Nose transitioning to chine |
| 20% | 3.14 | 1.00 | 1.05 | Forward fuselage, chine begins |
| 25% | 3.93 | 1.10 | 1.25 | Canopy front |
| 30% | 4.71 | 1.15 | 1.40 | Canopy mid |
| 40% | 6.28 | 1.25 | 1.55 | DSI / weapons bay region |
| 45% | 7.07 | 1.35 | 1.65 | Wing root LE region (max width) |
| 50% | 7.85 | 1.40 | 1.70 | Max body section |
| 60% | 9.42 | 1.30 | 1.60 | Canopy aft edge |
| 70% | 10.99 | 1.10 | 1.40 | Wing trailing edge region |
| 80% | 12.56 | 0.90 | 1.15 | Aft fuselage / tail boom |
| 90% | 14.13 | 0.70 | 0.90 | Aft tail |
| 95% | 14.92 | 0.60 | 0.75 | Nozzle lip |
| 100% | 15.70 | 0.50 | 0.60 | Nozzle exit (round) |

**Fuselage features:**
- **Stealth nose:** flattened, faceted, with a sharp chine (fore-aft edge). A pure-faceted look is kinder to the kids' eye as a few smooth curves, but the game can facet it.
- **Chines:** sharp longitudinal edge along the fuselage side from nose to the forward wing root (est.). This is a key silhouette cue.
- **Wide body:** fuselage is broad and blends into the wing (lifting body look). Width at max section ≈ 2.8 m (est.).
- **Dorsal spine:** fuselage top rises gently behind the canopy to the vertical tails.

### 2.3 Bubble canopy

- **Start:** ~25% of length (x ≈ 3.9 m) — (est.) this is the forward edge of the one-piece canopy.
- **End:** ~60% of length (x ≈ 9.4 m) — (est.) aft edge.
- **Shape:** single-piece bubble, very smooth; the forward end sits at the top of the nose.
- **Look:** dark tinted glass. The F-35 canopy is widely reported to be gold-tinted for glare control. This is not verified by a source in this session. Use a gold-tinted (est.) material, e.g. #B89A45 with high metalness, and a dark inner pilot-view layer.

### 2.4 DSI bump intakes (diverterless supersonic inlet)

- **Type:** diverterless supersonic inlet (DSI). Has **no moving parts** and no boundary-layer diverter plate.
- **Shape:** a 3D **bump** on each fuselage side, ahead of the intake mouth, paired with a forward-swept cowl. The bump pushes boundary-layer air away from the intake lip. Source: Wikipedia "Diverterless supersonic inlet," Hushkit article.
- **Position:** on the fuselage side, under and just forward of the wing leading edge, roughly x = 4.7–7.0 m (~30–45% of length) (est.).
- **Size:** (est.) mouth ≈ 0.7 m wide × 0.45 m high; bump ≈ 0.6 m long, 0.25 m high on the fuselage side.
- **Model suggestion:** a rounded-rectangle opening with a smooth bump ramp in front, extruded inward into the fuselage; not a pure circle.
- **History:** developed early 1990s; a Block 30 F-16 flew a DSI test in 1996 up to about Mach 2.0 (GlobalSecurity).

### 2.5 Wings

- **Planform:** trapezoid, large leading-edge sweep, with leading-edge root extension (est.).
- **Root chord:** (est.) ~6.0 m. **Tip chord:** (est.) ~1.4 m.
- **Leading-edge sweep:** (est.) ~42° (approx. 36–45° widely reported for F-35; not verified in this session).
- **Trailing edge:** straight-ish, with two control surfaces: outboard ailerons and inboard flaperons on the trailing edge (est. layout).
- **Position:** wing root LE at x ≈ 7.0 m (~45% of length) (est.); wing root TE at x ≈ 12.8 m (est.).
- **Shoulder/mid mount:** high-mid wing (est.) placed at the fuselage mid-section, not the top. Wing tips at the fuselage sides, about 1 m out from the body (est.).
- **Thickness:** (est.) ~8% thickness-to-chord at root, ~5% at tip.
- **Dihedral:** essentially none (est.). Wings are near flat.
- **Shape variants:**
  - **A:** wingtip missile rails (AIM-9X / AIM-132 ASRAAM on wingtips — see section 5).
  - **C:** wing ~13.1 m span with folding outer panels (est. folding at ~2/3 span). Larger control surfaces, tail-hook area.

### 2.6 Tails

- **Vertical tails:** twin, **canted outward** (est. ~20°), placed at the aft fuselage above the engine nozzle lip side, at x ≈ 12–15 m (est.).
- **Height:** (est.) ~2.0 m from the fuselage top to the tip.
- **Sweep:** (est.) leading edge swept ~35°; tip clipped.
- **Horizontal stabilators:** all-moving horizontal tails, placed at the aft fuselage, at the side of the nozzle, (est.) at x ≈ 13.5–15 m. Span (est.) ~ 5.0 m total across both.

### 2.7 Engine nozzle

- **Engine:** Pratt & Whitney F135 (single engine, A and C; F135-PW-600 for B with lift fan).
- **Nozzle (A and C, F135-PW-100/400):** axisymmetric (round) nozzle. **Fifteen partially overlapping flaps** form a **serrated (sawtooth) trailing edge** to lower infrared signature (Wikipedia F135 article). Use this for the nozzle geometry.
- **Nozzle diameter:** (est.) ~1.2 m exit (not verified).
- **Nozzle position:** centred at the fuselage tail, x = 15.7 m.
- **Augmentor vanes:** curved, with fuel injectors in the vanes. Radar-absorbent coating (Wikipedia F135).

### 2.8 Internal weapons bays

- **Count:** two, one per side of the fuselage belly, forward of the wing (Wikipedia).
- **Position:** under the forward fuselage, approx. x = 6.0–8.5 m (est.).
- **Size:** (est.) ~2.4 m long, ~0.75 m wide each, with doors ~0.9 m long per door.
- **Stations:** two per bay (Wikipedia). Outboard stations carry up to 1,100 kg (2,500 lb); inboard stations take AIM-120 AMRAAM. On the F-35B, outboard stations are limited to 680 kg (1,500 lb) (Wikipedia).
- **Doors:** the bay doors open **downwards and outward** to drop a store, then close. Animation: door rotates about its forward hinge (est.).

### 2.9 F-35B lift fan and swivel nozzle

**Source: Rolls-Royce LiftSystem datasheet (search summary) and Wikipedia F135 article.**

- **Lift fan:** 50-inch (1.27 m) diameter, two-stage, counter-rotating fan (Rolls-Royce). Gives more than 20,000 lbf of thrust. Shaft-driven from the engine through a clutch. It is in the forward centre fuselage.
- **Lift fan doors:** two sets of doors, **above and below** the fan. They open for vertical flight and close on transition to wing-borne flight (Ingenia / search summary).
- **Swivel nozzle (3-bearing swivel duct, 3BSD / 3BSM):** a short cylinder with non-parallel ends. It rotates **95° in 2.5 s**, carrying ~18,000 lbf thrust (Rolls-Royce). Bearings ~1.22 m diameter (search summary). Doors under the nozzle open during STOVL and the rear nozzle pivots down.
- **Roll posts:** two, one each wing root, direct about 1,800–2,000 lbf of bypass thrust each (Rolls-Royce gives 1,950 lbf; TWZ gives 1,800–2,000 lbf). Hydraulically actuated nozzles. Size (est.) ~0.25 m diameter nozzle, at fuselage side near the wing root.
- **Thrust split in hover (Wikipedia):** ~46% lift fan, ~46% vectoring nozzle, ~8% roll posts.
- **Auxiliary inlet:** on the upper fuselage behind the cockpit, opens for hover (Wikipedia F135 article). Size (est.) ~0.6 m.
- **F-35B has no landing hook** (Wikipedia). **F-35B fuel volume is about a third less** than the A (Wikipedia).

### 2.10 Landing gear

- **Nose gear:** single wheel (A and B), **twin wheel on F-35C** (Wikipedia). Position (est.) x ≈ 3.5 m, retracts forward.
- **Main gear:** two main units, retract into wing root bulges, inboard. Position (est.) x ≈ 8.4 m, wheel spacing (est.) ~3.0 m.
- **F-35C:** reinforced for arrested landings, plus a robust tailhook (Wikipedia).

### 2.11 Top-view half-outline (A) — est.

Points (x, y), half-outline from nose to tail, y = half-width. All (est.) from the planform above. Mirror across y = 0.

```
(0.00, 0.00)   nose tip
(0.80, 0.35)
(1.60, 0.60)
(2.40, 0.85)
(3.14, 1.00)   chine start
(4.70, 1.15)   canopy mid
(6.30, 1.25)   DSI region
(7.00, 1.35)   wing root LE
(7.85, 1.40)   max body section
(8.60, 1.35)
(9.42, 1.30)   canopy aft
(10.99, 1.10)  wing TE body join
(10.72, 5.35)  wing tip LE (x approx, sweep ~42 deg)
(12.20, 5.35)  wing tip TE
(12.80, 1.00)  wing root TE
(13.50, 0.90)  horizontal tail root
(14.90, 0.60)  aft fuselage
(15.70, 0.50)  nozzle exit
```

Note the wing outline is drawn from the body join to tip and back to the root TE. Rebuild the tip from the LE sweep (est.) if exact wing geometry is needed.

### 2.12 Side-view outline (A) — est.

z = height from fuselage centreline. Top (dorsal) outline, nose to tail:

```
(0.00, 0.00)   nose tip
(0.80, 0.30)
(1.60, 0.55)
(2.40, 0.85)
(3.14, 1.05)
(3.93, 1.25)   canopy front
(4.71, 1.40)
(6.28, 1.55)   DSI
(7.85, 1.70)   max section top
(9.42, 1.60)   canopy aft
(10.99, 1.40)
(12.56, 1.15)
(13.80, 1.00)
(15.00, 0.85)
(15.70, 0.75)  nozzle top
```

Bottom (ventral) outline, nose to tail (negative z):

```
(0.00, 0.00)
(0.79, -0.30)
(1.57, -0.55)
(2.36, -0.85)
(3.14, -1.05)
(4.71, -1.20)  gear door line
(7.07, -1.35)  weapons bay
(8.64, -1.20)
(10.20, -1.05)
(12.56, -0.90)
(14.13, -0.75)
(15.70, -0.60)
```

Vertical tails protrude above the top outline near x = 12–15 m up to z ≈ +2.2 m (est.) above the centreline.

---

## 3. Distinctive features checklist (ordered by recognition value)

1. **Stealth nose with sharp chines** — the flattened, faceted nose with a sharp edge running back along the fuselage.
2. **Twin canted vertical tails** — tail fins angled outward (est. ~20°), set low at the rear.
3. **Bubble canopy, gold-tinted** — large, one-piece, reflecting gold.
4. **DSI bump intakes** — no intake lip. Smooth bump on each fuselage side, ahead of the wing.
5. **Large wide wing with blended root** — trapezoid planform, wing roots blend into the broad body.
6. **Round nozzle with a serrated (sawtooth) edge** — 15 overlapping flaps at the tail.
7. **Clean all-moving stabilators** — small horizontal tails with no obvious tail-plane gap.
8. **F-35B only: lift fan doors and swivel nozzle** — visible on the top and underneath when hovering.
9. **F-35C only: folding wingtips, tailhook, twin nose wheel** — the carrier giveaways.
10. **Weapons bay doors, open** — doors drop open on the belly to reveal missiles (the big reveal).

---

## 4. Paint and liveries

**Source gap:** no official hex colours were found in this session. Federal Standard FS36170 is cited as the production grey (Nexus Mods page; Danish F-16 article). All hex values below are **(est.)**, picked to read as the scheme. Verify them against a flight-sim livery or a photo before shipping.

| # | Scheme | Description | Main | Secondary | Accent | Markings | Note |
|---|---|---|---|---|---|---|---|
| 1 | **Standard USAF grey (RAM)** | Production grey, low-observable (RAM) finish. FS36170 per sources | #6E7377 (est.) | #55595D (est.) | — | White/grey stencils (est.) | Free default |
| 2 | **Demo Team (AA-1/BF-01/CF-01 prototype schemes)** | Demo Team livery; fan recreations exist (flightsim.to). A-variant AA-1 demo jet | #E7E9EA (est.) | #D62E2E (est.) | #1F3E8A (est.) | Flags, red/blue trim | Rung 2 |
| 3 | **Lockheed test aircraft (blue and yellow CF-01 tail)** | Anecdotal in a forum: test jet with a blue and yellow tail | #E7E9EA (est.) | #1F4F9A (est.) | #F2C230 (est.) | "TEST" stencils | Rung 2, flagged as unverified |
| 4 | **RAAF (Australia)** | Partner-nation markings on grey | #6E7377 (est.) | — | #2B3F8C (est.) | Roundel (est.) | Rung 1 |
| 5 | **Italian Air Force** | Partner-nation markings on grey | #6E7377 (est.) | — | #2A7F3E (est.) | Tricolour tail (est.) | Rung 1 |
| 6 | **Japan (JASDF)** | Partner-nation markings on grey | #6E7377 (est.) | — | #B82C2C (est.) | Hinomaru (est.) | Rung 1 |
| 7 | **Norway / Netherlands / UK** | Partner-nation markings on grey | #6E7377 (est.) | — | #1F3E8A (est.) | National roundel (est.) | Rung 1 |
| 8 | **US Navy with colourful CAG tail** | Navy grey with a coloured carrier-air-wing tail | #6E7377 (est.) | — | #F2A900 (est.) | CAG tail stripe (est.) | Rung 3 |
| 9 | **Heritage: USMC Blue Angels-style** | Blue and gold heritage paint, fan concept | #1B3E7A (est.) | #E8B923 (est.) | #FFFFFF (est.) | Gold stripe | Legendary |
| 10 | **Aggressor (adversary) scheme** | Dark camouflage for threat-role training (concept) | #4A4F3E (est.) | #2E3327 (est.) | #7A6A44 (est.) | Mottle pattern | Rung 2 |

### Mod ladder (suggested)

- **Free default:** Standard USAF grey (#1).
- **Rung 1 "Partner Jets":** RAAF, Italian, Japan, Norway/NL/UK (#4–7). Each is a national roundel swap.
- **Rung 2 "Sky Show":** Demo Team (#2), Aggressor (#10).
- **Rung 3 "Carrier Colours":** US Navy CAG tail (#8).
- **Legendary "Golden Blue":** heritage-style blue and gold (#9) with a gold canopy frame. Name: "Golden Bolt".

---

## 5. Armament and stores

### 5.1 Facts

- **Gun:** 25 mm GAU-22/A rotary cannon (Wikipedia).
  - **F-35A:** internal, on the left side over the intake (Wikipedia: "182 rounds internally").
  - **F-35B and F-35C:** centreline multi-mission pod carrying the gun and **220 rounds** (Wikipedia).
- **Internal weapons bays:** two, each with two stations. Outboard up to 1,100 kg (2,500 lb); inboard takes AIM-120 AMRAAM. F-35B outboard limit 680 kg (1,500 lb).
- **External stations:** six for non-stealth missions. **Wingtips** take AIM-9X or AIM-132 ASRAAM. **Wing stations** rated 2,270 kg (5,000 lb) inboard and 1,100 kg (2,500 lb) middle; F-35B 680 kg (1,500 lb) (Wikipedia).
- **Typical loadouts (general knowledge, flagged for review):**
  - Air-to-air: AIM-120 in bays, AIM-9X on wingtips.
  - Strike: GBU-31/32 JDAM (2,000 lb class) in bays; SDB (GBU-39) in bays (est. use).
  - Non-stealth "beast mode": external pylons with bombs and missiles.

### 5.2 Mod ladder (5 steps: free default + 3 rungs + Legendary)

Names are kid-friendly. "Stores" are visible in the bay or on the wings.

1. **Free default — "Gun Jet":** internal gun, two AIM-120 in bays. Name: "Starter Shooter".
2. **Rung 1 — "Bomb Buddy":** two JDAM (GBU-31/32) in bays. Bay doors open on reveal. Name: "Bomb Buddy".
3. **Rung 2 — "Missile Mob":** AIM-120 in both bays plus AIM-9X on wingtips. Name: "Missile Mob".
4. **Rung 3 — "Beast Mode":** external pylons with bombs and missiles (non-stealth). The bay doors stay closed on the external loadout. Name: "Beast Mode".
5. **Legendary — "Thunder Pod":** centreline gun pod on the B or C, sparkling tracer effect on fire. Name: "Thunder Pod".

Bay-door opening is the big cool factor: each bay door animates open on the fire or drop action (est. 0.8 s).

---

## 6. Engines and propulsion

### 6.1 Facts (Wikipedia, F135 article)

| Variant | Use | Dry thrust (military) | With afterburner | Dry weight |
|---|---|---|---|---|
| F135-PW-100 / -400 | F-35A (CTOL), F-35C (naval; -400 has salt-corrosion-resistant materials) | 28,000 lbf (125 kN) | 43,000 lbf (191 kN) | 6,422 lb (2,910 kg) |
| F135-PW-600 | F-35B (STOVL, shaft-driven lift fan) | 27,000 lbf (120 kN) | 41,000 lbf (182 kN) | 7,260 lb (3,290 kg) |
| F135-EP / F135-ECU | Engine Enhancement Package later renamed Engine Core Upgrade; USAF funded 2023, fielding by 2029 | not given | not given | not given |

- **Nozzle (-100/-400):** axisymmetric, 15 overlapping flaps with a sawtooth trailing edge. Curved augmentor vanes with radar-absorbent coating.
- **Nozzle (-600):** 3-bearing swivel duct nozzle (3BSD). Hover thrust 40,650 lbf (181 kN) (Wikipedia).
- **Afterburner look (game cue):** a bright blue-white core with a long plume. Jalopnik describes a "massive" afterburner plume and a loud engine (search summary).

### 6.2 Mod ladder (5 steps, realistic first)

1. **Free default — "Standard Engine":** dry thrust, small exhaust glow. Name: "Steady Engine".
2. **Rung 1 — "Afterburner":** afterburner lit on take-off, longer plume. Name: "Fire Boost".
3. **Rung 2 — "Quiet Mode":** serrated nozzle highlighted, IR-suppressed look. Name: "Stealth Puff".
4. **Rung 3 — "Lift Mode" (F-35B only):** hover mode with the lift fan spinning and the nozzle swivelling down. Name: "Hover Power".
5. **Legendary — "Rainbow Burner":** fantasy plume colours (blue, gold, purple). Name: "Rainbow Rocket".

**F-35B hover mode as a mod:** the lift fan doors open top and bottom, the swivel nozzle rotates 95° in ~2.5 s (Rolls-Royce), and the roll posts vent. This is the best animated mod in the list. Use it in the hangar test-flight.

---

## 7. Other cool mods specific to this aircraft

1. **Weapons bay doors open:** the bay doors drop open on the belly, with the store visible inside. Animation: door rotates about the forward hinge, ~0.8 s (est.). Trigger: pressing "reveal".
2. **F-35B lift fan hover:** the two lift fan doors open top and bottom and the fan spins up. Animation: door angle 0→90°, fan rotor spin, exhaust nozzle swivel 0→95° in 2.5 s (Rolls-Royce). Trigger: "hover" button.
3. **Canopy tint:** gold-tinted, or colour-shift tint options (est.). Animation: shader tint slider.
4. **Helmet:** pilot helmet with a visor colour option (est., generic). Animation: none, static decal on the pilot.
5. **Tail hook (F-35C only):** tailhook extends down behind the nozzle on landing. Animation: hinge rotation 0→-75° (est.). Trigger: "land on carrier".
6. **Refuelling probe (B and C):** probe folds out from the nose. Animation: hinge 0→90° (est.). Note: the F-35A also has a probe on some configurations (est.). Verify.
7. **Folding wingtips (F-35C):** outer wings fold up on the carrier deck. Animation: hinge 0→90° (est.).
8. **Wing flaps and ailerons:** outboard ailerons and inboard flaperons deflect on the bank and approach. Animation: angle ±20° (est.).

---

## 8. Sound

- **Take-off:** a deep, loud turbofan roar, with a hard afterburner snap on the afterburner light (Jalopnik description; forum noise discussion).
- **Hover (F-35B):** a high whine from the lift fan, with a low thrust roar from the nozzle (est. synthesis cue).
- **Flyby:** a long, steady tonal engine roar with a Doppler shift.
- **Sound in the game:** synthesize with Web Audio. Use two layers: (1) a low broadband noise filtered at 150–500 Hz for the roar, with volume tied to throttle; (2) a high-pitched tone from 1.5 kHz rising with RPM for the whine. Afterburner: a short bright noise burst on lighting. Keep the volume child-safe (under about 70 dB at the speaker, est.).
- **Source gap:** no free F135 audio recording was found. Commercial simulator audio exists (Turbine Sound Studios F135 package), but it is licensed for simulation, not game use.

---

## 9. Openly licensed 3D models

**Result: no clearly suitable openly licensed F-35 model was found in this session.** The searches did not surface a Sketchfab CC-BY F-35.

| # | Source / page | Licence (as stated on page) | Format | Poly count | Quality notes |
|---|---|---|---|---|---|
| 1 | Remeshy — https://remeshy.com/model/f-35-lightning-ii-model-572a9f2a | **No licence stated on page** (only price field "Free") | STL, GLB | not shown | Stylised low-poly, aimed at 3D printing. Licence must be checked before use. Probably not suitable without written permission. |
| 2 | CGTrader F-35C — https://www.cgtrader.com/3d-models/aircraft/military-aircraft/f-35c-lightning-ii-carrier-based-stealth-fighter-jet | "CC Attribution (Free for personal use; commercial projects require credit)" — as shown in search snippet, **not verified on page** | not verified | not verified | Paid marketplace listing. Only F-35C found under CC-BY. Verify the licence page before use. |
| 3 | Free3D F-35 base mesh — https://free3d.com/3d-model/f-35-lightning-ii-base-mesh-9589.html | Snippet suggests **editorial use only** | not verified | not verified | Not suitable for a game. |
| 4 | CGTrader F-35A low-poly — https://www.cgtrader.com/3d-models/military/military-vehicle/f-35a-lightning-ii | "Royalty Free No AI License" (as snippet) | OBJ, FBX, STL, GLB, 3MF, USDZ | not verified | Paid ($30); licence forbids AI-training use. Likely not suitable. |
| 5 | Wikimedia Commons three-view | No Commons page found. A mirror describes a public-domain three-view derived from an earlier F-35A top view. | not verified | n/a | Use only after checking the original Commons file page. |

**Verdict:** none of these meets the bar (free, CC0/CC-BY, downloadable, clean geometry). Plan to build procedurally from the numbers above.

---

## 10. Reference sources

Verified facts used:
- Wikipedia, Lockheed Martin F-35 Lightning II — https://en.wikipedia.org/wiki/Lockheed_Martin_F-35_Lightning_II (weights, speed, g-limits, F-35B/C differences, armament, gun, service dates)
- Wikipedia, Pratt & Whitney F135 — https://en.wikipedia.org/wiki/Pratt_%26_Whitney_F135 (thrust, dry weight, nozzle, lift-fan thrust split)
- Singapore MINDEF, Fact Sheet F-35A — https://www.mindef.gov.sg/news-and-events/latest-releases/28feb24_fs/ (length, wingspan, height, wing area)
- Australian Department of Defence, F-35A — https://www.airforce.gov.au/technology/aircraft/strike/f-35a-lightning-ii (height 4.4 m)
- Rolls-Royce LiftSystem datasheet — https://www.mylearning.rolls-royce.com/~/media/Files/R/Rolls-Royce/documents/defence/VCOMB-4202-Rolls-Royce-LiftSystem-datasheet.pdf (lift fan 50 in, >20,000 lbf; 3BSM 95° in 2.5 s; roll posts 1,950 lbf)
- Ingenia, "A Flexible Jet Fighter" — https://ingenia.org.uk/articles/a-flexible-jet-fighter/ (lift-fan door sequencing)
- Wikipedia, Diverterless supersonic inlet — https://en.wikipedia.org/wiki/Diverterless_supersonic_inlet (DSI shape)
- GlobalSecurity, DSI — https://www.globalsecurity.org/military/systems/aircraft/dsi.htm (1996 F-16 test)
- Hushkit, supersonic intakes — https://hushkit.net/2020/03/16/how-all-fighter-planes-suck-an-idiots-guide-to-supersonic-air-intakes/ (DSI description)
- Jalopnik, F-35 takeoff video — https://www.jalopnik.com/watch-and-hear-this-impressive-stream-of-f-35s-blast-of-1763188348/ (engine and afterburner character)
- Nexus Mods, Ace Combat 7 F-35C page — https://www.nexusmods.com/acecombat7skiesunknown/mods/2807 (FS36170 grey, cited, not verified)
- flightsim.to Demo Team liveries — https://flightsim.to/addon/26488/f-35c-cf-01-prototype-demo-team-for-indiafoxecho-s-f-35c (fan recreation, not official)

Three-view drawings (for checking the (est.) geometry):
- Blueprints vector drawings, F-35B — https://the-blueprints.com/blueprints/modernplanes/lockheed/63583/view/lockheed_martin_f-35b_lightning_ii (licence not confirmed)
- Check Wikimedia Commons directly for "F-35 three view" or the 3view tag.

Gaps to close next:
1. Get an official three-view with station data (Lockheed or USAF) to replace all (est.) fuselage numbers.
2. Confirm the DSI, canopy and bay dimensions from that drawing.
3. Confirm the livery hex values from a photo or a verified livery file.
4. Find a licence-checked F-35 model on Sketchfab (CC-BY, downloadable) or Poly Pizza.
