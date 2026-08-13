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

    Link.start('tv', (up) => { $('tvRound').style.opacity = up ? '1' : '.4'; });

    Bus.on((msg) => {
      if (msg.type === 'state') apply(msg.payload);
      if (msg.type === 'bye') window.close();
    });
    Bus.send('hello', {});

    const unlock = () => {
      if (audioUnlocked) return;
      audioUnlocked = true;
      Sound.ensure();
      $('tvHint').textContent = 'F for fullscreen';
      if (S) cue();
    };
    ['click', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock));

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
    Narrator.setEnabled(!!S.settings.narration);
    Narrator.setVoice(S.settings.voiceName || '');

    const key = [S.phase, S.round, S.beatIndex, S.lastDeaths.join(','), S.hunterPending].join('|');
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
      case 'opening':
        Sound.play('toll');
        Narrator.say('opening');
        break;

      case 'nightfall':
        Sound.startDrone();
        Sound.play('thud');
        Narrator.say(S.round === 1 ? 'night_first' : 'night_again');
        break;

      case 'nightbeat': {
        const b = S.nightBeats[S.beatIndex];
        if (!b) break;
        Sound.play('thud');
        // the first night gets the full story; later nights just get the call
        if (S.round === 1) {
          Narrator.say('story_' + b.role);
          setTimeout(() => { if (S && S.phase === 'nightbeat') Narrator.say('call_' + b.role); }, 6200);
        } else {
          Narrator.say('call_' + b.role);
        }
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

  function paint(o) {
    $('tvKicker').textContent = o.kicker || '';
    $('tvTitle').textContent = o.title || '';
    $('tvTitle').className = 'tv-title' + (o.name ? ' name' : '') + (o.small ? ' small' : '');
    $('tvProse').textContent = o.prose || '';
    $('tvProse').className = 'tv-prose' + (o.plain ? ' plain' : '');
    $('tvScene').innerHTML = sceneFor(o.scene);
    $('tvScene').className = 'tv-scene ' + (o.tint || '');
  }

  function render() {
    if (!S) return;
    $('tvClockWrap').hidden = !S.timer.total || S.phase === 'vote';
    $('tvTally').hidden = true;
    $('tvRound').textContent = S.phase === 'over' ? 'finished'
      : (['day', 'vote', 'lynch'].indexOf(S.phase) !== -1 ? 'day ' : 'night ') + S.round;

    switch (S.phase) {
      case 'opening':
        paint({ scene: 'night', kicker: '', title: 'The Killer TV', prose: LINES.opening });
        break;

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
        paint({
          scene: b.scene, tint: b.role === 'werewolf' ? 'blood' : 'bone',
          kicker: 'night ' + S.round,
          title: ROLES[b.role].name,
          prose: S.round === 1 ? b.story : b.call,
          plain: S.round !== 1,
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

      case 'day':
        paint({ scene: 'vote', kicker: 'day ' + S.round, title: 'Talk', prose: LINES.day });
        break;

      case 'vote':
        renderCountdown();
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
          scene: S.result.scene, tint: S.result.team === 'wolves' ? 'blood' : 'gold',
          kicker: 'after ' + S.round + (S.round === 1 ? ' night' : ' nights'),
          title: S.result.headline, small: true,
          prose: LINES[S.result.line],
        });
        break;

      default:
        paint({ scene: 'night', title: 'The Killer TV', prose: 'waiting for the remote' });
    }

    renderRoster();
  }

  function renderCountdown() {
    const left = Math.ceil(timerRemaining(S.timer) / 1000);
    const n = Math.max(0, Math.min(3, left - 1));
    paint({
      scene: 'vote', tint: 'blood', kicker: 'day ' + S.round,
      title: n > 0 ? String(n) : 'Point', name: true,
      prose: 'Point at the one you want swinging.', plain: true,
    });
  }

  function renderRoster() {
    const winners = S.result ? S.result.winners : [];
    $('tvRoster').innerHTML = S.players.map((p) => {
      const cls = [p.alive ? '' : 'dead', winners.indexOf(p.id) !== -1 ? 'won' : ''].join(' ').trim();
      const suffix = (S.phase === 'over') ? ' · ' + ROLES[p.role].name : '';
      return '<li class="' + cls + '">' + esc(p.name) + suffix + '</li>';
    }).join('');
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
