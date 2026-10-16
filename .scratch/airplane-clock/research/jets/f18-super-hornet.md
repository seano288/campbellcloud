# F/A-18E/F Super Hornet (with legacy F/A-18A-D Hornet notes)

Research for the hangar game (procedural three.js model). Conventions:
- Metric first, imperial in brackets. Units: metres unless stated.
- **(est.)** = my estimate or approximation, not from a cited source. Treat as placeholder until checked against a three-view drawing.
- Source tags: [WIKI] Wikipedia Super Hornet page, [WIKI-H] Wikipedia Hornet page, [MIG] migflug.com Super Hornet page, [MIL] milavia.net Hornet specs, [NAVY] navy.mil fact file (blocked, HTTP 403, not read), [PP] Patriots Point, [MID] Midway museum, [WT] WarThunder forum spec sheet.
- Status: fetches to Wikipedia for both aircraft were truncated before their spec tables, so wing and fuselage stations are estimates.

---

## 1. Identity

- **Full name:** Boeing F/A-18E/F Super Hornet. E = single-seat, F = two-seat. The EA-18G Growler is a radar-jamming electronic-attack derivative built on the F/A-18F. [WIKI]
- **Nickname:** "Rhino" (the Super Hornet is the larger, heavier-looking sibling). Legacy Hornet is "Hornet". [WIKI] (nickname widely used; not verified on page)
- **Maker:** Boeing (McDonnell Douglas lineage; the original Hornet was McDonnell Douglas, later merged into Boeing). [WIKI, WIKI-H]
- **Era:** First flight 29 Nov 1995; introduced 1999; at least 632 built as of April 2020; final Block II delivery April 2020; Block III upgrades in test. [WIKI, WT]
- **Role:** Multirole strike fighter: air-to-air plus air-to-ground, carrier-based, also used as aerial tanker (buddy refuelling). [WIKI]
- **Operator:** US Navy (and USMC/RAAF-style foreign users in the broader Hornet family; RAAF operates legacy Hornets, not Super Hornets). Replaced the F-14 Tomcat. [WIKI, WT]
- **Crew:** 1 (E) or 2 (F). [MIG]
- **Legacy Hornet:** F/A-18A-D, same family, first flew 1978, single-seat A/C and two-seat B/D. [WIKI-H] (first-flight year is from general knowledge, est.)

### Kid-friendly voice lines (under 12 words each, checked for true facts)

1. "I'm the Super Hornet, and I can fly faster than sound!" (9 words) [WIKI: Mach 1.8]
2. "I land on a big ship in the ocean!" (8 words) [carrier operations, general knowledge]
3. "My two engines make me strong, like two giant fans!" (10 words) (est. analogy, not a claim)
4. "I can carry lots of heavy stuff under my wings!" (9 words) [MIG: 11 hardpoints]
5. "My wings can fold up, so I fit on the big ship!" (10 words) [general knowledge of carrier wing-folding, est.]

---

## 2. Geometry for procedural modelling

### 2.1 Overall dimensions

| Item | Super Hornet (E/F) | Legacy Hornet (A-D) | Source |
|---|---|---|---|
| Length | 18.31 m [60 ft 1 in] | 17.07 m [56 ft 0 in] (A/B) | [MIG], [MIL] |
| Wingspan (incl. wingtip rails) | 13.62 m [44 ft 9 in] | 11.43 m bare [37 ft 6 in]; ~12.3 m with wingtip AIM-9 (est.) | [MIG], [MIL] |
| Height (tail top, on ground) | 4.88 m [16 ft 0 in] | 4.66 m [15 ft 3 in] | [MIG], [MIL] (aerospaceweb gives 4.82 m, minor variance) |
| Wing area | 46.5 m² [500 ft²] | ~37.16 m² [400 ft²] | [MIG], [PP], [WT] |
| Empty weight | 14,552 kg [32,081 lb] | ~10,400 kg (est.) | [MIG]; legacy est. |
| Max take-off weight | 29,937 kg [66,000 lb] | ~25,400 kg (est.) | [MIG]; legacy est. |
| Max speed | Mach 1.8 "at altitude" (FAQ on same page says "a little over Mach 1.6") | Mach 1.8 at 40,000 ft | [MIG], [WIKI-H] |

Use Super Hornet length 18.31 and wingspan 13.62 as the scale reference. **Scale rule for the model:** set 1 game unit = 1 m. Full length 18.31 units.

Engine nacelles and LEX make the Super Hornet look wider than its wingspan suggests. The legacy Hornet is ~7 m shorter in span than the Super Hornet's wingspan, but close in overall volume (est.).

### 2.2 Fuselage (Super Hornet)

Use **x = 0 at nose tip, x = 18.31 at tail trailing edge.** Stations as % of length, widths and heights are (est.) unless noted.

| Station (% of L) | x (m) | Width (m, full) | Height (m, full) | Notes |
|---|---|---|---|---|
| 0% | 0.00 | 0.00 | 0.00 | Nose point |
| 5% | 0.92 | 0.55 | 0.60 | Radome, rounded |
| 10% | 1.83 | 0.85 | 1.00 | Radome to fuselage transition |
| 20% | 3.66 | 1.22 | 1.50 | Cockpit/canopy start region |
| 30% | 5.49 | 1.42 | 1.82 | Canopy and LEX start |
| 40% | 7.32 | 1.50 | 2.00 | Near widest, LEX zone |
| 50% | 9.16 | 1.45 | 1.95 | Wing root zone |
| 60% | 10.99 | 1.42 | 1.80 | Aft of wing root |
| 70% | 12.82 | 1.35 | 1.62 | Engines/tailcones start |
| 80% | 14.65 | 1.25 | 1.45 | Engine bay |
| 90% | 16.48 | 1.00 | 1.20 | Tail |
| 100% | 18.31 | 0.70 | 0.95 | Exhaust area (nozzle opening separate) |

**Radome/nose:** Ogive-like, slightly pointed, with a pitot boom under/forward (est.). Radome is a blended gentle taper, not a sharp needle.

**Cross-section profile:** The fuselage is not a circle. Build each station as a superellipse (n ≈ 2.5–3) with a flatter belly. Section narrows at the top behind the canopy and widens at the LEX. (est.)

**Canopy:** Starts about 20% of L (x ≈ 3.6 m) and ends about 40% of L (x ≈ 7.3 m). Canopy top at about z = 2.1–2.3 m above ground (est.). Canopy is a bubble with a windscreen that sweeps down into the nose.

Super Hornet cockpit has a single-piece bubble canopy on E and a two-seater canopy on F, with a larger aft-canopy hump on F (est.).

### 2.3 Leading-edge extensions (LEX)

- Run from the wing root (approx x = 5.3–8.6 m) up beside the cockpit. Each LEX is a long, thin blade on each side of the fuselage. [WIKI: "The LEX are enlarged, which improves vortex lift at high angles of attack"]
- Super Hornet LEX is **larger** than the legacy Hornet LEX and is recontoured. Upper edge is flush-ish with the canopy rail. (est.)
- Span of LEX at root: ~1.4 m half-width at x ≈ 7.3 m. Tip of LEX sits roughly at canopy-level, about z ≈ 1.95 m. (est.)
- The legacy Hornet LEX has a fence on its upper surface (added May 1988 per [WIKI-H]); the Super Hornet's LEX does not have that fence (est.).

### 2.4 Intakes

- **Super Hornet:** "larger rectangular caret inlets with fixed ramps" [WIKI]. Each inlet sits under the LEX, centred roughly at x ≈ 6.0–9.5 m, half-width ~0.8 m, height ~0.5 m (est.). Shape: caret (chevron) with a flat top and a V-shaped lip pointing forward. Fixed ramp inside the lip. An S-duct hides the fan blades from radar [WIKI].
- **Legacy Hornet:** "fixed pitot-type" intakes, similar to the F-16's [WIKI-H]. Visually: a **rounded, D-shaped opening** (round top, flat bottom) rather than the Super's caret. Your brief says "round", which matches the rounded top. Use a half-circle top with a flat bottom lip (est.).

### 2.5 Wings

**Super Hornet:**
- Shape: trapezoid, mid-to-high wing. Mounted on the fuselage at about 46–52% of L (x ≈ 8.5–9.5 m) at the root LE. (est.)
- Root chord (at fuselage): ~4.5 m (est.). Tip chord: ~2.3 m (est.). Check: (4.5 + 2.3) × 13.62 / 2 ≈ 46.5 m², matches the stated area.
- Leading-edge sweep: ~25° (est.).
- Trailing edge: straight to slightly swept, with a **full-span flaperon** (aileron + flap) and leading-edge slats (est.).
- Dihedral: small, roughly +0° (near flat), with a shoulder mount at the fuselage (est.).
- Wing-fold: outer wing panels fold up at a hinge line about 4 m out from the root (est.). Folded height rises to roughly 2.6 m, which is the fold-point visual cue.
- Airfoil thickness: ~8–10% root, ~5% tip (est.).
- Wingtip rails: AIM-9 missile rail at each wingtip, adding span (already in the 13.62 m figure).

**Legacy Hornet:**
- Shape: similar trapezoid but smaller. Root chord ~3.9 m (est.), tip chord ~1.9 m (est.), LE sweep ~26° (est.). Area 37.16 m² [PP].
- Wings fold at the outer panels, same mechanism (est.).

### 2.6 Tails

**Super Hornet (twin, canted outward, as in the Hornet family):**
- Two vertical tails. Each is canted outward ~20° from the vertical (est.). This is a major visual cue.
- Height: top of vertical tail ≈ 4.88 m above ground (est. per the aircraft's overall height).
- Position: forward of the stabilators, at x ≈ 14.5–17.0 m. Leading edge at the root ~x = 14.4 m; tip ~x = 16.4 m. (est.)
- Sweep: ~30° LE (est.).
- Root chord: ~3.2 m; tip chord: ~1.2 m (est.).
- Rudder: the full trailing edge of each vertical is a rudder.

**Stabilators (all-moving horizontal tails):**
- Mounted on the rear fuselage, roughly at x ≈ 15.2–17.5 m, span ~2.8 m per side from the centreline (est.).
- LE sweep ~30° (est.). Chord ~2.5 m at root, ~1.0 m at tip (est.).
- Stabilators move independently; they are the flaps for pitch/roll.

**Legacy Hornet:** Vertical tails are similar but a bit smaller, and the stabilators are also all-moving (est.).

### 2.7 Engines and nozzles

- **Super Hornet:** 2 × GE F414-GE-400, 57.8 kN dry [13,000 lbf], 97.9 kN with afterburner [22,000 lbf]. [MIG]
- **Legacy Hornet:** 2 × GE F404-GE-400 (A/B/C/D early), 71.17 kN [16,000 lbf] each with afterburner. Later F404-GE-402 is 78.73 kN [17,700 lbf]. [MIL]
- **Nacelle spacing:** Engines sit side by side in tailcones, separated by a central spine. Each nacelle is about 1.1 m across (est.). Nozzles are rectangular-ish with a flat tail face, as seen on the Super Hornet's engine bay (est.).
- Nozzle exit: about 1.0 m across each, at about x = 18.1 m, at z ≈ 1.0 m (est.). Nozzle is the fixed-exit mesh type; to show afterburner, animate the exit glow (see Section 6).

### 2.8 Landing gear

- Tricycle gear. Nose gear under the nose at x ≈ 3.5–4.0 m, single-wheel, retracts forward (est.).
- Main gear: two units in the fuselage, aft of the wing root, at x ≈ 9.5–10.5 m. Wheel track ~3.4 m (est.). Main-gear strut is short and robust (carrier-strength).
- Tailhook under the rear fuselage, aft of the main gear, extending to around x = 17.5 m (est.). Hook pivot is at the rear, not the nose.
- Super Hornet has a **launch bar** (catapult shuttle attachment) under the nose gear. It is the Super Hornet's nose-gear bar, which is a key visual cue (est. placement).

### 2.9 Top-view half-outline (est.)

Half-outline, x from nose = 0 to tail, y = half-width outward (m). Left side only; mirror for the right side. Traces nose → LEX → wing → stabilator.

```
(0.00, 0.00)  nose tip
(0.92, 0.55)  radome
(1.83, 0.85)
(3.66, 1.22)  canopy start
(5.49, 1.42)  LEX root
(6.40, 1.48)
(7.32, 1.50)  widest, LEX
(8.00, 1.40)  wing LE root (fuselage at wing)
(8.00, 0.90)  wing root LE (fuselage side)
(10.75, 6.81) wingtip LE (25° sweep)
(13.05, 6.81) wingtip TE
(12.50, 0.90) wing root TE
(14.65, 1.25) fuselage aft
(15.20, 0.80) stabilator root LE
(16.60, 2.80) stabilator tip LE (~30° sweep)
(17.90, 2.60) stabilator tip TE
(18.10, 0.80) stabilator root TE
(18.31, 0.00) tail centreline
```

Note: the wing root LE and TE points above are the fuselage-side intersection. The LE sweep and tip values follow the (est.) root and tip chords. Use this as an outline, then spline it.

### 2.10 Side-view outline (est.)

Side profile, x from nose (0) to tail, z above ground datum (m). Top and bottom.

Top (dorsal) curve, 26 points:
```
(0.00, 1.00)  nose tip
(0.92, 1.25)
(1.83, 1.50)
(2.74, 1.70)
(3.66, 1.90)  canopy front
(4.57, 2.05)
(5.49, 2.20)
(6.40, 2.30)
(7.32, 2.35)  canopy top / LEX top
(8.23, 2.30)
(9.14, 2.25)
(10.06, 2.25)
(11.00, 2.30)
(12.00, 2.35)
(13.00, 2.45)
(14.00, 2.60)  vertical-tail root
(14.80, 3.50)  vertical-tail LE
(15.50, 4.88)  vertical-tail tip
(16.30, 4.00)  rudder TE
(17.00, 3.00)
(17.60, 2.50)
(18.31, 2.00)  tail
```

Bottom (ventral) curve, 20 points, back toward nose:
```
(18.31, 1.00) tail (exhaust bottom)
(17.80, 0.95)
(17.50, 0.90)
(17.00, 1.10)  tailhook start
(16.50, 1.15)
(15.00, 1.00)
(12.00, 0.95)
(10.00, 0.85)  main gear area
(9.50, 0.70)   gear bay
(7.32, 0.75)
(5.49, 0.65)
(4.00, 0.55)
(2.00, 0.50)
(0.92, 0.55)
(0.00, 0.70)
```

These are estimates, not drawn from a published three-view. Verify against a three-view before shipping.

---

## 3. Distinctive features checklist

Ordered by how much each cue makes the jet recognisable at a glance:

1. **Twin tall vertical tails canted outward (about 20°).** Ground-level silhouette is unmistakably Hornet family, and the Super's tails are larger than the legacy's.
2. **Large LEX from the wing root up beside the cockpit.** Strongest side-view cue; they are visibly bigger on the Super.
3. **Caret intakes under the LEX.** Super Hornet caret ramps are the single fastest tell that it is a Super and not a legacy. Legacy has a round-top opening.
4. **Gently blunt, slightly bulbous nose with a long fuselage.** The Super is clearly longer and deeper than the legacy (18.31 m vs 17.07 m).
5. **Wingtip AIM-9 rails** at each wingtip. The rails add span and read as "fighter" at a glance.
6. **Twin engines in tailcones with flat, rectangular nozzles.** Nozzle shape is visible from the rear, and nozzles sit apart.
7. **Folding outer wings** (carrier-folding).
8. **Tail hook under the aft fuselage**, plus the Super's nose launch bar.
9. **Bulging fuselage shoulder above the wing**, a smooth hump behind the cockpit (est.).
10. **Under-wing store hardpoints.** 11 stations; the Super's wing and belly stations are the visual signature when loaded.

---

## 4. Paint & liveries

Hex values are visual estimates **(est.)**. Verify against FS 595 colour chips or reference photos before use. Scheme details are short summaries; confirm specifics from photos.

### 4.1 Real schemes

| # | Name | Description | Main / Secondary / Accent / Markings (hex, est.) |
|---|---|---|---|
| 1 | Navy tactical grey | Standard US Navy grey, low-visibility, dark markings. (FS 36320-family, verify.) | Main #6E7A74, secondary #55605B, accent #2E3430, markings #1E211F |
| 2 | Blue Angels | Navy blue with gold trim, white highlights, gold numerals. Demo team scheme. | Main #1F3A7A, secondary #F2F2F2, accent #E0B040, markings #0F1F40 |
| 3 | VFA-103 Jolly Rogers | Grey with the squadron's skull-and-crossbones tail and black/white accents. Tail art is the signature. | Main #6E7A74, secondary #3A3F3C, accent #F4F4F4, markings #111111 |
| 4 | CAG colour birds | Carrier air wing commander jet. Bright tail (red, yellow, or blue) with grey body. Simplest kid-fun look. | Main #6E7A74, secondary #D6372B (red tail), accent #F5C518, markings #FFFFFF |
| 5 | Top Gun Maverick (film scheme) | Film-inspired grey with black tail and film-style markings. Verify exact film livery. | Main #5C6661, secondary #1C1F1E, accent #E8E8E8, markings #A8322D |
| 6 | Aggressor splinter | Splinter camouflage in greens and browns for adversary training. | Main #4B5A3A, secondary #6F6A4A, accent #2F3B2A, markings #C8B98A |
| 7 | RAAF (Australia) | Grey/Two-tone with RAAF roundel. Legacy Hornet is the RAAF jet; Super Hornet is not in service there. Use as a legacy skin only. | Main #6F7C7A, secondary #4A5552, accent #1E5CA8 (roundel blue), markings #FFFFFF |
| 8 | Swiss Air Force (legacy F/A-18C) | Swiss grey camouflage with Swiss cross. Legacy jet; not on the Super Hornet. | Main #7D8580, secondary #5C6460, accent #E53935, markings #FFFFFF |
| 9 | CF-18 special (Canada) | Canadian CF-18 specials used a painted-on false canopy under the belly. Legacy jet. | Main #6E7874, secondary #4E5752, accent #C8102E, markings #FFFFFF |
| 10 | Kuwaiti (legacy) | Desert or grey camo with Kuwaiti roundel. Legacy jet. | Main #A89C7E, secondary #7A7060, accent #2B7A3D, markings #FFFFFF |

Notes:
- Items 7–10 are legacy-only; say so in the picker (Hornet-only).
- Item 9: Canadian CF-18 false canopy is a real feature (painted-on canopy under the belly to confuse adversaries). Do not model it on the Super Hornet.
- Verify items 5 (film scheme) and 3 (tail art) against photos; not sourced here.

### 4.2 Suggested mod ladder (paint)

- **Free default:** Navy tactical grey (#1). Always available.
- **Rung 1 (Bolts ~ easy):** CAG colour birds (#4): a bright red/yellow/blue tail. Simple, feels earned.
- **Rung 2:** Jolly Rogers tail art (#3). Pirate skull, a bit of story.
- **Rung 3:** Blue Angels (#2) or aggressor splinter (#6). Pick one; both are "showoff" looks.
- **Legendary:** Top Gun Maverick (#5), or a fantasy neon "Rainbow Rhino" with glow stripes. Make the Legendary a fantasy look, not a real squadron, to avoid implying a real unit.

---

## 5. Armament & stores

### 5.1 Hardpoints (11 stations, from [MIG])

| Station | Location | Typical store |
|---|---|---|
| 1 | Left wingtip | AIM-9 Sidewinder (launch rail) |
| 2 | Left outboard under-wing | AIM-120 AMRAAM or drop tank |
| 3 | Left inboard under-wing | Bomb or drop tank |
| 4 | Left inner wing / pylon | Bomb (JDAM, GBU-10 laser-guided) |
| 5 | Left inner fuselage / centreline-left | Bomb or AIM-120 |
| 6 | Centreline (under fuselage) | Drop tank or AIM-120 |
| 7 | Right inner fuselage / centreline-right | Bomb or AIM-120 |
| 8 | Right inner wing / pylon | Bomb |
| 9 | Right inboard under-wing | Bomb or drop tank |
| 10 | Right outboard under-wing | AIM-120 or drop tank |
| 11 | Right wingtip | AIM-9 Sidewinder (launch rail) |

Note: exact station labels vary by source; the 11-station count is from [MIG] ("two wingtip, six under-wing, three under-fuselage"). The station-to-location mapping above is (est.) from common Hornet/Super loadouts. For the three under-fuselage stations, the centreline is station 6 and stations 5 and 7 flank it (est.).

Armament on Super Hornet: the M61 gun is in the nose (Vulcan 20 mm, standard on Hornet family) (est., general knowledge).

Combat radius reference loadout: two GBU-10, one AIM-120, two AIM-9, three drop tanks; ~1,033 km [642 mi, 558 nmi] hi-lo-hi. [MIG]

### 5.2 Store list (kid-friendly names)

- AIM-9X Sidewinder: short-range heat-seeking missile. Wingtip rail.
- AIM-120 AMRAAM: medium-range radar missile. Fuselage/under-wing.
- JDAM (GBU-31/32/38): satellite-guided bomb; add GPS "tail fins" shape.
- GBU-10 Paveway: laser-guided bomb.
- Harpoon: anti-ship missile (est., general knowledge; not from the sources above).
- HARM: anti-radar missile (est., general knowledge).
- ATFLIR pod: targeting pod under the fuselage (est. placement).
- Buddy refuelling tank: centreline tank that lets the jet refuel others.
- Drop tanks: extra fuel, under-wing.

### 5.3 Mod ladder (armament)

- **Free default:** AIM-9 rails only (wingtip). Simple and safe.
- **Rung 1 "Sky Sparkle":** Add two AIM-120 on under-wing stations. Name: "Cloud Chasers".
- **Rung 2 "Bomb Boom":** Add GBU/JDAM on the inner pylons. Name: "Target Thumpers".
- **Rung 3 "Pod Power":** Add the ATFLIR targeting pod and the buddy tank. Name: "Super Spotter Pack".
- **Legendary "Rainbow Rhino Blaster":** Glowing candy-coloured sparkle missiles, with a fantasy name. Keep it obviously fictional.

---

## 6. Engines & propulsion

### 6.1 Real engines

- **Super Hornet:** 2 × General Electric F414-GE-400 turbofans; 57.8 kN dry [13,000 lbf], 97.9 kN with afterburner [22,000 lbf]. [MIG], [WIKI]
- **F414 lineage:** developed from the Hornet's F404. [WIKI]
- **Legacy Hornet:** 2 × GE F404-GE-400 (71.17 kN each with afterburner [16,000 lbf]); F404-GE-402 is 78.73 kN [17,700 lbf]. [MIL]

### 6.2 Afterburner look

- Real afterburner plume is a hot, bright exhaust shot out of the back of each nozzle (est.). Visual: orange/blue core with pale tips; glow scales with throttle.
- The nozzle exits are flat rectangular-ish with a visible engine face inside (est.).
- Use an emissive mesh plus additive glow for the plume; stop it at idle.

### 6.3 Engine mod ladder (5 steps)

1. **Free default (realistic):** Standard F414 look, orange glow on afterburner.
2. **Rung 1 "Turbo Trim":** Chrome nozzle rings and a red-glow afterburner. Name: "Shiny Tailpipes".
3. **Rung 2 "Blue Flame":** Blue-white plume with a light tint. Name: "Blue Blaster".
4. **Rung 3 "Rainbow Rocket":** Multi-colour plume that cycles through red, yellow, blue. Name: "Rainbow Roar".
5. **Legendary "Star Engine":** Plume leaves a sparkle trail behind the jet. Fantasy, not realistic. Name: "Shooting Star Drive".

---

## 7. Other cool mods specific to this aircraft

1. **Folding wingtips:** Outer wing panels fold up (at ~4 m out from the root) when the jet is parked, then unfold for flight. Animates: hinge rotation at the fold line.
2. **Tail hook:** Hook lowers from under the aft fuselage on landing, and retracts. Animates: pivot at the hook mount, lowered ~20–30° (est.).
3. **Refuelling probe that pops out:** A probe extends from the nose-right (est.) during a tanker approach. Animates: linear slide, then retracts.
4. **Vapour cones at transonic speed:** White condensation rings form at the LEX/wing tips near Mach ~0.9. Animates: a particle or shader ring shown when speed crosses the threshold.
5. **Catapult launch bar:** A nose-gear launch bar (extended at launch). Animates: extend the bar and pop up the nose gear on launch.
6. **CAG tail art:** The tail carries a colour or emblem pattern. Animates: tail-colour swap as a livery (see Section 4).
7. **Canopy opens:** Canopy lifts on a hinge at the rear. Animates: hinge rotation, with pilot silhouette visible inside (est.).
8. **Flaperon droop on landing:** Flaperons droop when the jet slows. Animates: pitch of the flaperon hinge.

---

## 8. Sound

What the jet sounds like (general knowledge, est. where marked):

- **Idle/taxi:** Low, rumbling turbofan whine with a steady hiss from the intakes. The F414's fan whine is higher than a big airliner's but lower than a small trainer (est.).
- **Take-off roll:** Rising jet roar, with the afterburner producing a loud "whoosh" crackle. Afterburner is a sharp, deep roar, not a whistle (est.).
- **Cruise:** Steady, smooth turbofan hum with a soft air-rush from the canopy and wings (est.).
- **Aerial refuel:** Quieter, steady hum (est.).
- **Catapult/launch:** A short, heavy steam-like shove sound, then a hard roar.

Web Audio synthesis suggestions (est.):
- **Engine:** Two oscillators (fan whine 600–1,600 Hz, rising with throttle) plus band-limited white noise (filtered 300–4,000 Hz) for the roar. Add a low-frequency rumble for thrust.
- **Afterburner:** Raise noise gain and add a crackle (short random clicks at 15–40 Hz), with a low-pass filter opening.
- **Idle:** Quiet filtered noise (hiss) plus a low fan whine (~400 Hz).

---

## 9. Openly licensed 3D models

**Status: no suitable openly licensed Super Hornet model was verified in this research.** The fetches needed to confirm licences were blocked or returned empty pages.

| Source | URL | Licence (as stated on page) | Format | Poly count | Notes |
|---|---|---|---|---|---|
| NASA 3D Resources | Not found in search | Not verified | Not verified | Not verified | Search did not surface a NASA F/A-18 model. Check nasa.gov 3D resources directly. |
| Sketchfab (johnnokomis) | https://sketchfab.com/johnnokomis/models | **Not verified: page returned empty** | Not verified | Not verified | Lists "US Navy F/A-18E Super Hornet 3D Model" in a snippet. Open the model page and read the licence field before use. |
| CGTrader (free low-poly) | https://www.cgtrader.com/free-3d-models/aircraft/jet/fa18-super-hornet-low-poly | **Not verified: page returned empty** | OBJ, Collada, FBX, Blender per snippet | Not verified | Free low-poly listing; check licence on the page. |
| Free3D (F/A-18E 2011 / F/A-18F 2462) | https://free3d.com/3d-model/f-a-18f-super-hornet-2462.html | Not verified ("royalty-free" listings are not CC-BY) | Not verified | Not verified | Read the licence on the page. Royalty-free ≠ CC-BY. |
| 3dcadbrowser (F-18 Hornet, legacy) | https://www.3dcadbrowser.com/3d-model/f-18-hornet-133142 | Royalty-free, commercial use allowed (per search snippet) | CAD solid | Not verified | Legacy Hornet. Verify licence on the page. |

Not checked in this pass: Poly Pizza, Smithsonian 3D, Wikimedia Commons. Recommend checking Wikimedia Commons ("F/A-18E Super Hornet" category) for CC-licensed images to use as reference, not as a model.

**Recommendation:** Procedural modelling (as the brief says) is the right choice. Use the public three-view drawings in Section 10 for the scale check.

---

## 10. Reference sources

Pages used:
- Wikipedia, Boeing F/A-18E/F Super Hornet: https://en.wikipedia.org/wiki/Boeing_F/A-18E/F_Super_Hornet (fetched; spec table truncated; used for engines, LEX, intakes, Mach 1.8, dates)
- Wikipedia, McDonnell Douglas F/A-18 Hornet: https://en.wikipedia.org/wiki/McDonnell_Douglas_F/A-18_Hornet (fetched; spec table truncated; used for legacy intake and LEX notes, Mach 1.8, F404)
- migflug.com, F/A-18E/F Super Hornet specs: https://migflug.com/afterburner/aircraft/fa-18-super-hornet/ (main source for the Super Hornet dimensions, weight, engines, hardpoints)
- MILAVIA, F/A-18A Hornet specs: https://milavia.net/aircraft/fa-18/fa-18_specs.htm (legacy length, height, span, engines, thrust)
- WarThunder forum legacy spec sheet: https://forum.warthunder.com/t/f-a-18-hornet-legacy-history-performance-discussion/3725/11 (wing area; span with and without missiles)
- Patriots Point, F/A-18A Hornet: https://patriotspoint.org/explore/aircraft/f-a-18a-hornet (wing area 37.16 m²)
- Midway museum, F/A-18 Hornet: https://www.midway.org/exhibits-activities/exhibits/aircraft-gallery/jet-airplanes/fa-18-hornet/ (variant dimensions; height variance)
- aerospaceweb.org Super Hornet: https://aerospaceweb.org/aircraft/fighter/f18ef/ (height variance: 4.82 m)
- Navy fact file: https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2383479 (HTTP 403, not read)
- NAVAIR product page: https://www.navair.navy.mil/product/FA-18EF-Super-Hornet (listed, not fetched)

Three-view drawings to check the procedural model against (not fetched; check before use):
- Wikimedia Commons F/A-18E three-view (search "F/A-18E three view" on commons.wikimedia.org) (est. location)
- Aerospaceweb and other spec-site profiles (listed above)
- Navy standard aircraft characteristics document for F/A-18E/F (search navair.navy.mil; not fetched)

Known gaps to close before coding:
- Wing root and tip chords, sweep, and LEX geometry are estimates. Confirm from a three-view.
- Fuselage cross-sections are estimates. Confirm with a side and top view.
- Top-view and side-view outlines are estimates. Verify before use.
- Super Hornet max speed: the page conflicts (Mach 1.8 vs "a little over Mach 1.6" in the FAQ). Use "about Mach 1.8" for the voice line.
