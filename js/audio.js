/* the killer tv — sound.

   Effects are synthesised, so there is nothing to download. The narrator plays
   files from /audio when they exist and falls back to the browser's own voice
   when they don't, so the game always talks even with an empty audio folder. */

const Sound = (function () {
  let ctx = null, out = null, on = true;

  function ready() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = 0.4;
      out.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(node, gain, a, h, r, peak) {
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + a);
    gain.gain.setValueAtTime(peak, t + a + h);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + h + r);
    node.start(t);
    node.stop(t + a + h + r + 0.05);
  }

  function tone(freq, type, a, h, r, peak) {
    if (!on || !ready()) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(out);
    env(o, g, a, h, r, peak);
  }

  function noise(dur, cut, peak) {
    if (!on || !ready()) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut;
    const g = ctx.createGain(); g.gain.value = peak;
    src.connect(f); f.connect(g); g.connect(out);
    src.start();
  }

  const cues = {
    tap:  () => tone(660, 'triangle', .004, .015, .07, .08),
    step: () => { if (on && ready()) { tone(150, 'sine', .005, .04, .3, .35); noise(.12, 500, .07); } },
    dawn: () => { tone(523, 'sine', .02, .12, .9, .13); setTimeout(() => tone(784, 'sine', .02, .16, 1.1, .1), 150); },
    dead: () => { if (on && ready()) { noise(.5, 2200, .3); tone(140, 'sawtooth', .005, .08, .6, .25); } },
    vote: () => { tone(330, 'triangle', .01, .06, .3, .16); setTimeout(() => tone(247, 'triangle', .01, .1, .5, .16), 130); },
    win:  () => [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 'triangle', .01, .1, .45, .16), i * 100)),
  };

  return {
    play: (n) => { const f = cues[n]; if (f) f(); },
    setEnabled: (v) => { on = v; },
    unlock: ready,
  };
})();


const Narrator = (function () {
  const DIR = 'audio/';
  let ext = '.mp3';

  let enabled = true;
  let say = { night: true, deaths: true, day: true, endings: true };
  let voice = null;
  let pick = '';
  let seq = 0;
  let queue = [];
  let current = null;
  const missing = Object.create(null);
  let have = 0;

  /* en-GB males first, then anything English. */
  const PREFERRED = [
    /^Google UK English Male$/i,
    /\b(Ryan|George|Thomas|Oliver|Arthur|Brian|Daniel)\b/i,
    /\bmale\b/i,
  ];

  const voices = () => ('speechSynthesis' in window ? speechSynthesis.getVoices() : []);

  function chooseVoice() {
    const all = voices();
    if (!all.length) return;
    if (pick) {
      const exact = all.find((v) => v.name === pick);
      if (exact) { voice = exact; return; }
    }
    const gb = all.filter((v) => /^en[-_]GB/i.test(v.lang));
    const pool = gb.length ? gb : all;
    for (const re of PREFERRED) {
      const hit = pool.find((v) => re.test(v.name));
      if (hit) { voice = hit; return; }
    }
    voice = gb[0] || all.find((v) => /^en/i.test(v.lang)) || all[0];
  }

  if ('speechSynthesis' in window) {
    chooseVoice();
    speechSynthesis.addEventListener('voiceschanged', chooseVoice);
  }

  function warm() {
    return fetch(DIR + 'manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!m || !Array.isArray(m.lines)) return;
        if (m.format) ext = '.' + String(m.format).replace(/^\./, '');
        have = m.lines.length;
        LINE_IDS.forEach((id) => { if (m.lines.indexOf(id) === -1) missing[id] = 1; });
      })
      .catch(() => {});
  }

  const allowed = (id) => enabled && say[lineCat(id)] !== false;

  function speak(ids) {
    stop();
    queue = (Array.isArray(ids) ? ids : [ids]).filter((id) => id && allowed(id));
    next(seq);
  }

  /* Lines run back to back, each starting when the last actually ends, so the
     pacing holds whether a clip is half a second or four. The guard covers a
     tier that never reports finishing — a muted tab, or a speech engine that
     swallows its own end event — so the queue can't strand. */
  function next(token) {
    if (token !== seq) return;
    const id = queue.shift();
    if (!id) return;

    let moved = false;
    const done = () => {
      if (moved || token !== seq) return;
      moved = true;
      clearTimeout(guard);
      next(token);
    };
    const guard = setTimeout(done, 1800 + lineText(id).split(/\s+/).length * 420);

    if (missing[id]) speakLocal(id, token, done);
    else playFile(id, token, done);
  }

  /* One outcome per attempt: a 404 fires both an error event and a rejected
     play(), and letting both through made every line speak twice. */
  function playFile(id, token, done) {
    const a = new Audio(DIR + id + ext);
    current = a;
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      missing[id] = 1;
      if (token === seq) speakLocal(id, token, done);
    };
    a.addEventListener('error', fail);
    a.addEventListener('ended', () => { settled = true; done(); });
    a.play().then(() => { settled = true; }).catch(fail);
  }

  function speakLocal(id, token, done) {
    const text = lineText(id);
    if (!text || !('speechSynthesis' in window)) { done(); return; }
    if (!voice) chooseVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 0.7;
    u.onend = () => { if (token === seq) done(); };
    u.onerror = () => { if (token === seq) done(); };
    speechSynthesis.speak(u);
  }

  function preview(text) {
    stop();
    if (!('speechSynthesis' in window)) return;
    if (!voice) chooseVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.92; u.pitch = 0.7;
    speechSynthesis.speak(u);
  }

  function stop() {
    seq++;
    queue = [];
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (current) { try { current.pause(); } catch (e) {} current = null; }
  }

  function options() {
    const list = [{ value: '', label: 'Automatic' }];
    voices().filter((v) => /^en/i.test(v.lang))
      .forEach((v) => list.push({ value: v.name, label: v.name }));
    return list;
  }

  function status() {
    if (have >= LINE_IDS.length) return 'Using the recordings in /audio.';
    if (have > 0) return have + ' of ' + LINE_IDS.length + ' lines recorded; the rest are spoken by the browser.';
    if (!voice) return 'No speech available in this browser.';
    return voice.name + (/^en[-_]GB/i.test(voice.lang) ? '' : ' — not a British voice');
  }

  return {
    speak: speak, preview: preview, stop: stop, warm: warm, options: options, status: status,
    setEnabled: (v) => { enabled = v; if (!v) stop(); },
    setSay: (s) => { say = Object.assign({ night: true, deaths: true, day: true, endings: true }, s || {}); },
    setVoice: (name) => { pick = name || ''; chooseVoice(); },
  };
})();
