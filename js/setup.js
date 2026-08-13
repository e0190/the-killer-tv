/* the killer tv — the setup screen. This is the only screen that exists
   before the split; after SPLIT it hands its config to the admin controller. */

const Setup = (function () {
  let playerCount = 5;
  let names = [];
  let deck = [];
  let mounted = false;

  const $ = (id) => document.getElementById(id);

  function target() { return requiredCards(playerCount); }

  function mount() {
    if (mounted) return;
    mounted = true;

    document.querySelectorAll('[data-players]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = playerCount + Number(btn.dataset.players);
        if (next < 3 || next > 10) return;
        playerCount = next;
        Sound.play('blip');
        renderNames();
        renderDeck();
      });
    });

    $('usePreset').addEventListener('click', () => {
      deck = (PRESETS[playerCount] || []).slice();
      Sound.play('blip');
      renderDeck();
    });
    $('clearDeck').addEventListener('click', () => {
      deck = [];
      renderDeck();
    });

    buildRoleGrid();
    $('splitBtn').addEventListener('click', split);

    $('optVoiceName').addEventListener('change', () => {
      Narrator.setVoice($('optVoiceName').value);
      previewVoice();
    });
    $('testVoice').addEventListener('click', previewVoice);

    Narrator.warm().then(renderVoices);
    renderVoices();
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', renderVoices);
    }

    renderNames();
    renderDeck();
  }

  function renderVoices() {
    const sel = $('optVoiceName');
    const keep = sel.value;
    const opts = Narrator.options();
    sel.innerHTML = opts.map((o) =>
      '<option value="' + o.value.replace(/"/g, '&quot;') + '">' + o.label + '</option>').join('');
    if (opts.some((o) => o.value === keep)) sel.value = keep;

    const v = Narrator.currentVoice();
    const note = $('voiceNote');
    if (Narrator.cloudReady() && sel.value !== '' && sel.value !== 'cloud') {
      note.textContent = 'Using ' + v.name + '. The Google Cloud voice is available if you want it — pick it above.';
    } else if (Narrator.cloudReady()) {
      note.textContent = 'Google Cloud voice is live — deep British, and it actually sounds like a person.';
    } else if (v && v.british) {
      note.textContent = 'Using ' + v.name + ', pitched down. For something more convincing, set up the Google Cloud voice (see the README).';
    } else {
      note.textContent = 'No British voice is installed in this browser' + (v ? ' — you\'ll get ' + v.name + ' instead' : '') +
        '. Add one via Windows Settings → Time & Language → Speech → Manage voices → English (United Kingdom), or set up the Google Cloud voice (see the README).';
    }
  }

  function previewVoice() {
    Narrator.setEnabled(true);
    Narrator.setVoice($('optVoiceName').value);
    Narrator.say('Everybody, close your eyes. Werewolves, wake up and look for each other.');
  }

  function buildRoleGrid() {
    const grid = $('roleGrid');
    grid.innerHTML = '';
    ROLE_IDS.forEach((id) => {
      const r = ROLES[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'role-chip';
      b.dataset.role = id;
      b.style.color = r.tint;
      b.innerHTML =
        '<span class="ico">' + r.icon + '</span>' +
        '<span><span class="nm" style="color:var(--ink)">' + r.name + '</span>' +
        '<span class="bl">' + r.blurb + '</span></span>' +
        '<span class="pill" hidden></span>';
      b.addEventListener('click', () => cycle(id));
      grid.appendChild(b);
    });
  }

  /* click cycles 0 → 1 → … → max → 0 */
  function cycle(id) {
    const have = deck.filter((x) => x === id).length;
    deck = deck.filter((x) => x !== id);
    const next = have >= ROLES[id].max ? 0 : have + 1;
    for (let i = 0; i < next; i++) deck.push(id);
    Sound.play('blip');
    renderDeck();
  }

  function renderNames() {
    const box = $('nameList');
    const current = Array.from(box.querySelectorAll('input')).map((i) => i.value);
    names = [];
    box.innerHTML = '';
    for (let i = 0; i < playerCount; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 14;
      input.placeholder = 'Player ' + (i + 1);
      input.value = current[i] || '';
      input.autocomplete = 'off';
      box.appendChild(input);
    }
    $('playerCount').textContent = playerCount;
    $('cardsNeeded').textContent = target();
  }

  function renderDeck() {
    const counts = deckCounts(deck);
    document.querySelectorAll('.role-chip').forEach((chip) => {
      const n = counts[chip.dataset.role] || 0;
      const pill = chip.querySelector('.pill');
      pill.hidden = n === 0;
      pill.textContent = n > 1 ? '×' + n : '1';
      chip.dataset.on = n ? '1' : '0';
    });

    const t = target();
    const ok = deck.length === t;
    $('deckPicked').textContent = deck.length;
    $('deckTarget').textContent = t;
    $('deckTarget').parentElement.classList.toggle('ok', ok);
    const bar = $('deckBar');
    bar.style.width = Math.min(100, (deck.length / t) * 100) + '%';
    bar.classList.toggle('ok', ok);

    const btn = $('splitBtn');
    btn.disabled = !ok;
    const wolves = counts.werewolf || 0;
    let hint;
    if (deck.length < t) hint = 'Add ' + (t - deck.length) + ' more card' + (t - deck.length === 1 ? '' : 's') + '.';
    else if (deck.length > t) hint = 'Remove ' + (deck.length - t) + ' card' + (deck.length - t === 1 ? '' : 's') + '.';
    else if (!wolves) hint = 'No werewolves in the deck. Bold. Ready when you are.';
    else hint = 'Ready. ' + playerCount + ' players, ' + t + ' cards, ' + wolves + (wolves === 1 ? ' wolf' : ' wolves') + ' in the mix.';
    $('splitHint').textContent = hint;
  }

  function collect() {
    const state = newGame();
    const inputs = Array.from(document.querySelectorAll('#nameList input'));
    state.players = inputs.map((input, i) => ({
      id: 'p' + i,
      name: (input.value || '').trim() || 'Player ' + (i + 1),
    }));
    state.deck = deck.slice();
    state.settings.dayMs = Number($('optDay').value);
    state.settings.nightScale = Number($('optNight').value);
    state.settings.narration = $('optVoice').checked;
    state.settings.sfx = $('optSfx').checked;
    state.settings.voiceName = $('optVoiceName').value;
    state.nightPhases = buildNightPhases(deck).map((p) => p.id);
    state.stage = 'deal';
    return state;
  }

  function split() {
    const state = collect();
    Sound.ensure();          // unlock audio on this user gesture
    Sound.play('thud');
    Admin.launch(state, true);
  }

  return { mount };
})();
