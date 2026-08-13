/* the killer tv — game state + the rulebook.
   The admin window owns this object outright; the TV only ever renders a copy. */

const STAGES = ['setup', 'deal', 'night', 'day', 'vote', 'tally', 'kill', 'reveal', 'result'];

function newGame() {
  return {
    v: 1,
    stage: 'setup',
    players: [],
    deck: [],
    nightPhases: [],
    phaseIndex: -1,
    timer: { total: 0, remaining: 0, endsAt: 0, running: false },
    votes: {},            // playerId -> playerId they pointed at
    finalRoles: {},       // playerId -> role id on their card at the end
    dgCopy: {},           // playerId -> role a Doppelgänger became
    centreRoles: ['', '', ''],
    deaths: [],
    result: null,
    settings: {
      dayMs: 5 * 60 * 1000,
      nightScale: 1,      // multiplier on each phase's seconds
      narration: true,
      sfx: true,
      voiceName: '',      // '' = auto, 'cloud', or an exact browser voice name
      autoAdvance: true,
      showDeck: true,
    },
    round: 1,
  };
}

/* ---------- timers ---------- */

function fmtClock(ms) {
  if (ms < 0) ms = 0;
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function timerRemaining(timer) {
  if (!timer) return 0;
  if (!timer.running) return timer.remaining;
  return Math.max(0, timer.endsAt - Date.now());
}

/* ---------- deck helpers ---------- */

function requiredCards(playerCount) { return playerCount + 3; }

function deckIsLegal(deck, playerCount) {
  if (deck.length !== requiredCards(playerCount)) return false;
  const counts = deckCounts(deck);
  for (const id in counts) {
    if (!ROLES[id] || counts[id] > ROLES[id].max) return false;
  }
  return true;
}

/* ---------- the rulebook ---------- */

/* A Doppelgänger plays as whatever they copied. */
function effectiveRole(state, playerId) {
  const r = state.finalRoles[playerId];
  if (r === 'doppelganger' && state.dgCopy[playerId]) return state.dgCopy[playerId];
  return r;
}

function tallyVotes(state) {
  const counts = {};
  state.players.forEach((p) => { counts[p.id] = 0; });
  state.players.forEach((p) => {
    const target = state.votes[p.id];
    if (target && counts.hasOwnProperty(target)) counts[target]++;
  });
  return counts;
}

/* Most votes dies. Ties all die. If every single player takes exactly one
   vote, the mob can't agree and nobody dies. Then the Hunter takes someone
   down with them. */
function resolveDeaths(state) {
  const counts = tallyVotes(state);
  const voted = state.players.filter((p) => state.votes[p.id]);
  if (!voted.length) return [];

  const everyoneOne = state.players.every((p) => counts[p.id] === 1);
  if (everyoneOne) return [];

  let max = 0;
  state.players.forEach((p) => { if (counts[p.id] > max) max = counts[p.id]; });
  if (max === 0) return [];

  const dead = state.players.filter((p) => counts[p.id] === max).map((p) => p.id);

  const set = dead.slice();
  dead.forEach((id) => {
    if (effectiveRole(state, id) === 'hunter') {
      const target = state.votes[id];
      if (target && set.indexOf(target) === -1) set.push(target);
    }
  });
  return set;
}

function hunterVictims(state) {
  const out = [];
  state.deaths.forEach((id) => {
    if (effectiveRole(state, id) === 'hunter' && state.votes[id]) {
      out.push({ hunter: id, victim: state.votes[id] });
    }
  });
  return out;
}

/* Who won.
   - Nobody dies: the village only gets away with it if there were no wolves
     among the players to begin with.
   - Someone dies: the village wins if a wolf died (or, with no wolves in the
     game at all, if they at least caught the Minion).
   - The wolves win only if they all survive AND the Tanner didn't get killed.
   - The Tanner wins by dying, and takes the wolves' win away when they do. */
function judge(state) {
  const dead = state.deaths || [];
  const wolvesAmongPlayers = state.players.filter((p) => effectiveRole(state, p.id) === 'werewolf');
  const anyWolfInPlay = wolvesAmongPlayers.length > 0;
  const deadRoles = dead.map((id) => effectiveRole(state, id));
  const wolfDied = deadRoles.indexOf('werewolf') !== -1;
  const tannerDied = deadRoles.indexOf('tanner') !== -1;
  const minionDied = deadRoles.indexOf('minion') !== -1;

  const teams = [];
  let headline;

  if (!dead.length) {
    if (anyWolfInPlay) {
      teams.push('wolves');
      headline = 'THE WOLVES WALK FREE';
    } else {
      teams.push('village');
      headline = 'NO WOLVES. NO BLOOD. THE VILLAGE SURVIVES';
    }
  } else {
    if (tannerDied) teams.push('tanner');
    if (wolfDied) teams.push('village');
    else if (!anyWolfInPlay && minionDied) teams.push('village');
    if (anyWolfInPlay && !wolfDied && !tannerDied) teams.push('wolves');

    if (teams.length === 0) headline = 'EVERYBODY LOSES';
    else if (teams.length === 1 && teams[0] === 'tanner') headline = 'THE TANNER WINS ALONE';
    else if (teams.indexOf('village') !== -1 && teams.indexOf('tanner') !== -1) headline = 'THE VILLAGE WINS — AND SO DOES THE TANNER';
    else if (teams.indexOf('village') !== -1) headline = 'THE VILLAGE WINS';
    else headline = 'THE WOLVES WIN';
  }

  const winners = state.players.filter((p) => {
    const role = effectiveRole(state, p.id);
    const def = ROLES[role];
    if (!def) return false;
    return teams.indexOf(def.team) !== -1;
  }).map((p) => p.id);

  return { teams, headline, winners, wolfDied, tannerDied, anyWolfInPlay };
}

function teamLabel(team) {
  return { village: 'Village', wolves: 'Werewolves', tanner: 'Tanner', unknown: 'Doppelgänger' }[team] || team;
}
