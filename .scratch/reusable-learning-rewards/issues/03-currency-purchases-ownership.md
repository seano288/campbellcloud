# Separate earned currency from reward purchases and ownership

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 01, 02
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

What should the reusable earned-currency module own, what should each reward own, and what interface coordinates earnings and spending with reward purchases?

Decide where the earnings policy, balance, prices, affordability, purchase validation, ownership changes, purchase prerequisites, and Goal selection belong. Do not assume the existing Garage Wallet is a generic wallet: it contains Mods, Bodies, Colours, and a Garage Goal.

Use a one-time Mod unlock and a possible repeatable recruitment purchase as contrasting scenarios. The latter is an interface stress test, not a commitment to army mechanics. Decide how callers prevent charging for a rejected purchase or granting a reward without a successful payment, and how Round completion credits currency once. Decide how the visible currency name, icon, and recorded phrases remain app-specific while current Bolt earnings and prices stay unchanged.

Read [Garage prices and purchases](../../../src/garage/economy.ts), [Garage actions](../../../src/garage/garage.ts), [Round earnings](../../../src/round/rules.ts), and [the Round completion path](../../../src/round/round.ts).

Resolve through live discussion with the candidate currency and reward-purchase interfaces, their state owners, and success and failure traces. Keep cash payment for Legendary Mods distinct from the earned balance; its intentional learning connection has a separate decision ticket.

## Answer

Approved through two rounds of live discussion on 2026-10-14. This records candidate currency and purchase interfaces, coordination rules and future test seams. It does not implement production extraction, change saved data or resolve another ticket. The ownership decisions from [01](01-module-responsibilities.md#answer) and result facts from [02](02-learning-round-interface.md#answer) still apply.

### State and rule owners

| Owner | Responsibilities |
| --- | --- |
| Currency | Earned balance, valid amounts, credit and debit arithmetic, and calculating earnings from completed learning facts using the app-supplied policy. No catalogue, ownership, fitting, Goal or subject progression. |
| Reward | Catalogue and prices, affordability using the supplied balance, eligibility and prerequisites, purchase validation and proposed ownership changes. Garage additionally owns Bodies, Mods, Colours, fitting, Body selection and the selected Goal. |
| App composition | Earnings policy, concrete module wiring, synchronous cross-module commits, the session-local Round completion guard, and currency presentation. It coordinates the rules rather than repeating their arithmetic or purchase decisions. |
| Persistence | Loading and saving the app-composed state through app-specific save adapters. Modules do not independently write storage. Compatibility and storage-failure handling remain ticket 06. |

The existing `Wallet` in `src/garage/economy.ts` is a Garage-specific combination of Bolts, unlocked Mods, owned Bodies, Colours and Goal state. It is not the reusable currency state. Module-owned state must not extend the aggregate `Save` type or require another reward to represent ownership as one-time unlocks.

### Candidate currency interface

```ts
interface CurrencyState {
  readonly balance: number;
}

type CompletedRound = RoundResult & { readonly status: 'completed' };
type EarningsPolicy = (result: CompletedRound) => number;

type CurrencyFailure =
  | 'invalid-balance'
  | 'invalid-amount'
  | 'insufficient-funds'
  | 'overflow';

type Change<S, E> =
  | { kind: 'accepted'; state: S; amount: number }
  | { kind: 'rejected'; reason: E };

interface Currency {
  earn(
    state: CurrencyState,
    result: CompletedRound,
    policy: EarningsPolicy,
  ): Change<CurrencyState, CurrencyFailure>;

  debit(
    state: CurrencyState,
    amount: number,
  ): Change<CurrencyState, CurrencyFailure>;
}
```

`RoundResult` is ticket 02's subject-independent result. A completed result contains five ordered solved results and its stable `roundId`; an abandoned result is not an earnings input. Currency consumes these facts, not a Round controller, Game Mode, Level, learning state or reward catalogue.

Both operations return proposed currency state without mutating inputs, writing storage or running presentation. On acceptance, `amount` is the non-negative magnitude credited or debited. Expected validation failures return a rejected result, not an exception. A rejection supplies no replacement state.

Balances and amounts must be non-negative safe integers. Zero is valid. Negative values, fractions, `NaN`, infinity and unsafe integers are rejected. A debit cannot exceed the balance, and a credit cannot overflow the safe-integer range. Currency validates the earnings policy's returned amount as well as debit inputs. The app supplies a deterministic policy that only calculates an amount; it cannot mutate learning, reward or currency state.

`earn` does not itself deduplicate calls. The app-owned completion operation below is the only live route from Round completion to earnings. Presentation never calls `earn` or `debit`.

### Candidate earned-currency purchase interface

```ts
type PurchaseProposal<S, E> =
  | { kind: 'ready'; state: S; cost: number }
  | { kind: 'rejected'; reason: E };

interface RewardPurchases<S, Request, Failure> {
  proposePurchase(
    state: S,
    request: Request,
    balance: number,
  ): PurchaseProposal<S, Failure>;
}
```

These signatures describe the agreed seams, not final source-file locations or a generic reward framework. `S`, `Request` and `Failure` are reward-owned. A Garage request identifies a Mod, Body or Colour and the intended Garage action, not a caller-chosen price. A possible recruitment request could identify another reward's purchasable kind. No universal `Buyable`, owned-item list, quantity field, fitting operation or Goal type is required.

The reward uses its current state and supplied balance to check eligibility, prerequisites and affordability. It returns its own rejection reason or a price with proposed reward state. The operation has no mutations, storage writes, presentation effects or payment side effects. Read-only affordability displays also use reward rules with the supplied balance; the app does not duplicate catalogue rules.

For Garage actions, the proposal includes the immediate fit, Colour application or Body switch where the current tap action does so. It also clears the selected Goal when that item is purchased. Tapping an already-owned Mod or Colour still fits it freely; choosing an owned Body still switches freely. These free actions do not create another purchase or debit. A direct attempt to purchase an owned item is rejected.

### Purchase coordination and failure rules

App composition processes a purchase as one synchronous operation:

1. Read the latest aggregate state, including the currency balance and reward state. A displayed affordability result is advisory, not payment authorisation.
2. Ask the reward to propose the requested purchase against that state and balance. If rejected, publish no change and do not debit currency.
3. Pass the returned cost to currency's `debit`, using the same current currency state. Currency independently validates the amount and funds. If rejected, discard the reward proposal too.
4. Only after both accept, publish one aggregate change containing both proposed states, including any purchase-related fitting, Body selection and Goal change. Save that combined state through the app's persistence seam.
5. Present the committed outcome. Replaying speech or a celebration does not run another purchase.

There is no asynchronous gap or independently published intermediate state between reading, proposing, validating and committing. Proposals cannot be cached and later committed against changed state. A later request starts again with the latest aggregate state. An unexpected calculation failure before publication also leaves both states untouched; there is no charge-then-refund or grant-then-revoke path.

Atomic here means one in-memory aggregate publication, not a durable transaction across a crash. Existing storage keeps playing from memory when saving is blocked or full. Ticket 06 must preserve a coherent saved aggregate and decide persistence failure and compatibility mechanics. This ticket does not add a receipt ledger, backend transaction or new save version.

### Completion credit and the session-local guard

The app accepts a terminal result only for its active Round identity. Round's result remains the sole source of completion facts. An abandoned result, even with five solved results during the final delay, earns nothing. The app records abandonment as terminal so it cannot later accept completion for that Round.

For completion, the app first checks that the Round is active and its terminal result has not been committed. It asks currency to calculate and propose the credit using the app's policy, and Trophies to propose completion effects. It then publishes currency, Trophy completion effects and the session-local terminal guard together. All calculations and publication are synchronous. If a calculation fails or currency rejects, publish none of those effects and leave the completion guard unconsumed. Earlier answer progress and streak effects remain as ticket 02 specifies.

After a successful completion commit, the committed amount and effects supply end presentation. Repeated completion notifications or re-showing the celebration do nothing to currency or Trophies. Duplicate terminal results, results for unknown or inactive Rounds, and old callbacks arriving after a replacement Round cannot start another credit. A newly started Round has its own identity and is eligible for its own completion credit.

This is a once-per-Round guarantee within the app session, not durable delivery across restarts. In-progress Rounds remain transient and old terminal notifications are not replayed after loading. The guard is app-owned transient coordination state, not part of the currency balance or a permanent saved receipt history. Save adapters and storage-failure handling remain ticket 06's work.

### Unchanged money-app rules and presentation

- The app's earnings policy remains one Bolt per `clean` solved result plus one for completion. Five clean answers earn six; two clean and three helped or missed answers earn three; no clean answers still earn one. A replay can earn a clean-result Bolt. Abandonment earns none.
- Garage Bolt prices remain 5, 15 and 30 by Rung, 30 for each bought Body, and 3 for each bought Colour. Starter Bodies, Red and default Mods stay free. No new rung-by-rung prerequisite is introduced for Bolt Mods.
- Garage owns Goal selection. A chosen locked Bolt item stays selected; otherwise choose the cheapest locked Mod or Body, breaking ties by catalogue order. A Colour is selected automatically only when no other Bolt purchases remain. An owned selection falls back, and a Legendary is never the Goal. Currency only supplies the balance used for affordability and progress display.
- App presentation keeps the Bolt name, icon and recorded phrases. Shared currency contains none of those assets or phrase types. Another app supplies its own currency presentation without changing the money app's terms, earnings or prices. Typed recorded speech, missing-clip build failures and offline operation remain required; detailed presentation assembly belongs to ticket 05.
- Legendary purchases remain a distinct cash path, not a zero-cost earned-currency purchase. Garage retains ownership, the top-Rung prerequisite and unchanged Level-based cash prices. Checkout uses exact practice-money payment at its captured Pay the Shop Level and earns or spends no Bolts. Ticket 04 decides the explicit learning connection and supported composition for another subject; it is not resolved here.

### Success and failure traces

| Scenario | Observable outcome |
| --- | --- |
| Locked `tires:2`, 16 Bolts, cost 15 | Commit balance 1, Mod ownership and its immediate fit together. |
| Direct purchase of already-owned `tires:2`, 16 Bolts | Reward rejects; balance, ownership, fit and Goal do not change. A normal tap may still fit the owned Mod freely. |
| Locked `tires:2`, 14 Bolts | Reward rejects affordability; no charge or grant. Currency also rejects a debit of 15 from 14. |
| Reward proposes an invalid cost, or debit otherwise rejects | Discard the reward proposal; neither state changes. |
| A display showed enough Bolts, but an earlier purchase spent them | Re-evaluate from the latest aggregate state; no stale proposal or displayed balance authorises payment. |
| Buy a chosen Colour with 5 Bolts | Commit balance 2, ownership, the current Body's Colour and any existing Plain-Paint fallback together; clear that selected Goal. |
| Buy a chosen Body with 35 Bolts | Commit balance 5, ownership and the switch to that Body together; clear that selected Goal. |
| Two intentional repeatable recruitment purchases | The hypothetical reward may accept both, each time validating the latest state, debiting its own price and increasing quantity. Insufficient funds or reward rejection on either attempt leaves that attempt unchanged. This specifies no army mechanics or price. |
| Five clean answers, completion reported twice | First commit credits six Bolts and applies Trophy completion effects; the second changes neither. |
| Two clean and three helped or missed answers | Completion credits three Bolts. Five helped or missed answers credit one. |
| Leave during the final delay after five solved answers | Abandoned terminal result, no earnings or Trophy completion effects; already-recorded learning and streak effects remain. |
| Late completion from an old Round after a new one starts | No credit and no effect on the new Round's guard. |
| Earnings policy returns an invalid amount | No currency or Trophy completion commit, no consumed completion guard and no success presentation. |
| Legendary checkout succeeds or rejects | Separate cash and reward validation; earned balance is unchanged either way, with no Round earnings or Mastery effects. |

The same earned-currency contract can consume non-money learning facts and coordinate either reward. It does not require money types, Mods or one-time ownership. Repeatable purchases are an interface stress test only, not a requirement to implement recruitment or a duplicate-request delivery protocol.

### Agreed future verification seams and remaining work

The user approved three future TDD seams: currency transitions through `earn` and `debit`, reward proposals through `proposePurchase`, and app coordination of purchases and terminal Round facts. Tests should cover the traces above through returned results and observable aggregate state, not private proposal helpers, guard collections or storage internals. Include invalid amounts and overflow, rejected purchases and debits, stale affordability, free fitting, repeatable purchases, duplicate completion, abandonment and late old-Round callbacks. A repeatable adapter is design evidence, not a production army module.

This design-only ticket adds no executable interfaces or tests. Existing Garage economy and Round rules tests are evidence of current prices, purchases, Goals and earnings, not proof that the proposed extraction or atomic coordinator exists. Production implementation must use red-green tests at these agreed seams.

Tickets 04, 05 and 06 retain the Legendary connection, presentation/build composition and save compatibility decisions. Tickets 07 and 08 retain swap evidence and the extraction handoff. No downstream ticket, production refactor, browser save migration or new app is implemented here.
