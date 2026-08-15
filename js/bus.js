/* the killer tv — the wire between the two windows.

   The remote owns the game and pushes a copy of it to the TV. Three transports,
   because each one has a hole: BroadcastChannel is the good path but doesn't
   exist on file://, a direct window handle covers that, and localStorage events
   catch anything else. Messages are de-duped, so all three running at once is
   harmless. No server, works offline. */

const Bus = (function () {
  const CHANNEL = 'killer-tv-v3';
  const LS_KEY = 'killer-tv:msg';

  const me = Math.random().toString(36).slice(2, 10);
  const handlers = [];
  const seen = Object.create(null);
  let channel = null;
  let peer = null;
  let n = 0;

  try {
    if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(CHANNEL);
  } catch (e) { channel = null; }

  function deliver(msg) {
    if (!msg || msg.ch !== CHANNEL || msg.from === me) return;
    const key = msg.from + ':' + msg.n;
    if (seen[key]) return;
    seen[key] = 1;
    handlers.forEach((fn) => fn(msg));
  }

  if (channel) channel.onmessage = (e) => deliver(e.data);

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin && e.origin !== 'null') return;
    deliver(e.data);
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== LS_KEY || !e.newValue) return;
    try { deliver(JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
  });

  try { if (window.opener && window.opener !== window) peer = window.opener; } catch (e) { /* ignore */ }

  function send(type, data) {
    const msg = { ch: CHANNEL, type: type, data: data, from: me, n: ++n };
    if (channel) { try { channel.postMessage(msg); } catch (e) { /* ignore */ } }
    if (peer) { try { if (!peer.closed) peer.postMessage(msg, '*'); } catch (e) { /* ignore */ } }
    if (!channel) { try { localStorage.setItem(LS_KEY, JSON.stringify(msg)); } catch (e) { /* ignore */ } }
  }

  return {
    send: send,
    on: (fn) => handlers.push(fn),
    setPeer: (w) => { if (w) peer = w; },
  };
})();

/* Each side pings; each side notices when the other stops. */
const Link = (function () {
  let started = false;
  let lastSeen = 0;
  let up = false;

  function start(role, onChange) {
    if (started) return;
    started = true;

    Bus.on((msg) => {
      if (msg.type !== 'ping' || !msg.data || msg.data.role === role) return;
      lastSeen = Date.now();
      if (!up) { up = true; onChange(true); }
    });

    setInterval(() => {
      Bus.send('ping', { role: role });
      const alive = Date.now() - lastSeen < 4000;
      if (alive !== up) { up = alive; onChange(alive); }
    }, 1200);

    Bus.send('ping', { role: role });
  }

  return { start: start, isUp: () => up };
})();
