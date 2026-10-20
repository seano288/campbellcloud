// The family site's front page: one tile per game, grouped into sections. It registers its own service worker so it opens offline too.
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});

// Light or dark: follows the system until the button picks one, which is remembered. The <head> script applies it before first paint.
const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>('.theme')!;
const label = button.querySelector('.theme-label')!;
const system = matchMedia('(prefers-color-scheme: dark)');
const current = () => (root.dataset.theme ?? (system.matches ? 'dark' : 'light')) as 'light' | 'dark';
const show = () => { label.textContent = current() === 'dark' ? '☾ dark' : '☀︎ light'; };
button.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('cc-theme', next); } catch {}
  show();
});
system.addEventListener('change', show);
show();
