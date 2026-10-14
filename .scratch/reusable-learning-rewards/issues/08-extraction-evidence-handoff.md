# Agree the evidence and handoff for a safe extraction

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 06, 07
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

What evidence must a production extraction provide to preserve the money app and prove independent reuse, and what order of replacements makes that extraction safe to hand off?

Use the accepted interfaces, compatibility decision, and swap-prototype findings to decide the acceptance criteria and extraction order. Distinguish pure module tests, composition checks, migration fixtures, recorded-voice build checks, offline checks, and human checks for the existing iPad behaviour. Cover answer outcomes, retries and help, progression, earnings, purchases, Legendary checkout, Goals, Trophies, celebrations, and saved progress without repeating design answers from other tickets.

The repo already exposes `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:offline`. Read [the scripts](../../../package.json) and [CI](../../../.github/workflows/ci.yml) before deciding what those checks prove and what additional evidence is needed. A successful throwaway prototype is not a substitute for regression checks against the production app.

Resolve through live discussion with observable acceptance criteria, a safe extraction sequence, and named pointers to the decisions an implementer needs. Before closing, query the map's open children and revisit its fog. Newly surfaced prerequisites must become decision tickets, not silently assumed implementation details.

Do not implement the sequence, create build tickets, or assemble a separate spec document here. The map is an index of the decisions; their full answers remain in their tickets. Hand off only when no in-scope design decision remains open.

## Answer

Approved through two rounds of live discussion on 2026-10-14. The human required all six evidence classes below, all four production-module pairings plus test-only build fixtures, and human iPad sign-off before production release. They then approved the acceptance criteria, gated extraction order and design handoff. This closes a design decision only. It does not implement or accept an extraction, add build tickets, or claim that future release gates have passed.

### Decisions an implementer must use

| Decision | Authoritative answer |
| --- | --- |
| Ownership, terminology and permitted dependencies | [01: Module responsibilities](01-module-responsibilities.md#answer). |
| Subject checking, Round lifecycle, cancellation and progression/result reporting | [02: Learning/Round interface](02-learning-round-interface.md#answer), especially its concrete traces and verification seams. |
| Currency, purchase proposals, coherent commits and session-local completion deduplication | [03: Currency, purchases and ownership](03-currency-purchases-ownership.md#answer). |
| Explicit Legendary capability, captured context, help and checkout lifetime | [04: Legendary learning connection](04-legendary-learning-connection.md#answer). |
| App presentation, Goals, affordability, celebration sequencing and selected voice/assets | [05: Presentation composition](05-presentation-composition.md#answer). |
| Version-4 compatibility, state mapping, recovery, write failures and storage identity | [06: Save compatibility and isolation](06-save-compatibility.md#answer), including its representative synthetic cases. |
| Accepted swap findings and what remains unproved | [07: Swap prototype](07-swap-prototype.md#answer). The artifact is design evidence, not the production implementation to copy or a regression suite. |

Use the existing glossary and [stack decision](../../../docs/adr/0001-vite-preact-static-stack.md). This ticket sets the evidence and order; it does not redefine the interfaces or repeat their full answers.

### What the existing checks establish

Read [package scripts](../../../package.json), [CI](../../../.github/workflows/ci.yml), [TypeScript configuration](../../../tsconfig.json), [Vite configuration](../../../vite.config.ts), [voice checking](../../../tools/voice-check.ts) and [offline checking](../../../tools/offline-check.ts) when running verification. Use the Node version selected by `.nvmrc`.

| Check | Current evidence and limits |
| --- | --- |
| `npm run typecheck` | Strictly checks `src`, `tools` and Vite configuration. It does not typecheck scratch prototypes or prove runtime behaviour, permitted imports or asset isolation. New test-only entries need explicit typecheck coverage. |
| `npm test` | Runs `src/**/*.test.ts`. Existing tests cover pure rules such as progression, earnings, purchases, Goals, payment calculations, Trophies and migration, plus selected rendering calculations and phrase generation. They do not prove the proposed controller, coordinated commits, asynchronous cancellation, Preact composition or isolated builds. Scratch tests require their own command. |
| `npm run build` | Builds today's money app and PWA. The voice plugin checks each current required phrase for a mapping and a file under `public/voice`. It does not prove audible playback, scoped cancellation, rejection of missing selected-capability clips, or absence of unrelated public assets from another build. |
| `npm run check:offline` | After a build, Chromium installs the service worker, reloads offline, reaches Home or setup, and fetches one precached voice file. It also starts the app online with service workers blocked. Despite its log wording, it does not play that clip, finish a Round, buy a reward, validate all selected assets, or test iPad Safari. |

CI runs typechecking, root Vitest, a production build and that offline smoke check, installing Chromium first. Keep these gates and extend the evidence where needed. A green unchanged pipeline or the standalone prototype cannot substitute for checks against the extracted production code.

### Required automated acceptance evidence

The six required evidence classes are pure module tests, composition checks, migration fixtures, recorded-voice/build checks, offline checks and human iPad acceptance. The table groups automated pass conditions by behaviour; a row may exercise more than one class. For automated work, use red-green tests at the already-approved seams in tickets 02-06. Observe returned results, public phases/actions, committed aggregate state, saved snapshots and rendered/audio effects. Use controlled time and supplied adapters rather than private queues, miss counters, guard collections or real browser saves. Agree any additional seam before writing tests there.

| Evidence class and seam | Observable pass condition |
| --- | --- |
| Pure subject and Round rules, plus the supplied-adapter Round controller | Run ticket 02's clean, helped, missed, retry/replay, completion and leaving traces. Distinguish not-an-answer input; preserve five solved answers, replay spacing and the specified delays. Exercise manual/automatic help, explanation throws/rejections, fresh actions on replay, pending introductions, and late work after leaving or replacement. Check reported facts and phases, not timer handles. |
| Pure subject progression and app answer coordination | Money retains its three modes, Mastery windows, Level/star/unlock rules and introductions. Check a Level change during a Round without changing its captured generation context. Miss/help streak effects happen immediately; solved progress commits before its delay. Abandonment retains those effects without inventing a solved result for unfinished work. |
| Pure currency and reward transitions, plus app purchase/completion coordination | Run ticket 03's success, rejection and failure traces. Five clean answers credit six Bolts; two clean credit three; no clean answers credit one. Abandonment, including during the final delay, credits none. Duplicate/inactive terminal facts change neither balance nor Trophy completion state. Invalid amounts, overflow, rejected/stale purchases and failed calculations publish no partial action. A 15-Bolt purchase from 16 commits balance one, ownership, immediate fit and Goal clearing together. Exercise Bodies, Colours, free fits/selections and repeatable reward proposals, not just one Mod. |
| Money payment/help, Garage Legendary proposals and app checkout coordination | Run ticket 04's empty/short/over/exact, manual/second-miss help, captured-context, changed-eligibility and closing/reopening traces, including the Level-3 $5 bill. Help fills but never purchases. Repeated/stale actions cannot unlock or fit. Compare currency, learning and Trophy state before/after to prove checkout changes none of them. Missing policy/context fails composition rather than hiding Legendaries. |
| Reward presentation/app coordination and Trophy rules | Run ticket 05's setup, optional Goal, introduction and stale-action cases. Check selected/automatic Goals, Legendary/finished fallbacks, and newly-affordable versus currently-affordable cues separately. Exercise learning milestones, streaks, perfect Rounds, completion/day counters, earned dates and counting-Trophy upgrades through the real Trophy module. Render the existing shelf and app placements; synthetic completion counters alone are insufficient. |
| Celebration sequencing and committed-only presentation | Observe the existing Bolt-first, progression, star, Trophy and newly-affordable order, retaining every applicable moment and the normal navigation gate. Cancel within/between moments; inject throws/rejections and late effects. Failure releases only active-screen navigation and cleans up that run. Re-showing or failing presentation never credits currency, grants ownership, awards Trophies or rolls back committed progress. |
| App save adapter, app coordination with persistence and storage isolation | Check in independently specified synthetic version-1/2/3/4, recoverable-corruption and newer-version fixtures from ticket 06, with a fixed day. Decode/encode/reload must preserve the full supported state, including per-Body fits, Colours, Door Numbers, Legendary ownership, each Goal kind, introductions, Trophy dates/counters and null-Body setup. Include unsafe-balance recovery. Prove no load-time writes, coherent snapshots, no writes on rejected actions, retained memory/guards on write failure, ordered writes, later recovery and last-successful-snapshot restart behaviour. Two explicit compositions sharing one fake store must touch only their own keys; money retains `mtm2-save`. |
| Typed voice and selected build composition | Typecheck real selected presentation/subject entries, including rejection of unselected phrases without widening to arbitrary strings. Exercise interrupt/append playback, highlighting, scoped cancellation and money amount expansion. Controlled missing-mapping and missing-file fixtures must fail the selected build, including generated phrases. Inspect import graphs, output files and precache lists for selected assets and absence of unselected catalogues, art, branding, CSS and public files. A successful money build or JavaScript tree-shaking alone is insufficient. |
| Offline browser journeys | Extend beyond the current smoke check using isolated synthetic profiles. After warm precaching, go offline and exercise practice, help, completion, a Bolt purchase, Legendary checkout, save/reload and actual recorded playback. Check selected asset/precache coverage, console errors and unexpected external requests. Repeat representative operation with service workers blocked while online, proving the app does not depend on them; this does not promise a first-ever offline visit without cached assets. Verify an update does not reload an active game and appears on next launch. |

The pure-module, composition, migration-fixture, recorded-voice/build and offline classes above are separate obligations. A controller test cannot replace browser composition, a round trip generated from the new encoder cannot supply its own expected fixture state, and a file fetch cannot prove audio playback. Preserve baseline behaviour while testing the explicitly agreed stronger safety contracts, including cancellation, coherent commits and unsafe-balance recovery; do not freeze current defects as required behaviour.

### Independent reuse must use production modules

Exercise money/Garage, money/minimal non-Garage reward, minimal non-money learning/Garage and minimal non-money learning/non-Garage reward through the actual extracted modules and app coordination. One fixed non-money problem and a repeat-purchase reward are sufficient. Check outcomes, earnings, purchase acceptance/rejection, optional setup/Goal or a completion response, re-show without credit, and isolated reloads. Do not import copied prototype implementations to make these tests pass.

For non-money/Garage, explicitly supply the supported money checkout capability and a synthetic compatible context. Exercise the real checkout coordination without adding Pay the Shop to the non-money subject. This test context does not decide how a future clock app obtains or progresses its money context.

Add minimal test-only build entries for the cross-pairings and the non-money/non-Garage case alongside the real money build. They must typecheck the selected views, use distinct outputs and selected asset roots, and prove required voice coverage and excluded assets under ticket 05. Intentionally selected Garage and extra money-checkout assets are permitted, but unrelated money curriculum is not. Dependency inspection must also confirm reusable contracts import neither concrete money/Garage implementations nor the legacy aggregate `Save` type contrary to ticket 01. These fixtures prove reuse without a finished second app, deployment, clock curriculum, army mechanics or runtime selector.

### Human iPad acceptance is a release gate

Before replacing production, the requesting human or their explicitly named delegate must compare the current baseline and candidate on the target iPad in Safari and its Home Screen installation. Record the builds, device/OS, exercised cases, observations and explicit sign-off. Capture the baseline before extraction so later comparisons are not from memory. Use an isolated test origin and synthetic fresh/progressed saves; do not reset, seed or migrate real player saves.

The comparison must cover:

- Tap-to-start audio unlock, first-launch Body preview/confirmation, touch targets and layout, all three Game Modes, introductions, prompts, help/peeks, wrong-answer feedback and retries/replay.
- Progression, Bolt earnings/display, purchases, free fitting, Body/Colour changes and Door Numbers, Legendary payment/help/close/reopen, Goal cues and the Trophy Shelf.
- Truck art and Show Off, every applicable celebration moment and its order/pacing, speech intelligibility, interruption/highlighting, no old audio/effects after navigation, and usable navigation after completion or failure.
- Saved progress after relaunch, installed-app offline relaunch and recorded playback, plus update behaviour without an active-game reload. Use synthetic saved states to reach rare milestones rather than requiring a child to grind through them.

A failing or unperformed human check leaves production release unaccepted even when automation is green. Agreeing this future gate closes issue 08; it is not evidence that the check has happened.

### Gated extraction order

This is a replacement sequence for a later implementation, not permission to execute it in this ticket. Each stage keeps the money app usable and has one live route for each state-changing action. Compatibility facades may bridge existing callers, but old and new writers must not both credit, grant or persist the same action.

1. **Capture baseline evidence.** Retain existing production regressions, record iPad behaviour and prepare independent synthetic save expectations. Identify preserved behaviour separately from the safety improvements explicitly accepted in tickets 02-06. Exit with a baseline against which later changes can be compared.
2. **Separate module-owned state and pure rules.** Establish subject, currency, reward and Trophy interfaces without the aggregate save type. Extract checking/progression, arithmetic, purchase/Goal and Trophy rules with focused seam tests; exercise a minimal alternative adapter early. Exit with unchanged money rules and the permitted dependencies from 01.
3. **Establish save mapping and app coordination.** Using those states, preserve the version-4 adapter and explicit storage identity. Prove fixture round trips and coherent answer, completion, purchase and checkout commits, rejection, write failure and isolation. Route each live action family through its coordinator when replaced, retaining one writer. Exit with the ticket 06 invariants before further live replacements rely on them.
4. **Introduce scoped recorded playback.** Test interruption, append, cancellation ownership and pending-playback cleanup before the new Round or checkout depends on them. Retain the money voice facade and existing recordings. Exit when cancelling an old view cannot alter or hush a newer one.
5. **Replace Round coordination.** Supply the real money learning adapter and connect its facts to app progression, Trophies and completion coordination. Keep the current screens through app adapters as needed. Exit with ticket 02's asynchronous, introduction, replay, final-delay and abandonment traces passing through the production controller, including no duplicate earnings.
6. **Replace Legendary coordination.** Connect the explicit money payment capability and Garage proposals through the active checkout. Exit with ticket 04's payment/help/context/cancellation traces and no currency, learning or Trophy effects. Remove the old checkout write path as its replacement becomes live.
7. **Reconnect presentation and selected builds.** Assemble the existing screens, setup, currency/Goals, Trophy Shelf and committed celebration plans through ticket 05's seams. Prove sequencing, selected typed voice, asset/build isolation and precaching. Exit with money-app behaviour preserved and minimal test-only build entries exercising the same extracted code.
8. **Prove reuse and release readiness.** Complete all four production-module pairings, save/isolation and browser journeys, inspect dependencies and build contents, and run final automated gates. Obtain the human iPad sign-off above before production release. Prototype success alone never completes this stage.

During later implementation, use one red-green slice at an agreed seam at a time, run its single test file and typechecking regularly, and run the full suite once at the end. Build and offline checks must use the candidate outputs, with focused fixture checks separately included where root scripts do not discover them. Review standards and spec conformance before accepting the extraction. Stop at a failed stage rather than carrying an unproved replacement into the next one.

### Frontier, fog and handoff

Before resolving, the child-status query found 01-07 resolved and only this ticket claimed. Re-reading the map's prototype-dependent fog and ticket 07 exposed no additional in-scope design decision. The human approved clearing that fog and handing off the design. The map remains an index; the answers stay in their tickets.

Future clock curriculum, recruitment mechanics and the source/progression of a future app's extra money context remain outside this effort, not hidden extraction prerequisites. Production tests use explicit minimal adapters and synthetic context. If extraction exposes a new in-scope competing design choice, record a precise decision ticket linked to the map and stop the affected replacement until it is resolved. Do not silently treat it as an implementation detail or claim handoff readiness while that decision is open.

The design is ready for a subsequent implementation handoff using 01-08 and the linked prototype findings. No production module, test, save, build configuration, deployment or real player data changed in this ticket; no separate spec or implementation tickets were created. Actual extraction acceptance remains conditional on all the evidence above.
