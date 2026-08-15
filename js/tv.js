/* the killer tv — the big screen.

   Renders whatever the remote sends. Holds no game logic: it never decides who
   dies, only how loudly it says so. Goes light for the day and dark for the
   night, which is the clearest signal in the room that things have moved on. */

const TV = (function () {
  const $ = (id) => document.getElementById(id);

  let S = null;
  let mark = '';
  let unlocked = false;
  let lastTick = -1;
  let revealAt = 0;                    // dawn holds the name back for a beat

  const DAY = ['dawn', 'hunter', 'day', 'vote', 'verdict'];

  function mount() {
    document.body.dataset.view = 'tv';
    Narrator.warm();

    Link.start('tv', () => {});
    Bus.on((msg) => {
      if (msg.type === 'state') apply(msg.data);
      else if (msg.type === 'bye') window.close();
    });
    Bus.send('hello', {});

    const wake = () => {
      if (unlocked) return;
      unlocked = true;
      $('tvWake').classList.add('gone');
      Sound.unlock();
      if (S) cue();
    };
    $('tvWake').addEventListener('click', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('touchstart', wake);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    });
    document.addEventListener('fullscreenchange', () => {
      $('tvFoot').style.visibility = document.fullscreenElement ? 'hidden' : '';
    });
    $('tvFoot').textContent = 'F for fullscreen';

    try {
      const cached = localStorage.getItem('killer-tv:state');
      if (cached) apply(JSON.parse(cached), true);
    } catch (e) { /* ignore */ }

    frame();
  }

  function apply(state, quiet) {
    S = state;
    Sound.setEnabled(!!S.settings.sfx);
    Narrator.setEnabled(true);
    Narrator.setSay(S.settings.say);
    Narrator.setVoice(S.settings.voice || '');

    const key = [S.phase, S.round, S.step, S.deaths.join(','), S.hunter, S.revotes].join('|');
    const moved = key !== mark;
    mark = quiet ? '' : key;

    if (moved && S.phase === 'dawn') revealAt = Date.now() + 2600;
    draw();
    if (moved && !quiet) cue();
  }

  /* ---------- sound ---------- */

  function cue() {
    Narrator.stop();
    switch (S.phase) {
      case 'rules':
      case 'story':
        Sound.play('tap');
        break;
      case 'night': {
        const b = S.night[S.step];
        if (!b) break;
        Sound.play('step');
        Narrator.speak(S.step === 0 ? ['eyes_shut', 'call_' + b.role] : ['sleep', 'call_' + b.role]);
        break;
      }
      case 'dawn':
        Sound.play(S.deaths.length ? 'dead' : 'dawn');
        Narrator.speak(['eyes_open', S.deaths.length ? 'died' : 'survived']);
        break;
      case 'hunter':
        Sound.play('dead');
        break;
      case 'day':
        Sound.play('dawn');
        Narrator.speak('talk');
        break;
      case 'vote':
        Sound.play('vote');
        Narrator.speak('vote');
        break;
      case 'verdict':
        Sound.play(S.deaths.length ? 'dead' : 'vote');
        Narrator.speak(S.deaths.length ? 'hanged' : 'no_majority');
        break;
      case 'over':
        Sound.play('win');
        Narrator.speak(S.result.line);
        break;
    }
  }

  /* ---------- drawing ---------- */

  function paint(o) {
    $('tv').dataset.day = DAY.indexOf(S.phase) !== -1 || (S.phase === 'over' && S.result.team === 'town') ? '1' : '0';
    $('tvEyebrow').textContent = o.eyebrow || '';
    $('tvTitle').textContent = o.title || '';
    $('tvTitle').className = 'tv-title' + (o.small ? ' sm' : '');
    $('tvBody').textContent = o.body || '';
    $('tvBody').className = 'tv-body' + (o.lead ? ' lead' : '');
  }

  function draw() {
    if (!S) return;
    $('tvClockWrap').hidden = !S.timer.total;
    $('tvPeople').hidden = true;
    $('tvTeams').hidden = true;
    $('tvSteps').hidden = true;

    switch (S.phase) {
      case 'rules': {
        const r = RULES[S.step];
        paint({ eyebrow: 'How to play · ' + (S.step + 1) + ' of ' + RULES.length, title: r.title, body: r.body, small: true, lead: true });
        break;
      }

      case 'story': {
        const t = STORY[S.step];
        paint({ eyebrow: 'Before we start', title: t.title, body: t.body, small: true, lead: true });
        break;
      }

      case 'night': {
        const b = S.night[S.step];
        if (!b) break;
        const beat = NIGHT.find((x) => x.role === b.role);
        paint({ eyebrow: 'Night ' + S.round, title: ROLES[b.role].name, body: beat ? beat.say : '', lead: true });
        steps();
        break;
      }

      case 'dawn': {
        if (!S.deaths.length) {
          paint({ eyebrow: 'Dawn', title: 'Everyone survived', body: lineText('survived'), small: true });
          break;
        }
        if (Date.now() < revealAt) {
          paint({ eyebrow: 'Dawn', title: 'The town wakes up…', small: true });
        } else {
          paint({ eyebrow: 'Dawn', title: nameOf(S, S.deaths[0]), body: reveal(S, S.deaths[0]).text, lead: true });
          people(S.deaths);
        }
        break;
      }

      case 'hunter':
        paint({ eyebrow: 'One shot left', title: nameOf(S, S.hunter), body: 'The Hunter is taking somebody with them.', lead: true });
        break;

      case 'day':
        paint({ eyebrow: 'Day ' + S.round, title: 'Talk it out', body: lineText('talk') });
        break;

      case 'vote':
        paint({
          eyebrow: S.revoted ? 'Day ' + S.round + ' · tied, vote again' : 'Day ' + S.round,
          title: 'Point at who you want gone',
          body: S.revoted ? 'Nobody had a majority.' : lineText('vote'),
        });
        break;

      case 'verdict':
        if (S.deaths.length) {
          paint({ eyebrow: 'Voted out', title: nameOf(S, S.deaths[0]), body: reveal(S, S.deaths[0]).text, lead: true });
          people(S.deaths);
        } else {
          paint({ eyebrow: 'The vote', title: 'Nobody is going', body: lineText('no_majority'), small: true });
        }
        break;

      case 'over': result(); break;

      default:
        paint({ title: 'The Killer TV', body: 'Waiting for the remote…' });
    }
  }

  function steps() {
    const box = $('tvSteps');
    box.hidden = false;
    box.innerHTML = S.night.map((b, i) =>
      '<span class="' + (i < S.step ? 'done' : i === S.step ? 'now' : '') + '"></span>').join('');
  }

  function people(dead) {
    const box = $('tvPeople');
    box.hidden = false;
    box.innerHTML = S.players.map((p) => {
      const isDead = dead.indexOf(p.id) !== -1;
      const cls = isDead ? 'dead' : (p.alive ? '' : 'out');
      return '<div class="tv-person ' + cls + '"><b>' + esc(p.name) + '</b></div>';
    }).join('');
  }

  function result() {
    const r = S.result;
    paint({ eyebrow: 'After ' + S.round + (S.round === 1 ? ' night' : ' nights'), title: r.headline, small: true });

    $('tvTeams').hidden = false;
    $('tvTeams').innerHTML = '<span class="tv-team">' + teamName(r.team) + '</span>';

    const box = $('tvPeople');
    box.hidden = false;
    box.innerHTML = S.players.map((p) => {
      const won = r.winners.indexOf(p.id) !== -1;
      return '<div class="tv-person ' + (p.alive ? '' : 'out') + (won ? ' win' : '') + '">' +
        '<b>' + esc(p.name) + '</b><i>' + ROLES[p.role].name + '</i></div>';
    }).join('');
  }

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- per-frame: the clock, and the dawn reveal ---------- */

  function frame() {
    requestAnimationFrame(frame);
    if (!S) return;

    if (S.phase === 'dawn' && revealAt && Date.now() >= revealAt && Date.now() < revealAt + 120) draw();

    if (!S.timer.total) return;
    const ms = timeLeft(S.timer);
    const low = ms <= 15000;
    $('tvClock').textContent = clock(ms);
    $('tvClock').classList.toggle('low', low);
    $('tvTrack').style.width = Math.max(0, Math.min(100, (ms / S.timer.total) * 100)) + '%';

    const sec = Math.ceil(ms / 1000);
    if (S.timer.running && sec !== lastTick && sec <= 5 && sec > 0) {
      lastTick = sec;
      Sound.play('tap');
    }
  }

  return { mount: mount };
})();
