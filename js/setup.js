/* the killer tv — the setup sheet, and the only screen before the split. */

const Setup = (function () {
  const MIN = 4, MAX = 12;
  const $ = (id) => document.getElementById(id);

  let count = 8;
  let names = [];
  let roles = [];
  let reveal = 'role';
  let ready = false;

  function mount() {
    if (ready) return;
    ready = true;

    roles = (PRESETS[count] || []).slice();

    $('fewer').addEventListener('click', () => setCount(count - 1));
    $('more').addEventListener('click', () => setCount(count + 1));
    $('fillCast').addEventListener('click', () => {
      roles = (PRESETS[count] || []).slice();
      Sound.play('tap'); drawCast();
    });
    $('clearCast').addEventListener('click', () => {
      roles = new Array(count).fill('');
      drawCast();
    });

    document.querySelectorAll('[data-reveal]').forEach((b) => {
      b.addEventListener('click', () => {
        reveal = b.dataset.reveal;
        document.querySelectorAll('[data-reveal]').forEach((x) =>
          x.setAttribute('aria-checked', String(x.dataset.reveal === reveal)));
        Sound.play('tap');
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
    return '<option value="">Choose a role…</option>' + ROLE_IDS.map((id) =>
      '<option value="' + id + '"' + (sel === id ? ' selected' : '') + '>' + ROLES[id].name + '</option>'
    ).join('');
  }

  function drawCast() {
    const box = $('cast');
    box.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const team = ROLES[roles[i]] ? ROLES[roles[i]].team : '';
      const row = document.createElement('div');
      row.className = 'cast-row';
      row.innerHTML =
        '<input class="input" type="text" maxlength="14" autocomplete="off" placeholder="Player ' + (i + 1) + '" value="' + esc(names[i] || '') + '">' +
        '<select class="select" data-slot="' + i + '" data-team="' + team + '">' + roleOptions(roles[i]) + '</select>';
      box.appendChild(row);
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
    $('tally').innerHTML = Object.keys(n).sort().map((id) => {
      const r = ROLES[id];
      if (!r) return '';
      return '<span class="pill ' + (r.team === 'killers' ? 'killers' : r.team === 'tanner' ? 'tanner' : '') + '">' +
        '<b>' + r.name + '</b>' + (n[id] > 1 ? ' ×' + n[id] : '') + '</span>';
    }).join('');

    const problems = castProblems(roles);
    $('problems').innerHTML = problems.map((p) => '<li class="notice">' + esc(p) + '</li>').join('');

    const ok = problems.length === 0;
    $('start').disabled = !ok;
    const k = n.killer || 0;
    $('startHint').textContent = ok
      ? count + ' players · ' + k + (k === 1 ? ' killer' : ' killers') + ' · opens the TV in a second window'
      : 'Sort the roles out first.';
  }

  function drawSayRows() {
    $('sayRows').innerHTML = SAY_CATEGORIES.map((c) =>
      '<div class="row"><div class="row-text"><b>' + c.label + '</b><span>' + c.hint + '</span></div>' +
      '<div class="row-ctl"><label class="switch"><input type="checkbox" data-say="' + c.id + '" checked><i></i></label></div></div>'
    ).join('');
  }

  function drawVoice() {
    const sel = $('optVoice');
    const keep = sel.value;
    const opts = Narrator.options();
    sel.innerHTML = opts.map((o) => '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('');
    if (opts.some((o) => o.value === keep)) sel.value = keep;
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
      startRole: role,
      alive: true,
      diedRound: 0,
      diedBy: '',
    }));

    s.settings.dayMs = Number($('optDay').value);
    s.settings.reveal = reveal;
    s.settings.showRules = $('optRules').checked;
    s.settings.showStory = $('optStory').checked;
    s.settings.sfx = $('optSfx').checked;
    s.settings.voice = $('optVoice').value;
    document.querySelectorAll('[data-say]').forEach((el) => { s.settings.say[el.dataset.say] = el.checked; });

    Sound.unlock();
    Sound.play('step');
    Admin.launch(s);
  }

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { mount: mount };
})();
