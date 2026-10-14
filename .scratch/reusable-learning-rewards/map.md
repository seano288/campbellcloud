# Map: Reusable learning, currency, and rewards

Label: wayfinder:map

## Destination

A build-ready extraction design for independently reusable learning, earned-currency, and reward modules in Monster Truck Money, preserving its behaviour and saved progress. The route is clear when responsibilities, interfaces, composition, save compatibility, and verification are decided, with a small throwaway swap prototype available to test the design before production refactoring is handed off.

## Notes

- Planning only. Tickets resolve design decisions, not production implementation slices. A throwaway prototype is allowed to answer a design question; it is not permission to refactor the production app or build the next app.
- The motivating example is telling time with army-building. Independently substituting learning and rewards should also permit money practice with a non-Garage reward and non-money practice with the Garage at the code level. No player-facing subject or reward selector is required.
- Target shared source in this repo, with separate app builds eventually. Do not introduce a published package or package-release workflow for this effort.
- Start with the current five-answer Rounds, retries, automatic help, replay of missed problems, and Mastery-driven Levels. Subject-specific questions, explanations, and introductions belong with learning. This is not an arbitrary lesson engine.
- Preserve current behaviour and saved progress, including Bolts, Garage purchases and fits, Legendary checkout, Trophies, Goals, voice, and celebrations. Legendary checkout is an intentional learning-to-reward connection to accommodate explicitly, not erase.
- Keep the existing static, offline-capable iPad app and recorded-voice guarantees. Consult [the stack decision](../../docs/adr/0001-vite-preact-static-stack.md), [the glossary](../../GLOSSARY.md), and [the local tracker operations](../../docs/agents/issue-tracker.md). Existing Game Mode, Level, Bolt, and Garage terms describe the money app; any broader vocabulary must be agreed rather than silently redefining them.
- Design sessions invoke `grilling`, `domain-modeling`, and `codebase-design`; prototype sessions also invoke `prototype`. Apply `unslop` to writing. HITL tickets require the human's live answers and approval.
- Use the local tracker's `Type`, `Status`, `Map`, and `Blocked by` fields. Open tickets have `Status: open`; claim by saving `Status: claimed` before work, and resolve under `## Answer` with `Status: resolved`. Query child files for the frontier instead of listing open tickets here. Re-read relevant files before updates because other sessions may be working concurrently.
- Charting hand-resolves no tickets. Later sessions resolve at most one ticket, then update this index and graduate newly precise questions from the fog. Answers live only in their tickets.

## Decisions so far

- [01: Module responsibilities](issues/01-module-responsibilities.md#answer) resolved through live discussion. Records the ownership model, permitted dependencies and app composition role. Detailed interfaces and compatibility remain in the downstream tickets.
- [02: Learning/Round interface](issues/02-learning-round-interface.md#answer) resolved through live discussion. Records the subject-owned checker and progression, shared lifecycle, cancellation and result facts, with behaviour traces and a minimal non-money example.
- [03: Currency, purchases and ownership](issues/03-currency-purchases-ownership.md#answer) resolved through live discussion. Records candidate currency and reward-purchase interfaces, combined purchase commits, session-local completion deduplication and agreed future test seams.
- [04: Legendary learning connection](issues/04-legendary-learning-connection.md#answer) resolved through live discussion. Records the explicit checkout composition rule, captured context, payment and Garage validation, cancellation, behaviour traces and agreed future test seams.
- [05: Presentation composition](issues/05-presentation-composition.md#answer) resolved through live discussion. Records the candidate reward presentation interface, app-owned screen assembly, Goal and affordability cues, shared celebration sequencing, selected typed voice/assets and separate static build responsibilities, with agreed future test seams.
- [06: Save compatibility and isolation](issues/06-save-compatibility.md#answer) resolved through live discussion. Records module-state mapping behind the unchanged version-4 money save and storage key, coherent commits and write-failure behavior, legacy recovery and newer-version limits, explicit per-app keys, and synthetic compatibility/isolation evidence at agreed future test seams.
- [07: Swap prototype](issues/07-swap-prototype.md#answer) resolved with human acceptance of the exercised interfaces, without revisions. Links the throwaway artifact and cross-pairing, purchase, presentation and synthetic isolation evidence, with explicit limits for the production handoff in 08.
- [08: Extraction evidence and handoff](issues/08-extraction-evidence-handoff.md#answer) resolved through live discussion. Records required production regression, save, build, offline and human iPad evidence, real-module substitution/build fixtures, and the gated replacement order. The design is ready for a subsequent implementation handoff; no extraction or production release is accepted here.

## Not yet specified

- No in-scope design decision remains open after 08's child-status and prototype-fog review. Newly exposed in-scope design conflicts must become decision tickets before the affected extraction work proceeds; future-app curriculum and reward mechanics remain outside this map.

## Out of scope

- Production extraction, implementation tickets, or a finished extraction spec document. This map finds and records the design decisions for a subsequent handoff.
- Building or deploying the telling-time app, defining its curriculum, or designing the full army-building game. A minimal non-money prompt and non-Garage reward may appear only as design evidence.
- New learning modes, new Garage content, rebalanced prices or earnings, redesigned celebrations, or resetting existing progress.
- A general game framework, arbitrary lesson authoring, or runtime switching between subjects and rewards.
- Published shared packages, separate-repo distribution, accounts, backend storage, cross-app wallets or progress sync, and native app packaging.
