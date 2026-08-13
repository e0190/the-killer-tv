/* the killer tv — every word the narrator will ever say.
 *
 * This table is the whole audio pack. Each key is a filename; each value is the
 * script for it. Record or generate them once, drop them in, and the TV plays
 * files instead of using the browser's robot voice.
 *
 * Two rules held this list together:
 *
 *   Keep it short. Nobody at a party wants to sit through a paragraph. Almost
 *   every line here is one sentence. The story is told across many small beats
 *   instead of a few long ones, so the table can hear it and get on with it.
 *
 *   No player names, ever. That is what keeps the pack finite and fixed. When
 *   somebody dies the voice says "there is a body" and the TV puts the name on
 *   screen in letters a foot high.
 *
 * Anything missing falls back to a generated or browser voice, so a
 * half-finished pack still plays fine.
 */

const LINES = {

  /* ---- the prologue: a story, one short beat at a time ---- */
  opening_road:    'One road in. It closes when the snow does.',
  opening_shut:    'It has been shut for nine days.',
  opening_dog:     'First it was a dog. Then the whole Aldritch herd.',
  opening_lamps:   'Three nights of men sitting up with lamps. They saw nothing.',
  opening_marta:   'Then it was Marta, at the well.',
  opening_quiet:   'Forty feet from her own door, and nobody heard her.',
  opening_tracks:  'Tracks went down to the well. None came back.',
  opening_inside:  'So it never left. It is in this room.',
  opening_rules:   'Every night you close your eyes. Every morning you count.',
  opening_rope:    'Then you hang one of your own, and hope.',
  opening_tonight: 'Nobody is coming. Close your eyes.',

  /* ---- the night ---- */
  night_first: 'Lights out. Everybody close your eyes.',
  night_again: 'Another night. Close your eyes.',
  sleep:       'Close your eyes.',

  /* ---- atmosphere: first night only ---- */
  story_doppelganger: 'Something learns the shape of a face.',
  story_minion:       'Somebody is watching, and taking notes.',
  story_mason:        'Two people meet in the dark. They already trust each other.',
  story_seer:         'A candle. One name. A long look.',
  story_robber:       'A door opens that was locked.',
  story_troublemaker: 'Two coats change pegs. Nobody is told.',
  story_insomniac:    'One window never goes dark.',
  story_killer:       'Somebody in this room stops pretending.',

  /* ---- calls: every night ---- */
  call_doppelganger: 'Doppelgänger, wake. Point at someone. You are them now.',
  /* said straight after the call — the Doppelgänger only ever wakes once */
  dg_act:  'If that role is called tonight, act on it.',
  dg_keep: 'You are that role from now on.',
  call_minion:       'Minion, wake. Killer, show yourself.',
  call_mason:        'Masons, wake. Find each other.',
  call_seer:         'Seer, wake. Point at one person.',
  call_robber:       'Robber, wake. Point at someone. Take what they are.',
  call_troublemaker: 'Troublemaker, wake. Swap two people.',
  call_insomniac:    'Insomniac, wake. Look at what you are.',
  call_killer:       'Killer, wake. Choose who dies tonight.',

  /* ---- morning ---- */
  dawn:       'Open your eyes.',
  dawn_body:  'There is a body in the square.',
  dawn_quiet: 'Everybody is still breathing. For now.',

  /* ---- what the body turns out to be ---- */
  reveal_guilty:   'You got the Killer.',
  reveal_innocent: 'Not the Killer. You got that wrong.',

  reveal_killer:       'This one was the Killer.',
  reveal_minion:       'This one was the Minion.',
  reveal_mason:        'This one was a Mason.',
  reveal_seer:         'This one was the Seer.',
  reveal_robber:       'This one was the Robber.',
  reveal_troublemaker: 'This one was the Troublemaker.',
  reveal_insomniac:    'This one was the Insomniac.',
  reveal_doppelganger: 'This one was the Doppelgänger.',
  reveal_hunter:       'This one was the Hunter.',
  reveal_tanner:       'This one was the Tanner. That look is relief.',
  reveal_villager:     'This one was nobody. Just a villager.',

  /* ---- day ---- */
  day: 'Talk. Somebody here is lying.',

  /* ---- the vote ---- */
  vote_call:   'Hands up. Point at who hangs.',
  vote_again:  'No majority. Point again.',
  vote_three:  'Three.',
  vote_two:    'Two.',
  vote_one:    'One.',
  vote_point:  'Point.',
  lynch_body:  'The village has decided.',
  lynch_none:  'No agreement. Nobody hangs tonight.',

  /* ---- the hunter ---- */
  hunter_dies: 'The Hunter is armed. Choose.',
  hunter_shot: 'The shot goes off.',

  /* ---- endings ---- */
  win_village: 'The Killer is dead. It is over.',
  win_killers: 'There is nobody left to stop them.',
  win_tanner:  'The Tanner wanted this. The Tanner wins.',
};

const LINE_IDS = Object.keys(LINES);
