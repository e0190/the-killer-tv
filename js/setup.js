/* the killer tv — the setup sheet.

   This is the only screen that exists before the split. It collects the cast
   (every player and the role they're holding) and the house rules, then hands
   the lot to the remote. */

const Setup = (function () {
  const MIN = 4, MAX = 12;
  let count = 8;
  let names = [];
  let roles = [];
  let reveal = 'full';
  let mounted = false;

  const $ = (id) => document.getElementById(id);

  function mount() {
    if (mounted) return;
    mounted = true;

    roles = (PRESETS[count] || []).slice();
    names = [];

    document.querySelectorAll('[data-players]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = count + Number(b.dataset.players);
        if (next < MIN || next > MAX) return;
        readNames();
        count = next;
        roles = roles.slice(0, count);
        while (roles.length < count) roles.push('villager');
        Sound.play('blip');
        render();
      });
    });

    $('autoCast').addEventListener('click', () => {
      roles = (PRESETS[count] || []).slice();
      Sound.play('blip');
      render();
    });
    $('clearCast').addEventListener('click', () => {
      roles = new Array(count).fill('');
      render();
    });

    document.querySelectorAll('[data-reveal]').forEach((b) => {
      b.addEventListener('click', () => {
        reveal = b.dataset.reveal;
        document.querySelectorAll('[data-reveal]').forEach((x) =>
          x.setAttribute('aria-checked', String(x.dataset.reveal === reveal)));
        Sound.play('blip');
      });
    });

    $('optVoiceName').addEventListener('change', () => {
      Narrator.setVoice($('optVoiceName').value);
      preview();
    });
    $('testVoice').addEventListener('click', preview);
    $('splitBtn').addEventListener('click', begin);

    Narrator.warm().then(renderVoice);
    renderVoice();
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', renderVoice);

    render();
  }

  /* ---------- cast ---------- */

  function readNames() {
    const inputs = document.querySelectorAll('#castList input');
    inputs.forEach((el, i) => { names[i] = el.value; });
  }

  function roleOptions(selected) {
    return '<option value="">—</option>' + ROLE_IDS.map((id) =>
      '<option value="' + id + '"' + (selected === id ? ' selected' : '') + '>' +
      ROLES[id].name + '</option>').join('');
  }

  function render() {
    const list = $('castList');
    list.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'cast-row';
      const team = ROLES[roles[i]] ? ROLES[roles[i]].team : '';
      row.dataset.team = team;
      row.innerHTML =
        '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<input type="text" maxlength="14" autocomplete="off" placeholder="Player ' + (i + 1) + '" value="' +
          esc(names[i] || '') + '">' +
        '<select data-slot="' + i + '">' + roleOptions(roles[i]) + '</select>';
      list.appendChild(row);
    }

    list.querySelectorAll('select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const i = Number(sel.dataset.slot);
        const wanted = sel.value;
        readNames();
        // Masons only make sense as a pair, so they come and go together.
        if (wanted && ROLES[wanted].step === 2) {
          const have = roles.filter((r) => r === wanted).length;
          roles[i] = wanted;
          if (have === 0) {
            // take the cheapest seat going: an empty one, then a villager,
            // then whatever's left — never quietly eat the last wolf.
            const free = (test) => roles.findIndex((r, j) => j !== i && test(r));
            const spare = [
              free((r) => !r),
              free((r) => r === 'villager'),
              free((r) => r !== wanted && ROLES[r] && ROLES[r].team === 'village'),
              free((r) => r !== wanted),
            ].find((x) => x !== -1 && x !== undefined);
            if (spare !== undefined && spare !== -1) roles[spare] = wanted;
          }
        } else {
          const was = roles[i];
          roles[i] = wanted;
          // dropping one half of a pair drops the other
          if (was && ROLES[was] && ROLES[was].step === 2) {
            const other = roles.findIndex((r) => r === was);
            if (other !== -1) roles[other] = '';
          }
        }
        Sound.play('blip');
        render();
      });
    });

    list.querySelectorAll('input').forEach((el, i) => {
      el.addEventListener('input', () => { names[i] = el.value; });
    });

    $('playerCount').textContent = count;
    renderTally();
  }

  function renderTally() {
    const counts = roleCounts(roles);
    $('castTally').innerHTML = Object.keys(counts).sort().map((id) => {
      const r = ROLES[id];
      if (!r) return '';
      const cls = r.team === 'wolves' ? ' class="wolves"' : r.team === 'tanner' ? ' class="tanner"' : '';
      return '<span' + cls + '>' + r.name + (counts[id] > 1 ? ' ×' + counts[id] : '') + '</span>';
    }).join('');

    const problems = castProblems(roles);
    $('castProblems').innerHTML = problems.map((p) => '<li>' + esc(p) + '</li>').join('');

    const ok = problems.length === 0;
    $('splitBtn').disabled = !ok;
    const wolves = counts.werewolf || 0;
    $('splitHint').textContent = ok
      ? count + ' at the table, ' + wolves + (wolves === 1 ? ' wolf' : ' wolves') + ' among them. Hand nobody this screen.'
      : 'Sort the cast out first.';
  }

  /* ---------- narrator ---------- */

  function renderVoice() {
    const sel = $('optVoiceName');
    const keep = sel.value;
    const opts = Narrator.options();
    sel.innerHTML = opts.map((o) =>
      '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('');
    if (opts.some((o) => o.value === keep)) sel.value = keep;
    $('voiceNote').textContent = Narrator.status().detail;
  }

  function preview() {
    Narrator.setEnabled(true);
    Narrator.setVoice($('optVoiceName').value);
    Narrator.preview(LINES.call_werewolf);
  }

  /* ---------- go ---------- */

  function begin() {
    readNames();
    const state = newGame();
    state.players = roles.map((role, i) => ({
      id: 'p' + i,
      name: (names[i] || '').trim() || 'Player ' + (i + 1),
      role: role,
      startRole: role,
      alive: true,
      diedRound: 0,
      diedBy: '',
    }));
    state.settings.dayMs = Number($('optDay').value);
    state.settings.revealMode = reveal;
    state.settings.narration = $('optVoice').checked;
    state.settings.sfx = $('optSfx').checked;
    state.settings.voiceName = $('optVoiceName').value;

    Sound.ensure();
    Sound.play('toll');
    Admin.launch(state, true);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  return { mount };
})();
