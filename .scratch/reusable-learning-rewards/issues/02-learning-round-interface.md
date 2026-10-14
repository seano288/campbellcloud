# Define the subject-independent learning and Round interface

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 01
Map: [Reusable learning, currency, and rewards](../map.md)

## Question

What must a learning adapter supply, and what should the shared Round implementation own, so non-money questions can run without money-specific types, introductions, or progression assumptions?

Decide the interface for generating, displaying, checking, explaining, and replaying a problem, and for reporting help, misses, completion, and progression. Address who owns correctness, asynchronous explanations, cancellation when leaving a Round, and the facts another module can use to calculate earnings. Prefer a small interface over exposing the coordinator's internal state.

Use the existing learning behaviour as the default, not an opportunity to redesign it. Decide which identifiers, Level structure, unlock rules, introductions, and Mastery rules are truly shared and which are subject-owned. The money app must retain its present three modes and progression.

Read [the current learning interface](../../../src/modes/mode.ts), [mode identifiers](../../../src/modes/ids.ts), [Mastery](../../../src/modes/progress.ts), [Round rules](../../../src/round/rules.ts), [the Round coordinator](../../../src/round/round.ts), and [the Round screen](../../../src/round/RoundScreen.tsx).

Resolve through live discussion with a candidate interface and concrete traces for a clean answer, a helped or missed answer, a completed Round, and leaving a Round. Demonstrate how a minimal non-money problem fits without defining a clock curriculum or implementing the extraction.

## Answer

Approved through two rounds of live discussion on 2026-10-14. This records the learning/Round contract and behaviour traces, not a production extraction or a new curriculum. The ownership and dependency rules from [01](01-module-responsibilities.md#answer) still apply. Existing Game Mode, Level, Mastery, Round and Bolt meanings remain unchanged.

### Candidate learning contract

The subject owns correctness. The view submits an answer; shared Round invokes the subject's checker. The view cannot declare a correct answer or a miss itself. The checker distinguishes a wrong answer from an action that is not an answer.

```ts
type Rng = () => number;
type Outcome = 'clean' | 'helped' | 'missed';
type Effect = (signal: AbortSignal) => Promise<void>;

type Check =
  | { kind: 'correct' }
  | {
      kind: 'incorrect';
      explain(teach: boolean, signal: AbortSignal): Promise<void>;
    }
  | { kind: 'not-an-answer'; prompt?: Effect };

interface LearningSession<P, A> {
  makeProblem(rng: Rng): P;
  replay(problem: P, rng: Rng): P;
  check(problem: P, answer: A): Check;
  needsEarlyHelp(): boolean;
}

interface ProblemActions<A> {
  readonly busy: boolean;
  submit(answer: A):
    'correct' | 'incorrect' | 'not-an-answer' | 'ignored';
  help(run: Effect): void;
}
```

These signatures describe the seam, not final source-file locations. App composition supplies the concrete session and randomness. `P` and `A` remain subject-owned types throughout checking and display. The shared implementation does not cast them to money types or look up a global mode registry.

The subject captures the selected practice and generation context at Round entry. Money captures its Game Mode and starting Level, so a saved Level increase during play does not change this Round's questions. `needsEarlyHelp()` reads current subject progression, including already-recorded results; it is not frozen with the generation context.

`makeProblem` produces a new problem. `replay` preserves the learning task while resetting interaction state and optionally shuffling presentation. Money keeps its current replay behaviour: Learn and Count shuffle the same question; Pay keeps the item and price and starts with an empty tray.

`check` returns a verdict without recording progress or running its explanation. An incorrect verdict supplies the subject-owned explanation for that answer. The callback may update subject-owned presentation state, speak and teach; it has no access to Round's writable state. A not-an-answer verdict may supply a prompt but changes neither misses nor help tracking and adds no explanation lock. Pay with an empty tray remains a not-an-answer prompt.

### Display and introductions

The subject supplies a typed problem view receiving `problem: P`, `actions: ProblemActions<A>` and the problem instance's `AbortSignal`. It owns answer controls, local interaction state, prompt replay, explanations, teaching and its recorded speech. The view observes cancellation for initial and replayed prompt speech as well as help. The synchronous submission result lets it mark accepted wrong choices or show success; an ignored submission must not change its answer state.

The subject also supplies an optional introduction view and an acknowledgement operation. At Round entry, app composition reads whether an introduction is pending and holds problem interaction until it is acknowledged. The introduction's done action acknowledges the subject's pending introduction and opens problem interaction. Its view and done action are scoped to the active introduction, so leaving cancels its speech and invalidates a late acknowledgement. Leaving before acknowledgement keeps it pending. No introduction is required for another subject, and shared Round does not know about new money or a Level greater than 1.

Round exposes a read-only display snapshot: phase, current problem instance, answered count out of five and solved results. Each problem instance supplies bound actions and an identity for resetting its view. Queue contents, timer handles and writable attempt flags stay private. App composition assembles this with subject presentation and the app's currency, Goal and end-of-Round presentation. Their detailed composition remains ticket 05's work.

`busy` prevents answer submission while an introduction, wrong-answer explanation, thinking pause, success transition or terminal state is active. Round checks the current phase itself rather than trusting a previously rendered `busy` value. Actions from an ended or replaced problem are inert. A new instance of the same replayed problem gets new actions and fresh tracking.

### Shared lifecycle and asynchronous work

- A Round still ends after five solved problems, not five taps or five newly generated problems. A replay occupies one of those five places.
- Each problem starts with no misses and no help. Correct on the first attempt without help is `clean`; correct after help but no miss is `helped`; any miss makes the solved outcome `missed`, even if help was also used.
- Every accepted wrong answer records a miss immediately. Round requests teaching on the second miss, or on the first when `needsEarlyHelp()` is true. Requesting teaching marks help used; the subject supplies what teaching does.
- An incorrect verdict holds submissions until its explanation finishes, followed by the current 1,500 ms thinking pause. Synchronous explanation throws and rejected promises must release the lock through the same cleanup path without recording success. Cancellation does not start a replacement pause.
- Manual `help(run)` marks help used immediately before running the subject effect. It does not add an answer lock. Help offered within a still-active explanation can run without releasing that explanation's lock. Help alone never schedules replay.
- A solved problem is recorded once and stops accepting answer or help actions. If it was missed and is not already a replay, Round queues it. At the next problem selection, the earliest eligible queued problem returns only after at least one other solved problem has intervened. A replay is not queued again. No replay extends the five-answer limit.
- After a non-final success, the next problem starts after 1,500 ms. After the fifth success, the completion transition waits 900 ms. These are the current success delays, distinct from the wrong-answer thinking pause.
- Round owns cancellation scopes for asynchronous work tied to each problem instance. Leaving, replacement and a problem's end invalidate its actions and cancel its speech, explanation, help and effect timers. The subject must observe the signal before applying visual or audio effects after an await and stop its active work when cancelled. App/subject audio wiring handles stopping playback; shared Round imports no global money speech function.
- Success-transition timers belong to the active Round, not the ended problem's effect scope. They survive cancellation of that problem's teaching work but are invalidated by leaving or replacing the Round. Each transition also checks that its solved problem is still the current transition, so it cannot advance another problem.
- Every explanation, help or prompt continuation must retain the scope of the problem that started it. A late resolution, rejection or effect timer must not touch another problem or a later Round, even if the subject or problem content is identical. Unexpected help or prompt failures do not become solved results or leave a new answer lock behind.

### Result facts and progression

Shared Round reports facts to app composition rather than applying currency, Trophy or subject progression rules. A solved result has this subject-independent shape:

```ts
interface SolvedProblem {
  index: number;
  outcome: Outcome;
  misses: number;
  helped: boolean;
  replay: boolean;
}

interface RoundResult {
  roundId: string;
  status: 'completed' | 'abandoned';
  results: readonly SolvedProblem[];
}
```

`index` is the one-based solved position within the Round. It is not a subject's problem identifier. Round identity stays stable from start through its terminal result and differs for another Round. Neither identity encodes a Game Mode, Level or reward. Detailed credit deduplication and save mechanics belong to tickets 03 and 06.

The reporting order is part of the interface:

1. Report each accepted miss or help use immediately, tagged with its Round and problem instance. App composition uses these facts to break the first-try streak even if the player leaves before solving the problem. They do not append an unsolved problem to the subject's Mastery window.
2. Report each solved result once, before starting its success delay. The app passes it to the subject's progression function with the current subject state and captured practice context, commits the returned state and passes the outcome to streak handling. A miss followed by help still produces just one solved `missed` result.
3. Subject progression returns its own change facts alongside its state. Money can report a Level increase, newly open Game Mode or star to app presentation and app-supplied Trophy rules. Shared Round neither interprets these changes nor requires another subject to report the same kinds.
4. After the final success delay, report one completed `RoundResult` with exactly five ordered solved results. Abandonment instead reports one abandoned result containing only results already solved. Completion and abandonment are mutually exclusive. Leaving a completed screen does not issue another terminal result.

Money retains `learn`, `count` and `pay`, their names, their three Levels and their unlock chain. Count opens when Learn reaches Level 2; Pay opens when Count reaches Level 2. Each mode keeps its own ten-result window, advances at eight clean results without waiting for a full ten, clears the window and makes its introduction pending on Level increase, never decreases Level and grants its star once at Level 3. Five missed solved results in the current window request early help; helped results alone do not. All of those rules belong to money learning, not shared Round.

The app commits progression and streak effects as answers happen. Abandoning does not undo them. Round identity, transient questions and replay queues are not a new saved curriculum or a requirement to persist in-progress Rounds.

Currency receives a completed result and the app's earnings policy, not the coordinator or subject state. The money policy remains one Bolt per `clean` solved result plus one for completion. Five clean results earn six; two clean and three helped or missed results earn three. Replays can earn a clean result just as they do now. An abandoned result earns no Round currency, even when it contains five solved results. Completion reporting is once per Round; ensuring currency credit commits once, including repeated presentation or notification, remains ticket 03's contract. Trophy completion checks and end presentation remain app-coordinated.

### Concrete traces

**Clean answer.** A fresh Count problem accepts the correct total through `submit`. The subject checker returns `correct`. Round records `{ index: 1, outcome: 'clean', misses: 0, helped: false, replay: false }`, reports it once and locks further submissions. The app commits the money progression result and increments the streak immediately. After 1,500 ms, Round selects the next problem.

**Help without a miss.** The player asks to count together. `help` marks and reports help before the subject starts counting aloud, so the streak breaks now. Manual help does not lock answer submission. A subsequent first-attempt correct answer is `helped`, enters the subject window once and earns no clean-answer Bolt. It is not queued for replay. Correctness ends the problem and cancels any help still running.

**Miss, teaching and replay.** The first wrong answer reports a miss and breaks the streak immediately. Without early help, its explanation runs without teaching, followed by the thinking pause. A second miss requests teaching, marks help used and waits for the subject explanation and teaching to finish, then the pause. Eventual success is `missed`, not `helped`. Its single solved result updates money progression, and the original problem is queued. One other problem must be solved before it can return. If a place remains, its replay has fresh attempts and help state. A first-attempt answer without help on that replay is `clean`; another miss on it does not schedule a further replay. If recent money progression already requests early help, teaching starts on the first miss instead.

**Completed Round.** Five clean solved results update progression and streaks as they occur. Generation continues using the starting Level even if an answer raises saved progress. After the fifth result, Round holds submissions for 900 ms, then emits one completed result and cancels remaining problem work. App composition applies the unchanged six-Bolt policy with currency, runs Trophy completion handling and presents the accumulated subject changes and celebration. Re-showing the celebration is not another completion. The new Level's introduction is for the next Round.

**Leaving a Round.** The player leaves during an explanation after two solved results. Round invalidates all problem actions, cancels teaching, speech and timers, and reports an abandoned result with those two solved results. Committed progression and the streak reset from the latest miss remain; the unfinished problem adds no Mastery result. Replay work is discarded and there are no Round earnings. The old explanation resolving later cannot unlock, mutate or submit to a replacement Round. An unacknowledged introduction remains pending.

**Leaving during the final delay.** The fifth answer has already updated progression, but the player leaves before the 900 ms completion transition. The terminal result is abandoned with five solved results and no currency or Round-completion effects. This preserves the existing completion timing rather than moving payment to the fifth tap. If completion has already happened, leaving retains its effects and cannot change the terminal result to abandoned.

### Minimal non-money fit

A design-only adapter can supply one fixed clock problem:

```ts
type ClockProblem = { hour: 3; minute: 0 };
type ClockAnswer = string;
```

Its view draws that clock and submits the chosen answer. Its checker accepts `"3:00"`, rejects `"4:00"` and returns a clock-specific explanation callback for the latter. The callback can point out the hands and, when asked to teach, reveal the answer while observing cancellation. A help button uses the same `help` action to run clock teaching. Replay keeps the same clock with fresh interaction state. The adapter can return `false` from `needsEarlyHelp()`, supply no introduction and leave subject progression unchanged when the app passes it solved facts.

This fits without `MoneyKey`, `ModeId`, a Pay Level, Mastery windows or a money phrase catalogue. Shared Round can run its five-answer lifecycle and produce the same result facts. This example defines no clock curriculum, real voice assets or second app, and implements no extraction.

### Verification seams and remaining work

The agreed future TDD seams are the Round controller with a supplied learning adapter, subject checking/progression, and app coordination of result facts. Tests should exercise submission, observable phases and reported facts rather than private queues or timers. Critical cases are the traces above, not-an-answer input, rejected explanations and late callbacks after cancellation. This design-only ticket adds no executable interfaces or tests; current Round rules and money progression tests remain behaviour evidence, not proof of an extraction.

Ticket 03 decides currency credit and purchase transactions, 04 the explicit Legendary checkout connection, 05 presentation/build composition, and 06 save compatibility. Checkout is not a Round and does not acquire Round Mastery or currency effects through this interface. Tickets 07 and 08 remain swap evidence and the extraction handoff. No downstream ticket is resolved here.
