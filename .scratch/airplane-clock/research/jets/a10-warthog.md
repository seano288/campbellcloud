# Fairchild Republic A-10 Thunderbolt II "Warthog" — research for hangar 3D model

Research date: 2026-10-16. Tags used throughout:
- **[src]** = number or fact taken from a fetched/search-returned source (URL in section 10).
- **(derived)** = arithmetic on [src] numbers.
- **(est.)** = my estimate, NOT sourced. Verify against a three-view before relying on it.
- **(gen.)** = general aviation knowledge not confirmed against a fetched page in this research.

Units: metres unless stated. 1 m = 3.2808 ft.

---

## 1. Identity

- **Full name:** Fairchild Republic A-10 Thunderbolt II. Earlier prototype: YA-10. Two-seat trainer: OA-10A/A-10A variants. Current variant in service: A-10C (upgraded avionics, precision targeting, [src] Wikipedia infobox "A-10C" spec block).
- **Nicknames:** "Warthog" [src] (Wikipedia: "commonly referred to as the 'Warthog'", pilots and crews of USAF attack squadrons). "Hog" is the common short form (gen.). "Go Ugly Early" is the phrase for calling it in early to support ground troops [src]. "Flying Gun" is common but NOT found in fetched sources; do not use it in-game without a source.
- **Maker:** Fairchild Republic Company (Fairchild Hiller/Republic Aviation lineage). [src] Wikipedia.
- **Era:** First flight **10 May 1972**, YA-10 prototype, pilot Howard "Sam" Nelson [src]. Introduced **October 1977** [src]. Still flying (USAF, Air National Guard; ~2026 status not re-checked).
- **Role:** Close air support (CAS) and anti-armour attack. Built around the gun. Straight wing, subsonic, twin turbofan [src: Wikipedia calls it "single-seat, twin-turbofan, straight-wing, subsonic attack aircraft"].
- **Crew:** 1 pilot [src].

### Five kid-friendly voice lines (all TRUE, all under 12 words)

1. "The Warthog's gun shoots bullets bigger than your thumb!" (30 mm shells, [src] 30×173 mm.)
2. "Its gun fires about sixty-five bullets every single second!" (3,900 rpm = 65/s, [src].)
3. "The Warthog flies low and slow to help soldiers on the ground." (Mission statement, gen.)
4. "It can keep flying even when one engine stops!" (A-10 twin-engine, gen. — verify wording against a USAF fact sheet before shipping.)
5. "It's named after a bumpy, tough animal: the warthog!" (Nickname origin is the animal, gen.; nickname [src].)

---

## 2. Geometry for procedural modelling

### 2a. Overall (all [src] unless noted)

| Item | Metric | Imperial | Source |
|---|---|---|---|
| Length | **16.26 m** | 53 ft 4 in | Wikipedia A-10C spec |
| Wingspan | **17.53 m** | 57 ft 6 in | Wikipedia A-10C spec |
| Height | **4.47 m** | 14 ft 8 in | Wikipedia A-10C spec |
| Wing area | **47.0 m²** | 506 sq ft | Wikipedia A-10C spec |
| Mean geometric chord | 2.68 m (derived = 47.0 / 17.53) | | derived |
| Aspect ratio | ~6.5 (derived = 17.53² / 47.0) | | derived |
| Empty weight | 11,321 kg | 24,959 lb | Wikipedia |
| Max T/O weight | 20,865 kg | 46,000 lb | Wikipedia |

Conflicting metric conversions exist in older sources (Northrop Grumman page: 16.16 / 17.42 / 4.42 m; Milavia/Skybrary: 16.26 / 17.53 / 4.47). The 16.26/17.53/4.47 set matches the imperial figures and the Wikipedia spec. Use it.

Scale note for the game: model at **1 unit = 1 m**, nose at x=0, tail at x=16.26, z=0 at ground line with gear extended, y=0 on centreline.

### 2b. Fuselage

- **Nose:** Blunt, rounded, with the GAU-8 muzzle protruding from the nose slightly LEFT of centre (pilot's left when facing forward is aircraft-left; the gun is on the aircraft's LEFT of centreline, i.e. negative-y if +y is aircraft-right). Muzzle sits at the very front, a little below the nose tip (est.: z ≈ 0.9 above ground, y ≈ -0.35, est.).
- **GAU-8/A barrel length:** 90.5 in = **2.30 m** [src: Migflug / Milavia]. Entire gun system: 19 ft 10.5 in = **6.06 m** [src]. Barrel alone ~620 lb [src].
- **Ammunition drum:** Sits BEHIND the muzzle, extends rearward nearly 20 ft (~6 m) toward the forward fuel tank at mid-fuselage [src: Migflug, "almost to the front fuel tank"]. Drum capacity 1,174 rounds (~1,150 typical) [src]. Feed system plus loaded drum >4,000 lb [src].
- **Gun offset:** The whole gun is offset to the aircraft's LEFT (port) so the firing barrel (9 o'clock position, one of seven) lies on the centreline. Recoil ~10,000 lb average, slightly more than one TF34's thrust [src]. Model this as: gun axis at y ≈ -0.35 m (est.); firing barrel at y = 0.

**Fuselage stations** (x from nose; widths are full width, heights are full height; ALL (est.) — no source gave station data):

| Station | x (m) | x as % of length | Width (m) | Height (m) | Notes |
|---|---|---|---|---|---|
| S0 nose tip | 0.00 | 0% | 0.0 | 0.0 | Blunt nose, nose cap |
| S1 | 0.60 | 4% | 0.9 | 0.9 | Nose ogive |
| S2 | 1.60 | 10% | 1.5 | 1.4 | Radar/nose bay, gun muzzle at this section |
| S3 | 3.00 | 18% | 1.9 | 1.8 | Cockpit front |
| S4 | 4.00 | 25% | 2.2 | 2.1 | Cockpit / titanium "bathtub" centre |
| S5 | 5.20 | 32% | 2.3 | 2.2 | Wing leading-edge root zone |
| S6 | 6.80 | 42% | 2.2 | 2.1 | Wing trailing-edge root zone, fuel bays |
| S7 | 8.60 | 53% | 1.9 | 1.8 | Aft fuselage, tail booms start |
| S8 | 10.60 | 65% | 1.6 | 1.6 | Engine nacelle zone |
| S9 | 12.40 | 76% | 1.4 | 1.4 | Engine exhaust/aft |
| S10 | 13.80 | 85% | 1.1 | 1.1 | Tail base, tailplane root |
| S11 | 15.20 | 93% | 0.7 | 0.7 | Tail cone |
| S12 tail end | 16.26 | 100% | 0.4 | 0.4 | Exhaust end |

Gun-side note: the GAU-8 sits on the aircraft's LEFT (port) side, so in model coordinates with +y = aircraft right, the muzzle is at y ≈ -0.35 (est.).

Cross-section shape: **squarish with rounded corners**, flat-ish bottom, slight taper aft. Not circular. Use superellipse with exponent ~2.5–3.0 (est.).

### 2c. Canopy

- **Canopy start:** windscreen leading edge at ~ **14–16% of length** (x ≈ 2.4–2.6 m) (est.).
- **Canopy end:** aft canopy edge at ~ **33–36% of length** (x ≈ 5.4–5.8 m) (est.).
- **Shape:** Single-seat **bubble canopy**, bulging out of the fuselage top, pointed nose glazing. Roughly a half-ellipsoid, height above fuselage top ~0.35 m (est.), width ~1.9 m (est.).
- **Bubble cross-section:** Round/elliptical, not a flat plate.

### 2d. Cockpit "titanium bathtub"

Not a sourced dimension in this research. The A-10 cockpit is surrounded by a titanium armour tub (gen.). Model as an inner body sitting under the canopy, roughly x = 2.6–5.4 m, width 1.7 m, height from floor z≈0.7 up to canopy base (est.). Render the bathtub as a slightly darker/titanium-tinted shell.

### 2e. Wings (straight, thick, low-mounted)

- **Sweep:** ~0° at quarter-chord (gen.; straight wing is confirmed by [src] Wikipedia "straight-wing").
- **Thickness:** Thick wing, NACA-like airfoil, ~15–16% t/c at root (est.). The wing is famously thick and robust.
- **Wing position:** Low-mounted, on the fuselage side. Root leading edge at x ≈ 5.2–5.6 m (32–34% of length) (est.). Root trailing edge at x ≈ 9.2–9.8 m (est.).
- **Root chord:** derived from area and span. If taper ratio ≈ 0.26 and mean chord 2.68 m, root ≈ 4.2 m, tip ≈ 1.1 m (**est.**, derived from area/span, assumes linear taper; not sourced directly).
- **Tip chord:** ~1.1 m (est.).
- **Leading edge:** straight across span (zero sweep), from root (x≈5.4) to tip (x≈5.4). Trailing edge tapers forward from root (x≈9.6) to tip (x≈6.5) (est.).
- **Dihedral:** Inner panels ~0° (gen.); outer panels droop/ slight dihedral. The most visible feature is the **drooped wingtip**. Use an outer-panel dihedral of ~5–8° (est.) and a wingtip droop of ~10° (est.). Verify on a three-view.
- **Wingtip launch rails:** AIM-9 rails on the wingtips (gen., see §5).
- **Wing thickness at root:** ~0.55–0.6 m (est.) — the wing is thick enough to contain fuel and gear.

### 2f. Landing gear and gear pods

- **Layout:** Tricycle gear. Main gear: two single-wheel units, one on each **wing** — they retract **into underwing pods** near the fuselage, with the **wheels partly exposed** when retracted (gen., and a visible A-10 cue).
- **Main gear pod position:** mid-span-ish under the wing, around 35–40% of span from the fuselage (est.), x ≈ 5.8–6.6 m (est.).
- **Main gear pod size:** ~0.7 m long, ~0.55 m wide, ~0.55 m tall (est.). Wheel diameter ~0.85 m (est.).
- **Wheels in pods:** wheel protrudes below pod bottom by ~0.15 m when retracted (est.).
- **Nose gear:** single wheel, under the forward fuselage at x ≈ 2.4 m, retracts forward (gen.); wheel dia ~0.6 m (est.).
- **Ground clearance at fuselage centre:** ~0.7 m (est.).

Position on the procedural model: put the main pod inboard edge at y = 1.1 m, outboard edge at y = 1.9 m (est.), z top at 0.75 m, wheel bottom at z = 0.

### 2g. Engines: two GE TF34-GE-100 (A-10C: TF34-GE-100A) turbofans

- **Thrust:** **9,065 lbf (40.32 kN) each** [src: Wikipedia A-10C spec, TF34-GE-100A]. Total ~18,130 lbf (derived).
- **No afterburner** (gen.). Turbofan, high bypass.
- **Engine pods:** Mounted high on the rear fuselage, one each side, on short pylons (gen.; a visible cue).
- **Pod length:** ~3.0 m (est.) — the TF34 is a long engine (gen.). Pod diameter ~1.2 m (est.).
- **Pod position:** Inboard edge at y = ±0.9 m, outboard at y = ±2.1 m (est.). Centre x ≈ 10.5–12.0 m (est.). Centre z ≈ 1.8–2.2 m (est.), mounted high on the rear fuselage, above the wing line.
- **Exhaust:** end at x ≈ 13.6–14.2 m, roughly level with the tailplane root (est.).
- **Intake:** front of pod, ~1.0 m dia (est.).
- **Pylon:** a short pylon on the top of the fuselage, the pod bolts to the fuselage side (est.).

### 2h. Tail: H-tail (horizontal stabiliser) with twin vertical fins at the tips

- **Horizontal stabiliser:** straight, with twin fins at its ends (gen.). Tailplane half-span ~3.2 m (est.), so tailplane tip-to-tip ~6.4 m (est.).
- **Tailplane root chord:** ~1.9 m (est.). Tip chord ~1.0 m (est.).
- **Tailplane position:** root LE at x ≈ 12.9 m, TE at x ≈ 14.6 m (est.). Tailplane z ≈ 2.1 m (est.).
- **Vertical fins:** two, one on each tailplane tip, leaning outward (est. ~ 10–15° from vertical, gen.). Fin height ~2.0 m from tailplane top (est.), top at z ≈ 4.47 (from [src] height). Fin chord at root ~1.9 m, at tip ~0.9 m (est.).
- **Fin position:** centred at y = ±3.2 m (est.), x ≈ 13.9–15.3 m (est.).

Height check: fin top z = 4.47 m [src] (the tallest point, when gear is down). Tailplane top at z ≈ 2.1 m (est.). Fin height = 4.47 − 2.1 ≈ 2.4 m (derived from est.). Adjust to match the 4.47 total.

### 2i. Top-view half outline (x = metres from nose, y = metres outward from centreline, one side; mirror for other side)

All (est.). Start at nose, go along one side, out wing, back to tail, close at centreline.

```
(0.00, 0.00)   nose tip
(0.60, 0.45)
(1.60, 0.70)
(3.00, 0.90)
(4.00, 0.95)
(5.20, 0.95)   wing leading-edge root
(5.40, 8.77)   wing LE tip (half-span = 17.53 / 2 = 8.765 [derived])
(6.50, 8.77)   wing TE tip (tip chord ~1.1)
(9.60, 0.95)   wing TE root
(10.60, 0.85)
(12.40, 0.75)
(12.90, 0.70)  tailplane root LE
(12.90, 3.20)  tailplane tip LE
(13.90, 3.20)  tailplane tip TE (fin base)
(14.60, 0.70)  tailplane root TE
(15.20, 0.40)
(16.26, 0.00)  tail end (centreline)
```

Notes: the true fuselage taper is more than this. Outline is the planform silhouette. Wing root outline is cut into the fuselage side. Pod and fin additions sit outside this outline.

### 2j. Side-view outline (x = metres from nose, z = metres above ground, gear down)

Top profile (≈18 points), (est.):
```
(0.00, 1.00)   nose top (blunt)
(0.60, 1.25)
(1.60, 1.55)
(3.00, 1.95)   windscreen base
(4.00, 2.30)   canopy top
(5.00, 2.45)
(6.80, 2.40)   wing root top
(8.60, 2.35)
(10.00, 2.30)  engine pod top
(11.50, 2.45)
(12.40, 2.60)
(13.10, 2.85)  tailplane top
(13.90, 3.60)  fin leading edge
(14.60, 4.47)  fin top [src height]
(15.30, 4.47)  fin top TE
(15.90, 3.60)  fin TE base
(16.26, 2.20)  tail end, top
```

Bottom profile (≈16 points), (est.):
```
(16.26, 1.50)  tail end, bottom
(15.50, 1.00)
(14.20, 0.85)
(13.00, 0.85)
(11.00, 0.80)
(9.00, 0.75)
(7.00, 0.70)
(5.00, 0.65)
(3.00, 0.60)
(1.60, 0.55)
(0.60, 0.60)
(0.00, 0.90)   nose bottom (gun muzzle near here)
```

Gear wheels reach z=0 at x ≈ 6.2 (main) and x ≈ 2.4 (nose), est.

---

## 3. Distinctive features checklist (ordered by recognition value)

1. **Huge nose-mounted gun** that protrudes from the nose, slightly off-centre to the left. Single most recognisable cue. Gun barrel visibly out of the nose.
2. **Twin tall vertical fins** at the tips of a high tail. Splayed outward (est.), making a distinct "twin tail on an H-tail" silhouette.
3. **Engines mounted high** on the rear fuselage, pods visible above the wing line.
4. **Straight, thick, low-mounted wing** with drooped/tapered tips.
5. **Main gear pods on the wing** with wheels partly exposed when retracted (no fully hidden gear).
6. **Blunt, chunky, "ugly" fuselage**, squarish cross-section. Opposite of sleek.
7. **Titanium bathtub** cockpit: darker, armoured look around the cockpit.
8. **Bubble canopy** perched on top of the fuselage, forward of the wing.
9. **Wingtip AIM-9 rails** (when loaded) — gen., see §5.
10. **Underwing hardpoints** heavily loaded: pylons, rocket pods, bombs visible.
11. **Shark-teeth or warthog-teeth nose art** (see §4) — a player-visible unlock feature with a big impact.
12. **Two split "decelerons"** on the wing and tail (see §7) — opened as clamshells.

---

## 4. Paint and liveries

### 4a. Source-backed scheme facts

- **Peanut scheme** (early Cold War): sand, yellow, field drab [src: Wikipedia].
- **Winter scheme**: black and white [src: Wikipedia].
- **Mixed pattern**: tan, green and brown [src: Wikipedia].
- **European I "lizard" / woodland**: dark green, medium green, dark grey. Used roughly the 1980s to early 1990s. Designed to minimise visibility from above (fighter threat was considered more serious than ground fire) [src: Wikipedia; TheAviationist/finescale forum].
- **Compass Ghost**: adopted after the 1991 Gulf War. Two-tone grey: darker top, lighter underside, to minimise visibility from below [src: Wikipedia; retailer pages]. Many A-10s also carried a false canopy painted on the underside, behind the gun [src].
- **Compass Ghost paint codes** (per a Finescale-type source): light ghost grey **FS 36375**, dark ghost grey **FS 36320** [src: one forum/retailer reference; verify against a Federal Standard chart].
- **Desert Storm 1991**: an A-10A with kill markings from Operation Desert Storm is shown in Wikipedia captions [src]. Exact scheme name not confirmed in this research.
- **Heritage specials**: A-10C of the 127th Wing, Michigan ANG, painted to commemorate the 107th Fighter Squadron's 100th anniversary (2017) [src: TheAviationist 2017]. Also: A 1:48 scale heritage kit series ("Heritage Hawgs") exists [src: themodellingnews], which is a good cross-check for heritage liveries.

### 4b. Not verified in this research (do not use names as facts without a source)

- "MASK-10A" grey: could not confirm. Forum posts describe Compass Ghost as "a modified MASK scheme" [src: Finescale]. Treat "MASK" as the name of a family of schemes, not a single scheme, unless checked.
- Idaho ANG, shark mouth/warthog teeth nose art, A-10 Demo Team, retirement specials: real in general (gen.), NOT checked in this research. Check before use.

### 4c. Hex colours

All hex values below are **(est.)**. They approximate the FS colours above and common modeller references. Do not claim them as official. Tune by eye on the model.

| Scheme | Main | Secondary | Accent | Markings |
|---|---|---|---|---|
| Compass Ghost (default) | #8E9397 (est., light ghost grey FS36375) | #5F6468 (est., dark ghost grey FS36320) | #3A3F44 (est., panel lines) | #1A1D20 (est., stencils) |
| European I "Lizard" | #4E5A3A (est., dark green) | #7A8258 (est., medium green) | #5C5E5A (est., dark grey) | #111111 (est.) |
| Peanut (sand / yellow / field drab) | #C9B98A (est., sand) | #D9C25A (est., yellow) | #6B6B4D (est., field drab) | #222222 (est.) |
| Winter | #F2F2F0 (est., white) | #1C1C1C (est., black) | #8A8A8A (est., grey) | #B42121 (est., red accent) |
| Mixed (desert/tan) | #B8A37A (est., tan) | #4F5B39 (est., green) | #6B4F33 (est., brown) | #222222 (est.) |
| Desert Storm kill-marks | Compass Ghost base | — | #111111 (est.) | Mission kill decals (white/black) |
| Heritage (107th FS style) | #1B1B1B (est., black) | #C8A24A (est., gold) | #D62E2E (est., red) | Heritage tail art (check reference) |
| Shark-teeth nose | Compass Ghost base | — | #E6E6E6 (est., white teeth) | #B3121D (est., red mouth) |

### 4d. Mod ladder for paint (suggested)

- **Free default:** Compass Ghost (the actual 1990s–present USAF look). Players know it.
- **Rung 1:** European I "Lizard" green camo. Easy to recognise, classic.
- **Rung 2:** Peanut (sand/yellow). Iconic early-era desert look.
- **Rung 3:** Winter black-and-white, or Mixed tan/green.
- **Legendary:** Heritage scheme (black/gold, 107th-style) PLUS shark-teeth nose art. The legendary look combines a special livery and nose art.

Kid-friendly names: "Sky Ghost" (Compass Ghost), "Jungle Lizard" (European I), "Desert Sand" (Peanut), "Snow Hog" (Winter), "Mixed Mud" (Mixed), "Golden Hog" (Heritage).

---

## 5. Armament and stores

### 5a. Gun

- **GAU-8/A Avenger**, 30 × 173 mm, 7-barrel rotary Gatling, single-barrel fire at 9 o'clock [src: Migflug/Wikipedia].
- **Rate of fire:** **3,900 rpm** (originally selectable 2,100 or 4,200 rpm) [src: Wikipedia; Migflug spec table]. 3,900 rpm = **65 rounds per second** (derived).
- **Ammunition:** 1,174 rounds, typically ~1,150 [src]. At 65/s, the drum empties in about 18 seconds [src: Migflug, "roughly 18 seconds"].
- **Recoil:** ~10,000 lb average [src].
- **Use this for the game:** the gun is the star. 1 burst ≈ 0.5–1 s = 30–65 rounds. A short burst is fine.

### 5b. Hardpoints

- **11 stations total**: **8 under-wing** and **3 under-fuselage** [src: Wikipedia; a second source confirms 11 pylons with 16,000 lb capacity].
- **Station numbering:** The sources do NOT give the station-by-station map. The standard convention (gen.) is 1 and 11 at the wingtips, 2–4 and 8–10 under the wings, 5–7 under the fuselage. **Verify against USAF T.O. 1A-10 before using station numbers in-game.**
- **Max external load:** 16,000 lb [src].

Where each store goes (gen., positions est.):

| Location | Typical stores |
|---|---|
| Wingtip (1, 11) | AIM-9 Sidewinder rails (self-defence) |
| Outboard underwing (2, 10) | AGM-65 Maverick missile, or rocket pod |
| Mid underwing (3, 9) | Mk-82 bombs, or GBU/JDAM kits, or rocket pod |
| Inboard underwing (4, 8) | Rocket pod, or ECM pod (e.g. ALQ-119 type) |
| Fuselage (5, 6, 7) | Centreline store, targeting pod (on a pylon, est.), flare dispenser |

### 5c. Individual stores (gen. unless noted)

- **AGM-65 Maverick** (air-to-ground missile). Shown on outboard wing pylons. Length ~2.5 m (est.).
- **LAU-68 / LAU-61 rocket pods** (2.75 in / Hydra-70 class). Typical pod length ~2.5 m (est.).
- **Mk-82 500 lb bomb** (gen.). Length ~2.1 m (est.), diameter ~0.27 m (est.).
- **GBU-31 / JDAM** guided bomb kit. Same body as Mk-82 with tail kit (gen.).
- **AIM-9 Sidewinder** self-defence, on wingtip launch rails (gen.). Length ~3.0 m (est.).
- **ECM pod** (electronic countermeasure), underwing (gen.).
- **Targeting pod** (A-10C has targeting pod), fuselage-mounted (gen.).
- **Flare/chaff dispensers** on the fuselage or tail (gen.).

### 5d. Five-step armament mod ladder (kid-friendly)

1. **Free default: "Gun Only"**. GAU-8 alone, no stores. Always works.
2. **Rung 1: "Rocket Rain"**. Two rocket pods on inboard underwing pylons.
3. **Rung 2: "Bomb Buddy"**. Two Mk-82 bombs (or "Boom Bombs" as a kid-friendly name) on mid pylons.
4. **Rung 3: "Missile Mates"**. Two Mavericks on outboard pylons.
5. **Legendary: "Sky Shield"**. AIM-9 wingtip rails, flares, ECM pod, targeting pod, all loaded. Visually the full stores load.

---

## 6. Engines and propulsion

### 6a. Facts

- **Engine:** 2 × General Electric **TF34-GE-100** (A-10C: TF34-GE-100A) turbofans [src: Wikipedia].
- **Thrust:** **9,065 lbf (40.32 kN) each** [src]. ~18,130 lbf total (derived).
- **Afterburner:** none (gen.). The A-10 is subsonic. Max speed 381 kn (439 mph / 706 km/h) at sea level, clean [src].
- **Service ceiling** 45,000 ft (13,700 m) [src]. Combat range 250 nmi (463 km) [src].
- **Hog whine**: the nickname for the TF34's distinctive whine is commonly used by pilots and fans (gen.), BUT it was NOT confirmed in any fetched source in this research. Don't present it as fact without a source. In-game, describing the "whine" as an audio flavour is fine.

### 6b. Five-step engine mod ladder

1. **Realistic (free default):** TF34-GE-100, 9,065 lbf, standard grey nacelles. Sound: low turbofan whine.
2. **Rung 1: "Turbo Boost"**: same engine, polished nacelle cosmetic. No stat change, just a sparkle.
3. **Rung 2: "Cannon Power"**: nacelle with a glow ring (fantasy). Slightly louder whine.
4. **Rung 3: "Rocket Engines"**: stylised exhaust flame (fantasy), a bigger afterburner-like flame at exhaust (no real afterburner — label as fantasy).
5. **Legendary: "Dragon Turbines"**: fantasy glowing turbine rings, sparks, a dragon-like roar. Pure fantasy, clearly marked in-game as not realistic.

---

## 7. Other cool mods specific to this aircraft

1. **Spinning gun barrels with "BRRRT"**. The seven barrels rotate. Animate the barrel cluster spinning with the firing rate of 3,900 rpm (= 65 rev/s, derived). Only one barrel fires at 9 o'clock, so the visual cycle is 7 barrels per revolution, ~455 barrel-passes/s (derived, est. for visual timing). Show muzzle flashes and smoke.
2. **Shark-teeth or warthog-teeth nose art**: a painted mouth with teeth on the nose. Texture/decal, not geometry.
3. **Decelerons** (split ailerons used as speed brakes): the outboard ailerons split like clamshells, opening downwards. Animate open/close (est. 45–60° per side).
4. **Flare dispensers**: pop-out flares from the rear fuselage or tail. Particle burst.
5. **Kill markings**: small painted icons on the nose or fuselage, one per "kill" (fantasy but mirrors real Desert Storm kill markings, [src] caption).
6. **Gun-drum visible**: an animated see-through panel on the fuselage that shows the drum counting down (fantasy window, est.).
7. **Wing-tip droop lights**: blinking nav lights on the drooped wingtips (gen.).

---

## 8. Sound

For Web Audio synthesis (no sourced recording in this research):

- **Gun "BRRRT"**: 65 shots per second (3,900 rpm) [src]. Model as a short burst of filtered white noise (~20–30 ms per shot, 65 Hz repetition), a sharp impulse on each shot, plus a low-frequency rumble (~50–80 Hz). Muzzle "boom" at the start of each burst. Use a band-pass filter around 800–1,500 Hz for the bark. (est.)
- **Gun reverb**: short reverb tail on the BRRRT (est.).
- **Engine (TF34)**: low turbofan drone around 120–300 Hz plus higher whine at 800–2,000 Hz that rises with throttle (est.). The "hog whine" is commonly described but unverified (see §6).
- **Engine start/idle**: low hum, no afterburner roar (gen.).
- **Wind and speed**: low-frequency rumble increases with speed (est.).

---

## 9. Openly licensed 3D models

Searched Sketchfab (via search and API), Poly Pizza, NASA 3D Resources, Smithsonian 3D, Wikimedia Commons. Findings:

### 9a. Qualified candidate (one)

1. **A-10A Late (War Thunder)** by KojfDiscord
   - URL: https://sketchfab.com/3d-models/a-10a-late-war-thunder-0f18a8b796d84b90a779fd1717233223
   - Licence (verified via Sketchfab API `https://api.sketchfab.com/v3/models/0f18a8b796d84b90a779fd1717233223`): **"CC Attribution"** (`license.label`), full name **"Creative Commons Attribution"**. Requirements: "Author must be credited. Commercial use is allowed."
   - Downloadable: **true** (API `isDownloadable`). Formats: not confirmed in this research (check the download panel for glTF/GLB).
   - Polygons: **302,616 faces, 178,142 vertices** (API). Triangle count not given.
   - Published: 9 May 2026 (search snippet).
   - Quality notes: this is a **War Thunder game model**. Heavy at 300k faces, far too heavy for an iPad web game without decimation. Game-ripped models can carry the rights of the game publisher (Gaijin) even if a user uploaded them under CC-BY. **Do not use without confirming the uploader has the rights.** It is a useful visual reference, not a shipping asset. If used, credit KojfDiscord, and decimate to ~20–40k tris.

### 9b. Commercial options (not free, not CC-licensed)

- **CGTrader**: several A-10 models. A low-poly A-10 at $7.99 under a Royalty Free licence, and one at $14.99 (royalty-free). The $7.99 model offers Blender, OBJ, glTF and FBX. Licence is paid royalty-free, not CC0 [src: search result].
- **CGTrader Studio Max/OBJ**: four resolutions and a cockpit, priced $35 (search result).
- **TurboSquid**: $15–$189. Several are **editorial use only** (cannot be used in a shipped game). [src: search result]
- **3D CAD Browser (model 48816)**: free with an account. Licence NOT shown in the snippet. Could be worth checking, but it's not confirmed CC.
- **3D CAD Browser (model 13068)**: free account or paid. 5,814 polygons [src].

### 9c. Not found

- **Poly Pizza**: no A-10 found in search. Check https://poly.pizza by searching "A-10" directly.
- **NASA 3D Resources**: no A-10 found.
- **Smithsonian 3D (3d.si.edu)**: no A-10 found. A 1:72 diecast replica exists, but it's a physical product, not a digital file.
- **Wikimedia Commons**: search did not return an A-10 three-view. The Commons category URL tried returned 404 (may not exist). Search Commons manually for "A-10 Thunderbolt II three view".

### 9d. Honest summary

**Few or no suitable openly licensed models exist.** The only CC-BY match is a War Thunder rip (too heavy and rights-uncertain). For the game, procedural modelling (as the brief plans) is the right route. Use the three-view references in §10 for dimensions.

---

## 10. Reference sources

### Fetched / verified in this research

- Wikipedia, Fairchild Republic A-10 Thunderbolt II (A-10C spec, crew, first flight, nickname, paint history): https://en.wikipedia.org/wiki/Fairchild_Republic_A-10_Thunderbolt_II
- Migflug, "The GAU-8 Avenger: The Cannon They Built a Plane Around" (barrel 90.5 in, system 19 ft 10.5 in, drum ~20 ft, 1,174 rounds, 3,900 rpm, 18 s): https://migflug.com/afterburner/?p=24255234
- Migflug, GAU-8/A spec table: https://migflug.com/afterburner/wp-content/uploads/sites/4/2026/09/gau-8-avenger-cannon-specifications-armour-penetration.html
- Sketchfab API (licence and polygon data for model above): https://api.sketchfab.com/v3/models/0f18a8b796d84b90a779fd1717233223
- TheAviationist, "A Look at the Engineering and Maintenance of the A-10's GAU-8/A Cannon" (2025): https://theaviationist.com/2025/07/29/engineering-maintenance-a-10s-gau-8-a-cannon/
- TheAviationist, 107th FS centenary markings (2017): https://theaviationist.com/2017/08/07/u-s-air-force-a-10-warthog-gets-rare-non-standard-markings-to-commemorate-the-100th-anniversary-of-the-107th-fighter-squadron/
- Finescale forum, "Correct A-10 color?": https://forum.finescale.com/t/correct-a-10-color/208656
- Finescale forum, "A-10 FS Paint number?": https://forum.finescale.com/t/a-10-fs-paint-number/100293

### Search-result only (cross-check)

- GlobalSecurity A-10 specs: https://www.globalsecurity.org/military/systems/aircraft/a-10-specs.htm
- Northrop Grumman A-10 page: https://northropgrumman.com/what-we-do/air/a10-thunderbolt
- Milavia A-10 specs: https://www.milavia.net/aircraft/a-10/a-10_specs.htm
- SKYbrary A-10: https://skybrary.aero/aircraft/a10
- Wings of Freedom Museum: https://wingsoffreedommuseum.org/wp/aircraft/a-10-thunderbolt/
- Shooting Illustrated A-10 review: https://www.shootingillustrated.com/articles/2019/4/1/review-fairchild-republic-a-10-thunderbolt-ii
- Modelling News, Heritage Hawgs 1:48: https://www.themodellingnews.com/2021/07/preview-148th-scale-heritage-hawgs-from.html
- USAF Air National Guard, A-10 tag: https://www.ang.af.mil/News/Tag/1905/a-10-thunderbolt-ii/

### Three-view drawings (to check manually)

- Not found as a free, licence-checked three-view in this research. Check:
  - USAF fact sheet and official three-view PDF from af.mil (search "A-10 fact sheet").
  - Jane's / Osprey reference books (paid).
  - Vector three-views from the-blueprints.com (licence not shown in snippets): https://the-blueprints.com/blueprints/modernplanes/republic/42306/view/republic_a-10a_thunderbolt_ii
  - Aerospaceweb A-10 data and image gallery: https://aerospaceweb.org/aircraft/attack/a10/

### What was NOT verified (action items before coding)

1. Root/tip chord, dihedral, wingtip droop angle: get a three-view and measure.
2. Fuselage station widths/heights (§2b): take from a three-view.
3. Canopy and bathtub dimensions (§2c, 2d): take from a three-view.
4. TF34 pod dimensions and pylon (§2g): take from a three-view.
5. Hardpoint station map (§5b): USAF T.O. 1A-10 or a load diagram.
6. "Hog whine" and "Flying Gun": confirm or drop.
7. Idaho ANG, shark-teeth nose art, A-10 Demo Team, retirement schemes: confirm before naming.
8. All hex colours (§4c): tune against a reference photo.
