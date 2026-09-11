/* the killer tv — the setup sheet, and the only screen before the split.

   A seat is a card lying on a table, not a form field with a label above it.
   Before a role is chosen the mark well holds the deck's own back: the seat is
   dealt, but face down. Choosing a role turns it over. */

const Setup = (function () {
  const MIN = 4, MAX = 12;
  const $ = (id) => document.getElementById(id);

  /* The deck's marks, by role. `s-back` stands in for a seat not yet dealt. */
  const MARK = {
    killer: 's-killer', minion: 's-minion', mason: 's-mason', seer: 's-seer',
    robber: 's-robber', troublemaker: 's-trouble', insomniac: 's-insomniac',
    doppelganger: 's-doppel', hunter: 's-hunter', tanner: 's-tanner',
    villager: 's-villager',
  };
  const markOf = (role) => '#' + (MARK[role] || 's-back');

  const WORDS = ['', '', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
                 'Nine', 'Ten', 'Eleven', 'Twelve'];

  let count = 8;
  let names = [];
  let roles = [];
  let reveal = 'role';
  let say = {};
  let opts = { rules: true, story: true, sfx: true };
  let ready = false;

  function mount() {
    if (ready) return;
    ready = true;

    roles = (PRESETS[count] || []).slice();
    SAY_CATEGORIES.forEach((c) => { say[c.id] = true; });

    $('fewer').addEventListener('click', () => setCount(count - 1));
    $('more').addEventListener('click', () => setCount(count + 1));
    $('fillCast').addEventListener('click', () => {
      readNames();
      roles = (PRESETS[count] || []).slice();
      Sound.play('tap');
      drawCast();
    });

    check('optRules', 'rules');
    check('optStory', 'story');
    check('optSfx', 'sfx');

    document.querySelectorAll('[data-reveal]').forEach((b) => {
      b.addEventListener('click', () => {
        reveal = b.dataset.reveal;
        document.querySelectorAll('[data-reveal]').forEach((x) =>
          x.setAttribute('aria-checked', String(x.dataset.reveal === reveal)));
        Sound.play('tap');
        drawTally();
      });
    });

    drawSayRows();

    $('optVoice').addEventListener('change', () => {
      Narrator.setVoice($('optVoice').value);
      drawVoice();
      Narrator.preview(lineText('call_seer'));
    });
    $('testVoice').addEventListener('click', () => {
      Sound.unlock();
      Narrator.setEnabled(true);
      Narrator.preview(lineText('call_killer'));
    });

    $('start').addEventListener('click', () => { $('openDialog').hidden = false; });
    $('openCancel').addEventListener('click', () => { $('openDialog').hidden = true; });
    $('openWindow').addEventListener('click', () => begin('window'));
    $('openTab').addEventListener('click', () => begin('tab'));
    $('openDialog').addEventListener('click', (e) => {
      if (e.target === $('openDialog')) $('openDialog').hidden = true;
    });

    Narrator.warm().then(drawVoice);
    drawVoice();
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', drawVoice);

    drawCast();
  }

  /* A checkbox is a ruled row with a filled square, so it belongs to the same
     box of parts as everything else here. */
  function check(id, key) {
    const el = $(id);
    el.addEventListener('click', () => {
      opts[key] = !opts[key];
      el.setAttribute('aria-pressed', String(opts[key]));
      Sound.play('tap');
    });
  }

  function setCount(n) {
    if (n < MIN || n > MAX) return;
    readNames();
    count = n;
    roles = roles.slice(0, n);
    while (roles.length < n) roles.push('');
    Sound.play('tap');
    drawCast();
  }

  function readNames() {
    document.querySelectorAll('#cast input').forEach((el, i) => { names[i] = el.value; });
  }

  function roleOptions(sel) {
    return '<option value="">Face down…</option>' + ROLE_IDS.map((id) =>
      '<option value="' + id + '"' + (sel === id ? ' selected' : '') + '>' + ROLES[id].name + '</option>'
    ).join('');
  }

  function drawCast() {
    const box = $('cast');
    box.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'hand-card';
      card.innerHTML =
        '<div class="well"><svg viewBox="0 0 100 100"><use href="' + markOf(roles[i]) + '"></use></svg></div>' +
        '<div class="hand-main">' +
          '<div class="hand-name">' +
            '<span class="seat">' + (i + 1) + '</span>' +
            '<input type="text" maxlength="14" autocomplete="off" aria-label="Player name" ' +
              'placeholder="Player ' + (i + 1) + '" value="' + esc(names[i] || '') + '">' +
          '</div>' +
          '<div class="hand-role">' +
            '<select data-slot="' + i + '" aria-label="Role">' + roleOptions(roles[i]) + '</select>' +
            '<span class="caret">▾</span>' +
          '</div>' +
        '</div>';
      box.appendChild(card);
    }

    box.querySelectorAll('select').forEach((sel) => {
      sel.addEventListener('change', () => onRoleChange(Number(sel.dataset.slot), sel.value));
    });
    box.querySelectorAll('input').forEach((el, i) => {
      el.addEventListener('input', () => { names[i] = el.value; });
    });

    $('count').textContent = count;
    $('fewer').disabled = count <= MIN;
    $('more').disabled = count >= MAX;
    drawTally();
  }

  /* Masons only make sense in twos, so they arrive and leave together. */
  function onRoleChange(i, want) {
    readNames();
    const was = roles[i];
    roles[i] = want;

    if (want && ROLES[want].pair && roles.filter((r) => r === want).length === 1) {
      const free = (test) => roles.findIndex((r, j) => j !== i && test(r));
      const slot = [free((r) => !r), free((r) => r === 'villager'), free((r) => r !== want)]
        .find((x) => x !== undefined && x !== -1);
      if (slot !== undefined && slot !== -1) roles[slot] = want;
    }
    if (was && ROLES[was] && ROLES[was].pair && want !== was) {
      const other = roles.findIndex((r) => r === was);
      if (other !== -1) roles[other] = '';
    }

    Sound.play('tap');
    drawCast();
  }

  function drawTally() {
    const n = countRoles(roles);
    /* The Minion is on the killers' side but is not a killer, so it counts
       towards the balance of the table and never towards the body count. */
    const killers = roles.filter((r) => r === 'killer').length;
    const onTheirSide = roles.filter((r) => ROLES[r] && ROLES[r].team === 'killers').length;
    const dealt = roles.filter((r) => r).length;

    $('tallyHead').textContent = (WORDS[count] || count) + ' at the table';
    $('tallySub').textContent = onTheirSide
      ? onTheirSide + (onTheirSide === 1 ? ' of them is not' : ' of them are not') + ' who they say they are.'
      : 'Nobody is a killer yet, so nobody can lose.';

    /* One square a seat, filled for the killers' side. The balance of the game
       in a row of blocks, before a single number is read. */
    $('balance').innerHTML = roles.map((r) => {
      const t = ROLES[r] ? ROLES[r].team : '';
      const fill = t === 'killers' ? 'var(--day-ink)'
                 : t === 'tanner' ? 'var(--day-quiet)'
                 : t ? 'transparent' : 'var(--day-rule)';
      return '<span style="background:' + fill + '"></span>';
    }).join('');

    $('tally').innerHTML = ROLE_IDS.filter((id) => n[id]).map((id) =>
      '<div class="tally-row">' +
        '<svg viewBox="0 0 100 100"><use href="#' + MARK[id] + '"></use></svg>' +
        '<span class="label">' + ROLES[id].name + '</span>' +
        '<span class="n">' + n[id] + '</span>' +
      '</div>').join('') +
      (dealt < count
        ? '<div class="tally-row"><svg viewBox="0 0 100 100" style="color:var(--day-rule)"><use href="#s-back"></use></svg>' +
          '<span class="label" style="color:var(--day-quiet)">Still face down</span>' +
          '<span class="n">' + (count - dealt) + '</span></div>'
        : '');

    const problems = castProblems(roles);
    $('problemsHead').textContent = problems.length ? 'Before you start' : 'The cast';
    $('problems').innerHTML = problems.length
      ? problems.map((p) => '<div class="problem"><span>' + esc(p) + '</span></div>').join('')
      : '<div class="problem-ok">Nothing wrong with this cast. Deal them in.</div>';

    const ok = problems.length === 0;
    $('start').disabled = !ok;
    $('startHint').className = 'start-line' + (ok ? ' ready' : '');
    $('startHint').textContent = ok
      ? 'Ready. ' + count + ' players, ' + killers + (killers === 1 ? ' killer' : ' killers') +
        ', and the town is told ' + (reveal === 'team' ? 'only whether a body was a killer.' : 'what each body was.')
      : problems[0];
  }

  /* Every line is said by one of two voices and never by neither, so this is a
     two-way choice rather than a switch that can be left off. */
  function drawSayRows() {
    $('sayRows').innerHTML = SAY_CATEGORIES.map((c) =>
      '<div class="say-row"><span>' + c.label + '</span>' +
      '<span class="say-pick" role="radiogroup" aria-label="' + esc(c.label) + '">' +
        '<button type="button" role="radio" data-say="' + c.id + '" data-who="tv" aria-checked="true">TV</button>' +
        '<button type="button" role="radio" data-say="' + c.id + '" data-who="host" aria-checked="false">Host</button>' +
      '</span></div>').join('');

    $('sayRows').querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.say;
        say[id] = b.dataset.who === 'tv';
        $('sayRows').querySelectorAll('[data-say="' + id + '"]').forEach((x) =>
          x.setAttribute('aria-checked', String((x.dataset.who === 'tv') === say[id])));
        Sound.play('tap');
      });
    });
  }

  function drawVoice() {
    const sel = $('optVoice');
    const keep = sel.value;
    const list = Narrator.options();
    sel.innerHTML = list.map((o) => '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('');
    if (list.some((o) => o.value === keep)) sel.value = keep;
    $('voiceNote').textContent = Narrator.status();
  }

  function begin(how) {
    $('openDialog').hidden = true;
    readNames();

    const s = newGame();
    s.players = roles.map((role, i) => ({
      id: 'p' + i,
      name: (names[i] || '').trim() || 'Player ' + (i + 1),
      role: role,
      card: role,
      startRole: role,
      alive: true,
      diedRound: 0,
      diedBy: '',
    }));

    s.settings.dayMs = Number($('optDay').value);
    s.settings.reveal = reveal;
    s.settings.showRules = opts.rules;
    s.settings.showStory = opts.story;
    s.settings.sfx = opts.sfx;
    s.settings.voice = $('optVoice').value;
    SAY_CATEGORIES.forEach((c) => { s.settings.say[c.id] = !!say[c.id]; });

    s.settings.openAs = how === 'tab' ? 'tab' : 'window';

    Sound.unlock();
    Sound.play('step');
    Admin.launch(s);
  }

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { mount: mount, markOf: markOf, MARK: MARK };
})();
