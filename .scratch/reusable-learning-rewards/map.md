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

## Not yet specified

- Follow-on design choices exposed by the swap prototype. We cannot yet name which proposed contracts will leak money or Garage assumptions, or which competing fixes those failures will require. Turn concrete findings into new decision tickets only if they cannot be settled within the prototype ticket; do not pre-plan speculative fixes.

## Out of scope

- Production extraction, implementation tickets, or a finished extraction spec document. This map finds and records the design decisions for a subsequent handoff.
- Building or deploying the telling-time app, defining its curriculum, or designing the full army-building game. A minimal non-money prompt and non-Garage reward may appear only as design evidence.
- New learning modes, new Garage content, rebalanced prices or earnings, redesigned celebrations, or resetting existing progress.
- A general game framework, arbitrary lesson authoring, or runtime switching between subjects and rewards.
- Published shared packages, separate-repo distribution, accounts, backend storage, cross-app wallets or progress sync, and native app packaging.
