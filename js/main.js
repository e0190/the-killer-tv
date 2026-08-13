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

  /* Changing the hash is a same-document navigation, so nothing re-runs on its
     own. Someone editing the URL by hand should still land where they asked. */
  let current = location.hash;
  window.addEventListener('hashchange', () => {
    if (location.hash === current) return;
    current = location.hash;
    location.reload();
  });
})();
