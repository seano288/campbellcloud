# Ticket 02 iPad baseline comparison

Prepared for [ticket 02](issues/02-ipad-baseline.md), not performed or accepted by an agent. Compare the later candidate using the same cases and retain this record for ticket 18. The [automated baseline](baseline.md) identifies the build, fixtures, checks and known limitations.

## Record before testing

| Field | Human record |
| --- | --- |
| Tester, requesting human or explicitly named delegate | Not recorded |
| Date and local timezone | Not recorded |
| Baseline source commit | `4b392c9f274a95d420424c43f3a571f5240dcb18` |
| Baseline build artifact identity | Match the fingerprints in `baseline.md`; record any difference |
| Candidate commit/build for later comparison | Not yet available |
| iPad model | Not recorded |
| iPadOS and Safari versions | Not recorded |
| Isolated HTTPS test origin | Not recorded |
| Safari test profile and Home Screen installation name | Not recorded |
| Evidence location, screenshots/video and saved synthetic JSON | Not recorded |
| Update test's old/new build identities and staging times | Not recorded |

Use a test origin that has never held real player progress. A different URL path on the production origin is not isolation: localStorage is shared across paths. Do not use the child's production app, reset its storage, import its save or replace its installation. Use a separate test profile where supported and a clearly named Home Screen test installation. Seeding must happen on the recorded test origin only.

## Prepare synthetic scenarios

From a checkout with the baseline test tooling, use pinned Node and build the app as described in `baseline.md`. The test tooling does not change production assets. A human supplies an isolated HTTPS deployment for the device; no deployment is performed by issue 01.

The exporter writes synthetic JSON to stdout and never connects to a browser:

```sh
npm run --silent baseline:save -- v4-null-body
npm run --silent baseline:save -- v4-mod
npm run --silent baseline:save -- v4-mod --expected
npm run --silent baseline:save -- milestones
npm run --silent baseline:save -- star
npm run --silent baseline:save -- garage
npm run --silent baseline:save -- checkout-2
npm run --silent baseline:save -- checkout-3
```

Use a genuinely fresh isolated context for setup, or the `v4-null-body` fixture. Use `v4-mod` for progressed state. It has 46 Bolts, Jeep selected, owned Legendaries and Colours, unique per-Body fits/numbers, a pending Count introduction, fresh Pay tile, recorded Trophy dates and counters. `v4-body`, `v4-colour` and `v4-auto` select the other Goal cases without changing that progress.

`milestones` puts Learn one clean answer before Level 2 and Count unlock, with the next completed Round also reaching 10 Rounds and five days. `star` puts Learn at Level 3 one clean answer before its star. `garage` supplies 50 Bolts, a selected Giant Tires Goal, Rainbow Chrome, Outlined numbers and Pickup number 42. `checkout-2` and `checkout-3` supply the top Tires/Horn prerequisite and the respective payment context. These are synthetic starting states, not claims about historical play.

For rare day milestones, record the device's actual day. Do not change the iPad clock or expect old earned dates to be replaced by the test date. Automated tests supply `2026-10-14` explicitly; device observations use the device calendar.

If seeding through Safari's remote Web Inspector, first confirm both the displayed origin and the target Safari/Home Screen context. In that isolated test context only, set `mtm2-save` to the exported JSON string and relaunch before beginning the case. Record the fixture ID. Do not inspect or copy a pre-existing save. Do not seed again during a relaunch check, since that would hide persistence failures. Safari and Home Screen storage may differ; record where each fixture was seeded rather than assuming they share it.

## Comparison cases

Run each applicable case in Safari and the Home Screen installation, in both portrait and landscape. For every case record the starting fixture, public taps, visible/spoken result, resulting synthetic save, evidence pointer and any discrepancy. "Not performed" is not a pass. Baseline defects belong in the discrepancy record, not new regression requirements.

| Case | Actions and observable comparison | Baseline observation/evidence | Candidate observation/evidence |
| --- | --- | --- | --- |
| Audio unlock and first launch | Launch fresh, tap Start, preview all starter Bodies, confirm one. Verify speech starts after the tap, preview does not commit and relaunch skips confirmed setup. | Not performed | Not performed |
| Both orientations | Repeat Home, setup, each Game Mode, peeks, Garage sheets, number wheels, checkout, Shelf and end overlay. Check readable text, reachable touch targets, no required page scrolling or clipped controls. Garage's internal Body strip may scroll. | Not performed | Not performed |
| Learn prompts and feedback | Play names, values, find and comparison tasks. Replay a prompt. Choose wrong answers, observe disabled/rejected choices and teaching on the second miss, retry and recognise a later replay with fresh choices. | Not performed | Not performed |
| Count prompts and help | Count coins/bills, miss, use Help me count, Start again and the money peek. Listen to running totals and watch highlighting. Solve with and without help. | Not performed | Not performed |
| Pay prompts and help | Submit an empty tray, short/over payment, remove money, peek and use Help me pay. Observe teaching, counting and exact payment. Help fills but does not submit. | Not performed | Not performed |
| Introductions and unlocks | Use progressed/milestone scenarios. Leave an introduction before Play and reopen it; acknowledge it, then relaunch. Check new money, Level dots, fresh mode pulse/speech and unlock chain. | Not performed | Not performed |
| Captured-Level practice | Trigger a Level increase during a Round. Remaining questions still use its starting Level; the next Round shows new-money introduction. | Not performed | Not performed |
| Star and earnings | Use `star`; check Level-3 star. Compare five clean answers earning six Bolts, two clean plus three helped earning three, all helped earning one. Verify balance and display after relaunch. | Not performed | Not performed |
| Leaving unfinished play | Solve some tasks, use help or miss, then leave. Check retained solved progress and immediate streak reset, no unfinished result and no Round credit. Also leave during the final delay and record what happens. | Not performed | Not performed |
| Bolt purchases | Use `garage`: buy Giant Tires for 15, Teal for 3 and a Body for 30. Check ownership, fit/Colour/switch, final balance, selected Goal clearing and purchase jump/speech. | Not performed | Not performed |
| Free actions and Body memory | Fit/remove owned Mods, switch owned Bodies and Colours, change both number wheels including 0/99. Switch away/back and relaunch; compare distinct fits, numbers and Colours. Verify Colour selection reveals itself under Plain when necessary and costs nothing when owned. | Not performed | Not performed |
| Goal cues | Select unaffordable Mod, Body and Colour Goals. Tap the Goal for speech. Compare automatic Goal, progress/readiness, newly-affordable announcement versus an already-affordable Garage pulse. Use synthetic all-owned state if needed for Legendary-price and finished fallbacks; record its JSON. | Not performed | Not performed |
| Legendary checkout | Check waiting-on-top-Rung cue. With `checkout-2`, Tires cost $1.10: empty, $1.00 short and $1.20 over, then second-miss help. With `checkout-3`, Horn costs $8.80 and help uses a $5 bill. Help does not buy until Pay. Compare final ownership/fit and unchanged Bolts, learning and Trophies. | Not performed | Not performed |
| Checkout lifetime | Close/reopen after settled input and during help/explanation. Reopening starts empty. Record old audio/effect leakage as a baseline limitation; the candidate must meet the approved cancellation contract. | Not performed | Not performed |
| Trophy Shelf | Open all three planks, tap earned and unearned items, compare names/hints, shine/silhouettes, recorded dates/counters and counting-Trophy pips/upgrades in the same shelf position. | Not performed | Not performed |
| Truck art and Show Off | Compare owned/fitted parts, paint/Colour, numbers, rotation, hotspot placement, exhaust, engine and horn. Enter Show Off, spin/tap the Truck and return. Attempt photo saving from the installed app and record availability/result. The baseline has no explicit photo-save control; do not report it as implemented without evidence. | Not performed | Not performed |
| Combined celebration | Use `milestones`. Record video with audio: Bolts first, Level/open moments in order, then stars when applicable, every Trophy and newly-affordable cue. Compare animation pacing and spoken lines; navigation stays gated until normal moments end and then works. | Not performed | Not performed |
| Speech and interruptions | Replay prompts, tap money/Trophies/numbers and interrupt/append speech. Compare intelligibility, amount assembly, highlighting and old audio/effects after navigation. Record baseline leakage without declaring it required behaviour. | Not performed | Not performed |
| Relaunch persistence | After practice and purchases, capture synthetic state, close/relaunch Safari and Home Screen app without reseeding and compare all supported fields. An interrupted Round/checkout does not resume as saved work. | Not performed | Not performed |
| Installed offline relaunch | Warm the test installation online, wait for precache, close it, disable network and relaunch. Play a Round, use help, buy with Bolts, complete Legendary checkout and relaunch again. Listen to actual recorded clips; a cached-file fetch is not playback evidence. | Not performed | Not performed |
| Update timing | On the isolated test origin, identify old/new test builds. While a Round is active, have the human stage the identified update and record when the worker takes over. Confirm no active-game reload/lost interaction, then close/relaunch and identify the updated build. Do not update production for this check. | Not performed | Not performed |
| Completion/failure navigation | Confirm Home, Garage and Play again work after a normal show. Record any naturally observed failure/trapped navigation. Do not claim future failure cleanup from successful baseline play. | Not performed | Not performed |

## Discrepancy record

For each discrepancy append: case, fixture, build, orientation, Safari/installed context, steps, expected/observed effect, synthetic saved state and evidence pointer. Label it preserved behaviour, current limitation with approved future improvement or an unresolved discrepancy. Keep timing/audio observations separate from headless assertions.

No discrepancies have been recorded by a human yet.

## Human completion gate

- [ ] The requesting human or named delegate completed all required baseline observations before extraction.
- [ ] Every required case has observations or an explicitly recorded baseline limitation, not an assumed pass.
- [ ] Synthetic state and evidence are retained for ticket 18.
- [ ] Tester and requesting human explicitly confirm baseline capture is complete, with date and name below.

Confirmation: **Not provided.** Ticket 02 remains incomplete. This document grants no extraction acceptance, production deployment or release approval.

On 2026-10-14, the requesting human deferred these checks: "skip the manual check ... we'll do it later". No device observations or sign-off were supplied in this session. All unperformed cases and completion gates remain open. Capture this baseline before extraction begins; this deferral does not waive that gate.
