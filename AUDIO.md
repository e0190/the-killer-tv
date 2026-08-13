# The narration pack

The narrator reads the whole game aloud. There are **55 lines**, and that is the
complete and final list — it never grows, because **no player names are ever
spoken**. When somebody dies the voice says "there is a body in the square" and
the TV puts the name on screen in letters a foot high. Do these once, never again.

## The easy way: drop them into the setup page

You don't have to touch the repo at all.

1. Generate or record the 55 files. Name each one after its line id — `opening.mp3`,
   `call_werewolf.mp3`, and so on, exactly as listed below.
2. Open the site. There's a banner at the top of the setup page.
3. Hit **install them**, then drag all 55 files onto the drop zone in one go.

They're matched by filename, stored in this browser, and they stay there — you
only do it once per machine. The TV window reads the same store, so both halves
get them. Messy filenames are tolerated: `03 Call_Werewolf.MP3` still lands on
`call_werewolf`.

Anything you skip falls back to the generated voice, then the browser voice, so a
half-finished pack plays fine. **copy the script** on that panel puts the whole
list on your clipboard as `filename<tab>text`, ready to paste into whatever you're
generating with.

## The other way: commit them

Put the MP3s in `/audio` in the repo and push. They deploy with the site and work
for everyone, not just your browser. Then run this so the app stops probing:

```bash
node tools/generate-audio.js --manifest-only
```

## Or have Google generate the lot

```bash
node tools/generate-audio.js
```

Needs `GOOGLE_TTS_KEY`. Writes all 55 MP3s into `/audio`, skips any that already
exist, rewrites the manifest. Flags: `--force`, `--voice`, `--rate`, `--pitch`,
`--only a,b,c`.

## Direction, if you're recording or prompting these

Deep, unhurried, quiet — a man telling you something grim he's told a hundred
times before. Not a whisper, not a shout, no relish. British. Leave about half a
second of silence at the top and tail of every file so the cuts don't clip.

## The lines

### Opening

| file | what it says |
| --- | --- |
| `opening.mp3` | This is a small place. Everyone here knows everyone, which is exactly the problem. Something has been getting in at night, and it is already sitting at the table. |

### Nightfall

| file | what it says |
| --- | --- |
| `night_first.mp3` | The lamps go out one street at a time. The first night begins. Everybody, close your eyes. |
| `night_again.mp3` | Another night. Whatever is left of you, close your eyes. |
| `sleep.mp3` | Close your eyes. |

### Role atmosphere — played the first night only

| file | what it says |
| --- | --- |
| `story_doppelganger.mp3` | Something without a face of its own presses against a window, learning the shape of whoever sleeps behind it. |
| `story_werewolf.mp3` | Out past the last fence the wolves step out of their skins and count the houses with the lights off. |
| `story_minion.mp3` | Someone loyal and entirely human watches from the treeline, taking notes, hoping to be useful enough to keep. |
| `story_mason.mp3` | Two builders meet in the dark where they always meet, and confirm what they already know about each other. |
| `story_seer.mp3` | A candle burns in an upstairs room. Someone is looking hard at one name on a very short list. |
| `story_robber.mp3` | A door opens that was locked. Something is taken. Something worse is left behind in its place. |
| `story_troublemaker.mp3` | Two coats are swapped on their pegs by someone who thinks the whole business is very funny. |
| `story_insomniac.mp3` | One window never goes dark. Whoever is behind it has stopped trying to sleep and started keeping track. |

### Role calls — played every night

| file | what it says |
| --- | --- |
| `call_doppelganger.mp3` | Doppelgänger — open your eyes. Point at someone. You are what they are now. |
| `call_werewolf.mp3` | Werewolves — open your eyes. Find each other. Then choose the one who will not see morning. |
| `call_minion.mp3` | Minion — open your eyes. Wolves, show yourself to your servant. |
| `call_mason.mp3` | Masons — open your eyes and find one another. |
| `call_seer.mp3` | Seer — open your eyes. Choose one person. You will be told what they are. |
| `call_robber.mp3` | Robber — open your eyes. Point at someone. Their role is yours now, and yours is theirs. |
| `call_troublemaker.mp3` | Troublemaker — open your eyes. Point at two other people. They have traded places, and neither will be told. |
| `call_insomniac.mp3` | Insomniac — open your eyes. You will be shown what you have become. |

### Morning

| file | what it says |
| --- | --- |
| `dawn.mp3` | That is the night done with. Everybody — open your eyes. |
| `dawn_body.mp3` | The village wakes up, counts itself, and comes up short. There is a body in the square. |
| `dawn_quiet.mp3` | The village wakes up and finds everyone still breathing. Nothing came for you. Nothing you noticed, anyway. |

### What the body turns out to be

| file | what it says |
| --- | --- |
| `reveal_wolf.mp3` | Pull back the collar, and there is fur underneath. This one was a werewolf. |
| `reveal_notwolf.mp3` | No fur. No claws. Whatever this was, it was not a wolf. You have killed one of your own. |
| `reveal_werewolf.mp3` | This one was a Werewolf. |
| `reveal_minion.mp3` | This one was the Minion. Human all the way through, and loyal to the wrong side. |
| `reveal_mason.mp3` | This one was a Mason. |
| `reveal_seer.mp3` | This one was the Seer. Whatever they knew, it goes in the ground with them. |
| `reveal_robber.mp3` | This one was the Robber, wearing a role that was never theirs. |
| `reveal_troublemaker.mp3` | This one was the Troublemaker. Somewhere out there, two people are still in the wrong lives. |
| `reveal_insomniac.mp3` | This one was the Insomniac, awake until the very last second. |
| `reveal_doppelganger.mp3` | This one was the Doppelgänger, and by the end even it had forgotten the original. |
| `reveal_hunter.mp3` | This one was the Hunter — and the Hunter does not go quietly. |
| `reveal_tanner.mp3` | This one was the Tanner. Look at the face. That is not fear. That is relief. |
| `reveal_villager.mp3` | This one was a Villager. No powers, no secrets, no reason at all. |

### Day and the vote

| file | what it says |
| --- | --- |
| `day.mp3` | The sun is up and there is a body to explain. Talk. Accuse. Lie if it helps. Before the light goes, this village will hang somebody. |
| `vote_call.mp3` | Enough talking. Hands up. On three, point at the one you want swinging. |
| `vote_again.mp3` | No majority. That is not good enough. Hands up — you will do this again until you agree. |
| `vote_three.mp3` | Three. |
| `vote_two.mp3` | Two. |
| `vote_one.mp3` | One. |
| `vote_point.mp3` | Point. |
| `lynch_body.mp3` | The village has decided, and the village is not interested in appeals. |
| `lynch_none.mp3` | No majority. The rope goes back on its hook and everybody walks home in the dark, together, watching each other. |

### The Hunter

| file | what it says |
| --- | --- |
| `hunter_dies.mp3` | The Hunter goes down with a loaded weapon and one shot left in it. Choose. You are taking someone with you. |
| `hunter_shot.mp3` | The shot goes off. Somebody else drops. |

### Endings

| file | what it says |
| --- | --- |
| `win_village.mp3` | The last wolf is dead. The village stands in the wreck of itself, counts the cost, and calls it winning. |
| `win_wolves.mp3` | There is nobody left to outvote them. The wolves stop pretending. This village is finished. |
| `win_tanner.mp3` | The Tanner got exactly what the Tanner wanted. The rest of you have been playing somebody else's game all along. |

