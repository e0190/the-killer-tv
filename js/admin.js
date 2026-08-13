/* the killer tv — the remote. This window owns the game state and pushes a
   copy to the TV on every change. The TV never decides anything. */

const Admin = (function () {
  let S = null;
  let tvWindow = null;
  let ticker = null;
  let started = false;

  const $ = (id) => document.getElementById(id);
  const nameOf = (id) => {
    const p = S.players.find((x) => x.id === id);
    return p ? p.name : '?';
  };

  /* ---------- the night running order ---------- */

  function buildPhases(deck) {
    const list = [{
      id: 'nightstart', icon: '🌑', title: 'Night falls',
      line: 'Everybody — close your eyes.',
      say: 'Night falls. Everybody, close your eyes.',
      sleep: '', seconds: 6,
    }];
    buildNightPhases(deck).forEach((step) => {
      const r = ROLES[step.key];
      list.push({
        id: step.id, icon: r.icon, tint: r.tint,
        title: step.label || r.name,
        line: step.wake, say: step.wake,
        sleep: step.sleep, seconds: step.seconds,
      });
    });
    list.push({
      id: 'nightend', icon: '🌅', title: 'Dawn',
      line: 'Everyone — wake up.',
      say: 'Everyone, wake up.',
      sleep: '', seconds: 5,
    });
    return list;
  }

  /* ---------- lifecycle ---------- */

  function launch(state, openTv) {
    state.phases = buildPhases(state.deck);
    state.phaseIndex = 0;
    state.stage = 'deal';
    boot(state, openTv);
  }

  /* the admin window was reloaded mid-game — pick the game back up */
  function resume(state) {
    if (!state.phases || !state.phases.length) state.phases = buildPhases(state.deck);
    if (state.timer && state.timer.running) {
      state.timer.remaining = timerRemaining(state.timer);
      state.timer.running = false;
    }
    boot(state, false);
  }

  function boot(state, openTv) {
    S = state;
    Sound.setEnabled(true);

    document.body.dataset.view = 'admin';
    if (location.hash !== '#admin') history.replaceState(null, '', '#admin');
    if (!started) { wire(); started = true; }

    Link.start('admin', (up) => {
      $('linkDot').classList.toggle('on', up);
      $('linkText').textContent = up ? 'TV connected' : 'TV not responding';
      if (up) { $('popupWarn').hidden = true; push(); }
    });

    if (openTv) openTvWindow();
    push();
    render();
    if (!ticker) ticker = setInterval(tick, 200);
  }

  function openTvWindow() {
    const url = location.pathname + location.search + '#tv';
    try {
      tvWindow = window.open(url, 'killer_tv_screen', 'width=1280,height=720,menubar=no,toolbar=no');
    } catch (e) { tvWindow = null; }
    if (!tvWindow) {
      // Scripted popups get blocked in some setups. A plain link doesn't.
      $('linkText').textContent = 'TV window blocked';
      $('popupWarn').hidden = false;
      return;
    }
    $('popupWarn').hidden = true;
    Bus.setPeer(tvWindow);
    try { tvWindow.focus(); } catch (e) {}
    setTimeout(push, 400);
  }

  function wire() {
    $('admNext').addEventListener('click', () => next());
    $('admBack').addEventListener('click', () => back());
    $('admPause').addEventListener('click', togglePause);
    $('admPlus').addEventListener('click', () => addTime(30000));
    $('reopenTv').addEventListener('click', openTvWindow);
    $('tvOpenLink').addEventListener('click', () => {
      // the link itself does the opening; just grab the handle it left behind
      setTimeout(() => {
        try {
          const w = window.open('', 'killer_tv_screen');
          if (w) { tvWindow = w; Bus.setPeer(w); push(); }
        } catch (e) { /* ignore */ }
      }, 600);
    });
    $('quitBtn').addEventListener('click', quit);
    $('clearVotes').addEventListener('click', () => { S.votes = {}; renderVotes(); push(); });
    $('playAgain').addEventListener('click', playAgain);
    $('newSetup').addEventListener('click', quit);

    document.addEventListener('keydown', (e) => {
      if (document.body.dataset.view !== 'admin') return;
      if (e.target.matches('input,select,textarea')) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); back(); }
      if (e.code === 'KeyP') togglePause();
    });

    Bus.on((msg) => {
      if (msg.type === 'hello') push();
    });

    window.addEventListener('beforeunload', () => {
      try { if (tvWindow && !tvWindow.closed) tvWindow.close(); } catch (e) {}
    });
  }

  function quit() {
    if (!confirm('End this game and go back to setup?')) return;
    stopTimer();
    Bus.send('bye', {});
    try { if (tvWindow && !tvWindow.closed) tvWindow.close(); } catch (e) {}
    try { localStorage.removeItem('killer-tv:state'); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
    location.reload();
  }

  function playAgain() {
    const fresh = newGame();
    fresh.players = S.players;
    fresh.deck = S.deck;
    fresh.settings = S.settings;
    fresh.round = (S.round || 1) + 1;
    launch(fresh, !tvWindow || tvWindow.closed);
  }

  /* ---------- state out ---------- */

  function push() {
    if (!S) return;
    Bus.send('state', S);
    try { localStorage.setItem('killer-tv:state', JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- timer ---------- */

  function startTimer(ms) {
    if (!ms) { stopTimer(); return; }
    S.timer = { total: ms, remaining: ms, endsAt: Date.now() + ms, running: true };
  }
  function stopTimer() {
    S.timer = { total: 0, remaining: 0, endsAt: 0, running: false };
  }
  function togglePause() {
    if (!S.timer.total) return;
    if (S.timer.running) {
      S.timer.remaining = timerRemaining(S.timer);
      S.timer.running = false;
    } else {
      S.timer.endsAt = Date.now() + S.timer.remaining;
      S.timer.running = true;
    }
    $('admPause').textContent = S.timer.running ? 'pause' : 'resume';
    push();
  }
  function addTime(ms) {
    if (!S.timer.total) return;
    S.timer.total += ms;
    if (S.timer.running) S.timer.endsAt += ms; else S.timer.remaining += ms;
    Sound.play('blip');
    push();
    renderClock();
  }

  function tick() {
    if (!S) return;
    renderClock();
    if (!S.timer.running) return;
    if (timerRemaining(S.timer) > 0) return;
    S.timer.running = false;
    if (S.stage === 'night' || S.stage === 'day' || S.stage === 'vote') next();
  }

  /* ---------- stage machine ---------- */

  function phase() { return S.phases[S.phaseIndex] || null; }

  function next() {
    switch (S.stage) {
      case 'deal':
        S.stage = 'night';
        S.phaseIndex = 0;
        enterPhase();
        break;

      case 'night':
        if (S.phaseIndex < S.phases.length - 1) {
          S.phaseIndex++;
          enterPhase();
        } else {
          S.stage = 'day';
          startTimer(S.settings.dayMs);
        }
        break;

      case 'day':
        S.stage = 'vote';
        startTimer(6000);
        break;

      case 'vote':
        S.stage = 'tally';
        stopTimer();
        break;

      case 'tally':
        if (!votesComplete()) return;
        S.deaths = resolveDeaths(S);
        S.stage = 'kill';
        stopTimer();
        break;

      case 'kill':
        S.stage = 'reveal';
        break;

      case 'reveal':
        if (!revealComplete()) return;
        S.deaths = resolveDeaths(S);           // recompute now the Hunter is known
        S.result = judge(S);
        S.stage = 'result';
        break;

      default:
        return;
    }
    push();
    render();
  }

  function back() {
    switch (S.stage) {
      case 'night':
        if (S.phaseIndex > 0) { S.phaseIndex--; enterPhase(); }
        else { S.stage = 'deal'; stopTimer(); }
        break;
      case 'day': S.stage = 'night'; S.phaseIndex = S.phases.length - 1; enterPhase(); break;
      case 'vote': S.stage = 'day'; startTimer(S.settings.dayMs); break;
      case 'tally': S.stage = 'vote'; startTimer(6000); break;
      case 'kill': S.stage = 'tally'; break;
      case 'reveal': S.stage = 'kill'; break;
      case 'result': S.stage = 'reveal'; S.result = null; break;
      default: return;
    }
    push();
    render();
  }

  function enterPhase() {
    const p = phase();
    if (!p) return;
    const scale = S.settings.nightScale;
    if (scale > 0) startTimer(Math.round(p.seconds * scale * 1000));
    else stopTimer();
  }

  function votesComplete() {
    return S.players.every((p) => !!S.votes[p.id]);
  }

  function revealComplete() {
    const playersOk = S.players.every((p) => {
      if (!S.finalRoles[p.id]) return false;
      if (S.finalRoles[p.id] === 'doppelganger' && !S.dgCopy[p.id]) return false;
      return true;
    });
    return playersOk && S.centreRoles.every((r) => !!r);
  }

  /* ---------- render ---------- */

  function render() {
    const panels = ['panelNight', 'panelVotes', 'panelReveal', 'panelResult'];
    panels.forEach((p) => { $(p).hidden = true; });
    $('admClockRow').hidden = !S.timer.total;
    $('admPause').textContent = S.timer.running ? 'pause' : 'resume';
    $('admNext').disabled = false;
    $('admNext').textContent = 'next →';

    const set = (kicker, title, sub) => {
      $('admKicker').textContent = kicker;
      $('admTitle').textContent = title;
      $('admSub').innerHTML = sub || '';
    };

    switch (S.stage) {
      case 'deal': {
        set('round ' + S.round + ' · deal',
          'Shuffle and deal',
          'One card face-down to each of the ' + S.players.length + ' players, then <strong>three face-down in the middle</strong>. Nobody peeks. When everyone has a card, start the night.');
        $('admNext').textContent = 'begin the night →';
        break;
      }
      case 'night': {
        const p = phase();
        const n = S.phaseIndex;
        set('night · ' + (n + 1) + ' of ' + S.phases.length, p.icon + '  ' + p.title, p.line);
        $('panelNight').hidden = false;
        renderNightList();
        if (S.phaseIndex === S.phases.length - 1) $('admNext').textContent = 'start the day →';
        break;
      }
      case 'day': {
        set('day', 'Talk it out',
          'Accuse, defend, lie. The TV is counting down. Hit next when you\'re ready to vote.');
        $('admNext').textContent = 'to the vote →';
        break;
      }
      case 'vote': {
        set('the vote', 'Everyone, point',
          'On the TV\'s count, everyone points at the player they want dead. Keep pointing until you\'ve written it all down.');
        $('admNext').textContent = 'record the votes →';
        break;
      }
      case 'tally': {
        set('the vote', 'Who pointed where?', 'Tap a player, then tap their target.');
        $('panelVotes').hidden = false;
        renderVotes();
        $('admNext').disabled = !votesComplete();
        $('admNext').textContent = 'lock it in →';
        break;
      }
      case 'kill': {
        const dead = S.deaths;
        if (!dead.length) set('the kill', 'Nobody dies', 'The village couldn\'t agree. Everyone lives — for now. Flip the cards anyway.');
        else set('the kill', dead.map(nameOf).join(' & ') + (dead.length > 1 ? ' die' : ' dies'),
          'The TV is doing the honours. Then everyone flips their card.');
        $('admNext').textContent = 'flip the cards →';
        break;
      }
      case 'reveal': {
        set('the reveal', 'Flip the cards', 'Enter what each player <em>ended up</em> holding — swaps and all.');
        $('panelReveal').hidden = false;
        renderReveal();
        $('admNext').disabled = !revealComplete();
        $('admNext').textContent = 'declare the winner →';
        break;
      }
      case 'result': {
        set('result', S.result.headline, '');
        $('panelResult').hidden = false;
        renderResult();
        $('admNext').disabled = true;
        break;
      }
    }

    renderDeckMini();
    renderClock();
  }

  function renderClock() {
    if (!S || !S.timer.total) return;
    const ms = timerRemaining(S.timer);
    const el = $('admClock');
    if (!el) return;
    el.textContent = fmtClock(ms);
    el.classList.toggle('low', ms <= 10000);
  }

  function renderNightList() {
    const ol = $('nightList');
    ol.innerHTML = '';
    S.phases.forEach((p, i) => {
      const li = document.createElement('li');
      if (i < S.phaseIndex) li.className = 'done';
      if (i === S.phaseIndex) li.className = 'now';
      li.innerHTML = '<span class="ico">' + p.icon + '</span><span>' + p.title + '</span>';
      ol.appendChild(li);
    });
  }

  function renderVotes() {
    const box = $('voteEntry');
    box.innerHTML = '';
    S.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'vote-row' + (S.votes[p.id] ? ' done' : '');
      const targets = S.players
        .filter((t) => t.id !== p.id)
        .map((t) => '<button type="button" data-voter="' + p.id + '" data-target="' + t.id + '" aria-pressed="' +
          (S.votes[p.id] === t.id) + '">' + t.name + '</button>').join('');
      row.innerHTML = '<b>' + p.name + '</b><span class="arrow">→</span><span class="vote-targets">' + targets + '</span>';
      box.appendChild(row);
    });
    box.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        S.votes[b.dataset.voter] = b.dataset.target;
        Sound.play('blip');
        renderVotes();
        $('admNext').disabled = !votesComplete();
        push();
      });
    });
  }

  function roleOptions(selected) {
    const seen = {};
    let html = '<option value="">—</option>';
    S.deck.forEach((id) => {
      if (seen[id]) return;
      seen[id] = 1;
      html += '<option value="' + id + '"' + (selected === id ? ' selected' : '') + '>' +
        ROLES[id].icon + ' ' + ROLES[id].name + '</option>';
    });
    return html;
  }

  function renderReveal() {
    const box = $('revealEntry');
    box.innerHTML = '';
    S.players.forEach((p) => {
      const isDead = S.deaths.indexOf(p.id) !== -1;
      const row = document.createElement('div');
      row.className = 'reveal-row' + (isDead ? ' dead' : '');
      row.innerHTML = '<b>' + p.name + '</b>' + (isDead ? '<span class="skull">💀</span>' : '') +
        '<select data-player="' + p.id + '">' + roleOptions(S.finalRoles[p.id]) + '</select>';
      if (S.finalRoles[p.id] === 'doppelganger') {
        const dg = document.createElement('select');
        dg.dataset.dg = p.id;
        dg.innerHTML = '<option value="">became…</option>' +
          ROLE_IDS.filter((r) => r !== 'doppelganger').map((r) =>
            '<option value="' + r + '"' + (S.dgCopy[p.id] === r ? ' selected' : '') + '>→ ' + ROLES[r].name + '</option>').join('');
        row.appendChild(dg);
      }
      box.appendChild(row);
    });

    const centre = $('centreEntry');
    centre.innerHTML = '';
    S.centreRoles.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'reveal-row';
      row.innerHTML = '<b>Middle ' + (i + 1) + '</b><select data-centre="' + i + '">' + roleOptions(r) + '</select>';
      centre.appendChild(row);
    });

    document.querySelectorAll('#panelReveal select').forEach((sel) => {
      sel.addEventListener('change', () => {
        if (sel.dataset.player) {
          S.finalRoles[sel.dataset.player] = sel.value;
          if (sel.value !== 'doppelganger') delete S.dgCopy[sel.dataset.player];
        } else if (sel.dataset.dg) {
          S.dgCopy[sel.dataset.dg] = sel.value;
        } else if (sel.dataset.centre) {
          S.centreRoles[Number(sel.dataset.centre)] = sel.value;
        }
        renderReveal();
        $('admNext').disabled = !revealComplete();
        push();
      });
    });

    const warn = cardMismatch();
    const hint = $('panelReveal').querySelector('.panel-hint');
    hint.innerHTML = warn
      ? '⚠️ ' + warn + ' — check the cards, or carry on anyway.'
      : 'Everyone flip their card. Enter what people <em>ended up</em> as.';
  }

  /* soft sanity check: the cards on the table should match the deck you dealt */
  function cardMismatch() {
    const laid = [];
    S.players.forEach((p) => { if (S.finalRoles[p.id]) laid.push(S.finalRoles[p.id]); });
    S.centreRoles.forEach((r) => { if (r) laid.push(r); });
    if (laid.length !== S.deck.length) return null;
    const a = deckCounts(laid), b = deckCounts(S.deck);
    const keys = Object.keys(b).concat(Object.keys(a));
    for (const k of keys) {
      if ((a[k] || 0) !== (b[k] || 0)) return "that's not the deck you dealt";
    }
    return null;
  }

  function renderResult() {
    const r = S.result;
    const rows = S.players.map((p) => {
      const role = effectiveRole(S, p.id);
      const won = r.winners.indexOf(p.id) !== -1;
      const dead = S.deaths.indexOf(p.id) !== -1;
      return '<li><span class="' + (won ? 'win' : 'lose') + '">' + (won ? '★ ' : '') + p.name + '</span> — ' +
        ROLES[role].icon + ' ' + ROLES[role].name + (dead ? ' 💀' : '') + '</li>';
    }).join('');
    $('resultSummary').innerHTML =
      '<h3>' + r.headline + '</h3><ul>' + rows + '</ul>' +
      '<p class="panel-hint">Middle: ' + S.centreRoles.map((c) => ROLES[c] ? ROLES[c].name : '?').join(', ') + '</p>';
  }

  function renderDeckMini() {
    const counts = deckCounts(S.deck);
    $('deckMini').innerHTML = Object.keys(counts).map((id) =>
      '<span>' + ROLES[id].icon + ' ' + ROLES[id].name + (counts[id] > 1 ? ' ×' + counts[id] : '') + '</span>').join('');
  }

  return { launch, resume };
})();
