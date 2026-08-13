/* the killer tv — the remote.

   Owns the game state, runs the phase machine, and pushes a copy of everything
   to the TV after every change. The moderator sees every role here; nobody
   else should be looking at this screen. */

const Admin = (function () {
  let S = null;
  let tvWindow = null;
  let ticker = null;
  let wired = false;

  const $ = (id) => document.getElementById(id);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const roman = (n) => ROMAN[n] || String(n);

  /* ---------- lifecycle ---------- */

  function launch(state, openTv) { boot(state, openTv); }

  function resume(state) {
    if (state.timer && state.timer.running) {
      state.timer.remaining = timerRemaining(state.timer);
      state.timer.running = false;
    }
    boot(state, false);
  }

  function boot(state, openTv) {
    S = state;
    Sound.setEnabled(!!S.settings.sfx);
    Narrator.setEnabled(false);          // the TV does the talking, not the remote
    document.body.dataset.view = 'admin';
    if (location.hash !== '#admin') history.replaceState(null, '', '#admin');

    if (!wired) { wire(); wired = true; }

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
    try {
      tvWindow = window.open(location.pathname + location.search + '#tv',
        'killer_tv_screen', 'width=1280,height=720');
    } catch (e) { tvWindow = null; }
    if (!tvWindow) {
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
    $('admNext').addEventListener('click', next);
    $('admBack').addEventListener('click', back);
    $('admPause').addEventListener('click', togglePause);
    $('admPlus').addEventListener('click', () => addTime(30000));
    $('reopenTv').addEventListener('click', openTvWindow);
    $('quitBtn').addEventListener('click', quit);
    $('tvOpenLink').addEventListener('click', () => setTimeout(() => {
      try { const w = window.open('', 'killer_tv_screen'); if (w) { tvWindow = w; Bus.setPeer(w); push(); } } catch (e) {}
    }, 600));

    document.addEventListener('keydown', (e) => {
      if (document.body.dataset.view !== 'admin') return;
      if (e.target.matches('input,select,textarea')) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); back(); }
    });

    Bus.on((msg) => { if (msg.type === 'hello') push(); });
    window.addEventListener('beforeunload', () => {
      try { if (tvWindow && !tvWindow.closed) tvWindow.close(); } catch (e) {}
    });
  }

  function quit() {
    if (!confirm('End the game and go back to setup?')) return;
    Bus.send('bye', {});
    try { if (tvWindow && !tvWindow.closed) tvWindow.close(); } catch (e) {}
    try { localStorage.removeItem('killer-tv:state'); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
    location.reload();
  }

  function push() {
    if (!S) return;
    Bus.send('state', S);
    try { localStorage.setItem('killer-tv:state', JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- timers (day only — the night runs on taps) ---------- */

  function startTimer(ms) {
    if (!ms) { stopTimer(); return; }
    S.timer = { total: ms, remaining: ms, endsAt: Date.now() + ms, running: true };
  }
  function stopTimer() { S.timer = { total: 0, remaining: 0, endsAt: 0, running: false }; }
  function togglePause() {
    if (!S.timer.total) return;
    if (S.timer.running) { S.timer.remaining = timerRemaining(S.timer); S.timer.running = false; }
    else { S.timer.endsAt = Date.now() + S.timer.remaining; S.timer.running = true; }
    $('admPause').textContent = S.timer.running ? 'pause' : 'resume';
    push();
  }
  function addTime(ms) {
    if (!S.timer.total) return;
    S.timer.total += ms;
    if (S.timer.running) S.timer.endsAt += ms; else S.timer.remaining += ms;
    Sound.play('blip'); push(); renderClock();
  }
  function tick() {
    if (!S) return;
    renderClock();
    if (S.timer.running && timerRemaining(S.timer) <= 0) {
      S.timer.running = false;
      if (['day', 'vote', 'suspense'].indexOf(S.phase) !== -1) next();
    }
  }

  /* ---------- the phase machine ---------- */

  const beat = () => S.nightBeats[S.beatIndex] || null;

  function next() {
    switch (S.phase) {
      case 'opening':
        startNight();
        break;

      case 'nightfall':
        S.phase = S.nightBeats.length ? 'nightbeat' : 'dawn';
        if (S.phase === 'dawn') resolveDawn();
        break;

      case 'nightbeat': {
        const b = beat();
        if (b && needsInput(b) && !b.applied) return;
        if (S.beatIndex < S.nightBeats.length - 1) {
          S.beatIndex++;
          S.seerAnswer = null;
        } else {
          S.phase = 'wake';
        }
        break;
      }

      case 'wake':
        S.phase = 'suspense';
        S.suspenseNext = 'dawn';
        startTimer(3000);
        break;

      case 'suspense':
        stopTimer();
        if (S.suspenseNext === 'dawn') { resolveDawn(); S.phase = 'dawn'; }
        else resolveVote();
        break;

      case 'dawn':
        afterDeaths('day');
        break;

      case 'hunter': {
        if (!S.hunterTarget) return;
        kill(S, S.hunterTarget, 'hunter');
        S.lastDeaths.push(S.hunterTarget);
        S.hunterPending = null;
        S.hunterTarget = null;
        afterDeaths(S.hunterReturn || 'day');
        break;
      }

      case 'day':
        S.phase = 'vote';
        S.votes = {};
        S.revotes = 0;
        S.revoteNotice = false;
        startTimer(5000);          // just the three-two-one on the TV
        break;

      case 'vote':                 // the countdown; the tally sheet comes after
        S.phase = 'tally';
        S.revoteNotice = false;
        stopTimer();
        break;

      case 'tally':
        if (!votesIn()) return;
        S.phase = 'suspense';
        S.suspenseNext = 'lynch';
        startTimer(3000);
        break;

      case 'lynch':
        afterDeaths('nightfall');
        break;

      default:
        return;
    }
    push();
    render();
  }

  /* After anybody dies: give the Hunter their shot, then see if it's over. */
  function afterDeaths(then) {
    const hunter = S.lastDeaths.find((id) => {
      const p = byId(S, id);
      return p && p.role === 'hunter' && !S.hunterDone[id];
    });
    if (hunter) {
      S.hunterDone[hunter] = true;
      S.hunterPending = hunter;
      S.hunterTarget = null;
      S.hunterReturn = then;
      S.phase = 'hunter';
      return;
    }

    const end = checkEnd(S);
    if (end) { S.result = end; S.phase = 'over'; stopTimer(); return; }

    if (then === 'day') {
      S.phase = 'day';
      startTimer(S.settings.dayMs);
    } else if (then === 'nightfall') {
      S.round++;
      startNight();
    } else {
      S.phase = then;
    }
  }

  function startNight() {
    S.phase = 'nightfall';
    S.nightBeats = buildNight(S);
    S.beatIndex = 0;
    S.pendingKill = null;
    S.seerAnswer = null;
    S.nightLog = [];
    S.lastDeaths = [];
    stopTimer();
  }

  /* A tie means the village couldn't agree, so they go again. After a couple of
     rounds of that, the rope goes back on the hook and the night comes anyway. */
  function resolveVote() {
    const out = voteOutcome(S);
    if (out.tied && S.revotes < MAX_REVOTES) {
      S.revotes++;
      S.votes = {};
      S.revoteNotice = true;
      S.phase = 'vote';
      startTimer(5000);
      Sound.play('toll');
      return;
    }
    S.lastDeaths = [];
    S.lastCause = 'vote';
    S.voteTied = out.tied;
    S.voteCounts = out.counts;
    if (out.id) { kill(S, out.id, 'vote'); S.lastDeaths = [out.id]; }
    S.phase = 'lynch';
    Sound.play(out.id ? 'stab' : 'toll');
  }

  function resolveDawn() {
    S.lastDeaths = [];
    S.lastCause = 'wolves';
    if (S.pendingKill && kill(S, S.pendingKill, 'wolves')) S.lastDeaths = [S.pendingKill];
    S.firstNightDone = true;
    Sound.play(S.lastDeaths.length ? 'stab' : 'dawn');
  }

  function back() {
    switch (S.phase) {
      case 'nightbeat': {
        const b = beat();
        if (b && b.applied) { undo(b); break; }
        if (S.beatIndex > 0) { S.beatIndex--; S.seerAnswer = null; }
        else S.phase = 'nightfall';
        break;
      }
      case 'nightfall': if (S.round === 1) S.phase = 'opening'; break;
      case 'wake':
        S.phase = 'nightbeat';
        S.beatIndex = Math.max(0, S.nightBeats.length - 1);
        break;
      case 'suspense':
        stopTimer();
        S.phase = S.suspenseNext === 'dawn' ? 'wake' : 'tally';
        break;
      case 'day': S.phase = 'dawn'; stopTimer(); break;
      case 'vote': S.phase = 'day'; startTimer(S.settings.dayMs); break;
      case 'tally': S.phase = 'vote'; startTimer(5000); break;
      default: return;
    }
    push();
    render();
  }

  /* ---------- night inputs ---------- */

  function needsInput(b) { return b.input !== 'none' && b.input !== 'self'; }
  function actorOf(b) {
    const holder = aliveWith(S, b.role)[0];
    return holder ? holder.id : null;
  }

  function apply(b, targets) {
    undo(b);
    b.targets = targets.slice();
    b.actor = actorOf(b);
    switch (b.input) {
      case 'kill': S.pendingKill = targets[0]; break;
      case 'look': applyLook(S, targets[0]); break;
      case 'copy': {
        const a = byId(S, b.actor);
        b.prevRole = a ? a.role : '';
        applyCopy(S, b.actor, targets[0]);
        break;
      }
      case 'steal': applySteal(S, b.actor, targets[0]); break;
      case 'swap': applySwap(S, targets[0], targets[1]); break;
    }
    b.applied = true;
  }

  function undo(b) {
    if (!b || !b.applied) return;
    switch (b.input) {
      case 'kill': S.pendingKill = null; break;
      case 'look': S.seerAnswer = null; break;
      case 'copy': { const a = byId(S, b.actor); if (a) a.role = b.prevRole; break; }
      case 'steal': applySteal(S, b.actor, b.targets[0]); break;   // its own inverse
      case 'swap': applySwap(S, b.targets[0], b.targets[1]); break;
    }
    S.nightLog.pop();
    b.applied = false;
    b.targets = [];
  }

  function votesIn() { return alive(S).every((p) => !!S.votes[p.id]); }

  /* ---------- render ---------- */

  function render() {
    ['admPicker', 'admVotes', 'admOutcome', 'admAnswer'].forEach((id) => { $(id).hidden = true; });
    $('admClockRow').hidden = !S.timer.total || S.phase === 'vote';
    $('admPause').textContent = S.timer.running ? 'pause' : 'resume';
    $('admNext').disabled = false;
    $('admNext').textContent = 'next';
    $('admStory').textContent = '';
    $('admCall').textContent = '';
    $('roundLabel').textContent =
      (S.phase === 'over' ? 'Finished'
        : ['day', 'vote', 'tally', 'lynch'].indexOf(S.phase) !== -1 ? 'Day ' + roman(S.round)
        : 'Night ' + roman(S.round));

    const head = (kicker, title) => { $('admKicker').textContent = kicker; $('admTitle').textContent = title; };

    switch (S.phase) {
      case 'opening':
        head('before we start', 'Read them in');
        $('admStory').textContent = LINES.opening;
        $('admCall').textContent = 'Everyone should be seated and know their own role. Nobody else\'s.';
        $('admNext').textContent = 'nightfall';
        break;

      case 'nightfall':
        head('night ' + roman(S.round), 'Everybody, close your eyes');
        $('admStory').textContent = S.round === 1 ? LINES.night_first : LINES.night_again;
        $('admCall').textContent = 'Wait until the room is quiet, then work down the list. ' +
          S.nightBeats.length + ' role' + (S.nightBeats.length === 1 ? '' : 's') + ' still to call.';
        break;

      case 'nightbeat': renderBeat(); break;

      case 'wake':
        head('night ' + roman(S.round) + ' · over', 'Everybody, wake up');
        $('admStory').textContent = LINES.dawn;
        $('admCall').textContent = 'Wait for everyone to open their eyes. Next starts a three-second count, then the TV shows who didn\'t make it.';
        $('admNext').textContent = 'count them down';
        break;

      case 'suspense':
        head(S.suspenseNext === 'dawn' ? 'dawn' : 'the rope', 'Three…');
        $('admCall').textContent = 'Eyes on the television.';
        $('admNext').disabled = true;
        break;

      case 'dawn': renderDawn(); break;

      case 'hunter': {
        head('the hunter falls', nameOf(S, S.hunterPending) + ' takes a shot');
        $('admStory').textContent = LINES.hunter_dies;
        $('admCall').textContent = 'Ask them, out loud, who they are taking with them.';
        showPicker('Shot by ' + nameOf(S, S.hunterPending),
          alive(S).map((p) => p.id), S.hunterTarget ? [S.hunterTarget] : [], 1,
          (sel) => { S.hunterTarget = sel[0] || null; push(); render(); });
        $('admNext').disabled = !S.hunterTarget;
        $('admNext').textContent = 'fire';
        break;
      }

      case 'day':
        head('day ' + roman(S.round), 'The village argues');
        $('admStory').textContent = LINES.day;
        $('admCall').textContent = 'Let them run. Hit next when you want the vote.';
        $('admNext').textContent = 'call the vote';
        break;

      case 'vote':
        head('day ' + roman(S.round), S.revoteNotice ? 'Again — everybody points' : 'Everybody points');
        $('admStory').textContent = S.revoteNotice
          ? 'Nobody had a majority, so the village votes again. Attempt ' + (S.revotes + 1) + '.'
          : '';
        $('admCall').textContent = 'The TV counts three, two, one. Keep your hands up until it\'s all written down.';
        $('admNext').textContent = 'take the tally';
        break;

      case 'tally':
        head('day ' + roman(S.round), 'Who pointed where?');
        $('admCall').textContent = 'Tap each voter, then their target.';
        renderVotes();
        $('admNext').disabled = !votesIn();
        $('admNext').textContent = 'lock it in';
        break;

      case 'lynch': renderLynch(); break;

      case 'over': renderOver(); break;
    }

    renderRoster();
    renderClock();
  }

  function renderBeat() {
    const b = beat();
    if (!b) return;
    const holders = aliveWith(S, b.role);
    $('admKicker').textContent = 'night ' + roman(S.round) + ' · ' + (S.beatIndex + 1) + ' of ' + S.nightBeats.length;
    $('admTitle').textContent = ROLES[b.role].name;
    if (S.round === 1) $('admStory').textContent = b.story;
    $('admCall').textContent = b.call;

    const others = (excludeIds) => alive(S).filter((p) => excludeIds.indexOf(p.id) === -1).map((p) => p.id);
    const actor = actorOf(b);

    switch (b.input) {
      case 'kill':
        showPicker('Who the wolves take',
          alive(S).filter((p) => p.role !== 'werewolf').map((p) => p.id),
          b.targets, 1, (sel) => { if (sel.length) apply(b, sel); else undo(b); push(); render(); });
        $('admNext').disabled = !b.applied;
        break;

      case 'look':
        showPicker('Who the Seer inspects', others([actor]), b.targets, 1,
          (sel) => { if (sel.length) apply(b, sel); else undo(b); push(); render(); });
        if (S.seerAnswer) {
          const box = $('admAnswer');
          box.hidden = false;
          box.className = 'answer ' + (S.seerAnswer.isWolf ? 'wolf' : 'clear');
          box.innerHTML = '<p class="micro">Signal this to the Seer — do not say it aloud</p><strong>' +
            esc(nameOf(S, S.seerAnswer.targetId)) + ' is ' +
            (S.seerAnswer.isWolf ? 'A WEREWOLF' : 'not a werewolf') + '</strong>';
        }
        $('admNext').disabled = !b.applied;
        break;

      case 'copy':
        showPicker('Who the Doppelgänger becomes', others([actor]), b.targets, 1,
          (sel) => { if (sel.length) apply(b, sel); else undo(b); push(); render(); });
        $('admNext').disabled = !b.applied;
        break;

      case 'steal':
        showPicker('Who the Robber steals from', others([actor]), b.targets, 1,
          (sel) => { if (sel.length) apply(b, sel); else undo(b); push(); render(); });
        $('admNext').disabled = !b.applied;
        break;

      case 'swap':
        showPicker('The two being swapped — pick two', others([actor]), b.targets, 2,
          (sel) => { if (sel.length === 2) apply(b, sel); else { undo(b); b.targets = sel; } push(); render(); });
        $('admNext').disabled = !b.applied;
        break;

      case 'self': {
        const box = $('admAnswer');
        box.hidden = false;
        box.className = 'answer';
        box.innerHTML = '<p class="micro">Signal this to the Insomniac</p><strong>' +
          holders.map((p) => esc(p.name) + ' is the ' + ROLES[p.role].name).join('<br>') + '</strong>';
        break;
      }

      case 'none':
        $('admCall').textContent = b.call + (holders.length > 1
          ? ' (' + holders.map((p) => p.name).join(', ') + ')'
          : '');
        break;
    }
  }

  function renderDawn() {
    const dead = S.lastDeaths;
    $('admKicker').textContent = 'dawn · day ' + roman(S.round);
    if (!dead.length) {
      $('admTitle').textContent = 'Nobody died';
      $('admStory').textContent = LINES.dawn_quiet;
    } else {
      $('admTitle').textContent = nameOf(S, dead[0]) + ' is dead';
      $('admStory').textContent = LINES.dawn_body;
      const r = deathReveal(S, dead[0]);
      $('admCall').textContent = 'The village is told: ' + r.text + '.';
    }
    $('admNext').textContent = 'daylight';
  }

  function renderLynch() {
    $('admKicker').textContent = 'the rope · day ' + roman(S.round);
    if (!S.lastDeaths.length) {
      $('admTitle').textContent = S.voteTied ? 'A tie. Nobody hangs.' : 'Nobody hangs';
      $('admStory').textContent = LINES.lynch_none;
    } else {
      const id = S.lastDeaths[0];
      $('admTitle').textContent = nameOf(S, id) + ' hangs';
      $('admStory').textContent = LINES.lynch_body;
      $('admCall').textContent = 'The village is told: ' + deathReveal(S, id).text + '.';
    }
    $('admNext').textContent = 'nightfall';
  }

  function renderOver() {
    const r = S.result;
    $('admKicker').textContent = 'finished after ' + roman(S.round) + (S.round === 1 ? ' night' : ' nights');
    $('admTitle').textContent = r.headline;
    const box = $('admOutcome');
    box.hidden = false;
    box.innerHTML =
      '<ul>' + S.players.map((p) => {
        const won = r.winners.indexOf(p.id) !== -1;
        return '<li><span class="' + (won ? 'won' : 'lost') + '">' + esc(p.name) + '</span>' +
          '<span class="lost">' + ROLES[p.role].name +
          (p.startRole !== p.role ? ' (began as ' + ROLES[p.startRole].name + ')' : '') +
          (p.alive ? '' : ' · died night ' + roman(p.diedRound)) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="outcome-actions">' +
        '<button type="button" class="link" id="againBtn">same cast, new game</button>' +
        '<button type="button" class="link" id="setupBtn">back to setup</button>' +
      '</div>';
    $('againBtn').addEventListener('click', playAgain);
    $('setupBtn').addEventListener('click', quit);
    $('admNext').disabled = true;
  }

  function playAgain() {
    const fresh = newGame();
    fresh.settings = S.settings;
    fresh.players = S.players.map((p) => ({
      id: p.id, name: p.name, role: p.startRole, startRole: p.startRole,
      alive: true, diedRound: 0, diedBy: '',
    }));
    boot(fresh, !tvWindow || tvWindow.closed);
  }

  function showPicker(label, ids, chosen, limit, onChange) {
    const box = $('admPicker');
    box.hidden = false;
    $('pickerLabel').textContent = label;
    const grid = $('pickerGrid');
    grid.innerHTML = ids.map((id) =>
      '<button type="button" data-pick="' + id + '" aria-pressed="' +
      (chosen.indexOf(id) !== -1) + '">' + esc(nameOf(S, id)) + '</button>').join('');
    grid.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pick;
        let sel = chosen.slice();
        const at = sel.indexOf(id);
        if (at !== -1) sel.splice(at, 1);
        else { sel.push(id); if (sel.length > limit) sel = sel.slice(sel.length - limit); }
        Sound.play('blip');
        onChange(sel);
      });
    });
  }

  function renderVotes() {
    const box = $('admVotes');
    box.hidden = false;
    const living = alive(S);
    box.innerHTML = living.map((p) => {
      const targets = living.filter((t) => t.id !== p.id).map((t) =>
        '<button type="button" data-voter="' + p.id + '" data-target="' + t.id + '" aria-pressed="' +
        (S.votes[p.id] === t.id) + '">' + esc(t.name) + '</button>').join('');
      return '<div class="vote-row' + (S.votes[p.id] ? ' done' : '') + '"><b>' + esc(p.name) +
        '</b><div class="vote-targets">' + targets + '</div></div>';
    }).join('');
    box.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        S.votes[b.dataset.voter] = b.dataset.target;
        Sound.play('blip');
        push();
        renderVotes();
        $('admNext').disabled = !votesIn();
      });
    });
  }

  function renderRoster() {
    const living = alive(S).length;
    $('rosterCount').textContent = living + '/' + S.players.length;
    $('rosterList').innerHTML = S.players.map((p) => {
      const r = ROLES[p.role] || { name: '?', mark: '?', team: '' };
      const cls = [p.alive ? '' : 'dead', r.team === 'wolves' ? 'wolf' : '', r.team === 'tanner' ? 'tan' : ''].join(' ');
      return '<li class="' + cls + '"><span class="mark">' + r.mark + '</span>' +
        '<span class="who">' + esc(p.name) + '</span>' +
        '<span class="micro">' + r.name + '</span></li>';
    }).join('');
  }

  function renderClock() {
    if (!S || !S.timer.total) return;
    const ms = timerRemaining(S.timer);
    const el = $('admClock');
    el.textContent = fmtClock(ms);
    el.classList.toggle('low', ms <= 15000);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  return { launch, resume };
})();
