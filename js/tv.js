/* the killer tv — the big screen. Renders whatever the remote sends and
   makes a meal of it. Holds no game logic of its own. */

const TV = (function () {
  let S = null;
  let lastKey = '';
  let raf = null;
  let audioReady = false;
  let lastTickSecond = -1;
  let sleepTimer = null;

  const $ = (id) => document.getElementById(id);
  const nameOf = (id) => {
    if (!S) return '?';
    const p = S.players.find((x) => x.id === id);
    return p ? p.name : '?';
  };

  function mount() {
    document.body.dataset.view = 'tv';
    Narrator.warm();   // find out early whether the good voice is available

    Link.start('tv', (up) => {
      $('tvLink').classList.toggle('on', up);
    });

    Bus.on((msg) => {
      if (msg.type === 'state') apply(msg.payload);
      if (msg.type === 'bye') window.close();
    });
    Bus.send('hello', {});

    // audio needs one gesture in this window before it will make a sound
    const unlock = () => {
      if (audioReady) return;
      audioReady = true;
      Sound.ensure();
      $('tvHint').textContent = 'press F for fullscreen';
      if (S) cue(true);
    };
    ['click', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { once: false }));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      $('tvHint').classList.toggle('hide', !!document.fullscreenElement);
    });

    $('tvHint').textContent = 'click once for sound · press F for fullscreen';

    // pick up a game already in progress if this window was re-opened
    try {
      const cached = localStorage.getItem('killer-tv:state');
      if (cached) apply(JSON.parse(cached), true);
    } catch (e) { /* ignore */ }

    loop();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  function apply(state, quiet) {
    S = state;
    Sound.setEnabled(!!S.settings.sfx);
    Narrator.setEnabled(!!S.settings.narration);
    Narrator.setVoice(S.settings.voiceName || '');
    const key = S.stage + ':' + S.phaseIndex;
    const changed = key !== lastKey;
    lastKey = quiet ? '' : key;   // a cached restore should still cue when the real state lands
    render();
    if (changed && !quiet) cue(false);
  }

  /* ---------- sound + narration on entering a beat ---------- */

  function cue(replay) {
    if (sleepTimer) { clearTimeout(sleepTimer); sleepTimer = null; }
    if (!replay) Narrator.shush();
    lastTickSecond = -1;

    switch (S.stage) {
      case 'deal':
        Sound.play('thud');
        Narrator.say('Shuffle the deck. One card each, three in the middle.');
        break;

      case 'night': {
        const p = S.phases[S.phaseIndex];
        if (!p) break;
        if (S.phaseIndex === 0) Sound.startDrone();
        Sound.play('thud');
        Narrator.say(p.say);
        if (p.sleep && S.timer.total > 4000) {
          const wait = Math.max(1200, timerRemaining(S.timer) - 2600);
          sleepTimer = setTimeout(() => Narrator.say(p.sleep), wait);
        }
        break;
      }

      case 'day':
        Sound.stopDrone();
        Sound.play('chime');
        Narrator.say('The sun is up. Somebody at this table is lying. Find them.');
        break;

      case 'vote':
        Sound.play('riser');
        Narrator.say('Hands ready. On three, point at the one you want dead.');
        break;

      case 'tally':
        Sound.play('thud');
        Narrator.say('Point!');
        break;

      case 'kill':
        if (S.deaths.length) {
          Sound.play('stab');
          Narrator.say('The village has killed ' + S.deaths.map(nameOf).join(' and ') + '.');
        } else {
          Sound.play('thud');
          Narrator.say('Nobody could agree. Nobody dies.');
        }
        break;

      case 'reveal':
        Sound.play('thud');
        Narrator.say('Everybody — flip your card.');
        break;

      case 'result':
        Sound.play('fanfare');
        Narrator.say(S.result ? S.result.headline : '');
        break;
    }
  }

  /* ---------- render ---------- */

  function set(kicker, title, line, opts) {
    opts = opts || {};
    $('tvKicker').textContent = kicker || '';
    $('tvTitle').textContent = title || '';
    $('tvTitle').className = 'tv-title' + (opts.small ? ' small' : '');
    $('tvLine').textContent = line || '';
    $('tvLine').className = 'tv-line' + (opts.bigLine ? ' big' : '');
  }

  function render() {
    if (!S) return;
    $('tvClockWrap').hidden = !S.timer.total || S.stage === 'vote';
    $('tvGrid').hidden = true;
    $('tvResult').hidden = true;
    $('tvDeck').hidden = !(S.settings.showDeck && ['night', 'day', 'vote', 'tally'].indexOf(S.stage) !== -1);

    switch (S.stage) {
      case 'deal':
        set('round ' + S.round, 'DEAL THE CARDS',
          'One card each, face down. Three in the middle. Nobody looks.');
        break;

      case 'night': {
        const p = S.phases[S.phaseIndex];
        if (!p) break;
        set(p.id === 'nightstart' || p.id === 'nightend' ? 'the night' : 'night · wake up',
          p.icon + '  ' + p.title.toUpperCase(), p.line, { small: p.title.length > 13, bigLine: true });
        break;
      }

      case 'day':
        set('daybreak', 'TALK', 'Accuse. Deny. Lie. The clock is running.');
        break;

      case 'vote':
        renderCountdown();
        break;

      case 'tally':
        set('the vote', 'POINT NOW', 'Hold your finger where it is.');
        renderTallyGrid();
        break;

      case 'kill':
        if (S.deaths.length) {
          set('the village has spoken',
            S.deaths.map(nameOf).join('  &  ').toUpperCase(),
            S.deaths.length > 1 ? 'They are dead.' : 'Dead.',
            { small: S.deaths.length > 1, bigLine: true });
        } else {
          set('the village has spoken', 'NOBODY DIES', 'You couldn\'t agree. Live with it.', { bigLine: true });
        }
        renderDeathGrid();
        break;

      case 'reveal':
        set('the reveal', 'FLIP YOUR CARDS', 'Show the table what you really were.', { bigLine: true });
        break;

      case 'result':
        renderResult();
        break;

      default:
        set('', 'THE KILLER TV', 'waiting for the remote…');
    }

    renderDeck();
  }

  function renderCountdown() {
    const left = Math.ceil(timerRemaining(S.timer) / 1000);
    const n = Math.max(0, Math.min(3, left - 1));
    set('the vote', n > 0 ? String(n) : 'POINT',
      'Point at the player you want dead.', { bigLine: true });
  }

  function renderTallyGrid() {
    const grid = $('tvGrid');
    grid.hidden = false;
    const counts = tallyVotes(S);
    grid.innerHTML = S.players.map((p) => {
      const v = counts[p.id] || 0;
      return '<div class="tv-card"><b>' + esc(p.name) + '</b>' +
        '<span class="votes">' + (v || '·') + '</span></div>';
    }).join('');
  }

  function renderDeathGrid() {
    const grid = $('tvGrid');
    if (!S.deaths.length) return;
    grid.hidden = false;
    grid.innerHTML = S.players.map((p) => {
      const dead = S.deaths.indexOf(p.id) !== -1;
      return '<div class="tv-card' + (dead ? ' dead' : '') + '"><b>' + esc(p.name) + '</b>' +
        (dead ? '<span class="tag">dead</span>' : '') + '</div>';
    }).join('');
  }

  function renderResult() {
    const r = S.result;
    if (!r) return;
    set('', r.headline, '', { small: r.headline.length > 22 });
    const box = $('tvResult');
    box.hidden = false;

    const teams = r.teams.length
      ? '<div class="teams">' + r.teams.map((t) => '<span class="team">' + teamLabel(t) + '</span>').join('') + '</div>'
      : '';

    const cards = S.players.map((p) => {
      const role = effectiveRole(S, p.id);
      const def = ROLES[role] || { icon: '?', name: '?' };
      const won = r.winners.indexOf(p.id) !== -1;
      const dead = S.deaths.indexOf(p.id) !== -1;
      return '<div class="tv-card' + (dead ? ' dead' : '') + (won ? ' win' : '') + '">' +
        '<b>' + esc(p.name) + '</b><i>' + def.icon + ' ' + def.name + '</i>' +
        '<span class="tag">' + (dead ? 'dead' : '') + (dead && won ? ' · ' : '') + (won ? 'winner' : '') + '</span></div>';
    }).join('');

    const middle = '<div class="tv-deck" style="margin-top:1.4vmin">' +
      S.centreRoles.map((c) => '<span>middle · ' + (ROLES[c] ? ROLES[c].name : '?') + '</span>').join('') + '</div>';

    box.innerHTML = teams + '<div class="tv-grid" style="margin-top:1vmin">' + cards + '</div>' + middle;
  }

  function renderDeck() {
    if ($('tvDeck').hidden) return;
    const counts = deckCounts(S.deck);
    $('tvDeck').innerHTML = Object.keys(counts).map((id) =>
      '<span>' + ROLES[id].icon + ' ' + ROLES[id].name +
      (counts[id] > 1 ? ' <span class="n">×' + counts[id] + '</span>' : '') + '</span>').join('');
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ---------- the clock, driven per frame so it stays smooth ---------- */

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!S || !S.timer.total) return;

    const ms = timerRemaining(S.timer);

    if (S.stage === 'vote') { renderCountdown(); }

    const clock = $('tvClock');
    const bar = $('tvBar');
    const low = ms <= 10000;
    clock.textContent = fmtClock(ms);
    clock.classList.toggle('low', low);
    bar.style.width = Math.max(0, Math.min(100, (ms / S.timer.total) * 100)) + '%';
    bar.classList.toggle('low', low);

    const sec = Math.ceil(ms / 1000);
    if (S.timer.running && sec !== lastTickSecond && sec <= 5 && sec > 0) {
      lastTickSecond = sec;
      Sound.play('tick');
    }
  }

  return { mount };
})();
