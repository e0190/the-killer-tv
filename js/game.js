/* the killer tv — state and rulebook.
   The remote owns this object outright. The TV only ever renders a copy. */

function newGame() {
  return {
    v: 2,
    phase: 'opening',
    round: 1,
    players: [],            // {id, name, role, startRole, alive, diedRound, diedBy}
    nightBeats: [],         // role beats for the night now running
    beatIndex: 0,
    pendingKill: null,      // who the wolves chose, resolves at dawn
    seerAnswer: null,       // {targetId, isWolf} — moderator's eyes only
    nightLog: [],           // what actually happened, for the debrief
    votes: {},
    lastDeaths: [],         // ids that died in the beat just resolved
    lastCause: '',          // 'wolves' | 'vote' | 'hunter'
    hunterPending: null,    // a hunter died and owes the village a bullet
    firstNightDone: false,
    result: null,
    timer: { total: 0, remaining: 0, endsAt: 0, running: false },
    settings: {
      dayMs: 5 * 60 * 1000,
      revealMode: 'full',   // 'full' = say the role, 'wolf' = only wolf or not
      narration: true,
      sfx: true,
      voiceName: '',
    },
  };
}

/* ---------- lookups ---------- */

const byId = (s, id) => s.players.find((p) => p.id === id) || null;
const nameOf = (s, id) => { const p = byId(s, id); return p ? p.name : '—'; };
const alive = (s) => s.players.filter((p) => p.alive);
const aliveWith = (s, role) => alive(s).filter((p) => p.role === role);
const isWolf = (s, id) => { const p = byId(s, id); return !!p && p.role === 'werewolf'; };

/* ---------- timers ---------- */

function fmtClock(ms) {
  if (ms < 0) ms = 0;
  const total = Math.ceil(ms / 1000);
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

function timerRemaining(t) {
  if (!t) return 0;
  return t.running ? Math.max(0, t.endsAt - Date.now()) : t.remaining;
}

/* ---------- building a night ---------- */

/* A role only wakes if somebody still breathing is holding it. */
function buildNight(state) {
  return NIGHT_ORDER
    .filter((beat) => aliveWith(state, beat.role).length > 0)
    .map((beat) => Object.assign({}, beat, { done: false, targets: [] }));
}

/* ---------- night actions ---------- */

function applyCopy(state, actorId, targetId) {
  const a = byId(state, actorId), t = byId(state, targetId);
  if (!a || !t) return;
  a.role = t.role;
  state.nightLog.push(nameOf(state, actorId) + ' copied ' + nameOf(state, targetId) + ' and is now the ' + ROLES[a.role].name + '.');
}

function applySteal(state, actorId, targetId) {
  const a = byId(state, actorId), t = byId(state, targetId);
  if (!a || !t) return;
  const tmp = a.role;
  a.role = t.role;
  t.role = tmp;
  state.nightLog.push(nameOf(state, actorId) + ' robbed ' + nameOf(state, targetId) +
    ' — they are now the ' + ROLES[a.role].name + ' and ' + ROLES[t.role].name + '.');
}

function applySwap(state, aId, bId) {
  const a = byId(state, aId), b = byId(state, bId);
  if (!a || !b) return;
  const tmp = a.role;
  a.role = b.role;
  b.role = tmp;
  state.nightLog.push(nameOf(state, aId) + ' and ' + nameOf(state, bId) + ' were swapped without being told.');
}

function applyLook(state, targetId) {
  const wolf = isWolf(state, targetId);
  state.seerAnswer = { targetId: targetId, isWolf: wolf };
  state.nightLog.push('The Seer looked at ' + nameOf(state, targetId) + ' — ' + (wolf ? 'a wolf.' : 'not a wolf.'));
  return wolf;
}

/* ---------- killing ---------- */

function kill(state, id, cause) {
  const p = byId(state, id);
  if (!p || !p.alive) return false;
  p.alive = false;
  p.diedRound = state.round;
  p.diedBy = cause;
  return true;
}

/* What the village is told about a corpse. */
function deathReveal(state, id) {
  const p = byId(state, id);
  if (!p) return { text: '', line: '' };
  if (state.settings.revealMode === 'wolf') {
    return p.role === 'werewolf'
      ? { text: 'A WEREWOLF', line: 'reveal_wolf', wolf: true }
      : { text: 'NOT A WEREWOLF', line: 'reveal_notwolf', wolf: false };
  }
  return { text: ROLES[p.role].name.toUpperCase(), line: 'reveal_' + p.role, wolf: p.role === 'werewolf' };
}

/* ---------- votes ---------- */

function tallyVotes(state) {
  const counts = {};
  alive(state).forEach((p) => { counts[p.id] = 0; });
  alive(state).forEach((p) => {
    const t = state.votes[p.id];
    if (t && counts.hasOwnProperty(t)) counts[t]++;
  });
  return counts;
}

/* Most votes swings. A tie means the village bottled it and nobody dies. */
function voteOutcome(state) {
  const counts = tallyVotes(state);
  let max = 0;
  Object.keys(counts).forEach((id) => { if (counts[id] > max) max = counts[id]; });
  if (max === 0) return { id: null, counts: counts, tied: false };
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  if (top.length > 1) return { id: null, counts: counts, tied: true };
  return { id: top[0], counts: counts, tied: false };
}

/* ---------- endings ---------- */

/* Three ways out, checked in this order:
     1. the tanner dies — tanner wins, everyone else went to a lot of trouble for nothing
     2. no wolves left standing — the village wins
     3. the wolves have it down to one last villager — the wolves win  */
function checkEnd(state) {
  const tanner = state.players.find((p) => p.role === 'tanner');
  if (tanner && !tanner.alive) {
    return finish(state, 'tanner', 'THE TANNER WINS', 'win_tanner', 'tanner_win');
  }

  const wolves = aliveWith(state, 'werewolf');
  if (wolves.length === 0) {
    return finish(state, 'village', 'THE VILLAGE WINS', 'win_village', 'village_win');
  }

  const others = alive(state).filter((p) => p.role !== 'werewolf');
  if (others.length <= 1) {
    return finish(state, 'wolves', 'THE WOLVES WIN', 'win_wolves', 'wolves_win');
  }

  return null;
}

function finish(state, team, headline, line, scene) {
  const winners = state.players.filter((p) => ROLES[p.role] && ROLES[p.role].team === team).map((p) => p.id);
  return { team: team, headline: headline, line: line, scene: scene, winners: winners };
}

function teamLabel(team) {
  return { village: 'The Village', wolves: 'The Wolves', tanner: 'The Tanner' }[team] || team;
}
