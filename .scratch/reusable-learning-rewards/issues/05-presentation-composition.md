# Compose Goals, celebrations, voice, and app presentation

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 02, 03, 04
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

What does app composition need from the learning, currency, and reward modules to present Home, Rounds, Goals, celebrations, and recorded voice without shared callers importing money or Garage details?

Decide the smallest presentation interface for the reward entry point, first-launch setup, currency display, saving toward a Goal, newly affordable rewards, end-of-Round celebration, and Trophies. Distinguish shared sequencing and learning facts from reward art, subject-specific introductions, and spoken phrases. State what should deliberately remain app-specific rather than wrapping every UI element in a generic adapter.

Decide how shared source supports separate app builds without importing the entire money/Garage phrase catalogue, artwork, or app branding into another app. Preserve typed recorded phrases, build failure for missing clips, static deployment, offline operation, and the current app's behaviour. This ticket defines the composition approach; it does not configure or deploy the second app.

Read [app composition](../../../src/app/App.tsx), [Home](../../../src/app/Home.tsx), [the Round screen](../../../src/round/RoundScreen.tsx), [the end overlay](../../../src/round/EndOverlay.tsx), [the Goal bar](../../../src/garage/GoalBar.tsx), [the Truck celebration](../../../src/celebrate/roundShow.tsx), [voice phrases](../../../src/voice/phrases.ts), [the voice build check](../../../tools/voice-check.ts), and [Vite configuration](../../../vite.config.ts).

Resolve through live discussion with a candidate composition interface and an account of which presentation and build decisions a new app supplies. Do not build alternate artwork or redesign the existing screens.

## Answer

Approved through three rounds of live discussion on 2026-10-14, including the candidate interface, failure behaviour and future TDD seams. This records a composition design, not production extraction or second-app configuration. The responsibilities from [01](01-module-responsibilities.md#answer), learning contract from [02](02-learning-round-interface.md#answer), committed outcomes from [03](03-currency-purchases-ownership.md#answer) and explicit Legendary policy from [04](04-legendary-learning-connection.md#answer) still apply.

### App assembly and candidate presentation interface

Home, start and end-of-Round screens remain app-specific. Share Round behaviour and useful layout, not one generic screen configuration that every app must implement. App composition imports its concrete subject, reward and presentation choices. Shared callers receive supplied views, actions and facts without importing money, Garage, the aggregate saved game or an app phrase catalogue.

The reward supplies a small presentation interface:

```ts
import type { ComponentType } from 'preact';

interface RewardPresentation {
  Entry: ComponentType<{ onOpen(): void }>;
  setup: null | {
    View: ComponentType<{ onDone(): void; signal: AbortSignal }>;
  };
  Goal?: ComponentType<{ balance: number }>;
}
```

This is the output of an app-specific presentation factory, not its full dependency specification, a required source location or an executable interface. The factory binds reward-state readers, validated app-coordinated actions, recorded voice and any explicit checkout context to its views. Goal rendering reads current reward state and pricing context, not a stale construction-time snapshot. The factory's concrete inputs remain app-specific rather than becoming another universal context type. These interface, query and sequencer names are candidate technical names, not new domain terms.

Views cannot independently write storage or call shared currency transitions. Setup's closure-bound confirmation action validates the active setup and selected starter against current reward state. Only an accepted commit permits `onDone` to navigate; rejection or calculation failure leaves setup active without navigation or a saved-state change. An inactive action is inert. Preview, selection and speech remain local to the setup view.

- `Entry` supplies the reward's art and accessible label and invokes the supplied navigation action. Monster Truck Money keeps its Truck tile and Garage destination. Another reward need not call its destination Garage.
- `setup` is `null` when the reward needs no first-launch setup or it has already been completed. For Garage, a missing selected Body requires the current starter-Body picker. Choosing a card previews and speaks its name; confirming commits the choice through app coordination before `onDone` navigates Home. No generic starter-item or onboarding-step model is required.
- Setup status is derived from current reward state, not cached forever in an app configuration. Leaving or replacing setup cancels its speech and invalidates its bound actions. A late completion cannot commit a choice or navigate a replacement screen. Leaving before confirmation does not count as completion.
- `Goal` is optional. It owns target selection, progress art, readiness, labels and tap speech using supplied balance and bound reward state. Shared layout does not calculate prices, select an item or require a common Goal data model.

The app's currency display receives a count. Monster Truck Money keeps the Bolt name, icon, accessible label and recorded phrases. Shared currency only supplies balance and committed changes, not that presentation. During the end show, a displayed count can animate from the captured pre-credit balance to the committed balance without changing currency state.

The app assembles Home and Round headers from currency display and optional Goal presentation. Shared Round layout receives the subject's typed problem view, optional introduction, read-only Round display facts and supplied header/end content. Subject-specific answer controls, money peeks, explanations and introductions remain with learning. Introduction acknowledgement and cancellation follow ticket 02; a late introduction action cannot acknowledge another Round, and an introduction left unacknowledged remains pending.

Trophies remain separate from purchases. The Trophy module supplies earned steps and progress using app-supplied subject milestone rules. App composition selects the shelf presentation, labels, art, recorded phrases and placement. Monster Truck Money retains the shelf inside Garage, its Learning, Skill and Sticking with it planks, grey unearned silhouettes and counting-Trophy upgrades in place. Another reward does not acquire Trophy policy just because it hosts the shelf. Shared Trophy rules must not require money Game Mode identifiers or the money phrase catalogue.

Do not introduce adapters for every button, icon, fit control, Body, Mod, Colour, money introduction or CSS class. These concrete views, Truck stage effects, subject milestone illustrations, branding and navigation belong to their modules or app. The reusable seams cover what actually varies across app compositions.

### Goals and affordability facts

Garage keeps its existing Goal-selection rules from ticket 03. A chosen locked Bolt purchase remains selected; automatic selection prefers the cheapest Mod or Body, with Colours chosen automatically only when nothing else bought with Bolts remains. Selection and purchase actions stay reward-owned and app-coordinated, not operations on shared currency.

Once no Bolt Goal remains, Garage's Goal view still shows the next Legendary and its cash price using the app-supplied current pricing context. Tapping speaks that price. Once everything is owned, it keeps the finished icon and phrase. A Legendary cash hint is not a Bolt Goal, a progress fraction or permission to purchase. Non-money learning with Garage must supply ticket 04's explicit checkout policy and context; another reward need not reproduce this fallback.

Two read-only reward queries keep separate presentation facts:

```ts
interface RewardCues<RewardState> {
  hasAffordable(state: RewardState, balance: number): boolean;
  becameAffordable(state: RewardState, beforeBalance: number, afterBalance: number): boolean;
}
```

`RewardState` is reward-owned. These are candidate query names, not a universal catalogue or ownership model. The queries contain reward eligibility and price rules and have no purchase, balance or storage effects.

The app retains the completion-time reward state and before/after balances. `becameAffordable` compares those balances against the same reward state and supplies a captured fact for that committed Round's show. For Garage it preserves the current increase in the count of locked affordable Bolt purchases, including Mods, Bodies and Colours even when a Colour is not the Goal. Legendary cash prices are excluded. It does not announce merely because something was already affordable before the Round.

`hasAffordable` reads current reward state and balance for navigation cues. Monster Truck Money's Garage button pulses after the show when any locked Bolt purchase is affordable, including one that was affordable before this Round. Neither displayed affordability nor a captured celebration fact authorises payment; actual taps revalidate through ticket 03's coordinator. Another reward decides its own purchase availability without exposing Garage counts or adopting one-time ownership.

### Committed facts and shared celebration sequencing

The shared sequencer only runs ordered, app-supplied moments:

```ts
type Moment = (signal: AbortSignal) => Promise<void>;
type ShowResult = 'finished' | 'cancelled' | 'failed';

declare function playMoments(
  moments: readonly Moment[],
  signal: AbortSignal,
): Promise<ShowResult>;
```

The app builds the plan from committed earnings and captured balances, accumulated subject progression changes, newly earned Trophy steps and the reward's newly-affordable fact. Shared Round reports learning facts; it does not translate a Level into money art or emit Garage commands. The app's presentation adapter interprets its chosen subject and reward together and closes each moment over the appropriate art, stage and typed voice.

Monster Truck Money preserves the existing show and order:

1. The Truck delivers the earned Bolts first and the displayed pile increases to the already-committed balance.
2. Level increases and opened Game Modes play in their existing stable relative order, followed by stars, then Trophies. Preserve every event, existing animations, phrases and pacing, rather than choosing only the biggest event.
3. The newly-affordable announcement follows those moments when the Round made another Bolt purchase affordable.
4. Garage, Play again and Home become usable only when all normal moments have finished. The Garage pulse then uses current affordability.

The sequencer knows none of those concrete event kinds, mode identifiers, Truck stage elements or phrase types. Ordering and event interpretation belong to app composition. Other subjects do not need Levels, stars or new-money illustrations, and another reward does not need Truck art.

The screen owns the show's lifetime. The sequencer gives moments a run-scoped signal linked to that lifetime and aborts its run scope on failure as well as cancellation. Cancellation stops remaining moments and cleans up its speech, animations, timers, temporary art and highlighting. Cancellation safety is an adapter invariant, not a guarantee enforced by the `Moment` type. Each moment registers abort cleanup for its resources, releases them on failure and observes cancellation before effects after an await. The sequencer also checks cancellation before and after each moment. Old resolutions, rejections or scheduled effects cannot mutate another show, enable its navigation or stop its audio.

An unexpected synchronous throw or rejected moment stops the remaining sequence and cleans up the failed show's work. It reports `failed`; the still-active app screen releases its existing navigation rather than trapping the player. A cancelled or replaced screen cannot release another screen's controls. Failure does not pretend unplayed moments finished, automatically replay the show or roll back committed progress. Normal successful sequencing retains the full-show navigation gate.

Presentation never credits earnings, grants purchases or awards Trophies. Completion guards and commits remain ticket 03's responsibility. Re-showing a committed result can only replay presentation. Leaving after completion retains its effects; leaving before completion follows ticket 02's abandoned-Round rules and produces no completion show or earnings.

### Typed recorded voice without a global catalogue dependency

Share playback and clip validation mechanisms, not the money app's phrase catalogue. Each selected presentation or subject capability supplies its typed phrases, an enumerable required-phrase list and recorded clip mappings. The app explicitly composes those selected lists and mappings into its build's voice manifest. A selected capability's required phrases must all be covered; callers cannot substitute an unrelated manifest or widen speech to arbitrary strings to make composition compile.

The shared player is parameterised by the selected phrase type and clip mapping. It retains interrupting speech, appended speech, preloading, highlighting and scoped cancellation. It imports no money amount formatter, denomination list, Garage catalogue, mode registry or global `voice.gen.ts`. Cancelling an old view must not hush a newer view's speech, and cancellation must release pending playback promises so cancelled continuations can finish without applying effects.

Money's local voice facade preserves the existing typed `say`/`sayMore` usage, spoken text and amount assembly. It expands cents into typed amount-piece phrases before calling shared playback. Generic voice items can contain selected phrases and highlighting groups, but not a required `{ cents }` variant. Other subjects need no money type or amount vocabulary. Typed phrase builders must enumerate their supported outputs for recording and checking, including the current earned-Bolt range, prices and Door Numbers.

The build checker accepts the selected required-phrase list, clip map and asset root explicitly. It fails the selected app's build for a missing mapping or missing clip file, including amount pieces and template-generated phrases. It must not hard-code imports of the money app's catalogue. Preserve recorded clips as build assets and no `speechSynthesis` or runtime recording fallback. Existing money phrases and clips remain intact; this design changes their ownership and selection, not their wording or voice.

The phrase-export and recording tools also select a particular voice collection and output location. Stale-clip cleanup is confined to that collection, never a shared directory containing another app's recordings. Shared recordings can be explicitly selected by more than one build without importing unrelated phrase catalogues.

### Separate static builds from shared source

Each app supplies an explicit static entry and build selection in this repo. Its imports choose its subject, reward, earnings and Trophy policies, presentation and any extra capabilities such as money checkout. Shared entry points must not re-export all apps or eagerly import every adapter. There is no runtime subject/reward selector, published package or second-app deployment in this ticket.

The new app must supply:

- Its concrete app assembly, navigation, optional setup, subject problem/introduction views, currency display, reward entry/Goal views, Trophy placement and celebration plan.
- Selected typed phrase sets and clip maps, recorded files and any subject-specific phrase expansion. Non-money learning plus Garage explicitly selects a supported Legendary capability and its compatible context under ticket 04. It includes only the money assets that selected capability needs, not the entire money curriculum.
- Its HTML entry, title, start-screen branding, PWA names and metadata, icon source, colours, styles and self-hosted fonts. The shared icon-generation mechanism receives the selected artwork rather than importing the Truck icon itself.
- A selected public asset root or explicitly assembled asset directory and a distinct build output. Copy and precache only the selected app's clips, artwork and branding plus intentionally shared assets. Tree-shaking JavaScript does not remove files copied from a global `public/` directory. Avoid global phrase indexes, mixed public directories and all-app CSS imports that bring unused money/Garage content into the output.
- Relative asset paths and the existing static deployment model with `base: './'`. Preserve offline precaching of the selected JavaScript, CSS, HTML, artwork, recorded voice and fonts. Keep the app usable without a service worker; registration remains web-only and applying an update does not reload an active game. No runtime server, external font or voice request is introduced.

These requirements apply to independent money/non-Garage and non-money/Garage compositions as well as the motivating telling-time/non-Garage example. A clock subject supplies its own question, explanation and optional introduction; its app can supply a non-Garage entry, no setup and no Goal without inventing money Levels, Bodies or Mods. The app still displays its earned balance and composes a cancellable end show from committed facts. This specifies neither a clock curriculum nor recruitment mechanics or alternate artwork.

Monster Truck Money keeps its current visible screens, first-launch Body choice, Bolts, Garage, Goals, Trophy Shelf, recorded voice, celebrations and static offline behaviour. Its existing `RoundScreen`, `EndOverlay`, phrase/player modules, voice tools and Vite plugins do not yet implement these separations. In particular, current `sayMore` and `hush` share global playback state without view-scoped ownership. Reusing that mechanism needs explicit scope ownership, not just moving the existing player file. Cancellation and failure handling above are future extraction requirements, not claims that the current code already guarantees them. Saved-state representation and separate-app storage identity remain ticket 06's decision.

### Agreed future verification seams and remaining work

The user approved three future TDD seams:

1. **Reward presentation and app coordination.** Exercise setup absence/completion and stale actions, optional Goals, Garage Goal selection and Legendary/finished fallbacks, the distinct affordability cues, introduction acknowledgement and cancellation, and committed-only show inputs. Verify that re-showing presentation cannot credit earnings, grant ownership or award Trophies.
2. **Celebration sequencing.** Supply observable moments and exercise order, full-show navigation gating, cancellation between and within moments, late callbacks, synchronous throws, rejected moments and cleanup. Verify that failure releases only the still-active screen's navigation and leaves committed progress unchanged. Assert observable effects and results, not private timers or guard collections.
3. **Typed voice and build selection.** Exercise interrupt/append playback, highlighting, scoped cancellation and local money amount expansion. Include typechecking for rejected unselected phrases, missing clip mappings/files and supported generated phrases. Inspect build output and precache contents for selected assets and absence of unselected catalogues/art/branding. Verify offline playback and operation without a service worker.

These are acceptance criteria for later production and swap/handoff work, not executable checks added by issue 05. This design-only ticket adds no executable interfaces or tests. Existing voice, economy, Round and Trophy tests, typechecking, the production build and offline check provide current-behaviour evidence, not proof that an extraction or isolated second build exists. Production work must use red-green tests at the approved seams. Build-isolation evidence needs the later swap/handoff work; it is not established by testing only today's money build.

Ticket 06 retains save compatibility and app storage isolation. Tickets 07 and 08 retain swap evidence and the extraction handoff. No downstream ticket, production refactor, save migration, second app or deployment is implemented here.
