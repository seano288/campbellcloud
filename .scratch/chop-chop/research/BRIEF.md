# Helicopter research brief (shared by every research agent)

We are building a kids' learning game ("Chop Chop": fractions, rewarded by building a helicopter in a 3D hangar) for a
6-year-old who can't read yet, so every fact will be spoken aloud. Each helicopter is built **in code** from a data spec
in metres (lofted fuselage cross-sections, rotors, stub wings, skids or wheels, hardpoints), so we need real
dimensions and shapes, not 3D model downloads. A sibling game did the same for planes; one example note is
`.scratch/airplane-clock/research/jets/v22-osprey.md` (skim it for the level of detail and the tagging style).

Use WebSearch and WebFetch. Prefer Wikipedia, manufacturer pages, military fact sheets, and museum pages.
Tag every number or fact: **[src]** (from a fetched/search source, cite it in section 10), **(derived)** (arithmetic
on sourced numbers), **(est.)** (your estimate, e.g. read off a photo or three-view). Never invent: if you can't
find it, say so in "Known gaps". Units: metres. Today is 2026-10-23.

Write ONE markdown file at the path you are given, with these sections:

1. **Identity**: full name, nicknames, maker, first flight, in service, role, crew (tandem or side-by-side seats).
   **Kid-friendly voice lines**: 8 lines, each TRUE and under 12 words, written to be spoken to a 6-year-old
   ("Its rotor is as wide as three school buses!"). Exciting, but no gore or "kill/destroy" language. Note the source
   for each. For fictional aircraft, frame fiction as fiction ("In the TV show, Airwolf could...") and include true
   lines about the real helicopter it was built from.
2. **Geometry for procedural modelling**:
   - Overall: length (fuselage, and with rotors turning), height (to top of rotor hub), fuselage width, stub-wing span.
   - **Main rotor(s)**: how many (single, tandem, coaxial, side-by-side), diameter, blade count, blade chord, which
     way it turns seen from above, hub/mast height above ground, hub position along the fuselage (x from nose).
   - **Anti-torque**: tail rotor (which side, diameter, blades, height, x), or fenestron (fan in the fin), NOTAR, none
     (tandem/coaxial), and any **pusher propeller** (diameter, blades, x).
   - Fuselage: cross-section width/height at ~8 stations nose to tail (x from nose, width, height, z of centre above
     ground), tail boom length/diameter, engine housings (count, position, exhaust direction), cockpit canopy shape.
   - Top-view half outline and side-view outline as (x, y) points, est. from three-views if needed.
   - Tail surfaces: vertical fin, horizontal stabiliser (span, chord, position), endplates.
   - Stub wings: span, chord, hardpoints per side, wingtip stations.
   - Landing gear: skids (length, track, height) or wheels (tailwheel/tricycle; positions, wheel size; retractable?).
3. **Distinctive features checklist**, most recognisable first (what MUST be right for a kid to recognise it).
4. **Paint & liveries**: 4–6 real schemes (service, demo, special, famous), each with hex colours (est. is fine,
   say so) and where the colours go. Then a suggested mod ladder: free default, three upgrades, one Legendary.
5. **Armament & stores**: gun (turret? where?), rockets, missiles, door guns, hoists, cargo hooks; hardpoint
   positions; a 4-step kid-friendly weapons/stores mod ladder.
6. **Engines**: count, type, power, exhaust positions; top speed; a fact about speed or lifting.
7. **Other cool mods** specific to this helicopter (searchlight, rotor-tip lights, winch, sling load, IR suppressors...).
8. **Sound**: what it sounds like (blade slap, whine) in words a sound designer could synthesise.
9. **Fraction-friendly facts**: countable things a fractions game could ask about (blades per rotor, number of
   rotors, wheels, doors, crew seats, hardpoints, engines), e.g. "4 blades, so each blade is one quarter of the rotor".
10. **Reference sources**: URLs used, plus three-view drawings found, plus **Known gaps**.

Rules: write only your one file; do not edit anything else, do not run git. Keep it under ~400 lines. Finish with a
3-line summary in your final reply (file path, biggest gaps).
