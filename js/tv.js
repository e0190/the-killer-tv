/* the killer tv — the big screen.

   Renders whatever the remote sends and makes a meal of it. Holds no game
   logic: it never decides who dies, only how loudly it says so. */

const TV = (function () {
  let S = null;
  let lastKey = '';
  let audioUnlocked = false;
  let lastTickSecond = -1;
  let voteTimer = null;

  const $ = (id) => document.getElementById(id);
  const nameOf = (id) => {
    if (!S) return '';
    const p = S.players.find((x) => x.id === id);
    return p ? p.name : '';
  };

  function mount() {
    document.body.dataset.view = 'tv';
    Narrator.warm();

    Link.start('tv', (up) => { $('tvHint').classList.toggle('offline', !up); });

    Bus.on((msg) => {
      if (msg.type === 'state') apply(msg.payload);
      if (msg.type === 'bye') window.close();
    });
    Bus.send('hello', {});

    /* Nothing can make a sound until somebody has interacted with this window,
       so the whole screen is a switch until they do. Otherwise the opening
       story plays to an empty room. */
    const unlock = () => {
      if (audioUnlocked) return;
      audioUnlocked = true;
      $('tvWake').classList.add('gone');
      Sound.ensure();
      if (S) cue();
    };
    $('tvWake').addEventListener('click', unlock);
    ['keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    });
    document.addEventListener('fullscreenchange', () => {
      $('tvHint').classList.toggle('hide', !!document.fullscreenElement);
    });

    try {
      const cached = localStorage.getItem('killer-tv:state');
      if (cached) apply(JSON.parse(cached), true);
    } catch (e) { /* ignore */ }

    loop();
  }

  function apply(state, quiet) {
    S = state;
    Sound.setEnabled(!!S.settings.sfx);
    Narrator.setEnabled(S.settings.narration !== 'none' && S.settings.narration !== false);
    Narrator.setMode(S.settings.narration);
    Narrator.setVoice(S.settings.voiceName || '');

    const key = [S.phase, S.round, S.beatIndex, S.prologueIndex, S.tutorialIndex,
      S.lastDeaths.join(','), S.hunterPending].join('|');
    const changed = key !== lastKey;
    lastKey = quiet ? '' : key;
    render();
    if (changed && !quiet) cue();
  }

  /* ---------- sound + narration when a beat opens ---------- */

  function cue() {
    if (voteTimer) { clearTimeout(voteTimer); voteTimer = null; }
    Narrator.shush();

    switch (S.phase) {
      case 'tutorial':
        Sound.play('blip');
        Narrator.say(TUTORIAL[S.tutorialIndex].id);
        break;

      case 'opening': {
        const p = PROLOGUE[S.prologueIndex];
        Sound.play(S.prologueIndex === 0 ? 'toll' : 'thud');
        if (S.prologueIndex === PROLOGUE.length - 1) Sound.startDrone();
        Narrator.say(p.id);
        break;
      }

      case 'nightfall':
        Sound.startDrone();
        Sound.play('thud');
        Narrator.say(S.round === 1 ? 'night_first' : 'night_again');
        break;

      case 'nightbeat': {
        const b = S.nightBeats[S.beatIndex];
        if (!b) break;
        Sound.play('thud');
        // first night gets the atmosphere too; every night gets the call and
        // any rules the role needs spelling out
        const run = [];
        if (S.round === 1) run.push('story_' + b.role);
        run.push('call_' + b.role);
        if (b.notes) b.notes.forEach((n) => run.push(n));
        Narrator.sayAll(run);
        break;
      }

      case 'wake':
        Sound.stopDrone();
        Sound.play('dawn');
        Narrator.say('dawn');
        break;

      case 'suspense':
        Sound.play('riser');
        break;

      case 'dawn':
        Sound.stopDrone();
        if (S.lastDeaths.length) {
          Sound.play('stab');
          Narrator.say('dawn_body');
          sayRevealAfter(S.lastDeaths[0], 5200);
        } else {
          Sound.play('dawn');
          Narrator.say('dawn_quiet');
        }
        break;

      case 'hunter':
        Sound.play('toll');
        Narrator.say('hunter_dies');
        break;

      case 'day':
        Sound.play('dawn');
        Narrator.say('day');
        break;

      case 'vote':
        Sound.play('riser');
        Narrator.say(S.revoteNotice ? 'vote_again' : 'vote_call');
        break;

      case 'tally':
        Sound.play('thud');
        Narrator.say('vote_point');
        break;

      case 'lynch':
        if (S.lastDeaths.length) {
          Sound.play('stab');
          Narrator.say('lynch_body');
          sayRevealAfter(S.lastDeaths[0], 4200);
        } else {
          Sound.play('toll');
          Narrator.say('lynch_none');
        }
        break;

      case 'over':
        Sound.stopDrone();
        Sound.play('toll');
        Narrator.say(S.result.line);
        break;
    }
  }

  function sayRevealAfter(id, delay) {
    const r = deathReveal(S, id);
    voteTimer = setTimeout(() => {
      if (S && (S.phase === 'dawn' || S.phase === 'lynch')) Narrator.say(r.line);
    }, delay);
  }

  /* ---------- render ---------- */

  /* Everything from waking up to the hanging is daylight. */
  const DAY_PHASES = ['wake', 'dawn', 'hunter', 'day', 'vote', 'tally', 'lynch'];

  function isDaylight() {
    if (!S) return false;
    if (S.phase === 'suspense') return S.suspenseNext === 'lynch';
    if (S.phase === 'over') return S.result && S.result.team === 'village';
    return DAY_PHASES.indexOf(S.phase) !== -1;
  }

  function paint(o) {
    const day = isDaylight();
    document.getElementById('view-tv').classList.toggle('day', day);

    $('tvKicker').textContent = o.kicker || '';
    $('tvTitle').textContent = o.title || '';
    $('tvTitle').className = 'tv-title' + (o.name ? ' name' : '') + (o.small ? ' small' : '');
    $('tvProse').textContent = o.prose || '';
    $('tvProse').className = 'tv-prose' + (o.plain ? ' plain' : '');
    $('tvScene').innerHTML = sceneFor(o.scene);
    $('tvScene').className = 'tv-scene';
    $('tvScene').style.color = tintFor(o.scene, day);
  }

  function render() {
    if (!S) return;
    $('tvClockWrap').hidden = !S.timer.total || ['vote', 'suspense'].indexOf(S.phase) !== -1;
    $('tvTally').hidden = true;

    switch (S.phase) {
      case 'tutorial': {
        const t = TUTORIAL[S.tutorialIndex];
        paint({
          scene: t.scene, tint: 'bone',
          kicker: 'how to play · ' + (S.tutorialIndex + 1) + ' of ' + TUTORIAL.length,
          title: t.title, small: true, prose: LINES[t.id], plain: true,
        });
        break;
      }

      case 'opening': {
        const p = PROLOGUE[S.prologueIndex];
        paint({
          scene: p.scene, tint: p.id === 'opening_smiled' || p.id === 'opening_tonight' ? 'blood' : '',
          kicker: 'the story · ' + (S.prologueIndex + 1) + ' of ' + PROLOGUE.length,
          title: p.title, small: true, prose: LINES[p.id],
        });
        break;
      }

      case 'nightfall':
        paint({
          scene: 'night', kicker: 'night ' + S.round,
          title: 'Close your eyes',
          prose: S.round === 1 ? LINES.night_first : LINES.night_again,
        });
        break;

      case 'nightbeat': {
        const b = S.nightBeats[S.beatIndex];
        if (!b) break;
        // a role with rules to spell out shows them instead of the mood piece
        const notes = b.notes ? b.notes.map((n) => LINES[n]).join(' ') : '';
        paint({
          scene: b.scene,
          kicker: 'night ' + S.round,
          title: ROLES[b.role].name,
          prose: notes ? b.call + ' ' + notes : b.call,
          plain: true,
          small: ROLES[b.role].name.length > 12,
        });
        break;
      }

      case 'dawn':
        if (S.lastDeaths.length) {
          const id = S.lastDeaths[0];
          paint({
            scene: 'body', tint: 'blood', kicker: 'the village wakes',
            title: nameOf(id), name: true,
            prose: deathReveal(S, id).text, plain: true,
          });
        } else {
          paint({ scene: 'dawn', tint: 'gold', kicker: 'the village wakes', title: 'Everyone lived', prose: LINES.dawn_quiet });
        }
        break;

      case 'hunter':
        paint({
          scene: 'hunter', tint: 'blood', kicker: 'one shot left',
          title: nameOf(S.hunterPending), name: true,
          prose: 'The Hunter is taking somebody with them.', plain: true,
        });
        break;

      case 'wake':
        paint({ scene: 'dawn', tint: 'gold', kicker: 'night ' + S.round + ' is over', title: 'Open your eyes', prose: LINES.dawn });
        break;

      case 'suspense':
        renderSuspense();
        break;

      case 'day':
        paint({ scene: 'vote', kicker: 'day ' + S.round, title: 'Talk', prose: LINES.day });
        break;

      case 'vote':
        renderCountdown();
        break;

      case 'tally':
        paint({
          scene: 'vote', tint: 'blood', kicker: 'day ' + S.round,
          title: 'Hold it there', prose: 'Keep pointing until every hand is written down.', plain: true,
        });
        break;

      case 'lynch':
        if (S.lastDeaths.length) {
          const id = S.lastDeaths[0];
          paint({
            scene: 'body', tint: 'blood', kicker: 'the village has spoken',
            title: nameOf(id), name: true,
            prose: deathReveal(S, id).text, plain: true,
          });
        } else {
          paint({ scene: 'vote', kicker: 'the village has spoken', title: 'Nobody hangs', prose: LINES.lynch_none });
        }
        break;

      case 'over':
        paint({
          scene: S.result.scene, tint: S.result.team === 'killers' ? 'blood' : 'gold',
          kicker: 'after ' + S.round + (S.round === 1 ? ' night' : ' nights'),
          title: S.result.headline, small: true,
          prose: LINES[S.result.line],
        });
        break;

      default:
        paint({ scene: 'night', title: 'The Killer TV', prose: 'waiting for the remote' });
    }
  }

  function renderCountdown() {
    const left = Math.ceil(timerRemaining(S.timer) / 1000);
    const n = Math.max(0, Math.min(3, left - 1));
    paint({
      scene: 'vote', tint: 'blood',
      kicker: S.revoteNotice ? 'day ' + S.round + ' · again' : 'day ' + S.round,
      title: n > 0 ? String(n) : 'Point', name: true,
      prose: S.revoteNotice
        ? 'Nobody had a majority. Point again.'
        : 'Point at the one you want swinging.',
      plain: true,
    });
  }

  /* The three seconds before a body is shown. */
  function renderSuspense() {
    const n = Math.max(1, Math.ceil(timerRemaining(S.timer) / 1000));
    paint({
      scene: S.suspenseNext === 'dawn' ? 'body' : 'vote', tint: 'blood',
      kicker: S.suspenseNext === 'dawn' ? 'the village counts itself' : 'the village has decided',
      title: String(n), name: true,
      prose: '', plain: true,
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ---------- the clock, per frame so it stays smooth ---------- */

  function loop() {
    requestAnimationFrame(loop);
    if (!S || !S.timer.total) return;

    const ms = timerRemaining(S.timer);
    if (S.phase === 'vote') renderCountdown();
    if (S.phase === 'suspense') renderSuspense();

    const low = ms <= 15000;
    $('tvClock').textContent = fmtClock(ms);
    $('tvClock').classList.toggle('low', low);
    $('tvBar').style.width = Math.max(0, Math.min(100, (ms / S.timer.total) * 100)) + '%';

    const sec = Math.ceil(ms / 1000);
    if (S.timer.running && sec !== lastTickSecond && sec <= 5 && sec > 0) {
      lastTickSecond = sec;
      Sound.play('tick');
    }
  }

  return { mount };
})();
