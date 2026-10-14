# Preserve saved progress while isolating app state

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 02, 03, 04
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

How should the agreed modules own saved state while Monster Truck Money continues to load existing saves without losing learning progress, Bolts, Garage ownership and fits, Goals, or Trophies?

Decide whether the existing on-disk representation can stay intact behind new module interfaces or needs a migration. Define who composes, validates, loads, and commits module state, including changes that cross learning, currency, and reward modules. Establish the compatibility and migration invariants without making every module depend on the current all-in-one Save type.

Define how separate app builds isolate saved data and currency even when hosted on the same origin. Preserve the existing money app's storage identity, or explicitly design a non-destructive transition. No shared cross-app wallet, sync, reset, or changes to real player saves belong in this effort.

Read [the saved-game schema and migrations](../../../src/save/migrate.ts), [migration tests](../../../src/save/migrate.test.ts), [storage](../../../src/save/storage.ts), [the saved-game signal](../../../src/game/store.ts), and [the storage seam decision](../../../docs/adr/0001-vite-preact-static-stack.md).

Resolve through live discussion with state ownership, storage isolation, a compatibility approach, and representative old-save and current-save cases. Record the evidence a later implementation must provide; do not migrate actual browser data or change production persistence.

## Answer

Approved through two rounds of live discussion on 2026-10-14, including state ownership, compatibility, failure handling, isolation and future TDD seams. This records a design, not production extraction or a migration of browser data. The responsibilities from [01](01-module-responsibilities.md#answer), learning facts from [02](02-learning-round-interface.md#answer), coordinated commits from [03](03-currency-purchases-ownership.md#answer) and checkout lifetime from [04](04-legendary-learning-connection.md#answer) still apply.

### Keep the money app's stored representation

Keep schema version 4, its existing field names and the `mtm2-save` storage key. Separating module ownership does not require a new on-disk representation, version bump, new key or player reset. Existing version 1, 2 and 3 saves still pass through their historical migrations and field recovery before becoming current state.

The app-specific money save adapter owns the stored representation, historical migration order and mapping between stored fields and the app's aggregate of module-owned states. It encodes that aggregate back into the existing version-4 shape. The aggregate can change internally without exposing the legacy `Save` type to reusable modules. No published package, universal save schema or module-level browser storage is introduced.

| Owner | State represented by current stored fields |
| --- | --- |
| Money learning | `modes`, including each Game Mode's Level, window, opened/starred flags, pending introduction and fresh-tile flag; `lastMode`. |
| Currency | `bolts`, mapped to the currency module's `balance`. No Garage ownership or Goal fields. |
| Garage | `body`, `ownedBodies`, `unlocked`, `colours`, `fitted` and `goal`. Fits include each Body's Mods, Door Number and Colour. |
| Trophies | `trophies`, `roundsFinished`, `currentStreak`, `bestStreak`, `daysPlayed` and `lastDay`. |
| App save adapter | `version`, legacy migrations and composition of the validated states above. |

Each module defines and validates its own state without importing, extending or taking a `Pick` of the aggregate persistence type. Currency validates the balance; Garage validates ownership, fits and Goal references; money learning validates its progression; Trophies validates its earned steps and counters. The app adapter supplies legacy field mappings and coordinates any historical cross-module work, such as passing validated money milestones to the existing Trophy backfill. Shared Trophies need not import money Game Mode identifiers to perform that app-selected work.

These are ownership and mapping requirements, not final method names or a requirement to keep today's all-in-one migration implementation unchanged internally. Another app composes its own selected module states and save adapter; it need not store money modes or Garage fields.

### Load, validate and commit

1. App composition selects its persistence identity and adapter before loading. The backing storage implementation reads only that identity and supplies the saved data to the app adapter.
2. The adapter handles historical versions and delegates module-state validation. Compose and publish the complete validated aggregate before enabling player actions, as today's startup waits for `loadGame`. A late initial load must not overwrite newer player actions.
3. Loading alone does not rewrite storage, including when it supplies defaults, recovers fields or backfills old Trophies. It has no purchase, Round-completion or presentation effects.
4. An action reads the latest aggregate. Module operations calculate and validate proposed changes without mutating inputs, publishing state, writing storage or running presentation. If any required calculation rejects or fails before publication, publish and save none of that action's proposals.
5. On acceptance, publish all of the action's changes together in one synchronous aggregate update, then save one complete snapshot through the persistence seam. Writes must preserve publication order so an older snapshot cannot overwrite a newer one. Today's `localStorage.setItem` executes synchronously even though the seam returns a promise; any later asynchronous backing adapter must retain the ordering invariant.
6. Present only the committed result. Speech, animation, navigation and repeated notifications do not independently apply saved-state transitions.

Keep the existing commit timing from the earlier tickets:

- An accepted miss or help use breaks the streak immediately. A solved result commits money progression and streak effects together before its success delay. Starting a practice, acknowledging its introduction and clearing its fresh-tile flag retain their saved effects. Abandonment retains already-committed progress.
- Round completion commits currency credit, Trophy completion effects and the session-local terminal guard together after the final delay. Abandonment during that delay earns nothing. Duplicate or inactive terminal results cannot trigger another commit.
- An earned-currency purchase commits debit, ownership and any immediate fit, Colour application, Body switch and selected-Goal clearing together. A rejected proposal or debit changes none of them. Free fitting and selection remain free.
- Successful Legendary checkout commits ownership, immediate fit and terminal checkout state together. It changes no currency, learning or Trophy state. Closed or stale checkout actions cannot commit.

Only the durable module state is encoded. Round identities, questions, replay queues, timers, pending explanations, checkout context/trays/misses, cancellation scopes, completion guards and celebration progress remain transient. Loading does not resume an in-progress Round or checkout, replay an old terminal notification, or credit an interrupted Round. The once-per-Round guarantee remains session-local, not a durable receipt ledger.

### Persistence failure is not action rejection

Preserve today's play-from-memory behavior. After a coherent in-memory publication, attempt one whole-aggregate write. If serialization or storage fails, retain the committed in-memory state and its consumed completion or checkout guard. Do not refund, revoke ownership, replay earnings or roll back learning progress because the write failed.

For the current localStorage adapter, a failed write leaves the previous stored snapshot rather than a partially written aggregate. A later successful action saves the full latest aggregate, including earlier unsaved changes. No new background retry system, durable receipts, user-facing recovery flow or cross-restart delivery guarantee is added. On restart, load the last successfully stored snapshot; changes since that write may be lost together. One coherent in-memory publication and one stored JSON value are not a durable transaction across a crash.

A missing or unreadable save, JSON parse failure or blocked read retains today's fresh in-memory fallback without deleting or immediately overwriting the stored value. Best-effort persistent-storage permission remains behind the storage adapter as in ADR-0001; it does not guarantee against browser eviction or a player clearing site data. No actual browser storage is read or changed by this ticket.

### Compatibility and recovery invariants

For a valid current money save, decode, encode and reload must preserve every supported field and its meaning, not necessarily JSON whitespace or property order. Keep balances, learning windows and flags, selected practice, purchased Bodies/Mods/Colours including Legendaries, all per-Body fits, the selected locked Goal, earned Trophy dates and all counters. A round trip must not rerun progression, spend or earn currency, grant purchases, duplicate Trophies or lose an unacknowledged introduction.

Keep existing field-level recovery rather than replacing an otherwise recoverable save wholesale:

- Version 1 supplies the three starter Bodies. Missing newer Bodies and Slots receive default fits. Missing Door Numbers read as 1; missing Colour state reads as Red with no bought Colours.
- Preserve valid known ownership and remove invalid or duplicate entries as today. A fit cannot use an unowned Mod or bought Colour; a selected known but unowned Body falls back to Pickup. A null Body still means first-launch setup is needed.
- Keep a chosen locked Mod, Body or Colour as the Goal. Clear an unknown, already-owned or Legendary selection to the automatic-Goal sentinel `null`; do not persist the computed automatic target.
- Keep valid money Levels and flags; filter invalid outcomes and retain the last ten valid window entries. Missing or invalid fields use their existing defaults rather than triggering new progression or unlock rules.
- For version 1/2 input, backfill only learning Trophies proved by validated Levels and stars, using the supplied local day. Preserve already-recorded known Trophy dates. Do not invent historical streak, Round or day counts. Version 3/4 loads do not repeat that backfill.
- Retain known Trophy entries and current counter/date recovery behavior. Do not silently introduce a new historical-date parser or repair relationships between counters during extraction.

One recovery change was explicitly approved to match ticket 03: an unsafe saved Bolt integer is invalid and defaults only the balance to zero, preserving the other module states. Today's `count` reader accepts non-negative integers beyond the safe-integer range, so this is a future change requiring a red-green test, not a claim about the existing loader. Valid saved balances remain unchanged; negative, fractional and nonnumeric balances continue to default to zero. Live currency operations still reject invalid amounts and overflow under ticket 03 rather than silently repairing a proposed transaction.

Retain today's best-effort reading of known fields from a newer save version. A later save writes the current version-4 representation and does not preserve unknown fields. This is not a forward-compatible round-trip guarantee or a new downgrade/backup protocol. No rewrite on load limits this behavior to a later accepted action, but does not remove the possible loss of unknown newer-version data then. The user explicitly accepted that limit.

### Separate-app storage isolation

Every app composition must explicitly select a stable, distinct storage key. Monster Truck Money keeps `mtm2-save`; another app gets its own identity with no shared default or fallback to that key. Different URL paths, HTML entries, output directories or PWA names on the same origin do not isolate localStorage.

The selected app's load and save operations use only its key. Another app starts with its own fresh balance and progress even if `mtm2-save` exists; it neither imports Bolts nor copies learning, ownership or Trophies. The money app likewise ignores the other app's data and continues to ignore the old Monster Cup keys. There is no cross-app wallet, sync, reset, automatic import or key-renaming transition. Reusing Garage or money learning in another composition does not reuse the money app's persistence identity.

This is isolation of app reads and writes, not a security barrier against same-origin JavaScript or isolation from shared storage quota and browser eviction. Multiple tabs of the same app retain existing whole-save last-writer behavior; no merge or multi-tab transaction protocol is introduced. A native wrapper still requires an explicit backing adapter and data transition under ADR-0001, not an assumption that it inherits web storage.

### Representative synthetic cases

These cases specify evidence for later implementation. Use checked-in synthetic fixtures and a fixed supplied day, not real player saves or expectations generated by the new encoder.

| Input or action | Required observable evidence |
| --- | --- |
| Version 1, 40 Bolts, Dragster selected, `tires:3` owned and fitted | Keep the balance, Body and Tires; supply the three starters and default newer fits, Door Numbers and Colours. |
| Version 2, Jeep bought/selected, 140 Bolts, `tires:1` and `paint:3` owned/fitted, Firetruck Goal; Learn Level 3 starred and Count Level 2 | Preserve Garage and learning state; backfill `learn:2`, `learn:3`, `learn:star` and `count:2` on the supplied day without invented completion counters. Encode/reload as version 4 without redating those Trophies. |
| Version 3, 9 Bolts, `paint:2` fitted and Door Number 8, existing Trophy dates/counters | Preserve existing state and dates; supply Red on every Body and no bought Colours. Do not repeat legacy Trophy backfill. |
| Fully populated valid version 4 | Decode/encode/reload preserves all three modes' nontrivial windows and flags, `lastMode`, balance, bought Bodies, Legendary ownership, distinct per-Body fits/Colours/Door Numbers, each supported Goal kind, Trophy dates and counters. Include a separate null-Body first-launch case. |
| Recoverable corruption, including an unsafe Bolt balance, unknown items, unowned fits and an owned or Legendary Goal | Repair only the affected fields using the rules above; preserve unrelated learning, valid ownership and Trophies. Missing/malformed JSON and blocked reads yield fresh memory without a load-time write. |
| Newer version with 7 Bolts and an unknown future field | Read the known balance without resetting it. Loading leaves storage untouched; a subsequent accepted action writes version 4 without the unknown field, documenting the accepted forward-compatibility limit. |
| Buy `tires:2` with 16 Bolts and that Mod selected as Goal | One publication and one stored snapshot contain balance 1, ownership, immediate fit and cleared Goal. Reload reproduces the combined result. A rejected purchase or debit publishes/saves nothing. |
| Five-clean completion reported twice, including a failed first write | One six-Bolt credit and one set of Trophy completion effects in memory. A write failure does not reopen the guard; duplicate notification does not credit or count again. Restart reads only the last successfully saved aggregate. |
| Two successive accepted actions | Complete snapshots reach storage in publication order. The final reload contains the latest combined state, not an earlier balance or fit. A later successful write includes earlier unsaved changes. |
| Two app compositions using one fake same-origin store | Seed distinct keys, then load, complete Rounds, purchase and reload each app. Both retain independent progress and balances; neither reads nor writes the other's key. A fresh second app ignores a populated money save, and money continues to use `mtm2-save`. |

### Agreed future verification seams and remaining work

The user approved three future TDD seams:

1. **App-specific save adapter.** Exercise decoding, encoding and reloading synthetic version 1-4 and newer-version fixtures through its interface, including the full current-state round trip, historical defaults/backfill and targeted recovery above. Assert independently specified player state, not private migration helpers. Module validators are exercised through that path without importing the legacy aggregate type into modules.
2. **App coordination with persistence.** Observe aggregate publication and complete saved snapshots for purchases, completion, answer progression and checkout. Include rejection without partial changes, duplicate/stale actions, write failure retaining memory and guards, no load-time writes, ordered snapshots and restart behavior. Use a fake backing adapter, not real browser data, and do not inspect private guard collections.
3. **Storage isolation.** Run two explicit app compositions against one fake same-origin backing store. Verify independent state/balances and key-specific reads/writes, no cross-app fallback, and the money app's unchanged key. Use typechecking plus dependency inspection to verify reusable module contracts compile without importing the legacy `Save` type.

This design-only ticket adds no executable interfaces, tests or production persistence changes. Existing migration tests provide evidence of current defaults, recovery and compatibility, not proof that the proposed module adapters, ordered asynchronous writes or app isolation exist. Production extraction must use red-green tests at the approved seams, including the explicitly changed unsafe-balance case. Current typechecking and tests are baseline checks only.

Ticket 07 is now unblocked for the throwaway substitution prototype, using synthetic state and fake persistence. Ticket 08 remains blocked by that prototype and owns the final evidence/handoff and extraction sequence. No downstream ticket is resolved here, and no new unresolved save-design question emerged from this discussion. The map's prototype-dependent fog remains open.
