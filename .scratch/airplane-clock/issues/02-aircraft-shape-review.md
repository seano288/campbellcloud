# Check each Aircraft against a three-view and tune its spec

Status: ready-for-agent

Each spec in `src/time-flies/hangar/jets/` uses published length, span and height, but many station widths, chords and
positions are estimates (marked in the research notes). Compare each against a public-domain three-view and adjust the data.
Use the preview: `npx vite --config tools/jet-preview/vite.config.ts`, then
`npx tsx tools/jet-preview/shot.ts out.png "jet=f14&view=paint"`.

Known simplifications worth a pass: canopy frames and bows, pitot tubes, the F-22/F-35 weapons bay doors, the F-4's
leading-edge dogtooth, P-38 turbochargers, V-22 blade twist and wing stow, landing-gear doors.
