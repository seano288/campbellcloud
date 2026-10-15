import { expect, it } from 'vitest';
import { createStore } from '../save/store';
import { moneySave } from './save';
import { createGarageSetup } from './setup';

it('confirms an allowed starter through the app before navigating, without persisting a preview', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  await store.load();
  const setup = createGarageSetup(store);
  const visited: unknown[] = [];
  const active = setup.open(new AbortController().signal, () => visited.push(store.state.value.garage.body));
  expect(store.state.value.garage.body).toBeNull();
  expect(active.confirm('bigfoot').kind).toBe('accepted');
  expect(visited).toEqual(['bigfoot']);
  expect(active.confirm('pickup').kind).toBe('rejected');
  expect(store.state.value.garage.body).toBe('bigfoot');
});

it('leaves a rejected setup usable and validates the current allowed selection', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  const setup = createGarageSetup(store);
  let visits = 0;
  const active = setup.open(new AbortController().signal, () => visits++);
  expect(active.confirm('pickup')).toEqual({ kind: 'rejected', reason: 'not-ready' });
  await store.load();
  store.commit(state => ({ ...state, garage: { ...state.garage, ownedBodies: ['pickup', 'firetruck'] } }));
  expect(active.confirm('bigfoot').kind).toBe('rejected');
  expect(active.confirm('firetruck').kind).toBe('rejected');
  expect(visits).toBe(0);
  expect(active.signal.aborted).toBe(false);
  expect(active.confirm('pickup').kind).toBe('accepted');
  expect(visits).toBe(1);
});

it('invalidates confirmation and navigation when leaving or replacing setup', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  await store.load();
  const setup = createGarageSetup(store);
  let visits = 0;
  const first = setup.open(new AbortController().signal, () => visits++);
  const lifetime = new AbortController();
  const second = setup.open(lifetime.signal, () => visits++);
  expect(first.signal.aborted).toBe(true);
  expect(first.confirm('pickup').kind).toBe('rejected');
  lifetime.abort();
  expect(second.confirm('bigfoot').kind).toBe('rejected');
  expect(visits).toBe(0);
  expect(store.state.value.garage.body).toBeNull();
});

it('does not navigate a replacement screen when publication of the accepted choice leaves setup', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  await store.load();
  const setup = createGarageSetup(store), lifetime = new AbortController();
  let visits = 0;
  const active = setup.open(lifetime.signal, () => visits++);
  const stop = store.state.subscribe(state => { if (state.garage.body) lifetime.abort(); });
  expect(active.confirm('pickup').kind).toBe('accepted');
  expect(visits).toBe(0);
  expect(store.state.value.garage.body).toBe('pickup');
  stop();
});

it('keeps setup active after a calculation failure so confirmation can be retried', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  await store.load();
  let fail = true, visits = 0;
  const setup = createGarageSetup({
    commit: propose => store.commit(state => {
      if (fail) throw new Error('Calculation failed');
      return propose(state);
    }),
  });
  const active = setup.open(new AbortController().signal, () => visits++);
  expect(active.confirm('pickup')).toEqual({ kind: 'rejected', reason: 'calculation-failed' });
  expect(store.state.value.garage.body).toBeNull();
  expect(active.signal.aborted).toBe(false);
  expect(visits).toBe(0);
  fail = false;
  expect(active.confirm('pickup').kind).toBe('accepted');
  expect(visits).toBe(1);
});

it('does not navigate a replacement created while successful setup speech is being stopped', async () => {
  const store = createStore({ key: 'setup-test', adapter: moneySave, backing: { read: () => null, write() {} } });
  await store.load();
  const setup = createGarageSetup(store);
  let visits = 0;
  const active = setup.open(new AbortController().signal, () => visits++);
  active.signal.addEventListener('abort', () => { setup.open(new AbortController().signal, () => {}); }, { once: true });
  expect(active.confirm('pickup').kind).toBe('accepted');
  expect(visits).toBe(0);
});
