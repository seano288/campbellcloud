import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { fixtureScript } from './fixture';
import { JOURNEY_SAVES, STORAGE_KEY } from './saves';
import { CLIPS } from '../../src/voice/voice.gen';

export const celebrationJourneys: { name: string; seed: unknown; run(page: Page): Promise<void> }[] = [];
const journey = (name: string, run: (page: Page) => Promise<void>, seed: unknown = null) => { celebrationJourneys.push({ name: `celebration: ${name}`, seed, run }); };
const scripts = new Map<string, Promise<string>>();

async function controlAnimations(page: Page) {
  await page.clock.install();
  await page.evaluate(() => {
    Element.prototype.animate = function (frames, options) {
      const animation = new Animation(new KeyframeEffect(this, frames, options));
      const duration = typeof options === 'number' ? options : Number(options?.duration ?? 0);
      const finished = new Promise<Animation>((resolve, reject) => {
        const timer = setTimeout(() => resolve(animation), duration);
        animation.cancel = { cancel() { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); } }.cancel;
      });
      Object.defineProperty(animation, 'finished', { value: finished, configurable: true });
      return animation;
    };
  });
}

async function controlVoice(page: Page, holdAnnouncement = false) {
  const announcement = CLIPS['You can build something new!'];
  assert.ok(announcement);
  await page.evaluate(({ holdAnnouncement, announcement }) => {
    const fetch = window.fetch;
    window.fetch = function (input, init) {
      return typeof input === 'string' && input.startsWith('./voice/') ? Promise.resolve(new Response(input)) : fetch.call(this, input, init);
    };
    AudioContext.prototype.decodeAudioData = function (data) {
      const buffer = this.createBuffer(1, this.sampleRate / 10, this.sampleRate);
      if (holdAnnouncement && new TextDecoder().decode(data).endsWith(announcement)) {
        const marker = document.createElement('output');
        marker.id = 'announcement-pending';
        document.body.appendChild(marker);
        return new Promise<AudioBuffer>(resolve => { Reflect.set(window, 'releaseAnnouncement', resolve.bind(null, buffer)); });
      }
      return Promise.resolve(buffer);
    };
    AudioBufferSourceNode.prototype.start = function () {
      setTimeout(() => this.dispatchEvent(new Event('ended')), (this.buffer?.duration ?? 0) * 1000);
    };
  }, { holdAnnouncement, announcement });
}

async function present(page: Page, fixture = 'completionPresentation') {
  let script = scripts.get(fixture);
  if (!script) { script = fixtureScript(new URL(`./${fixture}.tsx`, import.meta.url)); scripts.set(fixture, script); }
  await page.setContent('<div id="fixture"></div>');
  await page.addScriptTag({ content: await script });
  await page.locator('.reward').waitFor();
}

journey('failed live animation releases navigation without finishing or changing committed progress', async page => {
  await page.evaluate(() => {
    const active = new Set<AudioScheduledSourceNode>(), started = new Set<AudioScheduledSourceNode>();
    const probe = {
      start(source: AudioScheduledSourceNode) {
        started.add(source); active.add(source);
        source.addEventListener('ended', () => active.delete(source), { once: true });
      },
    };
    Reflect.set(window, 'showSounds', { active, started });
    const oscillatorStart = OscillatorNode.prototype.start, bufferStart = AudioBufferSourceNode.prototype.start, stop = AudioScheduledSourceNode.prototype.stop;
    OscillatorNode.prototype.start = function (...args) { oscillatorStart.apply(this, args); probe.start(this); };
    AudioBufferSourceNode.prototype.start = function (...args) { bufferStart.apply(this, args); probe.start(this); };
    AudioScheduledSourceNode.prototype.stop = function (when) {
      stop.call(this, when);
      if (when === undefined || when <= this.context.currentTime) active.delete(this);
    };
    Element.prototype.animate = () => { throw new Error('animation unavailable'); };
  });
  await present(page);
  const before = await page.locator('#before-state').textContent();
  await page.locator('.reward .btns:not(.asleep)').waitFor({ timeout: 1500 });
  assert.equal(await page.locator('.bigpile span').textContent(), '5');
  assert.equal(await page.locator('.lines').textContent(), '');
  assert.equal(await page.locator('#saved-state').textContent(), before);
  assert.ok(await page.evaluate(() => Reflect.get(window, 'showSounds').started.size) > 0);
  assert.equal(await page.evaluate(() => Reflect.get(window, 'showSounds').active.size), 0);
});

journey('rejected parallel animation stops the money show, cleans its art and releases only its navigation', async page => {
  await controlAnimations(page);
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      if (this.classList.contains('cprop')) {
        void animation.finished.catch(() => {});
        Object.defineProperty(animation, 'finished', { value: Promise.reject(new Error('sign animation failed')) });
      }
      return animation;
    };
  });
  await present(page, 'celebrationPresentation');
  await page.clock.runFor(3400);
  await page.locator('.reward .btns:not(.asleep)').waitFor({ timeout: 1500 });
  assert.deepEqual(await page.locator('.lines > div').allTextContents(), ['You earned 6 Bolts!', 'Level up!', 'Now you get quarters!']);
  assert.equal(await page.locator('.cprop, .confetti, .fly, .shatter, .firework').count(), 0);
  assert.equal(await page.locator('#saved-state').textContent(), await page.locator('#before-state').textContent());
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  assert.equal(await page.locator('#destination').textContent(), 'home');
});

journey('cancelling a delivery removes its flying Bolts and cannot bump a replacement pile', async page => {
  await controlAnimations(page);
  await present(page);
  await page.clock.runFor(1300);
  assert.ok(await page.locator('.fly').count() > 0, await page.locator('.reward').innerHTML());
  const before = await page.locator('#saved-state').textContent();
  await page.getByRole('button', { name: 'Toggle show', exact: true }).click();
  assert.equal(await page.locator('.fly').count(), 0);
  await page.getByRole('button', { name: 'Toggle show', exact: true }).click();
  assert.equal(await page.locator('.bigpile span').textContent(), '5');
  await page.clock.runFor(700);
  assert.equal(await page.locator('.bigpile span').textContent(), '5');
  assert.equal(await page.locator('.lines').textContent(), '');
  assert.equal(await page.locator('#saved-state').textContent(), before);
});

journey('plays every committed progression and Trophy moment before opening all navigation', async page => {
  await controlAnimations(page);
  await controlVoice(page);
  await present(page, 'celebrationPresentation');
  const navigate = async () => {
    for (const name of ['Home', 'Garage', 'Play again']) await page.getByRole('button', { name, exact: true }).dispatchEvent('click');
  };
  await navigate(); // in the first second a tap neither navigates nor skips
  assert.equal(await page.locator('#destination').textContent(), '');
  await page.clock.runFor(3000);
  assert.equal(await page.locator('.bigpile span').textContent(), '6');
  assert.match(await page.locator('.btns').getAttribute('class') ?? '', /asleep/);
  await page.clock.runFor(14000);
  assert.deepEqual(await page.locator('.lines > div').allTextContents(), [
    'You earned 6 Bolts!', 'Level up!', 'Now you get quarters!', 'You opened Count the Cash!',
    'You earned Learn the Coins Level 2!', 'You earned 5 in a Row!', 'You earned Perfect Round!', 'You can build something new!',
  ]);
  assert.equal(await page.locator('#saved-state').textContent(), await page.locator('#before-state').textContent());
  await navigate();
  assert.equal(await page.locator('#destination').textContent(), 'again');
});

journey('a tap after the first second skips the show to its end without navigating', async page => {
  await controlAnimations(page);
  await controlVoice(page);
  await present(page, 'celebrationPresentation');
  await page.clock.runFor(1500);
  await page.locator('.reward').dispatchEvent('click');
  assert.equal(await page.locator('#destination').textContent(), '');
  assert.equal(await page.locator('.bigpile span').textContent(), '6');
  assert.doesNotMatch(await page.locator('.btns').getAttribute('class') ?? '', /asleep/);
  assert.deepEqual(await page.locator('.lines > div').allTextContents(), [
    'You earned 6 Bolts!', 'Level up!', 'Now you get quarters!', 'You opened Count the Cash!',
    'You earned Learn the Coins Level 2!', 'You earned 5 in a Row!', 'You earned Perfect Round!', 'You can build something new!',
  ]);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  assert.equal(await page.locator('#destination').textContent(), 'home');
  assert.equal(await page.locator('#saved-state').textContent(), await page.locator('#before-state').textContent());
});

journey('keeps navigation gated until the final recorded announcement finishes', async page => {
  await controlAnimations(page);
  await controlVoice(page, true);
  await present(page, 'celebrationPresentation');
  await page.clock.runFor(17000);
  await page.locator('#announcement-pending').waitFor({ state: 'attached' });
  assert.match(await page.locator('.btns').getAttribute('class') ?? '', /asleep/);
  await page.getByRole('button', { name: 'Home', exact: true }).dispatchEvent('click');
  assert.equal(await page.locator('#destination').textContent(), '');
  await page.evaluate(() => Reflect.get(window, 'releaseAnnouncement')());
  await page.clock.runFor(1000);
  assert.doesNotMatch(await page.locator('.btns').getAttribute('class') ?? '', /asleep/);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  assert.equal(await page.locator('#destination').textContent(), 'home');
  assert.equal(await page.locator('#saved-state').textContent(), await page.locator('#before-state').textContent());
});

journey('keeps a star flip ahead of all Trophies and cancels its fireworks and temporary art', async page => {
  await controlAnimations(page);
  await page.evaluate(() => history.replaceState(null, '', '?star'));
  await present(page, 'celebrationPresentation');
  await page.clock.runFor(4500);
  assert.deepEqual(await page.locator('.lines > div').allTextContents(), ['You earned 6 Bolts!', 'You are a Learn the Coins star!']);
  assert.ok(await page.locator('.firework').count() > 0);
  assert.equal(await page.locator('.cprop').count(), 2);
  const before = await page.locator('#saved-state').textContent();
  await page.getByRole('button', { name: 'Replace show', exact: true }).click();
  assert.equal(await page.locator('.firework, .confetti, .cprop').count(), 0);
  await page.clock.runFor(1500);
  assert.equal(await page.locator('.cprop, .firework').count(), 0);
  assert.equal(await page.locator('#saved-state').textContent(), before);
});

for (const outcome of ['resolve', 'reject'] as const) {
  journey(`late animation ${outcome} cannot release a replacement show's navigation or change its art`, async page => {
    await controlAnimations(page);
    await page.evaluate(outcome => {
      const animate = Element.prototype.animate;
      const pending: (() => void)[] = [];
      Reflect.set(window, 'settleOldAnimation', { settle() { pending.splice(0).forEach(run => run()); } }.settle);
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        if (!pending.length && !document.querySelector('#held-animation')) {
          const marker = document.createElement('output');
          marker.id = 'held-animation';
          document.body.appendChild(marker);
          void animation.finished.catch(() => {});
          Object.defineProperty(animation, 'finished', {
            value: new Promise<Animation>((resolve, reject) => pending.push(() => outcome === 'resolve' ? resolve(animation) : reject(new Error('late animation')))),
          });
          animation.cancel = () => {};
        }
        return animation;
      };
    }, outcome);
    await present(page, 'celebrationPresentation');
    await page.locator('#held-animation').waitFor({ state: 'attached' });
    const oldHome = await page.getByRole('button', { name: 'Home', exact: true }).elementHandle();
    assert.ok(oldHome);
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route(`**/voice/${CLIPS['You can build something new!']}`, async route => { await pending; await route.continue(); });
    try {
      await page.getByRole('button', { name: 'Replace show', exact: true }).click();
      await page.getByRole('button', { name: 'Speak replacement', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#replacement-light')?.textContent === 'replacement');
      await page.evaluate(() => Reflect.get(window, 'settleOldAnimation')());
      await oldHome.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
      await page.clock.runFor(700);
      assert.equal(await page.locator('#destination').textContent(), '');
      assert.equal(await page.locator('.lines').textContent(), '');
      assert.equal(await page.locator('.bigpile span').textContent(), '0');
      assert.equal(await page.locator('#replacement-light').textContent(), 'replacement');
      assert.match(await page.locator('.btns').getAttribute('class') ?? '', /asleep/);
      assert.equal(await page.locator('#saved-state').textContent(), await page.locator('#before-state').textContent());
    } finally {
      release();
      await page.unrouteAll({ behavior: 'wait' });
    }
  });
}

journey('purchase effects fail after the commit without retrying or trapping the Garage', async page => {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Garage', exact: true }).click();
  await page.getByRole('button', { name: 'Tires', exact: true }).dispatchEvent('click');
  await page.evaluate(() => {
    const append = Node.prototype.appendChild;
    Node.prototype.appendChild = function <T extends Node>(child: T): T {
      if (child instanceof Element && child.classList.contains('spark')) throw new Error('sparks unavailable');
      append.call(this, child);
      return child;
    };
  });
  await page.getByRole('button', { name: 'Giant', exact: true }).click();
  await page.locator('.blocker').waitFor({ state: 'detached' });
  const committed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  assert.equal(committed.bolts, 35);
  assert.ok(committed.unlocked.includes('tires:2'));
  assert.equal(committed.fitted.pickup.tires, 2);
  assert.deepEqual(committed.trophies, {});
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY), committed);
}, JOURNEY_SAVES.garage);

journey('leaving a committed Body celebration removes its fireworks without undoing the purchase', async page => {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Garage', exact: true }).click();
  await page.getByRole('button', { name: 'Fire Truck', exact: true }).click();
  await page.locator('.firework').first().waitFor();
  const committed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  await page.getByRole('button', { name: 'Home', exact: true }).dispatchEvent('click');
  await page.locator('.home').waitFor();
  assert.equal(await page.locator('.firework, .confetti, .spark').count(), 0);
  assert.equal(committed.body, 'firetruck');
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY), committed);
}, JOURNEY_SAVES.garage);

journey('cancelling a purchase restores the Truck rebuilt for its committed fit', async page => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-15T12:00:01Z'));
  await page.setContent('<div id="fixture"></div>');
  await page.addScriptTag({ content: await fixtureScript(new URL('./purchasePresentation.ts', import.meta.url)) });
  await page.getByRole('button', { name: 'Buy Giant', exact: true }).dispatchEvent('click');
  await page.clock.runFor(650);
  const committed = await page.locator('#saved-state').textContent();
  await page.getByRole('button', { name: 'Cancel show', exact: true }).dispatchEvent('click');
  await page.clock.runFor(32);
  await page.getByRole('button', { name: 'Sample Truck', exact: true }).dispatchEvent('click');
  const cancelled = await page.locator('#silhouette').textContent();
  assert.match(cancelled ?? '', /1/);
  await page.getByRole('button', { name: 'Resting Truck', exact: true }).dispatchEvent('click');
  await page.clock.runFor(32);
  await page.getByRole('button', { name: 'Sample Truck', exact: true }).dispatchEvent('click');
  assert.equal(cancelled, await page.locator('#silhouette').textContent());
  assert.equal(await page.locator('#saved-state').textContent(), committed);
});
