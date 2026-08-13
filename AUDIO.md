# The narration pack

The narrator reads the whole game aloud. There are **62 lines**, and that is the
complete and final list. Two rules keep it that way:

**Every line is short.** Average six words, longest eleven. Nobody at a party
wants to sit through a paragraph, so the story is told across many small beats
instead of a few long ones.

**No player names, ever.** That is what keeps the pack finite. When somebody dies
the voice says "there is a body in the square" and the TV puts the name on screen
in letters a foot high. Do these once, never again.

## The easy way: drop them into the setup page

You don't have to touch the repo at all.

1. Generate or record the 62 files. Name each one after its line id —
   `opening_road.mp3`, `call_killer.mp3`, and so on, exactly as listed below.
2. Open the site. There's a banner at the top of the setup page.
3. Hit **install them**, then drag all 62 files onto the drop zone in one go.

They're matched by filename, stored in this browser, and they stay there — you
only do it once per machine. The TV window reads the same store, so both halves
get them. Messy filenames are tolerated: `03 Call_Killer.MP3` still lands on
`call_killer`.

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

Needs `GOOGLE_TTS_KEY`. Writes all 62 MP3s into `/audio`, skips any that already
exist, rewrites the manifest. Flags: `--force`, `--voice`, `--rate`, `--pitch`,
`--only a,b,c`.

## Direction, if you're recording or prompting these

Deep, unhurried, quiet — somebody telling you something grim they've told a
hundred times before. Not a whisper, not a shout, no relish. British. Leave about
half a second of silence at the top and tail of every file so the cuts don't clip.

Resist the urge to perform them. They're short on purpose; let them land flat.

## The lines

### The prologue — eleven short beats before the first night

| file | what it says |
| --- | --- |
| `opening_road.mp3` | One road in. It closes when the snow does. |
| `opening_shut.mp3` | It has been shut for nine days. |
| `opening_dog.mp3` | First it was a dog. Then the whole Aldritch herd. |
| `opening_lamps.mp3` | Three nights of men sitting up with lamps. They saw nothing. |
| `opening_marta.mp3` | Then it was Marta, at the well. |
| `opening_quiet.mp3` | Forty feet from her own door, and nobody heard her. |
| `opening_tracks.mp3` | Tracks went down to the well. None came back. |
| `opening_inside.mp3` | So it never left. It is in this room. |
| `opening_rules.mp3` | Every night you close your eyes. Every morning you count. |
| `opening_rope.mp3` | Then you hang one of your own, and hope. |
| `opening_tonight.mp3` | Nobody is coming. Close your eyes. |

### Nightfall

| file | what it says |
| --- | --- |
| `night_first.mp3` | Lights out. Everybody close your eyes. |
| `night_again.mp3` | Another night. Close your eyes. |
| `sleep.mp3` | Close your eyes. |

### Atmosphere — first night only

| file | what it says |
| --- | --- |
| `story_doppelganger.mp3` | Something learns the shape of a face. |
| `story_minion.mp3` | Somebody is watching, and taking notes. |
| `story_mason.mp3` | Two people meet in the dark. They already trust each other. |
| `story_seer.mp3` | A candle. One name. A long look. |
| `story_robber.mp3` | A door opens that was locked. |
| `story_troublemaker.mp3` | Two coats change pegs. Nobody is told. |
| `story_insomniac.mp3` | One window never goes dark. |
| `story_killer.mp3` | Somebody in this room stops pretending. |

### Calls — every night

| file | what it says |
| --- | --- |
| `call_doppelganger.mp3` | Doppelgänger, wake. Point at someone. You are them now. |
| `call_minion.mp3` | Minion, wake. Killer, show yourself. |
| `call_mason.mp3` | Masons, wake. Find each other. |
| `call_seer.mp3` | Seer, wake. Point at one person. |
| `call_robber.mp3` | Robber, wake. Point at someone. Take what they are. |
| `call_troublemaker.mp3` | Troublemaker, wake. Swap two people. |
| `call_insomniac.mp3` | Insomniac, wake. Look at what you are. |
| `call_killer.mp3` | Killer, wake. Choose who dies tonight. |

### The Doppelgänger’s rules — said straight after its call

| file | what it says |
| --- | --- |
| `dg_act.mp3` | If that role is called tonight, act on it. |
| `dg_keep.mp3` | You are that role from now on. |

### Morning

| file | what it says |
| --- | --- |
| `dawn.mp3` | Open your eyes. |
| `dawn_body.mp3` | There is a body in the square. |
| `dawn_quiet.mp3` | Everybody is still breathing. For now. |

### What the body turns out to be

| file | what it says |
| --- | --- |
| `reveal_guilty.mp3` | You got the Killer. |
| `reveal_innocent.mp3` | Not the Killer. You got that wrong. |
| `reveal_killer.mp3` | This one was the Killer. |
| `reveal_minion.mp3` | This one was the Minion. |
| `reveal_mason.mp3` | This one was a Mason. |
| `reveal_seer.mp3` | This one was the Seer. |
| `reveal_robber.mp3` | This one was the Robber. |
| `reveal_troublemaker.mp3` | This one was the Troublemaker. |
| `reveal_insomniac.mp3` | This one was the Insomniac. |
| `reveal_doppelganger.mp3` | This one was the Doppelgänger. |
| `reveal_hunter.mp3` | This one was the Hunter. |
| `reveal_tanner.mp3` | This one was the Tanner. That look is relief. |
| `reveal_villager.mp3` | This one was nobody. Just a villager. |

### Day and the vote

| file | what it says |
| --- | --- |
| `day.mp3` | Talk. Somebody here is lying. |
| `vote_call.mp3` | Hands up. Point at who hangs. |
| `vote_again.mp3` | No majority. Point again. |
| `vote_three.mp3` | Three. |
| `vote_two.mp3` | Two. |
| `vote_one.mp3` | One. |
| `vote_point.mp3` | Point. |
| `lynch_body.mp3` | The village has decided. |
| `lynch_none.mp3` | No agreement. Nobody hangs tonight. |

### The Hunter

| file | what it says |
| --- | --- |
| `hunter_dies.mp3` | The Hunter is armed. Choose. |
| `hunter_shot.mp3` | The shot goes off. |

### Endings

| file | what it says |
| --- | --- |
| `win_village.mp3` | The Killer is dead. It is over. |
| `win_killers.mp3` | There is nobody left to stop them. |
| `win_tanner.mp3` | The Tanner wanted this. The Tanner wins. |

