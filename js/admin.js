/* the killer tv — the remote.

   Owns the game, runs the phases, and pushes a copy to the TV after every
   change. Shows every role, so it is the one screen nobody else should see. */

const Admin = (function () {
  const $ = (id) => document.getElementById(id);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const roman = (n) => ROMAN[n] || String(n);

  let S = null;
  let tv = null;
  let ticker = null;
  let wired = false;

  /* ---------- lifecycle ---------- */

  function launch(state) { boot(state, true); }

  function resume(state) {
    if (state.timer && state.timer.running) {
      state.timer.left = timeLeft(state.timer);
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
      $('link').classList.toggle('on', up);
      $('linkText').textContent = up ? 'TV connected' : 'TV not responding';
      if (up) push();
    });

    if (openTv) openTvWindow();
    if (S.phase === 'rules' && !S.settings.showRules) S.phase = S.settings.showStory ? 'story' : null;
    if (S.phase === 'story' && !S.settings.showStory) S.phase = null;
    if (!S.phase) startNight();

    push();
    draw();
    if (!ticker) ticker = setInterval(tick, 200);
  }

  function openTvWindow() {
    const url = location.pathname + location.search + '#tv';
    try {
      /* A named target with size features becomes a popup window; the same
         target with no features becomes an ordinary tab. */
      tv = S.settings.openAs === 'tab'
        ? window.open(url, 'killer_tv')
        : window.open(url, 'killer_tv', 'width=1280,height=720');
    } catch (e) { tv = null; }
    if (!tv) { $('linkText').textContent = 'TV window blocked — use the TV button'; return; }
    Bus.setPeer(tv);
    try { tv.focus(); } catch (e) {}
    setTimeout(push, 400);
  }

  function wire() {
    $('admNext').addEventListener('click', next);
    $('admBack').addEventListener('click', back);
    $('admPause').addEventListener('click', togglePause);
    $('admPlus').addEventListener('click', () => addTime(30000));
    $('reopenTv').addEventListener('click', openTvWindow);
    $('quit').addEventListener('click', quit);
    $('clearVotes').addEventListener('click', () => { S.votes = {}; push(); draw(); });

    document.addEventListener('keydown', (e) => {
      if (document.body.dataset.view !== 'admin') return;
      if (e.target.matches('input,select,textarea')) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); back(); }
    });

    Bus.on((msg) => { if (msg.type === 'hello') push(); });
    window.addEventListener('beforeunload', () => {
      try { if (tv && !tv.closed) tv.close(); } catch (e) {}
    });
  }

  function quit() {
    if (!confirm('End this game and go back to setup?')) return;
    Bus.send('bye', {});
    try { if (tv && !tv.closed) tv.close(); } catch (e) {}
    try { localStorage.removeItem('killer-tv:state'); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
    location.reload();
  }

  function push() {
    if (!S) return;
    Bus.send('state', S);
    try { localStorage.setItem('killer-tv:state', JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- clock ---------- */

  function startTimer(ms) {
    S.timer = ms ? { total: ms, left: ms, endsAt: Date.now() + ms, running: true }
                 : { total: 0, left: 0, endsAt: 0, running: false };
  }
  function togglePause() {
    if (!S.timer.total) return;
    if (S.timer.running) { S.timer.left = timeLeft(S.timer); S.timer.running = false; }
    else { S.timer.endsAt = Date.now() + S.timer.left; S.timer.running = true; }
    push(); draw();
  }
  function addTime(ms) {
    if (!S.timer.total) return;
    S.timer.total += ms;
    if (S.timer.running) S.timer.endsAt += ms; else S.timer.left += ms;
    Sound.play('tap'); push(); drawClock();
  }
  function tick() {
    if (!S) return;
    drawClock();
    if (S.timer.running && timeLeft(S.timer) <= 0) {
      S.timer.running = false;
      if (S.phase === 'day') next();
    }
  }

  /* ---------- phases ---------- */

  function startNight() {
    S.phase = 'night';
    S.step = 0;
    S.night = buildNight(S);
    S.pendingKill = null;
    S.seerAnswer = null;
    S.log = [];
    S.deaths = [];
    startTimer(0);
  }

  function next() {
    switch (S.phase) {
      case 'rules':
        if (S.step < RULES.length - 1) S.step++;
        else if (S.settings.showStory) { S.phase = 'story'; S.step = 0; }
        else startNight();
        break;

      case 'story':
        if (S.step < STORY.length - 1) S.step++;
        else startNight();
        break;

      case 'night': {
        const b = beatOf(S);
        if (b && beatNeedsInput(b) && !b.done) return;
        if (S.step < S.night.length - 1) { S.step++; S.seerAnswer = null; }
        else resolveDawn();
        break;
      }

      case 'dawn':
        afterDeaths('day');
        break;

      case 'day':
        S.phase = 'vote';
        S.votes = {};
        S.revotes = 0;
        S.revoted = false;
        startTimer(0);
        break;

      case 'vote': {
        if (!votesIn(S)) return;
        const out = voteResult(S);
        S.tally = out.counts;
        if (out.tied && S.revotes < MAX_REVOTES) {
          S.revotes++;
          S.revoted = true;
          S.votes = {};
          Sound.play('vote');
          break;
        }
        S.deaths = [];
        S.cause = 'vote';
        if (out.id) { kill(S, out.id, 'vote'); S.deaths = [out.id]; }
        S.phase = 'verdict';
        Sound.play(out.id ? 'dead' : 'vote');
        break;
      }

      case 'verdict':
        afterDeaths('night');
        break;

      case 'hunter': {
        if (!S.hunterTarget) return;
        kill(S, S.hunterTarget, 'hunter');
        S.deaths.push(S.hunterTarget);
        S.hunter = null;
        S.hunterTarget = null;
        Sound.play('dead');
        afterDeaths(S.hunterNext || 'day');
        break;
      }

      default: return;
    }
    push();
    draw();
  }

  function resolveDawn() {
    S.deaths = [];
    S.cause = 'killers';
    if (S.pendingKill && kill(S, S.pendingKill, 'killers')) S.deaths = [S.pendingKill];
    S.phase = 'dawn';
    Sound.play(S.deaths.length ? 'dead' : 'dawn');
  }

  /* After anybody dies: let a dead Hunter fire, then see whether it's over. */
  function afterDeaths(then) {
    const h = S.deaths.find((id) => {
      const p = byId(S, id);
      return p && p.role === 'hunter' && !S.hunterDone[id];
    });
    if (h) {
      S.hunterDone[h] = true;
      S.hunter = h;
      S.hunterTarget = null;
      S.hunterNext = then;
      S.phase = 'hunter';
      return;
    }

    const end = checkEnd(S);
    if (end) {
      S.result = end;
      S.phase = 'over';
      startTimer(0);
      Sound.play('win');
      return;
    }

    if (then === 'day') {
      S.phase = 'day';
      startTimer(S.settings.dayMs);
    } else {
      S.round++;
      startNight();
    }
  }

  function back() {
    switch (S.phase) {
      case 'rules': if (S.step > 0) S.step--; else return; break;
      case 'story':
        if (S.step > 0) S.step--;
        else if (S.settings.showRules) { S.phase = 'rules'; S.step = RULES.length - 1; }
        else return;
        break;
      case 'night': {
        const b = beatOf(S);
        if (b && b.done) { undoBeat(S, b); break; }
        if (S.step > 0) { S.step--; S.seerAnswer = null; break; }
        if (S.settings.showStory) { S.phase = 'story'; S.step = STORY.length - 1; }
        else if (S.settings.showRules) { S.phase = 'rules'; S.step = RULES.length - 1; }
        else return;
        break;
      }
      case 'day': S.phase = 'dawn'; startTimer(0); break;
      case 'vote': S.phase = 'day'; startTimer(S.settings.dayMs); break;
      default: return;
    }
    push();
    draw();
  }

  /* ---------- drawing ---------- */

  function draw() {
    ['admScript', 'admAnswer', 'admPicker', 'admVotes', 'admResult'].forEach((id) => { $(id).hidden = true; });
    $('admSkip').hidden = true;
    $('admClockRow').hidden = !S.timer.total;
    $('admPause').textContent = S.timer.running ? 'Pause' : 'Resume';
    $('admNext').disabled = false;
    $('admNext').textContent = 'Next';
    $('admHint').textContent = '';
    $('admRoster').hidden = false;

    const head = (eyebrow, title) => {
      $('admEyebrow').textContent = eyebrow;
      $('admTitle').textContent = title;
    };

    switch (S.phase) {
      case 'rules': {
        const r = RULES[S.step];
        head('How to play · ' + (S.step + 1) + ' of ' + RULES.length, r.title);
        $('admHint').textContent = r.body;
        $('admNext').textContent = S.step === RULES.length - 1 ? (S.settings.showStory ? 'On to the story' : 'Start the night') : 'Next';
        skip('Skip the rules', () => { if (S.settings.showStory) { S.phase = 'story'; S.step = 0; } else startNight(); push(); draw(); });
        $('admRoster').hidden = true;
        break;
      }

      case 'story': {
        const t = STORY[S.step];
        head('Story · ' + (S.step + 1) + ' of ' + STORY.length, t.title);
        $('admHint').textContent = t.body;
        $('admNext').textContent = S.step === STORY.length - 1 ? 'Start the night' : 'Next';
        skip('Skip the story', () => { startNight(); push(); draw(); });
        $('admRoster').hidden = true;
        break;
      }

      case 'night': drawBeat(); break;

      case 'dawn': {
        head('Dawn · day ' + roman(S.round), S.deaths.length ? nameOf(S, S.deaths[0]) + ' is dead' : 'Nobody died');
        $('admHint').textContent = S.deaths.length
          ? 'The town is told: ' + reveal(S, S.deaths[0]).text + '.'
          : 'The killers came up empty. Everyone is still here.';
        $('admNext').textContent = 'Start the day';
        break;
      }

      case 'hunter': {
        head('The Hunter falls', nameOf(S, S.hunter) + ' takes a shot');
        $('admHint').textContent = 'Ask them out loud who they are taking with them.';
        picker('Shot by ' + nameOf(S, S.hunter), living(S).map((p) => p.id),
          S.hunterTarget ? [S.hunterTarget] : [], 1,
          (sel) => { S.hunterTarget = sel[0] || null; push(); draw(); });
        $('admNext').disabled = !S.hunterTarget;
        $('admNext').textContent = S.hunterTarget ? 'Fire' : 'Pick a target';
        break;
      }

      case 'day':
        head('Day ' + roman(S.round), 'The town argues');
        $('admHint').textContent = 'Let them talk. Hit next when you want the vote.';
        $('admNext').textContent = 'Call the vote';
        break;

      case 'vote': drawVote(); break;

      case 'verdict': {
        head('The vote · day ' + roman(S.round), S.deaths.length ? nameOf(S, S.deaths[0]) + ' is voted out' : 'Nobody is voted out');
        $('admHint').textContent = S.deaths.length
          ? 'The town is told: ' + reveal(S, S.deaths[0]).text + '.'
          : 'No majority after ' + (S.revotes + 1) + ' rounds of voting. The day is wasted.';
        $('admNext').textContent = 'Nightfall';
        break;
      }

      case 'over': drawResult(); break;
    }

    drawRoster();
    drawClock();
  }

  function skip(label, fn) {
    const b = $('admSkip');
    b.hidden = false;
    b.textContent = label;
    b.onclick = fn;
  }

  function drawBeat() {
    const b = beatOf(S);
    if (!b) return;
    const role = ROLES[b.role];
    const holders = livingWith(S, b.role);
    const beat = NIGHT.find((x) => x.role === b.role);

    $('admEyebrow').textContent = 'Night ' + roman(S.round) + ' · ' + (S.step + 1) + ' of ' + S.night.length;
    $('admTitle').textContent = role.name;

    $('admScript').hidden = false;
    $('admScriptText').textContent = beat.say;

    const actor = actorOf(S, b);
    const others = (skipIds) => living(S).filter((p) => skipIds.indexOf(p.id) === -1).map((p) => p.id);
    const gate = () => {
      $('admNext').disabled = !b.done;
      if (!b.done) $('admNext').textContent = b.input === 'swap' ? 'Pick two' : 'Pick someone';
    };
    const set = (sel, need) => {
      if (sel.length === need) applyBeat(S, b, sel);
      else { undoBeat(S, b); b.targets = sel; }
      push(); draw();
    };

    if (b.input === 'kill') {
      picker('Who the killers take', living(S).filter((p) => p.role !== 'killer').map((p) => p.id),
        b.targets, 1, (sel) => set(sel, 1));
      gate();

    } else if (b.input === 'look') {
      picker('Who the Seer looks at', others([actor]), b.targets, 1, (sel) => set(sel, 1));
      if (S.seerAnswer) {
        const def = ROLES[S.seerAnswer.role];
        const isKiller = S.seerAnswer.role === 'killer';
        const box = $('admAnswer');
        box.hidden = false;
        box.className = 'answer ' + (isKiller ? 'is-killer' : 'is-clear');
        box.innerHTML = '<p class="eyebrow">Signal this to the Seer — don\'t say it aloud</p>' +
          '<b>' + esc(nameOf(S, S.seerAnswer.targetId)) + ' is the ' + esc(def ? def.name : '?') + '</b>';
      }
      gate();

    } else if (b.input === 'copy') {
      picker('Who the Doppelgänger copies', others([actor]), b.targets, 1, (sel) => set(sel, 1));
      $('admHint').textContent = 'They act on the new role if it is called later tonight, and stay that role from now on.';
      gate();

    } else if (b.input === 'steal') {
      picker('Who the Robber steals from', others([actor]), b.targets, 1, (sel) => set(sel, 1));
      gate();

    } else if (b.input === 'swap') {
      picker('The two being swapped', others([actor]), b.targets, 2, (sel) => set(sel, 2));
      gate();

    } else if (b.input === 'self') {
      const box = $('admAnswer');
      box.hidden = false;
      box.className = 'answer';
      box.innerHTML = '<p class="eyebrow">Signal this to the Insomniac</p><b>' +
        holders.map((p) => esc(p.name) + ' is the ' + ROLES[p.role].name).join('<br>') + '</b>';

    } else {
      $('admHint').textContent = holders.length > 1
        ? holders.map((p) => p.name).join(' and ') + ' are awake.'
        : holders.map((p) => p.name).join('') + ' is awake.';
    }
  }

  function picker(label, ids, chosen, limit, onChange) {
    $('admPicker').hidden = false;
    $('pickLabel').textContent = label;
    $('picks').innerHTML = ids.map((id) =>
      '<button type="button" class="pick" data-id="' + id + '" aria-pressed="' +
      (chosen.indexOf(id) !== -1) + '">' + esc(nameOf(S, id)) + '</button>').join('');

    $('picks').querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const sel = chosen.slice();
        const at = sel.indexOf(id);
        if (at !== -1) sel.splice(at, 1);
        else { sel.push(id); while (sel.length > limit) sel.shift(); }
        Sound.play('tap');
        onChange(sel);
      });
    });
  }

  function drawVote() {
    const alive = living(S);
    const short = alive.filter((p) => !S.votes[p.id]);

    $('admEyebrow').textContent = 'Day ' + roman(S.round) + (S.revoted ? ' · revote ' + (S.revotes + 1) : '');
    $('admTitle').textContent = S.revoted ? 'Tied — everyone votes again' : 'Who is everyone pointing at?';

    $('admVotes').hidden = false;
    $('voteLabel').textContent = (alive.length - short.length) + ' of ' + alive.length + ' recorded';
    $('voteSheet').innerHTML = alive.map((p) => {
      const targets = alive.filter((t) => t.id !== p.id).map((t) =>
        '<button type="button" data-voter="' + p.id + '" data-target="' + t.id + '" aria-pressed="' +
        (S.votes[p.id] === t.id) + '">' + esc(t.name) + '</button>').join('');
      return '<div class="vote-row' + (S.votes[p.id] ? '' : ' todo') + '"><b>' + esc(p.name) + '</b>' +
        '<div class="vote-targets">' + targets + '</div></div>';
    }).join('');

    $('voteSheet').querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        S.votes[b.dataset.voter] = b.dataset.target;
        Sound.play('tap');
        push(); draw();
      });
    });

    /* A disabled button with no explanation reads as a frozen app, so name the
       people still missing rather than just greying it out. */
    $('admNext').disabled = short.length > 0;
    $('admNext').textContent = short.length ? short.length + ' still to record' : 'Lock it in';
    $('admHint').textContent = short.length
      ? 'Waiting on ' + short.slice(0, 4).map((p) => p.name).join(', ') + (short.length > 4 ? ' and others' : '') + '.'
      : 'Everyone accounted for.';
  }

  function drawResult() {
    const r = S.result;
    $('admEyebrow').textContent = 'Finished after ' + roman(S.round) + (S.round === 1 ? ' night' : ' nights');
    $('admTitle').textContent = r.headline;

    const box = $('admResult');
    box.hidden = false;
    box.innerHTML =
      '<ul class="roster">' + S.players.map((p) => {
        const won = r.winners.indexOf(p.id) !== -1;
        const changed = p.role !== p.startRole;
        return '<li class="' + (p.alive ? '' : 'out') + '">' +
          '<span class="who">' + (won ? '★ ' : '') + esc(p.name) + '</span>' +
          '<span class="tag">' + ROLES[p.role].name +
          (changed ? ' (began as ' + ROLES[p.startRole].name + ')' : '') + '</span></li>';
      }).join('') + '</ul>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button type="button" class="btn" id="again">Same cast, new game</button>' +
        '<button type="button" class="btn btn-ghost" id="toSetup">Back to setup</button>' +
      '</div>';

    $('again').addEventListener('click', playAgain);
    $('toSetup').addEventListener('click', quit);
    $('admNext').disabled = true;
    $('admRoster').hidden = true;
  }

  function playAgain() {
    const fresh = newGame();
    fresh.settings = S.settings;
    fresh.players = S.players.map((p) => ({
      id: p.id, name: p.name, role: p.startRole, startRole: p.startRole,
      alive: true, diedRound: 0, diedBy: '',
    }));
    fresh.phase = fresh.settings.showRules ? 'rules' : (fresh.settings.showStory ? 'story' : null);
    boot(fresh, !tv || tv.closed);
  }

  function drawRoster() {
    if ($('admRoster').hidden) return;
    $('roster').innerHTML = S.players.map((p) => {
      const r = ROLES[p.role];
      return '<li class="' + (p.alive ? '' : 'out') + (r.team === 'killers' ? ' k' : '') + '">' +
        '<span class="who">' + esc(p.name) + '</span>' +
        '<span class="tag">' + r.name + (p.alive ? '' : ' · out') + '</span></li>';
    }).join('');
  }

  function drawClock() {
    if (!S || !S.timer.total) return;
    const ms = timeLeft(S.timer);
    const el = $('admClock');
    el.textContent = clock(ms);
    el.classList.toggle('low', ms <= 15000);
  }

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { launch: launch, resume: resume };
})();
