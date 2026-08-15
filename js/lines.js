/* the killer tv — everything the narrator can say. Twenty lines.
 *
 * Kept deliberately small. The only lines that genuinely have to be spoken are
 * the night calls, because at that point everyone's eyes are shut and the screen
 * is useless to them. Everything else is spoken only because it's nice to have,
 * and every category can be switched off in settings if you'd rather say it.
 *
 * No player names appear anywhere, which is what stops this list ever growing:
 * the voice says "somebody is dead" and the TV puts the name up in huge type.
 *
 * `cat` groups lines so the settings switches can silence them by category.
 */

const LINES = {
  /* night — the ones that actually matter */
  eyes_shut:         { cat: 'night', text: 'Everyone, close your eyes.' },
  eyes_open:         { cat: 'night', text: 'Everyone, open your eyes.' },
  sleep:             { cat: 'night', text: 'Close your eyes.' },

  call_doppelganger: { cat: 'night', text: 'Doppelgänger, open your eyes. Point at someone. You are that role now.' },
  call_minion:       { cat: 'night', text: 'Minion, open your eyes. Killer, raise a hand so your minion can see you.' },
  call_mason:        { cat: 'night', text: 'Masons, open your eyes and find each other.' },
  call_seer:         { cat: 'night', text: 'Seer, open your eyes. Point at one person.' },
  call_robber:       { cat: 'night', text: 'Robber, open your eyes. Point at someone. You take their role, they take yours.' },
  call_troublemaker: { cat: 'night', text: 'Troublemaker, open your eyes. Point at two other people. Their roles swap.' },
  call_insomniac:    { cat: 'night', text: 'Insomniac, open your eyes and see what you are now.' },
  call_killer:       { cat: 'night', text: 'Killers, open your eyes. Choose who dies tonight.' },

  /* morning */
  died:              { cat: 'deaths', text: 'Somebody did not make it through the night.' },
  survived:          { cat: 'deaths', text: 'Everyone is still here. For now.' },
  hanged:            { cat: 'deaths', text: 'The town has decided.' },
  no_majority:       { cat: 'deaths', text: 'No majority. Nobody goes.' },

  /* day */
  talk:              { cat: 'day', text: 'Talk it out. One of you is lying.' },
  vote:              { cat: 'day', text: 'Time to vote. Point at who you want gone.' },

  /* endings */
  win_town:          { cat: 'endings', text: 'The killers are dead. The town survives.' },
  win_killers:       { cat: 'endings', text: 'There is nobody left to stop them.' },
  win_tanner:        { cat: 'endings', text: 'The Tanner got exactly what they wanted.' },
};

const LINE_IDS = Object.keys(LINES);

const SAY_CATEGORIES = [
  { id: 'night',   label: 'Role calls',   hint: 'The only ones that need saying with eyes shut.' },
  { id: 'deaths',  label: 'Deaths',       hint: 'Who died, and who was voted out.' },
  { id: 'day',     label: 'Day prompts',  hint: 'Start talking, start voting.' },
  { id: 'endings', label: 'The ending',   hint: 'Who won.' },
];

const lineText = (id) => (LINES[id] ? LINES[id].text : '');
const lineCat = (id) => (LINES[id] ? LINES[id].cat : '');

/* Shown on screen and never spoken. Keeping these out of the narrator is what
   holds the audio pack at twenty lines. Both are switched off in settings. */

const RULES = [
  {
    title: 'One of you is the Killer',
    body: 'Everyone gets a secret role. Most of you are ordinary townsfolk. One or two are killers, and they know each other.',
  },
  {
    title: 'At night, roles wake up',
    body: 'Everyone shuts their eyes. The TV calls each role in turn — open your eyes only when yours is called. The killers go last and choose someone.',
  },
  {
    title: 'By day, you argue and vote',
    body: 'You find out who died. Then you talk, accuse, and everyone points at once. Whoever gets the most votes is out, and their role is revealed.',
  },
  {
    title: 'How it ends',
    body: 'The town wins by voting out every killer. The killers win once they equal the number of everyone else left.',
  },
];

const STORY = [
  { title: 'Nobody here locks their doors', body: 'They never had to. One road in, and it closes when the snow does.' },
  { title: 'Three people are dead', body: 'All of them indoors. Every door still bolted from the inside, no window forced.' },
  { title: 'So they opened it themselves', body: 'They knew the face on the step. They smiled at it.' },
  { title: 'And it is still here', body: 'There is nobody left in this town but the people at this table.' },
];
