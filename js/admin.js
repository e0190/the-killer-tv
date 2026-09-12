/* the killer tv — the remote.

   Owns the game, runs the phases, and pushes a copy to the TV after every
   change. It is held in one pair of hands, in the dark, at a table of people who
   would all like a look at it — so nothing here flashes, animates or brightens,
   and the roles stay sealed until a thumb is held on them. */

const Admin = (function () {
  const $ = (id) => document.getElementById(id);
  const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
                 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
               'seventh', 'eighth', 'ninth', 'tenth'];
  const word = (n) => WORDS[n] || String(n);

  let S = null;
  let tv = null;
  let ticker = null;
  let wired = false;
  let voter = null;          // whose vote is being recorded
  let heldFrom = 0;          // when the current empty call was opened
  let desk = false;          // laptop layout: rail down the side, keys for everything

  /* Which of the two moderator screens this device gets. A fine pointer on a
     wide screen is a laptop on a table; anything else is a phone in a hand, and
     a phone in a hand is the safer of the two for a screen full of secrets. */
  const deskQuery = window.matchMedia('(min-width:900px) and (pointer:fine)');

  function setUi() {
    desk = deskQuery.matches;
    document.body.dataset.ui = desk ? 'desktop' : 'phone';
    /* On a laptop the rail is always on screen and always sealed; on a phone it
       is a screen of its own that only exists while held. */
    $('admRail').hidden = !desk;
    if (desk && S) drawRail(true);
  }

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
    setUi();

    Link.start('admin', (up) => {
      $('admWhen').dataset.link = up ? 'on' : 'off';
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
    if (!tv) return;
    Bus.setPeer(tv);
    try { tv.focus(); } catch (e) {}
    setTimeout(push, 400);
  }

  function wire() {
    $('admNext').addEventListener('click', next);
    $('admBack').addEventListener('click', back);
    $('reopenTv').addEventListener('click', openTvWindow);
    $('quit').addEventListener('click', quit);

    /* Every action carries its key, so the host can run a whole night without
       looking down — which is the actual fix for a screen everybody can see. */
    document.addEventListener('keydown', (e) => {
      if (document.body.dataset.view !== 'admin') return;
      if (e.target.matches('input,select,textarea')) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.code === 'Backspace' || e.code === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'r' || e.key === 'R') { if (!e.repeat) openRail(); }
      else if (/^[1-9]$/.test(e.key)) hitKey(Number(e.key));
      else if (e.key === '0') hitKey(10);
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'r' || e.key === 'R') sealRail();
    });

    /* Press and hold to read the roles; let go and it seals. No timeout to
       forget about, and no state in which the screen is dangerous lying down. */
    const hold = (el) => {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); openRail(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
        el.addEventListener(ev, sealRail));
    };
    hold($('admRosterBar'));
    hold($('admRail'));
    window.addEventListener('blur', sealRail);
    deskQuery.addEventListener('change', () => { setUi(); draw(); });

    Bus.on((msg) => { if (msg.type === 'hello') push(); });
    window.addEventListener('beforeunload', () => {
      try { if (tv && !tv.closed) tv.close(); } catch (e) {}
    });
  }

  /* A number key is the same as tapping that name. Numbering follows the seats,
     and the dead keep their number so nothing shifts under the host's fingers. */
  function hitKey(n) {
    const p = S && S.players[n - 1];
    if (!p) return;
    const btn = $('admBody').querySelector('.pick[data-id="' + p.id + '"]:not([disabled])');
    if (btn) btn.click();
  }

  function openRail() {
    if (!S) return;
    drawRail(false);
    $('admRail').hidden = false;
    $('rosterHint').textContent = 'Let go to seal';
  }
  function sealRail() {
    if (desk) drawRail(true);
    else $('admRail').hidden = true;
    $('rosterHint').textContent = 'Press and hold';
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
    Sound.play('tap'); push(); draw();
  }

  function tick() {
    if (!S) return;
    const now = new Date();
    $('admTime').textContent = now.getHours() + '.' + String(now.getMinutes()).padStart(2, '0');

    if (S.phase === 'day') {
      const el = document.querySelector('.ph-clock');
      if (el) el.textContent = clock(timeLeft(S.timer));
    }
    /* The held counter on an empty call: the screen never says the role is
       dead, it says how long you have waited. */
    const held = document.querySelector('.held');
    if (held) paintHeld(held);

    if (S.timer.running && timeLeft(S.timer) <= 0) {
      S.timer.running = false;
      if (S.phase === 'day') next();
    }
  }

  function paintHeld(box) {
    const secs = Math.min(8, Math.floor((Date.now() - heldFrom) / 1000));
    box.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i < secs));
    box.querySelector('em').textContent = !secs ? 'just opened'
      : secs === 1 ? 'one second held'
      : word(secs) + ' seconds held';
  }

  /* ---------- phases ---------- */

  function startNight() {
    S.phase = 'night';
    S.step = 0;
    S.night = buildNight(S);
    S.pendingKill = null;
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
        if (S.step < S.night.length - 1) S.step++;
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
        voter = null;
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
          voter = null;
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
        if (S.step > 0) { S.step--; break; }
        if (S.settings.showStory) { S.phase = 'story'; S.step = STORY.length - 1; }
        else if (S.settings.showRules) { S.phase = 'rules'; S.step = RULES.length - 1; }
        else return;
        break;
      }
      case 'day': S.phase = 'dawn'; startTimer(0); break;
      case 'vote': S.phase = 'day'; voter = null; startTimer(S.settings.dayMs); break;
      default: return;
    }
    push();
    draw();
  }

  /* ---------- drawing ---------- */

  function draw() {
    const when = S.phase === 'night' || S.phase === 'dawn'
      ? 'Night ' + word(S.round)
      : 'Day ' + word(S.round);
    $('admWhen').textContent = S.phase === 'over' ? 'Finished' : when;

    $('admNext').disabled = false;
    $('admNext').textContent = 'Next';
    $('admBack').hidden = false;

    switch (S.phase) {
      case 'rules':   drawSheet(RULES[S.step], 'How to play', RULES.length); break;
      case 'story':   drawSheet(STORY[S.step], 'Before we start', STORY.length, true); break;
      case 'night':   drawBeat(); break;
      case 'dawn':    drawDeath('The night is over', 'Say who it was out loud.'); break;
      case 'hunter':  drawHunter(); break;
      case 'day':     drawDay(); break;
      case 'vote':    drawVote(); break;
      case 'verdict': drawDeath('The town has spoken', 'Say the name out loud, then turn their card over.'); break;
      case 'over':    drawOver(); break;
    }
  }

  function head(html) { $('admHead').innerHTML = html; }
  function body(html) { $('admBody').innerHTML = html; }

  function drawSheet(item, kicker, total, narrated) {
    head(
      '<div class="ph-call"><span>' + kicker + '</span><span>' +
      (S.step + 1) + ' of ' + total + '</span></div>' +
      '<div class="ph-script">' + esc(item.title) + '</div>');
    body(
      '<div class="ph-pad"><div class="ph-box">' +
        '<div class="k">' + (narrated ? 'The television reads this' : 'On the screen') + '</div>' +
        '<div class="t">' + esc(narrated ? lineText(item.id) : item.body) + '</div>' +
      '</div></div>');
    $('admNext').textContent = S.step === total - 1 ? 'Begin' : 'Next';
  }

  function drawBeat() {
    const b = beatOf(S);
    if (!b) return;
    const role = ROLES[b.role];
    const beat = NIGHT.find((x) => x.role === b.role);
    const holders = livingWith(S, b.role);

    head(
      '<div class="ph-call"><span>Call ' + word(S.step + 1) + ' of ' + word(S.night.length) +
      '</span><span>' + esc(role.name) + '</span></div>' +
      '<div class="ph-script">' + esc(beat.say) + '</div>' +
      '<div class="ph-sub">' + (b.empty
        ? 'Read it exactly as written. Wait. Then read the next line.'
        : beatNeedsInput(b)
          ? 'Read it aloud, then tap who they pointed at.'
          : 'Read it aloud, then do the cards.') + '</div>');

    /* An empty call is a bluff and the screen never says so. It gives a stage
       direction — how long to wait — rather than a spoiler, so the host reads an
       instruction instead of keeping a secret, and their face has nothing to
       hide. A call that gets skipped is a call the room can count. */
    if (b.empty) {
      heldFrom = Date.now();
      body(
        '<div class="ph-pad"><div class="ph-box">' +
          '<div class="k">Nothing to tap</div>' +
          '<div class="t">Nobody will move. Reach for the deck, give it the same seven or eight ' +
            'seconds you gave the last call, then close it.</div>' +
          '<div class="u">A call that gets skipped is a call the room can count. The pause is the point.</div>' +
        '</div>' +
        '<div class="held">' + new Array(8).fill('<span></span>').join('') + '<em>nothing held</em></div>' +
        '</div>');
      paintHeld(document.querySelector('.held'));
      return;
    }

    if (!beatNeedsInput(b)) {
      const stale = living(S).filter(cardStale);
      body(
        '<div class="ph-pad"><div class="ph-box">' +
          '<div class="k">The cards</div>' +
          '<div class="t">' + esc(beat.card) + '</div>' +
          '<div class="u">' + esc(holders.length > 1
            ? holders.map((p) => p.name).join(' and ') + ' are awake.'
            : holders.map((p) => p.name).join('') + ' is awake.') +
            (b.role === 'seer' && stale.length
              ? ' If they point at ' + esc(stale.map((p) => p.name).join(' or ')) +
                ', that card is out of date — hold it up anyway.'
              : '') +
          '</div>' +
        '</div></div>');
      return;
    }

    const actor = actorOf(S, b);
    const others = (skip) => living(S).filter((p) => skip.indexOf(p.id) === -1).map((p) => p.id);
    const set = (sel, need) => {
      if (sel.length === need) applyBeat(S, b, sel);
      else { undoBeat(S, b); b.targets = sel; }
      push(); draw();
    };

    let ids, need = 1, note = '';
    if (b.input === 'kill') {
      ids = living(S).filter((p) => p.role !== 'killer').map((p) => p.id);
    } else if (b.input === 'swap') {
      ids = others([actor]); need = 2;
      note = 'Two names. Swap those two cards over once you have them.';
    } else {
      ids = others([actor]);
      note = b.input === 'steal' ? 'Then swap the two cards over.' : 'Then show them that card.';
    }

    body('<div class="ph-pad">' + picks(ids, b.targets) + deadNote() +
      (note ? '<div class="ph-note">' + note + '</div>' : '') + '</div>');

    $('admBody').querySelectorAll('.pick:not(.off):not(.dead)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const sel = b.targets.slice();
        const at = sel.indexOf(id);
        if (at !== -1) sel.splice(at, 1);
        else { sel.push(id); while (sel.length > need) sel.shift(); }
        Sound.play('tap');
        set(sel, need);
      });
    });

    $('admNext').disabled = !b.done;
    if (!b.done) $('admNext').textContent = need === 2 ? 'Pick two' : 'Pick a name';
  }

  /* Everyone is drawn, always, in the order they were dealt. Taking the dead out
     would redraw the board every night and cost the host a second hunting for a
     name that moved. */
  function picks(ids, chosen) {
    return '<div class="picks">' + S.players.map((p) => {
      const can = ids.indexOf(p.id) !== -1;
      const cls = can ? '' : (p.alive ? ' off' : ' dead');
      return '<button type="button" class="pick' + cls + '" data-id="' + p.id +
        '" aria-pressed="' + (chosen.indexOf(p.id) !== -1) + '"' + (can ? '' : ' disabled') + '>' +
        (p.alive ? esc(p.name) : '<b>' + esc(p.name) + '</b>') + '</button>';
    }).join('') + '</div>';
  }

  function deadNote() {
    const gone = S.players.filter((p) => !p.alive);
    if (!gone.length) return '';
    return '<div class="ph-note">' + esc(gone.map((p) => p.name).join(', ')) +
      (gone.length === 1 ? ' is dead and cannot be seen.' : ' are dead and cannot be seen.') + '</div>';
  }

  function drawDeath(kicker, sub) {
    const dead = S.deaths.length ? byId(S, S.deaths[0]) : null;
    head('<div class="ph-call"><span>' + kicker + '</span><span>' +
      word(living(S).length) + ' left</span></div>' +
      '<div class="ph-script">' + (dead ? esc(dead.name) + ' is dead' : 'Nobody died') + '</div>' +
      '<div class="ph-sub">' + (dead ? sub : 'The killers came up empty.') + '</div>');

    body('<div class="ph-pad"><div class="ph-box">' +
      '<div class="k">The television is showing</div>' +
      '<div class="t">' + (dead ? esc(reveal(S, dead.id).text) : 'Everyone survived') + '</div>' +
      (dead ? '<div class="u">Their card comes off the table. Everything else stays where it is.</div>' : '') +
      '</div></div>');

    $('admNext').textContent = S.phase === 'dawn' ? 'Start the day' : 'Nightfall';
  }

  function drawHunter() {
    head('<div class="ph-call"><span>One shot left</span><span>The Hunter</span></div>' +
      '<div class="ph-script">' + esc(nameOf(S, S.hunter)) + ' takes somebody with them</div>' +
      '<div class="ph-sub">Ask them out loud, then tap the name.</div>');

    body('<div class="ph-pad">' +
      picks(living(S).filter((p) => p.id !== S.hunter).map((p) => p.id),
        S.hunterTarget ? [S.hunterTarget] : []) + deadNote() + '</div>');

    $('admBody').querySelectorAll('.pick:not(.off):not(.dead)').forEach((btn) => {
      btn.addEventListener('click', () => {
        S.hunterTarget = S.hunterTarget === btn.dataset.id ? null : btn.dataset.id;
        Sound.play('tap');
        push(); draw();
      });
    });

    $('admNext').disabled = !S.hunterTarget;
    $('admNext').textContent = S.hunterTarget ? 'Fire' : 'Pick a name';
  }

  /* The one screen the host does not have to read: the clock is already on the
     television, so this is just somewhere to put a thumb. */
  function drawDay() {
    head('<div class="ph-call"><span>The town is arguing</span></div>');
    body(
      '<div class="ph-mid">' +
        '<div class="ph-clock">' + clock(timeLeft(S.timer)) + '</div>' +
        '<div class="ph-of">' + (S.timer.total ? 'of ' + word(Math.round(S.timer.total / 60000)) + ' minutes' : 'no clock') + '</div>' +
        (S.timer.total
          ? '<div class="ph-two">' +
              '<button type="button" id="admPause">' + (S.timer.running ? 'Pause' : 'Resume') + '</button>' +
              '<button type="button" id="admPlus">+30s</button>' +
            '</div>'
          : '') +
        '<div class="ph-foot-note">The television is showing the same clock. ' +
          word(living(S).length) + ' remain.</div>' +
      '</div>');

    if (S.timer.total) {
      $('admPause').addEventListener('click', togglePause);
      $('admPlus').addEventListener('click', () => addTime(30000));
    }
    $('admNext').textContent = 'Call the vote';
  }

  /* Go round the table: tap a name, then tap who they pointed at. The button is
     the counter — it carries the number still missing rather than a separate
     progress line, and it only becomes a button when that number reaches zero. */
  function drawVote() {
    const alive = living(S);
    const short = alive.filter((p) => !S.votes[p.id]);

    head(
      '<div class="ph-title">' + (S.revoted ? 'Tied. Everyone votes again.' : 'Who did each of them accuse?') + '</div>' +
      '<div class="ph-sub">Go round the table. Tap a name, then tap who they pointed at.</div>');

    /* The list is the screen. Tapping a name opens the grid for that one
       person, and recording their answer drops straight back to the list, so
       the host's eye returns to the same place every time. */
    if (voter) {
      const me = byId(S, voter);
      body('<div class="ph-pad">' +
        '<div class="ph-call"><span>' + esc(me.name) + ' points at</span>' +
        '<button type="button" id="voteSkip">Back</button></div>' +
        '<div style="height:14px"></div>' +
        picks(alive.filter((p) => p.id !== voter).map((p) => p.id),
          S.votes[voter] ? [S.votes[voter]] : []) +
        '</div>');
      $('voteSkip').addEventListener('click', () => { voter = null; draw(); });
      $('admBody').querySelectorAll('.pick:not(.off):not(.dead)').forEach((btn) => {
        btn.addEventListener('click', () => {
          S.votes[voter] = btn.dataset.id;
          Sound.play('tap');
          voter = null;
          push(); draw();
        });
      });
    } else {
      body(alive.map((p) => {
        const t = S.votes[p.id];
        return '<div class="vote-row" data-voter="' + p.id + '">' +
          '<span class="who">' + esc(p.name) + '</span>' +
          '<span class="to' + (t ? '' : ' waiting') + '">' + (t ? esc(nameOf(S, t)) : 'Waiting') + '</span>' +
        '</div>';
      }).join(''));
      $('admBody').querySelectorAll('.vote-row').forEach((row) => {
        row.addEventListener('click', () => { voter = row.dataset.voter; draw(); });
      });
    }

    $('admNext').disabled = short.length > 0;
    $('admNext').textContent = short.length
      ? word(short.length) + (short.length === 1 ? ' still to vote' : ' still to vote')
      : 'Lock it in';
  }

  function drawOver() {
    const r = S.result;
    head('<div class="ph-call"><span>After ' + word(S.round) +
      (S.round === 1 ? ' night' : ' nights') + '</span></div>' +
      '<div class="ph-script">' + esc(r.headline) + '</div>');

    body('<div class="ph-pad">' + S.players.map((p) => {
      const won = r.winners.indexOf(p.id) !== -1;
      const changed = p.role !== p.startRole;
      return '<div class="rail-row' + (p.alive ? '' : ' out') + '">' +
        '<span class="role">' + ROLES[p.role].name + '</span>' +
        '<span class="name">' + (won ? '· ' : '') + esc(p.name) +
          (changed ? ' <i style="opacity:.6;font-size:13px">began as ' + ROLES[p.startRole].name + '</i>' : '') +
        '</span></div>';
    }).join('') +
      '<div style="display:flex;gap:10px;margin-top:20px">' +
        '<button type="button" class="ph-back" style="flex:1" id="again">Again</button>' +
        '<button type="button" class="ph-back" style="flex:1" id="toSetup">Setup</button>' +
      '</div></div>');

    $('again').addEventListener('click', playAgain);
    $('toSetup').addEventListener('click', quit);
    $('admNext').disabled = true;
    $('admNext').textContent = 'Finished';
    $('admBack').hidden = true;
  }

  function playAgain() {
    const fresh = newGame();
    fresh.settings = S.settings;
    fresh.players = S.players.map((p) => ({
      id: p.id, name: p.name, role: p.startRole, card: p.startRole, startRole: p.startRole,
      alive: true, diedRound: 0, diedBy: '',
    }));
    fresh.phase = fresh.settings.showRules ? 'rules' : (fresh.settings.showStory ? 'story' : null);
    boot(fresh, !tv || tv.closed);
  }

  /* Names stay put; only the left column changes. Nothing moves, so the host's
     eye already knows where the answer is going to appear. */
  function drawRail(sealed) {
    $('admRail').innerHTML =
      '<div class="rail-head"><b>' + (desk ? 'Roster' : 'The roster') + '</b><span>' +
        (desk ? (sealed ? 'Hold R' : 'Let go') : word(living(S).length) + ' alive') + '</span></div>' +
      '<div class="rail-list' + (sealed ? ' sealed' : '') + '">' + S.players.map((p) =>
        '<div class="rail-row' + (p.alive ? '' : ' out') + '">' +
          '<span class="role">' + ROLES[p.role].name + '</span>' +
          '<span class="name">' + esc(p.name) + '</span>' +
          (!sealed && cardStale(p)
            ? '<span class="role" style="flex:none;opacity:.6">card: ' + ROLES[p.card].name + '</span>'
            : '') +
        '</div>').join('') + '</div>' +
      (desk ? '' :
        '<div class="rail-foot"><div class="rail-seal">' +
          '<span class="sq"></span><p>Open. Let go.</p></div></div>');
  }

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { launch: launch, resume: resume };
})();
