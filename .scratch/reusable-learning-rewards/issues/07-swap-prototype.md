# Test independent learning and reward substitution with a throwaway prototype

Type: prototype
Label: wayfinder:prototype
Status: resolved
Blocked by: 02, 03, 04, 05, 06
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

Do the candidate interfaces actually let learning and rewards vary independently, or do they still hide money and Garage assumptions?

Invoke `prototype` and build only enough to exercise the proposed contracts. Use a minimal non-money question and non-Garage reward alongside representative money/Garage adapters. Test both cross-pairings, reporting a learning outcome, crediting earnings, buying a reward, presenting a Goal or completion response, and isolating app state. Exercise one-time ownership and a repeat-purchase scenario if the proposed purchase contract claims to support both.

Keep the artifact throwaway and linked from this ticket. Use synthetic state and existing or stubbed assets. Do not refactor production code, generate a finished clock curriculum, design army art or battles, deploy another app, or touch real player saves. A prototype may implement candidate contracts; it does not prove that a production extraction or migration has already succeeded.

Show the artifact and findings to the human. This HITL ticket cannot resolve solely from automated checks. Decide together which interfaces are accepted and which need revision. If a finding needs a separate session, create a precise new decision ticket and keep the map open rather than hiding the question in a prototype TODO.

Resolve with the human's reaction, evidence for independent substitution, accepted changes to the candidate design, remaining limitations, and a link to the prototype asset. Update the map's fog only when a concrete new question has emerged.

## Answer

Approved through live review on 2026-10-14. The human selected **Accept exercised interfaces** after receiving the clickable artifact, findings and limitations. The exercised candidate interfaces are accepted without revisions. This is substitution evidence for the design, not acceptance of a production extraction, migration or complete Legendary capability.

### Artifact and scope

Open [the self-contained swap prototype](../prototype/swap-prototype.html) directly in a browser. It runs offline without a server, runtime dependencies or asset requests. Source, the HTML template, focused tests and regeneration/check scripts are [beside the artifact](../prototype/).

The human approved this scope before implementation: all four subject/reward compositions, guided outcome/credit/purchase/presentation flows, two isolated synthetic saves and focused tests at the previously agreed app-coordination and storage-isolation seams. The explicit request for TDD and a commit on the current branch took precedence over the prototype skill's defaults of no tests and a separate throwaway branch. No production files, dependencies, real player saves or deployment settings changed.

### Evidence

| Case | Observed result |
| --- | --- |
| Clock learning + Garage | The subject checks string answers such as `3:00`. Five clean solved facts credit six Bolts. A five-Bolt Tires purchase commits balance one, ownership, immediate fit and selected-Goal clearing together. Reload reproduces that synthetic state. A direct repeat purchase is rejected. |
| Money learning + recruitment | The subject checks numeric cents, not clock strings. Five clean answers credit six. Two intentional three-credit purchases leave balance zero and quantity two. A third purchase rejects without changing state. This reward has no Garage ownership list, fitting, setup or Goal. |
| Money + Garage and clock + recruitment | The same generic coordinator supports the representative original pairing and non-money/non-Garage pairing. Composition selects the concrete subject, reward, presentation and explicit storage key. Bench selectors are not a proposed player-facing subject/reward selector. |
| Outcomes and abandonment | Help produces `helped`; a wrong answer followed by success produces `missed`; a missed problem replays after an intervening solved problem and can be `clean`. Abandonment retains those recorded observations but credits nothing. Old problem actions are inert after replacement. |
| Completion and presentation | The first completion credits once and increments the synthetic completed-Round counter once. Duplicate terminal notification does neither again. The Garage Goal uses supplied balance; recruitment supplies a purchase response instead. Captured before/after balances and newly-affordable facts can be re-shown without another credit or purchase. Current affordability is queried separately. |
| Rejection and write failure | An invalid debit cost discards the reward proposal without a saved snapshot. A blocked completion write keeps the coherent in-memory credit and consumed terminal guard. Duplicate completion still does nothing. A later accepted purchase saves the full latest aggregate. Restart before that write loads only the previous successful snapshot. |
| App-state isolation | Two compositions share one fake backing store but use distinct explicit keys. Complete, purchase and reload each independently. The money composition retains one Bolt and Tires while the clock composition retains three credits and one recruit. Reads/writes are confined to their selected keys, with no fallback or import. |

The prototype copies the candidate `LearningSession`, solved/terminal fact, currency-transition, reward-proposal and affordability-query shapes. `Learning` and `Reward` combine metadata and adapters for this bench only; they are not new proposed universal interfaces. The coordinator, currency arithmetic and fact types require no concrete money answer, Garage ownership or legacy `Save` type. Subject state differs between adapters and reward state differs between one-time ownership and quantity.

Garage construction requires an explicit practice-money policy/context even with clock learning. The UI labels this intentional extra capability separately and retains its $1.10 Legendary Tires hint. Only its composition requirement is exercised; actual checkout remains unimplemented in this artifact. The clock contract acquires no Pay the Shop Level or money vocabulary.

### Verification and how to rerun

Use Node 22.23.2 from `.nvmrc`. From the repository root:

```sh
npm run typecheck
npm run typecheck -- --project .scratch/reusable-learning-rewards/prototype/tsconfig.json
npx vitest run --config .scratch/reusable-learning-rewards/prototype/vitest.config.ts
npx tsx .scratch/reusable-learning-rewards/prototype/build.ts
npx tsx .scratch/reusable-learning-rewards/prototype/verify.ts
npm test
```

The prototype has seven focused Vitest checks. The Playwright check opens the standalone file with networking offline and browser storage reads/writes trapped. It clicks every guided step in all five walkthroughs, checks independently specified resulting state and confirms no browser errors or external requests. Regeneration uses the already installed TypeScript transformer supplied by `tsx`; no new dependency or production build path is introduced. The root Vitest configuration deliberately excludes scratch tests, so run the focused command separately.

### Remaining limits and next step

- Each subject supplies one fixed question. Money progression is a counter; clock progression records outcomes. This does not implement or validate money's full Mastery, Levels, introductions or unlock chain.
- Manual Next and Complete buttons stand in for success delays. Explanation locking, thinking pauses, complete cancellation behavior and real asynchronous teaching need production seam tests. No production Round controller was extracted.
- Only one Garage Bolt Mod is represented. The full catalogue, free fitting/selection, Bodies, Colours, automatic Goal fallbacks and exact Legendary payment, help, captured-context validation and cancellation still need production evidence under tickets 03-05. The explicit money context is synthetic and does not decide where a future clock app gets its money progression.
- Presentation is text-only. The typed Preact view contract, setup, Trophy policy/shelf, ordered celebrations, recorded voice, selected build assets and real iPad behavior are not proved here. The completed-Round counter is synthetic evidence for coherent completion effects, not a Trophy implementation.
- The fake store encodes current synthetic aggregates only. It does not implement version 1-4 migration/validation, unsafe-balance recovery, asynchronous backing-store ordering, storage permission or durable crash guarantees. It never reads `mtm2-save` or any browser storage. Production must keep that existing money key; the bench uses only `prototype-*` keys.

No new competing interface decision emerged in the exercised scope, so no follow-on decision ticket or fog change is needed. [08: extraction evidence and handoff](08-extraction-evidence-handoff.md) is now unblocked and remains open. It must agree the production acceptance evidence and replacement sequence; this ticket does not resolve it or authorize that extraction.
