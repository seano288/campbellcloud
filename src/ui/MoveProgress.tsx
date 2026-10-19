// Moving his progress between Safari and the Home Screen app. On the iPad they keep separate storage, so a game added to
// the Home Screen starts fresh even though Safari still has his save. A grown-up holds the Start screen's title to open
// this: Copy in one, Paste in the other (the clipboard is shared), and the page reloads with the moved save.
import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';

const HOLD_MS = 1500;

export interface Transfer { game: string; saves: Record<string, string> }

export function exportProgress(game: string, keys: readonly string[], storage: Pick<Storage, 'getItem'> = localStorage): string {
  const saves: Record<string, string> = {};
  for (const key of keys) { const value = storage.getItem(key); if (value !== null) saves[key] = value; }
  return JSON.stringify({ game, saves } satisfies Transfer);
}

/** The saves to write, or null when the text isn't this game's progress. */
export function readProgress(game: string, keys: readonly string[], text: string): Record<string, string> | null {
  let data: unknown;
  try { data = JSON.parse(text.trim()); } catch { return null; }
  if (typeof data !== 'object' || data === null || (data as Transfer).game !== game) return null;
  const raw = (data as Transfer).saves;
  if (typeof raw !== 'object' || raw === null) return null;
  const saves = Object.fromEntries(keys.filter(k => typeof raw[k] === 'string').map(k => [k, raw[k]!]));
  return Object.keys(saves).length ? saves : null;
}

/** Wraps the Start screen's title: holding it opens the panel. */
export function HoldForProgress({ game, keys, children }: { game: string; keys: readonly string[]; children: ComponentChildren }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const cancel = () => clearTimeout(timer.current);
  return (
    <>
      <div class="hold-title" onPointerDown={() => { cancel(); timer.current = setTimeout(() => setOpen(true), HOLD_MS); }}
        onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={e => e.preventDefault()}>
        {children}
      </div>
      {open && <MoveProgress game={game} keys={keys} onClose={() => setOpen(false)} />}
    </>
  );
}

function MoveProgress({ game, keys, onClose }: { game: string; keys: readonly string[]; onClose(): void }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('Copy here, then Paste in the other one (Safari or the Home Screen app).');
  async function copy() {
    const code = exportProgress(game, keys);
    setText(code);
    try { await navigator.clipboard.writeText(code); setNote('Copied. Now open the other one, hold the title and tap Paste.'); }
    catch { setNote('Select the text below and copy it.'); }
  }
  async function paste() {
    let code = text;
    if (!code) try { code = await navigator.clipboard.readText(); setText(code); } catch {}
    const saves = readProgress(game, keys, code);
    if (!saves) { setNote(code ? 'That isn’t progress from this game.' : 'Paste the copied progress into the box first.'); return; }
    if (!confirm('Replace the progress here with the copied progress?')) return;
    for (const [key, value] of Object.entries(saves)) localStorage.setItem(key, value);
    location.reload();
  }
  return (
    <div class="modal">
      <div class="modal-card move-progress">
        <h2>Move progress</h2>
        <p>{note}</p>
        <textarea value={text} onInput={e => setText(e.currentTarget.value)} placeholder="Copied progress goes here" rows={4} />
        <div class="btns">
          <button class="big-btn" onClick={() => void copy()}>Copy</button>
          <button class="big-btn go" onClick={() => void paste()}>Paste</button>
          <button class="big-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
