---
target: Sentence Express icon and UI
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/seancampbell/.t3/worktrees/campbellcloud/t3-7556098f-357adac151845d00/src/sentence-express"
timestamp: 2026-11-16T21-51-42Z
slug: src-sentence-express
---
⚠️ DEGRADED: single-context (the brief forbids subagents: "Do the work yourself; don't start subagents")

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Stars, Bolt pile and Goal chip are clear; in the Shed an owned tile and a shop tile look almost the same (#2a5a8a vs #1f3d5a) |
| 2 | Match System / Real World | 3 | The sentence-as-train metaphor is strong in questions; Home's Play tile is a green disc on flat strips with no railway in it |
| 3 | User Control and Freedom | 3 | Two-tap Home in a Round, ✕ to put a tried item back |
| 4 | Consistency and Standards | 3 | Group chips are a different shape and colour from the tabs above them; Home tiles each use a different language |
| 5 | Error Prevention | 3 | Taps wait for the voice; buy needs Bolts |
| 6 | Recognition Rather Than Recall | 2 | 305 items behind emoji-only tabs and chips with no names; owned items not recognisable as his |
| 7 | Flexibility and Efficiency | 3 | Goal chip jumps straight to the thing he is saving for |
| 8 | Aesthetic and Minimalist Design | 2 | Sentence trains fill about an eighth of the card on an iPad; the Shed bay is mostly empty sky; the icon is half empty sky |
| 9 | Error Recovery | 4 | A miss is taught on the train itself, never a red X |
| 10 | Help and Documentation | 3 | 🔎 help and 🔊 replay on every question |
| **Total** | | **29/40** | Good |

## Design Specificity Verdict
LLM assessment: the question screens are authored for this product (word cars, an engine that carries the capital, a caboose that carries the end mark) and the Layout and Delivery canvases are rich and particular. The surrounding chrome is weaker: Home's Play tile, the Shed tray and the icon could belong to any toy game. The wooden-toy world shows up in the pieces but not in the places around them (no wooden track under the trains, no shed in the Shed, no signal on Play).
Deterministic scan: 175 findings, all advisory except two warnings. 172 are "outside DESIGN.md" colour, radius and font-size advisories, false positives because DESIGN.md documents Time Flies only. The `side-tab` warning (sentence-express.css:45) is the divider between Level-bar segments, not a card stripe (false positive). The `codex-grid-background` (line 175) is the "checks" paint swatch, which is a picture of a checked paint (false positive). The emoji font warning (line 20) is the emoji stack the family uses everywhere.
Visual overlays: not injected (browser evidence came from the tour's Playwright screenshots at 810×1080, 1080×810, 390×844, 844×390).

## Overall Impression
The core learning picture is right and charming. The single biggest opportunity is scale and place: the trains he reads are too small on the iPad, and the screens around them do not yet feel like a wooden train set.

## What's Working
- The sentence-as-train: engine = capital word, caboose = mark, drawn from his own engine and paint, so the lesson and the reward are the same toy.
- Teaching on the train (lit cars, the demo train) instead of a red X.
- The Layout and the Delivery: a real table with track, working scenery, night and weather.

## Priority Issues
- [P1] The icon is a scene, not an object. The train sits small in the lower left; half the square is flat blue sky. Beside the sibling icons (one big hero on a sunburst) it is the weakest, and at Home Screen size the S and the full stop vanish. Fix: an engine-first close-up, the S engine big, one word car and the full-stop caboose behind it on wooden track, a sunburst sky and big steam. Command: bolder.
- [P1] Question trains are too small on the iPad. --ph tops out at 104px, so a 4-word train is about 690×100 on a 1000×700 card. Fix: size each train to fit the card width in one row, up to about 150px tall, with the old sizes as the phone floor. Command: layout.
- [P1] Home's Play tile has no railway in it: a green disc over flat sky/wood bands. Fix: Play is the green lamp of a big railway signal beside wooden toy track; the Shed tile becomes an engine shed with his train coming out of the door. Command: bolder.
- [P2] Shed browsing across 305 items: owned and shop tiles look the same; tabs and group chips are emoji only, with no names and two different looks; the bay is mostly empty sky and takes 30% of an upright phone. Fix: owned tiles become wooden "his" cards, shop tiles stay navy; tabs carry a short Bungee label; group chips sit in a tray-coloured strip with the open group's name; the bay is sized to the train in portrait and its floor is wooden track. Command: clarify + layout.
- [P2] My Levels board: hairline rows, thin red ❗/❓ glyphs, small bars, a stretched cream panel. Fix: each kind's icon in a round token, bigger amber bars, rows that size to content. Command: polish.

## Persona Red Flags
- The first grader (alone, leans on voice): in the Shed he cannot tell which engines are already his without tapping each; in the Sky tab "Sunny Day" (his) and "Fluffy Clouds" (6 Bolts) differ only by a missing price.
- The first grader on an iPad on its side: a 4-word sentence is a small strip in the middle of a big empty card; the hero of the question reads as a footnote.
- A parent glancing at the Home Screen: the icon reads as "a train game" but not which one, and at 60px the capital S and full stop disappear.

## Minor Observations
- End of a Round: the Shed button shows a train about 60px wide in a cream box.
- When every yard car is coupled, the empty yard leaves a hollow beige box.
- His train in the Shed, on Home and on Start runs on a single black line, not toy track.

## Questions to Consider
- What if every train on every screen ran on the same wooden track?
- What if the Shed tray felt like a toy box where his things are wood and the shop's are in boxes?
