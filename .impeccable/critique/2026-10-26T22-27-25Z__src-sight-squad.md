---
target: Sight Squad landing tile and full app
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/Users/seancampbell/.t3/worktrees/campbellcloud/t3-55fc3bde/src/sight-squad"
timestamp: 2026-10-26T22-27-25Z
slug: src-sight-squad
---
# Critique: Sight Squad (landing tile + full app)

## Design Health Score: 28/40 (Good)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | Stars, Bolts, goal bar, spoken glow all present; Bolt "load" lingers after landing on the pile |
| 2 | Match real world | 3 | Toy army world is spot on in Camp; absent from the Round |
| 3 | User control | 3 | 🏠 leaves a Round instantly, no confirm (RoundView.tsx:31) |
| 4 | Consistency | 2 | Yellow .lit glows on the wrong pick and the right answer; ▶ is white on #2bb673 (breaks Readable Green Rule); 🔎/🪖 overloaded |
| 5 | Error prevention | 3 | Wrong choices disabled; unaffordables wiggle |
| 6 | Recognition | 3 | All voiced, but 8 icon-only Camp tabs |
| 7 | Flexibility | 2 | 🔊 again and 🔎 help only; no grown-up view of struggling words |
| 8 | Aesthetic/minimalist | 2 | Empty white void in the Round; busy Camp HUD; tiny My Levels |
| 9 | Error recovery | 4 | Escalating teach: try again → say it, spell it, say it, heart part |
| 10 | Help | 3 | 🔎 teaches fully; no guided first Camp visit |

## Design specificity
Split. Camp/Parade/Battle are authored (plastic army, wind-up robots, "go" starts the Battle). The Round, ~80% of play time, is the generic shared white .card with paper word buttons. Home sits between.
Detector: 54 findings in src/sight-squad, almost all design-system-color/font drift because DESIGN.md is Time Flies-only (false positives for per-game identity). Real: iPhone Home "My Levels" labels at 7.44px/9.92px; Goal chip 38px wide; ▶ white on #2bb673 at 2.6:1; Home h1 khaki on olive (2.1:1 before the offset shadow).

## Priority issues
- [P1] Yellow glow marks the wrong pick and the right answer (views.tsx:105, teach.ts:78). Fix: the miss gets the orange "being read" ring (Signal Colour Rule) or no glow; yellow only for the answer.
- [P1] The Round has no army world. Fix: khaki field-map card, a soldier who reacts to right answers, a figure marching the star track.
- [P1] My Levels is unreadable on iPhone (.kn 12px×u → 7.44px; sight-squad.css:35). Fix: max(14px,…) floors, or show fewer kinds with bigger icons.
- [P1] Parade hides the army: column marches off-frame in portrait; 9 orders cover the army on a sideways phone. Fix: camera follows the column; orders in a side rail / max 4–5.
- [P2] Home hierarchy: Camp tile ~2× Play; army wraps into the sky; ▶ on #2bb673; fresh save shows "go" before met. Fix: Play the biggest, Play Green #178046, one ground row of soldiers.
- [P2] Teach panel overlaps the prompt; scrim greys every card so all look "wrong".
- [P3] Landing tile: thin mid-green soldiers on olive rays blur at phone size; "go" sign reads instantly. Fix: fewer, chunkier soldiers on a lighter khaki ground (icon.ts:23-29).

## Persona red flags
- Early reader: "6/24", "+2", costs are numerals he can't parse; empty trophy shelf of ~25 grey silhouettes reads as "you have nothing".
- Jordan: Camp opens with 8 unlabeled tabs and 6 yellow dots.
- Casey: 🏠 top-left leaves a Round instantly; Camp tab strip covers soldiers on a sideways phone.
- Sam: Read It choices labelled "Choice 1/2/3"; locked trophies #ffffff70 on brown.

## Minor
Colour/color spelling drift; uneven trophy planks; Battle win has only ✕; march-in ends off-centre (.marchby.go left:30%); thin day one (one word met after Round 1).

## Questions
- If the Round is where reading happens, why do the soldiers only appear after it?
- Should the Camp show only what he can do now (one glowing tab)?
- Could Bolts be ammo crates or dog tags so the currency belongs to the army world?
