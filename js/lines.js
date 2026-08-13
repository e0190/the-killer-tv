/* the killer tv — every word the narrator will ever say.
 *
 * This table is the whole audio pack. Each key is a filename; each value is the
 * script for it. Record or generate them once, drop them in /audio, and the TV
 * plays files instead of using the browser's robot voice.
 *
 * No player names appear anywhere on purpose — that keeps the pack finite and
 * fixed forever. When someone dies the voice says "there is a body" and the TV
 * puts the name on screen in letters a foot high.
 *
 * Anything missing just falls back to the browser voice, so a half-finished
 * pack still plays fine.
 */

const LINES = {

  /* ---- opening ---- */
  opening:
    'This is a small place. Everyone here knows everyone, which is exactly the problem. ' +
    'Something has been getting in at night, and it is already sitting at the table.',

  /* ---- the night ---- */
  night_first:
    'The lamps go out one street at a time. The first night begins. Everybody, close your eyes.',
  night_again:
    'Another night. Whatever is left of you, close your eyes.',
  sleep:
    'Close your eyes.',

  /* ---- role atmosphere: played the first night only ---- */
  story_doppelganger:
    'Something without a face of its own presses against a window, learning the shape of whoever sleeps behind it.',
  story_werewolf:
    'Out past the last fence the wolves step out of their skins and count the houses with the lights off.',
  story_minion:
    'Someone loyal and entirely human watches from the treeline, taking notes, hoping to be useful enough to keep.',
  story_mason:
    'Two builders meet in the dark where they always meet, and confirm what they already know about each other.',
  story_seer:
    'A candle burns in an upstairs room. Someone is looking hard at one name on a very short list.',
  story_robber:
    'A door opens that was locked. Something is taken. Something worse is left behind in its place.',
  story_troublemaker:
    'Two coats are swapped on their pegs by someone who thinks the whole business is very funny.',
  story_insomniac:
    'One window never goes dark. Whoever is behind it has stopped trying to sleep and started keeping track.',

  /* ---- role calls: played every night ---- */
  call_doppelganger:
    'Doppelgänger — open your eyes. Point at someone. You are what they are now.',
  call_werewolf:
    'Werewolves — open your eyes. Find each other. Then choose the one who will not see morning.',
  call_minion:
    'Minion — open your eyes. Wolves, show yourself to your servant.',
  call_mason:
    'Masons — open your eyes and find one another.',
  call_seer:
    'Seer — open your eyes. Choose one person. You will be told what they are.',
  call_robber:
    'Robber — open your eyes. Point at someone. Their role is yours now, and yours is theirs.',
  call_troublemaker:
    'Troublemaker — open your eyes. Point at two other people. They have traded places, and neither will be told.',
  call_insomniac:
    'Insomniac — open your eyes. You will be shown what you have become.',

  /* ---- morning ---- */
  dawn:
    'That is the night done with. Everybody — open your eyes.',
  dawn_body:
    'The village wakes up, counts itself, and comes up short. There is a body in the square.',
  dawn_quiet:
    'The village wakes up and finds everyone still breathing. Nothing came for you. Nothing you noticed, anyway.',

  /* ---- what the dead turn out to be ---- */
  reveal_wolf:
    'Pull back the collar, and there is fur underneath. This one was a werewolf.',
  reveal_notwolf:
    'No fur. No claws. Whatever this was, it was not a wolf. You have killed one of your own.',
  reveal_werewolf: 'This one was a Werewolf.',
  reveal_minion: 'This one was the Minion. Human all the way through, and loyal to the wrong side.',
  reveal_mason: 'This one was a Mason.',
  reveal_seer: 'This one was the Seer. Whatever they knew, it goes in the ground with them.',
  reveal_robber: 'This one was the Robber, wearing a role that was never theirs.',
  reveal_troublemaker: 'This one was the Troublemaker. Somewhere out there, two people are still in the wrong lives.',
  reveal_insomniac: 'This one was the Insomniac, awake until the very last second.',
  reveal_doppelganger: 'This one was the Doppelgänger, and by the end even it had forgotten the original.',
  reveal_hunter: 'This one was the Hunter — and the Hunter does not go quietly.',
  reveal_tanner: 'This one was the Tanner. Look at the face. That is not fear. That is relief.',
  reveal_villager: 'This one was a Villager. No powers, no secrets, no reason at all.',

  /* ---- day ---- */
  day:
    'The sun is up and there is a body to explain. Talk. Accuse. Lie if it helps. ' +
    'Before the light goes, this village will hang somebody.',

  /* ---- the vote ---- */
  vote_call:
    'Enough talking. Hands up. On three, point at the one you want swinging.',
  vote_three: 'Three.',
  vote_two: 'Two.',
  vote_one: 'One.',
  vote_point: 'Point.',
  lynch_body:
    'The village has decided, and the village is not interested in appeals.',
  lynch_none:
    'No majority. The rope goes back on its hook and everybody walks home in the dark, together, watching each other.',

  /* ---- the hunter ---- */
  hunter_dies:
    'The Hunter goes down with a loaded weapon and one shot left in it. Choose. You are taking someone with you.',
  hunter_shot:
    'The shot goes off. Somebody else drops.',

  /* ---- endings ---- */
  win_village:
    'The last wolf is dead. The village stands in the wreck of itself, counts the cost, and calls it winning.',
  win_wolves:
    'There is nobody left to outvote them. The wolves stop pretending. This village is finished.',
  win_tanner:
    'The Tanner got exactly what the Tanner wanted. The rest of you have been playing somebody else\'s game all along.',
};

const LINE_IDS = Object.keys(LINES);
