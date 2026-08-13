/* the killer tv — one page, three faces.

   #      → setup (before the split)
   #admin → the remote  (owns the game)
   #tv    → the big screen (renders the game)

   The setup screen opens the TV in a second window and turns itself into the
   remote, so nobody has to type a URL twice. */

(function () {
  function cachedState() {
    try {
      const raw = localStorage.getItem('killer-tv:state');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 2 || !s.players || !s.players.length) return null;
      return s;
    } catch (e) { return null; }
  }

  function route() {
    const hash = (location.hash || '').replace('#', '');

    if (hash === 'tv') {
      TV.mount();
      return;
    }

    if (hash === 'admin') {
      const s = cachedState();
      if (s) { Admin.resume(s); return; }
    }

    document.body.dataset.view = 'setup';
    Setup.mount();
  }

  route();
})();
