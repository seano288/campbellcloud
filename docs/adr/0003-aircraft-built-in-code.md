# Time Flies' aircraft are built in code from data specs

The 14 aircraft are not downloaded models. Each is a data spec in metres from published dimensions
(`src/time-flies/hangar/jets/*.ts`): fuselage cross-sections (superellipses, so chines, flat bellies and box intakes are
all one shape), airfoil wing and tail stations, nozzles, propellers, landing gear, hardpoints and pivots. One shared builder
(`hangar/three/jet.ts`) lofts them, and liveries are painted with Canvas 2D in aircraft coordinates and projected from
above, below and each side (`livery.ts`, `materials.ts`), so every Mod works the same way on every aircraft.

Research: `.scratch/airplane-clock/research/` (rendering-modeling.md compares the options).

## Considered Options

- **Third-party glTF models**: few openly licensed fighter models exist, and they come in 14 scales, node layouts, UV
  layouts and qualities, with no hardpoints or moving parts and several megabytes each.
- **OpenVSP exports**: a good reference for shapes, but community models carry no clear licence and export no UVs.
- **Built in code (chosen)**: nothing to license or download, consistent across all 14, easy for agents to edit as data,
  and moving parts (F-14 wings, V-22 nacelles) are just pivots.

## Consequences

- Realism comes from proportions, materials and lighting, not modelled detail: a CC0 hangar HDRI lights and surrounds the
  aircraft, paint is clear-coated physical material with panel lines and weathering, and normals stay crisp at chines and
  edges. Fine details (rivets, antennas, gear doors) are simplified.
- Many station values are estimates from three-views; each spec names its research note, and tuning a shape is a data edit.
- Chop Chop's 17 helicopters are built the same way (`src/chop-chop/hangar/helis/*.ts`, builder `hangar/three/heli.ts`):
  they reuse the lofting, livery, materials, stores and weapons here and add rotors (main, tail, canted, scissored,
  ducted, coaxial, tandem and pusher), skids and a chin gun. Research: `.scratch/chop-chop/research/helis/`.
