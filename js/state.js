/* the killer tv — game state and the rulebook.

   The remote owns this object and broadcasts a copy to the TV after every
   change. Everything here is a plain function over state so it can be reasoned
   about, and tested, without a browser. */

const PHASES = ['rules', 'story', 'night', 'dawn', 'day', 'vote', 'verdict', 'over'];

function newGame() {
  return {
    v: 3,
    phase: 'rules',
    step: 0,              // index within rules / story / the night
    round: 1,

    players: [],          // {id, name, role, startRole, alive, diedRound, diedBy}
    night: [],            // the beats running tonight
    pendingKill: null,    // the killers' pick, resolved at dawn
    seerAnswer: null,     // {targetId, role} — moderator's eyes only
    log: [],              // what actually happened, for the debrief

    votes: {},            // voterId -> targetId
    tally: {},
    revotes: 0,
    revoted: false,

    deaths: [],           // who died in the beat just resolved
    cause: '',            // 'killers' | 'vote' | 'hunter'

    hunter: null,         // a hunter died and owes a shot
    hunterTarget: null,
    hunterNext: '',
    hunterDone: {},

    result: null,
    timer: { total: 0, left: 0, endsAt: 0, running: false },

    settings: {
      dayMs: 5 * 60 * 1000,
      reveal: 'role',     // 'role' = say what they were, 'team' = killer or not
      showRules: true,
      showStory: true,
      say: { story: true, night: true, deaths: true, day: true, endings: true },
      sfx: true,
      voice: '',
      openAs: 'window',   // where the TV goes: 'window' or 'tab'
    },
  };
}

/* ---------- lookups ---------- */

const byId = (s, id) => s.players.find((p) => p.id === id) || null;
const nameOf = (s, id) => { const p = byId(s, id); return p ? p.name : '—'; };
const living = (s) => s.players.filter((p) => p.alive);
const livingWith = (s, role) => living(s).filter((p) => p.role === role);

/* ---------- clock ---------- */

function clock(ms) {
  if (!(ms > 0)) ms = 0;
  const t = Math.ceil(ms / 1000);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function timeLeft(t) {
  if (!t) return 0;
  return t.running ? Math.max(0, t.endsAt - Date.now()) : t.left;
}

/* ---------- building a night ---------- */

/* Which roles get called tonight.
 *
 * When the town is told the role of every body, everyone already knows the Seer
 * is dead, so there is nothing to protect and the running order shrinks.
 *
 * When they are only told killer or not, the calls themselves become the leak:
 * skip the Seer and the table learns the Seer is gone. So every role that was
 * dealt at the start keeps being called for the rest of the game, whether or not
 * anybody is left to answer. An empty call sounds exactly like a real one. */
function buildNight(s) {
  const bluff = s.settings.reveal === 'team';
  return NIGHT
    .filter((beat) => (bluff
      ? s.players.some((p) => p.startRole === beat.role)
      : livingWith(s, beat.role).length > 0))
    .map((beat) => ({
      role: beat.role,
      input: beat.input,
      empty: livingWith(s, beat.role).length === 0,
      targets: [],
      done: false,
    }));
}

const beatOf = (s) => s.night[s.step] || null;

/* ---------- night actions ---------- */

function actorOf(s, beat) {
  const holder = livingWith(s, beat.role)[0];
  return holder ? holder.id : null;
}

/* The Doppelgänger overwrites rather than swaps, so nobody holds the role
   afterwards and it never wakes again. That is the intended behaviour and the
   call text says so out loud. */
function doCopy(s, actorId, targetId) {
  const a = byId(s, actorId), t = byId(s, targetId);
  if (!a || !t) return;
  a.role = t.role;
  s.log.push(nameOf(s, actorId) + ' copied ' + nameOf(s, targetId) + ' → ' + ROLES[a.role].name);
}

function doSwap(s, aId, bId) {
  const a = byId(s, aId), b = byId(s, bId);
  if (!a || !b) return;
  const tmp = a.role; a.role = b.role; b.role = tmp;
  s.log.push(nameOf(s, aId) + ' ↔ ' + nameOf(s, bId));
}

function doLook(s, targetId) {
  const p = byId(s, targetId);
  s.seerAnswer = { targetId: targetId, role: p ? p.role : '' };
  s.log.push('Seer saw ' + nameOf(s, targetId) + ' → ' + (p ? ROLES[p.role].name : '?'));
}

/* Applying a beat is undoable, so Back works and a misheard pick is cheap to
   fix. Swaps are their own inverse; a copy has to remember what it painted over. */
function applyBeat(s, beat, targets) {
  undoBeat(s, beat);
  beat.targets = targets.slice();
  beat.actor = actorOf(s, beat);
  /* Remember where the log was, because not every action writes to it and
     popping blindly on undo eats somebody else's entry. */
  beat.logAt = s.log.length;

  if (beat.input === 'kill') s.pendingKill = targets[0];
  else if (beat.input === 'look') doLook(s, targets[0]);
  else if (beat.input === 'copy') {
    const a = byId(s, beat.actor);
    beat.was = a ? a.role : '';
    doCopy(s, beat.actor, targets[0]);
  } else if (beat.input === 'steal') doSwap(s, beat.actor, targets[0]);
  else if (beat.input === 'swap') doSwap(s, targets[0], targets[1]);

  beat.done = true;
}

function undoBeat(s, beat) {
  if (!beat || !beat.done) return;
  if (beat.input === 'kill') s.pendingKill = null;
  else if (beat.input === 'look') s.seerAnswer = null;
  else if (beat.input === 'copy') { const a = byId(s, beat.actor); if (a) a.role = beat.was; }
  else if (beat.input === 'steal') doSwap(s, beat.actor, beat.targets[0]);
  else if (beat.input === 'swap') doSwap(s, beat.targets[0], beat.targets[1]);
  if (typeof beat.logAt === 'number') s.log.length = beat.logAt;
  beat.done = false;
  beat.targets = [];
}

function beatNeedsInput(beat) {
  return beat.input !== 'none' && beat.input !== 'self';
}

/* ---------- dying ---------- */

function kill(s, id, cause) {
  const p = byId(s, id);
  if (!p || !p.alive) return false;
  p.alive = false;
  p.diedRound = s.round;
  p.diedBy = cause;
  return true;
}

/* What the town is told about a body. */
function reveal(s, id) {
  const p = byId(s, id);
  if (!p) return { text: '', line: '', killer: false };
  const isKiller = p.role === 'killer';
  if (s.settings.reveal === 'team') {
    return { text: isKiller ? 'A KILLER' : 'NOT A KILLER', killer: isKiller };
  }
  return { text: ROLES[p.role].name.toUpperCase(), killer: isKiller };
}

/* ---------- voting ---------- */

function tallyVotes(s) {
  const counts = {};
  living(s).forEach((p) => { counts[p.id] = 0; });
  living(s).forEach((p) => {
    const t = s.votes[p.id];
    if (t && counts.hasOwnProperty(t)) counts[t]++;
  });
  return counts;
}

const votesIn = (s) => living(s).every((p) => !!s.votes[p.id]);

const MAX_REVOTES = 2;

/* Most votes goes. A tie sends it round again, twice, then the day is wasted. */
function voteResult(s) {
  const counts = tallyVotes(s);
  let max = 0;
  Object.keys(counts).forEach((id) => { if (counts[id] > max) max = counts[id]; });
  if (!max) return { id: null, counts: counts, tied: false };
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  return top.length > 1
    ? { id: null, counts: counts, tied: true }
    : { id: top[0], counts: counts, tied: false };
}

/* ---------- endings ---------- */

/* Checked after every death, in this order:
     the tanner dying trumps everything and ends it on the spot;
     no killers left and the town has it;
     killers equalling everyone else and they cannot be outvoted again. */
function checkEnd(s) {
  const tanner = s.players.find((p) => p.role === 'tanner');
  if (tanner && !tanner.alive) return finish(s, 'tanner', 'The Tanner wins', 'win_tanner');

  const killers = livingWith(s, 'killer').length;
  if (!killers) return finish(s, 'town', 'The town wins', 'win_town');

  const others = living(s).length - killers;
  if (killers >= others) return finish(s, 'killers', 'The killers win', 'win_killers');

  return null;
}

function finish(s, team, headline, line) {
  return {
    team: team,
    headline: headline,
    line: line,
    winners: s.players.filter((p) => ROLES[p.role] && ROLES[p.role].team === team).map((p) => p.id),
  };
}

const teamName = (t) => ({ town: 'Town', killers: 'Killers', tanner: 'Tanner' }[t] || t);
