# McDonnell Douglas (Boeing) F-15 Eagle: research notes

Scope: F-15C (primary), with F-15E Strike Eagle and F-15EX differences.
Legend: **(est.)** = my estimate, not in any source. **(unverified)** = claim I could not confirm. Everything else is cited in Section 10.

---

## 1. Identity

- **Full name:** McDonnell Douglas F-15 Eagle (formally named "Eagle" at introduction). Now built under Boeing (McDonnell Douglas merged into Boeing).
- **Nicknames:** Only "Eagle" was confirmed. "Strike Eagle" is the F-15E. "Streak Eagle" is a specific record-setting aircraft (F-15A 72-0119), not a nickname for the type. No other nicknames were verified.
- **Maker:** McDonnell Douglas, St. Louis (now Boeing).
- **Era:** First flight 27 July 1972. Introduced 9 January 1976. Built 1972 to 1997 (Wikipedia infobox).
- **Role:** Air-superiority fighter (F-15A/B/C/D). Two-seat dual-role strike fighter (F-15E). Multirole export-derived variant (F-15EX).
- **Crew:**
  - F-15A and F-15C: 1 pilot (single-seat).
  - F-15B and F-15D: 2 (second seat for training).
  - F-15E: 2 (pilot + weapon systems officer, WSO).
  - F-15EX: 2 (per secondary sources; see Section 2 caveats).
- **Famous facts (cited):** Claimed 98,000 ft in 3:27 in the bare-metal Streak Eagle (F-15A 72-0119) in 1975 at Grand Forks AFB.

### 5 kid voice lines (each under 12 words, true)

1. "I took my very first flight in 1972!"
2. "I have two big engines that make me zoom fast!"
3. "My wings point backward, so I can zoom really fast."
4. "I have a big gun hiding inside my wing!"
5. "I can fly higher than almost any bird ever!"

Note on line 5: "higher than almost any bird" is not sourced. Treat it as a playful claim and check before shipping, or swap for a sourced one like the 60-second climb to 30,000 ft (see Section 2).

---

## 2. Geometry for procedural modelling

### 2.1 Overall (F-15C, metres, primary source = Wikipedia/milavia)

| Item | Value | Source |
|---|---|---|
| Length | **19.43 m** (63 ft 9 in) | Wikipedia; milavia |
| Wingspan | **13.05 m** (42 ft 9.5 in) | milavia (13.05); Wikipedia (13.06) |
| Height | **5.63 m** (18 ft 5.5 in) | milavia (5.63); Wikipedia (5.64); dauntless-soft C/D (5.69) |
| Wing area | **56.5 m²** (608 sq ft) | Several search snippets |
| Empty/clean weight | 20,244 kg (44,630 lb) "clean take-off" | milavia (typo-checked) |
| MTOW | 30,844 kg (68,000 lb) | Wikipedia; milavia |

**Length and height caveat:** F-15E is 19.43 m too (milavia). Height differs by about 6 cm across sources (5.63 vs 5.69). Use 5.63 m.

### 2.2 Fuselage

Stations below are % of length, from nose (0%) to tail (100%). Width and height are full-body **half-width / half-height in metres (est.)** unless marked. These are estimates I derived from the overall dimensions and typical F-15 proportions. They are not from a drawing. Use the three-view drawings in Section 10 to tune them.

| Station (% length) | x (m) | Half-width (m, est.) | Height from ground to top (m, est.) | Notes |
|---|---|---|---|---|
| 0% | 0.00 | 0.00 | 1.60 | Radome tip, pointed-ogive nose |
| 5% | 0.97 | 0.40 | 1.90 | Radome, ogive profile |
| 10% | 1.94 | 0.55 | 2.10 | Radome to forward fuselage |
| 20% | 3.89 | 0.80 | 2.35 | Forward fuselage / cockpit sill begins |
| 25% | 4.86 | 0.90 | 2.55 | Windscreen front |
| 30% | 5.83 | 1.05 | 2.80 | Canopy front (see 2.3) |
| 35% | 6.80 | 1.25 | 3.00 | Intake leading edge |
| 40% | 7.77 | 1.50 | 3.10 | Intake region, widest body |
| 45% | 8.74 | 1.55 | 3.15 | Intake trailing / wing root |
| 55% | 10.69 | 1.40 | 3.20 | Aft of wing root leading edge |
| 65% | 12.63 | 1.20 | 3.20 | Spine, between wing and tail |
| 75% | 14.57 | 1.00 | 3.25 | Taper begins |
| 85% | 16.52 | 0.85 | 3.30 | Stabilator root |
| 92% | 17.88 | 0.70 | 3.40 | Vertical tail base |
| 100% | 19.43 | 0.55 | 3.10 | Tail end (engine nozzle area) |

**Shape notes:**

- **Nose / radome:** Conical-ogive, relatively slender, with a pointed tip. The F-15 radome is a long pointed nose with the APG-63/70 radar behind it. Radome geometry is not in any source I found.
- **Cross-section:** Round-ish to slightly flattened at the bottom. The forward fuselage has a squared-off, broad-shouldered profile at the intakes.
- **Upper fuselage:** Relatively flat between canopy and vertical tails. This is the spine where a speed brake could sit (see Section 7).

### 2.3 Canopy (bubble)

- Single-piece windscreen plus one large canopy with a single frame (Wikipedia: "only a single canopy frame with clear vision forward"; "one-piece windscreen and large canopy").
- **Start:** about **28%** of length (x ≈ 5.4 m, est.) at the windscreen front.
- **End:** about **48%** of length (x ≈ 9.3 m, est.) at the aft canopy edge.
- Canopy height above fuselage: about **0.5 m (est.)**. It is a fairly tall bubble with a rear cut.

### 2.4 Intakes

- **Type:** "Rectangular inlets with variable intake ramps" (Wikipedia).
- **Position:** Two side-mounted intakes, one either side of the fuselage, **just below and ahead of the wing leading edge root**, beside the cockpit's lower edge.
- **Location in % length:** starts at about **33%** (x ≈ 6.4 m, est.) and ends at about **46%** (x ≈ 8.9 m, est.). These are estimates.
- **Size (est.):** about **1.25 m wide × 1.0 m high** per intake. I did not find an intake dimension in any source.
- **Ramp tilt:** The variable ramps move (they are the "variable intake ramps"). Tilt range is not in the sources. For a model, animate a ramp from roughly **0° to 10° (est.)** from the nominal line.
- Inlet is a rectangular box, not a round nacelle.

### 2.5 Wings

| Item | Value | Source / status |
|---|---|---|
| Span | 13.05 m (both wings, tip to tip) | milavia |
| Area | 56.5 m² | snippets |
| Planform | Cropped delta / swept, with small "modified cropped delta" description | aerospaceweb (not fetched) |
| Leading-edge sweep | **45°** (one source). A second source gives about **38.7°** (38°42'). | Conflicting; use **45° (est.)** for the model |
| Root chord (at fuselage) | about **6.0 m (est.)** | estimate |
| Tip chord | about **0.8 m (est.)** | estimate; tip is cropped |
| Trailing-edge | Straight trailing edge with flaps inboard and ailerons outboard. Tips are "cropped" (trailing-edge tip cut). | Search snippet ("cropping of the trailing edges of the wingtips") |
| Mount | **High** (wing sits at the top of the fuselage, not mid) | Confirmed in general F-15 descriptions; exact mount height est. |
| Anhedral | **1° (one source, Military Periscope, paywalled)**. The sources I found do not confirm 2°. | Use **1° (est.)** |
| Thickness | About **3.5% to 4% t/c (est.)**. Not sourced. | estimate |

**Wing position (% of length):**

- Root leading edge at about **44%** of length (x ≈ 8.5 m, est.).
- Tip leading edge at about **77%** of length (x ≈ 15.0 m, est.).
- Trailing edge root at about **75%** (x ≈ 14.5 m, est.).

### 2.6 Wing outline (planform, each side, x / y in metres)

The top-view half outline below (see 2.9) gives the wing planform. Root chord and tip chord above are the source of truth. The outline is approximate.

### 2.7 Tails

- **Vertical tails:** Twin fins, **vertical (not canted)** for the F-15A/B/C/D/E. Height is about **2.9 m (est.)** above the fuselage top. Their top sits near **5.63 m** above ground (the overall height).
- **Vertical sweep:** Leading edge swept about **40° (est.)**. Not sourced.
- **Position:** Tails sit above and aft of the stabilators, near **88-98%** of length (est.).
- **Horizontal stabilators (all-moving):** The F-15 uses **stabilators**, not separate elevators. Each has a **dogtooth notch** on the leading edge, added in development to cure flutter (Wikipedia; search snippet). Root starts near **84%** of length (x ≈ 16.3 m, est.). Full span is about **4.5 m (est.)** (half-span about 2.25 m, est.). Tip at about **x = 17.6 m (est.)**.

### 2.8 Engines

- **Count:** 2, mounted **side-by-side** under the spine (not stacked).
- **Spacing:** Centre-to-centre about **1.5 m (est.)**.
- **Nozzles:** Round, **convergent-divergent**, axisymmetric (est. for F100-PW-220; type not verified in sources I read).
- **Nozzle diameter:** about **0.9 m (est.)** exit.
- Nozzles sit at about **96-100%** of length (x ≈ 18.7-19.4 m, est.).

### 2.9 Landing gear

- **Nose:** single nose wheel, retracts forward (est.).
- **Main:** two main gear legs, each on a bogie with **twin wheels** (est.). These retract inward into the wing-body fillet.
- Not specified in any source I read. Treat as est.

### 2.10 Conformal fuel tanks (F-15E and some C/D)

- **F-15E:** Conformal fuel tanks (CFTs) fit along the fuselage sides, **sitting on the intakes' outboard edges** and running along the lower fuselage (Wikipedia: F-15E is "the only variant to carry them on a routine basis").
- Tank length about **5 m (est.)** each side, about **0.8 m** deep (est.).
- They attach to a **centreline / fuselage pylon** position below the intake (see Section 5).

### 2.11 Top-view half outline (x, y), metres, nose at x=0, y = half-width outward

Estimated from 2.2-2.7. Trace nose → intake → wing → stabilator. Left-right mirror to get the full outline. (est.)

```
(0.00, 0.00)   nose tip
(0.50, 0.25)
(1.50, 0.55)
(3.00, 0.85)
(4.50, 1.20)
(5.50, 1.45)   windscreen / canopy front
(6.40, 1.60)   intake leading edge (outboard)
(7.20, 1.70)
(8.90, 1.70)   intake trailing edge
(9.50, 1.60)
(10.00, 1.50)  fuselage at wing root LE region
(8.50, 1.50)   wing root leading edge (x stepped back, est.)
(10.00, 2.60)  wing LE, 45° sweep
(11.50, 3.90)
(13.00, 5.20)
(14.20, 6.20)
(15.00, 6.53)  wingtip leading edge (half span = 6.53)
(15.80, 6.53)  wingtip trailing edge (tip chord ~0.8)
(15.60, 5.00)  cropped tip, trailing edge heading inboard
(15.20, 3.50)  trailing edge
(14.80, 2.00)  trailing edge inboard
(14.50, 1.00)  wing root trailing edge
(15.00, 1.00)  fuselage taper
(16.30, 1.10)  stabilator root leading edge (dogtooth)
(16.20, 2.25)  stabilator tip leading edge (half span 2.25)
(17.60, 2.25)  stabilator tip trailing edge
(18.80, 1.00)  stabilator root trailing edge
(19.43, 0.00)  tail end (nozzle)
```

Note: the wing root LE step-back (8.50, 1.50) comes after the intake trailing edge at (10.00, 1.50) in this list. That ordering is a simplification. In practice, the wing LE root sits forward of the fuselage tapering point. Reorder when you build the mesh. The intake and wing overlap in the top view.

### 2.12 Side-view outline (x, z), metres, ground at z=0

Top profile (nose → tail, z up) and bottom profile (tail → nose). Estimated. z is measured from ground.

**Top profile (nose → tail):**

```
( 0.00, 1.60)   radome tip
( 0.97, 1.90)
( 1.94, 2.10)
( 3.89, 2.35)
( 4.86, 2.55)   windscreen front
( 5.83, 2.80)   canopy front
( 7.77, 3.00)   canopy / spine
( 9.70, 3.10)   aft canopy edge
(11.00, 3.20)   spine
(13.00, 3.22)   spine
(15.00, 3.28)   spine (fins begin)
(16.50, 3.40)   vertical fin leading edge base
(17.50, 4.50)   fin leading edge
(17.90, 5.63)   fin top (overall height)
(18.60, 5.20)   fin trailing edge
(19.43, 4.00)   aft tail edge
```

**Bottom profile (tail → nose):**

```
(19.43, 1.50)   tail underside
(18.50, 1.20)
(16.00, 1.10)
(12.00, 1.00)   underside of wing root
( 8.00, 0.95)
( 6.00, 0.90)   intake underside
( 3.00, 0.80)
( 1.00, 0.50)
( 0.00, 1.00)   nose bottom (rejoins top at nose)
```

Note: the wing sits at the top of the fuselage, so the side silhouette is dominated by the fin and canopy, not the wing. Wing and stabilator edges show on the top view only.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Two vertical tails, straight up (not canted).** The twin fins are the single most identifiable feature from any angle.
2. **Rectangular box intakes with variable ramps** on each side, beside the cockpit. Boxy, not round.
3. **Large, high-mounted, swept wing with tip cropped.** Wings are big and sit high on the body.
4. **Stabilators with a dogtooth notch** on the leading edge (inboard of the tip).
5. **Single-frame bubble canopy with a one-piece windscreen.** Large and clear.
6. **Two side-by-side afterburning engines** with round nozzles at the rear.
7. **Clean, flat upper fuselage** between the canopy and tails (spine).
8. **Under-fuselage stations (4)** for AIM-7/AIM-120 missiles, with a gap in the lower body.
9. **Gun port in the right wing root** (M61 Vulcan). Small detail, visible from the front-right.
10. **F-15E only:** conformal fuel tanks along the sides, and the second-cockpit WSO canopy profile (two bubbles in a line).

---

## 4. Paint & liveries

**Hex note:** None of the schemes below came with verified hex values. Every hex code is **(est.)**, derived by eye from the FS 36xxx numbers, which are the real federal colour standard references. Verify against paint chips or a published colour reference before you rely on them.

| # | Scheme | Description | Main | Secondary | Accent | Markings | Source status |
|---|---|---|---|---|---|---|---|
| 1 | **Mod Eagle** (current US default) | Overall medium grey, dark grey patches on upper surfaces. Air-superiority look. | #7C8176 (est.) FS 36251 | #3F4441 (est.) FS 36176 | — | White stars/black stencils | Forum thread (FineScale). Colour numbers from forum. |
| 2 | **Compass Ghost Gray** (older US and Israel air superiority) | Light grey over darker grey. | #B7BCB8 (est.) FS 36375 | #6E7470 (est.) FS 36320 | — | Black/white national markings | Forum thread. |
| 3 | **F-15E Gunship Grey** | Overall dark grey, low-vis. Strike variant. | #5E6461 (est.) FS 36118 | — | — | Black/white stencils | Forum thread (FS 36118 Gunship Gray). |
| 4 | **Israeli ("Baz") air superiority** | Ghost grey, Israeli roundels and tail markings. "Baz" is the IAF name for the F-15 (from common usage; not verified in research). | #B7BCB8 (est.) | #6E7470 (est.) | Blue Star of David (est.) | Israeli roundel | Search snippet (AK Interactive product text): Ghost grey arrived with F-15A/B in 1976. Israeli scheme claim comes from forum/product text. |
| 5 | **Streak Eagle** (bare metal) | Unpainted bare aluminium. F-15A 72-0119 (1975 record run). | #A9AEB0 (est.) | #8C9296 (est.) | — | "AQUILA MAXIMA" painted on left fin (search snippet) | Search snippet (migflug, usaf-sig). Exact shades unverified. |
| 6 | **65th Aggressor "splinter"** | Russian-style splinter camo (modelled on Su-35/T-50). F-15C 78-0509 photographed at Red Flag 12-2. Used by 65th AGRS until retirement (2015). | #5F6B5A (est.) | #7A6A52 (est.) | #3A3A3A (est.) | Black/white stencils | Search snippet (The Aviationist). Hexes unverified. |
| 7 | **Bicentennial** (TF-15A 71-0291) | Red, white and blue US Bicentennial scheme. Flew to Farnborough 1976. Two-seat test aircraft (F-15 Joint Test Force). | White (est.) | Red #B22234 (est.) | Blue #3C3B6E (est.) | Stars/stripes | Search snippets (Hobby Master, dauntless-soft). Exact hexes unverified. |
| 8 | **Oregon ANG** | Unit tail art, Oregon ANG 173rd FW. | — | — | — | — | **Not verified.** Search turned up nothing on Redhawks tail art. Do not use until checked. |
| 9 | **Japanese JASDF aggressor** | Not researched. | — | — | — | — | **Not verified.** |
| 10 | **Saudi / Qatari** export schemes | Not researched. | — | — | — | — | **Not verified.** |

### 4.1 Mod ladder (paint)

- **Free default:** Mod Eagle (scheme 1). Everyone starts here. It matches the current US look.
- **Rung 1 (Bolts):** Compass Ghost Gray (scheme 2). Lighter, classic 1980s look.
- **Rung 2 (Bolts):** F-15E Gunship Grey (scheme 3). Dark stealthy strike look.
- **Rung 3 (Bolts):** 65th Aggressor splinter (scheme 6). Cool camouflage.
- **Legendary:** Streak Eagle bare metal (scheme 5) with "AQUILA MAXIMA" on the fin. Shiny silver with the record-setter's fin text. (Keep it: the real aircraft set records, which kids can relate to.)
- **Optional bonus:** Bicentennial (scheme 7). Good for a seasonal or event reward.

---

## 5. Armament & stores

### 5.1 Built-in

- **Gun:** 1 × 20 mm M61A1 Vulcan 6-barrel rotary cannon, **940 rounds** (Wikipedia; milavia). Mounted **inside the right wing root**, aft of the intake (est. position).

### 5.2 Hardpoints (F-15C, from Wikipedia/milavia)

Total **9 hardpoints** (stations). Location and typical use:

| Station | Location | Typical load |
|---|---|---|
| 1 & 9 | Wing tips | AIM-9 Sidewinder (tip rail) |
| 2 & 8 | Inboard wing pylons (each with 2 extra launch rails) | AIM-7 / AIM-120 / AIM-9 |
| 3, 4, 6, 7 | Under fuselage, **semi-recessed** | AIM-7 Sparrow or AIM-120 AMRAAM |
| 5 | Centreline | External fuel tank (drop tank) |
| Fuselage pylons (optional) | Under-fuselage / conformal | Conformal fuel tanks (16,000 lb max capacity per milavia) |

**Common combinations (milavia):**

- 4 × AIM-7 Sparrow + 4 × AIM-9 Sidewinder.
- 6 × AIM-120 AMRAAM + 2 × AIM-9 Sidewinder.
- 8 × AIM-120 AMRAAM.

### 5.3 F-15E extras (est. where not sourced)

- Targeting and sensor pods on centreline and wing pylons (LANTIRN targeting pod on right intake; est.).
- GBU-10 laser-guided bomb (used in the 1991 Gulf War air-to-air kill per Wikipedia). Bombs on under-fuselage stations (est.).
- Large conformal tanks (see 2.10).

### 5.4 Mod ladder (armament, kid-friendly names)

1. **Free default: "Sidewinder Pals"**: 2 × AIM-9 Sidewinder on wing tips only.
2. **Rung 1: "Sparrow Squad"**: 4 × AIM-7 Sparrow under the fuselage.
3. **Rung 2: "Eagle Eyes"**: 6 × AIM-120 AMRAAM + 2 × AIM-9 (the real "6+2" loadout).
4. **Rung 3: "Big Bird Bomber"**: F-15E bombs (GBU-10 style) plus a targeting pod (F-15E only).
5. **Legendary: "Storm Eagle"**: 8 × AIM-120 AMRAAM and a centreline drop tank. (The max-missile load, shown in a gold/glow finish.)

Note: Real missiles are military hardware. Consider having them appear as simple, stylised shapes in the game. The 2D labels and stars should stay as game rewards, not weapon marketing.

---

## 6. Engines & propulsion

### 6.1 Real engines

| Variant | Engine | Dry thrust (each) | Afterburner thrust (each) | Notes |
|---|---|---|---|---|
| F-15C | Pratt & Whitney **F100-PW-220** | 14,590 lbf (64.9 kN) | 23,770 lbf (105.7 kN) | Wikipedia; milavia (F100-P-220 typo) |
| F-15E | Pratt & Whitney **F100-PW-229** | — | 29,100 lbf (129.45 kN) | milavia |
| F-15EX | General Electric **F110-GE-129** | 17,155 lbf (dry) | 29,500 lbf | Secondary (globalmilitary-derived); not verified against a primary source |

### 6.2 Visual notes

- **Afterburner look:** Shock diamonds (Mach diamonds) in the exhaust are a classic afterburner look. Rendering-only detail, not sourced. Use a series of bright cones with fading opacity.
- **Nozzle:** Axisymmetric, convergent-divergent (est.). Round exit about 0.9 m (est.).
- **Smoke:** Not a real F-15 feature. Use only as a game effect.

### 6.3 Mod ladder (engines, realistic → fantasy)

1. **Free default: F100 "Standard"**: grey nozzles, no glow.
2. **Rung 1: "Hot Rod" nozzle**: brass/gold-tint nozzles with a small flame.
3. **Rung 2: F110 "Upgrade"**: F-15EX engine. Different nozzle shade. (Name the realistic option "F110 Upgrade".)
4. **Rung 3: "Thunder Blue" afterburner**: blue-white shock diamonds with a longer flame.
5. **Legendary: "Golden Eagle Jets"**: golden glowing nozzles and a sparkle trail (fantasy).

---

## 7. Other cool mods specific to this aircraft

1. **Spine speed brake (est.):** A hinged panel on the upper fuselage behind the canopy that rises up. Animate a 0-60° rotation (est.). Kids will like the "air brake" sound.
2. **Conformal tanks (F-15E):** Toggle on/off. Animate a slide-out or reveal. Good as a visible "upgrade."
3. **Tail flash colours:** The vertical fins are a big canvas. Let kids pick a colour per fin (or a pattern). Two independent materials.
4. **Kill markings:** Small decals on the left intake or fin. One sticker per "correct" time-telling streak. Thematic (real F-15s carried kill markings).
5. **Intake ramp tilt:** Animate the variable ramps. Ramps open and close during "takeoff" and "landing." Range 0-10° (est.).
6. **Stabilator tilt:** Animate both stabilators together (up/down) when the jet banks or pitches. Dogtooth notch stays visible.
7. **Nozzle petal/shape:** Swap between round and "flattened" nozzle shapes (cosmetic).
8. **Radar nose tint:** Radome colour (cosmetic). Not sourced, so keep it as a game effect.

---

## 8. Sound

- **Engines:** Two afterburning turbofans. At idle, a deep rumbling whine. On afterburner, a loud broad roar with a low-frequency thump (est.).
- **Afterburner kick:** A sharp "whomp" when the afterburners light (est.).
- **Gun:** M61 Vulcan rotary cannon: fast, high-pitched rattling "brrrrrrt." Rate of fire roughly 6,000 rounds/min (est. from general knowledge, not sourced in this research).
- **Missile launch:** Short, sharp "whoosh-bang" for AIM-9/AIM-120 (est.).
- **Web Audio suggestion:** Layer (1) noise source through a bandpass filter for the roar, (2) low-frequency oscillator for the thump, (3) a sawtooth tuned to rotor/fan frequency for whine, (4) white noise bursts for the gun.
- No measured dB values in sources. Keep levels comfortable for young kids (est.).

---

## 9. Openly licensed 3D models

Honesty note: I found **no** confirmed-licence F-15 model from Poly Pizza, NASA, or Smithsonian in this research. The results were mostly commercial or restricted.

1. **Sketchfab - F-15E Strike Eagle (War Thunder style)**
   - URL: https://sketchfab.com/3d-models/f-15e-strike-eagle-war-thunder-e34a85d53f0542878960f443b776dde7
   - Licence: **listed as CC Attribution in the search result, but the page fetch returned empty.** Do not rely on this until you open the page yourself and confirm the exact licence string and attribution text.
   - Format: Sketchfab download (usually glTF/OBJ; verify).
   - Polycount: about **554k triangles** (search snippet; verify on page).
   - Quality: Highly detailed but far too heavy for a real-time iPad game. Use as a reference for proportions, or decimate heavily.

2. **CGTrader - F-15E Strike Eagle / F-15C Eagle listings**
   - URLs: https://www.cgtrader.com/3d-models/aircraft/military-aircraft/f15e-strike-eagle and https://www.cgtrader.com/free-3d-models/aircraft/jet/f-15-c-eagle
   - Licence: Varies per listing (royalty-free, personal-use-only, or paid). **Not verified.** Check each page.
   - Format: Mixed (check each).
   - Quality: Unknown.

3. **3DCadBrowser - F-15E model**
   - URL: https://www.3dcadbrowser.com/3d-model/f-15e-strike-eagle-2433
   - Licence: Listed as royalty-free with commercial use allowed (per search snippet). Older asset (2003, listed as paid). **Not verified on page.**
   - Quality: Older CAD. Likely high-poly. Check before use.

4. **Free3D - F-15 Eagle 1387**
   - URL: https://free3d.com/3d-model/f-15-eagle-1387.html
   - Licence: Royalty Free, **Editorial Only** (per search snippet). Editorial-only means not for commercial use. **Not suitable** for a published game unless licence changes.

5. **NASA 3D Resources / Smithsonian 3D / Wikimedia Commons**
   - **None found** in searches. NASA flew F-15B research aircraft (e.g., 836) but no official 3D asset turned up. Check https://nasa3d.arc.nasa.gov (not fetched) and Wikimedia Commons directly.

**Plain verdict:** No model here is clearly suitable. Procedural modelling (as planned) is the better path. Use the F-15E reference model only as a proportion check.

---

## 10. Reference sources

**Primary text:**

- Wikipedia, McDonnell Douglas F-15 Eagle: https://en.wikipedia.org/wiki/McDonnell_Douglas_F-15_Eagle (infobox, design, armament, specs). Fetched in two chunks.
- Milavia, F-15 specifications: https://milavia.net/aircraft/f-15/f-15_specs.htm (F-15C/E dimensions, weights, engines, speed; typo-checked against the text).
- Aerospaceweb, F-15 data: https://aerospaceweb.org/aircraft/fighter/f15 (cross-check; fetch returned HTTP 500, so values used from search snippets).
- Dauntless Soft, MetalWings F-15 specifications: https://www.dauntless-soft.com/MetalWings/HA4554.asp (height cross-check, 5.69 m C/D).
- 104th Fighter Wing (ANG) fact sheet: https://www.104fw.ang.af.mil/About/Fact-Sheets/Article/3409364/f-15-eagle/ (fetch returned HTTP 403; search snippet only, no dimensions).

**Specific topics:**

- Streak Eagle record: https://migflug.com/afterburner/?p=24419745 (title: "The F-15 That Climbed to 98,000 Feet in 3:27"), and https://usaf-sig.org/index.php/gallery/models/97-f-fighter-pursuit-aircraft/685-f-15a-72-0119-streak-eagle-by-chuck-holte.
- Paint schemes: FineScale forum, https://forum.finescale.com/t/f-15-colors/139875 and https://forum.finescale.com/t/paint-schemes-for-an-f-15/127413 (FS numbers; forum, so treat as secondary).
- 65th AGRS splinter: The Aviationist, https://theaviationist.com/tag/red-air/page/4/ (snippet).
- Bicentennial TF-15A: Hobby Master, https://hobbymasterarchive.org/HA4512/ and dauntless-soft https://dauntless-soft.com/MetalWings/HA4512.asp.
- Hawaii ANG history: https://dod.hawaii.gov/wp-content/uploads/2024/07/1987.Jan-Mar-Pupukahi-Vol.22-No.1.pdf (snippet).
- Wing/planform/sweep conflict: Military Periscope https://www.militaryperiscope.com/weapons/aircraft/fighter/f-15-eagle-air-superiority-fighter/ (paywalled; snippet only).
- F-15EX specs: aerocorner https://aerocorner.com/aircraft/boeing-f-15ex/ and globalmilitary comparison https://www.globalmilitary.net/compare/aircraft/f15e-strike-eagle-vs-f15ex-eagle-ii/ (snippets). Boeing product page not located.

**Three-view drawings (for proportions; not fetched):**

- AirVectors F-15 three-view / profile: https://airvectors.net/avf15_1.html (listed in search results; DNS failed on the dayvectors mirror).
- Air Force / USAF fact sheet three-view: check the 104th FW fact sheet above (no dimensions in the snippet).
- Wikipedia Commons "F-15 Eagle" three-view images (search directly on https://commons.wikimedia.org).

**Items I could not verify (listed so they are not used by mistake):**

- Root/tip chord exact values.
- Anhedral 2° vs 1°.
- Intake exact dimensions.
- Vertical tail exact height/sweep.
- Landing gear layout (est.).
- All hex colours (est.).
- Oregon ANG, JASDF, Saudi/Qatari schemes.
