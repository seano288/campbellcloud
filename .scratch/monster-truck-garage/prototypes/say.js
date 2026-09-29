// PROTOTYPE voice engine, shared by app-shell-prototype.html and garage-3d-prototype.html so both
// speak with the same recorded neural voice as the game (clips in voice.js, made by make_prototype_voice.py).
// Each sentence plays as one clip. A sentence with money in it ("It costs $1.25.") is joined from
// pieces: "It costs" + "1 dollar" + "25 cents". A missing clip falls back to the browser voice and
// logs "missing clip", so gaps are easy to spot.
(() => {
  let actx, gen = 0, src = null, queue = [], running = false, cur = null;
  const ctx = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());
  const cache = {};
  const clip = key => cache[key] ||= (async () => {
    try { return await ctx().decodeAudioData(await (await fetch(VOICE[key])).arrayBuffer()); } catch { return null; }
  })();
  const has = k => VOICE[k] ? k : VOICE[k.replace(/[.!?,]+$/, '')] ? k.replace(/[.!?,]+$/, '') : null;
  const amountKeys = t => {
    const c = t.endsWith('¢') ? +t.slice(0, -1) : Math.round(parseFloat(t.slice(1)) * 100);
    const d = Math.floor(c / 100), r = c % 100, out = [];
    if (d) out.push(`${d} dollar${d === 1 ? '' : 's'}`);
    if (r || !d) out.push(`${r} cent${r === 1 ? '' : 's'}`);
    return out;
  };
  // one sentence -> the clip keys that speak it, or null if any piece is missing
  const keysFor = s => {
    if (has(s)) return [has(s)];
    const keys = [];
    for (const piece of s.split(/(\$\d+(?:\.\d\d)?|\d+¢)/)) {
      const p = piece.trim();
      if (!p || /^[.!?,]+$/.test(p)) continue;
      if (/^(\$\d|\d+¢)/.test(p)) { keys.push(...amountKeys(p)); continue; }
      const k = has(p); if (!k) { console.warn('missing clip:', JSON.stringify(p), 'in', JSON.stringify(s)); return null; }
      keys.push(k);
    }
    return keys.every(k => VOICE[k]) ? keys : (console.warn('missing clip in', JSON.stringify(s)), null);
  };
  const sentences = s => s.replace(/([.!?])\s+/g, '$1\n').split('\n').filter(Boolean);
  const tts = (text, done) => {
    const synth = window.speechSynthesis; if (!synth) return done();
    const u = new SpeechSynthesisUtterance(text.replace(/(\d+)¢/g, '$1 cents')); u.rate = .9; u.pitch = 1.1; u.onend = u.onerror = done; synth.speak(u);
  };
  async function pump(g) {
    running = true;
    while (g === gen && queue.length) {
      const item = cur = queue.shift(), { keys, text, el, res } = item;
      el?.classList.add('speaking');
      if (keys) for (const k of keys) {
        const buf = await clip(k); if (g !== gen || !buf) break;
        ctx().resume();
        await new Promise(ok => { src = ctx().createBufferSource(); src.buffer = buf; src.connect(ctx().destination); src.onended = ok; src.start(); });
      } else await new Promise(ok => tts(text, ok));
      el?.classList.remove('speaking'); res?.();
    }
    if (g === gen) running = false;
  }
  // parts: strings, or [text, element] to light the element while it's read. Returns a promise for when it's all said.
  function enqueue(parts) {
    let res; const p = new Promise(r => res = r);
    const items = parts.flatMap(x => { const [t, el] = Array.isArray(x) ? x : [x]; return (has(t) ? [t] : sentences(t)).map(s => ({ keys: keysFor(s), text: s, el })); }); // a whole-phrase clip wins over its sentences
    if (items.length) items[items.length - 1].res = res; else res();
    queue.push(...items);
    if (!running) pump(gen);
    return p;
  }
  window.say = (...parts) => {
    gen++; [cur, ...queue].forEach(i => i?.res?.()); cur = null; queue = []; running = false; // cut off: anyone waiting still gets resolved
    document.querySelectorAll('.speaking').forEach(e => e.classList.remove('speaking'));
    if (src) { src.onended = null; try { src.stop(); } catch {} src = null; }
    window.speechSynthesis?.cancel();
    return enqueue(parts);
  };
  window.sayMore = (...parts) => enqueue(parts); // add to what's already being said
  window.unlockAudio = () => { try { ctx().resume(); } catch {} };
})();
