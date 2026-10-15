import { render, type ComponentType } from 'preact';
import { registerServiceWorker } from './pwa';

export async function mountApp(App: ComponentType, load: () => Promise<unknown>) {
  registerServiceWorker();
  await load();
  render(<App />, document.getElementById('app')!);
}
