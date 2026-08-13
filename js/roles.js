/* the killer tv — the cast.

   This is no longer a one-night game. Play runs night → day → vote → night
   until the tanner dies, the wolves are wiped out, or the wolves have the
   village down to one last soul. Every role acts every night. */

const ROLES = {
  werewolf: {
    name: 'Werewolf', mark: 'W', team: 'wolves', max: 2, step: 1,
    short: 'Kills one villager each night.',
    long: 'Wakes with the pack and chooses who does not see morning.',
  },
  minion: {
    name: 'Minion', mark: 'M', team: 'wolves', max: 1, step: 1,
    short: 'Knows the wolves. Wins with them.',
    long: 'Sees the pack but is not one of them. Dies as a villager and wins as a wolf.',
  },
  mason: {
    name: 'Mason', mark: 'S', team: 'village', max: 2, step: 2,
    short: 'Knows the other Mason for certain.',
    long: 'Two builders who have seen each other\'s faces. Each is the other\'s only proof.',
  },
  seer: {
    name: 'Seer', mark: 'E', team: 'village', max: 1, step: 1,
    short: 'Inspects one player each night.',
    long: 'Learns whether one person is a wolf. Knowing is easy. Being believed is not.',
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
    short: 'Copies a role each night.',
    long: 'Becomes whoever they look at, every night, over and over.',
  },
  hunter: {
    name: 'Hunter', mark: 'H', team: 'village', max: 1, step: 1,
    short: 'Takes someone down when they die.',
    long: 'Dies with a loaded weapon and one last decision to make.',
  },
  tanner: {
    name: 'Tanner', mark: 'X', team: 'tanner', max: 1, step: 1,
    short: 'Wins by dying. Ends the game.',
    long: 'Wants out. If the tanner dies by any hand, the tanner wins and everyone else goes home empty.',
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
     kill  — the wolves' victim
     look  — one player, answer shown to the moderator only
     steal — one player, roles swap with the actor
     swap  — two players, their roles trade
     self  — no target; the moderator just signals the answer
*/
const NIGHT_ORDER = [
  {
    id: 'doppelganger', role: 'doppelganger', input: 'copy', scene: 'mask',
    story: 'Something without a face of its own presses against a window, learning the shape of whoever sleeps behind it.',
    call: 'Doppelgänger — open your eyes. Point at someone. You are what they are now.',
  },
  {
    id: 'minion', role: 'minion', input: 'none', scene: 'watcher',
    story: 'Someone loyal and entirely human watches from the treeline, taking notes, hoping to be useful enough to keep.',
    call: 'Minion — open your eyes. Wolves, show yourself to your servant.',
  },
  {
    id: 'mason', role: 'mason', input: 'none', scene: 'hands',
    story: 'Two builders meet in the dark where they always meet, and confirm what they already know about each other.',
    call: 'Masons — open your eyes and find one another.',
  },
  {
    id: 'seer', role: 'seer', input: 'look', scene: 'eye',
    story: 'A candle burns in an upstairs room. Someone is looking hard at one name on a very short list.',
    call: 'Seer — open your eyes. Choose one person. You will be told what they are.',
  },
  {
    id: 'robber', role: 'robber', input: 'steal', scene: 'key',
    story: 'A door opens that was locked. Something is taken. Something worse is left behind in its place.',
    call: 'Robber — open your eyes. Point at someone. Their role is yours now, and yours is theirs.',
  },
  {
    id: 'troublemaker', role: 'troublemaker', input: 'swap', scene: 'swap',
    story: 'Two coats are swapped on their pegs by someone who thinks the whole business is very funny.',
    call: 'Troublemaker — open your eyes. Point at two other people. They have traded places, and neither will be told.',
  },
  {
    id: 'insomniac', role: 'insomniac', input: 'self', scene: 'lamp',
    story: 'One window never goes dark. Whoever is behind it has stopped trying to sleep and started keeping track.',
    call: 'Insomniac — open your eyes. You will be shown what you have become.',
  },
];

const NIGHT_BY_ID = {};
NIGHT_ORDER.forEach((b) => { NIGHT_BY_ID[b.id] = b; });

/* Suggested casts, by head count. Every player holds exactly one role —
   there are no cards in the middle any more. */
const PRESETS = {
  4: ['werewolf', 'seer', 'villager', 'villager'],
  5: ['werewolf', 'seer', 'robber', 'villager', 'villager'],
  6: ['werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  7: ['werewolf', 'werewolf', 'seer', 'robber', 'insomniac', 'villager', 'villager'],
  8: ['werewolf', 'werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  9: ['werewolf', 'werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'villager'],
  10: ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'hunter', 'tanner'],
  11: ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'hunter', 'tanner'],
  12: ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'doppelganger', 'hunter', 'tanner'],
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
  if (!counts.werewolf) problems.push('There are no werewolves. Nobody can lose.');
  if (list.some((r) => !r)) problems.push('Somebody has not been given a role yet.');
  const wolves = counts.werewolf || 0;
  if (wolves && list.length - wolves <= 1) problems.push('The wolves already outnumber the village. Add more villagers.');
  return problems;
}
