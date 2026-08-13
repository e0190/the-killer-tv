/* the killer tv — all sound is synthesised. No asset files, nothing to load. */

const Sound = (function () {
  let ctx = null;
  let master = null;
  let drone = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setEnabled(v) {
    enabled = v;
    if (!v) stopDrone();
  }

  function env(node, gainNode, attack, hold, release, peak) {
    const t = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
    gainNode.gain.setValueAtTime(peak, t + attack + hold);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    node.start(t);
    node.stop(t + attack + hold + release + 0.05);
  }

  function tone(freq, type, attack, hold, release, peak) {
    if (!enabled || !ensure()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(master);
    env(o, g, attack, hold, release, peak);
    return o;
  }

  function noise(duration, filterFreq, peak) {
    if (!enabled || !ensure()) return;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1200;
    const g = ctx.createGain();
    g.gain.value = peak || 0.3;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  const cues = {
    // deep hit — phase change
    thud() {
      if (!enabled || !ensure()) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.5);
      o.connect(g); g.connect(master);
      env(o, g, 0.005, 0.05, 0.55, 0.7);
      noise(0.18, 500, 0.16);
    },
    // soft blip — ui
    blip() { tone(880, 'triangle', 0.005, 0.02, 0.09, 0.12); },
    // clock tick in the last seconds
    tick() { tone(1500, 'square', 0.001, 0.005, 0.04, 0.06); },
    // rising dread — vote countdown
    riser() {
      if (!enabled || !ensure()) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(90, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 2.6);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(300, ctx.currentTime);
      f.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 2.6);
      o.connect(f); f.connect(g); g.connect(master);
      env(o, g, 0.4, 1.6, 0.6, 0.22);
    },
    // the kill
    stab() {
      if (!enabled || !ensure()) return;
      noise(0.6, 3000, 0.5);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1400, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.7);
      o.connect(g); g.connect(master);
      env(o, g, 0.005, 0.1, 0.7, 0.4);
    },
    // dawn
    chime() {
      tone(523.25, 'sine', 0.02, 0.15, 1.2, 0.2);
      setTimeout(() => tone(659.25, 'sine', 0.02, 0.15, 1.2, 0.16), 140);
      setTimeout(() => tone(783.99, 'sine', 0.02, 0.2, 1.6, 0.14), 300);
    },
    fanfare() {
      [392, 523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => tone(f, 'triangle', 0.01, 0.12, 0.5, 0.22), i * 110);
      });
    },
  };

  function play(name) {
    const fn = cues[name];
    if (fn) fn();
  }

  function startDrone() {
    if (!enabled || !ensure() || drone) return;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o1.type = 'sawtooth'; o1.frequency.value = 55;
    o2.type = 'sawtooth'; o2.frequency.value = 55.6;
    f.type = 'lowpass'; f.frequency.value = 220;
    g.gain.value = 0.0001;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o1.start(); o2.start();
    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 2);
    drone = { o1, o2, g };
  }

  function stopDrone() {
    if (!drone || !ctx) return;
    const d = drone;
    drone = null;
    try {
      d.g.gain.cancelScheduledValues(ctx.currentTime);
      d.g.gain.setValueAtTime(d.g.gain.value, ctx.currentTime);
      d.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      setTimeout(() => { try { d.o1.stop(); d.o2.stop(); } catch (e) {} }, 1200);
    } catch (e) { /* ignore */ }
  }

  return { play, startDrone, stopDrone, setEnabled, ensure };
})();

/* The narrator.

   Two engines, best first:
     1. Google Cloud Text-to-Speech, through /api/tts. The key lives in a Vercel
        env var and never reaches the browser. This is the good one.
     2. The browser's own speech engine, steered towards a British male voice.

   Either way it's pitched down and slowed a little: deep and quiet-spoken,
   not a whisper. If the network path fails mid-game it silently drops to the
   local engine — the narrator never goes mute. */

const Narrator = (function () {
  const RATE = 0.84;
  const PITCH = 0.55;

  let enabled = true;
  let voice = null;
  let choice = '';          // '' = auto, 'cloud', or an exact local voice name
  let cloudReady = null;    // null = not probed yet
  let current = null;       // the <audio> that's talking
  const cache = new Map();  // line -> blob url, so repeated lines cost nothing

  /* en-GB males, most convincing first. */
  const BRITISH_MALE = [
    /^Google UK English Male$/i,
    /\b(Ryan|George|Thomas|Oliver|Arthur|Brian|Alfie|Elliot|Ethan|Noah)\b/i,
    /^Daniel$/i,
    /\bmale\b/i,
  ];

  function allVoices() {
    return ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
  }

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

  /* Is the cloud voice actually wired up on this deployment? */
  function warm() {
    if (cloudReady !== null) return Promise.resolve(cloudReady);
    return fetch('api/tts', { method: 'GET' })
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((j) => { cloudReady = !!j.ok; return cloudReady; })
      .catch(() => { cloudReady = false; return false; });
  }

  function useCloud() {
    if (choice && choice !== 'cloud') return false;   // user picked a local voice
    return cloudReady === true;
  }

  function say(text) {
    if (!enabled || !text) return;
    shush();
    if (useCloud()) sayCloud(text);
    else sayLocal(text);
  }

  function sayLocal(text) {
    if (!('speechSynthesis' in window)) return;
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = RATE;
    u.pitch = PITCH;
    u.volume = 1;
    speechSynthesis.speak(u);
  }

  function sayCloud(text) {
    const cached = cache.get(text);
    if (cached) return playUrl(cached, text);

    fetch('api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((r) => { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        cache.set(text, url);
        playUrl(url, text);
      })
      .catch(() => { cloudReady = false; sayLocal(text); });
  }

  function playUrl(url, text) {
    const a = new Audio(url);
    a.volume = 1;
    current = a;
    a.play().catch(() => sayLocal(text));
  }

  function shush() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (current) { try { current.pause(); } catch (e) {} current = null; }
  }

  function setEnabled(v) { enabled = v; if (!v) shush(); }

  function setVoice(name) {
    choice = name || '';
    pickVoice();
  }

  /* For the setup screen's voice picker. */
  function options() {
    const list = [{ value: '', label: 'Auto — best British voice here' }];
    if (cloudReady) list.push({ value: 'cloud', label: 'Google Cloud — deep British' });
    allVoices()
      .filter((v) => /^en/i.test(v.lang))
      .forEach((v) => list.push({ value: v.name, label: v.name + ' · ' + v.lang }));
    return list;
  }

  function currentVoice() {
    if (useCloud()) return { name: 'Google Cloud', lang: 'en-GB', cloud: true, british: true };
    if (!voice) pickVoice();
    if (!voice) return null;
    return { name: voice.name, lang: voice.lang, cloud: false, british: /^en[-_]GB/i.test(voice.lang) };
  }

  return { say, shush, setEnabled, setVoice, warm, options, currentVoice, cloudReady: () => cloudReady };
})();
