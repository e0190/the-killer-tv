/* the killer tv — sound.

   Effects are synthesised in the browser, so there is nothing to download.

   The narrator has three tiers and always uses the best one available:
     1. your own audio files in /audio — see AUDIO.md
     2. Google Cloud TTS via /api/tts, if a key is configured
     3. the browser's built-in speech engine

   Every tier falls through to the next on failure, so the narrator is never
   silent and a half-finished audio pack still plays fine. */

const Sound = (function () {
  let ctx = null, master = null, drone = null, enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.45;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setEnabled(v) { enabled = v; if (!v) stopDrone(); }

  function env(node, gain, attack, hold, release, peak) {
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.setValueAtTime(peak, t + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    node.start(t);
    node.stop(t + attack + hold + release + 0.05);
  }

  function tone(freq, type, attack, hold, release, peak) {
    if (!enabled || !ensure()) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(master);
    env(o, g, attack, hold, release, peak);
  }

  function noise(duration, cutoff, peak) {
    if (!enabled || !ensure()) return;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff || 1200;
    const g = ctx.createGain(); g.gain.value = peak || 0.3;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  const cues = {
    thud() {
      if (!enabled || !ensure()) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(34, ctx.currentTime + 0.55);
      o.connect(g); g.connect(master);
      env(o, g, 0.005, 0.05, 0.6, 0.65);
      noise(0.2, 460, 0.14);
    },
    blip() { tone(760, 'triangle', 0.004, 0.02, 0.08, 0.1); },
    tick() { tone(1400, 'square', 0.001, 0.004, 0.035, 0.05); },
    stab() {
      if (!enabled || !ensure()) return;
      noise(0.7, 2600, 0.45);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.8);
      o.connect(g); g.connect(master);
      env(o, g, 0.005, 0.12, 0.8, 0.35);
    },
    riser() {
      if (!enabled || !ensure()) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(80, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 2.4);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(280, ctx.currentTime);
      f.frequency.exponentialRampToValueAtTime(3600, ctx.currentTime + 2.4);
      o.connect(f); f.connect(g); g.connect(master);
      env(o, g, 0.4, 1.4, 0.6, 0.2);
    },
    dawn() {
      tone(392, 'sine', 0.03, 0.2, 1.4, 0.16);
      setTimeout(() => tone(523.25, 'sine', 0.03, 0.2, 1.4, 0.13), 180);
      setTimeout(() => tone(659.25, 'sine', 0.03, 0.25, 1.8, 0.11), 380);
    },
    toll() {
      tone(110, 'sine', 0.01, 0.3, 2.2, 0.3);
      tone(220.5, 'sine', 0.01, 0.3, 1.8, 0.12);
    },
  };

  function play(name) { const f = cues[name]; if (f) f(); }

  function startDrone() {
    if (!enabled || !ensure() || drone) return;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    o1.type = 'sawtooth'; o1.frequency.value = 52;
    o2.type = 'sawtooth'; o2.frequency.value = 52.5;
    f.type = 'lowpass'; f.frequency.value = 200;
    g.gain.value = 0.0001;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o1.start(); o2.start();
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2.5);
    drone = { o1, o2, g };
  }

  function stopDrone() {
    if (!drone || !ctx) return;
    const d = drone; drone = null;
    try {
      d.g.gain.cancelScheduledValues(ctx.currentTime);
      d.g.gain.setValueAtTime(d.g.gain.value, ctx.currentTime);
      d.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      setTimeout(() => { try { d.o1.stop(); d.o2.stop(); } catch (e) {} }, 1500);
    } catch (e) { /* ignore */ }
  }

  return { play, startDrone, stopDrone, setEnabled, ensure };
})();


const Narrator = (function () {
  const DIR = 'audio/';
  const EXT = '.mp3';
  const RATE = 0.84;
  const PITCH = 0.55;

  let enabled = true;
  let voice = null;
  let choice = '';
  let cloudReady = null;
  let cloudBackend = '';
  let current = null;
  let packIds = [];        // line ids dropped into the browser
  let seq = 0;             // bumps on every shush; stale callbacks check it

  const fileState = {};    // line id -> 'ok' | 'missing'
  const cloudCache = new Map();

  const BRITISH_MALE = [
    /^Google UK English Male$/i,
    /\b(Ryan|George|Thomas|Oliver|Arthur|Brian|Alfie|Elliot|Ethan|Noah)\b/i,
    /^Daniel$/i,
    /\bmale\b/i,
  ];

  const allVoices = () => ('speechSynthesis' in window ? speechSynthesis.getVoices() : []);

  function pickVoice() {
    const all = allVoices();
    if (!all.length) return;
    if (choice && choice !== 'cloud') {
      const exact = all.find((v) => v.name === choice);
      if (exact) { voice = exact; return; }
    }
    const gb = all.filter((v) => /^en[-_]GB/i.test(v.lang));
    const pool = gb.length ? gb : all;
    for (const re of BRITISH_MALE) {
      const hit = pool.find((v) => re.test(v.name));
      if (hit) { voice = hit; return; }
    }
    voice = gb[0] || all.find((v) => /^en/i.test(v.lang)) || all[0];
  }

  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  /* Find out what we've got to work with: what's been dropped into the
     browser, what's sitting in /audio, and whether the cloud voice answers. */
  function warm() {
    const jobs = [
      refreshPack(),
      fetch(DIR + 'manifest.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .then((m) => {
          if (!m || !Array.isArray(m.lines)) return;
          m.lines.forEach((id) => { fileState[id] = 'ok'; });
        })
        .catch(() => {}),
      fetch('api/tts', { method: 'GET' })
        .then((r) => (r.ok ? r.json() : { ok: false }))
        .then((j) => { cloudReady = !!j.ok; cloudBackend = j.backend || ''; })
        .catch(() => { cloudReady = false; }),
    ];
    return Promise.all(jobs).then(() => ({ pack: packIds.length, cloud: cloudReady }));
  }

  function refreshPack() {
    if (!Pack.available) return Promise.resolve([]);
    return Pack.ids().then((k) => { packIds = k; return k; }).catch(() => []);
  }

  /* ---- the ladder ----

     pack (dropped in) → /audio file → cloud → the browser's own voice.
     Every tier falls through to the next exactly once. `seq` is what stops a
     failed tier from being retried by a stale callback and speaking twice. */

  const TIERS = ['pack', 'file', 'cloud', 'voice'];

  function say(id) {
    if (!enabled || !id) return;
    shush();
    step(id, seq, 0);
  }

  function step(id, token, i) {
    if (token !== seq) return;
    const tier = TIERS[i];
    if (!tier) return;
    const fall = () => step(id, token, i + 1);

    switch (tier) {
      case 'pack':
        if (!Pack.available || packIds.indexOf(id) === -1) return fall();
        Pack.get(id).then((blob) => {
          if (token !== seq) return;
          if (!blob) return fall();
          playMedia(URL.createObjectURL(blob), token, fall, true);
        }).catch(fall);
        return;

      case 'file':
        if (fileState[id] === 'missing') return fall();
        playMedia(DIR + id + EXT, token, () => { fileState[id] = 'missing'; fall(); }, false);
        return;

      case 'cloud': {
        if (!cloudReady || (choice && choice !== 'cloud')) return fall();
        const hit = cloudCache.get(id);
        if (hit) return playMedia(hit, token, fall, false);
        const text = LINES[id];
        if (!text) return fall();
        fetch('api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text }),
        })
          .then((r) => { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
          .then((b) => {
            if (token !== seq) return;
            const u = URL.createObjectURL(b);
            cloudCache.set(id, u);
            playMedia(u, token, fall, false);
          })
          .catch(() => { cloudReady = false; fall(); });
        return;
      }

      default:
        sayLocal(id);
    }
  }

  /* One outcome per attempt. A 404 fires both an error event and a rejected
     play() promise, which is how this used to say every line twice. */
  function playMedia(src, token, onFail, revoke) {
    const a = new Audio(src);
    current = a;
    let settled = false;
    const finish = () => { settled = true; if (revoke) URL.revokeObjectURL(src); };
    const bail = () => {
      if (settled) return;
      finish();
      if (token === seq) onFail();
    };
    a.addEventListener('error', bail);
    a.addEventListener('ended', finish);
    a.play().then(() => { settled = true; }).catch(bail);
  }

  function sayLocal(id) {
    const text = LINES[id];
    if (!text || !('speechSynthesis' in window)) return;
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = RATE;
    u.pitch = PITCH;
    speechSynthesis.speak(u);
  }

  /* Speak raw text with no clip behind it — used only for the voice preview. */
  function preview(text) {
    if (!('speechSynthesis' in window)) return;
    shush();
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = RATE; u.pitch = PITCH;
    speechSynthesis.speak(u);
  }

  function shush() {
    seq++;                                     // anything in flight is now stale
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (current) { try { current.pause(); } catch (e) {} current = null; }
  }

  function setEnabled(v) { enabled = v; if (!v) shush(); }
  function setVoice(name) { choice = name || ''; pickVoice(); }

  function options() {
    const list = [{ value: '', label: 'Auto — best available' }];
    if (cloudReady) list.push({ value: 'cloud', label: 'Generated voice (Gemini / Cloud)' });
    allVoices().filter((v) => /^en/i.test(v.lang))
      .forEach((v) => list.push({ value: v.name, label: v.name + ' · ' + v.lang }));
    return list;
  }

  function status() {
    const total = LINE_IDS.length;
    const have = packIds.length;
    if (have >= total) return { tier: 'pack', have: have, total: total, detail: 'Your own pack — all ' + total + ' lines installed.' };
    if (have > 0) return { tier: 'pack', have: have, total: total, detail: 'Your own pack — ' + have + ' of ' + total + ' lines. The rest fall back.' };
    if (cloudReady) return { tier: 'cloud', have: 0, total: total, detail: 'Generated voice' + (cloudBackend ? ' (' + cloudBackend + ')' : '') + '. Drop your own files in to replace it.' };
    const v = voice;
    return {
      tier: 'browser', have: 0, total: total,
      detail: v ? 'Browser voice — ' + v.name + (/^en[-_]GB/i.test(v.lang) ? '' : ' (not British)') : 'No voice available.',
    };
  }

  const installed = () => packIds.slice();

  return { say, preview, shush, setEnabled, setVoice, warm, refreshPack, options, status, installed };
})();
