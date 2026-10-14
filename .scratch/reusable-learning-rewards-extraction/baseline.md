# Automated baseline for extraction

Captured on 2026-10-14 for [issue 01](issues/01-automated-baseline.md). The production baseline is commit `4b392c9f274a95d420424c43f3a571f5240dcb18`, on `main`. This ticket adds test-only fixtures, browser journeys and this handoff, not an extraction or a production replacement. The untracked `.claude/` directory was already present and is not part of the work.

The authoritative design is the [eight resolved decisions](../reusable-learning-rewards/map.md), especially [save compatibility](../reusable-learning-rewards/issues/06-save-compatibility.md#answer) and [evidence and handoff](../reusable-learning-rewards/issues/08-extraction-evidence-handoff.md#answer). The prototype is not used by these checks.

## Build identity and reproduction

Use `.nvmrc`, Node `22.23.2` and npm `10.9.8`. The initial shell had Node `20.9.0`; no verification result below uses that version. The dependency lock is unchanged. This capture used existing installed dependencies; `npm ls --depth=0` matched the lock's direct dependency versions. Three pre-existing extraneous packages were reported: `@emnapi/runtime`, `@img/sharp-wasm32` and `tslib`. They were not removed or added to the lock. For a new checkout, run `npm ci` before the commands below and install Chromium with `npx playwright install chromium`. CI uses `npx playwright install --with-deps chromium` on Linux.

```sh
source "$HOME/.nvm/nvm.sh"
nvm use
npm run typecheck
npm test -- src/save/baseline.test.ts
npm run build
npm run check:offline
npm run check:baseline
```

Run the full root `npm test` once at the end of each implementation slice. A focused browser run accepts a name substring, for example `npm run check:baseline -- 'Legendary Level 2'`. Browser checks require a built `dist/`, not the dev server. The scripts start and close their own preview servers on ports 4317 and 4318. They do not accept a remote or production URL and never attach to an existing browser profile.

Build fingerprints, SHA-256:

| File | Hash |
| --- | --- |
| `package-lock.json` | `9a5c9eb61776d5964b3a6e6ace50f530242decd79e81b18a4182c8c2775a7551` |
| `dist/index.html` | `135316d471f96fb31f0efe3f07602e13272c417fbb2127bec805e87d60383dde` |
| `dist/assets/index-ChiRqV3Z.js` | `5fbcc562347b83a3deb5bcf3f47d15518b1dc64f05b32d4804f23112c9aa1486` |
| `dist/assets/index-28XE20Go.css` | `e94eb11c7cb5b63a706d330459fbce963c9b4512ce271689ae2bf13817807a4c` |
| `dist/sw.js` | `058b23bc86398a83e7e0de432ce5e80ffe0643e5aa1f327f722a2c04f81d539f` |

The production build reports 84 transformed modules and 629 precached entries, 8546.48 KiB. Fingerprints identify this captured build, not a promise of byte-identical output across future toolchains. Later extraction candidates should preserve behaviour, not these JavaScript hashes.

## Verification record

| Check | Result | What it does not establish |
| --- | --- | --- |
| Typechecking | Passed with pinned Node, repeated during work. | Runtime behaviour, permitted dependency directions and scratch prototype types are not checked. New baseline tools are under `tools/`, so the existing root TypeScript include covers them. |
| Existing production regressions | Passed: all 445 existing tests across 13 unchanged files. The full root suite ran once at the end and passed 475 tests across 14 files, including the 30 new save-baseline tests. | These mostly pure tests do not establish browser composition, scoped cancellation, coordinated commits or reuse. |
| Independent save baseline | 30 tests passed in `src/save/baseline.test.ts`. | No future module encoder, two-app composition or asynchronous write ordering is proved. |
| Production build | Passed before implementation and again after the test-only changes. The captured HTML, JS, CSS and service-worker hashes are identical. | Missing selected-build voice assets, alternate builds, audible playback and iPad behaviour are not proved. The existing Vite config-loader warning about extensionless imports remains. |
| Existing offline smoke check | All five checks passed. | Its voice assertion fetches a cached MP3; despite the log saying it plays, it does not play it. No Round, purchase or installed iPad relaunch is exercised. |
| Baseline browser journeys | All 13 journeys passed against the rebuilt production output, with no page errors. Focused Garage and Legendary runs also passed. CI now runs this command after the existing offline smoke check. | Chromium `153.0.8010.12` uses a 1024×768 viewport, service workers blocked while online, real production views and unmodified audio. It does not prove offline journeys, iPad touch/audio quality, photo saving, update timing or future failure/cancellation contracts. |

## Save expectations

[`tools/baseline/saves.ts`](../../tools/baseline/saves.ts) specifies raw inputs and complete expected player states independently of `migrate`, `freshSave`, the catalogue's runtime helpers and the prototype. Only production types are imported. Expected state is hand-written; no encoder or decoder generates it. Shared literal defaults describe the independently specified fresh state.

All historical backfill uses supplied day `2026-10-14`. Storage tests fix the clock to local noon on that supplied day. Browser contexts use `2026-10-14T12:00:00.000Z` and UTC, so earned dates do not depend on the host calendar. Old earned dates remain their supplied values, including on reload.

| Case | Independently specified expectation |
| --- | --- |
| `v1` | 40 Bolts, Dragster, owned/fitted `tires:3`; three starters, default new fits, Red and Door Number 1. |
| `v2` | Jeep and its Tires/Paint, 140 Bolts, Fire Truck Goal, Learn Level 3/star and Count Level 2. Backfill only proved learning Trophies on the supplied day; preserve the older `learn:2` date. Completion/streak/day counters stay zero. |
| `v3` | 9 Bolts, Fire Fade, Door Number 8 and existing Trophy dates/counters. Supply Red and no bought Colours. Do not backfill a missing Level Trophy again. |
| `v4-mod`, `v4-body`, `v4-colour`, `v4-auto` | Same fully specified progressed player, with locked Mod/Body/Colour Goals or automatic sentinel `null`. 46 Bolts, selected Pay practice, bought Jeep/Race Car, owned Legendaries, distinct fits/Colours/Door Numbers on all twelve Bodies, nontrivial windows/flags, pending Count introduction, fresh Pay tile, Trophy dates and all counters. |
| `v4-null-body` | Separate first-launch setup case. Null Body, three starters, no progress, no purchases, zero balance. |
| `recoverable` | Keep unrelated learning/ownership/Trophies; remove duplicate/unknown items, reject unowned fitted Mods/Colours, default invalid Door Number and counters, select Pickup for an unowned Body, filter/truncate the learning window to ten valid outcomes and clear the Legendary Goal. |
| `owned-goal`, `unknown-goal` | Keep the progressed state but clear the invalid selection to `null`. |
| `newer` | Read 7 Bolts from version 99 without rewriting on load. A later save writes version 4 and drops `futureField`. This is best-effort reading, not a lossless downgrade. |
| `unsafe-balance-future` | Separate fixture with balance `9007199254740992` and approved future expectation zero, all other progressed fields retained. It is intentionally excluded from passing baseline cases. Ticket 05 owns the failing recovery test and fix; there is no regression asserting that unsafe balances must survive. |

Each passing case exercises pure migration, input non-mutation, storage load without writing, complete saved JSON and reload. Comparisons use decoded objects, not JSON key order. Fake storage also covers missing/malformed JSON, non-save JSON and blocked reads without rewriting. Only `mtm2-save` is read or written; sentinel old-game and unrelated-app values remain untouched. That is evidence for today's key selection, not proof of the future two-composition isolation contract.

Export a raw synthetic fixture with `npm run --silent baseline:save -- v4-mod`. Add `--expected` for its independently specified expected state. Export never accesses browser storage. The [iPad checklist](ipad-baseline-checklist.md) explains safe seeding and records the human evidence still needed.

## Observable journeys

The human approved these additional baseline seams in this implementation session: migration/load/save with fake storage, and browser actions/rendered effects/saved snapshots in isolated Playwright contexts. Future seams remain those approved in the design decisions.

[`tools/baseline/browser.ts`](../../tools/baseline/browser.ts) launches a fresh non-persistent context per journey. It seeds synthetic JSON once per context, so reloads exercise the actual saved snapshot rather than silently reseeding. Randomness is deterministic. The solver reads rendered money captions and answer labels and performs independent cents arithmetic; it does not call production answer checkers or inspect Round queues, guards, miss counters or app signals.

The journeys cover:

- First-launch Body preview without saving, confirmation, locked mode and relaunch.
- Learn's captured starting-Level money, Level increase, Count unlock, six Bolts, combined milestones, earned dates/counters, Bolt-first celebration order, newly-affordable cue, gated navigation, Play again, pending introduction and rendered Trophy Shelf.
- Count and Pay introductions, leaving without acknowledgement, fresh-tile clearing, five clean answers, progression, unlocks, six-Bolt credit and saved-state relaunch.
- Learn wrong-answer feedback, automatic teaching on the second miss, retry, a replay after an intervening solved task, fresh replay choices and five-answer completion without extending the Round.
- Count prompt replay, money peek, manual counting help/reset, immediate streak reset and two clean plus three helped results earning three Bolts.
- Leaving Count after two solved tasks and an unsolved miss, retaining solved progress and the streak reset without Round credit.
- Pay's empty-tray prompt, help without automatic payment, five helped results earning one Bolt and explicit submission.
- Level-3 star and its position before Trophy celebration.
- Garage Mod/Colour/Body purchases, free fits/switches/Colours/numbers, per-Body memory, Colour's Plain-Paint fallback, selected Goal kinds and reload.
- Legendary short/over/exact payment, second-miss/manual help, settled close/reopen with an empty tray, Level-3 $5 bill, ownership/fitting and unchanged learning, currency and Trophy state.
- Full progressed-save relaunch.

## Preserved behaviour versus future improvements

Passing baseline checks protect normal successful behaviour. They must not require retaining these current implementation limitations:

| Current limitation | Approved owner of the improvement |
| --- | --- |
| `game/store.update` publishes and saves each call. Mod/Colour purchases and Legendary unlock/fitting call it separately, exposing intermediate snapshots. | Tickets 05 through 08, whole-aggregate mapping and coherent action commits. Baseline purchase tests assert the final result, not an intermediate-write count. |
| Round timers use a global token, while speech and continuations are not view-scoped. An old continuation can schedule work using a later token. Checkout uses a stub Round API and does not own a full cancellation scope. | Tickets 09 through 12 and 14, scoped playback, Round/checkout lifetime and show cleanup. Baseline tests do not assert that stale work must leak. |
| There is no app-owned terminal-result guard establishing the agreed once-per-Round completion contract. The present UI's normal success lock is not that guarantee. | Ticket 07 and the replacement controller tickets. Ordinary completion is covered; duplicate terminal notifications need later red-green tests. |
| Saved balance validation uses `Number.isInteger`, not `Number.isSafeInteger`. | Ticket 05, using `unsafe-balance-future`; live currency validation belongs to ticket 04. |
| End-show navigation is released only on successful resolution, without the future failure cleanup/release guarantee. | Ticket 14. Baseline protects successful ordering/pacing only. |
| The introduction modal intercepts Home taps. The baseline journey uses a page relaunch before acknowledgement to check that the introduction stays pending. | Record the device observation in ticket 02. Do not invent a reachable navigation action or change the modal here. |
| In the Count progression scenario at 1024×768, the accumulated celebration lines push the end-overlay Home button outside the viewport. Its real click times out. The baseline uses relaunch for that persistence check; the Learn combined show still exercises Play again. | Record layout/navigation on the actual iPad in ticket 02. No forced or scripted hidden-button clicks and no CSS fix are used to turn this limitation into a pass. |
| Newer saves lose unknown fields on a later accepted save; whole-save writes from multiple tabs remain last-writer-wins. | Accepted limits of decision 06, not defects to fix in this extraction. |

The Show Off component currently exposes a return control, not a photo-save control. Ticket 02 should record what photo saving is actually possible on the installed iPad, including an unavailable workflow, rather than treating a missing control as implemented or adding it here.

## Review

`/code-review` compared the proposed commit with `4b392c9` using `git diff --cached 4b392c9`, since the work had not yet been committed. Separate read-only reviewers checked Standards and Spec. Standards found no hard violations and two minor naming concerns; the fixture default is now `DEFAULT_FIT_EXPECTED` and the polling helper is `waitForAssertion`. Spec found no missing requirement, scope creep or incorrect implementation. No review findings remain unresolved. Typechecking and the focused save file passed again after the naming changes, followed by the final full root suite.

## Handoff gate

Ticket 02 must capture [the device comparison checklist](ipad-baseline-checklist.md) before extraction starts. No iPad observation, deployment, real player save read/write, replacement release or acceptance is claimed here. Tickets 03 onward remain gated by that human baseline. Ticket 18 owns final device comparison and release acceptance.
