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
  let narration = 'all';
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

    document.querySelectorAll('[data-narration]').forEach((b) => {
      b.addEventListener('click', () => {
        narration = b.dataset.narration;
        document.querySelectorAll('[data-narration]').forEach((x) =>
          x.setAttribute('aria-checked', String(x.dataset.narration === narration)));
        Sound.play('blip');
        renderVoice();
      });
    });

    $('optVoiceName').addEventListener('change', () => {
      Narrator.setVoice($('optVoiceName').value);
      preview();
    });
    $('testVoice').addEventListener('click', preview);
    $('splitBtn').addEventListener('click', begin);

    wirePack();

    Narrator.warm().then(() => { renderVoice(); renderPack(); });
    renderVoice();
    renderPack();
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', renderVoice);

    render();
  }

  /* ---------- the narration pack ---------- */

  function wirePack() {
    const block = $('packBlock');
    $('packOpen').addEventListener('click', () => {
      block.hidden = !block.hidden;
      if (!block.hidden) block.scrollIntoView({ block: 'start' });
    });
    $('packClose').addEventListener('click', () => { block.hidden = true; });

    $('packClear').addEventListener('click', () => {
      if (!confirm('Remove every narration file from this browser?')) return;
      Pack.clear().then(() => Narrator.refreshPack()).then(() => { renderPack(); renderVoice(); });
    });

    $('packCopy').addEventListener('click', () => {
      const text = LINE_IDS.map((id) => id + '.mp3\t' + LINES[id]).join('\n');
      navigator.clipboard.writeText(text)
        .then(() => { $('packReport').textContent = 'All ' + LINE_IDS.length + ' lines copied — filename, tab, script.'; })
        .catch(() => { $('packReport').textContent = 'Clipboard blocked. The list is below.'; });
    });

    $('packFiles').addEventListener('change', (e) => take(e.target.files));

    const zone = $('packDrop');
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => {
      e.preventDefault(); zone.classList.add('over');
    }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => {
      e.preventDefault(); zone.classList.remove('over');
    }));
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) take(e.dataTransfer.files);
    });
  }

  function take(files) {
    if (!files || !files.length) return;
    $('packReport').textContent = 'Installing…';
    Pack.install(files)
      .then((res) => Narrator.refreshPack().then(() => res))
      .then((res) => {
        renderPack();
        renderVoice();
        const bits = [];
        if (res.taken.length) bits.push(res.taken.length + ' installed');
        if (res.skipped.length) bits.push(res.skipped.length + " didn't match a line id (" + res.skipped.slice(0, 3).join(', ') + (res.skipped.length > 3 ? '…' : '') + ')');
        $('packReport').textContent = bits.join(' · ') || 'Nothing usable in that lot.';
        Sound.play('blip');
      })
      .catch(() => { $('packReport').textContent = 'This browser refused to store them.'; });
  }

  function renderPack() {
    const have = Narrator.installed();
    const total = LINE_IDS.length;
    $('packTotal').textContent = total;
    $('packBar').style.width = Math.round((have.length / total) * 100) + '%';

    const banner = $('packBanner');
    const st = Narrator.status();
    banner.hidden = false;
    banner.classList.toggle('done', st.tier === 'pack' || st.tier === 'files');

    if (have.length >= total) {
      $('packBannerTitle').textContent = 'Your own narration is installed';
      $('packBannerSub').textContent = 'All ' + total + ' lines, stored in this browser.';
      $('packOpen').textContent = 'review';
    } else if (have.length > 0) {
      $('packBannerTitle').textContent = have.length + ' of ' + total + ' lines are your own recordings';
      $('packBannerSub').textContent = 'The rest use ' + st.detail.toLowerCase();
      $('packOpen').textContent = 'finish it';
    } else if (st.tier === 'files') {
      $('packBannerTitle').textContent = 'Narration ready';
      $('packBannerSub').textContent = st.detail + ' Drop your own recordings in to replace it.';
      $('packOpen').textContent = 'replace it';
    } else {
      $('packBannerTitle').textContent = 'No narration files';
      $('packBannerSub').textContent = st.tier === 'cloud'
        ? 'Using the generated voice. Drop your own recordings in to replace it.'
        : 'The browser will read the game aloud. Drop your own recordings in for something better.';
      $('packOpen').textContent = 'install them';
    }

    const list = $('packList');
    if (!list.childElementCount || list.dataset.count !== String(have.length)) {
      list.dataset.count = String(have.length);
      list.innerHTML = LINE_IDS.map((id) => {
        const got = have.indexOf(id) !== -1;
        return '<li class="' + (got ? 'have' : '') + '">' +
          '<div><code>' + id + '.mp3</code><span class="pack-state">' + (got ? 'installed' : 'missing') + '</span></div>' +
          '<p>' + esc(LINES[id]) + '</p>' +
          '<label>' + (got ? 'replace' : 'add') + '<input type="file" accept="audio/*" data-line="' + id + '" hidden></label>' +
          '</li>';
      }).join('');
      list.querySelectorAll('input[data-line]').forEach((input) => {
        input.addEventListener('change', () => {
          const f = input.files && input.files[0];
          if (!f) return;
          Pack.put(input.dataset.line, f)
            .then(() => Narrator.refreshPack())
            .then(() => { renderPack(); renderVoice(); Sound.play('blip'); });
        });
      });
    }
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
            // then whatever's left — never quietly eat the last Killer.
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
      const cls = r.team === 'killers' ? ' class="killers"' : r.team === 'tanner' ? ' class="tanner"' : '';
      return '<span' + cls + '>' + r.name + (counts[id] > 1 ? ' ×' + counts[id] : '') + '</span>';
    }).join('');

    const problems = castProblems(roles);
    $('castProblems').innerHTML = problems.map((p) => '<li>' + esc(p) + '</li>').join('');

    const ok = problems.length === 0;
    $('splitBtn').disabled = !ok;
    const killers = counts.killer || 0;
    $('splitHint').textContent = ok
      ? count + ' at the table, ' + killers + (killers === 1 ? ' killer' : ' killers') + ' among them. Hand nobody this screen.'
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
    Narrator.preview(LINES.call_killer);
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
    state.settings.tutorial = $('optTutorial').checked;
    if (!state.settings.tutorial) state.phase = 'opening';

    Sound.ensure();
    Sound.play('toll');
    Admin.launch(state, true);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  return { mount };
})();
