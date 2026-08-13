/* the killer tv — role definitions and night order.
   Inspired by one-night social deduction games. The Drunk has been cut.
   All narration text here is original to this project. */

const ROLES = {
  doppelganger: {
    name: 'Doppelgänger',
    team: 'unknown',
    max: 1,
    icon: '🎭',
    tint: '#b98cff',
    blurb: 'Copy another player\'s card and become that role, then act on it immediately.',
    order: 10,
  },
  werewolf: {
    name: 'Werewolf',
    team: 'wolves',
    max: 2,
    icon: '🐺',
    tint: '#ff3b30',
    blurb: 'Find your pack. If you are alone, peek at one centre card.',
    order: 20,
  },
  minion: {
    name: 'Minion',
    team: 'wolves',
    max: 1,
    icon: '👁',
    tint: '#ff7a45',
    blurb: 'You see the wolves. They do not see you. Die for them if you must.',
    order: 30,
  },
  mason: {
    name: 'Mason',
    team: 'village',
    max: 2,
    icon: '⛏',
    tint: '#4fc3f7',
    blurb: 'You know the other Mason. If you see none, the other Mason is in the centre.',
    order: 40,
  },
  seer: {
    name: 'Seer',
    team: 'village',
    max: 1,
    icon: '🔮',
    tint: '#7ee8c0',
    blurb: 'Look at one player\'s card, or two of the centre cards.',
    order: 50,
  },
  robber: {
    name: 'Robber',
    team: 'village',
    max: 1,
    icon: '🗝',
    tint: '#ffd166',
    blurb: 'Swap your card with another player\'s, then look at what you stole.',
    order: 60,
  },
  troublemaker: {
    name: 'Troublemaker',
    team: 'village',
    max: 1,
    icon: '🔀',
    tint: '#ff8fd0',
    blurb: 'Swap two other players\' cards without looking at either.',
    order: 70,
  },
  insomniac: {
    name: 'Insomniac',
    team: 'village',
    max: 1,
    icon: '☕',
    tint: '#a0e57c',
    blurb: 'At the end of the night, look at your own card to see what you became.',
    order: 80,
  },
  villager: {
    name: 'Villager',
    team: 'village',
    max: 3,
    icon: '🏠',
    tint: '#9aa7b8',
    blurb: 'No powers. No information. Just a mouth and a hunch.',
    order: 999,
  },
  tanner: {
    name: 'Tanner',
    team: 'tanner',
    max: 1,
    icon: '💀',
    tint: '#c9a227',
    blurb: 'You hate your life. You only win if the village kills you.',
    order: 999,
  },
  hunter: {
    name: 'Hunter',
    team: 'village',
    max: 1,
    icon: '🏹',
    tint: '#e0785a',
    blurb: 'If you die, whoever you pointed at dies with you.',
    order: 999,
  },
};

const ROLE_IDS = Object.keys(ROLES);

/* Night script. `key` is the role that must be in the deck (centre counts too —
   silence is information, so every card in the game gets called). */
const NIGHT_SCRIPT = [
  {
    id: 'doppelganger',
    key: 'doppelganger',
    wake: 'Doppelgänger, wake up. Look at another player\'s card. You are that role now — act on it.',
    sleep: 'Doppelgänger, close your eyes.',
    seconds: 20,
  },
  {
    id: 'werewolf',
    key: 'werewolf',
    wake: 'Werewolves, wake up and look for each other. If you are alone, take one card from the centre.',
    sleep: 'Werewolves, close your eyes.',
    seconds: 12,
  },
  {
    id: 'minion',
    key: 'minion',
    wake: 'Minion, wake up. Werewolves, thumbs up so your servant can see you.',
    sleep: 'Werewolves, thumbs down. Minion, close your eyes.',
    seconds: 10,
  },
  {
    id: 'mason',
    key: 'mason',
    wake: 'Masons, wake up and look for one another.',
    sleep: 'Masons, close your eyes.',
    seconds: 8,
  },
  {
    id: 'seer',
    key: 'seer',
    wake: 'Seer, wake up. Look at one player\'s card, or two cards from the centre.',
    sleep: 'Seer, close your eyes.',
    seconds: 16,
  },
  {
    id: 'robber',
    key: 'robber',
    wake: 'Robber, wake up. Trade your card with another player\'s, then look at your new one.',
    sleep: 'Robber, close your eyes.',
    seconds: 16,
  },
  {
    id: 'troublemaker',
    key: 'troublemaker',
    wake: 'Troublemaker, wake up. Swap two other players\' cards. Do not look at them.',
    sleep: 'Troublemaker, close your eyes.',
    seconds: 16,
  },
  {
    id: 'insomniac',
    key: 'insomniac',
    wake: 'Insomniac, wake up and look at your own card.',
    sleep: 'Insomniac, close your eyes.',
    seconds: 8,
  },
  {
    id: 'doppelganger2',
    key: 'doppelganger',
    label: 'Doppelgänger · encore',
    wake: 'Doppelgänger — if you became the Insomniac, look at your card now.',
    sleep: 'Doppelgänger, close your eyes.',
    seconds: 8,
  },
];

/* Suggested decks. Each deck is playerCount + 3 cards. */
const PRESETS = {
  3: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager'],
  4: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  5: ['werewolf', 'werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
  6: ['werewolf', 'werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'insomniac', 'villager', 'villager'],
  7: ['werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'villager'],
  8: ['doppelganger', 'werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'tanner'],
  9: ['doppelganger', 'werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'tanner', 'hunter'],
  10: ['doppelganger', 'werewolf', 'werewolf', 'minion', 'mason', 'mason', 'seer', 'robber', 'troublemaker', 'insomniac', 'tanner', 'hunter', 'villager'],
};

function deckCounts(deck) {
  const counts = {};
  deck.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  return counts;
}

function deckHas(deck, roleId) {
  return deck.indexOf(roleId) !== -1;
}

/* Phases the narrator will actually run, given a deck. */
function buildNightPhases(deck) {
  return NIGHT_SCRIPT.filter((step) => deckHas(deck, step.key));
}
