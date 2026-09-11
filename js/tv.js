/* the killer tv — the big screen.

   Renders whatever the remote sends. Holds no game logic: it never decides who
   dies, only how loudly it says so.

   Every size is a percentage of the screen's own width, so 1280×720 and
   3840×2160 are the same design at two magnifications — no breakpoint, no
   second layout, nothing that reflows. A line that breaks after "Seer," breaks
   there on every panel in every house. All of it sits inside a 6% margin, so a
   television still cropping the edges loses nothing.

   No names ever appear here. The television speaks in roles; the room supplies
   the names out loud. That one rule is what keeps the screen short enough to
   read from the doorway. */

const TV = (function () {
  const $ = (id) => document.getElementById(id);
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
               'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
  const WORDS = ['Nobody', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
                 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  const ord = (n) => ORD[n] || String(n);
  const word = (n) => WORDS[n] || String(n);

  let S = null;
  let mark = '';
  let unlocked = false;
  let lastTick = -1;
  let revealed = true;                 // dawn holds the body back for a beat
  let revealTimer = null;

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

    setInterval(paintClock, 200);   // four ticks a second is plenty for a clock
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

    /* The cut to paper lands on the empty morning frame, not on the body. For
       two or three seconds the television is a bright blank page with one word
       on it — the room exhales, somebody laughs, and only then does it say what
       was lost. A timer rather than a render loop, because rAF stops dead in a
       background tab and the reveal would never land. */
    if (moved) {
      clearTimeout(revealTimer);
      revealed = !(S.phase === 'dawn' && S.deaths.length);
      if (!revealed) revealTimer = setTimeout(() => { revealed = true; draw(); }, 2800);
    }
    draw();
    if (moved && !quiet) cue();
  }

  /* ---------- sound ---------- */

  function cue() {
    Narrator.stop();
    switch (S.phase) {
      case 'rules':
        Sound.play('tap');
        break;
      case 'story':
        Sound.play('tap');
        Narrator.speak(STORY[S.step].id);
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

  /* ---------- drawing ----------

     One helper paints all of it: the overline along the top, the one big thing
     in the middle, and the quiet line along the bottom. */

  function frame(o) {
    $('tv').dataset.face = o.night ? 'night' : 'day';
    $('tvOverL').textContent = o.left || '';
    $('tvOverR').innerHTML = o.right || '';
    $('tvMid').className = 'tv-mid' + (o.centre ? ' centre' : '');
    $('tvMid').innerHTML = o.mid || '';
    $('tvUnder').textContent = o.under || '';
  }

  const isNight = () => DAY.indexOf(S.phase) === -1;
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function draw() {
    if (!S) return;

    switch (S.phase) {
      case 'rules': {
        const r = RULES[S.step];
        frame({
          night: true, left: 'How to play',
          right: '<span class="tv-steps">' + RULES.map((x, i) =>
            '<span class="' + (i < S.step ? 'done' : i === S.step ? 'now' : '') + '"></span>').join('') + '</span>',
          mid: '<div class="tv-h mid">' + esc(r.title) + '</div><div class="tv-hair"></div>',
          under: r.body,
        });
        break;
      }

      case 'story': {
        const t = STORY[S.step];
        frame({
          night: true, left: 'Before we start', right: ord(S.step + 1),
          mid: '<div class="tv-h mid">' + esc(t.title) + '</div><div class="tv-hair"></div>',
          under: lineText(t.id),
        });
        break;
      }

      /* An instruction to the room, not a status. Four words carry it, so the
         screen holds one idea and the host's voice carries the rest. */
      case 'night': {
        const b = S.night[S.step];
        if (!b) break;
        const beat = NIGHT.find((x) => x.role === b.role);
        const said = (beat ? beat.say : '').split('. ');
        frame({
          night: true,
          left: 'Night the ' + ord(S.round),
          right: 'Everyone else, eyes closed',
          mid: '<div class="tv-h">' + esc(said[0]).replace(', ', ',<br>') + '</div><div class="tv-hair"></div>',
          under: said.slice(1).join('. '),
        });
        break;
      }

      case 'dawn': {
        if (!S.deaths.length) {
          frame({
            left: 'Day the ' + ord(S.round), right: word(living(S).length) + ' remain',
            mid: '<div class="tv-h big">Everyone<br>woke up</div>',
            under: lineText('survived'),
          });
          break;
        }
        if (!revealed) {
          frame({
            left: 'Day the ' + ord(S.round),
            centre: true, mid: '<div class="tv-h one">Morning</div>',
          });
          break;
        }
        frame({
          left: 'Day the ' + ord(S.round), right: word(living(S).length) + ' remain',
          mid: '<div class="tv-kicker">In the night, somebody died</div>' +
               '<div><span class="slab body">' + esc(reveal(S, S.deaths[0]).text) + '</span></div>' +
               '<div class="tv-h" style="font-size:11.5cqw;line-height:1;margin-top:.4cqw">is dead</div>',
          under: gone(S.deaths[0]),
        });
        break;
      }

      case 'hunter':
        frame({
          left: 'Day the ' + ord(S.round), right: 'One shot left',
          mid: '<div class="tv-kicker">The Hunter is going down</div>' +
               '<div class="tv-h mid">Not alone</div>',
          under: 'They are taking somebody with them.',
        });
        break;

      /* The track is a ruled box that fills with solid ink, not a bar with a
         colour. No accent: the clock running out is not a death. */
      case 'day':
        frame({
          left: 'Day the ' + ord(S.round), right: word(living(S).length) + ' remain',
          centre: true,
          mid: '<div class="tv-clock" id="tvClock">' + clock(timeLeft(S.timer)) + '</div>' +
               (S.timer.total ? '<div class="tv-track" style="width:44cqw"><i id="tvTrack"></i></div>' : ''),
          under: lineText('talk'),
        });
        break;

      case 'vote':
        frame({
          left: 'Day the ' + ord(S.round),
          right: S.revoted ? 'Tied · vote again' : 'The vote',
          mid: '<div class="tv-kicker">Everyone at once</div>' +
               '<div class="tv-h mid">Point at who<br>you want gone</div>',
          under: S.revoted ? 'Nobody had a majority.' : lineText('vote'),
        });
        break;

      /* Built identically to the body frame — same slab, same position, same
         rhythm. A death by vote and a death in the night look the same, because
         to the town they are the same thing. */
      case 'verdict': {
        if (!S.deaths.length) {
          frame({
            left: 'Day the ' + ord(S.round), right: 'No majority',
            mid: '<div class="tv-h mid">Nobody<br>is going</div>',
            under: lineText('no_majority'),
          });
          break;
        }
        const counts = S.tally || {};
        const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const split = top.length > 1 ? word(counts[top[0]]) + ' to ' + word(counts[top[1]]) : '';
        frame({
          left: 'Day the ' + ord(S.round),
          right: 'The vote' + (split ? ' · ' + split.toLowerCase() : ''),
          mid: '<div class="tv-kicker">The town has chosen</div>' +
               '<div class="tv-h mid">They hanged</div>' +
               '<div><span class="slab mid">' + esc(reveal(S, S.deaths[0]).text) + '</span></div>',
          under: word(living(S).length) + ' remain. Night falls again.',
        });
        break;
      }

      case 'over': ending(); break;

      default:
        frame({ night: true, left: 'The Killer TV', mid: '<div class="tv-h mid">Waiting for<br>the remote</div>' });
    }

    paintClock();   // so the clock is right the instant it appears, not a frame later
  }

  /* What was lost, said as a consequence rather than a fact. */
  function gone(id) {
    const p = byId(S, id);
    if (!p) return '';
    if (S.settings.reveal === 'team') {
      return p.role === 'killer' ? 'One fewer of them.' : 'That was one of your own.';
    }
    return {
      seer: 'Nobody sees the future now.',
      hunter: 'They did not get their shot.',
      mason: 'One of the pair is on their own now.',
      robber: 'Whatever they took, they kept.',
      troublemaker: 'Their last swap stands.',
      insomniac: 'They knew what they were, at least.',
      doppelganger: 'They died as somebody else.',
      minion: 'They served somebody to the end.',
      killer: 'One fewer of them.',
      tanner: 'That is exactly what they wanted.',
      villager: 'No power, and no luck either.',
    }[p.role] || '';
  }

  /* Each ending gets a different weight of type and a different amount of the
     page. The town's win is quiet and wide. The killers' win is the only frame
     that goes back to night after dawn — the room has been in paper light for
     minutes, and the screen going dark again is the whole message before a word
     is read. The Tanner's is half the size, centred, and entirely italic: the
     punchline, set quietly, with the room doing the rest. */
  function ending() {
    const r = S.result;
    const alive = living(S).length;
    const dead = S.players.length - alive;

    if (r.team === 'town') {
      frame({
        left: 'Day the ' + ord(S.round) + ' · the last killer is dead',
        mid: '<div class="tv-h big">The town<br>lives</div><div class="tv-rule"></div>',
        under: word(alive) + ' survived. ' + word(dead) + ' did not.',
      });
      return;
    }

    if (r.team === 'killers') {
      const k = S.players.filter((p) => p.role === 'killer').length;
      frame({
        night: true,
        left: 'Night the ' + ord(S.round) + ' · nobody woke up',
        mid: '<div><span class="slab big">The killers</span></div>' +
             '<div class="tv-h big" style="margin-top:.6cqw">have the town</div>',
        under: 'There ' + (k === 1 ? 'was one of them' : 'were ' + word(k).toLowerCase() + ' of them') + ' the whole time.',
      });
      return;
    }

    frame({
      left: '', centre: true,
      mid: '<div class="tv-wry">Well</div>' +
           '<div class="tv-wry-h">The Tanner wanted to die,<br>and you obliged.</div>' +
           '<div class="tv-wry-hair"></div>' +
           '<div class="tv-wry-b">Everybody else has lost.</div>',
    });
  }

  function paintClock() {
    if (!S || !S.timer.total || S.phase !== 'day') return;
    const el = $('tvClock');
    if (!el) return;
    const ms = timeLeft(S.timer);
    el.textContent = clock(ms);
    const track = $('tvTrack');
    if (track) track.style.width = Math.max(0, Math.min(100, (ms / S.timer.total) * 100)) + '%';

    const sec = Math.ceil(ms / 1000);
    if (S.timer.running && sec !== lastTick && sec <= 5 && sec > 0) {
      lastTick = sec;
      Sound.play('tap');
    }
  }

  return { mount: mount };
})();
