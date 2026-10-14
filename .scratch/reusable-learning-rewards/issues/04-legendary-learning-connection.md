# Keep Legendary checkout as an explicit learning-to-reward connection

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 02, 03
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

How should the money app connect a reward purchase to a learning challenge without making the shared economy, Round implementation, or every learning adapter depend on Pay the Shop?

Legendary Mods currently open after the top Rung is owned, require exact practice-money payment, and have prices and available money determined by the player's Pay the Shop Level. Checkout reuses PayCounter and automatic help; it does not award Bolts or update Round Mastery. Preserve this behaviour in Monster Truck Money.

Decide which module requests, supplies, and validates the challenge and owns the resulting unlock. Decide what pairing the Garage with a non-money subject would mean: can an app explicitly provide the money challenge as an extra capability, or must that pairing choose another supported purchase policy? Do not silently remove Legendaries or require a telling-time adapter to pretend it has a Pay the Shop Level.

Read [Legendary checkout](../../../src/garage/Checkout.tsx), [the payment rules](../../../src/garage/economy.ts), [Garage purchase actions](../../../src/garage/garage.ts), and [PayCounter](../../../src/modes/pay/PayCounter.tsx).

Resolve through live discussion with an explicit composition rule and traces for exact payment, wrong payment, help, and closing checkout. Explain which dependencies are intentional in the money app and absent from the reusable modules.

## Answer

Approved through two rounds of live discussion on 2026-10-14. This records the explicit Legendary checkout connection, composition rule, behaviour traces and future test seams. It does not implement production extraction or another purchase policy. The ownership rules from [01](01-module-responsibilities.md#answer), learning contract from [02](02-learning-round-interface.md#answer) and purchase coordination from [03](03-currency-purchases-ownership.md#answer) still apply.

### Owners and intentional connection

| Owner | Checkout responsibility |
| --- | --- |
| Garage | Requests checkout for an eligible locked Legendary. Owns the catalogue, unchanged cash prices, top-Rung prerequisite, final purchase validation, ownership and immediate fitting. |
| Money learning capability | Supplies payment checking, PayCounter, the money tray, short/over explanations, manual and automatic help, and the money peek. It checks the submitted money, not Garage eligibility. |
| App composition | Selects the Legendary purchase policy, captures and connects the money and pricing context, owns the active checkout lifetime, coordinates validation and commits the accepted Garage change. It assembles item art, recorded speech and the committed purchase celebration. |
| Shared Round and currency | Take no part. Checkout is not a Round or an earned-currency purchase, including a zero-cost one. |

Checkout spends and earns no Bolts and updates no Mastery, Levels, stars, streaks, completed-Round counts or other Trophy progress. A practice-money payment is not an earned balance or a real-money transaction. Existing Game Mode, Level, Bolt, Rung and Garage meanings remain unchanged.

The money app deliberately depends on both Garage and the money payment capability. That connection belongs in its app-specific adapter, not the shared Round implementation, currency or every subject adapter. Reusing payment behaviour does not reuse Round completion or progression effects.

### Explicit composition rule

Every app using Garage must explicitly supply a supported Legendary purchase policy. The policy decided here is exact practice-money checkout. Monster Truck Money always uses it, with its current prices and behaviour.

An app with non-money learning may deliberately include the money checkout capability as an extra capability. Its main subject does not thereby become money learning and does not implement Pay the Shop or invent a Pay the Shop Level. That app must explicitly supply a compatible money and pricing context as part of the extra capability. This ticket does not choose the source or progression of that future app's money context.

A different Legendary purchase policy requires its own supported design before use. This ticket invents no alternative prices, earned-currency fallback or generic policy framework. Missing policy or required context is a composition error to detect before the Garage is usable, not permission to hide Legendaries, grant them freely or leave checkout silently unavailable. No runtime subject or reward selector is required.

### Captured context and candidate exchange

These are the agreed interface responsibilities, not executable interfaces or final method names:

| Seam | Inputs | Observable result |
| --- | --- | --- |
| Garage checkout request | Current Garage state, Legendary item and explicit Garage pricing context | Rejection, or the eligible item and Garage-calculated price for that context. The caller does not choose the price. |
| Money payment challenge | The requested price, matching money set and app-composed presentation, scoped to the active checkout | Empty, short, over or exact-payment result from the actual tray, with subject-owned feedback and help. An exact result supplies the paid amount, not authority to grant a Mod. |
| Garage Legendary purchase proposal | Current Garage state, requested item, captured pricing context and checked paid amount | Rejection, or proposed Garage state containing ownership and immediate fitting. No mutation, storage write or presentation effect. |
| App checkout coordination | The active checkout's bound actions and payment result | One accepted Garage change and terminal checkout state, or no saved-state change. |

At checkout entry in Monster Truck Money, the app reads the saved Pay the Shop Level, even if that Game Mode is still locked. It maps that Level to the Garage's unchanged price-table selection and money's matching denomination set. Garage receives its pricing context explicitly rather than importing the learning Level type or reading `game.value.modes.pay`. Money checking needs the price and money set, not a Slot or Garage state. The general learning interface requires neither context.

The app retains the item, pricing context, price and money set for this checkout's lifetime. A Level change while it is open does not reprice it or change its bank. All price displays, spoken amounts, help and final validation use that same captured context. Reopening captures a fresh one.

Keep the current `CASH_PRICES` values. For example, Tires cost 35 cents, $1.10 and $3.35 across the three contexts; Horn costs 95 cents, $2.90 and $8.80. Available money is pennies, nickels and dimes at Level 1; Level 2 adds quarters; Level 3 adds $1 and $5 bills. Legendary checkout keeps the $5 bill, unlike ordinary Pay the Shop questions. Context is not an extra Level gate: owning the top Rung is enough to attempt its Legendary at Level 1.

### Acceptance and commit rules

1. Garage checks that the requested Legendary is locked and its top-Rung Mod is owned before requesting checkout. Already-owned Mods still fit freely rather than opening another purchase.
2. The app creates an active checkout with bound actions and the captured context. Money checking evaluates the actual tray against the requested price. An empty tray prompts without recording a miss; short or over payment cannot propose an unlock.
3. An exact-payment result carries the checked amount to app coordination. The app accepts it only from the still-active checkout for that item and context. Callers cannot substitute a different item, Level or displayed price in a later callback.
4. Against the latest Garage state, Garage revalidates ownership, the top-Rung prerequisite and exact payment at the captured context's price. A displayed eligibility result is not purchase authorisation. A rejection publishes no saved-state change and no success celebration.
5. Validation, proposal and publication are synchronous, with no asynchronous gap or cached proposal committed later. The app publishes ownership, immediate fitting and checkout completion together. Only then does it save the combined aggregate through persistence and present the purchase celebration. There is no currency debit or learning-state update.
6. Successful publication consumes the active checkout and makes repeated success callbacks inert. Closed, replaced, completed or unknown checkout actions cannot grant or fit anything. A calculation failure before publication leaves saved state unchanged and cannot produce success presentation.

The active-checkout guard is transient app coordination, not a durable receipt history or part of the currency module. As in ticket 03, one coherent in-memory publication is not a durable transaction across a crash. Storage compatibility and failure handling remain ticket 06's work. No in-progress checkout, tray or miss count is newly persisted here.

### Feedback, help and lifetime

- Empty payment says to tap some money first. It is not a wrong answer and does not increase misses.
- Short and over payments retain their current amount-specific feedback. Each accepted wrong payment increases this checkout's miss count. The first miss explains; the second and every later miss request automatic Help me pay after the explanation. Recent Mastery does not request earlier help.
- Preserve the checkout's current lack of a Round explanation lock or thinking pause. The shared Round's five-answer lifecycle, replay rules and result reporting do not run here.
- Manual Help me pay clears the tray and fills an exact payment, largest denomination first, with the existing counting speech and pacing. Automatic help uses the same behaviour. Help never submits payment or buys automatically; the player still taps Pay. The money peek remains available and cannot change progress.
- Money tray edits or a newer help run interrupt an older fill, as they do now. All explanation-to-help continuations, prompt speech, peek speech and delayed effects retain their originating checkout's cancellation scope. They must check that scope before starting help or applying effects after an await.
- Closing, navigating away, replacement or successful purchase invalidates the checkout's actions and cancels its speech, help and delayed work. Reopening starts a new lifetime, empty tray and zero misses with freshly captured context. An old callback cannot revive or complete it.
- Explanation or help failures cannot grant ownership, report a solved Round problem or leave controls locked. They do not become a successful payment. Current active-checkout validation remains required even when cancellation has already been requested.

The cancellation and coherent-commit rules describe the future extraction contract, not guarantees already established by the existing implementation. Today `Checkout` passes a stub `RoundApi`, `PayCounter` has its own help-run counter, and `buyLegendary` publishes unlock and fit through separate updates. No production fix is made in this design ticket.

### Concrete traces

**Exact payment.** Tires' top Rung is owned and its Legendary is locked. Checkout captures Pay the Shop Level 2, so Garage requests $1.10 and money offers quarters, dimes, nickels and pennies. The player submits four quarters and a dime. Money checks 110 cents; app coordination checks the active checkout; Garage rechecks the current prerequisite, ownership and captured price. One publication unlocks and fits `tires:4` and completes checkout, then the app celebrates. Bolts, learning and Trophies are unchanged. Repeating the payment callback does nothing. If the saved Pay Level changed after opening, this checkout still costs $1.10.

**Wrong or empty payment.** In that same checkout, an empty tray produces the prompt and leaves misses at zero. A $1.00 tray is short by 10 cents and records the first miss; a $1.20 tray is over by 10 cents and records the second. Both get their current explanations, neither changes saved state, and the second explanation requests automatic help. There is no Round lock or thinking pause. Checkout never offers to pay the difference in Bolts.

**Help and explicit payment.** Manual help, or automatic help after the second miss, clears the $1.20 tray and counts four quarters and a dime into it. Reaching $1.10 does not buy Tires. Tapping Pay sends the exact amount through the same final validation as an unhelped payment. The peek can show and name every offered denomination without creating Mastery or Trophy effects. At Level 3, Horn's $8.80 help can use a $5 bill, three $1 bills, three quarters and a nickel.

**Closing and reopening.** The player closes during the second-miss explanation or a help fill. App coordination invalidates the active checkout and cancels its effects; there is no unlock, fitting or balance change. A late explanation resolution cannot start help, and a late paid callback cannot buy anything. Reopening creates a distinct checkout with an empty tray, zero misses and the current money context. Old work cannot affect it even if it is for the same Slot.

**Changed eligibility or duplicate success.** Before final publication, Garage finds the item already owned or its top-Rung prerequisite no longer present. It rejects without changing ownership, fit, Bolts or learning state and without a success celebration. If another callback follows an already-committed purchase, the completed-checkout guard rejects it before another grant or fit. Ordinary tapping of an owned Legendary remains a free fit, not a repeated purchase.

**Non-money learning with Garage.** App composition explicitly supplies the money checkout policy and its context alongside the clock subject. Garage requests its Legendary through that policy, and the money capability checks the tray without calling clock checking or progression. Neither clock nor shared Round needs money types. Omitting that policy or context fails composition; no Legendary disappears. This is a composition example, not a clock curriculum or a second-app implementation.

### Permitted dependencies and future verification

- The money app's adapter may import concrete Garage rules, money payment behaviour, the saved money context and their presentation. That dependency is intentional and local to this pairing.
- Garage rules retain their catalogue, cash-price tables, prerequisites and ownership. They accept explicit pricing and payment inputs, not the global saved game, PayCounter, money denomination types or subject progression. They do not write storage themselves.
- Money payment checking and teaching know money and the requested price, not Garage ownership, fitting, catalogue identifiers or global purchase actions. The app supplies the Legendary art and speech. A small counter interaction interface can serve a Round adapter and a checkout adapter without making the general learning contract expose purchase operations.
- Shared Round, currency and non-money subject adapters import no Legendary policy, PayCounter, Pay Level or Garage catalogue. Checkout sends no Round results, currency earnings or Trophy events. Typed recorded speech, missing-clip build checks and offline operation remain required; detailed presentation/build composition belongs to ticket 05.

The user approved three future TDD seams: money payment checking/help, Garage Legendary eligibility/pricing/purchase proposals, and app checkout coordination through observable aggregate state and checkout status. Exercise the traces above rather than private miss counters, cancellation tokens or guard collections. Include empty/short/over/exact payment, manual and second-miss help without automatic purchase, the Level 3 $5 bill, captured context, current-state eligibility rejection, duplicate success, closing/replacement and late callbacks. Verify that help failures cannot grant ownership or lock controls, and that no path changes currency, learning or Trophy state.

This design-only ticket adds no executable interfaces or tests. Existing `economy.test.ts` and `pay.test.ts` provide evidence for current cash prices, exact-payment rejection, denomination sets and help calculations, not proof that the proposed app coordinator or cancellation contract exists. Production extraction must use red-green tests at the approved seams.

Tickets 05 and 06 retain presentation/build composition and save compatibility. Tickets 07 and 08 retain swap evidence and the extraction handoff. No downstream ticket, alternative policy, save migration, production refactor or new app is implemented here.
