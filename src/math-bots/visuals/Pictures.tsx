// The question pictures: ten frame, number path, number bond, rods and cubes, scale, token rows, groups, Scoreboard (and in
// NewPictures.tsx the chart, bars, wrenches and shapes). All flat:
// plain counters in two colours and thick outlines, never a robot part, because a rich picture gets counted instead of the
// number. Each takes plain numbers, so a question and a lesson draw the same thing. Stage draws a lesson's description.
import type { ComponentChildren } from 'preact';
import { BOARD_ROWS, type BoardProblem } from '../numbers/problems';
import type { Stage } from '../numbers/teach';
import { BarsStage, Chart, FillArt, ShapeArt, Units } from './NewPictures';

export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** One counter: colour a or b. */
export const Dot = ({ b, ghost, onClick, label }: { b?: boolean; ghost?: boolean; onClick?(): void; label?: string }) =>
  (onClick ? <button class={cls('dot', b && 'b', 'tap')} aria-label={label ?? 'Counter'} onClick={onClick} /> : <span class={cls('dot', b && 'b', ghost && 'ghost')} />);

/** Two rows of five, filled row by row, first with a's then b's. `hideFrom`: a plate covers the cells from here on. `tapB`: b's can be tapped. */
export function Frame({ a, b = 0, hideFrom, tapB, covered }: { a: number; b?: number; hideFrom?: number; tapB?(): void; covered?: boolean }) {
  return (
    <div class={cls('frame', covered && 'covered')} role="img" aria-label={covered ? 'Covered ten frame' : `Ten frame with ${a + b} counters`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} class={cls('cell', hideFrom !== undefined && i >= hideFrom && 'plated')}>
          {i < a ? <Dot /> : i < a + b ? <Dot b onClick={tapB} /> : null}
        </span>
      ))}
    </div>
  );
}

/** Enough frames for a + b, the first filling before the next starts. */
export function Frames({ a, b = 0, hideFrom }: { a: number; b?: number; hideFrom?: number }) {
  const total = a + b, a1 = Math.min(a, 10), b1 = Math.min(b, 10 - a1);
  return (
    <div class="frames">
      <Frame a={a1} b={b1} {...(hideFrom !== undefined && { hideFrom })} />
      {total > 10 && <Frame a={a - a1} b={b - b1} />}
    </div>
  );
}

/** A row of numbered squares; `at` is where the marker stands, `start` glows. A null cell is blank, its number hidden. */
export function Path({ cells, at, start, ask, mark }: { cells: readonly (number | null)[]; at?: number | null; start?: number; ask?: boolean; mark?: number }) {
  return (
    <div class={cls('path', ask && 'skip')} role="img" aria-label="Number path">
      {cells.map((n, i) => (
        <span key={i} class={cls('sq', n === null && 'blank', n !== null && n === start && 'start', n !== null && n === at && 'at', n !== null && at != null && start !== undefined && n > start && n <= at && 'done', mark === i && 'mark')}>
          {n ?? (ask ? '?' : '')}
        </span>
      ))}
    </div>
  );
}

/** A number bond: the whole above, its two parts below. `plate` hides a part. */
export function Bond({ whole, left, right, plate }: { whole: number | '?'; left: number | '?'; right: number | '?'; plate?: 'right' }) {
  return (
    <div class="bond" role="img" aria-label="Number bond">
      <svg viewBox="0 0 200 120" aria-hidden="true"><path d="M100 40 L44 96 M100 40 L156 96" stroke="#000" stroke-width="7" /></svg>
      <span class="blob whole">{whole}</span>
      <span class="blob left">{left}</span>
      <span class={cls('blob right', plate === 'right' && 'plated')}>{plate === 'right' ? '' : right}</span>
    </div>
  );
}

export const Rod = ({ onClick }: { onClick?(): void }) => (onClick
  ? <button class="rod tap" aria-label="A ten" onClick={onClick}>{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</button>
  : <span class="rod">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</span>);
export const Cube = ({ onClick }: { onClick?(): void }) => (onClick ? <button class="cube tap" aria-label="A one" onClick={onClick} /> : <span class="cube" />);
/** Rods and cubes on a mat, tens on the left. */
export function Mat({ rods, cubes, onRod, onCube, leaving = 0 }: { rods: number; cubes: number; onRod?(): void; onCube?(): void; leaving?: number }) {
  return (
    <div class="mat" role="img" aria-label={`${rods} tens and ${cubes} ones`}>
      <div class="mat-tens">{Array.from({ length: rods }, (_, i) => <span key={i} class={cls('rod-at', i >= rods - leaving && 'leaving')}><Rod {...(onRod && { onClick: onRod })} /></span>)}</div>
      <div class="mat-ones">{Array.from({ length: cubes }, (_, i) => <Cube key={i} {...(onCube && { onClick: onCube })} />)}</div>
    </div>
  );
}

/** A two-pan scale. It tips to the heavier side; `covered` hides it until he has answered. */
export function Scale({ left, right, leftText, rightText, covered, onLeft, onRight, addLeft, addRight }: {
  left: number; right: number; leftText?: string; rightText?: string; covered?: boolean; onLeft?(): void; onRight?(): void; addLeft?(): void; addRight?(): void;
}) {
  const tip = covered ? 0 : Math.max(-1, Math.min(1, right - left));
  const pan = (n: number, text: string | undefined, tap?: () => void, add?: () => void) => (
    <div class="pan">
      <span class="pan-text">{text ?? n}</span>
      <div class="pan-dots">{Array.from({ length: Math.min(n, 24) }, (_, i) => <Dot key={i} {...(tap && { onClick: tap })} />)}{add && <button class="dot-add" aria-label="Add a counter" onClick={add}>＋</button>}</div>
    </div>
  );
  return (
    <div class={cls('weigh', covered && 'covered', tip < 0 && 'tip-l', tip > 0 && 'tip-r')} role="img" aria-label={covered ? 'Covered scale' : 'Scale'}>
      <div class="beam" />
      <div class="pans">{pan(left, leftText, onLeft, addLeft)}<span class="post" />{pan(right, rightText, onRight, addRight)}</div>
    </div>
  );
}

/** Rows of plain tokens, for stories. `paired`: lined up one to one, the unmatched ones glowing. `leaving`: the last few fade away. */
export function Rows({ top, bottom, leaving = 0, paired }: { top: number; bottom: number; leaving?: number; paired?: boolean }) {
  return (
    <div class="rows" role="img" aria-label={`${top} and ${bottom} counters`}>
      {top > 0 && <div class="row">{Array.from({ length: top }, (_, i) => <span key={i} class={cls('slot', paired && i >= bottom && 'alone', i >= top - leaving && 'leaving')}><Dot /></span>)}</div>}
      {bottom > 0 && <div class="row">{Array.from({ length: bottom }, (_, i) => <span key={i} class="slot"><Dot b /></span>)}</div>}
    </div>
  );
}

/** Groups of plain tokens: pairs, fives or tens, each in its own tray. */
export function Groups({ groups, step, lit = 0 }: { groups: number; step: number; lit?: number }) {
  return (
    <div class={cls('groups', `of${step}`)} role="img" aria-label={`${groups} groups of ${step}`}>
      {Array.from({ length: groups }, (_, g) => (
        <span key={g} class={cls('group', g < lit && 'lit')}>{Array.from({ length: step }, (_, i) => <Dot key={i} />)}</span>
      ))}
    </div>
  );
}

/** The Scoreboard: three rows, one plain square per hit. No pictures in the bars. */
export function Board({ q }: { q: BoardProblem }) {
  return (
    <div class="board" role="img" aria-label="Scoreboard">
      {BOARD_ROWS.map(r => (
        <div key={r} class="board-row"><span class="board-name">{r}</span><span class="board-bar">{Array.from({ length: q.rows[r] }, (_, i) => <i key={i} />)}</span></div>
      ))}
    </div>
  );
}

export const Equation = ({ text }: { text: string }) => <div class="eq">{text}</div>;

export function StageView({ stage }: { stage: Stage }): ComponentChildren {
  switch (stage.view) {
    case 'frames': return <Frames a={stage.a} {...(stage.b !== undefined && { b: stage.b })} {...(stage.hideFrom !== undefined && { hideFrom: stage.hideFrom })} />;
    case 'path': return <Path cells={stage.cells} {...(stage.at !== undefined && { at: stage.at })} {...(stage.start !== undefined && { start: stage.start })} />;
    case 'bond': return <Bond whole={stage.whole} left={stage.left} right={stage.right} />;
    case 'mat': return <Mat rods={stage.rods} cubes={stage.cubes} {...(stage.leaving !== undefined && { leaving: stage.leaving })} />;
    case 'compare': return <div class="pair-mats"><div><Equation text={String(stage.a)} /><Mat rods={Math.floor(stage.a / 10)} cubes={stage.a % 10} /></div><div><Equation text={String(stage.b)} /><Mat rods={Math.floor(stage.b / 10)} cubes={stage.b % 10} /></div></div>;
    case 'scale': return <Scale left={stage.left} right={stage.right} {...(stage.leftText !== undefined && { leftText: stage.leftText })} {...(stage.rightText !== undefined && { rightText: stage.rightText })} />;
    case 'rows': return <Rows top={stage.top} bottom={stage.bottom} {...(stage.leaving !== undefined && { leaving: stage.leaving })} {...(stage.paired !== undefined && { paired: stage.paired })} />;
    case 'groups': return <Groups groups={stage.groups} step={stage.step} {...(stage.lit !== undefined && { lit: stage.lit })} />;
    case 'equation': return <Equation text={stage.text} />;
    case 'chart': {
      const { to, at, from, lit, upTo } = stage;
      return <Chart to={to} keep={[at, from, upTo, lit?.[0]].filter(n => n !== undefined)} {...(at !== undefined && { at })} {...(from !== undefined && { from })} {...(lit && { lit })} {...(upTo !== undefined && { hide: c => c > upTo })} />;
    }
    case 'bars': return <BarsStage bars={stage.bars} {...(stage.rope !== undefined && { rope: stage.rope })} {...(stage.lit !== undefined && { lit: stage.lit })} />;
    case 'units': return <Units len={stage.len} laying={stage.laying} {...(stage.shown !== undefined && { shown: stage.shown })} {...(stage.size !== undefined && { size: stage.size })} {...(stage.lit !== undefined && { lit: stage.lit })} />;
    case 'shape': return <div class="shape-stage"><ShapeArt tile={stage.tile} {...(stage.lit !== undefined && { lit: stage.lit })} /></div>;
    case 'fill': return <FillArt fill={stage.fill} placed={stage.placed} />;
  }
}
