/* the killer tv — the cast and the running order. */

const ROLES = {
  killer:       { name: 'Killer',       team: 'killers', max: 2, pair: false },
  minion:       { name: 'Minion',       team: 'killers', max: 1, pair: false },
  mason:        { name: 'Mason',        team: 'town',    max: 2, pair: true  },
  seer:         { name: 'Seer',         team: 'town',    max: 1, pair: false },
  robber:       { name: 'Robber',       team: 'town',    max: 1, pair: false },
  troublemaker: { name: 'Troublemaker', team: 'town',    max: 1, pair: false },
  insomniac:    { name: 'Insomniac',    team: 'town',    max: 1, pair: false },
  doppelganger: { name: 'Doppelgänger', team: 'town',    max: 1, pair: false },
  hunter:       { name: 'Hunter',       team: 'town',    max: 1, pair: false },
  tanner:       { name: 'Tanner',       team: 'tanner',  max: 1, pair: false },
  villager:     { name: 'Villager',     team: 'town',    max: 4, pair: false },
};

/* One line each, shown on the setup sheet and on the help screen. */
const ROLE_BLURB = {
  killer:       'Picks someone to kill each night.',
  minion:       'Knows the Killer. Wins with them, but dies like anyone else.',
  mason:        'The two Masons know each other for certain. Always added as a pair.',
  seer:         'Learns exactly what one person is, each night.',
  robber:       'Swaps roles with someone. Neither of them chose it.',
  troublemaker: 'Swaps two other people\'s roles. Nobody is told.',
  insomniac:    'Is shown what they have become, after everything else has moved.',
  doppelganger: 'Copies someone on the first night and stays that role.',
  hunter:       'When they die, they take somebody with them.',
  tanner:       'Wins by dying, and ends the game on the spot.',
  villager:     'No power. A vote and an opinion.',
};

const ROLE_IDS = Object.keys(ROLES);

/* The night, in order. A beat only runs if somebody still alive holds the role.
   The Killer goes last on purpose: nothing acts after them, so the victim's role
   is settled the moment it is picked and the morning cannot announce the wrong
   thing. `input` is the only thing the moderator has to tell the app. */
const NIGHT = [
  { role: 'doppelganger', input: 'copy',  say: 'Doppelgänger, open your eyes. Point at someone. You are that role now.' },
  { role: 'minion',       input: 'none',  say: 'Minion, open your eyes. Killer, raise a hand so your minion can see you.' },
  { role: 'mason',        input: 'none',  say: 'Masons, open your eyes and find each other.' },
  { role: 'seer',         input: 'look',  say: 'Seer, open your eyes. Point at one person.' },
  { role: 'robber',       input: 'steal', say: 'Robber, open your eyes. Point at someone. You take their role, they take yours.' },
  { role: 'troublemaker', input: 'swap',  say: 'Troublemaker, open your eyes. Point at two other people. Their roles swap.' },
  { role: 'insomniac',    input: 'self',  say: 'Insomniac, open your eyes and see what you are now.' },
  { role: 'killer',       input: 'kill',  say: 'Killers, open your eyes. Choose who dies tonight.' },
];

/* Suggested line-ups. Every player holds exactly one role. */
const PRESETS = {
  4:  ['killer', 'seer', 'villager', 'villager'],
  5:  ['killer', 'seer', 'robber', 'villager', 'villager'],
  6:  ['killer', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  7:  ['killer', 'killer', 'seer', 'robber', 'insomniac', 'villager', 'villager'],
  8:  ['killer', 'killer', 'minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  9:  ['killer', 'killer', 'minion', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'villager'],
  10: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'hunter', 'tanner'],
  11: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'tanner'],
  12: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'doppelganger', 'hunter', 'tanner'],
};

function countRoles(list) {
  const out = {};
  list.forEach((r) => { if (r) out[r] = (out[r] || 0) + 1; });
  return out;
}

/* Problems worth blocking on, in the order a person would notice them. */
function castProblems(list) {
  const problems = [];
  const n = countRoles(list);

  if (list.some((r) => !r)) problems.push('Everyone needs a role.');
  Object.keys(n).forEach((id) => {
    if (ROLES[id] && n[id] > ROLES[id].max) {
      problems.push('At most ' + ROLES[id].max + ' × ' + ROLES[id].name + '.');
    }
  });
  if (n.mason === 1) problems.push('Masons come as a pair — add the second one.');
  if (!n.killer) problems.push('There is no Killer, so nobody can lose.');
  else if (list.length - n.killer <= 1) problems.push('The killers already outnumber everyone else.');

  return problems;
}
