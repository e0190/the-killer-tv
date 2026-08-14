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

  /* ---- the tutorial: how to play, before any of the atmosphere ---- */
  tut_killer:  'Somebody at this table is the Killer.',
  tut_secret:  'Only you know what you are. Keep it that way.',
  tut_night:   'When the television says so, everybody closes their eyes.',
  tut_called:  'Roles are called one at a time. Wake only on yours.',
  tut_choice:  'The Killer is called last, and picks somebody.',
  tut_morning: 'By morning that person is dead, and you all find out.',
  tut_day:     'Then you argue about who did it.',
  tut_vote:    'Then everybody points at once. Most votes hangs.',
  tut_win:     'Hang the Killer and the town lives. Otherwise it does not.',
  tut_remote:  'Whoever holds the remote sees everything. Never look at it.',

  /* ---- the prologue: a locked-room problem with only one answer ---- */
  opening_doors:  'Nobody in this town locks their doors. Never had to.',
  opening_ellis:  'Ellis Kane didn\'t come in from the yard on Tuesday.',
  opening_found:  'They found him Thursday. Some of him.',
  opening_more:   'Then Sarah Vance. Then the Pryor boy.',
  opening_inside: 'Every one of them died inside their own house.',
  opening_bolted: 'And every door was still bolted from the inside.',
  opening_forced: 'No broken window. No forced lock. Nothing.',
  opening_opened: 'Which means they opened the door themselves.',
  opening_smiled: 'They knew the face on the step. They smiled at it.',
  opening_left:   'There is nobody left in this town but you.',
  opening_tonight:'One of you does it again tonight. Close your eyes.',

  /* ---- the night ---- */
  night_first: 'Lights out. Everybody close your eyes.',
  night_again: 'Another night. Close your eyes.',
  sleep:       'Close your eyes.',

  /* ---- calls: every night ----
     The roles used to get a line of atmosphere before the instruction. It read
     nicely once and then got in the way every night after, so the night is now
     instruction only. The story lives entirely in the prologue. */
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

/* The prologue and the first-night atmosphere are the story. Everything else —
   role calls, the tutorial, verdicts, results — is the narrator telling people
   what to do. Some tables want the second half read out, some find it nannying
   once they know the game, so the two are separable. */
function isStoryLine(id) {
  return /^opening_/.test(id);
}
