# Automated acceptance of the extraction candidate

Prepared for [issue 17](issues/17-offline-automated-acceptance.md) on 2026-10-15. This is automated evidence for the candidate, not release sign-off. Production release stays unaccepted until the requesting human or a named delegate completes [final ticket 18](issues/18-ipad-release-acceptance.md) on the target iPad. No deployment, real-save migration or human approval happened here.

The authoritative evidence requirements are in [decision 08](../reusable-learning-rewards/issues/08-extraction-evidence-handoff.md#answer). The retained pre-extraction build and its synthetic fixtures are in [the automated baseline](baseline.md).

## Candidate identity

| Field | Value |
| --- | --- |
| Candidate source commit | `e4c7692cc95f547e750f5bc60a4987144df6f526`, "Verify offline journeys and final automated gates", on `main`. Its parent is `63c5698` (issue 16). Later commits that only edit `.scratch/` documents leave the candidate unchanged. |
| Retained baseline commit | `4b392c9f274a95d420424c43f3a571f5240dcb18` |
| Toolchain | Node `22.23.2` from `.nvmrc`, Chromium `153.0.8010.12` from the locked Playwright |
| Production output | `dist/`: 143 transformed modules, 629 precached entries (8571.08 KiB) |

Candidate build fingerprints, SHA-256, from `npx vite build` at the candidate commit:

| File | Hash |
| --- | --- |
| `package-lock.json` | `9a5c9eb61776d5964b3a6e6ace50f530242decd79e81b18a4182c8c2775a7551` (unchanged from the baseline) |
| `dist/index.html` | `36d598456e4085b0a072f683881ea658ea7879bde739e58b84bcaa070670dac4` |
| `dist/assets/index-DVw0a_SG.js` | `2dd11b0b63031335569fa3af0ac9047058cb8c3f0a726442ef18420199b7de88` |
| `dist/assets/index-C73aKoH2.css` | `795f0f1ca4f40cb87950563b953eaa9f042fc18d541f8858bcd01e3cf1353548` |
| `dist/sw.js` | `3bfa2c76bf45df92d543240690533566144ed67752e241c3d7a391136632580d` |

Fingerprints identify this candidate's output with this toolchain. They are not a promise of byte-identical output from a different toolchain.

## Reproduce the automated evidence

From a clean checkout of the candidate commit:

```sh
source "$HOME/.nvm/nvm.sh"
nvm use                        # Node 22.23.2
npm ci
npx playwright install chromium
npx tsc --noEmit
npm run typecheck:pairings
npx vitest run                 # root suite: src/** and tools/** tests
npm run test:pairings          # the pairing tests, named explicitly
npx vite build                 # candidate money app, dist/
npm run build:pairings         # three test-only pairing builds, dist-pairings/
npm run check:offline          # offline journeys; needs both builds
npm run check:baseline         # 51 baseline journeys; needs dist/
```

CI (`.github/workflows/ci.yml`) runs the same commands in that order on every push and pull request, with the Node version from `.nvmrc`. `tools/discovery.test.ts` fails the root suite if any repository test file sits outside the root Vitest include, or if `test:pairings` stops naming every pairing test. The scratch prototype test is deliberately outside: it is design evidence, not a production check.

Both browser scripts start and close their own local preview servers. They never use a remote or production URL or an existing browser profile. Each journey gets a fresh, non-persistent Chromium context. Synthetic saves are written once per context, so reloads and relaunches read what the app saved. `check:offline` serves a private temporary copy of each build so the update journey can publish a new version without touching the candidate output. Pass a name substring to run one journey, for example `npm run check:offline -- 'available update'`.

## Verification record

Final run at the candidate commit, Node `22.23.2`:

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` and `npm run typecheck:pairings` | Both passed. |
| `npx vitest run` | Passed: 789 tests across 41 files. |
| `npm run test:pairings` | Passed: 30 tests across 3 files. |
| `npx vite build` and `npm run build:pairings` | Passed. Pairing precaches: clock/repeat 13, clock/Garage 489, money/repeat 266 entries. |
| `npm run check:offline` | All 6 journeys passed, on two consecutive full runs. The first full run had failed the service-workers-blocked journey on a race in the test (see below); it was fixed before these runs. |
| `npm run check:baseline` | All 51 journeys passed. |

`check:offline` journeys:

1. **Money app offline.** Warm the service worker, then check that every built file except the worker is precached and nothing else is. Go offline and reload. The tap-to-start greeting plays. Count's prompt reads its choices as amounts joined from recorded pieces. The light visits each choice in reading order, there are more clips than choices, and every clip starts in a running audio context with audible samples and plays to its end. Then: manual counting help, automatic teaching on a second miss, Round completion with the expected Bolts, and leaving mid-prompt, which stops that clip, clears highlighting and changes no saved state. After that: a 15-Bolt purchase that commits balance, ownership and fit together, and a Legendary checkout (short payment, automatic help on the second miss, exact payment) that grants and fits the Mod without spending Bolts. Finally, an offline reload and an offline relaunch in a new page both restore the committed save and play recorded audio. No browser errors, failed loads or external requests.
2. **Pairing builds offline.** Money/repeat, clock/Garage and clock/repeat each warm and pass the exact-precache check, then go offline and play their full pairing journey, watched for problems from before warming. That journey covers recorded playback to its end, two completions, a completion re-shown without credit, purchases, rejection for insufficient funds or ownership, a free action, reload, only the build's own storage key, no external requests and no browser errors. Money/Garage is the real money app in journey 1.
3. **Service workers blocked online.** The money app starts with no controlling worker and no caches. It plays a full Count prompt, records a clean answer, makes a Bolt purchase and reports no errors.
4. **Update.** Three new versions are published, one while each activity is on screen: partway through a Round, during the Round's celebration and while a Legendary checkout is open. Each time, the new worker takes over the page. The page is never reloaded, each activity finishes normally, and the next launch, offline, shows the latest version.

The first full run failed the service-workers-blocked journey. The page reports clip events to Node asynchronously, so a greeting clip that had just started could be reported after the journey recorded its starting point. The tap to Count then stopped that clip, and the journey counted it as a cut-off prompt clip. The journey now waits until no clip has started for a second before reading the prompt. With that fix the blocked journey passed three focused runs, and then two full `check:offline` runs.

To show the update journey can fail, a temporary local change made `src/pwa.ts` reload whenever an already-controlled page gets a new worker. The journey failed mid-Round, as intended, and the change was reverted and rebuilt before the final run.

## Required automated evidence traced to tests

Each row of decision 08's required automated evidence, with the passing checks that supply it. The evidence classes are independent. Browser journeys do not stand in for controller tests, or the reverse.

| Required evidence | Passing evidence |
| --- | --- |
| Pure subject and Round rules, supplied-adapter Round controller | `src/learning/round.test.ts`, `src/round/rules.test.ts`, `src/modes/learning.test.ts`, `src/modes/count/count.test.ts`, `src/modes/pay/pay.test.ts`, `src/modes/chain.test.ts`; live controller traces in `src/app/practiceLive.test.ts`. |
| Subject progression and app answer coordination | `src/modes/progress.test.ts`, `src/app/practice.test.ts`, `src/app/practiceLive.test.ts`, `src/app/coordination.test.ts`; baseline journeys for Learn/Count/Pay progression, leaving mid-Round and the final success delay. |
| Currency, purchases and completion coordination | `src/currency/currency.test.ts`, `src/rewards/purchase.test.ts`, `src/garage/purchases.test.ts`, `src/garage/economy.test.ts`, `src/garage/goals.test.ts`, `src/app/purchases.test.ts`, `src/app/practice.test.ts`; baseline Bolt purchase, Garage and earnings journeys; offline journey 1. |
| Legendary checkout | `src/modes/pay/payment.test.ts`, `src/app/checkout.test.ts`; baseline Legendary Level 1/2/3 and scoped checkout-failure journeys; offline journeys 1 and 4. |
| Setup, Goals and Trophies | `src/app/setup.test.ts`, `src/garage/goals.test.ts`, `src/trophies/trophies.test.ts`; baseline setup, Goal, Trophy Shelf, milestone and counting-Trophy upgrade journeys. |
| Celebrations | `src/celebrate/sequence.test.ts`; baseline celebration journeys (`tools/baseline/celebrationJourneys.ts`), including failure release and committed-only re-shows. |
| Saves and isolation | Independently specified fixtures in `tools/baseline/saves.ts`, used by `src/save/baseline.test.ts`, `src/save/store.test.ts` (load without writing, failed and ordered writes, recovery, two identities on one store) and `src/app/save.test.ts` (including `unsafe-balance-future`). `src/app/store.test.ts`; `tools/pairings/pairings.test.ts` (shared fake store, distinct keys, `mtm2-save`). |
| Typed voice and selected builds | `src/voice/playback.test.ts`, `src/voice/say.test.ts`, `src/voice/amount.test.ts`, `src/voice/collection.test.ts`, `src/voice/phrases.test.ts`, `tools/selection-types.test.ts`, `tools/recording.test.ts`, `tools/static-build.test.ts` (controlled missing-mapping/missing-file builds), `tools/pairings/builds.test.ts` and `tools/pairings/dependencies.test.ts` (import graphs, outputs, precache lists for all four pairings); baseline scoped-voice journeys. |
| Offline browser journeys | `check:offline` journeys 1–4 above. Their precache check proves the precache matches each build's output exactly. That the output holds only selected assets is proved separately by `tools/pairings/builds.test.ts` and `tools/static-build.test.ts`. |

Kept separate, as decision 08 requires: synthetic migration expectations are hand-written in `tools/baseline/saves.ts`, not generated by the encoder. Real production Trophy and shelf coverage comes from `src/trophies/trophies.test.ts` and the rendered-shelf baseline journeys. All four real-module pairings are in `tools/pairings/*.test.ts` and offline journeys 1–2. Ordered and failed persistence is in `src/save/store.test.ts`. No test imports the scratch prototype.

## Review and open points

Reviewed against the repository standards and the approved design with `/code-review`; see the issue 17 comment for findings and outcomes. No automated blocker remains open. These limits are recorded rather than treated as passed:

- All browser evidence is headless Chromium at 1024×768. Safari, the iPad, Home Screen installation, touch, audibility and intelligibility, photo saving and real update timing belong to ticket 18.
- The update journey publishes the new version by editing a served copy's HTML and its precache revision, then asks the registration to check for updates. It shows the app's own behaviour when a new worker takes over. It does not show how quickly Safari discovers an update.
- The baseline limitation where accumulated Count progression lines push the end-overlay Home button out of a 1024×768 viewport still stands. Ticket 18 records it on the device.
- `.github/workflows/pages.yml` deploys after typechecking, the root suite and the money build only. It does not run the pairing builds or browser journeys, which CI runs on the same push. Deployment configuration is outside this ticket.

## Ticket 18 handoff

Use the [comparison checklist](ipad-baseline-checklist.md) with the baseline commit above and this candidate commit. Build each with the reproduction steps. Serve them from two separate, isolated HTTPS test origins that a human supplies, never the child's production origin. Seed only synthetic saves from `npm run --silent baseline:save -- <case>` on those origins, as the checklist describes.

Comparison cases with automated counterparts, for side-by-side observation:

| Device case | Seed | Automated counterpart |
| --- | --- | --- |
| Installed offline relaunch, full practice/help/purchase/Legendary path, audible recorded playback | `checkout-2` | Offline journey 1 |
| Startup and play with no service worker (Safari private window or before install) | `checkout-2` | Offline journey 3 |
| Update without reloading an active Round, show or checkout; available on next launch | `checkout-2`, plus a second build of the candidate with a visible marker | Offline journey 4 |
| First-launch setup, progression, celebrations, Goals, Trophy Shelf, Garage | `v4-null-body`, `milestones`, `star`, `garage`, `v4-mod` | Baseline journeys |
| Legendary Level 2 and Level 3 ($5 bill) | `checkout-2`, `checkout-3` | Baseline Legendary journeys |

Automated passes do not count as device observations. Every checklist case still needs a human result for both builds.
