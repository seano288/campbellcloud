# Place the seams between learning, currency, and rewards

Type: grilling
Label: wayfinder:grilling
Status: resolved
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

Which modules should own each behaviour and piece of state, and where should the seams live so learning and rewards can vary independently without imposing Garage rules on another reward?

Decide the ownership and permitted dependency directions for question generation and checking, the Round lifecycle, help and retries, Mastery and Levels, earnings, currency balance, purchases, ownership and fitting, Goals, Trophies, presentation, and saved progress. Establish the role of app composition, rather than assuming exactly three modules can own everything.

Use current money practice with the Garage and the proposed telling-time/non-Garage pairing as concrete cases. Treat one-time Garage unlocks and possible repeated recruitment as contrasting design scenarios, not settled army-game requirements. Identify intentional connections such as Legendary checkout separately from accidental imports.

The current coupling is visible in [the Game Mode interface](../../../src/modes/mode.ts), [the Round coordinator](../../../src/round/round.ts), [the Garage economy](../../../src/garage/economy.ts), [the saved-game schema](../../../src/save/migrate.ts), and [Trophies](../../../src/trophies/trophies.ts).

Resolve through live discussion with an ownership model, dependency rules, and agreed terms. Do not design every downstream method here or change production code. Narrow generic vocabulary without changing what Bolt, Game Mode, or Garage means in the existing money app.

## Answer

Approved through live discussion on 2026-10-14. This decides responsibilities and dependency directions only. It does not authorise production extraction, prescribe every interface method, or resolve another ticket.

### Agreed terms

- **Subject** is the learning area, such as money or telling time. It is not another name for Game Mode, which still means one of the existing three kinds of money practice.
- **Earned currency** is the design term for the balance credited from learning results and spent on reward purchases. In Monster Truck Money it is still called Bolts, with the same earnings, icon and recorded phrases. It is not practice money or a new player-facing name.
- **Reward module** means the purchasable experience, such as the Garage or a possible recruitment experience. It does not mean currency earnings or Trophies, which have different owners.

Existing Game Mode, Level, Mastery, Round, Bolt, Garage, Goal and Trophy meanings in the money app remain unchanged. A shared Round implementation does not require another subject to use money's Game Mode identifiers, Level structure or curriculum.

### Ownership model

| Module | Behaviour and state it owns | What it does not own |
| --- | --- | --- |
| Subject learning | Problem generation, answer checking, subject-specific explanations and teaching, replay content, introductions, progression state and rules. Money owns its three Game Modes, unlock chain, Mastery window, Levels and stars. | Currency earnings, balance, reward purchases or Garage-specific presentation. |
| Shared Round | The current five-answer lifecycle, attempt and help tracking, retry and replay scheduling, transient problem and queue state, and completion or abandonment. It schedules when explanations and help run; subject learning supplies what they teach. | Money types, subject progression rules, balance, reward eligibility or Trophy policy. |
| Currency | Earned balance, valid credit and debit rules, and calculating and crediting earnings using the app-supplied policy and learning result facts. | Subject correctness, item prices, catalogues, ownership, fitting or Goals. |
| Reward | Catalogue, prices, affordability using the supplied balance, purchase eligibility and prerequisites, purchase validation, ownership changes and Goal selection. Garage additionally owns Bodies, Mods, Colours, fits and selected Goal state. | Learning progression, the earned balance or a universal one-time-unlock rule. |
| Trophies | Streaks, completed Round and day counts, earned Trophy steps and dates, and Trophy checks. Learning milestones come from subject facts and app-supplied milestone rules. | Spendable currency, purchased rewards or Garage fitting. Showing the Trophy Shelf in the Garage does not transfer ownership. |
| App composition | Selection and wiring of modules, earnings policy, learning milestone rules, navigation, coordinated cross-module commits, presentation assembly and explicit learning-to-reward connections. It composes the aggregate saved state. | Reimplementing subject checking, currency arithmetic or reward eligibility rules. |
| Persistence | Loading and saving the app-composed state. App-specific save adapters own compatibility with the stored representation; each module owns validation of its own state. | Defining domain state for all modules through one shared Save type. |

Subject learning supplies problem and introduction presentation. The reward supplies its art and Goal presentation. The app assembles Home, Round screens, currency display, reward entry and first-launch setup, Trophy placement, voice and celebrations. Shared sequencing may be reused, but Truck art, money introductions, Bolt branding and recorded phrases are not requirements of every app.

### Permitted dependency directions

- App composition may depend on the concrete subject, Round, currency, reward, Trophy and persistence modules and their interfaces. App-specific adapters may intentionally connect those concrete choices.
- Shared Round calls a learning interface for subject behaviour and reports learning result facts. It must not import concrete money modes, Garage actions, currency display, the aggregate Save or the app's phrase catalogue.
- Currency consumes result facts and the app's earnings policy. It must not import the Round coordinator, subject curriculum or a reward catalogue. Trophies consumes progress facts and app-supplied milestone rules, not hard-coded money Game Mode identifiers or Garage state.
- Reward rules use their own state, a supplied balance and explicit purchase inputs. They must not reach into the global saved-game signal for another module's state or make the shared currency module understand Mods, Bodies or recruitment.
- Reusable modules may use the explicit interfaces and fact types needed at their seams, not another module's concrete implementation. Those contracts belong with their owning modules, not in the persistence schema. Module state must not depend on the current all-in-one Save type.
- Presentation dependencies run from app assembly to subject and reward presentation. Shared logic must not pull another app's artwork, branding or global phrase catalogue into a build. Preserve typed recorded phrases, missing-clip build failures, static offline operation and the storage seam from ADR-0001.

The seams separate subject behaviour from Round scheduling, learning results from earnings, balance changes from reward purchases, and module-owned state from app persistence. This is not a requirement to squeeze all behaviour into exactly three modules or to introduce a generic game framework.

### App coordination and saved progress

The app coordinates cross-module changes while the modules retain their rules. A reward validates a proposed purchase and ownership change; currency validates its debit. The app commits the combined result so rejection cannot charge the balance and failed payment cannot grant the reward. Detailed purchase and failure contracts belong to ticket 03.

At Round completion the app coordinates learning results, Trophy effects and currency credit. It must credit the completed Round once, rather than letting a celebration or repeated notification issue another credit. Already-recorded answer progress and streak effects remain when a Round is abandoned, as they do now; abandoning does not earn Round currency. The transient Round lifecycle is distinct from saved learning progress.

Each module owns its state and validation, but does not independently write browser storage. App composition gathers and commits module state through app-specific save adapters and the persistence seam. Preserve existing progress and the money app's storage identity. This ownership decision does not require changing the on-disk representation, adding a save version or resetting data. Ticket 06 decides compatibility mechanics and separate-app storage isolation.

### Concrete cases

**Money with Garage.** Money supplies the existing questions and progression. The Round schedules five correct answers with retries, automatic help and a missed problem returning once later when space remains. Currency applies the app's unchanged policy: one Bolt per first-try answer without help, plus one for finishing. Five clean answers earn six Bolts; two clean answers and three helped or missed answers earn three. The app commits earnings and Trophy effects, then assembles the existing celebration and Garage Goal presentation.

**One-time unlock versus possible recruitment.** Garage rejects buying an already-owned Mod without charging, and fitting an owned Mod is free. A hypothetical recruitment reward could accept another purchase of the same kind and increase its owned quantity if payment succeeds. Currency only validates and applies the amount, not whether that reward can be bought once or repeatedly. This contrast tests the ownership decision; it does not specify army mechanics, prices, units or a recruitment interface.

**Telling time with a non-Garage reward.** Subject learning can supply a clock question, its answer check, explanation and introduction without MoneyKey or Pay the Shop Level types. Shared Round reports the same kinds of attempt and completion facts. The app supplies an earnings policy and currency presentation, and the reward owns its purchases, ownership and any saving target. No money curriculum, Mod fitting or Garage Goal-selection rule is required. The same directions must permit money with a non-Garage reward and non-money learning with Garage, without a runtime subject or reward selector.

**Legendary checkout.** This is an intentional money-app connection, not an accidental dependency to copy into shared modules. The app-specific adapter connects Garage purchase validation to the money learning capability reused by Pay the Shop. Garage retains ownership, the top-Rung prerequisite and Legendary price rules. Checkout uses the Pay the Shop Level's price and available money set when it opens, requires exact practice-money payment, and retains help. It spends and earns no Bolts and updates no Round Mastery. Shared Round, currency and the general subject interface do not require PayCounter or a Pay the Shop Level. A non-money/Garage app must explicitly supply a supported checkout capability or purchase policy, not silently omit Legendaries or pretend its subject has a Pay the Shop Level. Ticket 04 decides that composition contract.

### Remaining design work

Ticket 02 defines the subject/Round interface, including asynchronous explanations, cancellation and progression facts. Ticket 03 defines currency and purchase contracts, ticket 04 the Legendary connection, ticket 05 presentation and build composition, and ticket 06 save compatibility. Tickets 07 and 08 remain the swap evidence and extraction handoff. Their questions stay open; no production interfaces, migration or prototype are implemented here.
