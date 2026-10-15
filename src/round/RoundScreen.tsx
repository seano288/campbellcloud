import type { ComponentChildren, ComponentType } from 'preact';
import type { ProblemInstance, RoundDisplay } from '../learning/round';

export function RoundScreen<P, A>({ display, Problem, Introduction, header, end }: {
  display: RoundDisplay<P, A>;
  Problem: ComponentType<{ current: ProblemInstance<P, A> }>;
  Introduction?: ComponentType<NonNullable<RoundDisplay<P, A>['introduction']>>;
  header: ComponentChildren;
  end?: ComponentChildren;
}) {
  return (
    <div class="screen round-screen">
      <div class="roundbar">{header}</div>
      <main class={`card ${display.phase === 'explaining' || display.phase === 'thinking' ? 'thinking' : ''}`}>
        {display.phase !== 'introduction' && <Problem key={`${display.roundId}:${display.current.id}`} current={display.current} />}
      </main>
      {display.introduction && Introduction && <Introduction key={display.roundId} {...display.introduction} />}
      {display.phase === 'completed' && end}
    </div>
  );
}
