/* the killer tv — the cast.

   This is no longer a one-night game. Play runs night → day → vote → night
   until the tanner dies, the killers are wiped out, or the killers have the
   village down to one last soul. Every role acts every night. */

const ROLES = {
  killer: {
    name: 'Killer', mark: 'K', team: 'killers', max: 2, step: 1,
    short: 'Kills one person every night.',
    long: 'Wakes last, when everything else has finished moving, and picks who does not see morning.',
  },
  minion: {
    name: 'Minion', mark: 'M', team: 'killers', max: 1, step: 1,
    short: 'Knows the Killer. Wins with them.',
    long: 'Sees who it is and says nothing. Dies like anyone else and wins like a Killer.',
  },
  mason: {
    name: 'Mason', mark: 'S', team: 'village', max: 2, step: 2,
    short: 'Knows the other Mason for certain.',
    long: 'Two builders who have seen each other\'s faces. Each is the other\'s only proof.',
  },
  seer: {
    name: 'Seer', mark: 'E', team: 'village', max: 1, step: 1,
    short: 'Learns what one person is each night.',
    long: 'Finds out exactly what somebody is. Knowing is easy. Being believed is not.',
  },
  robber: {
    name: 'Robber', mark: 'R', team: 'village', max: 1, step: 1,
    short: 'Steals a role each night.',
    long: 'Takes another player\'s role and leaves their own behind. Neither of them chose it.',
  },
  troublemaker: {
    name: 'Troublemaker', mark: 'T', team: 'village', max: 1, step: 1,
    short: 'Swaps two other players each night.',
    long: 'Trades two people\'s roles without looking. Nobody is told. Not even them.',
  },
  insomniac: {
    name: 'Insomniac', mark: 'I', team: 'village', max: 1, step: 1,
    short: 'Checks what they currently are.',
    long: 'Never sleeps, so always knows what they have become by morning.',
  },
  doppelganger: {
    name: 'Doppelgänger', mark: 'D', team: 'village', max: 1, step: 1,
    short: 'Becomes someone else on the first night.',
    long: 'Points at one person and takes their role. If that role is called later the same ' +
          'night, they act on it. The Doppelgänger is gone by morning — they are simply that role now.',
  },
  hunter: {
    name: 'Hunter', mark: 'H', team: 'village', max: 1, step: 1,
    short: 'Takes someone down when they die.',
    long: 'Dies with a loaded weapon and one last decision to make.',
  },
  tanner: {
    name: 'Tanner', mark: 'X', team: 'tanner', max: 1, step: 1,
    short: 'Wins by dying. Ends the game.',
    long: 'Wants out. Dies by any hand and wins alone, and everybody else goes home with nothing.',
  },
  villager: {
    name: 'Villager', mark: 'V', team: 'village', max: 4, step: 1,
    short: 'No power. Just a vote and an opinion.',
    long: 'Sleeps through everything and still has to decide who hangs.',
  },
};

const ROLE_IDS = Object.keys(ROLES);

/* The night, in order. Each beat runs only if a living player holds that role.
   `input` is what the moderator has to tell the app:
     kill  — the Killer's victim
     look  — one player, answer shown to the moderator only
     steal — one player, roles swap with the actor
     swap  — two players, their roles trade
     self  — no target; the moderator just signals the answer
*/
const NIGHT_ORDER = [
  {
    id: 'doppelganger', role: 'doppelganger', input: 'copy', scene: 'mask',
    story: 'Something learns the shape of a face.',
    call: 'Doppelgänger, wake. Point at someone. You are them now.',
  },
  {
    id: 'minion', role: 'minion', input: 'none', scene: 'watcher',
    story: 'Somebody is watching, and taking notes.',
    call: 'Minion, wake. Killer, show yourself.',
  },
  {
    id: 'mason', role: 'mason', input: 'none', scene: 'hands',
    story: 'Two people meet in the dark. They already trust each other.',
    call: 'Masons, wake. Find each other.',
  },
  {
    id: 'seer', role: 'seer', input: 'look', scene: 'eye',
    story: 'A candle. One name. A long look.',
    call: 'Seer, wake. Point at one person.',
  },
  {
    id: 'robber', role: 'robber', input: 'steal', scene: 'key',
    story: 'A door opens that was locked.',
    call: 'Robber, wake. Point at someone. Take what they are.',
  },
  {
    id: 'troublemaker', role: 'troublemaker', input: 'swap', scene: 'swap',
    story: 'Two coats change pegs. Nobody is told.',
    call: 'Troublemaker, wake. Swap two people.',
  },
  {
    id: 'insomniac', role: 'insomniac', input: 'self', scene: 'lamp',
    story: 'One window never goes dark.',
    call: 'Insomniac, wake. Look at what you are.',
  },
  /* The Killer goes last, deliberately. Nothing acts after them, so the
     victim's role is settled the moment it's chosen and the morning can't
     announce somebody else's card. The Minion still sees them earlier: a hand
     goes up without eyes opening. */
  {
    id: 'killer', role: 'killer', input: 'kill', scene: 'killer',
    story: 'Somebody in this room stops pretending.',
    call: 'Killer, wake. Choose who dies tonight.',
  },
];

const NIGHT_BY_ID = {};
NIGHT_ORDER.forEach((b) => { NIGHT_BY_ID[b.id] = b; });

/* The prologue. Tapped through one beat at a time before the first night, so
   the table gets the situation before anybody has to lie about it. */
const PROLOGUE = [
  { id: 'opening_road',    title: 'One road in',        scene: 'village' },
  { id: 'opening_shut',    title: 'Nine days',          scene: 'village' },
  { id: 'opening_dog',     title: 'First the animals',  scene: 'door' },
  { id: 'opening_lamps',   title: 'Three nights',       scene: 'door' },
  { id: 'opening_marta',   title: 'Then Marta',         scene: 'body' },
  { id: 'opening_quiet',   title: 'Nobody heard',       scene: 'body' },
  { id: 'opening_tracks',  title: 'The tracks',         scene: 'mask' },
  { id: 'opening_inside',  title: 'It never left',      scene: 'mask' },
  { id: 'opening_rules',   title: 'How this goes',      scene: 'vote' },
  { id: 'opening_rope',    title: 'And then the rope',  scene: 'vote' },
  { id: 'opening_tonight', title: 'Tonight',            scene: 'night' },
];

/* Suggested casts, by head count. Every player holds exactly one role —
   there are no cards in the middle any more. */
const PRESETS = {
  4: ['killer', 'seer', 'villager', 'villager'],
  5: ['killer', 'seer', 'robber', 'villager', 'villager'],
  6: ['killer', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  7: ['killer', 'killer', 'seer', 'robber', 'insomniac', 'villager', 'villager'],
  8: ['killer', 'killer', 'minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  9: ['killer', 'killer', 'minion', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'villager'],
  10: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'hunter', 'tanner'],
  11: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'tanner'],
  12: ['killer', 'killer', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'doppelganger', 'hunter', 'tanner'],
};

function roleCounts(list) {
  const c = {};
  list.forEach((r) => { if (r) c[r] = (c[r] || 0) + 1; });
  return c;
}

function castProblems(list) {
  const problems = [];
  const counts = roleCounts(list);
  Object.keys(counts).forEach((id) => {
    if (!ROLES[id]) return;
    if (counts[id] > ROLES[id].max) {
      problems.push('Too many ' + ROLES[id].name + 's — the most you can have is ' + ROLES[id].max + '.');
    }
  });
  if (counts.mason === 1) problems.push('Masons come in twos. One Mason alone has nobody to recognise.');
  if (!counts.killer) problems.push('There is no Killer. Nobody can lose.');
  if (list.some((r) => !r)) problems.push('Somebody has not been given a role yet.');
  const killers = counts.killer || 0;
  if (killers && list.length - killers <= 1) problems.push('The killers already outnumber everyone else. Add more villagers.');
  return problems;
}
