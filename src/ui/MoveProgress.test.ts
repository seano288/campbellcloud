import { expect, it } from 'vitest';
import { exportProgress, readProgress } from './MoveProgress';

const keys = ['game-save', 'game-place'];

it('copies this game\'s saves and reads them back, ignoring other keys and other games', () => {
  const stored: Record<string, string> = { 'game-save': '{"bolts":12}', other: 'x' };
  const code = exportProgress('game', keys, { getItem: k => stored[k] ?? null });
  expect(readProgress('game', keys, `  ${code}\n`)).toEqual({ 'game-save': '{"bolts":12}' });
  expect(readProgress('other-game', keys, code)).toBeNull();
  expect(readProgress('game', keys, JSON.stringify({ game: 'game', saves: { other: 'x' } }))).toBeNull();
  expect(readProgress('game', keys, 'hello')).toBeNull();
});
