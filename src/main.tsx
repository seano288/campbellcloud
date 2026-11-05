import { render, type ComponentType } from 'preact';
import { keepSoundAwake } from './audio/context';
import { registerServiceWorker } from './pwa';

/** `onTitle` says when a new version may reload the page in front of him (src/pwa.ts). */
export async function mountApp(App: ComponentType, load: () => Promise<unknown>, onTitle?: () => boolean) {
  registerServiceWorker(onTitle);
  keepSoundAwake();
  await load();
  render(<App />, document.getElementById('app')!);
}
