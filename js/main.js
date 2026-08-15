/* the killer tv — one page, three faces.

     #        setup, before the split
     #admin   the remote, which owns the game
     #tv      the big screen, which renders it

   Setup opens the TV in a second window and turns itself into the remote, so
   nobody has to type a URL twice. */

(function () {
  function cached() {
    try {
      const raw = localStorage.getItem('killer-tv:state');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 3 || !s.players || !s.players.length) return null;
      return s;
    } catch (e) { return null; }
  }

  function route() {
    const hash = (location.hash || '').replace('#', '');

    if (hash === 'tv') { TV.mount(); return; }
    if (hash === 'admin') {
      const s = cached();
      if (s) { Admin.resume(s); return; }
    }

    document.body.dataset.view = 'setup';
    Setup.mount();
  }

  route();

  /* Changing the hash is a same-document navigation, so nothing re-runs on its
     own. Somebody editing the URL by hand should still land where they asked. */
  let here = location.hash;
  window.addEventListener('hashchange', () => {
    if (location.hash === here) return;
    here = location.hash;
    location.reload();
  });
})();
