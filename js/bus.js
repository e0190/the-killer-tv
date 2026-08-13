/* the killer tv — the wire between the two halves.

   The admin window owns the state. The TV is a dumb renderer.
   Transport is BroadcastChannel (same browser, any number of windows/displays),
   with a localStorage 'storage' event fallback for older browsers.
   No server, no network, works from file:// and offline. */

const CHANNEL = 'killer-tv-v1';
const LS_KEY = 'killer-tv:msg';

const Bus = (function () {
  let bc = null;
  let peer = null;                 // the other window, when we have a handle on it
  const handlers = [];
  const seen = {};                 // de-dupe: the same message can arrive twice
  const selfId = Math.random().toString(36).slice(2, 10);

  try {
    if (typeof BroadcastChannel !== 'undefined') bc = new BroadcastChannel(CHANNEL);
  } catch (e) { bc = null; }

  function deliver(msg) {
    if (!msg || msg.__ktv !== CHANNEL || msg.from === selfId) return;
    const stamp = msg.from + ':' + msg.n;
    if (seen[stamp]) return;
    seen[stamp] = 1;
    if (Object.keys(seen).length > 400) for (const k in seen) delete seen[k];
    handlers.forEach((fn) => fn(msg));
  }

  if (bc) bc.onmessage = (ev) => deliver(ev.data);

  // Direct window-to-window. This is the path that still works on file://,
  // where BroadcastChannel and localStorage are per-document islands.
  window.addEventListener('message', (ev) => {
    if (ev.origin !== location.origin && ev.origin !== 'null') return;
    deliver(ev.data);
  });

  // Third rope: localStorage events cross windows on the same origin.
  window.addEventListener('storage', (ev) => {
    if (ev.key !== LS_KEY || !ev.newValue) return;
    try { deliver(JSON.parse(ev.newValue)); } catch (e) { /* ignore */ }
  });

  let n = 0;
  function send(type, payload) {
    const msg = { __ktv: CHANNEL, type, payload, from: selfId, n: ++n, t: Date.now() };
    if (bc) { try { bc.postMessage(msg); } catch (e) { /* ignore */ } }
    if (peer) {
      try { if (!peer.closed) peer.postMessage(msg, '*'); } catch (e) { /* ignore */ }
    }
    if (!bc) { try { localStorage.setItem(LS_KEY, JSON.stringify(msg)); } catch (e) { /* ignore */ } }
  }

  function setPeer(win) { if (win) peer = win; }
  function on(fn) { handlers.push(fn); }

  // The TV is always opened by the remote, so it always has an opener to talk to.
  try { if (window.opener && window.opener !== window) peer = window.opener; } catch (e) { /* ignore */ }

  return { send, on, setPeer, id: selfId, supported: !!bc };
})();

/* Heartbeat: each side pings, each side notices when the other goes quiet. */
const Link = (function () {
  let lastSeen = 0;
  let onChange = null;
  let connected = false;
  let role = 'unknown';

  let running = false;

  function start(myRole, cb) {
    role = myRole;
    onChange = cb;
    if (running) return;           // a new round must not stack up another heartbeat
    running = true;
    setInterval(() => {
      Bus.send('ping', { role });
      const alive = Date.now() - lastSeen < 4000;
      if (alive !== connected) {
        connected = alive;
        if (onChange) onChange(connected);
      }
    }, 1200);
    Bus.on((msg) => {
      if (msg.type === 'ping' && msg.payload && msg.payload.role !== role) {
        lastSeen = Date.now();
        if (!connected) {
          connected = true;
          if (onChange) onChange(true);
        }
      }
    });
    Bus.send('ping', { role });
  }

  return { start, isConnected: () => connected };
})();
